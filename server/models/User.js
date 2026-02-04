const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    lastLogin: { type: Date }
});

module.exports = mongoose.model('User', userSchema);