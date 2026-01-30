const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// เชื่อมต่อ MongoDB
// หมายเหตุ: แทนที่ตรงนี้ด้วย URL จาก MongoDB Atlas ในไฟล์ .env
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vet_db';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Connection Error:', err));

// --- 1. เพิ่ม User Schema ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' }
});

const User = mongoose.model('User', userSchema);

// --- 2. Middleware ตรวจสอบ Token (Authentication) ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    next();
  });
};

// --- 3. Middleware ตรวจสอบ Role (Authorization) ---
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ใช้งานส่วนนี้" });
    }
    next();
  };
};

// --- 4. API Authentication ---

// Login (เปิดให้ทุกคนเข้าถึงเพื่อรับ Token)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "ไม่พบผู้ใช้งาน" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });

  const token = jwt.sign({ _id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secretkey');
  res.json({ token, role: user.role, username: user.username });
});

// Create User (เฉพาะ SuperAdmin เท่านั้น)
app.post('/api/users', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
  try {
    const { username, password, role } = req.body;
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: "สร้างผู้ใช้งานสำเร็จ" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//Setup Initial SuperAdmin (Uncomment เพื่อรันครั้งแรก แล้ว Comment กลับ)
app.get('/setup-admin', async (req, res) => {
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash("admin1234", salt);
const user = new User({ username: "superadmin", password: hashedPassword, role: "superadmin" });
await user.save();
res.send("SuperAdmin Created");
});

// 1. แก้ไข Schema ให้รองรับฟิลด์ medical (การรักษา)
const reportSchema = new mongoose.Schema({
  date: { type: String, required: true },
  activity: String,
  location: String,
  district: String,
  subdistrict: String,
  unit: String,
  lat: { type: Number, default: 0 },
  long: { type: Number, default: 0 },
  imageUrl: { type: String, default: "" }, 
  stats: {
    vaccine: { type: Number, default: 0 },
    sterilize: { type: Number, default: 0 },
    register: { type: Number, default: 0 },
    microchip: { type: Number, default: 0 },
    medical: { type: Number, default: 0 } // ✅ เพิ่มฟิลด์นี้รองรับยอดรวมการรักษา
  },
  details: { type: Object, default: {} }
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);

// 2. แก้ไข API ดึงข้อมูลให้เรียงลำดับตามวันที่ล่าสุด (สอดคล้องกับการ Export/Import)
app.get('/api/reports', async (req, res) => {
  try {
    // ✅ เพิ่ม .sort({ date: -1 }) เพื่อให้ข้อมูลที่ดึงไปแสดงผลเรียงจากใหม่ไปเก่า
    const reports = await Report.find().sort({ date: -1 }); 
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API สำหรับบันทึกข้อมูล
app.post('/api/reports', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const newReport = new Report(req.body);
    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const outbreakSchema = new mongoose.Schema({
  date: { type: String, required: true },
  location: String,
  district: String,
  lat: { type: Number, required: true },
  long: { type: Number, required: true },
}, { timestamps: true });

const Outbreak = mongoose.model('Outbreak', outbreakSchema);

// --- [เพิ่มใหม่] API สำหรับ Outbreak (โรคพิษสุนัขบ้า) ---
app.get('/api/outbreaks', async (req, res) => {
  try {
    const outbreaks = await Outbreak.find().sort({ date: -1 });
    res.json(outbreaks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/outbreaks', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const newOutbreak = new Outbreak(req.body);
    const savedOutbreak = await newOutbreak.save();
    res.status(201).json(savedOutbreak);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/outbreaks/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    // เก็บค่าที่ลบใส่ตัวแปรไว้เช็ค
    const deletedOutbreak = await Outbreak.findByIdAndDelete(req.params.id);
    
    // ถ้าหาไม่เจอ (เป็น null) ให้ส่ง 404 กลับไป
    if (!deletedOutbreak) {
      return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการลบ" });
    }

    res.json({ message: "ลบข้อมูลเรียบร้อย", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API สำหรับลบข้อมูลรายรายการ
app.delete('/api/reports/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const deletedReport = await Report.findByIdAndDelete(req.params.id);
    if (!deletedReport) {
      return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการลบ" });
    }
    res.json({ message: "ลบข้อมูลสำเร็จ", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API สำหรับแก้ไขข้อมูล (PUT) <-- เพิ่มส่วนนี้เข้าไป
app.put('/api/reports/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } // option นี้เพื่อให้ MongoDB ส่งข้อมูลก้อนใหม่ที่แก้แล้วกลับมา
    );

    if (!updatedReport) {
      return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
    }
    
    res.json(updatedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/reports', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
  try {
    // ลบทุก document ใน collection
    const result = await Report.deleteMany({});
    
    res.json({ 
      message: "ลบข้อมูลทั้งหมดเรียบร้อยแล้ว", 
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- [เพิ่มใหม่] API สำหรับ Backup & Restore ระบบ ---

// 1. API สำหรับ Backup (Admin และ SuperAdmin ทำได้)
app.get('/api/system/backup', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
    try {
        // ดึงข้อมูลทั้งหมดจาก Database
        const reports = await Report.find().sort({ date: -1 });
        const outbreaks = await Outbreak.find().sort({ date: -1 });

        // รวมข้อมูลเป็น Object เดียว
        const backupData = {
            metadata: {
                exportDate: new Date(),
                version: "1.0",
                exportedBy: req.user.username
            },
            reports: reports,
            outbreaks: outbreaks
        };

        // ส่งกลับไปให้ Frontend ดาวน์โหลด
        res.json(backupData);
    } catch (err) {
        console.error("Backup Error:", err);
        res.status(500).json({ message: "การสำรองข้อมูลล้มเหลว: " + err.message });
    }
});

// 2. API สำหรับ Restore (เฉพาะ SuperAdmin เท่านั้น!)
app.post('/api/system/restore', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { reports, outbreaks } = req.body;

        // ตรวจสอบความถูกต้องของไฟล์เบื้องต้น
        if (!Array.isArray(reports) || !Array.isArray(outbreaks)) {
            throw new Error("รูปแบบไฟล์ไม่ถูกต้อง (Invalid Format)");
        }

        // ⚠️ ล้างข้อมูลเก่าทั้งหมดก่อน (Reports)
        await Report.deleteMany({}, { session });
        
        // ⚠️ ล้างข้อมูลเก่าทั้งหมดก่อน (Outbreaks)
        await Outbreak.deleteMany({}, { session });

        // นำเข้าข้อมูลใหม่ (ถ้ามีข้อมูล)
        if (reports.length > 0) {
            // ลบ _id เดิมออกเพื่อให้ MongoDB สร้างใหม่ หรือจะใช้ _id เดิมก็ได้ถ้าต้องการ clone เป๊ะๆ
            // ในที่นี้เราจะใช้ข้อมูลเดิมทั้งหมดรวมถึง _id เพื่อให้ข้อมูลตรงกัน
            await Report.insertMany(reports, { session });
        }

        if (outbreaks.length > 0) {
            await Outbreak.insertMany(outbreaks, { session });
        }

        await session.commitTransaction();
        session.endSession();

        res.json({
            message: "กู้คืนข้อมูลสำเร็จ",
            reportCount: reports.length,
            outbreakCount: outbreaks.length
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error("Restore Error:", err);
        res.status(500).json({ message: "การกู้คืนข้อมูลล้มเหลว: " + err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));