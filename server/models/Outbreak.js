const mongoose = require('mongoose');

const outbreakSchema = new mongoose.Schema({
    date: { type: String, required: true },
    location: String,
    district: String,
    lat: { type: Number, required: true },
    long: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Outbreak', outbreakSchema);