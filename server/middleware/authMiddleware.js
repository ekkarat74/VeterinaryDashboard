const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "ไม่มีสิทธิ์ใช้งานส่วนนี้" });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRole };