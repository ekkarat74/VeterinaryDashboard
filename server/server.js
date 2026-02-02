const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http'); // 1. เพิ่ม http
const { Server } = require("socket.io"); // 2. เพิ่ม socket.io
require('dotenv').config();

const app = express();

// --- 1. CONFIGURATION ---
const server = http.createServer(app); // 3. สร้าง server ครอบ app
const io = new Server(server, {
    cors: {
        origin: '*', // หรือระบุ domain ของ frontend
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// เพิ่ม Limit เพื่อรองรับการส่งรูปภาพ Base64 ขนาดใหญ่
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vet_db';
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// --- 2. DATABASE CONNECTION ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Connection Error:', err));

// --- 3. SCHEMAS & MODELS ---

// 3.1 User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' },
  // [เพิ่ม] สถานะบัญชี
  status: { type: String, enum: ['active', 'suspended'], default: 'active' }, 
  lastLogin: { type: Date } // [เพิ่ม] เก็บเวลาล็อกอินล่าสุด (Optional)
});
const User = mongoose.model('User', userSchema);

// 3.2 Report Schema (ข้อมูลปฏิบัติงาน)
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
  details: { type: Object, default: {} },
  // [เพิ่ม] เก็บชื่อผู้สร้างและผู้แก้ไข
  createdBy: { type: String, default: 'System' },
  updatedBy: { type: String }
}, { timestamps: true });
const Report = mongoose.model('Report', reportSchema);

// 3.3 Outbreak Schema (แจ้งโรคระบาด)
const outbreakSchema = new mongoose.Schema({
  date: { type: String, required: true },
  location: String,
  district: String,
  lat: { type: Number, required: true },
  long: { type: Number, required: true },
}, { timestamps: true });
const Outbreak = mongoose.model('Outbreak', outbreakSchema);

// --- 4. MIDDLEWARES ---

// ตรวจสอบ Token (Authentication)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    next();
  });
};

// ตรวจสอบ Role (Authorization)
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ใช้งานส่วนนี้" });
    }
    next();
  };
};

// --- 5. ROUTES ---

// =======================
// A. AUTHENTICATION
// =======================

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "ไม่พบผู้ใช้งาน" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });

  const token = jwt.sign({ _id: user._id, username: user.username, role: user.role }, JWT_SECRET);
  res.json({ token, role: user.role, username: user.username });
});

// Setup Initial Admin (รันครั้งเดียวแล้วควร Comment ออก)
/*app.get('/setup-admin', async (req, res) => {
    try {
        const exists = await User.findOne({ username: "superadmin" });
        if(exists) return res.send("SuperAdmin already exists.");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("admin1234", salt);
        const user = new User({ username: "superadmin", password: hashedPassword, role: "superadmin" });
        await user.save();
        res.send("✅ SuperAdmin Created: username=superadmin, password=admin1234");
    } catch (err) {
        res.status(500).send(err.message);
    }
});*/

// =======================
// B. USER MANAGEMENT
// =======================

// Create User (SuperAdmin Only)
app.post('/api/users', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // status จะเป็น active โดย default
        const newUser = new User({ username, password: hashedPassword, role }); 
        await newUser.save();
        res.status(201).json({ message: "สร้างผู้ใช้งานสำเร็จ" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get All Users (SuperAdmin Only)
app.get('/api/users', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ _id: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/users/:id', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
    try {
        const { username, role, status } = req.body;
        
        // ป้องกันการระงับบัญชีตัวเอง
        if (req.user._id === req.params.id && status === 'suspended') {
             return res.status(400).json({ message: "ไม่สามารถระงับบัญชีตัวเองได้" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { username, role, status }, 
            { new: true }
        ).select('-password');

        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/users/:id/reset-password', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ message: "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
        res.json({ message: "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update User Role (SuperAdmin Only)
app.put('/api/users/:id/role', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
  try {
    const { role } = req.body;
    // ป้องกันตัวเองเปลี่ยนสิทธิ์ตัวเองแล้วเข้าไม่ได้
    if (req.user._id === req.params.id) {
        return res.status(400).json({ message: "ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้ในหน้านี้" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { role }, 
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete User (SuperAdmin Only)
app.delete('/api/users/:id', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
    try {
      if (req.user._id === req.params.id) {
          return res.status(400).json({ message: "ไม่สามารถลบบัญชีตัวเองได้" });
      }
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: "ลบผู้ใช้งานเรียบร้อย" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
});

app.post('/api/change-password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user._id;

        // หา User จาก Database
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });

        // ตรวจสอบรหัสผ่านเดิม
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "รหัสผ่านเดิมไม่ถูกต้อง" });

        // Hash รหัสผ่านใหม่
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // บันทึก
        user.password = hashedPassword;
        await user.save();

        res.json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// =======================
// C. REPORTS (ข้อมูลปฏิบัติงาน)
// =======================

// Get Reports (Public/All) - เรียงล่าสุดก่อน
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ date: -1 }); 
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Report (Admin/SuperAdmin)
app.post('/api/reports', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    // [แก้ไข] เพิ่ม createdBy โดยดึงจาก req.user.username (ที่ได้จาก Token)
    const newReport = new Report({
        ...req.body,
        createdBy: req.user.username 
    });
    const savedReport = await newReport.save();

    io.emit('server_data_update', { type: 'new_report', data: savedReport });

    res.status(201).json(savedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update Report (Admin/SuperAdmin)
app.put('/api/reports/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    // [แก้ไข] เพิ่ม updatedBy เมื่อมีการแก้ไข
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id, 
      { 
          ...req.body,
          updatedBy: req.user.username 
      }, 
      { new: true }
    );
    if (!updatedReport) return res.status(404).json({ message: "ไม่พบข้อมูล" });

    io.emit('server_data_update', { type: 'update_report', data: updatedReport });

    res.json(updatedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Report (Admin/SuperAdmin)
app.delete('/api/reports/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const deletedReport = await Report.findByIdAndDelete(req.params.id);
    if (!deletedReport) return res.status(404).json({ message: "ไม่พบข้อมูล" });
    res.json({ message: "ลบข้อมูลสำเร็จ", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete ALL Reports (SuperAdmin Only + Password Check)
app.delete('/api/reports', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "กรุณาระบุรหัสผ่าน" });

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    const result = await Report.deleteMany({});
    res.json({ 
      message: "ลบข้อมูลทั้งหมดเรียบร้อยแล้ว", 
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// D. OUTBREAKS (แจ้งโรคระบาด)
// =======================

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

// =======================
// E. SYSTEM BACKUP & RESTORE
// =======================

// Backup (Admin/SuperAdmin)
app.get('/api/system/backup', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
    try {
        const reports = await Report.find().sort({ date: -1 });
        const outbreaks = await Outbreak.find().sort({ date: -1 });

        const backupData = {
            metadata: {
                exportDate: new Date(),
                version: "1.0",
                exportedBy: req.user.username
            },
            reports: reports,
            outbreaks: outbreaks
        };
        res.json(backupData);
    } catch (err) {
        res.status(500).json({ message: "Backup Failed: " + err.message });
    }
});

// Restore (SuperAdmin Only)
app.post('/api/system/restore', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { reports, outbreaks } = req.body;
        if (!Array.isArray(reports) || !Array.isArray(outbreaks)) {
            throw new Error("รูปแบบไฟล์ไม่ถูกต้อง");
        }

        // ล้างข้อมูลเก่า
        await Report.deleteMany({}, { session });
        await Outbreak.deleteMany({}, { session });

        // นำเข้าข้อมูลใหม่
        if (reports.length > 0) await Report.insertMany(reports, { session });
        if (outbreaks.length > 0) await Outbreak.insertMany(outbreaks, { session });

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
        res.status(500).json({ message: "Restore Failed: " + err.message });
    }
});

// --- 6. SERVER START ---
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
