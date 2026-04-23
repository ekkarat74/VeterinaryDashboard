import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { 
  Edit, Plus, X, FileText, Trash2, 
  Syringe, Scissors, Database, Stethoscope, 
  Activity, Save, MapPin, Edit2, Check, Settings2, Search, Loader2, CalendarDays
} from 'lucide-react';
import { UNIT_TYPES, BANGKOK_DISTRICTS, BANGKOK_SUBDISTRICTS } from '../../constants/locations';

// ==============================
// 1. กำหนด Interfaces & Types
// ==============================

interface BreakdownStats {
  vaccine: string | number;
  medical: string | number;
  maleSterilize?: string | number;
  femaleSterilize?: string | number;
  register?: string | number;
  microchip?: string | number;
}

interface Breakdown {
  dog: BreakdownStats;
  cat: BreakdownStats;
  other: BreakdownStats;
  vaccineRequisitioned?: string | number;
  vaccineRemaining?: string | number;
}

interface FormDataState {
  date: string;
  location: string;
  district: string;
  subdistrict: string;
  unit: string;
  otherUnit: string;
  lat: string | number;
  long: string | number;
  mapLink: string;
}

interface CustomUnit {
  _id: string;
  name: string;
}

interface DispatchType {
  _id: string;
  title?: string;
  location: string;
  district?: string;
  lat?: number;
  lng?: number;
  mapLink?: string;
  date: string;
  time: string;
  closingTime?: string;
  team?: string;
  controllerName?: string;
  controllerPhone?: string;
  staff?: { controllers?: string[] };
  services?: string[];
  note?: string;
}

// Type สำหรับ Props ที่ Component นี้รับเข้ามา
interface AddDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>; 
  onUpdate: (id: string, payload: any) => Promise<void>;
  initialData?: any; // ถ้ามี Interface ของ Initial Data สามารถเปลี่ยนจาก any ได้
  onToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

// ==============================
// 2. ค่าเริ่มต้น (Default Values)
// ==============================

const defaultFormData: FormDataState = {
  date: new Date().toISOString().split('T')[0],
  location: '',
  district: BANGKOK_DISTRICTS[0] || '',
  subdistrict: '',
  unit: UNIT_TYPES[0] || '',
  otherUnit: '',
  lat: '',
  long: '',
  mapLink: ''
};

const defaultBreakdown: Breakdown = {
  dog: { maleSterilize: '', femaleSterilize: '', vaccine: '', register: '', microchip: '', medical: '' },
  cat: { maleSterilize: '', femaleSterilize: '', vaccine: '', register: '', microchip: '', medical: '' },
  other: { vaccine: '', medical: '' },
  vaccineRequisitioned: '',
  vaccineRemaining: ''
};

// ==============================
// 3. Component
// ==============================

