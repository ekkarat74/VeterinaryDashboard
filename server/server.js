const express = require('express');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require("socket.io");
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// --- CONFIGURATION ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vet_db';
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Allowed Origins (Frontend URLs)
const allowedOrigins = [
  "http://localhost:5173", 
  "http://localhost:5174", 
  "http://localhost:3000",
  "https://veterinary-bkk.vercel.app"
];

// --- SERVER & SOCKET.IO SETUP ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 10, // จำกัด 10 ครั้งต่อ IP
    message: { message: "เข้าสู่ระบบผิดพลาดหลายครั้งเกินไป กรุณารอสักครู่" }
});

// --- MIDDLEWARES ---
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

// Support large payload (Images Base64)
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- DATABASE CONNECTION ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Connection Error:', err));

// --- SCHEMAS & MODELS ---

// 1. User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['MagaAdmin', 'superadmin', 'admin', 'user'], default: 'user' }, // เพิ่ม 'MagaAdmin'
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  lastLogin: { type: Date }
});
const User = mongoose.model('User', userSchema);

// 2. Report Schema
const reportSchema = new mongoose.Schema({
  date: { type: String, required: true },
  location: String,
  district: String,
  subdistrict: String,
  unit: String,
  team: String,
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
reportSchema.index({ date: -1, district: 1, unit: 1 });
const Report = mongoose.model('Report', reportSchema);

// 3. Outbreak Schema
const outbreakSchema = new mongoose.Schema({
  date: { type: String, required: true },
  location: String,
  district: String,
  lat: { type: Number, required: true },
  long: { type: Number, required: true },
  stats: {
    owned: { // สัตว์มีเจ้าของ
      dog: { male: { type: Number, default: 0 }, female: { type: Number, default: 0 } },
      cat: { male: { type: Number, default: 0 }, female: { type: Number, default: 0 } }
    },
    unowned: { // สัตว์ไม่มีเจ้าของ
      dog: { male: { type: Number, default: 0 }, female: { type: Number, default: 0 } },
      cat: { male: { type: Number, default: 0 }, female: { type: Number, default: 0 } }
    },
    feeder: { // สัตว์มีผู้ให้อาหาร
      dog: { male: { type: Number, default: 0 }, female: { type: Number, default: 0 } },
      cat: { male: { type: Number, default: 0 }, female: { type: Number, default: 0 } }
    }
  }
  // ------------------
}, { timestamps: true });
outbreakSchema.index({ date: -1 });
const Outbreak = mongoose.model('Outbreak', outbreakSchema);

// 4. System Log Schema (เพิ่มใหม่)
const logSchema = new mongoose.Schema({
    action: { type: String, required: true }, // LOGIN, CREATE_REPORT, DELETE_REPORT etc.
    user: { type: String, required: true },   // Username
    role: { type: String, required: true },   // Role
    details: { type: String },                // รายละเอียดเพิ่มเติม
    metadata: { type: Object },
    ip: String                                // IP Address
}, { timestamps: true });
const SystemLog = mongoose.model('SystemLog', logSchema);

// 5. Meeting Schema (เพิ่มใหม่)
const meetingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: String, required: true },
    startTime: String,
    endTime: String,
    link: String,
    details: String,
    createdBy: String
}, { timestamps: true });
const Meeting = mongoose.model('Meeting', meetingSchema);

// 6. Dispatch Plan Schema (แผนการออกหน่วย) (เพิ่มใหม่)
const dispatchPlanSchema = new mongoose.Schema({
    unitType: { type: String, required: true }, // sterilization, microchip
    customUnitName: { type: String, default: '' },
    unitLetter: { type: String, default: '' },
    unitColor: { type: String, default: 'bg-blue-500' },
    title: String,       // ชื่อหน่วยงานที่แสดง
    date: { type: String, required: true },
    time: String,        // เวลารถออก
    closingTime: String, // เวลาปิดหน่วย
    location: { type: String, required: true },
    district: String,
    mapLink: String,
    note: String,
    staff: { type: Object, default: {} }, // เก็บรายชื่อเจ้าหน้าที่ทั้งหมด
    team: String,        // ชื่อทีม (เช่น ทีม 1, หรือรายชื่อสัตวแพทย์)
    createdBy: String
}, { timestamps: true });
const DispatchPlan = mongoose.model('DispatchPlan', dispatchPlanSchema);

// 7. System Setting Schema (เพิ่มใหม่: สำหรับเก็บการตั้งค่าระบบ เช่น การเปิดปิดแท็บ)
const systemSettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: Object, required: true }
});
const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);

// --- HELPER FUNCTIONS ---

// Function บันทึก Log
const createLog = async (req, action, details, metadata = null) => {
    try {
        const username = req.user ? req.user.username : (req?.body?.username || 'Unknown/System');
        const role = req.user ? req.user.role : 'Guest';
        
        // ✅ แก้ไข: ใส่ ? เพื่อป้องกัน Error กรณี req.headers หรือ req.socket ไม่มีค่า
        const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || 'Unknown IP';

        await SystemLog.create({
            action,
            user: username,
            role,
            details,
            metadata, 
            ip
        });
    } catch (err) {
        console.error("Log Error:", err);
    }
};

// Middleware: Verify Token
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

// Middleware: Check Role
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
// A. AUTHENTICATION & LOGS
// =======================

app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "ไม่พบผู้ใช้งาน" });
  if (user.status === 'suspended') return res.status(403).json({ message: "บัญชีถูกระงับ" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });

  // Update Last Login
  user.lastLogin = new Date();
  await user.save();

  // ✅ แก้ไข: ยัดค่า user ลงใน req ชั่วคราวเพื่อให้ createLog ดึงไปใช้ได้เลย
  req.user = { username: user.username, role: user.role };
  await createLog(req, 'LOGIN', 'เข้าสู่ระบบสำเร็จ');

  const token = jwt.sign({ _id: user._id, username: user.username, role: user.role }, JWT_SECRET);
  res.json({ token, role: user.role, username: user.username });
});

