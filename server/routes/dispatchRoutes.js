const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ==========================================
// 1. SCHEMA & MODEL (แผนการออกหน่วย)
// ==========================================
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
    createdBy: String,
    isVisibleToPublic: { type: Boolean, default: true },
    controllerName: { type: String, default: '' },
    controllerPhone: { type: String, default: '' }

}, { timestamps: true });

const DispatchPlan = mongoose.model('DispatchPlan', dispatchPlanSchema);

// ==========================================
// 2. ROUTES (API Endpoints)
// ==========================================
module.exports = function(io, authenticateToken, authorizeRole, createLog) {

    // GET: ดึงข้อมูลแผนออกหน่วยทั้งหมด
    router.get('/', async (req, res) => {
        try {
            const plans = await DispatchPlan.find().sort({ date: -1 }).lean();
            res.json(plans);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // POST: สร้างแผนออกหน่วยใหม่
    router.post('/', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'superadmin', 'admin']), async (req, res) => {
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

    // PUT: แก้ไขแผนออกหน่วย
    router.put('/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
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

    // DELETE: ลบแผนออกหน่วย
    router.delete('/:id', authenticateToken, authorizeRole(['Developer', 'MagaAdmin', 'admin', 'superadmin']), async (req, res) => {
        try {
            const deletedPlan = await DispatchPlan.findByIdAndDelete(req.params.id);
            await createLog(req, 'DELETE_DISPATCH', `ลบแผนออกหน่วย: ${deletedPlan?.location}`);
            io.emit('server_data_update', { type: 'DISPATCH_DELETED', id: req.params.id });

            res.json({ message: "ลบแผนงานเรียบร้อย" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    return router;
};