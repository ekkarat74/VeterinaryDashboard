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
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();

// --- CONFIGURATION ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vet_db';
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Allowed Origins (Frontend URLs)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
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

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "เข้าสู่ระบบผิดพลาดหลายครั้งเกินไป กรุณารอสักครู่" },
  standardHeaders: true,
  legacyHeaders: false,
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

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- DATABASE CONNECTION ---
mongoose.connect(MONGO_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('Connection Error:', err));

// --- SCHEMAS & MODELS ---

// 1. User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Developer', 'MagaAdmin', 'executive', 'admin', 'user'], default: 'user' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  lastLogin: { type: Date }
});
const User = mongoose.model('User', userSchema);

// 2. Report Schema
const reportSchema = new mongoose.Schema({
  date: { type: String, required: true },
  location: String,
  locationDistrict: String,
  district: String,
  subdistrict: String,
  unit: String,
  team: String,
  lat: { type: Number, default: 0 },
  long: { type: Number, default: 0 },
  mapLink: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  note: { type: String, default: "" },
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
reportSchema.index({ location: 'text', subdistrict: 'text', district: 'text' });
const Report = mongoose.model('Report', reportSchema);

// 3. Outbreak Schema
const outbreakSchema = new mongoose.Schema({
  date: { type: String, required: true },
  location: String,
  district: String,
  subdistrict: String,
  lat: { type: Number, required: true },
  long: { type: Number, required: true },
  stats: {
    owned: {
      dog: { male: { type: Number, default: 0 }, female: { type: Number, default: 0 } },
      cat: { male: { type: Number, default: 0 }, female: { type: Number, default: 0 } }
    },
    unowned: {
      dog: { male: { type: Number, default: 0 }, female: { type: Number, default: 0 } },
      cat: { male: { type: Number, default: 0 }, female: { type: Number, default: 0 } }
    },
    feeder: {
      dog: { male: { type: Number, default: 0 }, female: { type: Number, default: 0 } },
      cat: { male: { type: Number, default: 0 }, female: { type: Number, default: 0 } }
    }
  },
  insight: {
    spcc: { type: String, default: "" },
    testNo: { type: String, default: "" },
    animalType: { type: String, default: "" },
    ownership: { type: String, default: "" },
    gender: { type: String, default: "" },
    breed: { type: String, default: "" },
    color: { type: String, default: "" },
    age: { type: String, default: "" },
    vaccineHistory: { type: String, default: "" }
  },
  createdBy: { type: String, default: 'System' }, // ✅ 2. เพิ่มฟิลด์ผู้บันทึกข้อมูล
  updatedBy: { type: String }
}, { timestamps: true });
outbreakSchema.index({ date: -1, district: 1 });
const Outbreak = mongoose.model('Outbreak', outbreakSchema);

// 4. System Log Schema
const logSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: String, required: true },
  role: { type: String, required: true },
  details: { type: String },
  metadata: { type: Object },
  ip: String
}, { timestamps: true });
logSchema.index({ createdAt: -1 });
const SystemLog = mongoose.model('SystemLog', logSchema);

// 5. Meeting Schema
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

// 7. System Setting Schema
const systemSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Object, required: true }
});
const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);

// 8. Custom Unit Schema
const customUnitSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdBy: String
}, { timestamps: true });
const CustomUnit = mongoose.model('CustomUnit', customUnitSchema);

// 9. Controller Schema
const controllerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  createdBy: String
}, { timestamps: true });
const Controller = mongoose.model('Controller', controllerSchema);

// 10. Breed Schema
const breedSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdBy: String
}, { timestamps: true });
const Breed = mongoose.model('Breed', breedSchema);

// 11. Color Schema
const colorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdBy: String
}, { timestamps: true });
const Color = mongoose.model('Color', colorSchema);

// 12. Staff Schema
const staffMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['vet', 'general'], default: 'general' },
  createdBy: String
}, { timestamps: true });
const StaffMember = mongoose.model('StaffMember', staffMemberSchema);

// --- HELPER FUNCTIONS ---

const createLog = (req, action, details, metadata = null) => {
  try {
    const username = req.user ? req.user.username : (req?.body?.username || 'Unknown/System');
    const role = req.user ? req.user.role : 'Guest';
    const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || 'Unknown IP';

    SystemLog.create({ action, user: username, role, details, metadata, ip })
      .catch(err => console.error("Log Error:", err));
  } catch (err) {
    console.error("Log Error:", err);
  }
};

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

const invalidateReportCache = () => {
  const keys = cache.keys().filter(k => k.startsWith('reports:'));
  if (keys.length > 0) cache.del(keys);
};

const invalidateOutbreakCache = () => {
  const keys = cache.keys().filter(k => k.startsWith('outbreaks:'));
  if (keys.length > 0) cache.del(keys);
};

// ==========================================
// [เพิ่มใหม่] 1. Schema สำหรับระบบแจ้งเตือน (Notification)
// ==========================================
const notificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  type: { type: String, enum: ['info', 'warning', 'success', 'error'], default: 'info' },
  isRead: { type: Boolean, default: false },
  linkId: String
}, { timestamps: true });
const Notification = mongoose.model('Notification', notificationSchema);

