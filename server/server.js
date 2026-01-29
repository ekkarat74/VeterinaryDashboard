const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// เชื่อมต่อ MongoDB
// หมายเหตุ: แทนที่ตรงนี้ด้วย URL จาก MongoDB Atlas ในไฟล์ .env
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vet_db';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Connection Error:', err));

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
app.post('/api/reports', async (req, res) => {
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

app.post('/api/outbreaks', async (req, res) => {
  try {
    const newOutbreak = new Outbreak(req.body);
    const savedOutbreak = await newOutbreak.save();
    res.status(201).json(savedOutbreak);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/outbreaks/:id', async (req, res) => {
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
app.delete('/api/reports/:id', async (req, res) => {
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
app.put('/api/reports/:id', async (req, res) => {
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

app.delete('/api/reports', async (req, res) => {
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

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));