const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    action: { type: String, required: true },
    user: { type: String, required: true },
    role: { type: String, required: true },
    details: { type: String },
    metadata: { type: Object },
    ip: String
}, { timestamps: true });

module.exports = mongoose.model('SystemLog', logSchema);