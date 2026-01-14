const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// เชื่อมต่อ MongoDB
// หมายเหตุ: แทนที่ตรงนี้ด้วย URL จาก MongoDB Atlas ในไฟล์ .env
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vet_db';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Connection Error:', err));

// สร้าง Schema
const reportSchema = new mongoose.Schema({
  date: { type: String, required: true },
  activity: String,
  location: String,
  district: String,
  subdistrict: String,
  unit: String,
  lat: { type: Number, default: 0 },
  long: { type: Number, default: 0 },
  stats: {
    vaccine: { type: Number, default: 0 },
    sterilize: { type: Number, default: 0 },
    register: { type: Number, default: 0 },
    microchip: { type: Number, default: 0 }
  },
  details: { type: Object, default: {} }
}, { timestamps: true }); // เพิ่ม timestamps เพื่อเก็บเวลาที่สร้างข้อมูล

const Report = mongoose.model('Report', reportSchema);

// API สำหรับดึงข้อมูล
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find();
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