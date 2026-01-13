import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Activity, Syringe, Scissors, FileText, MapPin, 
  Filter, Calendar, Database, Download, Users, 
  Map as MapIcon, ChevronDown, CheckCircle, Plus, X, Save,
  Calculator, Navigation, LocateFixed
} from 'lucide-react';

// --- CONSTANTS ---
const UNIT_TYPES = ['หน่วยวัคซีน + ไมโครชิป', 'หน่วยกรงแมว', 'หน่วยสัตวแพทย์', 'หน่วยผู้ว่า'];

// Updated District List as requested (50 Districts)
const BANGKOK_DISTRICTS = [
  // ฝั่งธนบุรี (15 เขต)
  "ธนบุรี", "บางกอกใหญ่", "คลองสาน", "ตลิ่งชัน", "บางกอกน้อย", 
  "บางขุนเทียน", "ภาษีเจริญ", "หนองแขม", "ราษฎร์บูรณะ", "บางพลัด", 
  "จอมทอง", "บางแค", "ทวีวัฒนา", "ทุ่งครุ", "บางบอน",
  // ฝั่งพระนคร (35 เขต)
  "พระนคร", "ดุสิต", "หนองจอก", "บางรัก", "บางเขน", 
  "บางกะปิ", "ปทุมวัน", "ป้อมปราบศัตรูพ่าย", "พระโขนง", "มีนบุรี", 
  "ลาดกระบัง", "ยานนาวา", "สัมพันธวงศ์", "พญาไท", "ห้วยขวาง", 
  "ดินแดง", "บึงกุ่ม", "สาทร", "บางซื่อ", "จตุจักร", 
  "บางคอแหลม", "ประเวศ", "คลองเตย", "สวนหลวง", "ดอนเมือง", 
  "ราชเทวี", "ลาดพร้าว", "วัฒนา", "หลักสี่", "สายไหม", 
  "คันนายาว", "สะพานสูง", "วังทองหลาง", "คลองสามวา", "บางนา"
];