// =======================
// A. AUTHENTICATION & LOGS
// =======================
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username }).lean();
    if (!user) return res.status(400).json({ message: "ไม่พบผู้ใช้งาน" });
    if (user.status === 'suspended') return res.status(403).json({ message: "บัญชีถูกระงับ" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).catch(console.error);

    req.user = { username: user.username, role: user.role };
    createLog(req, 'LOGIN', 'เข้าสู่ระบบสำเร็จ');

    const token = jwt.sign(
      { _id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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

    createLog(req, 'CHANGE_PASSWORD', 'เปลี่ยนรหัสผ่านส่วนตัว');
    res.json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/logs', authenticateToken, authorizeRole(['Developer', 'MagaAdmin']), async (req, res) => {
  try {
    const logs = await SystemLog.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/logs', authenticateToken, authorizeRole(['Developer', 'MagaAdmin']), async (req, res) => {
  try {
    const result = await SystemLog.deleteMany({});
    
    // สร้าง Log ทิ้งไว้ 1 รายการเพื่อบันทึกว่าใครเป็นคนสั่งล้างข้อมูล
    createLog(req, 'CLEAR_SYSTEM_LOG', `ล้างประวัติการใช้งานระบบทั้งหมด (${result.deletedCount} รายการ)`);
    
    res.json({ message: "ล้างข้อมูลประวัติการใช้งานระบบเรียบร้อยแล้ว", deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// B. USER MANAGEMENT
// =======================
app.post('/api/users', authenticateToken, authorizeRole(['Developer', 'MagaAdmin']), async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (req.user.role === 'MagaAdmin' && role === 'Developer') {
      return res.status(403).json({ message: "MagaAdmin ไม่สามารถสร้างบัญชีระดับผู้พัฒนาได้" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();

    createLog(req, 'CREATE_USER', `สร้างผู้ใช้ใหม่: ${username} (${role})`);
    res.status(201).json({ message: "สร้างผู้ใช้งานสำเร็จ" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/users', authenticateToken, authorizeRole(['Developer', 'MagaAdmin']), async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ _id: -1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/users/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin']), async (req, res) => {
  try {
    const { username, role, status } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    if (req.user.role === 'MagaAdmin' && (targetUser.role === 'Developer' || role === 'Developer')) {
      return res.status(403).json({ message: "MagaAdmin ไม่มีสิทธิ์จัดการหรือแต่งตั้งบัญชีระดับผู้พัฒนาได้" });
    }

    if (req.user._id === req.params.id && status === 'suspended') {
      return res.status(400).json({ message: "ไม่สามารถระงับบัญชีตัวเองได้" });
    }

    if (username !== undefined) targetUser.username = username;
    if (role !== undefined) targetUser.role = role;
    if (status !== undefined) targetUser.status = status;

    await targetUser.save();
    createLog(req, 'UPDATE_USER', `แก้ไขข้อมูลผู้ใช้: ${targetUser.username} (Role: ${targetUser.role}, Status: ${targetUser.status})`); // ✅ fire-and-forget

    const updatedUser = await User.findById(req.params.id).select('-password').lean();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/users/:id/reset-password', authenticateToken, authorizeRole(['Developer', 'MagaAdmin']), async (req, res) => {
  try {
    const { newPassword } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    if (req.user.role === 'MagaAdmin' && targetUser.role === 'Developer') {
      return res.status(403).json({ message: "MagaAdmin ไม่มีสิทธิ์รีเซ็ตรหัสผ่านผู้พัฒนาระบบได้" });
    }

    const salt = await bcrypt.genSalt(10);
    targetUser.password = await bcrypt.hash(newPassword, salt);
    await targetUser.save();

    createLog(req, 'RESET_PASSWORD', `รีเซ็ตรหัสผ่านให้ผู้ใช้: ${targetUser.username}`);
    res.json({ message: "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/users/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin']), async (req, res) => {
  try {
    if (req.user._id === req.params.id) {
      return res.status(400).json({ message: "ไม่สามารถลบบัญชีตัวเองได้" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    if (req.user.role === 'MagaAdmin' && targetUser.role === 'Developer') {
      return res.status(403).json({ message: "MagaAdmin ไม่มีสิทธิ์ลบบัญชีผู้พัฒนาระบบได้" });
    }

    await User.findByIdAndDelete(req.params.id);
    createLog(req, 'DELETE_USER', `ลบผู้ใช้: ${targetUser.username}`);
    res.json({ message: "ลบผู้ใช้งานเรียบร้อย" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// C. REPORTS (with Cache)
// =======================
app.get('/api/reports', async (req, res) => {
  try {
    const { search, year, month, unit, district, startDate, endDate, page = 1, limit = 50 } = req.query;

    const cacheKey = `reports:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    let query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if ((year && year !== 'ทั้งหมด') || (month && month !== 'ทั้งหมด')) {
      const y = (year && year !== 'ทั้งหมด') ? year : '\\d{4}';
      const m = (month && month !== 'ทั้งหมด') ? month : '\\d{2}';
      query.date = { $regex: `^${y}-${m}` };
    }

    if (unit && unit !== 'ทั้งหมด') query.unit = unit;
    if (district && district !== 'ทั้งหมด') query.district = district;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [reports, totalRecords] = await Promise.all([
      Report.find(query)
        .select('_id date location locationDistrict district subdistrict unit team lat long mapLink note stats details createdBy imageUrl') // <-- เพิ่ม locationDistrict เข้าไปใน select
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Report.countDocuments(query)
    ]);

    const result = {
      data: reports,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNumber),
        currentPage: pageNumber,
        limit: limitNumber
      }
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/reports', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin', 'user']), async (req, res) => {
  try {
    const newReport = new Report({ ...req.body, createdBy: req.user.username });
    const savedReport = await newReport.save();

    createLog(req, 'CREATE_REPORT', `เพิ่มข้อมูลปฏิบัติงาน: ${savedReport.location}`, savedReport);
    invalidateReportCache();

    // แจ้งอัปเดตตารางปกติ
    io.emit('server_data_update', { type: 'REPORT_ADDED', data: savedReport });

    // ✅ [ส่วนที่แก้ไขและเพิ่มใหม่] ตรวจสอบและเพิ่มปฏิทินออกหน่วยอัตโนมัติแบบรัดกุม 100%
    try {
    const DispatchPlan = mongoose.models.DispatchPlan || mongoose.model('DispatchPlan');
    
    const normalizedNewLoc = normalizeLocation(savedReport.location);
    const existingOnDate = await DispatchPlan.find({ date: savedReport.date }).lean();
    const alreadyExists = existingOnDate.some(d => normalizeLocation(d.location) === normalizedNewLoc);

    if (!alreadyExists) {
        let autoUnitType = 'other';
        let autoColor = 'bg-slate-400';
        const unitName = savedReport.unit || '';
        
        if (unitName.includes('ทำหมัน')) { autoUnitType = 'spay_neuter'; autoColor = 'bg-red-500'; }
        else if (unitName.includes('วัคซีน') || unitName.includes('ไมโครชิป')) { autoUnitType = 'microchip'; autoColor = 'bg-blue-500'; }
        else if (unitName.includes('กรงแมว')) { autoUnitType = 'cat_cage'; autoColor = 'bg-purple-500'; }
        else if (unitName.includes('ผู้ว่า')) { autoUnitType = 'governor'; autoColor = 'bg-orange-500'; }
        else if (unitName.includes('สัตวแพทย์')) { autoUnitType = 'sterilization'; autoColor = 'bg-green-500'; }

        const correctDistrict = getDistrictForDispatch(savedReport);

        const newDispatch = new DispatchPlan({
            unitType: autoUnitType,
            customUnitName: autoUnitType === 'other' ? unitName : '',
            unitLetter: '',
            unitColor: autoColor,
            title: unitName,
            unit: unitName,
            date: savedReport.date,
            time: '08:30',
            closingTime: '12:00',
            location: savedReport.location.trim(),
            locationDistrict: savedReport.locationDistrict || savedReport.district || '',
            district: correctDistrict,
            mapLink: savedReport.mapLink || '',
            lat: savedReport.lat || 0,
            lng: savedReport.long || 0,
            note: savedReport.note || '',
            team: savedReport.team || '',
            staff: {},
            createdBy: req.user.username || 'Auto-System',
            status: 'completed',
            isVisibleToPublic: true
        });
        
        const savedDispatch = await newDispatch.save();
        io.emit('server_data_update', { type: 'DISPATCH_ADDED', data: savedDispatch });
        createLog(req, 'AUTO_CREATE_DISPATCH', `สร้างแผนออกหน่วยอัตโนมัติ: ${savedDispatch.location}`);
    }
} catch (dispatchErr) {
    console.error("Auto-create dispatch failed:", dispatchErr);
}

    // 🔔 สร้างและส่ง Notification เข้าระบบกระดิ่งแจ้งเตือน
    const notif = await Notification.create({
      title: '📝 มีรายงานผลปฏิบัติงานใหม่',
      message: `สถานที่: ${savedReport.location} (เขต${savedReport.district || '-'})`,
      type: 'success',
      linkId: savedReport._id
    });
    io.emit('server_notification', notif);

    res.status(201).json(savedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/reports/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    // 1. ดึงข้อมูลเก่าออกมาก่อน
    const oldReport = await Report.findById(req.params.id).lean();
    if (!oldReport) return res.status(404).json({ message: "ไม่พบข้อมูล" });

    // 2. อัปเดตข้อมูลใหม่
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.username },
      { new: true }
    ).lean();

    // 3. บันทึกลง Log แบบมี Before / After
    createLog(req, 'UPDATE_REPORT', `แก้ไขข้อมูล ID: ${req.params.id}`, { before: oldReport, after: updatedReport });
    
    invalidateReportCache();
    io.emit('server_data_update', { type: 'REPORT_UPDATED', data: updatedReport });
    res.json(updatedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/reports/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    const deletedReport = await Report.findByIdAndDelete(req.params.id);
    if (!deletedReport) return res.status(404).json({ message: "ไม่พบข้อมูล" });

    createLog(req, 'DELETE_REPORT', `ลบข้อมูล ID: ${req.params.id} (${deletedReport.location})`);
    invalidateReportCache();

    io.emit('server_data_update', { type: 'REPORT_DELETED', id: req.params.id });
    res.json({ message: "ลบข้อมูลสำเร็จ", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/reports', authenticateToken, authorizeRole(['Developer', 'MagaAdmin']), async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    const result = await Report.deleteMany({});
    createLog(req, 'CLEAR_ALL_REPORTS', `ล้างข้อมูลรายงานทั้งหมด (${result.deletedCount} รายการ)`);
    invalidateReportCache();

    io.emit('server_data_update', { type: 'REPORTS_CLEARED' });
    res.json({ message: "ลบข้อมูลทั้งหมดเรียบร้อยแล้ว", deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// D. OUTBREAKS (with Cache)
// =======================
app.get('/api/outbreaks', async (req, res) => {
  try {
    const { year, limit } = req.query;

    const cacheKey = `outbreaks:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    let query = {};
    if (year) query.date = { $regex: `^${year}` };

    const outbreaksQuery = Outbreak.find(query)
      .select('_id date location district subdistrict lat long stats insight createdBy updatedBy')
      .sort({ date: -1 })
      .lean();
    if (limit) outbreaksQuery.limit(parseInt(limit, 10));

    const outbreaks = await outbreaksQuery;

    cache.set(cacheKey, outbreaks);
    res.json(outbreaks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/outbreaks', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin', 'user']), async (req, res) => {
  try {
    const newOutbreak = new Outbreak({ ...req.body, createdBy: req.user.username });
    const savedOutbreak = await newOutbreak.save();
    createLog(req, 'CREATE_OUTBREAK', `แจ้งเหตุโรคระบาด: ${savedOutbreak.location}`, savedOutbreak);
    invalidateOutbreakCache();

    // [เพิ่มใหม่] สร้าง Notification
    const notif = await Notification.create({
      title: '🚨 แจ้งเตือนด่วน: พบจุดเสี่ยงโรคระบาดใหม่!',
      message: `สถานที่: ${savedOutbreak.location} เขต${savedOutbreak.district}`,
      type: 'error',
      linkId: savedOutbreak._id
    });
    
    // [แก้ไข] แจ้งเตือนไปที่ Frontend
    io.emit('server_data_update', { type: 'OUTBREAK_ADDED', data: savedOutbreak });
    io.emit('server_notification', notif); // ยิงแจ้งเตือนเข้าระบบกระดิ่ง

    res.status(201).json(savedOutbreak);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/outbreaks/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    // 1. ดึงข้อมูลเก่า
    const oldOutbreak = await Outbreak.findById(req.params.id).lean();
    if (!oldOutbreak) return res.status(404).json({ message: "ไม่พบข้อมูล" });

    // 2. อัปเดตข้อมูลใหม่
    const updatedOutbreak = await Outbreak.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedBy: req.user.username }, 
      { new: true }
    ).lean();

    // 3. บันทึกลง Log
    createLog(req, 'UPDATE_OUTBREAK', `แก้ไขจุดแจ้งเหตุ: ${updatedOutbreak.location}`, { before: oldOutbreak, after: updatedOutbreak });
    
    invalidateOutbreakCache();
    io.emit('server_data_update', { type: 'OUTBREAK_UPDATED', data: updatedOutbreak });
    res.json(updatedOutbreak);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/outbreaks/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    const deletedOutbreak = await Outbreak.findByIdAndDelete(req.params.id);
    if (!deletedOutbreak) return res.status(404).json({ message: "ไม่พบข้อมูล" });

    createLog(req, 'DELETE_OUTBREAK', `ลบแจ้งเหตุโรคระบาด: ${deletedOutbreak.location}`);
    invalidateOutbreakCache();

    io.emit('server_data_update', { type: 'OUTBREAK_DELETED', id: req.params.id });
    res.json({ message: "ลบข้อมูลเรียบร้อย", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// E. SYSTEM BACKUP & RESTORE
// =======================
app.get('/api/system/backup', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    const [reports, outbreaks] = await Promise.all([
      Report.find().sort({ date: -1 }).lean(),
      Outbreak.find().sort({ date: -1 }).lean()
    ]);

    const backupData = {
      metadata: { exportDate: new Date(), version: "1.0", exportedBy: req.user.username },
      reports,
      outbreaks
    };
    res.json(backupData);
  } catch (err) {
    res.status(500).json({ message: "Backup Failed: " + err.message });
  }
});

app.post('/api/system/restore', authenticateToken, authorizeRole(['Developer', 'MagaAdmin']), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reports, outbreaks } = req.body;
    if (!Array.isArray(reports) || !Array.isArray(outbreaks)) throw new Error("รูปแบบไฟล์ไม่ถูกต้อง");

    await Report.deleteMany({}, { session });
    await Outbreak.deleteMany({}, { session });
    if (reports.length > 0) await Report.insertMany(reports, { session });
    if (outbreaks.length > 0) await Outbreak.insertMany(outbreaks, { session });

    await session.commitTransaction();
    session.endSession();

    cache.flushAll();

    createLog(req, 'SYSTEM_RESTORE', `กู้คืนระบบสำเร็จ (Reports: ${reports.length}, Outbreaks: ${outbreaks.length})`);
    res.json({ message: "กู้คืนข้อมูลสำเร็จ", reportCount: reports.length, outbreakCount: outbreaks.length });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Restore Failed: " + err.message });
  }
});

// =======================
// F. MEETINGS
// =======================
app.get('/api/meetings', async (req, res) => {
  try {
    const cached = cache.get('meetings');
    if (cached) return res.json(cached);

    const meetings = await Meeting.find().sort({ date: -1 }).lean();
    cache.set('meetings', meetings);
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/meetings', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    const newMeeting = new Meeting({ ...req.body, createdBy: req.user.username });
    const savedMeeting = await newMeeting.save();
    createLog(req, 'CREATE_MEETING', `นัดหมายประชุม: ${savedMeeting.title}`);
    cache.del('meetings');
    io.emit('server_data_update', { type: 'MEETING_ADDED', data: savedMeeting });
    res.status(201).json(savedMeeting);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/meetings/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    const oldMeeting = await Meeting.findById(req.params.id).lean();
    if (!oldMeeting) return res.status(404).json({ message: "ไม่พบข้อมูล" });

    const updatedMeeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();

    createLog(req, 'UPDATE_MEETING', `แก้ไขนัดหมายประชุม: ${updatedMeeting.title}`, { before: oldMeeting, after: updatedMeeting });
    
    cache.del('meetings');
    io.emit('server_data_update', { type: 'MEETING_UPDATED', data: updatedMeeting });
    res.json(updatedMeeting);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/meetings/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    await Meeting.findByIdAndDelete(req.params.id);
    cache.del('meetings');
    io.emit('server_data_update', { type: 'MEETING_DELETED', id: req.params.id });
    res.json({ message: "ลบการประชุมสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// BULK IMPORTS
// =======================
app.post('/api/reports/bulk', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    const reports = req.body;
    if (!Array.isArray(reports)) return res.status(400).json({ message: "ข้อมูลต้องอยู่ในรูปแบบ Array" });

    const reportsWithUser = reports.map(report => ({ ...report, createdBy: req.user.username }));

    const CHUNK_SIZE = 500;
    let totalInserted = 0;
    
    // 📌 เตรียม Model สำหรับสร้างลงปฏิทิน
    const DispatchPlan = mongoose.models.DispatchPlan || mongoose.model('DispatchPlan');
    const dispatchPlansToInsert = [];

    for (let i = 0; i < reportsWithUser.length; i += CHUNK_SIZE) {
      const chunk = reportsWithUser.slice(i, i + CHUNK_SIZE);
      const inserted = await Report.insertMany(chunk, { ordered: false });
      totalInserted += inserted.length;
      
      // 📌 สร้างปฏิทินออกหน่วยอัตโนมัติสำหรับข้อมูลที่เพิ่ง Import เข้ามา
      for (const rep of chunk) {
            const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const locRegex = new RegExp(`^\\s*${escapeRegex(rep.location.trim())}\\s*$`, 'i');
            const existingDispatch = await DispatchPlan.findOne({ date: rep.date, location: locRegex });
          if (!existingDispatch) {
                let autoUnitType = 'other';
                let autoColor = 'bg-slate-400';
                const unitName = rep.unit || '';
                if (unitName.includes('ทำหมัน')) { autoUnitType = 'spay_neuter'; autoColor = 'bg-red-500'; }
                else if (unitName.includes('วัคซีน') || unitName.includes('ไมโครชิป')) { autoUnitType = 'microchip'; autoColor = 'bg-blue-500'; }
                else if (unitName.includes('กรงแมว')) { autoUnitType = 'cat_cage'; autoColor = 'bg-purple-500'; }
                else if (unitName.includes('ผู้ว่า')) { autoUnitType = 'governor'; autoColor = 'bg-orange-500'; }
                else if (unitName.includes('สัตวแพทย์')) { autoUnitType = 'sterilization'; autoColor = 'bg-green-500'; }

                dispatchPlansToInsert.push({
                    unitType: autoUnitType,
                    customUnitName: autoUnitType === 'other' ? unitName : '',
                    unitLetter: '',
                    unitColor: autoColor,
                    title: unitName,
                    date: rep.date,
                    time: '08:30', 
                    closingTime: '12:00',
                    location: rep.location.trim(),
                    district: rep.district || rep.locationDistrict || '',
                    mapLink: rep.mapLink || '',
                    lat: rep.lat || 0,
                    lng: rep.long || 0,
                    note: rep.note || '',
                    team: rep.team || '',
                    staff: {}, 
                    createdBy: req.user.username || 'Auto-System',
                    status: 'completed', 
                    isVisibleToPublic: true
                });
          }
      }
    }

    // บันทึกลงปฏิทินรวดเดียว
    if (dispatchPlansToInsert.length > 0) {
        await DispatchPlan.insertMany(dispatchPlansToInsert, { ordered: false }).catch(e => console.log("Dispatch Bulk Insert Error:", e.message));
    }

    createLog(req, 'BULK_IMPORT_REPORTS', `นำเข้าข้อมูลจำนวน ${totalInserted} รายการ`);
    invalidateReportCache();

    io.emit('server_data_update', { type: 'REPORTS_IMPORTED', count: totalInserted });
    res.status(201).json({ message: "นำเข้าข้อมูลสำเร็จ", count: totalInserted });
  } catch (err) {
    res.status(400).json({ message: "เกิดข้อผิดพลาด: " + err.message });
  }
});

app.post('/api/outbreaks/bulk', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    const outbreaks = req.body;
    if (!Array.isArray(outbreaks)) return res.status(400).json({ message: "ข้อมูลต้องอยู่ในรูปแบบ Array" });

    const insertedOutbreaks = await Outbreak.insertMany(outbreaks, { ordered: false });
    createLog(req, 'BULK_IMPORT_OUTBREAKS', `นำเข้าจุดระบาดจำนวน ${insertedOutbreaks.length} รายการ`);
    invalidateOutbreakCache();

    io.emit('server_data_update', { type: 'OUTBREAKS_IMPORTED', count: insertedOutbreaks.length });
    res.status(201).json({ message: "นำเข้าข้อมูลสำเร็จ", count: insertedOutbreaks.length });
  } catch (err) {
    res.status(400).json({ message: "เกิดข้อผิดพลาด: " + err.message });
  }
});

// =======================
// G. DISPATCH PLANS
// =======================
const dispatchRoutes = require('./routes/dispatchRoutes');
app.use('/api/dispatches', dispatchRoutes(io, authenticateToken, authorizeRole, createLog));

// =======================
// H. SYSTEM SETTINGS
// =======================
app.get('/api/settings/tabs', async (req, res) => {
  try {
    const cached = cache.get('settings:tabs');
    if (cached) return res.json(cached);

    let setting = await SystemSetting.findOne({ key: 'tabsConfig' }).lean();
    const result = setting ? setting.value : { overview: true, outbreak: true, database: true };
    cache.set('settings:tabs', result, 300);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/settings/tabs', authenticateToken, authorizeRole(['Developer', 'MagaAdmin']), async (req, res) => {
  try {
    const { tabsConfig } = req.body;
    const updatedSetting = await SystemSetting.findOneAndUpdate(
      { key: 'tabsConfig' }, { value: tabsConfig }, { upsert: true, new: true }
    );

    cache.del('settings:tabs');
    createLog(req, 'UPDATE_TABS_CONFIG', `เปลี่ยนแปลงการตั้งค่าการแสดงผลแท็บเมนู`);
    io.emit('server_data_update', { type: 'TABS_CONFIG_UPDATED', data: tabsConfig });
    res.json({ message: "อัปเดตแท็บสำเร็จ", data: tabsConfig });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// =======================
// I. SYSTEM UPDATE
// =======================
app.post('/api/system/notify-update', authenticateToken, authorizeRole(['Developer']), async (req, res) => {
  try {
    createLog(req, 'SYSTEM_UPDATE', 'ส่งแจ้งเตือนอัปเดตระบบ (บังคับรีเฟรชผู้ใช้ทั้งหมด)');
    io.emit('system_update_refresh', { message: 'ระบบมีการอัปเดตเวอร์ชันใหม่ กำลังรีเฟรชหน้าจอ...' });
    res.json({ message: "ส่งคำสั่งรีเฟรชไปยังผู้ใช้งานทั้งหมดเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// J. CUSTOM UNITS
// =======================
app.get('/api/custom-units', async (req, res) => {
  try {
    const cached = cache.get('custom-units');
    if (cached) return res.json(cached);

    const units = await CustomUnit.find().sort({ createdAt: -1 }).lean();
    cache.set('custom-units', units, 300);
    res.json(units);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/custom-units', authenticateToken, authorizeRole(['Developer', 'MagaAdmin']), async (req, res) => {
  try {
    const { name } = req.body;
    const existing = await CustomUnit.findOne({ name }).lean();
    if (existing) return res.status(400).json({ message: "มีหน่วยงานนี้อยู่แล้ว" });

    const newUnit = new CustomUnit({ name, createdBy: req.user.username });
    const savedUnit = await newUnit.save();

    cache.del('custom-units');
    io.emit('server_data_update', { type: 'CUSTOM_UNIT_ADDED', data: savedUnit });
    res.status(201).json(savedUnit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/custom-units/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin']), async (req, res) => {
  try {
    const updatedUnit = await CustomUnit.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
    cache.del('custom-units');
    io.emit('server_data_update', { type: 'CUSTOM_UNIT_UPDATED', data: updatedUnit });
    res.json(updatedUnit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/custom-units/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin']), async (req, res) => {
  try {
    await CustomUnit.findByIdAndDelete(req.params.id);
    cache.del('custom-units');
    io.emit('server_data_update', { type: 'CUSTOM_UNIT_DELETED', id: req.params.id });
    res.json({ message: "ลบสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// K. CONTROLLERS
// =======================
app.get('/api/controllers', async (req, res) => {
  try {
    const cached = cache.get('controllers');
    if (cached) return res.json(cached);

    const list = await Controller.find().sort({ name: 1 }).lean(); // ✅ lean()
    cache.set('controllers', list, 300);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/controllers', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    const newEntry = new Controller({ ...req.body, createdBy: req.user.username });
    await newEntry.save();
    cache.del('controllers');
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/controllers/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    const updated = await Controller.findByIdAndUpdate(req.params.id, req.body, { new: true });
    cache.del('controllers');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/controllers/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    await Controller.findByIdAndDelete(req.params.id);
    cache.del('controllers');
    res.json({ message: "ลบข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// L. BREEDS
// =======================
app.get('/api/breeds', async (req, res) => {
  try {
    const cached = cache.get('breeds');
    if (cached) return res.json(cached);

    const breeds = await Breed.find().sort({ createdAt: -1 }).lean();
    cache.set('breeds', breeds, 300);
    res.json(breeds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/breeds', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    const { name } = req.body;
    const existing = await Breed.findOne({ name }).lean();
    if (existing) return res.status(400).json({ message: "มีสายพันธุ์นี้อยู่แล้ว" });
    const newBreed = new Breed({ name, createdBy: req.user.username });
    const savedBreed = await newBreed.save();
    cache.del('breeds');
    io.emit('server_data_update', { type: 'BREED_ADDED', data: savedBreed });
    res.status(201).json(savedBreed);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/breeds/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    await Breed.findByIdAndDelete(req.params.id);
    cache.del('breeds');
    io.emit('server_data_update', { type: 'BREED_DELETED', id: req.params.id });
    res.json({ message: "ลบสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// M. COLORS
// =======================
app.get('/api/colors', async (req, res) => {
  try {
    const cached = cache.get('colors');
    if (cached) return res.json(cached);

    const colors = await Color.find().sort({ createdAt: -1 }).lean();
    cache.set('colors', colors, 300);
    res.json(colors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/colors', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    const { name } = req.body;
    const existing = await Color.findOne({ name }).lean();
    if (existing) return res.status(400).json({ message: "มีสีนี้อยู่แล้ว" });
    const newColor = new Color({ name, createdBy: req.user.username });
    const savedColor = await newColor.save();
    cache.del('colors');
    io.emit('server_data_update', { type: 'COLOR_ADDED', data: savedColor });
    res.status(201).json(savedColor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/colors/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    await Color.findByIdAndDelete(req.params.id);
    cache.del('colors');
    io.emit('server_data_update', { type: 'COLOR_DELETED', id: req.params.id });
    res.json({ message: "ลบสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// N. STAFFS
// =======================
app.get('/api/staffs', async (req, res) => {
  try {
    const cached = cache.get('staffs');
    if (cached) return res.json(cached);

    const staffs = await StaffMember.find().sort({ name: 1 }).lean();
    cache.set('staffs', staffs, 300);
    res.json(staffs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/staffs', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    const newStaff = new StaffMember({ ...req.body, createdBy: req.user.username });
    const savedStaff = await newStaff.save();
    cache.del('staffs');
    res.status(201).json(savedStaff);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/staffs/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    const updatedStaff = await StaffMember.findByIdAndUpdate(
      req.params.id, 
      { name: req.body.name, role: req.body.role }, 
      { new: true }
    );
    cache.del('staffs');
    res.json(updatedStaff);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/staffs/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
  try {
    await StaffMember.findByIdAndDelete(req.params.id);
    cache.del('staffs');
    res.json({ message: "ลบรายชื่อเรียบร้อย" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 3. API สำหรับ Notifications & Audit Trail
// ==========================================

// 3.1 API ดึงประวัติการแก้ไขของ Record แบบเจาะจง (Audit Trail)
app.get('/api/logs/record/:id', authenticateToken, async (req, res) => {
  try {
    const searchId = req.params.id;
    let objectId;
    
    try {
      objectId = new mongoose.Types.ObjectId(searchId);
    } catch (e) {
      objectId = searchId;
    }

    const logs = await SystemLog.find({
      $or: [
        { 'metadata.after._id': objectId },
        { 'metadata.before._id': objectId },
        { 'metadata._id': objectId },
        { 'metadata.after._id': searchId },
        { 'metadata.before._id': searchId },
        { 'metadata._id': searchId }
      ]
    }).sort({ createdAt: -1 }).lean();
    
    res.json(logs);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifs = await Notification.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(notifs || []);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

app.put('/api/notifications/read', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: "Marked all as read" });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// Helper: normalize location string สำหรับเปรียบเทียบ
const normalizeLocation = (str) => {
    if (!str) return '';
    return str.trim().replace(/\s+/g, ' ').toLowerCase();
};

// Helper: หา district ที่ถูกต้องตาม unitType
const getDistrictForDispatch = (report) => {
    const unitName = report.unit || '';
    // หน่วยกรงแมว ใช้ district (เขตที่ไป) ถ้ามี ไม่งั้นใช้ locationDistrict
    if (unitName.includes('กรงแมว')) {
        return report.district || report.locationDistrict || '';
    }
    // หน่วยอื่นๆ ใช้ locationDistrict (เขตที่ตั้งสถานที่)
    return report.locationDistrict || report.district || '';
};

const syncHistoricalReportsToDispatch = async () => {
  try {
    console.log("⏳ [Auto-Sync] Checking and deduplicating Dispatch Calendar...");
    const DispatchPlan = mongoose.models.DispatchPlan || mongoose.model('DispatchPlan');
    
    // --- STEP 1: ลบ dispatch ที่ซ้ำกันออกก่อน (เก็บไว้แค่อันที่ดีที่สุด) ---
    const allDispatches = await DispatchPlan.find().lean();
    
    // Group by date + normalized location
    const groupMap = new Map();
    for (const d of allDispatches) {
        const key = `${d.date}__${normalizeLocation(d.location)}`;
        if (!groupMap.has(key)) {
            groupMap.set(key, []);
        }
        groupMap.get(key).push(d);
    }
    
    let removedCount = 0;
    for (const [key, group] of groupMap.entries()) {
        if (group.length <= 1) continue;
        
        // เรียงลำดับ: อันที่มี staff/team/controllerName จริงๆ อยู่ก่อน (คือ dispatch ที่วางแผนจริง)
        group.sort((a, b) => {
            const scoreA = (
                (Object.keys(a.staff || {}).some(k => Array.isArray(a.staff[k]) && a.staff[k].some(v => v)) ? 10 : 0) +
                (a.team ? 3 : 0) +
                (a.controllerName ? 2 : 0) +
                (a.status !== 'completed' && a.createdBy !== 'Auto-Sync-System' && a.createdBy !== 'Auto-System' ? 5 : 0)
            );
            const scoreB = (
                (Object.keys(b.staff || {}).some(k => Array.isArray(b.staff[k]) && b.staff[k].some(v => v)) ? 10 : 0) +
                (b.team ? 3 : 0) +
                (b.controllerName ? 2 : 0) +
                (b.status !== 'completed' && b.createdBy !== 'Auto-Sync-System' && b.createdBy !== 'Auto-System' ? 5 : 0)
            );
            return scoreB - scoreA; // score สูงกว่าอยู่ก่อน (เก็บไว้)
        });
        
        // เก็บอันแรก (ดีที่สุด) ลบที่เหลือ
        const toDelete = group.slice(1).map(d => d._id);
        await DispatchPlan.deleteMany({ _id: { $in: toDelete } });
        removedCount += toDelete.length;
        console.log(`🗑️ [Dedup] Removed ${toDelete.length} duplicates for: ${key}`);
    }
    
    if (removedCount > 0) {
        console.log(`✅ [Dedup] Removed ${removedCount} duplicate dispatch entries.`);
    }

    // --- STEP 2: sync รายงานที่ยังไม่มี dispatch ---
    const reports = await Report.find().lean();
    let addedCount = 0;

    for (const report of reports) {
        if (!report.date || !report.location) continue;
        
        const normalizedLoc = normalizeLocation(report.location);
        
        // ตรวจสอบซ้ำโดย normalize ทั้งสองฝั่ง
        const existingDispatches = await DispatchPlan.find({ date: report.date }).lean();
        const alreadyExists = existingDispatches.some(d => normalizeLocation(d.location) === normalizedLoc);
        
        if (!alreadyExists) {
            let autoUnitType = 'other';
            let autoColor = 'bg-slate-400';
            const unitName = report.unit || '';
            
            if (unitName.includes('ทำหมัน')) { autoUnitType = 'spay_neuter'; autoColor = 'bg-red-500'; }
            else if (unitName.includes('วัคซีน') || unitName.includes('ไมโครชิป')) { autoUnitType = 'microchip'; autoColor = 'bg-blue-500'; }
            else if (unitName.includes('กรงแมว')) { autoUnitType = 'cat_cage'; autoColor = 'bg-purple-500'; }
            else if (unitName.includes('ผู้ว่า')) { autoUnitType = 'governor'; autoColor = 'bg-orange-500'; }
            else if (unitName.includes('สัตวแพทย์')) { autoUnitType = 'sterilization'; autoColor = 'bg-green-500'; }

            const correctDistrict = getDistrictForDispatch(report);

            const newDispatch = new DispatchPlan({
                unitType: autoUnitType,
                customUnitName: autoUnitType === 'other' ? unitName : '',
                unitLetter: '',
                unitColor: autoColor,
                title: unitName,
                unit: unitName,
                date: report.date,
                time: '08:30',
                closingTime: '12:00',
                location: report.location.trim(),
                locationDistrict: report.locationDistrict || report.district || '',
                district: correctDistrict,
                mapLink: report.mapLink || '',
                lat: report.lat || 0,
                lng: report.long || 0,
                note: report.note || '',
                team: report.team || '',
                staff: {},
                createdBy: 'Auto-Sync-System',
                status: 'completed',
                isVisibleToPublic: true
            });
            await newDispatch.save();
            addedCount++;
        }
    }
    
    if (addedCount > 0 || removedCount > 0) {
        console.log(`✅ [Auto-Sync] Added: ${addedCount}, Removed duplicates: ${removedCount}`);
        io.emit('server_data_update', { type: 'DISPATCH_SYNCED' });
    } else {
        console.log("✅ [Auto-Sync] All synced. No changes needed.");
    }
  } catch (err) {
    console.error("❌ [Auto-Sync] Error:", err);
  }
};

// เพิ่ม endpoint ใหม่ใน server.js
app.post('/api/system/dedup-dispatches', authenticateToken, authorizeRole(['Developer', 'MagaAdmin']), async (req, res) => {
    try {
        await syncHistoricalReportsToDispatch();
        createLog(req, 'DEDUP_DISPATCHES', 'สั่งล้างข้อมูล Dispatch ซ้ำและ sync ใหม่');
        res.json({ message: "ดำเนินการล้างข้อมูลซ้ำและ sync เรียบร้อยแล้ว" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  syncHistoricalReportsToDispatch();
});