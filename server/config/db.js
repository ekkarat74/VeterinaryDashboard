const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vet_db';
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ Connection Error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;