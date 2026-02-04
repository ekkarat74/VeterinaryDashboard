const Report = require('../models/Report');
const User = require('../models/User'); // Required for clearReports logic
const bcrypt = require('bcryptjs'); // Required for clearReports logic
const { createLog } = require('../utils/logger');

exports.getReports = async (req, res) => {
    try {
        const reports = await Report.find().sort({ date: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createReport = async (req, res) => {
    try {
        const io = req.app.get('socketio');
        const newReport = new Report({
            ...req.body,
            createdBy: req.user.username
        });
        const savedReport = await newReport.save();

        await createLog(req, 'CREATE_REPORT', `เพิ่มข้อมูลปฏิบัติงาน: ${savedReport.location}`, savedReport);
        io.emit('server_data_update', { type: 'REPORT_ADDED', data: savedReport });
        res.status(201).json(savedReport);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateReport = async (req, res) => {
    try {
        const io = req.app.get('socketio');
        const updatedReport = await Report.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedBy: req.user.username },
            { new: true }
        );
        if (!updatedReport) return res.status(404).json({ message: "ไม่พบข้อมูล" });

        await createLog(req, 'UPDATE_REPORT', `แก้ไขข้อมูล ID: ${req.params.id}`, updatedReport);
        io.emit('server_data_update', { type: 'REPORT_UPDATED', data: updatedReport });
        res.json(updatedReport);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const io = req.app.get('socketio');
        const deletedReport = await Report.findByIdAndDelete(req.params.id);
        if (!deletedReport) return res.status(404).json({ message: "ไม่พบข้อมูล" });

        await createLog(req, 'DELETE_REPORT', `ลบข้อมูล ID: ${req.params.id} (${deletedReport.location})`);
        io.emit('server_data_update', { type: 'REPORT_DELETED', id: req.params.id });
        res.json({ message: "ลบข้อมูลสำเร็จ", id: req.params.id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.clearAllReports = async (req, res) => {
    try {
        const io = req.app.get('socketio');
        const { password } = req.body;
        const user = await User.findById(req.user._id);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });

        const result = await Report.deleteMany({});
        await createLog(req, 'CLEAR_ALL_REPORTS', `ล้างข้อมูลรายงานทั้งหมด (${result.deletedCount} รายการ)`);
        
        io.emit('server_data_update', { type: 'REPORTS_CLEARED' });
        res.json({ message: "ลบข้อมูลทั้งหมดเรียบร้อยแล้ว", deletedCount: result.deletedCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};