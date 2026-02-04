require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const connectDB = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const outbreakRoutes = require('./routes/outbreakRoutes');
const systemRoutes = require('./routes/systemRoutes');

// --- APP CONFIGURATION ---
const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Allowed Origins
const allowedOrigins = [
  "http://localhost:5173", 
  "http://localhost:3000",
  "https://veterinary-dashboard-mu.vercel.app",
  "https://veterinary-dashboard-mu.vercel.app/"
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

// ✅ Attach Socket.io to Express App (เพื่อให้ Controller เรียกใช้ได้)
app.set('socketio', io);

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
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// --- ROUTES ---
app.use('/api', authRoutes); // /api/login, /api/users
app.use('/api/reports', reportRoutes);
app.use('/api/outbreaks', outbreakRoutes);
app.use('/api/system', systemRoutes); // /api/system/logs => เปลี่ยนเป็น /api/system/logs ตาม Group (หรือคุณจะแก้ใน systemRoutes ให้ path ตรงกับของเดิมก็ได้)

// Note: ของเดิม path logs คือ /api/logs แต่ถ้าจัดกลุ่ม systemRoutes จะเป็น /api/system/logs
// หากต้องการให้เหมือนเดิมเป๊ะๆ ให้แก้ที่ app.use ข้างบนเป็น:
// app.use('/api', systemRoutes); แล้วใน systemRoutes.js กำหนด path เต็มเช่น router.get('/logs', ...)

// --- START SERVER ---
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));