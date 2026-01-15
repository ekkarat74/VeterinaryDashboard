import React, { useState, useMemo, useEffect } from 'react';
import { 
  Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Area, ComposedChart, Brush
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Activity, Syringe, Scissors, FileText, MapPin, 
  Filter, Calendar, Database, Download, Users, 
  Map as MapIcon, ChevronDown, CheckCircle, Plus, X, Save,
  Calculator, Navigation, LocateFixed, Upload, Search, Pencil, Edit, Trash2
} from 'lucide-react';

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

// ฟังก์ชันช่วยเลือกสีจุดตามหน่วยงาน
const getMarkerColor = (unit) => {
  switch (unit) {
    case 'หน่วยผู้ว่า': return '#a855f7'; // สีม่วง
    case 'หน่วยสัตวแพทย์': return '#3b82f6'; // สีฟ้า
    case 'หน่วยวัคซีน + ไมโครชิป': return '#22c55e'; // สีเขียว
    case 'หน่วยกรงแมว': return '#f97316'; // สีส้ม
    default: return '#64748b';
  }
};

// Component แผนที่จริง (Leaflet)
const LeafletMap = ({ data }) => {
  const centerPosition = [13.7563, 100.5018];

  return (
    <div className="relative w-full h-full z-0">
      <MapContainer 
        center={centerPosition} 
        zoom={10} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%", background: "#f8fafc" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {data.map((item) => {
          if (!item.lat || !item.long) return null;
          return (
            <CircleMarker
              key={item._id || item.id}
              center={[parseFloat(item.lat), parseFloat(item.long)]}
              pathOptions={{ 
                color: 'white', 
                fillColor: getMarkerColor(item.unit), 
                fillOpacity: 0.8, 
                weight: 2 
              }}
              radius={8}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                {/* เปลี่ยนจากแสดง activity เป็น location */}
                <span className="font-bold">{item.location}</span>
              </Tooltip>
              <Popup>
                <div className="font-sans min-w-[150px]">
                  {/* เปลี่ยนหัวข้อ Popup เป็นชื่อหน่วยงานแทน */}
                  <h3 className="font-bold text-slate-800">{item.unit}</h3>
                  <p className="text-xs text-slate-500 mb-2">📍 {item.location} ({item.district})</p>
                  <div className="text-xs space-y-1">
                    <div className="text-blue-600">💉 วัคซีน: {item.stats.vaccine}</div>
                    <div className="text-orange-600">✂️ ทำหมัน: {item.stats.sterilize}</div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

// --- UPDATED ADD DATA MODAL (Structured per requirements) ---
// --- UPDATED ADD/EDIT DATA MODAL ---
const AddDataModal = ({ isOpen, onClose, onSave, onUpdate, initialData }) => {
  const defaultFormData = {
    date: new Date().toISOString().split('T')[0],
    location: '',
    district: BANGKOK_DISTRICTS[0],
    subdistrict: '',
    unit: UNIT_TYPES[0],
    lat: '',
    long: ''
  };

  const defaultBreakdown = {
    dog: { maleSterilize: '', femaleSterilize: '', vaccine: '', register: '', microchip: '', owned: '', community: '' },
    cat: { maleSterilize: '', femaleSterilize: '', vaccine: '', register: '', microchip: '', owned: '', community: '' },
    other: { vaccine: '' }
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [breakdown, setBreakdown] = useState(defaultBreakdown);

  // Effect: โหลดข้อมูลเดิมเมื่อเปิด Modal ในโหมดแก้ไข
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // กรณีแก้ไข: โหลดข้อมูลเดิม
        setFormData({
            date: initialData.date,
            location: initialData.location,
            district: initialData.district,
            subdistrict: initialData.subdistrict,
            unit: initialData.unit,
            lat: initialData.lat,
            long: initialData.long
        });
        // โหลดข้อมูลตัวเลข (ถ้ามี details ให้ใช้ details ถ้าไม่มีให้ใช้ค่าว่าง)
        if (initialData.details) {
            setBreakdown(initialData.details);
        }
      } else {
        // กรณีเพิ่มใหม่: ล้างค่าเป็น default
        setFormData(defaultFormData);
        setBreakdown(defaultBreakdown);
      }
    }
  }, [isOpen, initialData]);

  // Calculate Totals automatically
  const totals = useMemo(() => {
    const parse = (val) => parseInt(val) || 0;
    
    const dog = breakdown.dog;
    const cat = breakdown.cat;
    const other = breakdown.other;

    return {
      vaccine: parse(dog.vaccine) + parse(cat.vaccine) + parse(other.vaccine),
      sterilize: parse(dog.maleSterilize) + parse(dog.femaleSterilize) + parse(cat.maleSterilize) + parse(cat.femaleSterilize),
      register: parse(dog.register) + parse(cat.register),
      microchip: parse(dog.microchip) + parse(cat.microchip),
    };
  }, [breakdown]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataPayload = {
      ...formData,
      lat: formData.lat ? parseFloat(formData.lat) : 0,
      long: formData.long ? parseFloat(formData.long) : 0,
      vaccine: totals.vaccine,
      sterilize: totals.sterilize,
      register: totals.register,
      microchip: totals.microchip,
      details: breakdown 
    };

    if (initialData) {
        onUpdate(initialData._id, dataPayload); // ส่ง ID ไปด้วยถ้าเป็นการแก้ไข
    } else {
        onSave(dataPayload); // ส่งข้อมูลใหม่ถ้าเป็นการเพิ่ม
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
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
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Section 1: General Info */}
            <div className="space-y-4">
               <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> ข้อมูลทั่วไป (General Information)
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* แถว 1: วันที่, หน่วย, สถานที่ (3+3+6 = 12 เต็มแถว) */}
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

                  {/* แถว 2: เขต, แขวง, พิกัด (3+3+6 = 12 เต็มแถวพอดี) */}
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
                  
                  {/* แก้ไข: เปลี่ยนจาก md:col-span-12 เป็น md:col-span-6 เพื่อให้อยู่ต่อจากแขวง */}
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
                      {/* Sterilize Row */}
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
                      
                      {/* Services */}
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-blue-100">
                         <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ฉีดวัคซีน</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-blue-400 outline-none text-center"
                              value={breakdown.dog.vaccine} onChange={(e) => handleBreakdownChange('dog', 'vaccine', e.target.value)} />
                         </div>
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

                      {/* Status */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-100 bg-blue-50/50 -mx-4 px-4 pb-2 mt-2">
                         <div className="col-span-2 text-xs font-bold text-slate-400 mb-1">สถานะสัตว์ (Animal Status)</div>
                         <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">มีเจ้าของ</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-blue-400 outline-none text-center"
                              value={breakdown.dog.owned} onChange={(e) => handleBreakdownChange('dog', 'owned', e.target.value)} />
                         </div>
                         <div>
                            <label className="text-[10px] text-slate-500 font-semibold uppercase">ชุมชน/จรจัด</label>
                            <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded shadow-sm focus:ring-1 focus:ring-blue-400 outline-none text-center"
                              value={breakdown.dog.community} onChange={(e) => handleBreakdownChange('dog', 'community', e.target.value)} />
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

  // แก้ไข: เพิ่ม parameter showSuccessAlert = true
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
        
        // แก้ไข: เช็คเงื่อนไขก่อนแสดง Alert
        if (showSuccessAlert) {
          alert("✅ บันทึกข้อมูลลงฐานข้อมูลสำเร็จ!");
        }
      } else {
        // อาจจะปิด Alert ตอน Error ด้วยถ้าต้องการ หรือปล่อยไว้เพื่อดู Error
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

  // --------------------------------------------------------
  // เริ่มก๊อปปี้ทับตั้งแต่ตรงนี้ (ภายใน function VeterinaryDashboard)
  // --------------------------------------------------------

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

// 4. Prepare Chart Data & Table Data (Unit Comparison)
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
        { name: 'แมว', value: stats.species.cat, color: '#f97316' },  // Orange
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
          
          {/* Trend Chart */}
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

                  {/* --- ส่วนที่เพิ่มใหม่: แถบซูมข้อมูล (Brush) --- */}
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

          {/* Unit Comparison Chart */}
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

        {/* --- EXECUTIVE SUMMARY: TOP UNITS --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-8 mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="bg-amber-100 p-1.5 rounded-md">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            อันดับหน่วยงานที่มีผลงานสูงสุด (Top Performing Units)
          </h2>
          
          {/* แก้ไข: เพิ่ม max-h-[500px], overflow-auto และ custom-scrollbar เพื่อให้มีบาร์เลื่อนเมื่อข้อมูลยาว */}
          <div className="overflow-auto max-h-[500px] custom-scrollbar border border-slate-100 rounded-lg relative">
            <table className="min-w-full text-sm text-left">
              {/* แก้ไข: เพิ่ม sticky top-0 และ z-10 เพื่อให้หัวตารางลอยอยู่ด้านบนเวลาเลื่อนดูข้อมูล */}
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap bg-slate-50">อันดับ</th>
                  <th className="px-4 py-3 whitespace-nowrap bg-slate-50">หน่วยงาน</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap bg-slate-50">จำนวนครั้งที่ออกหน่วย</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap bg-slate-50">วัคซีนสะสม</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap bg-slate-50">ทำหมันสะสม</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap bg-slate-50">รวมผลงาน (ตัว)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unitStats.length > 0 ? (
                  unitStats.map((u, index) => (
                    <tr key={u.name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{u.name}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{u.count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{u.vaccine.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{u.sterilize.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{u.total.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-400 italic">ไม่พบข้อมูล</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- BOTTOM ROW: MAP & RANKING --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Map Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[28rem] flex flex-col hover:border-green-300 transition-colors">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <div className="bg-green-100 p-1.5 rounded-md">
                <MapIcon className="w-5 h-5 text-green-600" />
              </div>
              แผนที่แสดงความหนาแน่นกิจกรรม
            </h2>
            <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 relative shadow-inner bg-slate-50">
              <LeafletMap data={filteredData} />
              
              {/* Legend Overlay */}
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-lg border border-slate-100 text-xs space-y-2">
                <div className="font-bold text-slate-700 mb-1 border-b pb-1">ประเภทหน่วยงาน</div>
                <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-2 shadow-sm"></span>หน่วยผู้ว่า</div>
                <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2 shadow-sm"></span>หน่วยสัตวแพทย์</div>
                <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2 shadow-sm"></span>หน่วยวัคซีนฯ</div>
                <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-2 shadow-sm"></span>หน่วยกรงแมว</div>
              </div>
            </div>
          </div>

          {/* District Ranking Table */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[28rem] flex flex-col hover:border-indigo-300 transition-colors">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <div className="bg-indigo-100 p-1.5 rounded-md">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
              </div>
              5 อันดับเขตผลงานสูงสุด
            </h2>
            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 first:rounded-tl-lg">อันดับ</th>
                    <th className="px-4 py-3">เขต</th>
                    <th className="px-4 py-3 w-1/4">หน่วยงานที่ลงพื้นที่</th>
                    <th className="px-4 py-3 text-right">วัคซีน</th>
                    <th className="px-4 py-3 text-right">ทำหมัน</th>
                    <th className="px-4 py-3 text-right last:rounded-tr-lg">รวม (ตัว)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* แก้ไข: ใช้ districtStats.map วนลูปได้เลย */}
                  {districtStats.length > 0 ? (
                    districtStats.map((d, index) => (
                      <tr key={d.name} className={`hover:bg-blue-50/50 transition-colors group ${index < 5 ? 'font-medium' : ''}`}>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs 
                            ${index === 0 ? 'bg-yellow-100 text-yellow-700 font-bold' : 
                              index === 1 ? 'bg-slate-200 text-slate-700' : 
                              index === 2 ? 'bg-orange-100 text-orange-800' : 'text-slate-400'}`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{d.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 leading-snug">
                          {Array.from(d.units).map((u, i) => (
                            <span key={i} className="inline-block bg-slate-100 px-1.5 py-0.5 rounded text-[10px] mr-1 mb-1 border border-slate-200">
                              {u}
                            </span>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">{d.vac.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{d.ster.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600 group-hover:text-blue-700">{d.total.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-400 italic">ไม่พบข้อมูลตามเงื่อนไข</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center flex justify-between items-center px-2">
              <span>*แสดงข้อมูลทุกเขตตามปริมาณงาน</span>
              <span>ข้อมูล ณ เวลาปัจจุบัน</span>
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

            {filteredData.length > 0 && (
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
                  <th className="px-4 py-3 text-center w-28 whitespace-nowrap bg-slate-50">จัดการ</th>
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

                        <td className="px-4 py-3 text-center align-top">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => openEditModal(item)} 
                              className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors group"
                              title="แก้ไขข้อมูล"
                            >
                              <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                            <button 
                              onClick={() => handleDeleteData(item._id)} 
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
                              title="ลบข้อมูล"
                            >
                              <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        </td>
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
    </div>
  );
}