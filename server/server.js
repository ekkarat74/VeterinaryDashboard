const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require("socket.io");
require('dotenv').config();

// --- SECURITY PACKAGES ---
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();

// --- CONFIGURATION ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vet_db';
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Allowed Origins (whitelist สำหรับ CORS)
const allowedOrigins = [
  "https://veterinary-dashboard-mu.vercel.app", 
  "https://veterinary-dashboard-mu.vercel.app/", 
  "http://localhost:5173", 
  "http://localhost:3000"
];

// --- MIDDLEWARES ---

// 1. Helmet: เพิ่ม HTTP Headers เพื่อความปลอดภัย
// ปรับแต่งเพื่ออนุญาตให้โหลด resources ข้ามโดเมนได้ (จำเป็นสำหรับบางกรณี)
app.use(helmet({
    crossOriginResourcePolicy: false,
}));

// 2. CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
}));

// 3. Rate Limiting: จำกัดการยิง API (ป้องกัน DDoS/Brute Force)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 300, // จำกัด 300 requests ต่อ IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// Login Rate Limiter: เข้มงวดพิเศษสำหรับหน้า Login
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ชั่วโมง
  max: 10, // อนุญาตให้ผิดพลาดได้ 10 ครั้งต่อชั่วโมง
  message: { message: 'Login attempts exceeded. Please try again after an hour.' }
});

// 4. Data Sanitization: ป้องกัน NoSQL Injection
app.use(mongoSanitize());

// 5. Data Sanitization: ป้องกัน XSS (Cross-Site Scripting)
app.use(xss());

// 6. Parameter Pollution: ป้องกันการส่ง Parameter ซ้ำ
app.use(hpp());

// 7. Body Parser: รองรับ JSON และ URL Encoded (เพิ่ม limit สำหรับรูปภาพ Base64)
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// --- SOCKET.IO SETUP ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins, 
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// --- DATABASE CONNECTION ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Connection Error:', err));

// --- SCHEMAS & MODELS ---

// 1. User Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  lastLogin: { type: Date }
});
const User = mongoose.model('User', userSchema);

// 2. Report Model
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
  createdBy: { type: String, default: 'System' },
  updatedBy: { type: String }
}, { timestamps: true });
const Report = mongoose.model('Report', reportSchema);

// 3. Outbreak Model
const outbreakSchema = new mongoose.Schema({
  date: { type: String, required: true },
  location: String,
  district: String,
  lat: { type: Number, required: true },
  long: { type: Number, required: true },
}, { timestamps: true });
const Outbreak = mongoose.model('Outbreak', outbreakSchema);

// --- AUTH MIDDLEWARES ---

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
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

// --- ROUTES ---

// =======================
// A. AUTHENTICATION
// =======================

// Login (ใช้ loginLimiter)
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
      const { username, password } = req.body;
      
      if (!username || !password) {
          return res.status(400).json({ message: "กรุณาระบุชื่อผู้ใช้และรหัสผ่าน" });
      }

      const user = await User.findOne({ username });
      // Generic Error Message เพื่อความปลอดภัย
      if (!user) return res.status(401).json({ message: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" });

      if (user.status === 'suspended') {
          return res.status(403).json({ message: "บัญชีของคุณถูกระงับ กรุณาติดต่อผู้ดูแลระบบ" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(401).json({ message: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" });

      // Update Last Login
      user.lastLogin = new Date();
      await user.save();

      // Token หมดอายุใน 12 ชั่วโมง
      const token = jwt.sign({ _id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
      
      res.json({ token, role: user.role, username: user.username });
  } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
  }
});

// Setup Initial Admin (เปิดใช้ครั้งแรกแล้วควร Comment ออก)
/*
app.get('/setup-admin', async (req, res) => {
    try {
        const exists = await User.findOne({ username: "superadmin" });
        if(exists) return res.send("SuperAdmin already exists.");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("admin1234", salt);
        const user = new User({ username: "superadmin", password: hashedPassword, role: "superadmin" });
        await user.save();
        res.send("✅ SuperAdmin Created");
    } catch (err) {
        res.status(500).send(err.message);
    }
});
*/

// =======================
// B. USER MANAGEMENT
// =======================

// Get Users
app.get('/api/users', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ _id: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create User
app.post('/api/users', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        // Basic Password Validation
        if(password.length < 4) return res.status(400).json({ message: "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, password: hashedPassword, role }); 
        await newUser.save();
        res.status(201).json({ message: "สร้างผู้ใช้งานสำเร็จ" });
    } catch (err) {
        res.status(400).json({ message: "Username อาจซ้ำ หรือข้อมูลไม่ถูกต้อง" });
    }
});

// Update User Info
app.put('/api/users/:id', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
    try {
        const { username, role, status } = req.body;
        
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

// Reset Password (By Admin)
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

// Change Own Password
app.post('/api/change-password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "รหัสผ่านเดิมไม่ถูกต้อง" });

        if (newPassword.length < 4) return res.status(400).json({ message: "รหัสผ่านใหม่สั้นเกินไป" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete User
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

// =======================
// C. REPORTS (ข้อมูลปฏิบัติงาน)
// =======================

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
    const newReport = new Report({
        ...req.body,
        createdBy: req.user.username 
    });
    const savedReport = await newReport.save();
    io.emit('server_data_update', { type: 'REPORT_ADDED', data: savedReport });
    res.status(201).json(savedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/reports/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id, 
      { 
          ...req.body,
          updatedBy: req.user.username 
      }, 
      { new: true }
    );
    if (!updatedReport) return res.status(404).json({ message: "ไม่พบข้อมูล" });
    io.emit('server_data_update', { type: 'REPORT_UPDATED', data: updatedReport });
    res.json(updatedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/reports/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const deletedReport = await Report.findByIdAndDelete(req.params.id);
    if (!deletedReport) return res.status(404).json({ message: "ไม่พบข้อมูล" });
    io.emit('server_data_update', { type: 'REPORT_DELETED', id: req.params.id });
    res.json({ message: "ลบข้อมูลสำเร็จ", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ล้างข้อมูลทั้งหมด (SuperAdmin + Password Confirm)
app.delete('/api/reports', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "กรุณาระบุรหัสผ่าน" });

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "รหัสผ่านยืนยันไม่ถูกต้อง" });

    const result = await Report.deleteMany({});
    io.emit('server_data_update', { type: 'REPORTS_CLEARED' });

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
    io.emit('server_data_update', { type: 'OUTBREAK_ADDED', data: savedOutbreak });
    res.status(201).json(savedOutbreak);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/outbreaks/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const deletedOutbreak = await Outbreak.findByIdAndDelete(req.params.id);
    if (!deletedOutbreak) return res.status(404).json({ message: "ไม่พบข้อมูล" });
    io.emit('server_data_update', { type: 'OUTBREAK_DELETED', id: req.params.id });
    res.json({ message: "ลบข้อมูลเรียบร้อย", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// E. SYSTEM BACKUP & RESTORE
// =======================

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

app.post('/api/system/restore', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { reports, outbreaks } = req.body;
        
        // Basic Validation
        if (!Array.isArray(reports) || !Array.isArray(outbreaks)) {
            throw new Error("รูปแบบไฟล์ไม่ถูกต้อง");
        }

        // Clear Old Data
        await Report.deleteMany({}, { session });
        await Outbreak.deleteMany({}, { session });

        // Insert New Data
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

// --- SERVER START ---
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));