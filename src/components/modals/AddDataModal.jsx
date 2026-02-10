import React, { useState, useEffect, useMemo } from 'react';
import { 
    Edit, Plus, X, FileText, ImageIcon, Upload, Trash2, 
    Calculator, Syringe, Scissors, Database, Stethoscope, 
    Activity, Save, Navigation, MapPin 
} from 'lucide-react';

// นำเข้าข้อมูลคงที่จากไฟล์ constants (ตรวจสอบ path ให้ถูกต้อง)
import { UNIT_TYPES, BANGKOK_DISTRICTS, BANGKOK_SUBDISTRICTS } from '../../constants/locations';

const AddDataModal = ({ isOpen, onClose, onSave, onUpdate, initialData, onToast }) => {
    // ค่าเริ่มต้นสำหรับฟอร์มข้อมูลทั่วไป
    const defaultFormData = {
        date: new Date().toISOString().split('T')[0],
        location: '',
        district: BANGKOK_DISTRICTS[0],
        subdistrict: '',
        unit: UNIT_TYPES[0],
        lat: '',
        long: ''
    };

    // ค่าเริ่มต้นสำหรับข้อมูลตัวเลข (Breakdown)
    const defaultBreakdown = {
        dog: { maleSterilize: '', femaleSterilize: '', vaccine: '', register: '', microchip: '', medical: '' },
        cat: { maleSterilize: '', femaleSterilize: '', vaccine: '', register: '', microchip: '', medical: '' },
        other: { vaccine: '', medical: '' }
    };

    const [formData, setFormData] = useState(defaultFormData);
    const [breakdown, setBreakdown] = useState(defaultBreakdown);

    const [coordInput, setCoordInput] = useState("");

    // State สำหรับจัดการรูปภาพ
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Effect: โหลดข้อมูลเดิมเมื่อเปิด Modal ในโหมดแก้ไข หรือ รีเซ็ตเมื่อเพิ่มใหม่
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    date: initialData.date,
                    location: initialData.location,
                    district: initialData.district ? initialData.district.trim() : '',
                    subdistrict: initialData.subdistrict ? initialData.subdistrict.trim() : '', 
                    unit: initialData.unit,
                    lat: initialData.lat,
                    long: initialData.long
                });

                if (initialData.lat && initialData.long) {
                    setCoordInput(`${initialData.lat}, ${initialData.long}`);
                } else {
                    setCoordInput("");
                }

                // ✅ FIX: ใช้การ Merge Object เพื่อป้องกัน undefined กรณีข้อมูลเก่าไม่มีบาง field
                if (initialData.details) {
                    setBreakdown({
                        dog: { ...defaultBreakdown.dog, ...(initialData.details.dog || {}) },
                        cat: { ...defaultBreakdown.cat, ...(initialData.details.cat || {}) },
                        other: { ...defaultBreakdown.other, ...(initialData.details.other || {}) }
                    });
                } else {
                    setBreakdown(defaultBreakdown);
                }

                if (initialData.imageUrl) {
                    setImagePreview(initialData.imageUrl);
                } else {
                    setImagePreview(null);
                    setImageFile(null);
                }
            } else {
                setFormData(defaultFormData);
                setBreakdown(defaultBreakdown);
                setCoordInput("");
                setImageFile(null);
                setImagePreview(null);
            }
        }
    }, [isOpen, initialData]);

    // คำนวณยอดรวมอัตโนมัติ (Auto-calculation)
    const totals = useMemo(() => {
        const parse = (val) => parseInt(val) || 0;

        const dog = breakdown.dog;
        const cat = breakdown.cat;
        const other = breakdown.other;

        return {
            // ✅ แก้ไขสูตร: วัคซีนไม่ต้องแยกเพศ
            vaccine: parse(dog.vaccine) + parse(cat.vaccine) + parse(other.vaccine),
            sterilize: parse(dog.maleSterilize) + parse(dog.femaleSterilize) + parse(cat.maleSterilize) + parse(cat.femaleSterilize),
            register: parse(dog.register) + parse(cat.register),
            microchip: parse(dog.microchip) + parse(cat.microchip),
            // ✅ เพิ่มสูตร: รักษาสัตว์
            medical: parse(dog.medical) + parse(cat.medical) + parse(other.medical),
        };
    }, [breakdown]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    if (!isOpen) return null;

    const handleBreakdownChange = (type, field, value) => {
        setBreakdown(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value 
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let finalImageUrl = initialData?.imageUrl || ""; 

        if (imageFile) {
            try {
                finalImageUrl = await convertToBase64(imageFile);
            } catch (error) {
                console.error("Error converting image:", error);
                if(onToast) onToast('error', "ไม่สามารถประมวลผลรูปภาพได้");
                return;
            }
        } else if (imagePreview === null) {
            finalImageUrl = "";
        }

        // ✅ FIX: จัดโครงสร้างข้อมูลให้ตรงกับ Mongoose Schema (เอาตัวเลขไปใส่ใน stats)
        const dataPayload = {
            ...formData,
            lat: formData.lat ? parseFloat(formData.lat) : 0,
            long: formData.long ? parseFloat(formData.long) : 0,
            // ย้ายตัวเลขรวม เข้าไปอยู่ใน object 'stats'
            stats: {
                vaccine: totals.vaccine,
                sterilize: totals.sterilize,
                register: totals.register,
                microchip: totals.microchip,
                medical: totals.medical
            },
            details: breakdown,
            imageUrl: finalImageUrl 
        };

        if (initialData) {
            onUpdate(initialData._id, dataPayload);
        } else {
            onSave(dataPayload);
        }
        onClose();
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0 border-b border-slate-700">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {initialData ? <Edit className="w-5 h-5 text-yellow-400" /> : <Plus className="w-5 h-5 text-green-400" />}
                            {initialData ? 'แก้ไขข้อมูลการปฏิบัติงาน' : 'บันทึกผลการปฏิบัติงานใหม่'}
                        </h3>
                        <p className="text-slate-400 text-xs mt-0.5">
                            {initialData ? 'ปรับปรุงข้อมูลในระบบ' : 'กรอกข้อมูลพื้นฐานและรายละเอียดเชิงปริมาณ'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                        {/* Section 1: General Info (คงเดิม) */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" /> ข้อมูลทั่วไป (General Information)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">วันที่เริ่มกิจกรรม</label>
                                    <input required type="date" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">หน่วยกิจกรรม</label>
                                    <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                                        {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-6">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">สถานที่ (Location)</label>
                                    <input required type="text" placeholder="ระบุจุดสังเกต/สถานที่ตั้ง" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                                </div>

                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">เขต (District)</label>
                                    <select 
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.district} 
                                        // [EDIT] เมื่อเปลี่ยนเขต ให้รีเซ็ตแขวงเป็นค่าว่าง
                                        onChange={e => setFormData({...formData, district: e.target.value, subdistrict: ''})}
                                    >
                                        {BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

<div className="md:col-span-3">
    <label className="block text-xs font-semibold text-slate-500 mb-1.5">แขวง (Sub-district)</label>
    <select 
        required 
        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        value={formData.subdistrict} 
        onChange={e => setFormData({...formData, subdistrict: e.target.value})}
        disabled={!formData.district} // ปิดถ้ายังไม่เลือกเขต
    >
        <option value="">-- เลือกแขวง --</option>
        {/* ตรวจสอบว่ามีข้อมูลเขต และมี key ใน BANGKOK_SUBDISTRICTS หรือไม่ */}
        {formData.district && BANGKOK_SUBDISTRICTS[formData.district] ? (
            BANGKOK_SUBDISTRICTS[formData.district].map(sub => (
                <option key={sub} value={sub}>{sub}</option>
            ))
        ) : (
            <option value="" disabled>ไม่มีข้อมูลแขวง (ตรวจสอบชื่อเขต)</option>
        )}
    </select>
</div>

                                // ในส่วน return JSX (ตรง input พิกัดภูมิศาสตร์)

<div className="md:col-span-6">
    <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
        <Navigation className="w-3 h-3 text-blue-500" /> 
            พิกัดภูมิศาสตร์ (Latitude, Longitude)
    </label>
    <div className="flex gap-2">
        <div className="relative flex-1">
            {/* --- [แก้ไข] Input พิกัด --- */}
            <input 
                type="text" 
                placeholder="เช่น 13.6096, 100.4655" 
                className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                
                // ใช้ state แยก เพื่อไม่ให้ cursor กระโดดหรือเครื่องหมายหาย
                value={coordInput} 
                
                onChange={(e) => {
                    const value = e.target.value;
                    setCoordInput(value); // อัปเดตสิ่งที่ตาเห็นทันที

                    // Logic แยกพิกัดลง formData
                    if (value.includes(',')) {
                        const parts = value.split(',');
                        // ตัดช่องว่างและเก็บค่า
                        const latVal = parts[0].trim();
                        const longVal = parts[1].trim();
                        
                        setFormData({ 
                            ...formData, 
                            lat: latVal, 
                            long: longVal 
                        });
                    } else {
                        // กรณีพิมพ์แค่ Latitude หรือยังไม่ใส่ลูกน้ำ
                        setFormData({ 
                            ...formData, 
                            lat: value.trim(), 
                            long: '' // เคลียร์ Longitude ไว้ก่อนกันค่าค้าง
                        });
                    }
                }} 
            />
            {/* ------------------------- */}
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
    </div>
</div>

                                {/* อัปโหลดรูปภาพ */}
                                <div className="md:col-span-12 mt-2 pt-4 border-t border-slate-100">
                                    <label className="block text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                                        <ImageIcon className="w-3 h-3 text-blue-500" /> 
                                            รูปภาพประกอบ (Image Attachment)
                                    </label>
                                    {!imagePreview ? (
                                        <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors relative group h-32 flex flex-col items-center justify-center cursor-pointer">
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
                                            <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                                <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">คลิกเพื่ออัปโหลดรูปภาพ</p>
                                        </div>
                                    ) : (
                                        <div className="relative w-full h-48 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover"/>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button type="button" onClick={handleRemoveImage} className="bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1">
                                                    <Trash2 className="w-3 h-3" /> ลบรูปภาพ
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: Quantitative Data */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-orange-600" /> ข้อมูลเชิงปริมาณ (Quantitative Data)
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* 1. ฉีดวัคซีน (Vaccine) - ✅ แก้ไข: ไม่แยกเพศ */}
                                <div className="bg-blue-50/50 rounded-xl border border-blue-100 overflow-hidden">
                                    <div className="bg-blue-100/80 px-4 py-2 font-bold text-blue-800 flex items-center gap-2">
                                        <Syringe className="w-4 h-4" /> ฉีดวัคซีน (Vaccine)
                                    </div>
                                    <div className="p-4 grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">สุนัข (รวม)</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-blue-400"
                                                value={breakdown.dog.vaccine} onChange={(e) => handleBreakdownChange('dog', 'vaccine', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">แมว (รวม)</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-blue-400"
                                                value={breakdown.cat.vaccine} onChange={(e) => handleBreakdownChange('cat', 'vaccine', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">อื่น ๆ</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-blue-400"
                                                value={breakdown.other.vaccine} onChange={(e) => handleBreakdownChange('other', 'vaccine', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. ทำหมัน (Sterilization) - คงเดิม (แยกเพศ) */}
                                <div className="bg-orange-50/50 rounded-xl border border-orange-100 overflow-hidden">
                                    <div className="bg-orange-100/80 px-4 py-2 font-bold text-orange-800 flex items-center gap-2">
                                        <Scissors className="w-4 h-4" /> ทำหมัน (Sterilization)
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {/* สุนัข */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">สุนัข</div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 font-semibold">เพศผู้</label>
                                                <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-orange-400"
                                                    value={breakdown.dog.maleSterilize} onChange={(e) => handleBreakdownChange('dog', 'maleSterilize', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 font-semibold">เพศเมีย</label>
                                                <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-orange-400"
                                                    value={breakdown.dog.femaleSterilize} onChange={(e) => handleBreakdownChange('dog', 'femaleSterilize', e.target.value)} />
                                            </div>
                                        </div>
                                        {/* แมว */}
                                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-orange-100/50">
                                            <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">แมว</div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 font-semibold">เพศผู้</label>
                                                <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-orange-400"
                                                    value={breakdown.cat.maleSterilize} onChange={(e) => handleBreakdownChange('cat', 'maleSterilize', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 font-semibold">เพศเมีย</label>
                                                <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-orange-400"
                                                    value={breakdown.cat.femaleSterilize} onChange={(e) => handleBreakdownChange('cat', 'femaleSterilize', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. ฝังไมโครชิป (Microchip) */}
                                <div className="bg-purple-50/50 rounded-xl border border-purple-100 overflow-hidden">
                                    <div className="bg-purple-100/80 px-4 py-2 font-bold text-purple-800 flex items-center gap-2">
                                        <Database className="w-4 h-4" /> ฝังไมโครชิป (Microchip)
                                    </div>
                                    <div className="p-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">สุนัข (มีเจ้าของ)</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-purple-400"
                                                value={breakdown.dog.microchip} onChange={(e) => handleBreakdownChange('dog', 'microchip', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">แมว (มีเจ้าของ)</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-purple-400"
                                                value={breakdown.cat.microchip} onChange={(e) => handleBreakdownChange('cat', 'microchip', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                {/* 4. ขึ้นทะเบียน (Registration) */}
                                <div className="bg-green-50/50 rounded-xl border border-green-100 overflow-hidden">
                                    <div className="bg-green-100/80 px-4 py-2 font-bold text-green-800 flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> ขึ้นทะเบียน (Register)
                                    </div>
                                    <div className="p-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">สุนัข</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-green-400"
                                                value={breakdown.dog.register} onChange={(e) => handleBreakdownChange('dog', 'register', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">แมว</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-green-400"
                                                value={breakdown.cat.register} onChange={(e) => handleBreakdownChange('cat', 'register', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                {/* ✅ 5. รักษาสัตว์ (Medical Treatment) - เพิ่มใหม่ */}
                                <div className="bg-rose-50/50 rounded-xl border border-rose-100 overflow-hidden lg:col-span-2">
                                    <div className="bg-rose-100/80 px-4 py-2 font-bold text-rose-800 flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4" /> รักษาสัตว์ (Medical Treatment)
                                    </div>
                                    <div className="p-4 grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">สุนัข</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-rose-400"
                                                value={breakdown.dog.medical} onChange={(e) => handleBreakdownChange('dog', 'medical', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">แมว</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-rose-400"
                                                value={breakdown.cat.medical} onChange={(e) => handleBreakdownChange('cat', 'medical', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">อื่น ๆ</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-rose-400"
                                                value={breakdown.other.medical} onChange={(e) => handleBreakdownChange('other', 'medical', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Summary Block */}
                        <div className="bg-slate-800 rounded-xl overflow-hidden text-white shadow-lg mt-4">
                            <div className="bg-slate-900 px-4 py-2 font-bold text-green-400 flex items-center gap-2 border-b border-slate-700">
                                <Activity className="w-4 h-4" /> สรุปยอดรวมอัตโนมัติ (Auto-calculated)
                            </div>
                            {/* ปรับ Grid เป็น 5 คอลัมน์เพื่อรองรับรักษาสัตว์ */}
                            <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-blue-400">{totals.vaccine}</div>
                                    <div className="text-[10px] text-slate-400 uppercase">รวมวัคซีน</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-orange-400">{totals.sterilize}</div>
                                    <div className="text-[10px] text-slate-400 uppercase">รวมทำหมัน</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-400">{totals.register}</div>
                                    <div className="text-[10px] text-slate-400 uppercase">รวมขึ้นทะเบียน</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-purple-400">{totals.microchip}</div>
                                    <div className="text-[10px] text-slate-400 uppercase">รวมไมโครชิป</div>
                                </div>
                                {/* ✅ เพิ่มแสดงผลรวมรักษา */}
                                <div>
                                    <div className="text-2xl font-bold text-rose-400">{totals.medical}</div>
                                    <div className="text-[10px] text-slate-400 uppercase">รวมรักษา</div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Action Button */}
                    <div className="bg-white border-t border-slate-200 p-6 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-base">
                            <Save className="w-5 h-5" />
                            {initialData ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลเข้าระบบ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDataModal;