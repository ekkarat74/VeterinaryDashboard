const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    date: { type: String, required: true },
    location: String,
    district: String,
    subdistrict: String,
    unit: String,
    lat: { type: Number, default: 0 },
    long: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
    stats: {
        vaccine: { type: Number, default: 0 },
        sterilize: { type: Number, default: 0 },
        register: { type: Number, default: 0 },
        microchip: { type: Number, default: 0 },
        medical: { type: Number, default: 0 }
    },
    details: { type: Object, default: {} },
    createdBy: { type: String, default: 'System' },
    updatedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);