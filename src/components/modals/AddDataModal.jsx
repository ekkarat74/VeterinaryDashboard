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
        otherUnit: '',
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
                const isStandardUnit = UNIT_TYPES.includes(initialData.unit);

                setFormData({
                    date: initialData.date,
                    location: initialData.location,
                    district: initialData.district ? initialData.district.trim() : '',
                    subdistrict: initialData.subdistrict ? initialData.subdistrict.trim() : '', 
                    unit: isStandardUnit ? initialData.unit : 'หน่วยอื่น ๆ',
                    otherUnit: !isStandardUnit ? initialData.unit : '',
                    lat: initialData.lat,
                    long: initialData.long
                });

                if (initialData.lat && initialData.long) {
                    setCoordInput(`${initialData.lat}, ${initialData.long}`);
                } else {
                    setCoordInput("");
                }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialData]);

    // คำนวณยอดรวมอัตโนมัติ (Auto-calculation)
    const totals = useMemo(() => {
        const parse = (val) => parseInt(val) || 0;
        const { dog, cat, other } = breakdown;

        return {
            vaccine: parse(dog.vaccine) + parse(cat.vaccine) + parse(other.vaccine),
            sterilize: parse(dog.maleSterilize) + parse(dog.femaleSterilize) + parse(cat.maleSterilize) + parse(cat.femaleSterilize),
            register: parse(dog.register) + parse(cat.register),
            microchip: parse(dog.microchip) + parse(cat.microchip),
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
            [type]: { ...prev[type], [field]: value }
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

        const dataPayload = {
            ...formData,
            unit: formData.unit === 'หน่วยอื่น ๆ' && formData.otherUnit.trim() !== '' 
                ? formData.otherUnit : formData.unit,
            lat: formData.lat ? parseFloat(formData.lat) : 0,
            long: formData.long ? parseFloat(formData.long) : 0,
            stats: { ...totals },
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

    // Common input style
    const inputClass = "w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400";
    const labelClass = "block text-xs font-semibold text-slate-600 mb-1.5";

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">

                {/* Header (Clean & Modern) */}
                <div className="px-6 py-5 flex justify-between items-center shrink-0 border-b border-slate-100 bg-white z-10">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${initialData ? 'bg-amber-100/50 text-amber-600' : 'bg-blue-100/50 text-blue-600'}`}>
                            {initialData ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">
                                {initialData ? 'แก้ไขข้อมูลการปฏิบัติงาน' : 'บันทึกผลการปฏิบัติงานใหม่'}
                            </h3>
                            <p className="text-slate-500 text-sm mt-0.5">
                                {initialData ? 'ปรับปรุงข้อมูลการลงพื้นที่ในระบบ' : 'กรอกข้อมูลพื้นฐานและรายละเอียดเชิงปริมาณให้ครบถ้วน'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2.5 rounded-full transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden bg-slate-50/30">
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                        {/* SECTION 1: General Info */}
                        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                                ข้อมูลทั่วไป (General Information)
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                <div className="md:col-span-3">
                                    <label className={labelClass}>วันที่เริ่มกิจกรรม</label>
                                    <input required type="date" className={inputClass} 
                                        value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                                <div className="md:col-span-3">
                                    <label className={labelClass}>หน่วยกิจกรรม</label>
                                    <select className={inputClass}
                                        value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                                        {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                    {formData.unit === 'หน่วยอื่น ๆ' && (
                                        <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                                            <input required type="text" placeholder="โปรดระบุชื่อหน่วย..." 
                                                className="w-full px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-blue-800 placeholder:text-blue-400 transition-all"
                                                value={formData.otherUnit} onChange={e => setFormData({...formData, otherUnit: e.target.value})} />
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-6">
                                    <label className={labelClass}>สถานที่ (Location)</label>
                                    <input required type="text" placeholder="ระบุจุดสังเกต/สถานที่ตั้ง" className={inputClass}
                                        value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                                </div>

                                <div className="md:col-span-3">
                                    <label className={labelClass}>เขต (District)</label>
                                    <select className={inputClass} value={formData.district} 
                                        onChange={e => setFormData({...formData, district: e.target.value, subdistrict: ''})}>
                                        {BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-3">
                                    <label className={labelClass}>แขวง (Sub-district)</label>
                                    <select required className={inputClass} value={formData.subdistrict} 
                                        onChange={e => setFormData({...formData, subdistrict: e.target.value})} disabled={!formData.district}>
                                        <option value="">-- เลือกแขวง --</option>
                                        {formData.district && BANGKOK_SUBDISTRICTS[formData.district] ? (
                                            BANGKOK_SUBDISTRICTS[formData.district].map(sub => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))
                                        ) : (
                                            <option value="" disabled>ไม่มีข้อมูลแขวง</option>
                                        )}
                                    </select>
                                </div>

                                <div className="md:col-span-6">
                                    <label className={labelClass}>พิกัดภูมิศาสตร์ (Latitude, Longitude)</label>
                                    <div className="relative">
                                        <input type="text" placeholder="เช่น 13.6096, 100.4655" 
                                            className={`${inputClass} pl-10 font-mono`}
                                            value={coordInput} 
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setCoordInput(value);
                                                if (value.includes(',')) {
                                                    const parts = value.split(',');
                                                    setFormData({ ...formData, lat: parts[0].trim(), long: parts[1].trim() });
                                                } else {
                                                    setFormData({ ...formData, lat: value.trim(), long: '' });
                                                }
                                            }} 
                                        />
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>

                                {/* อัปโหลดรูปภาพ */}
                                <div className="md:col-span-12 mt-2 pt-5 border-t border-slate-100">
                                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-100 rounded-lg"><ImageIcon className="w-4 h-4 text-slate-600" /></div>
                                        รูปภาพประกอบ (Image Attachment)
                                    </label>
                                    {!imagePreview ? (
                                        <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors relative group h-36 flex flex-col items-center justify-center cursor-pointer">
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
                                            <div className="bg-white p-3 rounded-full shadow-sm border border-slate-100 mb-3 group-hover:scale-110 group-hover:text-blue-500 transition-all text-slate-400">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium">คลิกเพื่ออัปโหลดรูปภาพประกอบ</p>
                                        </div>
                                    ) : (
                                        <div className="relative w-full sm:w-80 h-48 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover"/>
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={handleRemoveImage} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2 transition-colors">
                                                    <Trash2 className="w-4 h-4" /> ลบรูปภาพ
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: Quantitative Data */}
                        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span>
                                ข้อมูลเชิงปริมาณ (Quantitative Data)
                            </h4>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                                {/* 1. ฉีดวัคซีน */}
                                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 font-semibold text-slate-700 flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Syringe className="w-4 h-4" /></div>
                                        ฉีดวัคซีน (Vaccine)
                                    </div>
                                    <div className="p-4 grid grid-cols-3 gap-3">
                                        {['dog', 'cat', 'other'].map((type) => (
                                            <div key={type}>
                                                <label className="text-xs text-slate-500 font-medium block mb-1.5">{type === 'dog' ? 'สุนัข' : type === 'cat' ? 'แมว' : 'อื่นๆ'}</label>
                                                <input type="number" min="0" placeholder="0" className={inputClass + " text-center font-medium"}
                                                    value={breakdown[type].vaccine} onChange={(e) => handleBreakdownChange(type, 'vaccine', e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. รักษาสัตว์ */}
                                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 font-semibold text-slate-700 flex items-center gap-2">
                                        <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg"><Stethoscope className="w-4 h-4" /></div>
                                        รักษาสัตว์ (Medical)
                                    </div>
                                    <div className="p-4 grid grid-cols-3 gap-3">
                                        {['dog', 'cat', 'other'].map((type) => (
                                            <div key={type}>
                                                <label className="text-xs text-slate-500 font-medium block mb-1.5">{type === 'dog' ? 'สุนัข' : type === 'cat' ? 'แมว' : 'อื่นๆ'}</label>
                                                <input type="number" min="0" placeholder="0" className={inputClass + " text-center font-medium"}
                                                    value={breakdown[type].medical} onChange={(e) => handleBreakdownChange(type, 'medical', e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 3. ทำหมัน */}
                                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm lg:row-span-2">
                                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 font-semibold text-slate-700 flex items-center gap-2">
                                        <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><Scissors className="w-4 h-4" /></div>
                                        ทำหมัน (Sterilization)
                                    </div>
                                    <div className="p-5 space-y-6">
                                        {['dog', 'cat'].map((type) => (
                                            <div key={type} className="space-y-3">
                                                <div className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">
                                                    {type === 'dog' ? '🐶 สุนัข' : '🐱 แมว'}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs text-slate-500 font-medium block mb-1.5">เพศผู้</label>
                                                        <input type="number" min="0" placeholder="0" className={inputClass + " text-center font-medium"}
                                                            value={breakdown[type].maleSterilize} onChange={(e) => handleBreakdownChange(type, 'maleSterilize', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-500 font-medium block mb-1.5">เพศเมีย</label>
                                                        <input type="number" min="0" placeholder="0" className={inputClass + " text-center font-medium"}
                                                            value={breakdown[type].femaleSterilize} onChange={(e) => handleBreakdownChange(type, 'femaleSterilize', e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. ฝังไมโครชิป */}
                                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 font-semibold text-slate-700 flex items-center gap-2">
                                        <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg"><Database className="w-4 h-4" /></div>
                                        ฝังไมโครชิป (Microchip)
                                    </div>
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        {['dog', 'cat'].map((type) => (
                                            <div key={type}>
                                                <label className="text-xs text-slate-500 font-medium block mb-1.5">{type === 'dog' ? 'สุนัข' : 'แมว'}</label>
                                                <input type="number" min="0" placeholder="0" className={inputClass + " text-center font-medium"}
                                                    value={breakdown[type].microchip} onChange={(e) => handleBreakdownChange(type, 'microchip', e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 5. ขึ้นทะเบียน */}
                                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 font-semibold text-slate-700 flex items-center gap-2">
                                        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><FileText className="w-4 h-4" /></div>
                                        ขึ้นทะเบียน (Register)
                                    </div>
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        {['dog', 'cat'].map((type) => (
                                            <div key={type}>
                                                <label className="text-xs text-slate-500 font-medium block mb-1.5">{type === 'dog' ? 'สุนัข' : 'แมว'}</label>
                                                <input type="number" min="0" placeholder="0" className={inputClass + " text-center font-medium"}
                                                    value={breakdown[type].register} onChange={(e) => handleBreakdownChange(type, 'register', e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Summary Block (Redesigned) */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
                            <div className="font-bold text-blue-800 flex items-center gap-2 mb-4">
                                <Activity className="w-5 h-5 text-blue-600" /> สรุปยอดรวมอัตโนมัติ
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {[
                                    { label: 'วัคซีน', value: totals.vaccine, color: 'text-blue-600' },
                                    { label: 'รักษาสัตว์', value: totals.medical, color: 'text-rose-600' },
                                    { label: 'ทำหมัน', value: totals.sterilize, color: 'text-orange-600' },
                                    { label: 'ไมโครชิป', value: totals.microchip, color: 'text-purple-600' },
                                    { label: 'ขึ้นทะเบียน', value: totals.register, color: 'text-emerald-600' },
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white rounded-xl p-3 border border-white/50 shadow-sm text-center">
                                        <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                                        <div className="text-xs text-slate-500 font-medium mt-1">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Action Button */}
                    <div className="bg-white border-t border-slate-100 p-5 shrink-0 z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.03)] flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                            ยกเลิก
                        </button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                            <Save className="w-5 h-5" />
                            {initialData ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDataModal;