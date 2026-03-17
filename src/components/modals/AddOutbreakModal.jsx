import React, { useState, useEffect } from 'react';
import { Skull, X, Navigation, MapPin, Activity, Edit, Siren, Calendar, Map } from 'lucide-react';
import { BANGKOK_DISTRICTS } from '../../constants/locations'; 

const AddOutbreakModal = ({ isOpen, onClose, onSave, onUpdate, initialData, onToast }) => {

    const defaultStats = {
        owned: { dog: { male: 0, female: 0 }, cat: { male: 0, female: 0 } },
        unowned: { dog: { male: 0, female: 0 }, cat: { male: 0, female: 0 } },
        feeder: { dog: { male: 0, female: 0 }, cat: { male: 0, female: 0 } }
    };

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        location: '',
        district: BANGKOK_DISTRICTS[0],
        lat: '',
        long: '',
        stats: defaultStats
    });

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
                        owned: { 
                            dog: { male: initialData.stats?.owned?.dog?.male || 0, female: initialData.stats?.owned?.dog?.female || 0 },
                            cat: { male: initialData.stats?.owned?.cat?.male || 0, female: initialData.stats?.owned?.cat?.female || 0 }
                        },
                        unowned: { 
                            dog: { male: initialData.stats?.unowned?.dog?.male || 0, female: initialData.stats?.unowned?.dog?.female || 0 },
                            cat: { male: initialData.stats?.unowned?.cat?.male || 0, female: initialData.stats?.unowned?.cat?.female || 0 }
                        },
                        feeder: { 
                            dog: { male: initialData.stats?.feeder?.dog?.male || 0, female: initialData.stats?.feeder?.dog?.female || 0 },
                            cat: { male: initialData.stats?.feeder?.cat?.male || 0, female: initialData.stats?.feeder?.cat?.female || 0 }
                        }
                    }
                });
            
                if (initialData.lat && initialData.long) {
                    setCoordInput(`${initialData.lat}, ${initialData.long}`);
                } else {
                    setCoordInput("");
                }
            } else {
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    location: '',
                    district: BANGKOK_DISTRICTS[0],
                    lat: '',
                    long: '',
                    stats: defaultStats
                });
                setCoordInput("");
            }
        }
    }, [isOpen, initialData]);

    const handleStatChange = (category, animal, gender, value) => {
        const numValue = parseInt(value) || 0;
        setFormData(prev => ({
            ...prev,
            stats: {
                ...prev.stats,
                [category]: {
                    ...prev.stats[category],
                    [animal]: {
                        ...prev.stats[category][animal],
                        [gender]: numValue >= 0 ? numValue : 0
                    }
                }
            }
        }));
    };

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

    // ข้อมูลหมวดหมู่สำหรับ Render
    const categories = [
        { key: 'owned', label: '🏠 สัตว์มีเจ้าของ', color: 'bg-blue-50 border-blue-100 text-blue-800' }, 
        { key: 'unowned', label: '🛣️ สัตว์ไม่มีเจ้าของ', color: 'bg-orange-50 border-orange-100 text-orange-800' }, 
        { key: 'feeder', label: '🥣 สัตว์มีผู้ให้อาหาร', color: 'bg-emerald-50 border-emerald-100 text-emerald-800' }
    ];

    return (
        // 1. แก้ z-[3000] เป็น z-[99999] และเปลี่ยน p-4 เป็น p-0 บนมือถือ
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-0 sm:p-6 animate-in fade-in">
            
            {/* 2. เปลี่ยนความสูงเป็น h-[100dvh] บนมือถือ และยกเลิกขอบมน (rounded-none) */}
            <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90dvh] overflow-hidden border-0 sm:border border-slate-200">
                
                {/* Header (Sticky) - เพิ่ม padding รองรับจอมือถือ */}
                <div className="bg-red-600 px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center text-white shrink-0 mt-safe sm:mt-0 z-10">
                    <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                        <Skull className="w-5 h-5 sm:w-6 sm:h-6" /> 
                        {initialData ? 'แก้ไขข้อมูลจุดเสี่ยง' : 'บันทึกจุดเกิดเหตุโรคพิษสุนัขบ้า'}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="hover:bg-red-700 p-2 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body (Scrollable) */}
                <div className="overflow-y-auto p-4 sm:p-6 flex-1 bg-slate-50/50 custom-scrollbar">
                    <form id="outbreak-form" onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                        
                        {/* Section 1: ข้อมูลทั่วไป */}
                        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2 border-b pb-2 text-sm sm:text-base">
                                <Map className="w-4 h-4 text-red-500" /> ข้อมูลสถานที่และเวลา
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" /> วันที่พบเชื้อ
                                    </label>
                                    <input required type="date" 
                                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                        value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">เขตพื้นที่ (District)</label>
                                    <select className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                        value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })}>
                                        {BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">สถานที่พบ (รายละเอียด)</label>
                                <input required type="text" placeholder="ระบุสถานที่ให้ชัดเจน เช่น ซอย, วัด, โรงเรียน" 
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                    value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                                    <Navigation className="w-3.5 h-3.5 text-red-500" /> พิกัดภูมิศาสตร์ (Lat, Long) <span className="text-[10px] text-slate-400 font-normal ml-1">*จำเป็นต้องคั่นด้วยลูกน้ำ (,)</span>
                                </label>
                                <div className="relative">
                                    <input type="text" placeholder="เช่น 13.7563, 100.5018" 
                                        className="w-full p-2.5 pl-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono bg-slate-50 focus:bg-white"
                                        value={coordInput} 
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setCoordInput(value);
                                            if (value.includes(',')) {
                                                const parts = value.split(',');
                                                setFormData({ ...formData, lat: parts[0].trim(), long: parts[1] ? parts[1].trim() : '' });
                                            } else {
                                                setFormData({ ...formData, lat: value.trim(), long: '' });
                                            }
                                        }} 
                                    />
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: สถิติสัตว์ */}
                        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2 border-b pb-2 text-sm sm:text-base">
                                <Activity className="w-4 h-4 text-red-500" /> จำนวนสัตว์ที่สัมผัส/อยู่ในกลุ่มเสี่ยง
                            </h4>

                            <div className="space-y-3">
                                {categories.map(category => (
                                    <div key={category.key} className={`p-3 sm:p-4 rounded-xl border ${category.color}`}>
                                        <div className="font-bold text-sm mb-3">{category.label}</div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            {/* โซนสุนัข */}
                                            <div className="bg-white/60 p-3 rounded-lg flex items-center gap-2 sm:gap-3">
                                                <div className="text-xs sm:text-sm font-bold text-slate-700 w-14 sm:w-16">🐶 สุนัข</div>
                                                <div className="flex-1 flex gap-2">
                                                    <div className="flex-1 text-center">
                                                        <label className="text-[10px] text-slate-500 block mb-1">ผู้</label>
                                                        <input type="number" min="0" placeholder="0"
                                                            className="w-full p-1.5 border border-slate-300 rounded text-sm text-center focus:ring-2 focus:ring-red-500 outline-none" 
                                                            value={formData.stats[category.key].dog.male || ''}
                                                            onChange={e => handleStatChange(category.key, 'dog', 'male', e.target.value)} />
                                                    </div>
                                                    <div className="flex-1 text-center">
                                                        <label className="text-[10px] text-slate-500 block mb-1">เมีย</label>
                                                        <input type="number" min="0" placeholder="0"
                                                            className="w-full p-1.5 border border-slate-300 rounded text-sm text-center focus:ring-2 focus:ring-red-500 outline-none" 
                                                            value={formData.stats[category.key].dog.female || ''}
                                                            onChange={e => handleStatChange(category.key, 'dog', 'female', e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* โซนแมว */}
                                            <div className="bg-white/60 p-3 rounded-lg flex items-center gap-2 sm:gap-3">
                                                <div className="text-xs sm:text-sm font-bold text-slate-700 w-14 sm:w-16">🐱 แมว</div>
                                                <div className="flex-1 flex gap-2">
                                                    <div className="flex-1 text-center">
                                                        <label className="text-[10px] text-slate-500 block mb-1">ผู้</label>
                                                        <input type="number" min="0" placeholder="0"
                                                            className="w-full p-1.5 border border-slate-300 rounded text-sm text-center focus:ring-2 focus:ring-red-500 outline-none" 
                                                            value={formData.stats[category.key].cat.male || ''}
                                                            onChange={e => handleStatChange(category.key, 'cat', 'male', e.target.value)} />
                                                    </div>
                                                    <div className="flex-1 text-center">
                                                        <label className="text-[10px] text-slate-500 block mb-1">เมีย</label>
                                                        <input type="number" min="0" placeholder="0"
                                                            className="w-full p-1.5 border border-slate-300 rounded text-sm text-center focus:ring-2 focus:ring-red-500 outline-none" 
                                                            value={formData.stats[category.key].cat.female || ''}
                                                            onChange={e => handleStatChange(category.key, 'cat', 'female', e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer (Sticky) - 3. เพิ่ม pb-8 สำหรับมือถือ เพื่อป้องกันปุ่มโดนแถบ Home Indicator ด้านล่างทับ */}
                <div className="bg-white border-t border-slate-200 p-4 sm:p-5 pb-8 sm:pb-5 px-4 sm:px-6 flex gap-3 shrink-0 z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.03)]">
                    <button type="button" onClick={onClose} 
                        className="flex-1 py-2.5 sm:py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm sm:text-base hover:bg-slate-200 transition-colors focus:ring-2 focus:ring-slate-300">
                        ยกเลิก
                    </button>
                    <button type="submit" form="outbreak-form" 
                        className="flex-1 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition-all focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                        {initialData ? <><Edit className="w-4 h-4 sm:w-5 sm:h-5" /> บันทึกการแก้ไข</> : <><Siren className="w-4 h-4 sm:w-5 sm:h-5" /> ยืนยันแจ้งเหตุ</>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AddOutbreakModal;