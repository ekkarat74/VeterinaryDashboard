const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 1. Schema สำหรับรายชื่อผู้ควบคุม
const controllerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    createdBy: String
}, { timestamps: true });

const Controller = mongoose.model('Controller', controllerSchema);

module.exports = function(io, authenticateToken, authorizeRole) {

    // GET: ดึงรายชื่อผู้ควบคุมทั้งหมด
    router.get('/', async (req, res) => {
        try {
            const list = await Controller.find().sort({ name: 1 });
            res.json(list);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // POST: เพิ่มผู้ควบคุมใหม่
    router.post('/', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
        try {
            const newEntry = new Controller({ ...req.body, createdBy: req.user.username });
            await newEntry.save();
            res.status(201).json(newEntry);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });

    // PUT: แก้ไขข้อมูลผู้ควบคุม
    router.put('/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
        try {
            const updated = await Controller.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(updated);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });

    // DELETE: ลบผู้ควบคุม
    router.delete('/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin']), async (req, res) => {
        try {
            await Controller.findByIdAndDelete(req.params.id);
            res.json({ message: "ลบข้อมูลสำเร็จ" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    return router;
};