const AddDataModal: React.FC<AddDataModalProps> = ({ 
  isOpen, onClose, onSave, onUpdate, initialData, onToast 
}) => {
  // --- States ---
  const [formData, setFormData] = useState<FormDataState>(defaultFormData);
  const [breakdown, setBreakdown] = useState<Breakdown>(defaultBreakdown);
  const [coordInput, setCoordInput] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [showDistrictDropdown, setShowDistrictDropdown] = useState<boolean>(false);

  const [customUnitsObj, setCustomUnitsObj] = useState<CustomUnit[]>([]);
  const [isManagingUnits, setIsManagingUnits] = useState<boolean>(false); 
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitName, setEditingUnitName] = useState<string>("");

  const [foundDispatch, setFoundDispatch] = useState<DispatchType | null>(null);
  const [allDispatches, setAllDispatches] = useState<DispatchType[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const BASE_URL = 'https://veterinarydashboard-hwho.onrender.com';
  
  const getUserToken = (): string => {
    const user = localStorage.getItem('vet_user');
    if (user) {
      try {
        return JSON.parse(user).token || '';
      } catch (e) {
        return '';
      }
    }
    return '';
  };

  const allUnitOptions = useMemo(() => {
    const baseUnits = UNIT_TYPES.filter(u => u !== 'หน่วยอื่น ๆ');
    const dbUnits = customUnitsObj.map(u => u.name);
    return [...new Set([...baseUnits, ...dbUnits]), 'หน่วยอื่น ๆ'];
  }, [customUnitsObj]);

  const fetchData = async () => {
    try {
      const [unitsRes, dispatchRes] = await Promise.all([
        fetch(`${BASE_URL}/api/custom-units`),
        fetch(`${BASE_URL}/api/dispatches`)
      ]);

      if (unitsRes.ok) {
        const data = await unitsRes.json();
        setCustomUnitsObj(Array.isArray(data) ? data : []); 
      }

      if (dispatchRes.ok) {
        const dData = await dispatchRes.json();
        setAllDispatches(Array.isArray(dData) ? dData : []);
      }
    } catch (error) {
      console.error("Fetch data error", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setIsSubmitting(false);
    } else {
      setFormData(defaultFormData);
      setBreakdown(defaultBreakdown);
      setCoordInput("");
      setImagePreview(null);
      setFoundDispatch(null);
      setAllDispatches([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        ...defaultFormData,
        ...initialData,
        unit: allUnitOptions.includes(initialData.unit) ? initialData.unit : 'หน่วยอื่น ๆ',
        otherUnit: !allUnitOptions.includes(initialData.unit) ? initialData.unit : ''
      });
      setBreakdown(initialData.details || defaultBreakdown);
      setCoordInput(initialData.lat ? `${initialData.lat}, ${initialData.long}` : "");
      setImagePreview(initialData.imageUrl || null);
    }
  }, [isOpen, initialData, allUnitOptions]);

  const dispatchesOnSelectedDate = useMemo(() => {
    if (!formData.date || !allDispatches.length) return [];
    return allDispatches.filter(d => d.date && d.date.startsWith(formData.date));
  }, [allDispatches, formData.date]);

  const handleUseDispatchData = (dispatch: DispatchType) => {
    const newLat = dispatch.lat || formData.lat;
    const newLng = dispatch.lng || formData.long;

    setFormData(prev => ({
      ...prev,
      location: dispatch.location || prev.location,
      district: dispatch.district || prev.district,
      mapLink: dispatch.mapLink || prev.mapLink,
      lat: newLat,
      long: newLng
    }));

    if (newLat || newLng) {
      setCoordInput(`${newLat || ''}, ${newLng || ''}`);
    }

    if (onToast) onToast('success', 'ดึงข้อมูลลงฟอร์มเรียบร้อยแล้ว');
  };

  const handleSearchLocation = () => {
    if (!formData.location.trim()) return;
    const match = allDispatches.find(d => 
      d.location && d.location.toLowerCase().includes(formData.location.toLowerCase())
    );
    if (match) {
      setFoundDispatch(match);
      if(onToast) onToast('success', 'พบข้อมูลสถานที่ในแผนออกหน่วย');
    } else {
      setFoundDispatch(null);
      if(onToast) onToast('info', 'ไม่พบข้อมูลสถานที่นี้ในแผนออกหน่วย');
    }
  };

  const handleDeleteUnit = async (id: string, name: string) => {
    if (!window.confirm(`ยืนยันลบหน่วย: ${name}?`)) return;
    try {
      const res = await fetch(`${BASE_URL}/api/custom-units/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getUserToken()}` }
      });
      if (res.ok) {
        if (onToast) onToast('success', 'ลบหน่วยงานสำเร็จ');
        fetchData();
      }
    } catch (err) { 
      if (onToast) onToast('error', 'ลบไม่สำเร็จ'); 
    }
  };

  const handleUpdateUnitName = async (id: string) => {
    if (!editingUnitName.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/api/custom-units/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getUserToken()}` },
        body: JSON.stringify({ name: editingUnitName })
      });
      if (res.ok) {
        if (onToast) onToast('success', 'แก้ไขสำเร็จ');
        setEditingUnitId(null);
        fetchData();
      }
    } catch (err) { 
      if (onToast) onToast('error', 'แก้ไขไม่สำเร็จ'); 
    }
  };

  const totals = useMemo(() => {
    const parse = (val: string | number | undefined) => parseInt(String(val)) || 0;
    const { dog, cat, other } = breakdown;
    return {
      vaccine: parse(dog.vaccine) + parse(cat.vaccine) + parse(other.vaccine),
      sterilize: parse(dog.maleSterilize) + parse(dog.femaleSterilize) + parse(cat.maleSterilize) + parse(cat.femaleSterilize),
      register: parse(dog.register) + parse(cat.register),
      microchip: parse(dog.microchip) + parse(cat.microchip),
      medical: parse(dog.medical) + parse(cat.medical) + parse(other.medical),
    };
  }, [breakdown]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const totalStats = totals.vaccine + totals.sterilize + totals.register + totals.microchip + totals.medical;
    if (totalStats === 0) {
      const confirmZero = window.confirm('⚠️ ยอดรวมการให้บริการทั้งหมดเป็น 0\n\nคุณแน่ใจหรือไม่ว่าต้องการบันทึกข้อมูลนี้?');
      if (!confirmZero) return;
    }

    if (!initialData) {
      try {
        setIsSubmitting(true);
        const res = await fetch(`${BASE_URL}/api/reports?startDate=${formData.date}&endDate=${formData.date}`);
        if (res.ok) {
          const data = await res.json();
          const reportsOnDate = Array.isArray(data) ? data : (data.data || []);
          
          const isDuplicate = reportsOnDate.some((report: any) => 
            report.location.trim().toLowerCase() === formData.location.trim().toLowerCase()
          );

          if (isDuplicate) {
            const confirmDuplicate = window.confirm(`🚨 พบข้อมูลซ้ำซ้อนในระบบ!\n\nมีการบันทึกผลปฏิบัติงานของสถานที่ "${formData.location}" ในวันที่ ${new Date(formData.date).toLocaleDateString('th-TH')} ไปแล้วก่อนหน้านี้\n\nคุณต้องการบันทึกเป็นข้อมูลใหม่แยกอีกบรรทึกหนึ่งหรือไม่?`);
            if (!confirmDuplicate) {
              setIsSubmitting(false);
              return;
            }
          }
        }
      } catch (error) {
        console.error("Duplicate check failed", error);
      }
    }

    setIsSubmitting(true);
    const finalUnit = formData.unit === 'หน่วยอื่น ๆ' ? formData.otherUnit : formData.unit;

    const payload = {
      ...formData,
      unit: finalUnit,
      stats: totals,
      details: breakdown,
      lat: parseFloat(String(formData.lat)) || 0,
      long: parseFloat(String(formData.long)) || 0,
      imageUrl: imagePreview
    };

    if (initialData) {
      await onUpdate(initialData._id, payload);
    } else {
      await onSave(payload);
    }
    
    setIsSubmitting(false);
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
          <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 uppercase mb-5 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span> ข้อมูลทั่วไป
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-3">
                  <label className={labelClass}>วันที่</label>
                  <input type="date" required className={inputClass} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} disabled={isSubmitting} />
                </div>

                <div className="md:col-span-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-600">หน่วยกิจกรรม</label>
                    <button type="button" onClick={() => setIsManagingUnits(!isManagingUnits)} disabled={isSubmitting} className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-1">
                      <Settings2 className="w-3 h-3" /> {isManagingUnits ? 'เสร็จสิ้น' : 'จัดการหน่วย'}
                    </button>
                  </div>

                  {isManagingUnits ? (
                    <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 max-h-32 overflow-y-auto custom-scrollbar">
                      {customUnitsObj.map(u => (
                        <div key={u._id} className="flex items-center justify-between p-2 bg-white mb-1 rounded-lg border border-slate-100">
                          {editingUnitId === u._id ? (
                            <input autoFocus className="flex-1 text-xs outline-none" value={editingUnitName} onChange={e => setEditingUnitName(e.target.value)} disabled={isSubmitting} />
                          ) : (
                            <span className="text-xs text-slate-700 truncate">{u.name}</span>
                          )}
                          <div className="flex gap-1">
                            {editingUnitId === u._id ? (
                              <button type="button" onClick={() => handleUpdateUnitName(u._id)} disabled={isSubmitting} className="text-emerald-600 p-1"><Check className="w-3.5 h-3.5" /></button>
                            ) : (
                              <button type="button" onClick={() => {setEditingUnitId(u._id); setEditingUnitName(u.name);}} disabled={isSubmitting} className="text-amber-500 p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                            )}
                            <button type="button" onClick={() => handleDeleteUnit(u._id, u.name)} disabled={isSubmitting} className="text-rose-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <select className={inputClass} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value, otherUnit: ''})} disabled={isSubmitting}>
                      {allUnitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  )}

                  {formData.unit === 'หน่วยอื่น ๆ' && !isManagingUnits && (
                    <input type="text" required placeholder="ระบุหน่วยงานใหม่..." className={`${inputClass} mt-2 bg-blue-50`} value={formData.otherUnit} onChange={e => setFormData({...formData, otherUnit: e.target.value})} disabled={isSubmitting} />
                  )}
                </div>

                <div className="md:col-span-5">
                  <label className={labelClass}>สถานที่</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required 
                      placeholder="ระบุสถานที่/จุดบริการ" 
                      className={inputClass} 
                      value={formData.location} 
                      onChange={e => {
                        setFormData({...formData, location: e.target.value});
                        setFoundDispatch(null);
                      }} 
                      disabled={isSubmitting}
                    />
                    <button 
                      type="button" 
                      onClick={handleSearchLocation} 
                      disabled={isSubmitting}
                      className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors flex items-center justify-center shrink-0 disabled:opacity-50" 
                      title="ค้นหาข้อมูลจากแผนออกหน่วย"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className={labelClass}>เขต</label>
                  <div className="relative">
                    <input type="text" className={inputClass} placeholder="พิมพ์เพื่อค้นหาเขต..." value={formData.district} 
                      onChange={e => {
                        setFormData({...formData, district: e.target.value, subdistrict: ''});
                        setShowDistrictDropdown(true);
                      }}
                      onFocus={() => setShowDistrictDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDistrictDropdown(false), 200)}
                      disabled={isSubmitting}
                    />
                    
                    {showDistrictDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                        {BANGKOK_DISTRICTS.filter(d => d.includes(formData.district || '')).length > 0 ? (
                          BANGKOK_DISTRICTS.filter(d => d.includes(formData.district || '')).map(d => (
                            <div 
                              key={d} 
                              className="px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault(); 
                                setFormData({...formData, district: d, subdistrict: ''});
                                setShowDistrictDropdown(false);
                              }}
                            >
                              {d}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-slate-400 text-center">ไม่พบข้อมูลเขต</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className={labelClass}>แขวง</label>
                  <select className={inputClass} value={formData.subdistrict} onChange={e => setFormData({...formData, subdistrict: e.target.value})} disabled={isSubmitting}>
                    <option value="">-- เลือกแขวง --</option>
                    {formData.district && BANGKOK_SUBDISTRICTS[formData.district as keyof typeof BANGKOK_SUBDISTRICTS]?.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className={labelClass}>พิกัด (Lat, Long)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="13.xxx, 100.xxx" className={`${inputClass} pl-10`} value={coordInput} 
                      disabled={isSubmitting}
                      onChange={e => {
                      const val = e.target.value;
                      setCoordInput(val);
  
                      if (!val.trim()) {
                        setFormData({...formData, lat: '', long: ''});
                        return;
                      }

                      const parts = val.split(',');
                        if(parts.length >= 2) {
                          setFormData({...formData, lat: parts[0].trim(), long: parts[1].trim()});
                        }
                      }}
                    />
                  </div>
                </div>

                {/* การแสดงการ์ดรายการแผนออกหน่วย */}
                {dispatchesOnSelectedDate.length > 0 && !initialData && (
                  <div className="md:col-span-12 mt-2 pt-4 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-3">
                      <CalendarDays className="w-4 h-4 text-indigo-500" />
                      แผนออกหน่วยประจำวันที่ {new Date(formData.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })} 
                      <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{dispatchesOnSelectedDate.length} รายการ</span>
                    </label>
                    
                    <div className="flex overflow-x-auto gap-3 pb-3 custom-scrollbar">
                      {dispatchesOnSelectedDate.map(dispatch => (
                        <div key={dispatch._id} className="min-w-[260px] max-w-[280px] bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-3 shadow-sm hover:shadow-md transition-all shrink-0 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                                {dispatch.title || 'แผนออกหน่วย'}
                              </span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Activity className="w-3 h-3"/> {dispatch.time}
                              </span>
                            </div>
                            <div className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">
                              {dispatch.location}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" /> เขต{dispatch.district || '-'}
                            </div>
                          </div>
                          
                          <button 
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setFoundDispatch(dispatch)} 
                            className="mt-3 w-full py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-xs font-bold rounded-lg transition-colors border border-indigo-100 disabled:opacity-50"
                          >
                            ดูข้อมูล
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* กล่องแสดงรายละเอียดที่เลือกดู */}
            {foundDispatch && (
              <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-100 shadow-sm animate-in fade-in duration-300">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> ข้อมูลสถานที่จากแผนออกหน่วย (Dispatch Plan)
                  </h4>
                  <button 
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleUseDispatchData(foundDispatch)}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 shrink-0 ml-2"
                  >
                    ใช้ข้อมูลนี้
                  </button>
                </div>
                
                {(() => {
                  let phoneNum = foundDispatch.controllerPhone;
                  let controllerName = foundDispatch.controllerName; 
                  if (foundDispatch.staff?.controllers?.[0]) {
                      const splitData = foundDispatch.staff.controllers[0].split('โทร.');
                      if (!controllerName) controllerName = splitData[0].trim();
                      if (!phoneNum && splitData.length > 1) phoneNum = splitData[1].trim();
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 bg-white p-4 rounded-xl border border-indigo-50">
                      {foundDispatch.title && (
                        <div className="sm:col-span-2">
                          <span className="font-bold text-slate-500">กิจกรรม:</span> <span className="font-bold text-indigo-700">{foundDispatch.title}</span>
                        </div>
                      )}
                      
                      <div><span className="font-bold text-slate-500">สถานที่:</span> {foundDispatch.location}</div>
                      <div><span className="font-bold text-slate-500">วันที่:</span> {new Date(foundDispatch.date).toLocaleDateString('th-TH')}</div>
                      <div><span className="font-bold text-slate-500">เขต:</span> {foundDispatch.district || '-'}</div>
                      <div><span className="font-bold text-slate-500">เวลาปฏิบัติงาน:</span> {foundDispatch.time} - {foundDispatch.closingTime || 'ไม่ระบุ'}</div>
                      
                      {foundDispatch.team && (
                        <div><span className="font-bold text-slate-500">ทีมปฏิบัติการ:</span> {foundDispatch.team}</div>
                      )}
                      {(controllerName || phoneNum) && (
                        <div>
                          <span className="font-bold text-slate-500">ผู้ประสานงาน:</span> {controllerName || '-'}
                          {phoneNum && <span className="ml-1 text-indigo-600 font-medium">(โทร. {phoneNum})</span>}
                        </div>
                      )}

                      {foundDispatch.services && foundDispatch.services.length > 0 && (
                        <div className="sm:col-span-2 flex flex-wrap gap-1.5 items-center mt-1">
                          <span className="font-bold text-slate-500">บริการ:</span>
                          {foundDispatch.services.map((srv, i) => (
                            <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold">
                              {srv}
                            </span>
                          ))}
                        </div>
                      )}

                      {foundDispatch.mapLink && (
                        <div className="sm:col-span-2 mt-1">
                          <span className="font-bold text-slate-500">ลิงก์แผนที่:</span>{' '}
                          <a href={foundDispatch.mapLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                            {foundDispatch.mapLink}
                          </a>
                        </div>
                      )}

                      {foundDispatch.note && (
                        <div className="sm:col-span-2 mt-1 p-2 bg-amber-50/50 rounded-lg border border-amber-100/50">
                          <span className="font-bold text-amber-600">หมายเหตุ:</span> {foundDispatch.note}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SECTION 2: Quantitative Data */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 uppercase mb-5 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span> ข้อมูลจำนวนสัตว์
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. ฉีดวัคซีน */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-blue-50/50 px-4 py-2 border-b border-slate-200 font-bold text-blue-700 flex items-center gap-2">
                    <Syringe className="w-4 h-4" /> ฉีดวัคซีน
                  </div>
                  {/* แก้ไข grid จาก grid-cols-3 เป็น sm:grid-cols-5 เพื่อให้แสดงเรียง 5 ช่องพอดี */}
                  <div className="p-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
                    
                    {/* 1. จำนวนวัคซีนที่เบิก (เอาไว้ก่อนสุนัข) */}
                    <div>
                      <label className="text-[10px] text-blue-600 uppercase font-bold mb-1 block">วัคซีนที่เบิก</label>
                      <input type="number" min="0" placeholder="0" className="w-full p-2 border border-blue-100 bg-blue-50/30 rounded-lg text-center" value={breakdown.vaccineRequisitioned} 
                        disabled={isSubmitting}
                        onChange={e => setBreakdown({...breakdown, vaccineRequisitioned: e.target.value})} />
                    </div>

                    {/* 2,3,4 สุนัข, แมว, อื่นๆ */}
                    {(['dog', 'cat', 'other'] as const).map(t => (
                      <div key={t}>
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">{t === 'dog' ? 'สุนัข' : t === 'cat' ? 'แมว' : 'อื่นๆ'}</label>
                        <input type="number" min="0" placeholder="0" className="w-full p-2 border border-slate-200 rounded-lg text-center" value={breakdown[t].vaccine} 
                          disabled={isSubmitting}
                          onChange={e => setBreakdown({...breakdown, [t]: {...breakdown[t], vaccine: e.target.value}})} />
                      </div>
                    ))}

                    {/* 5. คงเหลือวัคซีน (เอาไว้หลังอื่นๆ) */}
                    <div>
                      <label className="text-[10px] text-rose-500 uppercase font-bold mb-1 block">คงเหลือ</label>
                      <input type="number" min="0" placeholder="0" className="w-full p-2 border border-rose-100 bg-rose-50/30 rounded-lg text-center" value={breakdown.vaccineRemaining} 
                        disabled={isSubmitting}
                        onChange={e => setBreakdown({...breakdown, vaccineRemaining: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* 2. ผ่าตัดทำหมัน */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-orange-50/50 px-4 py-2 border-b border-slate-200 font-bold text-orange-700 flex items-center gap-2">
                    <Scissors className="w-4 h-4" /> ผ่าตัดทำหมัน
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    {(['dog', 'cat'] as const).map(t => (
                      <div key={t} className="space-y-2">
                        <label className="text-[10px] text-slate-500 uppercase font-bold block">{t === 'dog' ? '🐶 สุนัข' : '🐱 แมว'}</label>
                        <div className="flex gap-2">
                          <input type="number" placeholder="ผู้" className="w-full p-2 border border-slate-200 rounded-lg text-center text-xs" value={breakdown[t].maleSterilize} 
                            disabled={isSubmitting}
                            onChange={e => setBreakdown({...breakdown, [t]: {...breakdown[t], maleSterilize: e.target.value}})} />
                          <input type="number" placeholder="เมีย" className="w-full p-2 border border-slate-200 rounded-lg text-center text-xs" value={breakdown[t].femaleSterilize} 
                            disabled={isSubmitting}
                            onChange={e => setBreakdown({...breakdown, [t]: {...breakdown[t], femaleSterilize: e.target.value}})} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. ฝังไมโครชิป */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-purple-50/50 px-4 py-2 border-b border-slate-200 font-bold text-purple-700 flex items-center gap-2">
                    <Database className="w-4 h-4" /> ฝังไมโครชิป
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    {(['dog', 'cat'] as const).map(t => (
                      <div key={t}>
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">{t === 'dog' ? 'สุนัข' : 'แมว'}</label>
                        <input type="number" min="0" placeholder="0" className="w-full p-2 border border-slate-200 rounded-lg text-center" value={breakdown[t].microchip} 
                          disabled={isSubmitting}
                          onChange={e => setBreakdown({...breakdown, [t]: {...breakdown[t], microchip: e.target.value}})} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. จดทะเบียน */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50/50 px-4 py-2 border-b border-slate-200 font-bold text-emerald-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> จดทะเบียนสัตว์
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    {(['dog', 'cat'] as const).map(t => (
                      <div key={t}>
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">{t === 'dog' ? 'สุนัข' : 'แมว'}</label>
                        <input type="number" min="0" placeholder="0" className="w-full p-2 border border-slate-200 rounded-lg text-center" value={breakdown[t].register} 
                          disabled={isSubmitting}
                          onChange={e => setBreakdown({...breakdown, [t]: {...breakdown[t], register: e.target.value}})} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. รักษาสัตว์ */}
                <div className="border border-slate-200 rounded-xl overflow-hidden lg:col-span-2">
                  <div className="bg-rose-50/50 px-4 py-2 border-b border-slate-200 font-bold text-rose-700 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" /> รักษาสัตว์
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-3">
                    {(['dog', 'cat', 'other'] as const).map(t => (
                      <div key={t}>
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">{t === 'dog' ? 'สุนัข' : t === 'cat' ? 'แมว' : 'อื่นๆ'}</label>
                        <input type="number" min="0" placeholder="0" className="w-full p-2 border border-slate-200 rounded-lg text-center" value={breakdown[t].medical} 
                          disabled={isSubmitting}
                          onChange={e => setBreakdown({...breakdown, [t]: {...breakdown[t], medical: e.target.value}})} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-12 mt-4">
                <label className={labelClass}>แนบรูปภาพผลการปฏิบัติงาน</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  disabled={isSubmitting}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }} 
                />
                  {imagePreview && (
                    <div className="mt-2 relative inline-block">
                      <img src={imagePreview} alt="Preview" className="h-32 rounded-lg object-cover border border-slate-200" />
                      <button 
                        type="button" 
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* สรุปยอดรวม (Summary Bar) */}
              <div className="mt-6 bg-slate-900 rounded-2xl p-5 text-white flex flex-wrap justify-around gap-4">
                <div className="text-center"><div className="text-2xl font-bold">{totals.vaccine}</div><div className="text-[10px] text-slate-400 uppercase">วัคซีน</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-orange-400">{totals.sterilize}</div><div className="text-[10px] text-slate-400 uppercase">ทำหมัน</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-emerald-400">{totals.register}</div><div className="text-[10px] text-slate-400 uppercase">จดทะเบียน</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-purple-400">{totals.microchip}</div><div className="text-[10px] text-slate-400 uppercase">ไมโครชิป</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-rose-400">{totals.medical}</div><div className="text-[10px] text-slate-400 uppercase">รักษา</div></div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50">
              ยกเลิก
            </button>
            <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 transition-all disabled:bg-blue-400">
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> กำลังบันทึก...</>
              ) : (
                <><Save className="w-5 h-5" /> {initialData ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDataModal;