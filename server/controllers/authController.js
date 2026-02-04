const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createLog } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "ไม่พบผู้ใช้งาน" });
        if (user.status === 'suspended') return res.status(403).json({ message: "บัญชีถูกระงับ" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });

        user.lastLogin = new Date();
        await user.save();

        await createLog({ user: user, headers: req.headers }, 'LOGIN', 'เข้าสู่ระบบสำเร็จ');

        const token = jwt.sign({ _id: user._id, username: user.username, role: user.role }, JWT_SECRET);
        res.json({ token, role: user.role, username: user.username });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "รหัสผ่านเดิมไม่ถูกต้อง" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        await createLog(req, 'CHANGE_PASSWORD', 'เปลี่ยนรหัสผ่านส่วนตัว');
        res.json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- User Management (Admin) ---

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ _id: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, password: hashedPassword, role });
        await newUser.save();

        await createLog(req, 'CREATE_USER', `สร้างผู้ใช้ใหม่: ${username} (${role})`);
        res.status(201).json({ message: "สร้างผู้ใช้งานสำเร็จ" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { username, role, status } = req.body;
        if (req.user._id === req.params.id && status === 'suspended') {
            return res.status(400).json({ message: "ไม่สามารถระงับบัญชีตัวเองได้" });
        }
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, { username, role, status }, { new: true }
        ).select('-password');

        await createLog(req, 'UPDATE_USER', `แก้ไขข้อมูลผู้ใช้: ${username} (Role: ${role}, Status: ${status})`);
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.resetUserPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

        const salt = await bcrypt.genSalt(10);
        targetUser.password = await bcrypt.hash(newPassword, salt);
        await targetUser.save();

        await createLog(req, 'RESET_PASSWORD', `รีเซ็ตรหัสผ่านให้ผู้ใช้: ${targetUser.username}`);
        res.json({ message: "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        if (req.user._id === req.params.id) {
            return res.status(400).json({ message: "ไม่สามารถลบบัญชีตัวเองได้" });
        }
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        await createLog(req, 'DELETE_USER', `ลบผู้ใช้: ${deletedUser ? deletedUser.username : req.params.id}`);
        res.json({ message: "ลบผู้ใช้งานเรียบร้อย" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};