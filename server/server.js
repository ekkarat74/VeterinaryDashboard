const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');               // ✅ เพิ่ม: ป้องกัน Header
const rateLimit = require('express-rate-limit');// ✅ เพิ่ม: ป้องกันยิงรัวๆ
const mongoSanitize = require('express-mongo-sanitize'); // ✅ เพิ่ม: ป้องกัน Hack Database
require('dotenv').config();

// 🚨 Check Critical Config
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env");
  process.exit(1); // ปิด Server ทันทีถ้าไม่มีรหัสลับ
}

const app = express();

// 🛡️ 1. Security Headers (Helmet)
app.use(helmet());

// 🛡️ 2. CORS Configuration (ถูกต้องแล้ว เยี่ยมมากครับ!)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://veterinary-dashboard-mu.vercel.app' // ✅ Domain ของจริง
];

app.use(cors({
  origin: function (origin, callback) {
    // อนุญาต request ที่ไม่มี origin (เช่น Postman/Mobile App) หรืออยู่ใน whitelist
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 🛡️ 3. Rate Limiting (ป้องกัน Brute Force / DDoS)
// จำกัด: 1 IP ยิงได้ 150 ครั้ง ใน 15 นาที
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 150, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: { message: "Too many requests, please try again later." }
});
app.use('/api/', limiter);

// 🛠️ 4. Standard Middleware
app.use(express.json({ limit: '10mb' }));

// 🛡️ 5. Data Sanitization (ป้องกัน NoSQL Injection)
// ต้องวางไว้หลัง express.json()
app.use(mongoSanitize());

// --- Database Connection ---
const mongoURI = process.env.MONGODB_URI; 
// ถ้าไม่มีใน .env ให้ Error เลยดีกว่าการใช้ค่า Default ที่อาจไม่ปลอดภัย
if (!mongoURI) {
    console.error("❌ MongoDB URI missing in .env");
    process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Connection Error:', err));

// --- Schemas ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' }
});
const User = mongoose.model('User', userSchema);

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
    medical: { type: Number, default: 0 }
  },
  details: { type: Object, default: {} }
}, { timestamps: true });
const Report = mongoose.model('Report', reportSchema);

const outbreakSchema = new mongoose.Schema({
  date: { type: String, required: true },
  location: String,
  district: String,
  lat: { type: Number, required: true },
  long: { type: Number, required: true },
}, { timestamps: true });
const Outbreak = mongoose.model('Outbreak', outbreakSchema);

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  // ✅ แก้ไข: ใช้ process.env.JWT_SECRET เท่านั้น (ห้ามมี || 'secretkey')
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ใช้งานส่วนนี้" });
    }
    next();
  };
};

// --- Routes ---

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "ไม่พบผู้ใช้งาน" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    // ✅ แก้ไข: ใช้ JWT_SECRET จาก .env เท่านั้น
    const token = jwt.sign(
        { _id: user._id, username: user.username, role: user.role }, 
        process.env.JWT_SECRET,
        { expiresIn: '1d' } // แนะนำ: ควรมีวันหมดอายุ Token (เช่น 1 วัน)
    );
    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Setup SuperAdmin (ใช้เสร็จควร Comment ปิดไว้)
app.get('/setup-admin', async (req, res) => {
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash("admin1234", salt);
    // const user = new User({ username: "superadmin", password: hashedPassword, role: "superadmin" });
    // await user.save();
    res.send("SuperAdmin Setup Disabled (Secure Mode)");
});

// --- Reports API ---
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ date: -1 }); 
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/reports', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const newReport = new Report(req.body);
    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/reports/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const updatedReport = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedReport) return res.status(404).json({ message: "ไม่พบข้อมูล" });
    res.json(updatedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/reports/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const deletedReport = await Report.findByIdAndDelete(req.params.id);
    if (!deletedReport) return res.status(404).json({ message: "ไม่พบข้อมูล" });
    res.json({ message: "ลบข้อมูลสำเร็จ", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete All Reports (Password Protected)
app.delete('/api/reports', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "กรุณาระบุรหัสผ่าน" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    const result = await Report.deleteMany({});
    res.json({ message: "ลบข้อมูลทั้งหมดเรียบร้อยแล้ว", deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Outbreaks API ---
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
    const deletedOutbreak = await Outbreak.findByIdAndDelete(req.params.id);
    if (!deletedOutbreak) return res.status(404).json({ message: "ไม่พบข้อมูล" });
    res.json({ message: "ลบข้อมูลเรียบร้อย", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- User Management API ---
app.get('/api/users', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ _id: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/users', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: "สร้างผู้ใช้งานสำเร็จ" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/users/:id/role', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
  try {
    const { role } = req.body;
    if (req.user._id === req.params.id) return res.status(400).json({ message: "ไม่สามารถเปลี่ยนสิทธิ์ตัวเองได้" });
    
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!updatedUser) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/users/:id', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
  try {
    if (req.user._id === req.params.id) return res.status(400).json({ message: "ไม่สามารถลบบัญชีตัวเองได้" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "ลบผู้ใช้งานเรียบร้อย" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- System API (Backup/Restore) ---
app.get('/api/system/backup', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
    try {
        const reports = await Report.find().sort({ date: -1 });
        const outbreaks = await Outbreak.find().sort({ date: -1 });
        const backupData = {
            metadata: { exportDate: new Date(), version: "1.0", exportedBy: req.user.username },
            reports, outbreaks
        };
        res.json(backupData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/system/restore', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { reports, outbreaks } = req.body;
        if (!Array.isArray(reports) || !Array.isArray(outbreaks)) throw new Error("Invalid Format");

        await Report.deleteMany({}, { session });
        await Outbreak.deleteMany({}, { session });

        if (reports.length > 0) await Report.insertMany(reports, { session });
        if (outbreaks.length > 0) await Outbreak.insertMany(outbreaks, { session });

        await session.commitTransaction();
        session.endSession();
        res.json({ message: "กู้คืนข้อมูลสำเร็จ", reportCount: reports.length, outbreakCount: outbreaks.length });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: "Restore Failed: " + err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
