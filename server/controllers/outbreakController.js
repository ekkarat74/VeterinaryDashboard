const Outbreak = require('../models/Outbreak');
const { createLog } = require('../utils/logger');

exports.getOutbreaks = async (req, res) => {
    try {
        const outbreaks = await Outbreak.find().sort({ date: -1 });
        res.json(outbreaks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createOutbreak = async (req, res) => {
    try {
        const io = req.app.get('socketio');
        const newOutbreak = new Outbreak(req.body);
        const savedOutbreak = await newOutbreak.save();

        await createLog(req, 'CREATE_OUTBREAK', `แจ้งเหตุโรคระบาด: ${savedOutbreak.location}`, savedOutbreak);
        io.emit('server_data_update', { type: 'OUTBREAK_ADDED', data: savedOutbreak });
        res.status(201).json(savedOutbreak);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateOutbreak = async (req, res) => {
    try {
        const io = req.app.get('socketio');
        const updatedOutbreak = await Outbreak.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedOutbreak) return res.status(404).json({ message: "ไม่พบข้อมูล" });

        await createLog(req, 'UPDATE_OUTBREAK', `แก้ไขจุดแจ้งเหตุ: ${updatedOutbreak.location}`, updatedOutbreak);
        io.emit('server_data_update', { type: 'OUTBREAK_UPDATED', data: updatedOutbreak });
        res.json(updatedOutbreak);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteOutbreak = async (req, res) => {
    try {
        const io = req.app.get('socketio');
        const deletedOutbreak = await Outbreak.findByIdAndDelete(req.params.id);
        if (!deletedOutbreak) return res.status(404).json({ message: "ไม่พบข้อมูล" });

        await createLog(req, 'DELETE_OUTBREAK', `ลบแจ้งเหตุโรคระบาด: ${deletedOutbreak.location}`);
        io.emit('server_data_update', { type: 'OUTBREAK_DELETED', id: req.params.id });
        res.json({ message: "ลบข้อมูลเรียบร้อย", id: req.params.id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};