// --- INITIAL MOCK DATA GENERATOR ---
const generateInitialData = () => {
  const baseData = [
    { id: 1, date: '2023-10-15', activity: 'หน่วยเคลื่อนที่ชุมชนวัดไผ่ตัน', location: 'วัดไผ่ตัน', lat: 13.789, long: 100.54, district: 'พญาไท', subdistrict: 'สามเสนใน', unit: 'หน่วยสัตวแพทย์', stats: { vaccine: 120, sterilize: 15, register: 30, microchip: 25 } },
    { id: 2, date: '2023-10-20', activity: 'ทำหมันสัญจร', location: 'โรงเรียนวัดธาตุทอง', lat: 13.719, long: 100.58, district: 'วัฒนา', subdistrict: 'พระโขนงเหนือ', unit: 'หน่วยกรงแมว', stats: { vaccine: 45, sterilize: 40, register: 10, microchip: 10 } },
    { id: 3, date: '2023-11-05', activity: 'ผู้ว่าสัญจรเขตจตุจักร', location: 'สวนจตุจักร', lat: 13.80, long: 100.55, district: 'จตุจักร', subdistrict: 'จอมพล', unit: 'หน่วยผู้ว่า', stats: { vaccine: 300, sterilize: 50, register: 100, microchip: 120 } },
    { id: 4, date: '2023-11-12', activity: 'ฉีดวัคซีนชุมชนคลองเตย', location: 'ชุมชนล็อก 1-2-3', lat: 13.70, long: 100.56, district: 'คลองเตย', subdistrict: 'คลองเตย', unit: 'หน่วยวัคซีน + ไมโครชิป', stats: { vaccine: 500, sterilize: 0, register: 200, microchip: 150 } },
    { id: 5, date: '2023-12-01', activity: 'หน่วยเคลื่อนที่ดินแดง', location: 'ศาลาว่าการ กทม. 2', lat: 13.76, long: 100.55, district: 'ดินแดง', subdistrict: 'ดินแดง', unit: 'หน่วยสัตวแพทย์', stats: { vaccine: 150, sterilize: 25, register: 40, microchip: 30 } },
    { id: 6, date: '2023-12-15', activity: 'หน่วยเคลื่อนที่บางรัก', location: 'วัดหัวลำโพง', lat: 13.73, long: 100.52, district: 'บางรัก', subdistrict: 'สี่พระยา', unit: 'หน่วยกรงแมว', stats: { vaccine: 60, sterilize: 35, register: 15, microchip: 20 } },
    { id: 7, date: '2024-01-10', activity: 'ผู้ว่าสัญจรบางกะปิ', location: 'ตลาดบางกะปิ', lat: 13.76, long: 100.64, district: 'บางกะปิ', subdistrict: 'คลองจั่น', unit: 'หน่วยผู้ว่า', stats: { vaccine: 250, sterilize: 45, register: 80, microchip: 90 } },
    { id: 8, date: '2024-01-25', activity: 'วัคซีนเชิงรุก', location: 'หมู่บ้านเสรี', lat: 13.74, long: 100.61, district: 'สวนหลวง', subdistrict: 'สวนหลวง', unit: 'หน่วยวัคซีน + ไมโครชิป', stats: { vaccine: 400, sterilize: 0, register: 150, microchip: 130 } },
    { id: 9, date: '2024-02-05', activity: 'หน่วยสัตว์แพทย์ลาดพร้าว', location: 'วัดลาดพร้าว', lat: 13.80, long: 100.59, district: 'ลาดพร้าว', subdistrict: 'ลาดพร้าว', unit: 'หน่วยสัตวแพทย์', stats: { vaccine: 180, sterilize: 30, register: 50, microchip: 45 } },
    { id: 10, date: '2024-02-20', activity: 'หน่วยกรงแมวห้วยขวาง', location: 'ตลาดห้วยขวาง', lat: 13.77, long: 100.57, district: 'ห้วยขวาง', subdistrict: 'ห้วยขวาง', unit: 'หน่วยกรงแมว', stats: { vaccine: 80, sterilize: 55, register: 20, microchip: 25 } },
  ];

  const extraData = [];
  for (let i = 0; i < 15; i++) {
    const district = BANGKOK_DISTRICTS[Math.floor(Math.random() * BANGKOK_DISTRICTS.length)];
    const unit = UNIT_TYPES[Math.floor(Math.random() * UNIT_TYPES.length)];
    extraData.push({
      id: 11 + i,
      date: `2024-03-${Math.floor(Math.random() * 28) + 1}`,
      activity: `หน่วยบริการ ${district} ครั้งที่ ${i+1}`,
      location: `ชุมชนเขต${district}`,
      lat: 13.65 + Math.random() * 0.3,
      long: 100.40 + Math.random() * 0.4,
      district: district,
      subdistrict: 'แขวงตัวอย่าง',
      unit: unit,
      stats: {
        vaccine: Math.floor(Math.random() * 200) + 50,
        sterilize: unit === 'หน่วยวัคซีน + ไมโครชิป' ? 0 : Math.floor(Math.random() * 50),
        register: Math.floor(Math.random() * 50),
        microchip: Math.floor(Math.random() * 60)
      }
    });
  }
  return [...baseData, ...extraData];
};

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

