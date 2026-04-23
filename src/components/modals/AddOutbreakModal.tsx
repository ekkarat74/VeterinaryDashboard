import React, { useState, useEffect } from 'react';
import { Skull, X, Navigation, MapPin, Activity, Edit, Siren, Calendar, Map, ClipboardList, PawPrint } from 'lucide-react';
import { BANGKOK_DISTRICTS } from '../../constants/locations';

// --- Types & Interfaces (คงเดิม) ---
interface GenderStats { male: number; female: number; }
interface AnimalStats { dog: GenderStats; cat: GenderStats; }
interface BaseStats { owned: AnimalStats; unowned: AnimalStats; feeder: AnimalStats; }
interface InsightData {
  spcc: string; testNo: string; animalType: string; ownership: string; gender: string; breed: string; color: string; age: string; vaccineHistory: string;
}
interface FormData {
  date: string; location: string; district: string; lat: string; long: string; stats: BaseStats; insight: InsightData;
}
interface PayloadData extends Omit<FormData, 'lat' | 'long'> { lat: number; long: number; }
interface InitialData extends Partial<PayloadData> { _id: string; }
interface CategoryItem { key: keyof BaseStats; label: string; color: string; badge: string; }
interface Breed { name: string; }
interface Color { name: string; }

interface AddOutbreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: PayloadData) => void;
  onUpdate: (id: string, payload: PayloadData) => void;
  initialData?: InitialData | null;
  onToast?: (message: string, type: 'success' | 'error') => void;
  breeds?: Breed[];
  colors?: Color[];
}

// --- Constants ---
const DEFAULT_STATS: BaseStats = {
  owned: { dog: { male: 0, female: 0 }, cat: { male: 0, female: 0 } },
  unowned: { dog: { male: 0, female: 0 }, cat: { male: 0, female: 0 } },
  feeder: { dog: { male: 0, female: 0 }, cat: { male: 0, female: 0 } }
};

const DEFAULT_INSIGHT: InsightData = {
  spcc: '', testNo: '', animalType: '', ownership: '', gender: '', breed: '', color: '', age: '', vaccineHistory: ''
};

const CATEGORIES: CategoryItem[] = [
  { key: 'owned', label: 'สัตว์มีเจ้าของ', badge: '🏠', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { key: 'unowned', label: 'สัตว์ไม่มีเจ้าของ', badge: '🛣️', color: 'bg-orange-50 border-orange-200 text-orange-800' },
  { key: 'feeder', label: 'สัตว์มีผู้ให้อาหาร', badge: '🥣', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' }
];

// --- Component ---
const AddOutbreakModal: React.FC<AddOutbreakModalProps> = ({ 
    isOpen, onClose, onSave, onUpdate, initialData, onToast, breeds = [], colors = [] 
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'insight' | 'stats'>('general');
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    location: '',
    district: BANGKOK_DISTRICTS[0] || '',
    lat: '',
    long: '',
    stats: DEFAULT_STATS,
    insight: DEFAULT_INSIGHT
  });

  const [coordInput, setCoordInput] = useState<string>("");
  const [showDistrictDropdown, setShowDistrictDropdown] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('general'); // Reset tab when opened
      if (initialData) {
        setFormData({
          date: initialData.date || new Date().toISOString().split('T')[0],
          location: initialData.location || '',
          district: initialData.district || BANGKOK_DISTRICTS[0] || '',
          lat: initialData.lat ? initialData.lat.toString() : '',
          long: initialData.long ? initialData.long.toString() : '',
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
          },
          insight: initialData.insight || DEFAULT_INSIGHT
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
          district: BANGKOK_DISTRICTS[0] || '',
          lat: '',
          long: '',
          stats: DEFAULT_STATS,
          insight: DEFAULT_INSIGHT
        });
        setCoordInput("");
      }
    }
  }, [isOpen, initialData]);

  const handleStatChange = (category: keyof BaseStats, animal: keyof AnimalStats, gender: keyof GenderStats, value: string) => {
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

  const handleInsightChange = (field: keyof InsightData, value: string) => {
    setFormData(prev => ({
      ...prev,
      insight: { ...prev.insight, [field]: value }
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const latNum = parseFloat(formData.lat);
    const longNum = parseFloat(formData.long);

    const payload: PayloadData = {
      ...formData,
      lat: !isNaN(latNum) ? latNum : 0,
      long: !isNaN(longNum) ? longNum : 0
    };

    if (initialData && initialData._id) {
      onUpdate(initialData._id, payload);
    } else {
      onSave(payload);
    }
    onClose();
  };

  if (!isOpen) return null;

  // Reusable Input Wrapper
  const InputGroup = ({ label, children, required = false }: { label: string, children: React.ReactNode, required?: boolean }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90dvh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 px-5 py-4 flex justify-between items-center text-white shrink-0">
          <h3 className="text-lg font-bold flex items-center gap-2.5 shadow-sm">
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
              <Skull className="w-5 h-5" />
            </div>
            {initialData ? 'แก้ไขข้อมูลจุดเสี่ยง' : 'บันทึกจุดเกิดเหตุโรคพิษสุนัขบ้า'}
          </h3>
          <button type="button" onClick={onClose} className="hover:bg-black/10 p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-2 sm:px-6 bg-slate-50/50 shrink-0 overflow-x-auto custom-scrollbar">
          {[
            { id: 'general', label: 'สถานที่ & เวลา', icon: Map },
            { id: 'insight', label: 'ข้อมูลเชิงลึก', icon: ClipboardList },
            { id: 'stats', label: 'สถิติกลุ่มเสี่ยง', icon: PawPrint }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-red-600 text-red-600 bg-red-50/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto p-5 sm:p-6 flex-1 custom-scrollbar">
          <form id="outbreak-form" onSubmit={handleSubmit} className="h-full">
            
            {/* Section 1: ข้อมูลทั่วไป */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputGroup label="วันที่พบเชื้อ" required>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        required type="date"
                        className="w-full p-2.5 pl-10 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all hover:border-slate-400 bg-white"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                  </InputGroup>

                  <InputGroup label="เขตพื้นที่ (District)" required>
                    <div className="relative">
                      <input
                        required type="text" placeholder="พิมพ์ค้นหาเขต..."
                        className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all hover:border-slate-400 bg-white"
                        value={formData.district}
                        onChange={e => {
                          setFormData({ ...formData, district: e.target.value });
                          setShowDistrictDropdown(true);
                        }}
                        onFocus={() => setShowDistrictDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDistrictDropdown(false), 200)}
                      />
                      {showDistrictDropdown && (
                        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto custom-scrollbar">
                          {BANGKOK_DISTRICTS.filter(d => d.includes(formData.district)).length > 0 ? (
                            BANGKOK_DISTRICTS.filter(d => d.includes(formData.district)).map(d => (
                              <div
                                key={d}
                                className="px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
                                onMouseDown={() => { 
                                  setFormData({ ...formData, district: d });
                                  setShowDistrictDropdown(false);
                                }}
                              >
                                {d}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-4 text-sm text-slate-400 text-center bg-slate-50">ไม่พบชื่อเขตที่ค้นหา</div>
                          )}
                        </div>
                      )}
                    </div>
                  </InputGroup>
                </div>

                <InputGroup label="สถานที่พบ (รายละเอียด)" required>
                  <input
                    required type="text" placeholder="ระบุสถานที่ให้ชัดเจน เช่น ซอย, วัด, โรงเรียน"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all hover:border-slate-400 bg-white"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                </InputGroup>

                <InputGroup label="พิกัดภูมิศาสตร์ (Lat, Long)">
                  <p className="text-xs text-slate-500 mb-1">คั่นด้วยเครื่องหมายลูกน้ำ (,) เช่น 13.7563, 100.5018</p>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text" placeholder="ค้นหาและวางพิกัดที่นี่"
                      className="w-full p-2.5 pl-10 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono bg-slate-50 hover:border-slate-400"
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
                  </div>
                </InputGroup>
              </div>
            )}

            {/* Section 2: ข้อมูลเชิงลึก */}
            {activeTab === 'insight' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 animate-in slide-in-from-right-4 duration-300">
                <InputGroup label="ศบส.">
                  <input type="text" placeholder="ระบุ ศบส." className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 hover:border-slate-400" value={formData.insight.spcc} onChange={e => handleInsightChange('spcc', e.target.value)} />
                </InputGroup>
                <InputGroup label="เลขที่ตรวจ">
                  <input type="text" placeholder="เช่น LAB-2026" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 hover:border-slate-400" value={formData.insight.testNo} onChange={e => handleInsightChange('testNo', e.target.value)} />
                </InputGroup>
                <InputGroup label="อายุ">
                  <input type="text" placeholder="เช่น 2 ปี, 3 เดือน" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 hover:border-slate-400" value={formData.insight.age} onChange={e => handleInsightChange('age', e.target.value)} />
                </InputGroup>
                
                <InputGroup label="ชนิดสัตว์">
                  <select className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 bg-white hover:border-slate-400" value={formData.insight.animalType} onChange={e => handleInsightChange('animalType', e.target.value)}>
                    <option value="">-- เลือกชนิดสัตว์ --</option>
                    <option value="สุนัข">สุนัข</option>
                    <option value="แมว">แมว</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </InputGroup>
                <InputGroup label="มี/ไม่เจ้าของ">
                  <select className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 bg-white hover:border-slate-400" value={formData.insight.ownership} onChange={e => handleInsightChange('ownership', e.target.value)}>
                    <option value="">-- เลือกสถานะ --</option>
                    <option value="มีเจ้าของ">มีเจ้าของ</option>
                    <option value="ไม่มีเจ้าของกึ่งจรจัด">ไม่มีเจ้าของกึ่งจรจัด</option>
                    <option value="ไม่มีเจ้าของ">ไม่มีเจ้าของ</option>
                  </select>
                </InputGroup>
                <InputGroup label="เพศ">
                  <select className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 bg-white hover:border-slate-400" value={formData.insight.gender} onChange={e => handleInsightChange('gender', e.target.value)}>
                    <option value="">-- เลือกเพศ --</option>
                    <option value="ผู้">ผู้</option>
                    <option value="เมีย">เมีย</option>
                  </select>
                </InputGroup>

                <InputGroup label="สายพันธุ์">
                  <select className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 bg-white hover:border-slate-400" value={formData.insight.breed} onChange={e => handleInsightChange('breed', e.target.value)}>
                    <option value="">-- เลือกสายพันธุ์ --</option>
                    {breeds.map((b, i) => <option key={i} value={b.name}>{b.name}</option>)}
                  </select>
                </InputGroup>
                <InputGroup label="สี">
                  <select className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 bg-white hover:border-slate-400" value={formData.insight.color} onChange={e => handleInsightChange('color', e.target.value)}>
                    <option value="">-- เลือกสี --</option>
                    {colors.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
                  </select>
                </InputGroup>
                <InputGroup label="ประวัติวัคซีน">
                  <select className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 bg-white hover:border-slate-400" value={formData.insight.vaccineHistory} onChange={e => handleInsightChange('vaccineHistory', e.target.value)}>
                    <option value="">-- เลือกประวัติวัคซีน --</option>
                    <option value="ไม่เคยฉีด">ไม่เคยฉีด</option>
                    <option value="ฉีดมากกว่า 1 ปี">ฉีดมากกว่า 1 ปี</option>
                    <option value="น้อยกว่า 1 ปี">น้อยกว่า 1 ปี</option>
                  </select>
                </InputGroup>
              </div>
            )}

            {/* Section 3: สถิติสัตว์ */}
            {activeTab === 'stats' && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <p className="text-sm text-slate-500 mb-2">ระบุจำนวนสัตว์ที่อยู่ในกลุ่มเสี่ยงในแต่ละประเภท</p>
                {CATEGORIES.map(category => (
                  <div key={category.key} className={`p-4 sm:p-5 rounded-2xl border ${category.color} shadow-sm`}>
                    <div className="font-bold text-base mb-4 flex items-center gap-2">
                      <span className="bg-white/60 p-1.5 rounded-md text-xl leading-none">{category.badge}</span>
                      {category.label}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* สุนัข Card */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="text-sm font-bold text-slate-700 w-16 flex flex-col items-center">
                          <span className="text-2xl mb-1">🐶</span> สุนัข
                        </div>
                        <div className="flex-1 flex gap-3">
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-slate-500 block mb-1.5 text-center">ตัวผู้</label>
                            <input type="number" min="0" placeholder="0" className="w-full p-2 border border-slate-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-red-500 outline-none bg-slate-50 focus:bg-white transition-colors" value={formData.stats[category.key].dog.male || ''} onChange={e => handleStatChange(category.key, 'dog', 'male', e.target.value)} />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-slate-500 block mb-1.5 text-center">ตัวเมีย</label>
                            <input type="number" min="0" placeholder="0" className="w-full p-2 border border-slate-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-red-500 outline-none bg-slate-50 focus:bg-white transition-colors" value={formData.stats[category.key].dog.female || ''} onChange={e => handleStatChange(category.key, 'dog', 'female', e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* แมว Card */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="text-sm font-bold text-slate-700 w-16 flex flex-col items-center">
                          <span className="text-2xl mb-1">🐱</span> แมว
                        </div>
                        <div className="flex-1 flex gap-3">
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-slate-500 block mb-1.5 text-center">ตัวผู้</label>
                            <input type="number" min="0" placeholder="0" className="w-full p-2 border border-slate-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-red-500 outline-none bg-slate-50 focus:bg-white transition-colors" value={formData.stats[category.key].cat.male || ''} onChange={e => handleStatChange(category.key, 'cat', 'male', e.target.value)} />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-slate-500 block mb-1.5 text-center">ตัวเมีย</label>
                            <input type="number" min="0" placeholder="0" className="w-full p-2 border border-slate-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-red-500 outline-none bg-slate-50 focus:bg-white transition-colors" value={formData.stats[category.key].cat.female || ''} onChange={e => handleStatChange(category.key, 'cat', 'female', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:px-6 flex gap-3 shrink-0 z-10 pb-safe sm:pb-4">
          <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm sm:text-base hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-slate-300">
            ยกเลิก
          </button>
          
          {/* Action Button Changes based on Active Tab */}
          {activeTab !== 'stats' ? (
            <button type="button" onClick={() => setActiveTab(activeTab === 'general' ? 'insight' : 'stats')} className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm sm:text-base shadow-md transition-all focus:ring-2 focus:ring-slate-500">
              ถัดไป
            </button>
          ) : (
            <button type="submit" form="outbreak-form" className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition-all focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
              {initialData ? <><Edit className="w-5 h-5" /> บันทึกการแก้ไข</> : <><Siren className="w-5 h-5" /> ยืนยันแจ้งเหตุ</>}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default AddOutbreakModal;