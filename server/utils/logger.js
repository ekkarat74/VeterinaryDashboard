const SystemLog = require('../models/SystemLog');

const createLog = async (req, action, details, metadata = null) => {
    try {
        const username = req.user ? req.user.username : (req.body.username || 'Unknown/System');
        const role = req.user ? req.user.role : 'Guest';
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        await SystemLog.create({
            action,
            user: username,
            role,
            details,
            metadata,
            ip
        });
    } catch (err) {
        console.error("Log Error:", err);
    }
};

module.exports = { createLog };