app.post('/api/change-password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "รหัสผ่านเดิมไม่ถูกต้อง" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // ✅ บันทึก Log
        await createLog(req, 'CHANGE_PASSWORD', 'เปลี่ยนรหัสผ่านส่วนตัว');

        res.json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Logs (SuperAdmin Only) (✅ ส่วนที่เพิ่มใหม่)
app.get('/api/logs', authenticateToken, authorizeRole(['MagaAdmin', 'superadmin']), async (req, res) => {
    try {
        // ดึง Log 200 รายการล่าสุด
        const logs = await SystemLog.find().sort({ createdAt: -1 }).limit(200);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// =======================
// B. USER MANAGEMENT
// =======================

// Create User
app.post('/api/users', authenticateToken, authorizeRole(['MagaAdmin', 'superadmin']), async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, password: hashedPassword, role }); 
        await newUser.save();

        // ✅ บันทึก Log
        await createLog(req, 'CREATE_USER', `สร้างผู้ใช้ใหม่: ${username} (${role})`);

        res.status(201).json({ message: "สร้างผู้ใช้งานสำเร็จ" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get All Users
app.get('/api/users', authenticateToken, authorizeRole(['MagaAdmin', 'superadmin']), async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ _id: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update User
app.put('/api/users/:id', authenticateToken, authorizeRole(['MagaAdmin', 'superadmin']), async (req, res) => {
    try {
        const { username, role, status } = req.body;
        if (req.user._id === req.params.id && status === 'suspended') {
             return res.status(400).json({ message: "ไม่สามารถระงับบัญชีตัวเองได้" });
        }
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, { username, role, status }, { new: true }
        ).select('-password');

        // ✅ บันทึก Log
        await createLog(req, 'UPDATE_USER', `แก้ไขข้อมูลผู้ใช้: ${username} (Role: ${role}, Status: ${status})`);

        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Reset Password by Admin
app.put('/api/users/:id/reset-password', authenticateToken, authorizeRole(['MagaAdmin', 'superadmin']), async (req, res) => {
    try {
        const { newPassword } = req.body;
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        targetUser.password = hashedPassword;
        await targetUser.save();

        // ✅ บันทึก Log
        await createLog(req, 'RESET_PASSWORD', `รีเซ็ตรหัสผ่านให้ผู้ใช้: ${targetUser.username}`);

        res.json({ message: "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete User
app.delete('/api/users/:id', authenticateToken, authorizeRole(['MagaAdmin', 'superadmin']), async (req, res) => {
    try {
      if (req.user._id === req.params.id) {
          return res.status(400).json({ message: "ไม่สามารถลบบัญชีตัวเองได้" });
      }
      const deletedUser = await User.findByIdAndDelete(req.params.id);
      
      // ✅ บันทึก Log
      await createLog(req, 'DELETE_USER', `ลบผู้ใช้: ${deletedUser ? deletedUser.username : req.params.id}`);

      res.json({ message: "ลบผู้ใช้งานเรียบร้อย" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
});

// =======================
// C. REPORTS
// =======================

app.get('/api/reports', async (req, res) => {
  try {
    const { startDate, endDate, year, limit } = req.query;
    let query = {};

    // เพิ่มเงื่อนไขการกรองข้อมูลจากวันที่
    if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
    } else if (year) {
        query.date = { $regex: `^${year}` }; // กรองเฉพาะปีที่ระบุ
    }

    const reportsQuery = Report.find(query)
      .select('_id date location district subdistrict unit lat long stats details createdBy')
      .sort({ date: -1 })
      .lean();

    // หาก Frontend มีการจำกัดจำนวนข้อมูล
    if (limit) {
        reportsQuery.limit(parseInt(limit, 10));
    }

    const reports = await reportsQuery;
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Report
app.post('/api/reports', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
  try {
    const newReport = new Report({
        ...req.body,
        createdBy: req.user.username 
    });
    const savedReport = await newReport.save();

    // ✅ [แก้ไข] ส่ง savedReport เป็น parameter ตัวที่ 4
    await createLog(req, 'CREATE_REPORT', `เพิ่มข้อมูลปฏิบัติงาน: ${savedReport.location}`, savedReport);

    io.emit('server_data_update', { type: 'REPORT_ADDED', data: savedReport });
    res.status(201).json(savedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update Report
app.put('/api/reports/:id', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
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

    // ✅ [แก้ไข] ส่ง updatedReport เป็น parameter ตัวที่ 4
    await createLog(req, 'UPDATE_REPORT', `แก้ไขข้อมูล ID: ${req.params.id}`, updatedReport);

    io.emit('server_data_update', { type: 'REPORT_UPDATED', data: updatedReport });
    res.json(updatedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Report
app.delete('/api/reports/:id', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
  try {
    const deletedReport = await Report.findByIdAndDelete(req.params.id);
    if (!deletedReport) return res.status(404).json({ message: "ไม่พบข้อมูล" });

    // ✅ บันทึก Log
    await createLog(req, 'DELETE_REPORT', `ลบข้อมูล ID: ${req.params.id} (${deletedReport.location})`);

    io.emit('server_data_update', { type: 'REPORT_DELETED', id: req.params.id });
    res.json({ message: "ลบข้อมูลสำเร็จ", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Clear All Reports (SuperAdmin Only)
app.delete('/api/reports', authenticateToken, authorizeRole(['MagaAdmin', 'superadmin']), async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    const result = await Report.deleteMany({});

    // ✅ บันทึก Log
    await createLog(req, 'CLEAR_ALL_REPORTS', `ล้างข้อมูลรายงานทั้งหมด (${result.deletedCount} รายการ)`);

    io.emit('server_data_update', { type: 'REPORTS_CLEARED' });
    res.json({ message: "ลบข้อมูลทั้งหมดเรียบร้อยแล้ว", deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// D. OUTBREAKS
// =======================

app.get('/api/outbreaks', async (req, res) => {
  try {
    const { year, limit } = req.query;
    let query = {};

    if (year) {
        query.date = { $regex: `^${year}` };
    }

    const outbreaksQuery = Outbreak.find(query)
      .select('_id date location district lat long stats')
      .sort({ date: -1 })
      .lean();

    if (limit) {
        outbreaksQuery.limit(parseInt(limit, 10));
    }

    const outbreaks = await outbreaksQuery;
    res.json(outbreaks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/outbreaks', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
  try {
    const newOutbreak = new Outbreak(req.body);
    const savedOutbreak = await newOutbreak.save();

    // ✅ [แก้ไข] ส่ง savedOutbreak เป็น parameter ตัวที่ 4
    await createLog(req, 'CREATE_OUTBREAK', `แจ้งเหตุโรคระบาด: ${savedOutbreak.location}`, savedOutbreak);

    io.emit('server_data_update', { type: 'OUTBREAK_ADDED', data: savedOutbreak });
    res.status(201).json(savedOutbreak);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/outbreaks/:id', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
  try {
    const updatedOutbreak = await Outbreak.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedOutbreak) return res.status(404).json({ message: "ไม่พบข้อมูล" });

    // ✅ บันทึก Log
    await createLog(req, 'UPDATE_OUTBREAK', `แก้ไขจุดแจ้งเหตุ: ${updatedOutbreak.location}`, updatedOutbreak);

    // ส่ง Event ให้ Frontend ทราบว่ามีการแก้ไข
    io.emit('server_data_update', { type: 'OUTBREAK_UPDATED', data: updatedOutbreak });
    
    res.json(updatedOutbreak);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/outbreaks/:id', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
  try {
    const deletedOutbreak = await Outbreak.findByIdAndDelete(req.params.id);
    if (!deletedOutbreak) return res.status(404).json({ message: "ไม่พบข้อมูล" });

    // ✅ บันทึก Log
    await createLog(req, 'DELETE_OUTBREAK', `ลบแจ้งเหตุโรคระบาด: ${deletedOutbreak.location}`);

    io.emit('server_data_update', { type: 'OUTBREAK_DELETED', id: req.params.id });
    res.json({ message: "ลบข้อมูลเรียบร้อย", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// E. SYSTEM BACKUP & RESTORE
// =======================

app.get('/api/system/backup', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
    try {
        const reports = await Report.find().sort({ date: -1 });
        const outbreaks = await Outbreak.find().sort({ date: -1 });

        // ✅ บันทึก Log (Optional: อาจจะไม่ต้องบันทึกก็ได้ถ้าโหลดบ่อย)
        // await createLog(req, 'SYSTEM_BACKUP', 'ดาวน์โหลดไฟล์ Backup');

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

app.post('/api/system/restore', authenticateToken, authorizeRole(['MagaAdmin', 'superadmin']), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { reports, outbreaks } = req.body;
        if (!Array.isArray(reports) || !Array.isArray(outbreaks)) {
            throw new Error("รูปแบบไฟล์ไม่ถูกต้อง");
        }

        await Report.deleteMany({}, { session });
        await Outbreak.deleteMany({}, { session });

        if (reports.length > 0) await Report.insertMany(reports, { session });
        if (outbreaks.length > 0) await Outbreak.insertMany(outbreaks, { session });

        await session.commitTransaction();
        session.endSession();

        // ✅ บันทึก Log
        await createLog(req, 'SYSTEM_RESTORE', `กู้คืนระบบสำเร็จ (Reports: ${reports.length}, Outbreaks: ${outbreaks.length})`);

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

// =======================
// F. MEETINGS (เพิ่มใหม่)
// =======================
app.get('/api/meetings', async (req, res) => {
    try {
        const meetings = await Meeting.find().sort({ date: -1 }).lean();
        res.json(meetings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/meetings', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
    try {
        const newMeeting = new Meeting({ ...req.body, createdBy: req.user.username });
        const savedMeeting = await newMeeting.save();
        
        await createLog(req, 'CREATE_MEETING', `นัดหมายประชุม: ${savedMeeting.title}`);
        io.emit('server_data_update', { type: 'MEETING_ADDED', data: savedMeeting });
        
        res.status(201).json(savedMeeting);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/meetings/:id', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
    try {
        const updatedMeeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedMeeting) return res.status(404).json({ message: "ไม่พบข้อมูล" });

        await createLog(req, 'UPDATE_MEETING', `แก้ไขนัดหมายประชุม: ${updatedMeeting.title}`);
        io.emit('server_data_update', { type: 'MEETING_UPDATED', data: updatedMeeting }); 
        res.json(updatedMeeting);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/meetings/:id', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
    try {
        await Meeting.findByIdAndDelete(req.params.id);
        io.emit('server_data_update', { type: 'MEETING_DELETED', id: req.params.id });
        res.json({ message: "ลบการประชุมสำเร็จ" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// =======================
// BULK IMPORTS (เพิ่มใหม่)
// =======================
app.post('/api/reports/bulk', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
    try {
        const reports = req.body; 
        if (!Array.isArray(reports)) return res.status(400).json({ message: "ข้อมูลต้องอยู่ในรูปแบบ Array" });

        const reportsWithUser = reports.map(report => ({ ...report, createdBy: req.user.username }));
        const insertedReports = await Report.insertMany(reportsWithUser);

        await createLog(req, 'BULK_IMPORT_REPORTS', `นำเข้าข้อมูลจำนวน ${insertedReports.length} รายการ`);
        io.emit('server_data_update', { type: 'REPORTS_IMPORTED', count: insertedReports.length });

        res.status(201).json({ message: "นำเข้าข้อมูลสำเร็จ", count: insertedReports.length });
    } catch (err) {
        res.status(400).json({ message: "เกิดข้อผิดพลาด: " + err.message });
    }
});

app.post('/api/outbreaks/bulk', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
    try {
        const outbreaks = req.body;
        if (!Array.isArray(outbreaks)) return res.status(400).json({ message: "ข้อมูลต้องอยู่ในรูปแบบ Array" });

        const insertedOutbreaks = await Outbreak.insertMany(outbreaks);
        await createLog(req, 'BULK_IMPORT_OUTBREAKS', `นำเข้าจุดระบาดจำนวน ${insertedOutbreaks.length} รายการ`);
        io.emit('server_data_update', { type: 'OUTBREAKS_IMPORTED', count: insertedOutbreaks.length });

        res.status(201).json({ message: "นำเข้าข้อมูลสำเร็จ", count: insertedOutbreaks.length });
    } catch (err) {
        res.status(400).json({ message: "เกิดข้อผิดพลาด: " + err.message });
    }
});

// =======================
// G. DISPATCH PLANS (เพิ่มใหม่)
// =======================
app.get('/api/dispatches', async (req, res) => {
    try {
        const plans = await DispatchPlan.find().sort({ date: -1 }).lean();
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/dispatches', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
    try {
        const newPlan = new DispatchPlan({ ...req.body, createdBy: req.user.username });
        const savedPlan = await newPlan.save();

        await createLog(req, 'CREATE_DISPATCH', `สร้างแผนออกหน่วย: ${savedPlan.location}`);
        io.emit('server_data_update', { type: 'DISPATCH_ADDED', data: savedPlan });

        res.status(201).json(savedPlan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/dispatches/:id', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
    try {
        const updatedPlan = await DispatchPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPlan) return res.status(404).json({ message: "ไม่พบข้อมูล" });

        await createLog(req, 'UPDATE_DISPATCH', `แก้ไขแผนออกหน่วย: ${updatedPlan.location}`);
        io.emit('server_data_update', { type: 'DISPATCH_UPDATED', data: updatedPlan });

        res.json(updatedPlan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/dispatches/:id', authenticateToken, authorizeRole(['MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
    try {
        const deletedPlan = await DispatchPlan.findByIdAndDelete(req.params.id);
        await createLog(req, 'DELETE_DISPATCH', `ลบแผนออกหน่วย: ${deletedPlan?.location}`);
        io.emit('server_data_update', { type: 'DISPATCH_DELETED', id: req.params.id });

        res.json({ message: "ลบแผนงานเรียบร้อย" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// =======================
// H. SYSTEM SETTINGS (เพิ่มใหม่)
// =======================
app.get('/api/settings/tabs', async (req, res) => {
    try {
        let setting = await SystemSetting.findOne({ key: 'tabsConfig' });
        if (!setting) {
            return res.json({ overview: true, outbreak: true, database: true });
        }
        res.json(setting.value);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/settings/tabs', authenticateToken, authorizeRole(['MagaAdmin']), async (req, res) => {
    try {
        const { tabsConfig } = req.body;
        const updatedSetting = await SystemSetting.findOneAndUpdate(
            { key: 'tabsConfig' },
            { value: tabsConfig },
            { upsert: true, new: true }
        );

        await createLog(req, 'UPDATE_TABS_CONFIG', `เปลี่ยนแปลงการแสดงผลแท็บ`);
        io.emit('server_data_update', { type: 'TABS_CONFIG_UPDATED', data: tabsConfig });

        res.json({ message: "อัปเดตแท็บสำเร็จ", data: tabsConfig });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- SERVER START ---
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
