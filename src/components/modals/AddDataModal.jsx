import React, { useState, useEffect, useMemo } from 'react';
import { 
  Edit, Plus, X, FileText, Trash2, 
  Syringe, Scissors, Database, Stethoscope, 
  Activity, Save, MapPin, Edit2, Check, Settings2
} from 'lucide-react';

import { UNIT_TYPES, BANGKOK_DISTRICTS, BANGKOK_SUBDISTRICTS } from '../../constants/locations';

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

const defaultBreakdown = {
  dog: { maleSterilize: '', femaleSterilize: '', vaccine: '', register: '', microchip: '', medical: '' },
  cat: { maleSterilize: '', femaleSterilize: '', vaccine: '', register: '', microchip: '', medical: '' },
  other: { vaccine: '', medical: '' }
};

const AddDataModal = ({ isOpen, onClose, onSave, onUpdate, initialData, onToast }) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [breakdown, setBreakdown] = useState(defaultBreakdown);
  const [coordInput, setCoordInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // States สำหรับจัดการ Custom Units จาก DB
  const [customUnitsObj, setCustomUnitsObj] = useState([]);
  const [isManagingUnits, setIsManagingUnits] = useState(false); 
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editingUnitName, setEditingUnitName] = useState("");

  const BASE_URL = 'https://veterinarydashboard-hwho.onrender.com';
  const getUserToken = () => JSON.parse(localStorage.getItem('vet_user'))?.token || '';

  // 1. รวมหน่วยงาน (Hybrid Logic)
  const allUnitOptions = useMemo(() => {
    const baseUnits = UNIT_TYPES.filter(u => u !== 'หน่วยอื่น ๆ');
    const dbUnits = customUnitsObj.map(u => u.name);
    return [...new Set([...baseUnits, ...dbUnits]), 'หน่วยอื่น ๆ'];
  }, [customUnitsObj]);

  // 2. ดึงข้อมูลหน่วยงานจาก DB เมื่อเปิด Modal
  const fetchCustomUnits = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/custom-units`);
      if (res.ok) {
        const data = await res.json();
        setCustomUnitsObj(data);
      }
    } catch (error) {
      console.error("Fetch units error", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomUnits();
      if (initialData) {
        // Setup data สำหรับโหมดแก้ไข
        setFormData({
          ...initialData,
          unit: allUnitOptions.includes(initialData.unit) ? initialData.unit : 'หน่วยอื่น ๆ',
          otherUnit: !allUnitOptions.includes(initialData.unit) ? initialData.unit : ''
        });
        setBreakdown(initialData.details || defaultBreakdown);
        setCoordInput(initialData.lat ? `${initialData.lat}, ${initialData.long}` : "");
        setImagePreview(initialData.imageUrl || null);
      } else {
        setFormData(defaultFormData);
        setBreakdown(defaultBreakdown);
        setCoordInput("");
        setImagePreview(null);
      }
    }
  }, [isOpen, initialData]);

  // ฟังก์ชันจัดการหน่วยงานใน DB (Update/Delete)
  const handleDeleteUnit = async (id, name) => {
    if (!window.confirm(`ยืนยันลบหน่วย: ${name}?`)) return;
    try {
      const res = await fetch(`${BASE_URL}/api/custom-units/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getUserToken()}` }
      });
      if (res.ok) {
        onToast('success', 'ลบหน่วยงานสำเร็จ');
        fetchCustomUnits();
      }
    } catch (err) { onToast('error', 'ลบไม่สำเร็จ'); }
  };

  const handleUpdateUnitName = async (id) => {
    if (!editingUnitName.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/api/custom-units/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getUserToken()}` },
        body: JSON.stringify({ name: editingUnitName })
      });
      if (res.ok) {
        onToast('success', 'แก้ไขสำเร็จ');
        setEditingUnitId(null);
        fetchCustomUnits();
      }
    } catch (err) { onToast('error', 'แก้ไขไม่สำเร็จ'); }
  };

  // คำนวณยอดรวมอัตโนมัติ
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalUnit = formData.unit === 'หน่วยอื่น ๆ' ? formData.otherUnit : formData.unit;

    const payload = {
      ...formData,
      unit: finalUnit,
      stats: totals,
      details: breakdown,
      lat: parseFloat(formData.lat) || 0,
      long: parseFloat(formData.long) || 0,
      imageUrl: imagePreview // ในระบบจริงควรแปลงเป็น Base64 หรือ Upload ขึ้น Cloud
    };

    if (initialData) onUpdate(initialData._id, payload);
    else onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-slate-600 mb-1.5";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 sm:p-6">
      <div className="bg-white w-full max-w-5xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${initialData ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
              {initialData ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              {initialData ? 'แก้ไขข้อมูลปฏิบัติงาน' : 'บันทึกผลปฏิบัติงานใหม่'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* ส่วนข้อมูลทั่วไป */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 uppercase mb-5 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span> ข้อมูลทั่วไป
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-3">
                  <label className={labelClass}>วันที่</label>
                  <input type="date" required className={inputClass} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>

                <div className="md:col-span-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-600">หน่วยกิจกรรม</label>
                    <button type="button" onClick={() => setIsManagingUnits(!isManagingUnits)} className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-1">
                      <Settings2 className="w-3 h-3" /> {isManagingUnits ? 'เสร็จสิ้น' : 'จัดการหน่วย'}
                    </button>
                  </div>

                  {isManagingUnits ? (
                    <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 max-h-32 overflow-y-auto custom-scrollbar">
                      {customUnitsObj.map(u => (
                        <div key={u._id} className="flex items-center justify-between p-2 bg-white mb-1 rounded-lg border border-slate-100">
                          {editingUnitId === u._id ? (
                            <input autoFocus className="flex-1 text-xs outline-none" value={editingUnitName} onChange={e => setEditingUnitName(e.target.value)} />
                          ) : (
                            <span className="text-xs text-slate-700 truncate">{u.name}</span>
                          )}
                          <div className="flex gap-1">
                            {editingUnitId === u._id ? (
                              <button type="button" onClick={() => handleUpdateUnitName(u._id)} className="text-emerald-600 p-1"><Check className="w-3.5 h-3.5" /></button>
                            ) : (
                              <button type="button" onClick={() => {setEditingUnitId(u._id); setEditingUnitName(u.name);}} className="text-amber-500 p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                            )}
                            <button type="button" onClick={() => handleDeleteUnit(u._id, u.name)} className="text-rose-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <select className={inputClass} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value, otherUnit: ''})}>
                      {allUnitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  )}

                  {formData.unit === 'หน่วยอื่น ๆ' && !isManagingUnits && (
                    <input type="text" required placeholder="ระบุหน่วยงานใหม่..." className={`${inputClass} mt-2 bg-blue-50`} value={formData.otherUnit} onChange={e => setFormData({...formData, otherUnit: e.target.value})} />
                  )}
                </div>

                <div className="md:col-span-5">
                  <label className={labelClass}>สถานที่</label>
                  <input type="text" required placeholder="ระบุสถานที่/จุดบริการ" className={inputClass} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>

                <div className="md:col-span-4">
                  <label className={labelClass}>เขต</label>
                  <select className={inputClass} value={formData.district} onChange={e => setFormData({...formData, district: e.target.value, subdistrict: ''})}>
                    {BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className={labelClass}>แขวง</label>
                  <select className={inputClass} value={formData.subdistrict} onChange={e => setFormData({...formData, subdistrict: e.target.value})}>
                    <option value="">-- เลือกแขวง --</option>
                    {formData.district && BANGKOK_SUBDISTRICTS[formData.district]?.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className={labelClass}>พิกัด (Lat, Long)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="13.xxx, 100.xxx" className={`${inputClass} pl-10`} value={coordInput} 
                      onChange={e => {
                        setCoordInput(e.target.value);
                        const parts = e.target.value.split(',');
                        if(parts.length === 2) setFormData({...formData, lat: parts[0].trim(), long: parts[1].trim()});
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ส่วนข้อมูลเชิงปริมาณ */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 uppercase mb-5 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span> ข้อมูลจำนวนสัตว์
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ฉีดวัคซีน */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-blue-50/50 px-4 py-2 border-b border-slate-200 font-bold text-blue-700 flex items-center gap-2">
                    <Syringe className="w-4 h-4" /> ฉีดวัคซีน
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-3">
                    {['dog', 'cat', 'other'].map(t => (
                      <div key={t}>
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">{t === 'dog' ? 'สุนัข' : t === 'cat' ? 'แมว' : 'อื่นๆ'}</label>
                        <input type="number" min="0" className="w-full p-2 border border-slate-200 rounded-lg text-center" value={breakdown[t].vaccine} 
                          onChange={e => setBreakdown({...breakdown, [t]: {...breakdown[t], vaccine: e.target.value}})} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* ทำหมัน */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-orange-50/50 px-4 py-2 border-b border-slate-200 font-bold text-orange-700 flex items-center gap-2">
                    <Scissors className="w-4 h-4" /> ผ่าตัดทำหมัน
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    {['dog', 'cat'].map(t => (
                      <div key={t} className="space-y-2">
                        <label className="text-[10px] text-slate-500 uppercase font-bold block">{t === 'dog' ? '🐶 สุนัข' : '🐱 แมว'}</label>
                        <div className="flex gap-2">
                          <input type="number" placeholder="ผู้" className="w-full p-2 border border-slate-200 rounded-lg text-center text-xs" value={breakdown[t].maleSterilize} 
                            onChange={e => setBreakdown({...breakdown, [t]: {...breakdown[t], maleSterilize: e.target.value}})} />
                          <input type="number" placeholder="เมีย" className="w-full p-2 border border-slate-200 rounded-lg text-center text-xs" value={breakdown[t].femaleSterilize} 
                            onChange={e => setBreakdown({...breakdown, [t]: {...breakdown[t], femaleSterilize: e.target.value}})} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* สรุปยอดรวม (Live) */}
              <div className="mt-6 bg-slate-900 rounded-2xl p-5 text-white flex flex-wrap justify-around gap-4">
                <div className="text-center"><div className="text-2xl font-bold">{totals.vaccine}</div><div className="text-[10px] text-slate-400 uppercase">วัคซีน</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-orange-400">{totals.sterilize}</div><div className="text-[10px] text-slate-400 uppercase">ทำหมัน</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-emerald-400">{totals.register}</div><div className="text-[10px] text-slate-400 uppercase">จดทะเบียน</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-purple-400">{totals.microchip}</div><div className="text-[10px] text-slate-400 uppercase">ไมโครชิป</div></div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">ยกเลิก</button>
            <button type="submit" className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 transition-all">
              <Save className="w-5 h-5" /> {initialData ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDataModal;