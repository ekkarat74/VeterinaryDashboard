import React, { useState, useEffect } from 'react';
import { Skull, X, Navigation, MapPin, Activity, Edit, Siren } from 'lucide-react';
// ปรับ path ให้ตรงกับโครงสร้างโปรเจคของคุณ
import { BANGKOK_DISTRICTS } from '../../constants/locations'; 

const AddOutbreakModal = ({ isOpen, onClose, onSave, onUpdate, initialData, onToast }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        location: '',
        district: BANGKOK_DISTRICTS[0],
        lat: '',
        long: '',
        stats: {
            dog: { male: 0, female: 0 },
            cat: { male: 0, female: 0 }
        }
    });

    // State สำหรับควบคุม Input พิกัด เพื่อให้พิมพ์ลื่นไหล
    const [coordInput, setCoordInput] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    date: initialData.date,
                    location: initialData.location,
                    district: initialData.district,
                    lat: initialData.lat,
                    long: initialData.long,
                    stats: {
                        dog: { 
                            male: initialData.stats?.dog?.male || 0, 
                            female: initialData.stats?.dog?.female || 0 
                        },
                        cat: { 
                            male: initialData.stats?.cat?.male || 0, 
                            female: initialData.stats?.cat?.female || 0 
                        }
                    }
                });
            
                if (initialData.lat && initialData.long) {
                    setCoordInput(`${initialData.lat}, ${initialData.long}`);
                } else {
                    setCoordInput("");
                }
            } else {
                // กรณีเพิ่มใหม่
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    location: '',
                    district: BANGKOK_DISTRICTS[0],
                    lat: '',
                    long: '',
                    stats: { dog: { male: 0, female: 0 }, cat: { male: 0, female: 0 } }
                });
                setCoordInput("");
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const payload = {
            ...formData,
            lat: (formData.lat && !isNaN(formData.lat)) ? parseFloat(formData.lat) : 0,
            long: (formData.long && !isNaN(formData.long)) ? parseFloat(formData.long) : 0
        };

        if (initialData) {
            onUpdate(initialData._id, payload);
        } else {
            onSave(payload);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-red-500">
                <div className="bg-red-600 px-6 py-4 flex justify-between items-center text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Skull className="w-6 h-6" /> {initialData ? 'แก้ไขข้อมูลจุดเสี่ยง' : 'บันทึกจุดเกิดเหตุโรคพิษสุนัขบ้า'}
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">วันที่พบเชื้อ</label>
                        <input required type="date" className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                            value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">สถานที่พบ (Location)</label>
                        <input required type="text" placeholder="ระบุสถานที่" className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                            value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">เขตพื้นที่ (District)</label>
                        <select className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                            value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })}>
                            {BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-red-500" /> พิกัดภูมิศาสตร์ (Latitude, Longitude)
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="เช่น 13.xxxx, 100.xxxx" 
                                className="w-full p-2.5 pl-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none font-mono"
                                value={coordInput} 
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setCoordInput(value);

                                    if (value.includes(',')) {
                                        const parts = value.split(',');
                                        const latVal = parts[0].trim();
                                        const longVal = parts[1] ? parts[1].trim() : '';
                                        setFormData({ ...formData, lat: latVal, long: longVal });
                                    } else {
                                        setFormData({ ...formData, lat: value.trim(), long: '' });
                                    }
                                }}
                            />
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                        <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> จำนวนสัตว์ที่พบเชื้อ (ตัว)
                        </label>
                        
                        {/* แถวสุนัข */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold w-12 text-slate-700">🐶 สุนัข</span>
                            <div className="flex-1 flex gap-2">
                                 <div className="relative flex-1">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">ผู้</span>
                                    <input type="number" min="0" className="w-full pl-6 p-1.5 border border-slate-300 rounded text-sm text-center" 
                                        value={formData.stats.dog.male}
                                        onChange={e => setFormData({
                                            ...formData, 
                                            stats: { ...formData.stats, dog: { ...formData.stats.dog, male: parseInt(e.target.value) || 0 } }
                                        })}
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">เมีย</span>
                                    <input type="number" min="0" className="w-full pl-8 p-1.5 border border-slate-300 rounded text-sm text-center" 
                                        value={formData.stats.dog.female}
                                        onChange={e => setFormData({
                                            ...formData, 
                                            stats: { ...formData.stats, dog: { ...formData.stats.dog, female: parseInt(e.target.value) || 0 } }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* แถวแมว */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold w-12 text-slate-700">🐱 แมว</span>
                            <div className="flex-1 flex gap-2">
                                 <div className="relative flex-1">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">ผู้</span>
                                    <input type="number" min="0" className="w-full pl-6 p-1.5 border border-slate-300 rounded text-sm text-center" 
                                        value={formData.stats.cat.male}
                                        onChange={e => setFormData({
                                            ...formData, 
                                            stats: { ...formData.stats, cat: { ...formData.stats.cat, male: parseInt(e.target.value) || 0 } }
                                        })}
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">เมีย</span>
                                    <input type="number" min="0" className="w-full pl-8 p-1.5 border border-slate-300 rounded text-sm text-center" 
                                        value={formData.stats.cat.female}
                                        onChange={e => setFormData({
                                            ...formData, 
                                            stats: { ...formData.stats, cat: { ...formData.stats.cat, female: parseInt(e.target.value) || 0 } }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-400">* จำเป็นต้องระบุพิกัดเพื่อแสดงบนแผนที่ (คั่นด้วยเครื่องหมายจุลภาค ,)</p>
                    <div className="pt-4 border-t border-slate-100 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors">ยกเลิก</button>
                        <button type="submit" className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all">
                            {initialData ? <><Edit className="w-4 h-4" /> บันทึกแก้ไข</> : <><Siren className="w-4 h-4" /> ยืนยันแจ้งเหตุ</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddOutbreakModal;