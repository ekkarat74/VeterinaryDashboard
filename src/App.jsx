เพิ่มปุ่มกดบันทึกจุดเกิดเหตุโรคพิษสุนัขบ้า หน่อย ข้อมูลมี วันที่ สถานที่ Latitude-Longitude เขต 

เอาเฉพาะส่วนที่เพิ่มและแก้ไข

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Area, ComposedChart, Brush
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { 
  Activity, Syringe, Scissors, FileText, MapPin, 
  Filter, Calendar, Database, Download, Users, 
  Map as MapIcon, ChevronDown, CheckCircle, Plus, X, Save,
  Calculator, Navigation, LocateFixed, Upload, Search, Pencil, Edit, Trash2, Zap, Eye, Lock, Unlock, Image as ImageIcon
} from 'lucide-react';
import L from 'leaflet';

// --- CONSTANTS ---
const UNIT_TYPES = ['หน่วยวัคซีน + ไมโครชิป', 'หน่วยกรงแมว', 'หน่วยสัตวแพทย์', 'หน่วยผู้ว่า'];

// Updated District List as requested (50 Districts)
const BANGKOK_DISTRICTS = [
  // ฝั่งธนบุรี (15 เขต)
  "เขตธนบุรี", "เขตบางกอกใหญ่", "เขตคลองสาน", "เขตตลิ่งชัน", "เขตบางกอกน้อย", 
  "เขตบางขุนเทียน", "เขตภาษีเจริญ", "เขตหนองแขม", "เขตราษฎร์บูรณะ", "เขตบางพลัด", 
  "เขตจอมทอง", "เขตบางแค", "เขตทวีวัฒนา", "เขตทุ่งครุ", "เขตบางบอน",
  // ฝั่งพระนคร (35 เขต)
  "เขตพระนคร", "เขตดุสิต", "เขตหนองจอก", "เขตบางรัก", "เขตบางเขน", 
  "เขตบางกะปิ", "เขตปทุมวัน", "เขตป้อมปราบศัตรูพ่าย", "เขตพระโขนง", "เขตมีนบุรี", 
  "เขตลาดกระบัง", "เขตยานนาวา", "เขตสัมพันธวงศ์", "เขตพญาไท", "เขตห้วยขวาง", 
  "เขตดินแดง", "เขตบึงกุ่ม", "เขตสาทร", "เขตบางซื่อ", "เขตจตุจักร", 
  "เขตบางคอแหลม", "เขตประเวศ", "เขตคลองเตย", "เขตสวนหลวง", "เขตดอนเมือง", 
  "เขตราชเทวี", "เขตลาดพร้าว", "เขตวัฒนา", "เขตหลักสี่", "เขตสายไหม", 
  "เขตคันนายาว", "เขตสะพานสูง", "เขตวังทองหลาง", "เขตคลองสามวา", "เขตบางนา"
];

// --- COMPONENTS ---

const KPICard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value.toLocaleString()}</h3>
      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
        {subtext}
      </p>
    </div>
    <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10 shadow-inner`}>
      <Icon className={`w-7 h-7 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

// ฟังก์ชันเลือกสีจุด (คงเดิม)
const getMarkerColor = (unit) => {
  switch (unit) {
    case 'หน่วยผู้ว่า': return '#a855f7'; // สีม่วง
    case 'หน่วยสัตวแพทย์': return '#3b82f6'; // สีฟ้า
    case 'หน่วยวัคซีน + ไมโครชิป': return '#22c55e'; // สีเขียว
    case 'หน่วยกรงแมว': return '#f97316'; // สีส้ม
    default: return '#64748b';
  }
};

// --- ส่วนที่แก้ไข: LeafletMap Component ---
const LeafletMap = ({ data }) => {
  const centerPosition = [13.7563, 100.5018];

  // State สำหรับเก็บว่าหน่วยงานไหนเปิดแสดงอยู่บ้าง (เริ่มต้นแสดงทั้งหมด)
  const [activeLayers, setActiveLayers] = useState(UNIT_TYPES);

  // ฟังก์ชัน Toggle การแสดงผล
  const toggleLayer = (unit) => {
    setActiveLayers(prev => 
      prev.includes(unit) 
        ? prev.filter(u => u !== unit) 
        : [...prev, unit]              
    );
  };

  // ฟังก์ชันเลือกสี
  const getMarkerColor = (unit) => {
    switch (unit) {
      case 'หน่วยผู้ว่า': return '#a855f7'; 
      case 'หน่วยสัตวแพทย์': return '#3b82f6'; 
      case 'หน่วยวัคซีน + ไมโครชิป': return '#22c55e'; 
      case 'หน่วยกรงแมว': return '#f97316'; 
      default: return '#64748b';
    }
  };

  // กรองข้อมูลเฉพาะ Layer ที่เปิดอยู่
  const displayData = useMemo(() => {
    return data.filter(item => activeLayers.includes(item.unit));
  }, [data, activeLayers]);

  // ฟังก์ชันสร้าง Custom Icon (แบบนิ่ง ไม่มี Pulse)
  const createNumberIcon = (total, color) => {
    // กำหนดขนาด (32px สำหรับเลขเยอะ, 28px สำหรับเลขน้อย)
    const size = total > 999 ? 32 : 28;
    
    return L.divIcon({
      className: 'custom-marker-wrapper', 
      html: `
        <div class="marker-container" style="--marker-color: ${color}; width: ${size}px; height: ${size}px;">
          <div class="marker-content">
            ${total.toLocaleString()}
          </div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 5)]
    });
  };

  return (
    <div className="w-full h-full flex flex-col relative z-0">
      
      {/* Filter Bar controls */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-100 max-w-[200px]">
        <div className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> กรองบนแผนที่
        </div>
        {UNIT_TYPES.map((unit) => {
            const color = getMarkerColor(unit);
            const isActive = activeLayers.includes(unit);
            return (
                <button
                    key={unit}
                    onClick={() => toggleLayer(unit)}
                    className={`text-[10px] py-1.5 px-3 rounded-lg font-bold transition-all flex items-center gap-2 border w-full text-left
                        ${isActive 
                            ? 'bg-white shadow-sm' 
                            : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100 grayscale'
                        }
                    `}
                    style={isActive ? { borderColor: color, color: '#334155' } : {}}
                >
                    <span 
                        className={`w-2.5 h-2.5 rounded-full shadow-sm transition-transform ${isActive ? 'scale-100' : 'scale-0'}`}
                        style={{ backgroundColor: color }}
                    ></span>
                    <span className="truncate">{unit}</span>
                </button>
            )
        })}
      </div>

      <style>{`
        .custom-marker-wrapper { background: transparent; border: none; }
        
        .marker-container {
          position: relative; display: flex; align-items: center; justify-content: center;
          /* ยังคง Transition ไว้เพื่อให้เวลาเมาส์ชี้ (Hover) มันขยายแบบนุ่มนวล */
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
          cursor: pointer;
        }

        /* Effect ตอนเอาเมาส์ชี้ยังคงไว้ (ขยายใหญ่ขึ้น) */
        .marker-container:hover { transform: scale(1.2); z-index: 1000; }

        .marker-content {
          width: 100%; height: 100%; border-radius: 50%;
          background-color: var(--marker-color);
          /* ไล่สีจางลง */
          background: radial-gradient(circle, var(--marker-color) 30%, rgba(255,255,255,0.8) 150%);
          border: none;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
          display: flex; align-items: center; justify-content: center;
          color: white; 
          font-weight: 800; 
          font-size: 11px; 
          font-family: 'Sarabun', sans-serif;
          position: relative; z-index: 2;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
      `}</style>

      <div className="flex-1 w-full h-full rounded-xl overflow-hidden">
        <MapContainer 
            center={centerPosition} 
            zoom={10} 
            scrollWheelZoom={true} 
            style={{ height: "100%", width: "100%", background: "#f8fafc", zIndex: 0 }}
        >
            <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* ครอบ Marker ด้วย MarkerClusterGroup เพื่อจับกลุ่ม */}
            <MarkerClusterGroup chunkedLoading>
                {displayData.map((item) => {
                if (!item.lat || !item.long) return null;

                const stats = item.stats || { vaccine: 0, sterilize: 0, register: 0, microchip: 0 };
                const totalActivity = stats.vaccine + stats.sterilize + stats.register + stats.microchip;
                const color = getMarkerColor(item.unit);

                return (
                    <Marker
                    key={item._id || item.id}
                    position={[parseFloat(item.lat), parseFloat(item.long)]}
                    icon={createNumberIcon(totalActivity, color)}
                    >
                    <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                        <div className="text-center font-sans">
                        <span className="font-bold text-slate-800">{item.location}</span>
                        <div className="text-xs text-slate-500">รวม: {totalActivity.toLocaleString()} ตัว</div>
                        </div>
                    </Tooltip>

                    <Popup>
                        <div className="font-sans min-w-[200px] p-1">
                        {/* --- [เพิ่มใหม่] แสดงรูปด้านบน Popup --- */}
        {item.imageUrl && (
            <div className="mb-3 w-full h-32 rounded-lg overflow-hidden border border-slate-100 relative">
                <img src={item.imageUrl} alt="site" className="w-full h-full object-cover" />
            </div>
        )} 
                        <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-2 text-sm">
                            {item.unit}
                        </h3>
                        <p className="text-[10px] text-slate-500 mb-3 flex items-start gap-1">
                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> 
                            {item.location} ({item.district})
                        </p>
                        
                        <div className="space-y-2 bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-blue-600 font-semibold">
                                    <Syringe className="w-3 h-3" /> วัคซีน
                                </div>
                                <span className="font-bold text-slate-700">{stats.vaccine.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-orange-500 font-semibold">
                                    <Scissors className="w-3 h-3" /> ทำหมัน
                                </div>
                                <span className="font-bold text-slate-700">{stats.sterilize.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-green-600 font-semibold">
                                    <FileText className="w-3 h-3" /> ลงทะเบียน
                                </div>
                                <span className="font-bold text-slate-700">{stats.register.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-purple-600 font-semibold">
                                    <Database className="w-3 h-3" /> ไมโครชิป
                                </div>
                                <span className="font-bold text-slate-700">{stats.microchip.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-1">
                                <div className="font-bold text-slate-900">รวมทั้งหมด</div>
                                <span className="font-bold text-slate-900 text-sm">{totalActivity.toLocaleString()}</span>
                            </div>
                        </div>
                        </div>
                    </Popup>
                    </Marker>
                );
                })}
            </MarkerClusterGroup>
        </MapContainer>
      </div>
      
    </div>
  );
};
      
// --- NEW COMPONENT: IMAGE PREVIEW MODAL ---
const ImagePreviewModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose} // คลิกพื้นที่ว่างเพื่อปิด
    >
      <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
        {/* ปุ่มปิด */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* รูปภาพ */}
        <img 
          src={imageUrl} 
          alt="Full Preview" 
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
          onClick={(e) => e.stopPropagation()} // คลิกที่รูปจะไม่ปิด
        />
      </div>
    </div>
  );
};

// --- UPDATED ADD/EDIT DATA MODAL ---
const AddDataModal = ({ isOpen, onClose, onSave, onUpdate, initialData }) => {
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
    dog: { maleSterilize: '', femaleSterilize: '', maleVaccine: '', femaleVaccine: '', register: '', microchip: '' },
    cat: { maleSterilize: '', femaleSterilize: '', maleVaccine: '', femaleVaccine: '', register: '', microchip: '' },
    other: { vaccine: '' }
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [breakdown, setBreakdown] = useState(defaultBreakdown);

  // [เพิ่มใหม่] State สำหรับจัดการรูปภาพ
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Effect: โหลดข้อมูลเดิมเมื่อเปิด Modal ในโหมดแก้ไข หรือ รีเซ็ตเมื่อเพิ่มใหม่
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // กรณีแก้ไข: โหลดข้อมูลเดิมเข้า State
        setFormData({
            date: initialData.date,
            location: initialData.location,
            district: initialData.district,
            subdistrict: initialData.subdistrict,
            unit: initialData.unit,
            lat: initialData.lat,
            long: initialData.long
        });
        // โหลดข้อมูลตัวเลข
        if (initialData.details) {
            setBreakdown(initialData.details);
        } else {
            setBreakdown(defaultBreakdown);
        }
        
        // [เพิ่มใหม่] โหลดรูปภาพเดิม (ถ้ามี)
        if (initialData.imageUrl) {
            setImagePreview(initialData.imageUrl);
        } else {
            setImagePreview(null);
            setImageFile(null);
        }

      } else {
        // กรณีเพิ่มใหม่: ล้างค่าเป็น default
        setFormData(defaultFormData);
        setBreakdown(defaultBreakdown);
        // [เพิ่มใหม่] ล้างรูปภาพ
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
      // แก้ไขสูตรคำนวณวัคซีน
      vaccine: parse(dog.maleVaccine) + parse(dog.femaleVaccine) + parse(cat.maleVaccine) + parse(cat.femaleVaccine) + parse(other.vaccine),
      sterilize: parse(dog.maleSterilize) + parse(dog.femaleSterilize) + parse(cat.maleSterilize) + parse(cat.femaleSterilize),
      register: parse(dog.register) + parse(cat.register),
      microchip: parse(dog.microchip) + parse(cat.microchip),
    };
  }, [breakdown]);

  // [เพิ่มใหม่] ฟังก์ชันจัดการการเลือกไฟล์รูป
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // สร้าง URL ชั่วคราวเพื่อแสดง Preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // [เพิ่มใหม่] ฟังก์ชันลบรูป
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  if (!isOpen) return null;

  // ฟังก์ชันจัดการการเปลี่ยนค่าใน breakdown (Nested State)
  const handleBreakdownChange = (type, field, value) => {
    setBreakdown(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value 
      }
    }));
  };

const handleSubmit = async (e) => { // 2.1 เพิ่ม async เพราะต้องรอแปลงรูป
    e.preventDefault();
    
    // 2.2 แปลงรูปภาพเป็น Base64 (ถ้ามีการเลือกไฟล์ใหม่)
    let finalImageUrl = initialData?.imageUrl || ""; // ใช้รูปเดิมถ้ามี
    
    if (imageFile) {
        try {
            finalImageUrl = await convertToBase64(imageFile);
        } catch (error) {
            console.error("Error converting image:", error);
            alert("ไม่สามารถประมวลผลรูปภาพได้");
            return;
        }
    } else if (imagePreview === null) {
        // กรณี user กดลบรูป
        finalImageUrl = "";
    }

    // เตรียมข้อมูล Payload
    const dataPayload = {
      ...formData,
      lat: formData.lat ? parseFloat(formData.lat) : 0,
      long: formData.long ? parseFloat(formData.long) : 0,
      vaccine: totals.vaccine,
      sterilize: totals.sterilize,
      register: totals.register,
      microchip: totals.microchip,
      details: breakdown,
      imageUrl: finalImageUrl // 2.3 ส่งเป็น String Base64 ไปเก็บ
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
    // ปรับ z-index เป็น z-[2000] เพื่อให้อยู่เหนือ Map และ Header
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header ของ Modal */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0 border-b border-slate-700">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {initialData ? <Edit className="w-5 h-5 text-yellow-400" /> : <Plus className="w-5 h-5 text-green-400" />}
              {initialData ? 'แก้ไขข้อมูลการปฏิบัติงาน' : 'บันทึกผลการปฏิบัติงานใหม่'}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
                {initialData ? 'ปรับปรุงข้อมูลในระบบ' : 'กรอกข้อมูลพื้นฐานและรายละเอียดเชิงปริมาณแยกตามประเภทสัตว์'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Section 1: General Info */}
            <div className="space-y-4">
               <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> ข้อมูลทั่วไป (General Information)
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* แถว 1: วันที่, หน่วย, สถานที่ */}
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

                  {/* แถว 2: เขต, แขวง, พิกัด */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">เขต (District)</label>
                    <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})}>
                      {BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">แขวง (Sub-district)</label>
                    <input required type="text" placeholder="ระบุแขวง" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.subdistrict} onChange={e => setFormData({...formData, subdistrict: e.target.value})} />
                  </div>
                  
                  <div className="md:col-span-6">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-blue-500" /> 
                      พิกัดภูมิศาสตร์ (Latitude, Longitude)
                    </label>
                    <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        placeholder="เช่น 13.609673, 100.465504" 
                        className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        value={formData.lat && formData.long ? `${formData.lat}, ${formData.long}` : (formData.lat || formData.long || "")}
                        onChange={(e) => {
                        const value = e.target.value;
                        if (value.includes(',')) {
                          const [lat, lng] = value.split(',').map(s => s.trim());
                          setFormData({ ...formData, lat, long: lng });
                        } else {
                          setFormData({ ...formData, lat: value });
                        }
                      }} 
                      />
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">* สามารถคัดลอกจาก Google Maps มาวางได้เลย (รูปแบบ: lat, long)</p>
                   </div>

                   {/* --- [ส่วนที่เพิ่มใหม่] : อัปโหลดรูปภาพ --- */}
                   <div className="md:col-span-12 mt-2 pt-4 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-blue-500" /> 
                      รูปภาพประกอบ (Image Attachment)
                    </label>
                    
                    {!imagePreview ? (
                      <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors relative group h-32 flex flex-col items-center justify-center cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">คลิกเพื่ออัปโหลดรูปภาพ</p>
                        <p className="text-[10px] text-slate-400 mt-1">รองรับไฟล์ JPG, PNG</p>
                      </div>
                    ) : (
                      <div className="relative w-full h-48 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="cursor-pointer bg-white/90 hover:bg-white text-slate-700 p-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1 transition-transform hover:scale-105">
                            <Edit className="w-3 h-3" /> เปลี่ยนรูป
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                          <button 
                            type="button"
                            onClick={handleRemoveImage}
                            className="bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1 transition-transform hover:scale-105"
                          >
                            <Trash2 className="w-3 h-3" /> ลบ
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* --- จบส่วนที่เพิ่มใหม่ --- */}

               </div>
            </div>

            {/* Section 2: Quantitative Data */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-orange-600" /> ข้อมูลเชิงปริมาณ (Quantitative Data)
                </h4>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Group: DOG */}
                <div className="bg-blue-50/50 rounded-xl border border-blue-100 overflow-hidden">
                   <div className="bg-blue-100/80 px-4 py-2 font-bold text-blue-800 flex items-center gap-2">
                      <span className="text-xl">🐕</span> สุนัข (Dog)
                   </div>
                   <div className="p-4 space-y-4">
                      {/* Row 1: ทำหมัน (Sterilize) */}
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ทำหมัน (ตัวผู้)</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-blue-400 outline-none text-center"
                              value={breakdown.dog.maleSterilize} onChange={(e) => handleBreakdownChange('dog', 'maleSterilize', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ทำหมัน (ตัวเมีย)</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-blue-400 outline-none text-center"
                              value={breakdown.dog.femaleSterilize} onChange={(e) => handleBreakdownChange('dog', 'femaleSterilize', e.target.value)} />
                          </div>
                      </div>
                      
                      {/* Row 2: วัคซีน (Vaccine) - แก้ไขใหม่แยกเพศ */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-100">
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase text-blue-600">ฉีดวัคซีน (ตัวผู้)</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-blue-400 outline-none text-center"
                              value={breakdown.dog.maleVaccine} onChange={(e) => handleBreakdownChange('dog', 'maleVaccine', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase text-blue-600">ฉีดวัคซีน (ตัวเมีย)</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-blue-400 outline-none text-center"
                              value={breakdown.dog.femaleVaccine} onChange={(e) => handleBreakdownChange('dog', 'femaleVaccine', e.target.value)} />
                          </div>
                      </div>

                      {/* Row 3: Register & Microchip */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-100">
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ขึ้นทะเบียน</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-blue-400 outline-none text-center"
                              value={breakdown.dog.register} onChange={(e) => handleBreakdownChange('dog', 'register', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ฝังไมโครชิป</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-blue-400 outline-none text-center"
                              value={breakdown.dog.microchip} onChange={(e) => handleBreakdownChange('dog', 'microchip', e.target.value)} />
                          </div>
                      </div>
                   </div>
                </div>

                {/* Group: CAT */}
                <div className="bg-orange-50/50 rounded-xl border border-orange-100 overflow-hidden">
                   <div className="bg-orange-100/80 px-4 py-2 font-bold text-orange-800 flex items-center gap-2">
                      <span className="text-xl">🐈</span> แมว (Cat)
                   </div>
                   <div className="p-4 space-y-4">
                      {/* Row 1: ทำหมัน (Sterilize) */}
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ทำหมัน (ตัวผู้)</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-orange-400 outline-none text-center"
                              value={breakdown.cat.maleSterilize} onChange={(e) => handleBreakdownChange('cat', 'maleSterilize', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ทำหมัน (ตัวเมีย)</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-orange-400 outline-none text-center"
                               value={breakdown.cat.femaleSterilize} onChange={(e) => handleBreakdownChange('cat', 'femaleSterilize', e.target.value)} />
                          </div>
                      </div>
                      
                      {/* Row 2: วัคซีน (Vaccine) - แก้ไขใหม่แยกเพศ */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-orange-100">
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase text-orange-600">ฉีดวัคซีน (ตัวผู้)</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-orange-400 outline-none text-center"
                               value={breakdown.cat.maleVaccine} onChange={(e) => handleBreakdownChange('cat', 'maleVaccine', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase text-orange-600">ฉีดวัคซีน (ตัวเมีย)</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-orange-400 outline-none text-center"
                               value={breakdown.cat.femaleVaccine} onChange={(e) => handleBreakdownChange('cat', 'femaleVaccine', e.target.value)} />
                          </div>
                      </div>

                      {/* Row 3: Register & Microchip */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-orange-100">
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ขึ้นทะเบียน</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-orange-400 outline-none text-center"
                               value={breakdown.cat.register} onChange={(e) => handleBreakdownChange('cat', 'register', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ฝังไมโครชิป</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-orange-400 outline-none text-center"
                               value={breakdown.cat.microchip} onChange={(e) => handleBreakdownChange('cat', 'microchip', e.target.value)} />
                          </div>
                      </div>
                   </div>
                </div>

                {/* Group: CAT */}
                <div className="bg-orange-50/50 rounded-xl border border-orange-100 overflow-hidden">
                   <div className="bg-orange-100/80 px-4 py-2 font-bold text-orange-800 flex items-center gap-2">
                      <span className="text-xl">🐈</span> แมว (Cat)
                   </div>
                   <div className="p-4 space-y-4">
                      {/* Sterilize Row */}
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ทำหมัน (ตัวผู้)</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-orange-400 outline-none text-center"
                              value={breakdown.cat.maleSterilize} onChange={(e) => handleBreakdownChange('cat', 'maleSterilize', e.target.value)} />
                         </div>
                         <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ทำหมัน (ตัวเมีย)</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-orange-400 outline-none text-center"
                               value={breakdown.cat.femaleSterilize} onChange={(e) => handleBreakdownChange('cat', 'femaleSterilize', e.target.value)} />
                         </div>
                      </div>
                      
                      {/* Services */}
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-orange-100">
                         <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ฉีดวัคซีน</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-orange-400 outline-none text-center"
                               value={breakdown.cat.vaccine} onChange={(e) => handleBreakdownChange('cat', 'vaccine', e.target.value)} />
                         </div>
                         <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ขึ้นทะเบียน</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-orange-400 outline-none text-center"
                               value={breakdown.cat.register} onChange={(e) => handleBreakdownChange('cat', 'register', e.target.value)} />
                         </div>
                         <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ฝังไมโครชิป</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-orange-400 outline-none text-center"
                               value={breakdown.cat.microchip} onChange={(e) => handleBreakdownChange('cat', 'microchip', e.target.value)} />
                         </div>
                      </div>

                      {/* Status */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-orange-100 bg-orange-50/50 -mx-4 px-4 pb-2 mt-2">
                          <div className="col-span-2 text-xs font-bold text-slate-400 mb-1">สถานะสัตว์ (Animal Status)</div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">มีเจ้าของ</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-orange-400 outline-none text-center"
                               value={breakdown.cat.owned} onChange={(e) => handleBreakdownChange('cat', 'owned', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ชุมชน/จรจัด</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-orange-400 outline-none text-center"
                               value={breakdown.cat.community} onChange={(e) => handleBreakdownChange('cat', 'community', e.target.value)} />
                          </div>
                       </div>
                   </div>
                </div>

                {/* Group: OTHERS & SUMMARY */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Others */}
                   <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden h-fit">
                      <div className="bg-slate-100/80 px-4 py-2 font-bold text-slate-600 flex items-center gap-2">
                         <span className="text-xl">🐇</span> สัตว์อื่นๆ (Others)
                      </div>
                      <div className="p-4">
                         <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ฉีดวัคซีน (ตัว)</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-slate-400 outline-none text-center"
                               value={breakdown.other.vaccine} onChange={(e) => handleBreakdownChange('other', 'vaccine', e.target.value)} />
                         </div>
                      </div>
                   </div>

                   {/* Live Total Summary */}
                   <div className="bg-slate-800 rounded-xl overflow-hidden text-white shadow-lg">
                      <div className="bg-slate-900 px-4 py-2 font-bold text-green-400 flex items-center gap-2 border-b border-slate-700">
                         <Activity className="w-4 h-4" /> สรุปยอดรวมอัตโนมัติ (Auto-calculated)
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-4 text-center">
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
                      </div>
                   </div>
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

// --- NEW COMPONENT: CSV ACTION MODAL ---
const CsvActionModal = ({ isOpen, onClose, onFileChange, onExport }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">จัดการข้อมูล CSV</h3>
          <p className="text-xs text-slate-500">เลือกดำเนินการกับไฟล์ข้อมูล</p>
        </div>

        <div className="space-y-3">
          {/* Import Button */}
          <div className="relative w-full group">
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-bold rounded-xl transition-all">
              <Upload className="w-5 h-5" />
              <span>นำเข้าไฟล์ (Import)</span>
            </button>
            {/* Hidden Input Overlay */}
            <input 
              type="file" 
              accept=".csv" 
              onChange={(e) => {
                onFileChange(e);
                onClose(); // ปิด Modal เมื่อเลือกไฟล์เสร็จ
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="คลิกเพื่อเลือกไฟล์ CSV"
            />
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-slate-400">หรือ</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Export Button */}
          <button 
            onClick={() => {
              onExport();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-100 hover:bg-green-500 hover:text-white text-slate-700 font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <Download className="w-5 h-5" />
            <span>ส่งออกไฟล์ (Export)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function VeterinaryDashboard() {
  // 1. กำหนดค่าเริ่มต้นเป็น Array ว่าง เพื่อรอรับข้อมูลจาก Database
  const [reportData, setReportData] = useState([]);

  const [viewImage, setViewImage] = useState(null);
  
  // URL ของ Backend (ต้องตรงกับที่ตั้งไว้ใน server.js)
  const API_URL = 'http://localhost:5000/api/reports';

  const [editingItem, setEditingItem] = useState(null);

  const [searchTerm, setSearchTerm] = useState(''); // เก็บคำค้นหา (keyword)
  const [searchDate, setSearchDate] = useState('');

  const [selectedYear, setSelectedYear] = useState('ทั้งหมด');
  const [selectedMonth, setSelectedMonth] = useState('ทั้งหมด');

  const [selectedUnit, setSelectedUnit] = useState('ทั้งหมด');
  const [selectedDistrict, setSelectedDistrict] = useState('ทั้งหมด');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const isReadOnly = new URLSearchParams(window.location.search).get('mode') === 'view';

  const [rankingYear, setRankingYear] = useState('ทั้งหมด');
  const [rankingMonth, setRankingMonth] = useState('ทั้งหมด');

  const rankingFilteredData = useMemo(() => {
  return reportData.filter(item => {
    // กรองตามปี
    const [itemYear, itemMonth] = item.date.split('-');
    const yearMatch = rankingYear === 'ทั้งหมด' || itemYear === rankingYear;
    
    // กรองตามเดือน
    const monthMatch = rankingMonth === 'ทั้งหมด' || parseInt(itemMonth) === parseInt(rankingMonth);

    return yearMatch && monthMatch;
  });
}, [reportData, rankingYear, rankingMonth]);

  const rankingUnitStats = useMemo(() => {
  const grouped = rankingFilteredData.reduce((acc, curr) => {
    if (!acc[curr.unit]) {
      acc[curr.unit] = { 
        name: curr.unit, 
        count: 0, 
        vaccine: 0, 
        sterilize: 0, 
        register: 0,   // เพิ่ม
        microchip: 0,  // เพิ่ม
        total: 0 
      };
    }
    acc[curr.unit].count += 1;
    acc[curr.unit].vaccine += curr.stats.vaccine;
    acc[curr.unit].sterilize += curr.stats.sterilize;
    acc[curr.unit].register += curr.stats.register;     // เพิ่มการบวกยอด
    acc[curr.unit].microchip += curr.stats.microchip;
    acc[curr.unit].total += (curr.stats.vaccine + curr.stats.sterilize + curr.stats.register + curr.stats.microchip);
    return acc;
  }, {});
  
  return Object.values(grouped).sort((a, b) => b.total - a.total);
}, [rankingFilteredData]);

// --- [แก้ไข] คำนวณ 5 อันดับเขต จาก rankingFilteredData แทน filteredData ---
const rankingDistrictStats = useMemo(() => {
  const grouped = rankingFilteredData.reduce((acc, curr) => {
    if (!acc[curr.district]) {
      acc[curr.district] = { 
        name: curr.district, 
        vac: 0, 
        ster: 0, 
        total: 0, 
        units: new Set() 
      };
    }
    acc[curr.district].vac += curr.stats.vaccine;
    acc[curr.district].ster += curr.stats.sterilize;
    acc[curr.district].total += (curr.stats.vaccine + curr.stats.sterilize);
    acc[curr.district].units.add(curr.unit); 
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => b.total - a.total);
}, [rankingFilteredData]);

  const handleToggleViewMode = () => {
    const url = new URL(window.location);
    if (isReadOnly) {
      url.searchParams.delete('mode'); // ลบ ?mode=view ออก (กลับเป็น Admin)
    } else {
      url.searchParams.set('mode', 'view'); // ใส่ ?mode=view (เป็น View Only)
    }
    window.location.href = url.toString(); // รีโหลดหน้า
  };

  const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const availableYears = useMemo(() => {
    const years = reportData.map(item => item.date.split('-')[0]); // ดึงปีจาก YYYY-MM-DD
    return [...new Set(years)].sort().reverse(); // Unique และเรียงล่าสุดขึ้นก่อน
  }, [reportData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
    
        if (data && data.length > 0) {
          setReportData(data);
        } else {
          setReportData([]); 
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        setReportData([]); 
      }
    };
    fetchData();
  }, []);

  const handleAddNewData = async (newRecord, showSuccessAlert = true) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: newRecord.date,
          location: newRecord.location,
          lat: parseFloat(newRecord.lat),
          long: parseFloat(newRecord.long),
          district: newRecord.district,
          subdistrict: newRecord.subdistrict,
          unit: newRecord.unit,
          stats: {
            vaccine: newRecord.stats ? newRecord.stats.vaccine : newRecord.vaccine,
            sterilize: newRecord.stats ? newRecord.stats.sterilize : newRecord.sterilize,
            register: newRecord.stats ? newRecord.stats.register : newRecord.register,
            microchip: newRecord.stats ? newRecord.stats.microchip : newRecord.microchip
          },
          details: newRecord.details
        }),
      });

      if (response.ok) {
        const savedRecord = await response.json();
        setReportData(prev => [savedRecord, ...prev]);
        
        if (showSuccessAlert) {
          alert("✅ บันทึกข้อมูลลงฐานข้อมูลสำเร็จ!");
        }
      } else {
        if (showSuccessAlert) alert("❌ ไม่สามารถบันทึกข้อมูลได้");
      }
    } catch (error) {
      console.error("Save Error:", error);
      if (showSuccessAlert) alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
    }
  };

  const handleUpdateData = async (id, updatedRecord) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRecord),
      });

      if (response.ok) {
        const savedRecord = await response.json();
        // อัปเดตข้อมูลใน State โดยแทนที่รายการเดิมด้วยรายการใหม่
        setReportData(prev => prev.map(item => item._id === id ? savedRecord : item));
        alert("✅ แก้ไขข้อมูลสำเร็จ!");
        setEditingItem(null); // เคลียร์สถานะการแก้ไข
      } else {
        alert("❌ ไม่สามารถแก้ไขข้อมูลได้");
      }
    } catch (error) {
      console.error("Update Error:", error);
      alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
    }
  };

  // Helper สำหรับเปิด Modal เพิ่มใหม่
  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Helper สำหรับเปิด Modal แก้ไข
  const openEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteData = async (id) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?")) {
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setReportData(prev => prev.filter(item => item._id !== id));
          alert("✅ ลบข้อมูลสำเร็จ");
        } else {
          alert("❌ ไม่สามารถลบข้อมูลได้");
        }
      } catch (error) {
        console.error("Delete Error:", error);
        alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
      }
    }
  };

  // --- ฟังก์ชันสำหรับลบข้อมูลทั้งหมด ---
  const handleClearAllData = async () => {
    const confirmed = window.confirm(
      "⚠️ คำเตือน: คุณต้องการลบข้อมูลทั้งหมดในระบบใช่หรือไม่?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดจะหายไปถาวร"
    );

    if (!confirmed) return;

    const doubleCheck = window.confirm("ยืนยันการลบข้อมูลทั้งหมด?");
    if (!doubleCheck) return;

    try {
      const response = await fetch(API_URL, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReportData([]);
        alert("✅ ลบข้อมูลทั้งหมดเรียบร้อยแล้ว");
      } else {
        alert("❌ ไม่สามารถลบข้อมูลได้");
      }
    } catch (error) {
      console.error("Clear All Error:", error);
      alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
    }
  };

  // --- ฟังก์ชันจำลองข้อมูล 100 เคส (Mock Data) ---
  const handleGenerateMockData = () => {
    // Helper สุ่มตัวเลข
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    // Helper สุ่มเลือก Array
    const randArr = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const mockItems = Array.from({ length: 100 }).map((_, index) => {
      // สุ่มรายละเอียดภายใน
      const details = {
        dog: {
          maleSterilize: randInt(0, 5),
          femaleSterilize: randInt(0, 5),
          vaccine: randInt(0, 10),
          register: randInt(0, 5),
          microchip: randInt(0, 5),
          owned: randInt(0, 10),
          community: randInt(0, 10)
        },
        cat: {
          maleSterilize: randInt(0, 5),
          femaleSterilize: randInt(0, 5),
          vaccine: randInt(0, 10),
          register: randInt(0, 5),
          microchip: randInt(0, 5),
          owned: randInt(0, 10),
          community: randInt(0, 10)
        },
        other: { vaccine: randInt(0, 2) }
      };

      // คำนวณยอดรวม (Stats)
      const stats = {
        vaccine: details.dog.vaccine + details.cat.vaccine + details.other.vaccine,
        sterilize: details.dog.maleSterilize + details.dog.femaleSterilize + details.cat.maleSterilize + details.cat.femaleSterilize,
        register: details.dog.register + details.cat.register,
        microchip: details.dog.microchip + details.cat.microchip
      };

      // สุ่มพิกัด (กรอบกทม.)
      const lat = (13.6 + Math.random() * 0.3).toFixed(6);
      const long = (100.35 + Math.random() * 0.4).toFixed(6);

      // สุ่มวันที่ (ย้อนหลังไม่เกิน 60 วัน)
      const date = new Date();
      date.setDate(date.getDate() - randInt(0, 60));
      const dateStr = date.toISOString().split('T')[0];

      return {
        _id: `mock_${Date.now()}_${index}`, // สร้าง ID ปลอม
        date: dateStr,
        location: `จุดจำลองที่ ${index + 1}`,
        district: randArr(BANGKOK_DISTRICTS),
        subdistrict: 'แขวงจำลอง',
        unit: randArr(UNIT_TYPES),
        lat: parseFloat(lat),
        long: parseFloat(long),
        details: details,
        stats: stats
      };
    });

    // อัปเดต State ทันที (ไม่ยิง API)
    setReportData(prev => [...mockItems, ...prev]);
    alert(`✅ จำลองข้อมูลเพิ่ม 100 เคสเรียบร้อย\n(ข้อมูลนี้อยู่แค่หน้าจอ จะหายไปเมื่อรีเฟรช)`);
  };

  // --- ฟังก์ชัน Helper สำหรับแยกข้อมูล CSV (รองรับกรณีมี "..." ครอบข้อความ) ---
  const parseCSVLine = (text) => {
    const result = [];
    let start = 0;
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '"') {
        inQuotes = !inQuotes; // สลับสถานะเมื่อเจอเครื่องหมายคำพูด
      } else if (text[i] === ',' && !inQuotes) {
        // ถ้าเจอ comma และไม่ได้อยู่ใน quote ให้ตัดคำ
        let field = text.substring(start, i).trim();
        // ลบเครื่องหมาย " ที่หัวและท้ายออก (ถ้ามี)
        if (field.startsWith('"') && field.endsWith('"')) {
            field = field.substring(1, field.length - 1).replace(/""/g, '"');
        }
        result.push(field);
        start = i + 1;
      }
    }
    // เก็บตกคำสุดท้าย
    let lastField = text.substring(start).trim();
    if (lastField.startsWith('"') && lastField.endsWith('"')) {
        lastField = lastField.substring(1, lastField.length - 1).replace(/""/g, '"');
    }
    result.push(lastField);
    return result;
  };
  
  // --- ฟังก์ชัน Import CSV แบบ Real-time ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      
      let successCount = 0;
      let failCount = 0;

      // แจ้งเตือนผู้ใช้ว่ากำลังเริ่มทำงาน
      // (ถ้ามี Loading State สามารถเปิดตรงนี้ได้)

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        
        if (row.length >= 7) {
             const parseVal = (v) => parseInt(v) || 0;
             const parseFloatVal = (v) => parseFloat(v) || 0;

             const newRecord = {
                 date: row[0],
                 location: row[1],
                 district: row[2],
                 subdistrict: row[3],
                 unit: row[4],
                 lat: parseFloatVal(row[5]),
                 long: parseFloatVal(row[6]),
                 details: {
                     dog: {
                         maleSterilize: parseVal(row[7]),
                         femaleSterilize: parseVal(row[8]),
                         vaccine: parseVal(row[9]),
                         register: parseVal(row[10]),
                         microchip: parseVal(row[11]),
                         owned: parseVal(row[12]),
                         community: parseVal(row[13])
                     },
                     cat: {
                         maleSterilize: parseVal(row[14]),
                         femaleSterilize: parseVal(row[15]),
                         vaccine: parseVal(row[16]),
                         register: parseVal(row[17]),
                         microchip: parseVal(row[18]),
                         owned: parseVal(row[19]),
                         community: parseVal(row[20])
                     },
                     other: {
                         vaccine: parseVal(row[21])
                     }
                 },
                 stats: {
                    vaccine: parseVal(row[9]) + parseVal(row[16]) + parseVal(row[21]),
                    sterilize: parseVal(row[7]) + parseVal(row[8]) + parseVal(row[14]) + parseVal(row[15]),
                    register: parseVal(row[10]) + parseVal(row[17]),
                    microchip: parseVal(row[11]) + parseVal(row[18])
                 }
             };

             try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newRecord),
                });

                if (response.ok) {
                    const savedRecord = await response.json();
                    
                    // --- จุดที่แก้ไข: อัปเดตหน้าจอทันทีทีละรายการ (Real-time) ---
                    setReportData(prev => [savedRecord, ...prev]);
                    // ----------------------------------------------------
                    
                    successCount++;
                } else {
                    console.error(`Failed to import line ${i+1}`);
                    failCount++;
                }
             } catch (err) {
                 console.error(`Error importing line ${i+1}:`, err);
                 failCount++;
             }
             
             // Optional: หน่วงเวลาเล็กน้อยเพื่อให้เห็น Animation ชัดขึ้น (ถ้าต้องการ)
             // await new Promise(r => setTimeout(r, 50)); 
             
        } else {
            failCount++;
        }
      }

      // แจ้งเตือนเมื่อเสร็จสิ้นทั้งหมด
      alert(`นำเข้าข้อมูลเสร็จสิ้น!\n✅ สำเร็จ: ${successCount} รายการ\n❌ ล้มเหลว/ข้าม: ${failCount} รายการ`);
      event.target.value = null;
    };
    reader.readAsText(file);
  };

  const exportToCSV = () => {
    // 1. กำหนดหัวตารางให้ครบทุก Field ตามหน้าบันทึกข้อมูลและไฟล์ Excel ตัวอย่าง
    const headers = [
      // --- ข้อมูลทั่วไป ---
      "วันที่", 
      "สถานที่", 
      "เขต", 
      "แขวง", 
      "หน่วยงาน", 
      "ละติจูด", 
      "ลองจิจูด",
      
      // --- สุนัข (Dog) ---
      "สุนัข-ทำหมัน(ผู้)", 
      "สุนัข-ทำหมัน(เมีย)", 
      "สุนัข-วัคซีน", 
      "สุนัข-ขึ้นทะเบียน", 
      "สุนัข-ฝังไมโครชิป", 
      "สุนัข-มีเจ้าของ", 
      "สุนัข-จรจัด",

      // --- แมว (Cat) ---
      "แมว-ทำหมัน(ผู้)", 
      "แมว-ทำหมัน(เมีย)", 
      "แมว-วัคซีน", 
      "แมว-ขึ้นทะเบียน", 
      "แมว-ฝังไมโครชิป", 
      "แมว-มีเจ้าของ", 
      "แมว-จรจัด",

      // --- อื่นๆ (Other) ---
      "สัตว์อื่นๆ-วัคซีน",

      // --- ยอดรวม (Totals) - เพื่อความสะดวกในการดูภาพรวม
      "รวม-วัคซีน", 
      "รวม-ทำหมัน", 
      "รวม-ขึ้นทะเบียน", 
      "รวม-ฝังไมโครชิป"
    ];
    
    const csvRows = filteredData.map(item => {
      // ดึงข้อมูล details ออกมา ถ้าไม่มีให้เป็น object ว่าง เพื่อป้องกัน error
      const d = item.details || {};
      const dog = d.dog || {};
      const cat = d.cat || {};
      const other = d.other || {};

      // Helper function เพื่อจัดการค่า null/undefined ให้เป็น 0
      const val = (v) => v ? parseInt(v) : 0;

      // จัดรูปแบบวันที่ให้เป็น Text ชัดเจน ป้องกัน Excel แปลงผิด (เช่น ใส่ ' นำหน้า หรือใช้ YYYY-MM-DD ตรงๆ)
      // การใช้ `\t${item.date}` หรือ `'${item.date}` บางทีช่วยบังคับเป็น Text ได้ แต่มาตรฐานสุดคือ YYYY-MM-DD
      const dateStr = item.date; 

      return [
        // 1. General Info
        dateStr,
        `"${item.location.replace(/"/g, '""')}"`, // ใส่เครื่องหมายคำพูดป้องกันกรณีชื่อสถานที่ "
        item.district,
        item.subdistrict,
        item.unit,
        item.lat,
        item.long,

        // 2. Dog Data
        val(dog.maleSterilize),
        val(dog.femaleSterilize),
        val(dog.vaccine),
        val(dog.register),
        val(dog.microchip),
        val(dog.owned),
        val(dog.community),

        // 3. Cat Data
        val(cat.maleSterilize),
        val(cat.femaleSterilize),
        val(cat.vaccine),
        val(cat.register),
        val(cat.microchip),
        val(cat.owned),
        val(cat.community),

        // 4. Other Data
        val(other.vaccine),

        // 5. Grand Totals (จาก stats ที่คำนวณไว้แล้วใน object หลัก)
        item.stats.vaccine,
        item.stats.sterilize,
        item.stats.register,
        item.stats.microchip
      ].join(",");
    });

    // เพิ่ม BOM (\uFEFF) เพื่อให้ Excel อ่านภาษาไทยได้ถูกต้อง
    const csvContent = "\uFEFF" + [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `รายงานผลการปฏิบัติงาน_ละเอียด_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // --- DATA PROCESSING ---

  // 1. Filter Data
  const filteredData = useMemo(() => {
    return reportData.filter(item => {
      const lowerSearch = searchTerm.toLowerCase();
      const textMatch = !searchTerm || 
        item.location.toLowerCase().includes(lowerSearch) ||
        item.district.includes(searchTerm) || 
        item.subdistrict.includes(searchTerm);

      let dateMatch = true;
      if (searchDate) {
        dateMatch = item.date === searchDate;
      } else {
        const [itemYear, itemMonth] = item.date.split('-');
        const yearMatch = selectedYear === 'ทั้งหมด' || itemYear === selectedYear;
        const monthMatch = selectedMonth === 'ทั้งหมด' || parseInt(itemMonth) === parseInt(selectedMonth);
        dateMatch = yearMatch && monthMatch;
      }

      const unitMatch = selectedUnit === 'ทั้งหมด' || item.unit === selectedUnit;
      const districtMatch = selectedDistrict === 'ทั้งหมด' || item.district === selectedDistrict;

      return textMatch && dateMatch && unitMatch && districtMatch;
    });
  }, [reportData, selectedYear, selectedMonth, selectedUnit, selectedDistrict, searchTerm, searchDate]);

  // 2. Calculate Totals (KPIs)
  const totals = useMemo(() => {
    return filteredData.reduce((acc, curr) => ({
      vaccine: acc.vaccine + curr.stats.vaccine,
      sterilize: acc.sterilize + curr.stats.sterilize,
      register: acc.register + curr.stats.register,
      microchip: acc.microchip + curr.stats.microchip,
    }), { vaccine: 0, sterilize: 0, register: 0, microchip: 0 });
  }, [filteredData]);

  // 3. Prepare Chart Data (Monthly Trend)
  const trendData = useMemo(() => {
    const grouped = filteredData.reduce((acc, curr) => {
      const month = curr.date.substring(0, 7); 
      if (!acc[month]) acc[month] = { 
        name: month, 
        vaccine: 0, 
        sterilize: 0, 
        register: 0, 
        microchip: 0, 
        total: 0 
      };
      
      acc[month].vaccine += curr.stats.vaccine;
      acc[month].sterilize += curr.stats.sterilize;
      acc[month].register += curr.stats.register;
      acc[month].microchip += curr.stats.microchip;
      
      acc[month].total += (curr.stats.vaccine + curr.stats.sterilize);
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredData]);

  // แก้ไข: ปรับให้ unitStats return ค่าที่ครบถ้วน (มี total และ count) เพื่อใช้ในกราฟและตาราง
  const unitStats = useMemo(() => {
    const grouped = filteredData.reduce((acc, curr) => {
      if (!acc[curr.unit]) {
        acc[curr.unit] = { 
          name: curr.unit, 
          count: 0, 
          vaccine: 0, 
          sterilize: 0, 
          total: 0 // เพิ่ม field นี้
        };
      }
      acc[curr.unit].count += 1;
      acc[curr.unit].vaccine += curr.stats.vaccine;
      acc[curr.unit].sterilize += curr.stats.sterilize;
      acc[curr.unit].total += (curr.stats.vaccine + curr.stats.sterilize);
      return acc;
    }, {});
    
    // Return เป็น Array เรียงตามผลงานรวม (ใช้ map ในตารางได้เลย)
    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // 6. [เพิ่มใหม่] Prepare District Ranking Data
  // ย้าย Logic การคำนวณอันดับเขตมาไว้ตรงนี้ เพื่อไม่ให้คำนวณซ้ำใน JSX
  const districtStats = useMemo(() => {
    const grouped = filteredData.reduce((acc, curr) => {
      if (!acc[curr.district]) {
        acc[curr.district] = { 
          name: curr.district, 
          vac: 0, 
          ster: 0, 
          total: 0, 
          units: new Set() // ใช้ Set เก็บชื่อหน่วยงานไม่ให้ซ้ำ
        };
      }
      acc[curr.district].vac += curr.stats.vaccine;
      acc[curr.district].ster += curr.stats.sterilize;
      acc[curr.district].total += (curr.stats.vaccine + curr.stats.sterilize);
      acc[curr.district].units.add(curr.unit); 
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // 5. [เพิ่มใหม่] คำนวณสถิติเชิงลึกจาก details (แยกประเภทสัตว์, เพศ, สถานะ)
  const detailedStats = useMemo(() => {
    const stats = filteredData.reduce((acc, curr) => {
      const d = curr.details || { dog: {}, cat: {}, other: {} };
      const parse = (val) => parseInt(val) || 0;

      // รวมยอดตามชนิดสัตว์ (นับรวมทุกกิจกรรม)
      const dogTotal = parse(d.dog?.vaccine) + parse(d.dog?.maleSterilize) + parse(d.dog?.femaleSterilize) + parse(d.dog?.microchip);
      const catTotal = parse(d.cat?.vaccine) + parse(d.cat?.maleSterilize) + parse(d.cat?.femaleSterilize) + parse(d.cat?.microchip);
      const otherTotal = parse(d.other?.vaccine);

      acc.species.dog += dogTotal;
      acc.species.cat += catTotal;
      acc.species.other += otherTotal;

      // แยกเพศทำหมัน
      acc.sex.male += parse(d.dog?.maleSterilize) + parse(d.cat?.maleSterilize);
      acc.sex.female += parse(d.dog?.femaleSterilize) + parse(d.cat?.femaleSterilize);

      // แยกสถานะ (มีเจ้าของ/จรจัด)
      acc.status.owned += parse(d.dog?.owned) + parse(d.cat?.owned);
      acc.status.community += parse(d.dog?.community) + parse(d.cat?.community);

      return acc;
    }, {
      species: { dog: 0, cat: 0, other: 0 },
      sex: { male: 0, female: 0 },
      status: { owned: 0, community: 0 }
    });

    return {
      speciesData: [
        { name: 'สุนัข', value: stats.species.dog, color: '#3b82f6' }, // Blue
        { name: 'แมว', value: stats.species.cat, color: '#f97316' },  // Orange
        { name: 'อื่นๆ', value: stats.species.other, color: '#64748b' } // Slate
      ].filter(i => i.value > 0),
      sexData: [
        { name: 'ตัวผู้', value: stats.sex.male, color: '#0ea5e9' },
        { name: 'ตัวเมีย', value: stats.sex.female, color: '#ec4899' },
      ],
      statusData: [
        { name: 'มีเจ้าของ', value: stats.status.owned, color: '#22c55e' },
        { name: 'ชุมชน/จรจัด', value: stats.status.community, color: '#eab308' },
      ]
    };
  }, [filteredData]);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // แสดงเฉพาะชิ้นที่มีค่ามากกว่า 0%
    if (percent === 0) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontWeight="bold"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 selection:bg-blue-100">
      
      {/* ✅ เพิ่มส่วนนี้เข้าไปเพื่อให้ Scrollbar สวยงาม */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      {/* Modal บันทึก/แก้ไขข้อมูล */}
      <AddDataModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddNewData}
        onUpdate={handleUpdateData}
        initialData={editingItem}
      />

      {/* CsvActionModal */}
      <CsvActionModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onFileChange={handleFileUpload}
        onExport={exportToCSV}
      />

      {/* --- HEADER --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
              <Activity className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 leading-tight tracking-tight">ระบบรายงานผลการปฏิบัติงานสัตวแพทย์</h1>
              <p className="text-xs font-medium text-slate-500">Veterinary & Animal Control Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleToggleViewMode}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all shadow-sm font-bold text-sm
                ${isReadOnly 
                  ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700' // Style ตอนเป็น View Mode (ปุ่ม Admin)
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100' // Style ตอนเป็น Admin Mode (ปุ่ม View)
                }`}
              title={isReadOnly ? "คลิกเพื่อกลับสู่โหมดแก้ไขข้อมูล" : "คลิกเพื่อดูมุมมอง Dashboard แบบผู้ใช้งานทั่วไป"}
            >
              {isReadOnly ? <Unlock className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {isReadOnly ? 'กลับสู่โหมดแอดมิน' : 'ดู Dashboard'}
              </span>
            </button>

            {/* --- [ส่วนที่แก้ไข] : ครอบปุ่ม Action ทั้งหมดด้วยการเช็ค !isReadOnly --- */}
            {!isReadOnly && (
              <>
                <button 
                  onClick={handleGenerateMockData}
                  className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 border border-purple-200 text-purple-700 text-sm font-bold px-4 py-2.5 rounded-full transition-all shadow-sm"
                >
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">จำลอง 100 เคส</span>
                </button>

                <button 
                  onClick={() => setIsCsvModalOpen(true)}
                  className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-sm"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">จัดการข้อมูล CSV</span>
                </button>

                <button 
                  onClick={openAddModal}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">บันทึกผลงานใหม่</span>
                </button>
              </>
            )}

            {/* (Optional) แสดงป้ายบอกว่าเป็น View Mode */}
            {isReadOnly && (
               <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs rounded-full border border-slate-200">
                 View Only Mode
               </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* --- FILTERS --- */}
        <div className="space-y-4">
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="ค้นหากิจกรรม, สถานที่, หรือเขตพื้นที่..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Date Picker */}
            <div className="relative w-full md:w-auto min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="date"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
              {searchDate && (
                <button 
                  onClick={() => setSearchDate('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-red-500 hover:text-red-700 font-bold"
                >
                  ล้างค่า
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <span>ตัวกรองละเอียด :</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
              
              <div className="relative group">
                <select 
                  disabled={!!searchDate}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className={`appearance-none w-full border border-slate-200 text-slate-700 py-2.5 px-4 pr-10 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer ${!!searchDate ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 hover:bg-slate-100'}`}
                >
                  <option value="ทั้งหมด">ทุกปี</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>

              <div className="relative group">
                <select 
                  disabled={!!searchDate}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className={`appearance-none w-full border border-slate-200 text-slate-700 py-2.5 px-4 pr-10 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer ${!!searchDate ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 hover:bg-slate-100'}`}
                >
                  <option value="ทั้งหมด">ทุกเดือน</option>
                  {THAI_MONTHS.map((m, index) => (
                    <option key={index} value={index + 1}>{m}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              <div className="relative group">
                <select 
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="appearance-none w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 pr-10 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer hover:bg-slate-100"
                >
                  <option value="ทั้งหมด">ทุกหน่วยงาน</option>
                  {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              <div className="relative group">
                <select 
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="appearance-none w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 pr-10 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer hover:bg-slate-100"
                >
                  <option value="ทั้งหมด">ทุกเขต (50 เขต)</option>
                  {BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            title="จำนวนวัคซีนทั้งหมด" 
            value={totals.vaccine} 
            subtext="สะสมรวมทุกหน่วย"
            icon={Syringe} 
            colorClass="text-blue-600 bg-blue-600"
          />
          <KPICard 
            title="จำนวนการทำหมัน" 
            value={totals.sterilize} 
            subtext="สุนัขและแมว"
            icon={Scissors} 
            colorClass="text-orange-500 bg-orange-500"
          />
          <KPICard 
            title="ขึ้นทะเบียนสัตว์เลี้ยง" 
            value={totals.register} 
            subtext="ลงระบบฐานข้อมูล"
            icon={FileText} 
            colorClass="text-green-500 bg-green-500"
          />
          <KPICard 
            title="ฝังไมโครชิป" 
            value={totals.microchip} 
            subtext="ระบุตัวตนสัตว์"
            icon={Database} 
            colorClass="text-purple-500 bg-purple-500"
          />
        </div>

        {/* --- [เพิ่มใหม่] SUMMARY DASHBOARD SECTION --- */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="bg-blue-100 p-1.5 rounded-md">
                   <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                สรุปผลการดำเนินงานรายเดือน (Monthly Performance)
              </h2>
            </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              
              {/* 1. สัดส่วนสัตว์ (Species) */}
              <div className="flex flex-col items-center justify-center p-2">
                 <h3 className="text-sm font-semibold text-slate-500 mb-4">สัดส่วนสัตว์ที่ให้บริการ (Species)</h3>
                 <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                             data={detailedStats.speciesData}
                             cx="50%" cy="50%"
                             innerRadius={60}
                             outerRadius={80}
                             paddingAngle={2}
                             dataKey="value"
                             labelLine={false}
                          >
                             {detailedStats.speciesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                             ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{borderRadius: '8px'}} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                       </PieChart>
                    </ResponsiveContainer>
                    {/* ตัวเลขตรงกลาง Donut Chart */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                       <span className="text-2xl font-bold text-slate-700">
                          {detailedStats.speciesData.reduce((a, b) => a + b.value, 0).toLocaleString()}
                       </span>
                       <span className="block text-[10px] text-slate-400">ตัว</span>
                    </div>
                 </div>
              </div>

              {/* 2. แยกเพศการทำหมัน (Sex) */}
              <div className="flex flex-col items-center justify-center p-2 border-t md:border-t-0 md:border-l border-slate-100">
                 <h3 className="text-sm font-semibold text-slate-500 mb-4">แยกเพศการทำหมัน (Sex)</h3>
                 <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                             data={detailedStats.sexData}
                             cx="50%" cy="50%"
                             outerRadius={80}
                             dataKey="value"
                             labelLine={false}
                             label={renderCustomizedLabel} // ใช้ Custom Label
                          >
                             {detailedStats.sexData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                             ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{borderRadius: '8px'}} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* 3. สถานะสัตว์ (Ownership Status) - จุดที่ฟอนต์ซ้อนกันหนักสุด */}
              <div className="flex flex-col items-center justify-center p-2 border-t md:border-t-0 md:border-l border-slate-100">
                 <h3 className="text-sm font-semibold text-slate-500 mb-4">สถานะสัตว์ (Ownership Status)</h3>
                 <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                             data={detailedStats.statusData}
                             cx="50%" cy="50%"
                             outerRadius={80}
                             dataKey="value"
                             labelLine={false}
                             label={renderCustomizedLabel} // ใช้ Custom Label แก้ปัญหาฟอนต์ซ้อน
                          >
                             {detailedStats.statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                             ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{borderRadius: '8px'}} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            </div>
          </div>

        {/* --- MAIN CHARTS ROW --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Trend Chart (กราฟแนวโน้มรายเดือน) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="bg-blue-100 p-1.5 rounded-md">
                   <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                แนวโน้มผลการดำเนินงานรายเดือน
              </h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                
                <ComposedChart data={trendData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                  
                  <Area yAxisId="left" type="monotone" dataKey="total" name="ยอดรวมกิจกรรม" fill="url(#colorTotal)" stroke="#6366f1" strokeWidth={2} />
                  <Bar yAxisId="left" dataKey="vaccine" name="💉 วัคซีน" barSize={10} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="sterilize" name="✂️ ทำหมัน" barSize={10} fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="register" name="📝 ขึ้นทะเบียน (ขวา)" stroke="#10b981" strokeWidth={2} dot={{r: 4}} />

                  {/* แถบซูมข้อมูล (Brush) */}
                  <Brush 
                    dataKey="name" 
                    height={30} 
                    stroke="#6366f1" 
                    fill="#f1f5f9"
                    travellerWidth={10}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Unit Comparison Chart (กราฟแท่งเปรียบเทียบหน่วย) */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-purple-300 transition-colors">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <div className="bg-purple-100 p-1.5 rounded-md">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              เปรียบเทียบตามหน่วย
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitStats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#475569', fontWeight: 500}} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="vaccine" name="วัคซีน" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                  <Bar dataKey="sterilize" name="ทำหมัน" fill="#f97316" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* --- [แก้ไข] RANKING ROW (เพิ่มฟิลเตอร์ Year/Month) --- */}
{/* --- [แก้ไข] RANKING ROW (Layout: Side-by-Side) --- */}
<div className="space-y-4 mt-8">
  
  {/* [คงเดิม] แถบควบคุมฟิลเตอร์สำหรับส่วน Ranking */}
  <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
    <div className="flex items-center gap-2 font-bold text-slate-700">
        <div className="bg-yellow-100 p-1.5 rounded-lg">
           <Filter className="w-4 h-4 text-yellow-700" />
        </div>
        <span>ตัวกรองการจัดอันดับ (Ranking Filters)</span>
    </div>
    <div className="flex items-center gap-3 w-full sm:w-auto">
        <select 
            value={rankingYear}
            onChange={(e) => setRankingYear(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
        >
            <option value="ทั้งหมด">ทุกปี (รวมทั้งหมด)</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select 
            value={rankingMonth}
            onChange={(e) => setRankingMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
        >
            <option value="ทั้งหมด">ทุกเดือน (รวมทั้งหมด)</option>
            {THAI_MONTHS.map((m, index) => (
                <option key={index} value={index + 1}>{m}</option>
            ))}
        </select>
    </div>
  </div>

  {/* [แก้ไข] Grid Container: จัดให้วางคู่กัน (grid-cols-2) */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    
    {/* 1. ตารางอันดับหน่วยงาน (Top Units) */}
    {/* เอา lg:col-span-2 ออก เพื่อให้กลับมาขนาดครึ่งจอและวางข้างเขต */}
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-0 mb-0 flex flex-col h-[32rem]"> 
      
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 shrink-0">
        <div className="bg-amber-100 p-1.5 rounded-md">
          <Activity className="w-5 h-5 text-amber-600" />
        </div>
        อันดับหน่วยงานสูงสุด
      </h2>
      
      <div className="flex-1 overflow-auto custom-scrollbar border border-slate-100 rounded-lg relative">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b sticky top-0 z-10 shadow-sm text-[10px] uppercase">
            <tr>
              <th className="px-2 py-3 whitespace-nowrap bg-slate-50">#</th>
              <th className="px-2 py-3 whitespace-nowrap bg-slate-50 min-w-[100px]">หน่วยงาน</th>
              <th className="px-1 py-3 text-right whitespace-nowrap bg-slate-50 text-blue-600">วัคซีน</th>
              <th className="px-1 py-3 text-right whitespace-nowrap bg-slate-50 text-orange-500">ทำหมัน</th>
              <th className="px-1 py-3 text-right whitespace-nowrap bg-slate-50 text-green-600">ทะเบียน</th>
              <th className="px-1 py-3 text-right whitespace-nowrap bg-slate-50 text-purple-600">ชิป</th>
              <th className="px-2 py-3 text-right whitespace-nowrap bg-slate-100 font-bold text-slate-700">รวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rankingUnitStats.length > 0 ? (
              rankingUnitStats.map((u, index) => (
                <tr key={u.name} className="hover:bg-slate-50 transition-colors text-xs">
                  <td className="px-2 py-3">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-2 py-3 font-medium text-slate-700">
                    <div className="truncate max-w-[100px]" title={u.name}>{u.name}</div>
                    <div className="text-[9px] text-slate-400 font-normal mt-0.5">{u.count} ครั้ง</div>
                  </td>
                  <td className="px-1 py-3 text-right text-slate-600">{u.vaccine.toLocaleString()}</td>
                  <td className="px-1 py-3 text-right text-slate-600">{u.sterilize.toLocaleString()}</td>
                  <td className="px-1 py-3 text-right text-slate-600">{u.register.toLocaleString()}</td>
                  <td className="px-1 py-3 text-right text-slate-600">{u.microchip.toLocaleString()}</td>
                  <td className="px-2 py-3 text-right font-bold text-slate-800 bg-slate-50/30">{u.total.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-400 italic">ไม่พบข้อมูล</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* 2. ตาราง 5 อันดับเขต (Top Districts) */}
    {/* ส่วนนี้เหมือนเดิม วางอยู่ใน Grid Column ที่ 2 โดยอัตโนมัติ */}
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[32rem] hover:border-indigo-300 transition-colors">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 shrink-0">
        <div className="bg-indigo-100 p-1.5 rounded-md">
          <CheckCircle className="w-5 h-5 text-indigo-600" />
        </div>
        5 อันดับเขตผลงานสูงสุด
      </h2>
        <div className="flex-1 overflow-auto custom-scrollbar border border-slate-100 rounded-lg relative">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 z-10 shadow-sm text-xs">
              <tr>
                <th className="px-4 py-3 bg-slate-50 w-12">#</th>
                <th className="px-4 py-3 bg-slate-50">เขต</th>
                <th className="px-4 py-3 bg-slate-50">หน่วยงาน</th>
                <th className="px-4 py-3 text-right bg-slate-50">รวม (ตัว)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankingDistrictStats.length > 0 ? (
                rankingDistrictStats.slice(0, 5).map((d, index) => (
                  <tr key={d.name} className={`hover:bg-blue-50/50 transition-colors group ${index < 3 ? 'font-medium' : ''}`}>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs 
                        ${index === 0 ? 'bg-yellow-100 text-yellow-700 font-bold' : 
                          index === 1 ? 'bg-slate-200 text-slate-700' : 
                          index === 2 ? 'bg-orange-100 text-orange-800' : 'text-slate-400'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">
                      {d.name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[10px] text-slate-500 truncate max-w-[100px] bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block" title={Array.from(d.units).join(', ')}>
                      {Array.from(d.units).join(', ')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600 group-hover:text-blue-700">
                      {d.total.toLocaleString()}
                    </td>
                  </tr>
                  ))
                ) : (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-slate-400 italic">ไม่พบข้อมูลตามเงื่อนไข</td>
              </tr>
              )}
            </tbody>
          </table>
      </div>
      <div className="mt-4 pt-2 border-t border-slate-100 text-xs text-slate-400 text-center flex justify-between items-center px-2">
         <span>*แสดง 5 อันดับแรก</span>
         <span>
            {rankingYear !== 'ทั้งหมด' ? `ปี ${rankingYear}` : 'ทุกปี'} / {rankingMonth !== 'ทั้งหมด' ? THAI_MONTHS[rankingMonth-1] : 'ทุกเดือน'}
         </span>
      </div>
    </div>

  </div>
</div>

       {/* --- MAP SECTION (ย้ายมาไว้ล่างสุด เต็มจอ) --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[32rem] flex flex-col hover:border-green-300 transition-colors mt-8 relative z-0">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <div className="bg-green-100 p-1.5 rounded-md">
                <MapIcon className="w-5 h-5 text-green-600" />
              </div>
              แผนที่แสดงความหนาแน่นกิจกรรม (Geographic Distribution)
            </h2>
            <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 relative shadow-inner bg-slate-50 isolate">
              <LeafletMap data={filteredData} />
              
              {/* Legend Overlay: ย้ายมาซ้ายล่าง (left-4) เพื่อไม่ให้บัง Copyright แผนที่ด้านขวา */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-lg border border-slate-100 text-xs space-y-2 z-[400] min-w-[160px]">
                
                {/* 1. ประเภทหน่วยงาน */}
                <div>
                  <div className="font-bold text-slate-700 mb-2 border-b pb-1">ประเภทหน่วยงาน</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-2 shadow-sm shrink-0"></span>หน่วยผู้ว่า</div>
                    <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2 shadow-sm shrink-0"></span>หน่วยสัตวแพทย์</div>
                    <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2 shadow-sm shrink-0"></span>หน่วยวัคซีนฯ</div>
                    <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-2 shadow-sm shrink-0"></span>หน่วยกรงแมว</div>
                  </div>
                </div>

                {/* 2. สรุปผลงานรวม */}
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <div className="font-bold text-slate-700 mb-2 border-b pb-1">สรุปผลงานรวม (บนแผนที่)</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center text-blue-600 font-medium">
                        <Syringe className="w-3 h-3 mr-1.5"/>วัคซีน
                      </span>
                      <span className="font-bold text-slate-700">{totals.vaccine.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center text-orange-500 font-medium">
                        <Scissors className="w-3 h-3 mr-1.5"/>ทำหมัน
                      </span>
                      <span className="font-bold text-slate-700">{totals.sterilize.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center text-green-600 font-medium">
                        <FileText className="w-3 h-3 mr-1.5"/>ทะเบียน
                      </span>
                      <span className="font-bold text-slate-700">{totals.register.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center text-purple-600 font-medium">
                        <Database className="w-3 h-3 mr-1.5"/>ไมโครชิป
                      </span>
                      <span className="font-bold text-slate-700">{totals.microchip.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* --- ALL DATA TABLE --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-600" />
              รายการข้อมูลทั้งหมด
            </h2>

            {/* --- [ส่วนที่แก้ไข] : ซ่อนปุ่มลบข้อมูลทั้งหมด --- */}
  {!isReadOnly && filteredData.length > 0 && (
    <button 
      onClick={handleClearAllData} 
      className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-bold rounded-lg border border-red-200 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      ล้างข้อมูลทั้งหมด
    </button>
  )}
          </div>
          
          {/* แก้ไข: เพิ่ม max-h-[600px] และ custom-scrollbar เพื่อให้เลื่อนได้ */}
          <div className="overflow-auto max-h-[600px] custom-scrollbar border border-slate-100 rounded-lg relative">
            <table className="min-w-full text-sm text-left border-collapse">
              {/* แก้ไข: เพิ่ม sticky top-0 z-10 เพื่อให้หัวตารางลอยอยู่ด้านบน */}
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap bg-slate-50">วันที่</th>
                  <th className="px-4 py-3 whitespace-nowrap bg-slate-50">สถานที่ / เขต</th>

                  <th className="px-4 py-3 text-center whitespace-nowrap bg-slate-50">รูปภาพ</th>

                  <th className="px-4 py-3 text-center whitespace-nowrap bg-slate-100/50">
                    <span className="block text-[10px] text-slate-400">รวมทั้งหมด</span>
                    วัคซีน
                  </th>
                  <th className="px-4 py-3 text-center whitespace-nowrap bg-slate-100/50">
                    <span className="block text-[10px] text-slate-400">รวมทั้งหมด</span>
                    ทำหมัน
                  </th>
                  {/* เพิ่มคอลัมน์รายละเอียดแบบย่อ */}
                  <th className="px-4 py-3 text-center bg-blue-50/90 text-white whitespace-nowrap border-l border-white">
                     <span className="font-bold">🐕 สุนัข</span><br/>
                     <span className="text-[9px] opacity-80 font-normal">(วัคซีน / ทำหมัน)</span>
                  </th>
                  <th className="px-4 py-3 text-center bg-orange-50/90 text-white whitespace-nowrap border-l border-white">
                     <span className="font-bold">🐈 แมว</span><br/>
                     <span className="text-[9px] opacity-80 font-normal">(วัคซีน / ทำหมัน)</span>
                  </th>
                  {/* --- [ส่วนที่แก้ไข] : ซ่อนหัวข้อ 'จัดการ' ถ้าเป็น ReadOnly --- */}
                  {!isReadOnly && (
                    <th className="px-4 py-3 text-center w-28 whitespace-nowrap bg-slate-50">จัดการ</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length > 0 ? (
                  filteredData.map((item) => {
                    // Helper เพื่อดึงค่ามาแสดงในตาราง
                    const d = item.details || {};
                    const val = (v) => v ? parseInt(v) : 0;

                    const dogVac = val(d.dog?.vaccine);
                    const dogSter = val(d.dog?.maleSterilize) + val(d.dog?.femaleSterilize);
                    
                    const catVac = val(d.cat?.vaccine);
                    const catSter = val(d.cat?.maleSterilize) + val(d.cat?.femaleSterilize);

                    return (
                      <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-600 align-top">{item.date}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-bold text-slate-800">{item.location}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.subdistrict ? `${item.subdistrict}, ` : ''}{item.district}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                             <MapIcon className="w-3 h-3" /> {item.lat && item.long ? `${parseFloat(item.lat).toFixed(4)}, ${parseFloat(item.long).toFixed(4)}` : '-'}
                          </div>
                        </td>

                        {/* --- [เพิ่มใหม่] แสดงรูปภาพ --- */}
  <td className="px-4 py-3 align-top text-center">
    {item.imageUrl ? (
      <div className="relative group w-12 h-12 mx-auto">
        <img 
          src={item.imageUrl} 
          alt="site" 
          className="w-full h-full object-cover rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:scale-150 transition-transform origin-center z-10 relative"
          onClick={() => setViewImage(item.imageUrl)}
        />
      </div>
    ) : (
      <span className="text-xs text-slate-300">-</span>
    )}
  </td>
                        
                        {/* ยอดรวม */}
                        <td className="px-4 py-3 text-center align-top bg-slate-50/30">
                           <span className="font-bold text-slate-700 text-base">{item.stats.vaccine}</span>
                        </td>
                        <td className="px-4 py-3 text-center align-top bg-slate-50/30">
                           <span className="font-bold text-slate-700 text-base">{item.stats.sterilize}</span>
                        </td>

                        {/* รายละเอียด สุนัข */}
                        <td className="px-4 py-3 text-center bg-blue-50/10 align-top border-l border-slate-100">
                           <div className="text-xs text-slate-600 font-medium">
                              <span className="text-blue-600">{dogVac}</span> / <span className="text-orange-600">{dogSter}</span>
                           </div>
                        </td>

                        {/* รายละเอียด แมว */}
                        <td className="px-4 py-3 text-center bg-orange-50/10 align-top border-l border-slate-100">
                           <div className="text-xs text-slate-600 font-medium">
                              <span className="text-blue-600">{catVac}</span> / <span className="text-orange-600">{catSter}</span>
                           </div>
                        </td>

                        {/* --- [ส่วนที่แก้ไข] : ซ่อนปุ่ม Edit/Delete ถ้าเป็น ReadOnly --- */}
{!isReadOnly && (
  <td className="px-4 py-3 text-center align-top">
    <div className="flex items-center justify-center gap-2">
      <button 
        onClick={() => openEditModal(item)} 
        className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors group"
      >
        <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
      <button 
        onClick={() => handleDeleteData(item._id)} 
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
      >
        <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  </td>
)}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-slate-400 italic bg-slate-50/50">
                      ไม่พบข้อมูลรายการ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      {/* [เพิ่มใหม่] วาง ImagePreviewModal ไว้ตรงนี้ (ก่อนปิด div หลัก) */}
      <ImagePreviewModal 
        imageUrl={viewImage} 
        onClose={() => setViewImage(null)} 
      />
    </div>
  );
}