const SimulatedMap = ({ data }) => {
  const minLat = 13.4;
  const maxLat = 13.95;
  const minLong = 100.3;
  const maxLong = 100.95;

  const getX = (long) => ((long - minLong) / (maxLong - minLong)) * 100;
  const getY = (lat) => 100 - ((lat - minLat) / (maxLat - minLat)) * 100;

  return (
    <div className="relative w-full h-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200 group">
      <div className="absolute inset-0 opacity-20" 
           style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <svg className="absolute inset-0 w-full h-full text-slate-200 pointer-events-none" fill="currentColor">
        <path d="M20,30 Q50,10 80,30 T90,60 T60,90 T20,80 Z" opacity="0.3" />
        <path d="M40,40 Q60,40 70,50 T50,70 Z" opacity="0.2" className="text-slate-300" />
      </svg>

      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-md shadow-sm border border-slate-100 text-xs font-semibold text-slate-600 z-10 flex items-center gap-2">
        <MapPin className="w-3 h-3 text-red-500" />
        พิกัดกิจกรรม (Simulated)
      </div>

      {data.map((item) => (
        <div
          key={item.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-150 z-20"
          style={{ left: `${getX(item.long)}%`, top: `${getY(item.lat)}%` }}
        >
          <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ring-1 ring-black/5
            ${item.unit === 'หน่วยผู้ว่า' ? 'bg-purple-500' : 
              item.unit === 'หน่วยสัตวแพทย์' ? 'bg-blue-500' : 
              item.unit === 'หน่วยวัคซีน + ไมโครชิป' ? 'bg-green-500' : 'bg-orange-500'}`} 
          />
          <div className="opacity-0 hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-white text-slate-700 text-xs rounded-lg shadow-xl p-3 z-30 pointer-events-none border border-slate-100 transition-opacity">
            <div className="font-bold text-sm text-slate-800 mb-1">{item.district}</div>
            <div className="text-slate-500 mb-2">{item.location}</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 bg-slate-50 p-2 rounded border border-slate-100">
              <span>💉 วัคซีน:</span> <span className="font-medium">{item.stats.vaccine}</span>
              <span>✂️ ทำหมัน:</span> <span className="font-medium">{item.stats.sterilize}</span>
            </div>
            <div className="mt-1 text-[10px] text-right text-slate-400">{item.date}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- UPDATED ADD DATA MODAL (Structured per requirements) ---
const AddDataModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    activity: '',
    location: '',
    district: BANGKOK_DISTRICTS[0],
    subdistrict: '',
    unit: UNIT_TYPES[0],
    lat: '',
    long: ''
  });

  // Detailed State Structure for Quantitative Data
  const [breakdown, setBreakdown] = useState({
    dog: { maleSterilize: '', femaleSterilize: '', vaccine: '', register: '', microchip: '', owned: '', community: '' },
    cat: { maleSterilize: '', femaleSterilize: '', vaccine: '', register: '', microchip: '', owned: '', community: '' },
    other: { vaccine: '' }
  });

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
      // Extra details for summary
      dogTotal: parse(dog.vaccine) + parse(dog.register) + parse(dog.microchip) + parse(dog.maleSterilize) + parse(dog.femaleSterilize), // Rough activity count
      catTotal: parse(cat.vaccine) + parse(cat.register) + parse(cat.microchip) + parse(cat.maleSterilize) + parse(cat.femaleSterilize),
    };
  }, [breakdown]);

  if (!isOpen) return null;

  const handleBreakdownChange = (type, field, value) => {
    setBreakdown(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value // Keep as string for input, parse when calculating
      }
    }));
  };

  const handleGenerateCoords = () => {
    // Simulate getting coords for the district
    const lat = (13.5 + Math.random() * 0.4).toFixed(6);
    const long = (100.4 + Math.random() * 0.4).toFixed(6);
    setFormData(prev => ({ ...prev, lat, long }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      // Fallback lat/long if not generated
      lat: formData.lat ? parseFloat(formData.lat) : 13.5 + Math.random() * 0.4,
      long: formData.long ? parseFloat(formData.long) : 100.4 + Math.random() * 0.4,
      // Aggregated stats for the dashboard charts
      vaccine: totals.vaccine,
      sterilize: totals.sterilize,
      register: totals.register,
      microchip: totals.microchip,
      // Store full breakdown for potential drill-down views
      details: breakdown 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0 border-b border-slate-700">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-400" />
              บันทึกผลการปฏิบัติงานใหม่
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">กรอกข้อมูลพื้นฐานและรายละเอียดเชิงปริมาณแยกตามประเภทสัตว์</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
          {/* ตัวอย่างปุ่มลบในตารางรายรายการ */}
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Section 1: General Info */}
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">ชื่อกิจกรรม</label>
                    <input required type="text" placeholder="ระบุชื่อกิจกรรม" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.activity} onChange={e => setFormData({...formData, activity: e.target.value})} />
                  </div>
                  
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
                     <label className="block text-xs font-semibold text-slate-500 mb-1.5">สถานที่ (Location)</label>
                    <input required type="text" placeholder="ระบุจุดสังเกต/สถานที่ตั้ง" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  </div>

                  {/* Coords */}
                  <div className="md:col-span-12">
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
                        // แสดงค่ารวมกันในช่องเดียว
                        value={formData.lat && formData.long ? `${formData.lat}, ${formData.long}` : (formData.lat || formData.long || "")}
                        onChange={(e) => {
                        const value = e.target.value;
                        if (value.includes(',')) {
                        // ถ้ามีการใส่คอมม่า ให้แยกค่าทันที
                          const [lat, lng] = value.split(',').map(s => s.trim());
                          setFormData({ ...formData, lat, long: lng });
                        } else {
                        // ถ้ายังไม่ใส่คอมม่า ให้มองว่าเป็น lat ไปก่อน
                        setFormData({ ...formData, lat: value });
                        }
                      }} 
                      />
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
    
                    <button 
                      type="button" 
                      onClick={handleGenerateCoords} 
                      className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold border border-slate-300 transition-colors flex items-center gap-1 shrink-0"
                      >
                      <LocateFixed className="w-4 h-4" /> สุ่มพิกัด
                    </button>
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
              บันทึกข้อมูลเข้าระบบ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function VeterinaryDashboard() {
  // 1. กำหนดค่าเริ่มต้นเป็น Array ว่าง เพื่อรอรับข้อมูลจาก Database
  const [reportData, setReportData] = useState([]);
  
  // URL ของ Backend (ต้องตรงกับที่ตั้งไว้ใน server.js)
  const API_URL = 'http://localhost:5000/api/reports';

  const [selectedUnit, setSelectedUnit] = useState('ทั้งหมด');
  const [selectedDistrict, setSelectedDistrict] = useState('ทั้งหมด');
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // 3. แก้ไขฟังก์ชันบันทึกข้อมูล (POST ไปที่ MongoDB)
  const handleAddNewData = async (newRecord) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: newRecord.date,
          activity: newRecord.activity,
          location: newRecord.location,
          lat: parseFloat(newRecord.lat),
          long: parseFloat(newRecord.long),
          district: newRecord.district,
          subdistrict: newRecord.subdistrict,
          unit: newRecord.unit,
          stats: {
            vaccine: newRecord.vaccine,
            sterilize: newRecord.sterilize,
            register: newRecord.register,
            microchip: newRecord.microchip
          },
          details: newRecord.details // ข้อมูลเชิงลึกแยกประเภทสุนัข/แมว
        }),
      });

      if (response.ok) {
        const savedRecord = await response.json();
        // อัปเดต State หน้าจอทันทีด้วยข้อมูลที่ได้จาก DB
        setReportData(prev => [savedRecord, ...prev]);
        alert("✅ บันทึกข้อมูลลงฐานข้อมูลสำเร็จ!");
      } else {
        alert("❌ ไม่สามารถบันทึกข้อมูลได้");
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
    }
  };

  const handleDeleteData = async (id) => {
  if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?")) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // อัปเดต State โดยกรองข้อมูลที่ถูกลบทิ้งไป
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
  
  // --- DATA PROCESSING ---

  // 1. Filter Data
  const filteredData = useMemo(() => {
    return reportData.filter(item => {
      const unitMatch = selectedUnit === 'ทั้งหมด' || item.unit === selectedUnit;
      const districtMatch = selectedDistrict === 'ทั้งหมด' || item.district === selectedDistrict;
      return unitMatch && districtMatch;
    });
  }, [reportData, selectedUnit, selectedDistrict]);

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
      const month = curr.date.substring(0, 7); // 2023-10
      if (!acc[month]) acc[month] = { name: month, vaccine: 0, sterilize: 0, total: 0 };
      acc[month].vaccine += curr.stats.vaccine;
      acc[month].sterilize += curr.stats.sterilize;
      acc[month].total += (curr.stats.vaccine + curr.stats.sterilize);
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredData]);

  // 4. Prepare Chart Data (Unit Comparison)
  const unitStats = useMemo(() => {
    const grouped = filteredData.reduce((acc, curr) => {
      if (!acc[curr.unit]) acc[curr.unit] = { name: curr.unit, count: 0, vaccine: 0, sterilize: 0 };
      acc[curr.unit].count += 1;
      acc[curr.unit].vaccine += curr.stats.vaccine;
      acc[curr.unit].sterilize += curr.stats.sterilize;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.vaccine - a.vaccine);
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 selection:bg-blue-100">
      
      {/* Modal */}
      <AddDataModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddNewData} 
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
             <div className="hidden lg:flex flex-col items-end mr-4">
                <span className="text-xs font-semibold text-slate-400">อัปเดตข้อมูลล่าสุด</span>
                <span className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('th-TH', { dateStyle: 'long'})}</span>
             </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกผลงานใหม่</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* --- FILTERS --- */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <span>ตัวกรองข้อมูล :</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Unit Filter */}
            <div className="relative group">
              <select 
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="appearance-none w-full sm:w-64 bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 pr-10 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer hover:bg-slate-100"
              >
                <option value="ทั้งหมด">ทุกหน่วยงาน</option>
                {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* District Filter */}
            <div className="relative group">
              <select 
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="appearance-none w-full sm:w-48 bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 pr-10 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer hover:bg-slate-100"
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
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorVaccine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSterilize" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ padding: 0 }}
                  />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="vaccine" name="💉 วัคซีน" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorVaccine)" activeDot={{r: 6, strokeWidth: 0}} />
                  <Area type="monotone" dataKey="sterilize" name="✂️ ทำหมัน" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSterilize)" activeDot={{r: 6, strokeWidth: 0}} />
                </AreaChart>
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
              <SimulatedMap data={filteredData} />
              
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
                    <th className="px-4 py-3 text-right">วัคซีน</th>
                    <th className="px-4 py-3 text-right">ทำหมัน</th>
                    <th className="px-4 py-3 text-right last:rounded-tr-lg">รวม (ตัว)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const districtStats = filteredData.reduce((acc, curr) => {
                      if (!acc[curr.district]) acc[curr.district] = { name: curr.district, total: 0, vac: 0, ster: 0 };
                      acc[curr.district].vac += curr.stats.vaccine;
                      acc[curr.district].ster += curr.stats.sterilize;
                      acc[curr.district].total += (curr.stats.vaccine + curr.stats.sterilize);
                      return acc;
                    }, {});
                    const ranked = Object.values(districtStats).sort((a, b) => b.total - a.total);
                    
                    return ranked.length > 0 ? ranked.map((d, index) => (
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
                        <td className="px-4 py-3 text-right text-slate-500">{d.vac.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{d.ster.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600 group-hover:text-blue-700">{d.total.toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-slate-400 italic">ไม่พบข้อมูลตามเงื่อนไข</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center flex justify-between items-center px-2">
              <span>*แสดงข้อมูลทุกเขตตามปริมาณงาน</span>
              <span>ข้อมูล ณ เวลาปัจจุบัน</span>
            </div>
          </div>

        </div>
        {/* --- ALL DATA TABLE WITH DELETE BUTTON --- */}
<div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-8">
  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
    <Database className="w-5 h-5 text-slate-600" />
    รายการข้อมูลทั้งหมด
  </h2>
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm text-left">
      <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
        <tr>
          <th className="px-4 py-3">วันที่</th>
          <th className="px-4 py-3">กิจกรรม/สถานที่</th>
          <th className="px-4 py-3">เขต</th>
          <th className="px-4 py-3 text-center">วัคซีน</th>
          <th className="px-4 py-3 text-center">ทำหมัน</th>
          <th className="px-4 py-3 text-center">จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {filteredData.map((item) => (
          <tr key={item._id} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 text-slate-600">{item.date}</td>
            <td className="px-4 py-3">
              <div className="font-bold text-slate-800">{item.activity}</div>
              <div className="text-xs text-slate-400">{item.location}</div>
            </td>
            <td className="px-4 py-3 text-slate-600">{item.district}</td>
            <td className="px-4 py-3 text-center font-semibold text-blue-600">{item.stats.vaccine}</td>
            <td className="px-4 py-3 text-center font-semibold text-orange-600">{item.stats.sterilize}</td>
            <td className="px-4 py-3 text-center">
              {/* ปุ่มลบที่ถามถึง ใส่ตรงนี้ครับ */}
              <button 
                onClick={() => handleDeleteData(item._id)} 
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
                title="ลบข้อมูล"
              >
                <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
      </main>
    </div>
  );
}