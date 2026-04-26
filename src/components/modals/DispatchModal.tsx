import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, X, Bell, MapPin, Link as LinkIcon, Users, 
  Share2, Trash2, Clock, Plus, UserPlus, FileText, ChevronDown, Copy, Edit3, Calendar
} from 'lucide-react';

// ตรวจสอบ path ของ constants และ utils ให้ตรงกับโปรเจกต์ของคุณ
// @ts-ignore (ใส่ไว้ชั่วคราวหากไฟล์เหล่านี้ยังไม่ใช่ TS)
import { UNIT_TYPES, BANGKOK_DISTRICTS } from '../../constants/locations';
// @ts-ignore
import { playSound as defaultPlaySound, SoundType } from '../../utils/soundUtils';

// ==========================================
// 0. Interfaces & Types (กำหนดรูปร่างของข้อมูล)
// ==========================================

export interface StaffState {
  controllers: string[];
  vets: string[];
  registration: string[];
  prep_catch: string[];
  prep_shave: string[];
  prep_lift: string[];
  vaccine_staff: string[];
  tattoo: string[];
  surgery_assist: string[];
  drivers: string[];
  assistants: string[];
}

export interface GeneralInfo {
  date: string;
  endDate: string;
  locationName: string;
  district: string;
  mapLink: string;
  locationNameB: string;
  districtB: string;
  mapLinkB: string;
  departureTime: string;
  closingTime: string;
  note: string;
  controllerName: string;
  controllerPhone: string;
  status: string;
}

export interface EventData {
  _id?: string;
  date?: string;
  time?: string;
  departureTime?: string;
  closingTime?: string;
  staff?: Partial<StaffState>;
  location?: string;
  locationName?: string;
  district?: string;
  mapLink?: string;
  originalData?: any;
  unitType?: string;
  customUnitName?: string;
  unitLetter?: string;
  unitColor?: string;
  controllerName?: string;
  controllerPhone?: string;
  status?: string;
  [key: string]: any; // สำหรับฟิลด์อื่นๆ ที่อาจมีในระบบ
}

export interface StaffMember {
  name: string;
  phone?: string;
}

// ==========================================
// 1. Helper Functions สำหรับตรวจจับการทับซ้อนและคำนวณวัน
// ==========================================
const timeToMins = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

const isTimeOverlapping = (startA: number, endA: number, startB: number, endB: number): boolean => {
    return startA < endB && startB < endA;
};

export const checkStaffConflict = (newEventData: EventData, allExistingEvents: EventData[]) => {
    const conflicts = new Set<string>();
    const newStart = timeToMins(newEventData.departureTime);
    const newEnd = timeToMins(newEventData.closingTime || '16:00');
    
    const newEventStaffs = new Set<string>();
    if (newEventData.staff) {
        Object.values(newEventData.staff).forEach(roleArray => {
            if (Array.isArray(roleArray)) {
                roleArray.forEach(person => {
                    if (person && person.trim() !== '') newEventStaffs.add(person.trim());
                });
            }
        });
    }

    if (newEventStaffs.size === 0) return { isValid: true, conflictingNames: [] };

    allExistingEvents.forEach(existing => {
        if (newEventData._id && existing._id === newEventData._id) return;
        if (existing.date !== newEventData.date) return;

        const existingStart = timeToMins(existing.time || existing.departureTime);
        const existingEnd = timeToMins(existing.closingTime || '16:00');

        if (isTimeOverlapping(newStart, newEnd, existingStart, existingEnd)) {
            Object.values(existing.staff || {}).forEach(roleArray => {
                if (Array.isArray(roleArray)) {
                    roleArray.forEach(existingPerson => {
                        if (existingPerson && typeof existingPerson === 'string' && newEventStaffs.has(existingPerson.trim())) {
                            conflicts.add(existingPerson.trim());
                        }
                    });
                }
            });
        }
    });

    return {
        isValid: conflicts.size === 0,
        conflictingNames: Array.from(conflicts)
    };
};

const getDatesInRange = (startDate: string, endDate: string): string[] => {
    const dates: string[] = [];
    let currDate = new Date(startDate);
    const lastDate = new Date(endDate);
    while (currDate <= lastDate) {
        dates.push(currDate.toISOString().split('T')[0]);
        currDate.setDate(currDate.getDate() + 1);
    }
    return dates;
};

// ==========================================
// 2. Component ย่อยสำหรับจัดการรายชื่อ
// ==========================================
interface StaffInputGroupProps {
  roleKey: keyof StaffState;
  label: string;
  staffList: string[];
  onAdd: (roleKey: keyof StaffState) => void;
  onRemove: (roleKey: keyof StaffState, index: number) => void;
  onChange: (roleKey: keyof StaffState, index: number, value: string) => void;
  icon?: React.ElementType;
  savedStaffList?: StaffMember[];
  conflictNames?: string[];
  allSelectedStaff?: string[];
  busyStaff?: string[];
}

const StaffInputGroup: React.FC<StaffInputGroupProps> = ({ 
  roleKey, label, staffList, onAdd, onRemove, onChange, icon: Icon, 
  savedStaffList = [], conflictNames = [], allSelectedStaff = [], busyStaff = [] 
}) => (
  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-indigo-300 hover:shadow-md transition-all duration-200 group/card">
    <div className="bg-slate-50/80 px-3 py-2.5 border-b border-slate-100 flex justify-between items-center group-hover/card:bg-indigo-50/30 transition-colors">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-indigo-500" />}
        <label className="text-xs font-bold text-slate-700">{label}</label>
      </div>
      <span className="text-[10px] font-bold text-indigo-500 bg-indigo-100/50 px-2 py-0.5 rounded-full">
        {staffList.length} คน
      </span>
    </div>
    
    <div className="p-3 space-y-2">
      {staffList.map((person, idx) => {
        const isConflicting = person && conflictNames.includes(person);

        return (
          <div key={idx} className="flex flex-col gap-1">
            <div className="flex gap-1.5 items-center">
              <div className="relative flex-1">
                <select 
                  className={`w-full pl-2.5 pr-6 py-1.5 text-xs rounded-lg outline-none transition-all appearance-none cursor-pointer
                    ${isConflicting 
                      ? 'border-rose-300 bg-rose-50 text-rose-700 focus:ring-2 focus:ring-rose-500' 
                      : 'bg-white border border-slate-200 text-slate-700 focus:ring-2 focus:ring-indigo-500 hover:border-indigo-300'
                    }`}
                  value={person || ""}
                  onChange={(e) => onChange(roleKey, idx, e.target.value)}
                >
                  <option value="" disabled className="text-slate-400">-- เลือกรายชื่อ --</option>
                  {savedStaffList.map((staffMember, i) => {
                    const isAlreadySelected = allSelectedStaff.includes(staffMember.name) && staffMember.name !== person;
                    const isBusy = busyStaff.includes(staffMember.name); 
                    
                    if (isAlreadySelected) return null;

                    return (
                      <option 
                          key={i} 
                          value={staffMember.name} 
                          // ลบ disabled={isBusy} ออก หรือคอมเมนต์ไว้เพื่อให้ยังกดเลือกได้
                          // disabled={isBusy} 
                          className={isBusy ? 'text-slate-300' : ''}
                      >
                          {staffMember.name} {isBusy ? '(ติดงาน)' : ''}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                  <ChevronDown className={`w-3 h-3 ${isConflicting ? 'text-rose-500' : ''}`} />
                </div>
              </div>
              {staffList.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => onRemove(roleKey, idx)} 
                  className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors shrink-0"
                  title="ลบรายชื่อ"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            {isConflicting && (
              <span className="text-[10px] font-medium text-rose-500 flex items-center gap-1 pl-1">
                ⚠️ มีคิวงานอื่นในช่วงเวลานี้
              </span>
            )}
          </div>
        );
      })}
      
      <button 
        type="button" 
        onClick={() => onAdd(roleKey)} 
        className="w-full py-1.5 mt-1.5 flex items-center justify-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 rounded-lg border border-indigo-200 border-dashed transition-colors"
      >
        <Plus className="w-3 h-3" /> เพิ่มรายชื่อ
      </button>
    </div>
  </div>
);

// ==========================================
// 3. Main Component: DispatchModal
// ==========================================
interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onSave?: (data: any, closeAfter?: boolean) => Promise<boolean> | boolean;
  onDelete?: (id: string) => void;
  initialData?: EventData | null;
  savedStaffList?: StaffMember[];
  allEvents?: EventData[];
  playSound?: (type: SoundType) => void;
}

const DispatchModal: React.FC<DispatchModalProps> = ({ 
  isOpen, onClose, onToast, onSave, onDelete, initialData, savedStaffList = [], allEvents = [], playSound = defaultPlaySound 
}) => {

  const BASE_URL = 'https://veterinarydashboard-hwho.onrender.com';

  const getCurrentToken = () => {
    try {
        const storedUser = localStorage.getItem('vet_user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            return parsed?.token || '';
        }
    } catch (e) {
        console.error('Error parsing token', e);
    }
    return '';
  };

  // 2. ดักจับกรณีดึง Controllers แล้วติด 401
  useEffect(() => {
    if (isOpen) {
        const token = getCurrentToken();
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        fetch(`${BASE_URL}/api/controllers`, { headers: headers })
        .then(async (res) => {
            if (res.status === 401 || res.status === 403) {
                setSavedControllers([]); 
                return;
            }
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setSavedControllers(data);
            } else {
                setSavedControllers([]); 
            }
        })
        .catch(err => {
            console.error("Fetch Controllers Error:", err);
            setSavedControllers([]);
        });
    }
  }, [isOpen]);

  const formatDateLocal = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  };

  const [conflictNames, setConflictNames] = useState<string[]>([]);
  const [activeLocationField, setActiveLocationField] = useState<'A' | 'B' | null>(null);

  const locationHistory = useMemo(() => {
    const locMap = new Map<string, { name: string, district: string, mapLink: string }>();
    allEvents.forEach(evt => {
        const locName = evt.location || evt.locationName || evt.originalData?.location; 
        if (locName && !locMap.has(locName)) {
            locMap.set(locName, {
                name: locName,
                district: evt.district || evt.originalData?.district || '',
                mapLink: evt.mapLink || evt.originalData?.mapLink || ''
            });
        }
    });
    return Array.from(locMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allEvents]);

  const UNIT_OPTIONS = [
    { value: 'sterilization', label: 'หน่วยสัตว์แพทย์ (Veterinary Unit)', icon: '🏥' },
    { value: 'spay_neuter', label: 'หน่วยทำหมัน (Spay/Neuter Unit)', icon: '✂️' },
    { value: 'microchip', label: 'หน่วยวัคซีน + ไมโครชิป', icon: '💉' },
    { value: 'governor', label: 'หน่วยผู้ว่า (Governor Unit)', icon: '👔' },
    { value: 'cat_cage', label: 'หน่วยกรงแมว (Cat Cage)', icon: '🐱' },
    { value: 'other', label: 'หน่วยอื่น ๆ (Other)', icon: '📋' }
  ];

  const LETTER_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  const COLOR_OPTIONS = [
    { value: 'bg-red-500', label: 'สีแดง', emoji: '🔴' },
    { value: 'bg-blue-500', label: 'สีน้ำเงิน', emoji: '🔵' },
    { value: 'bg-green-500', label: 'สีเขียว', emoji: '🟢' },
    { value: 'bg-yellow-400', label: 'สีเหลือง', emoji: '🟡' },
    { value: 'bg-purple-500', label: 'สีม่วง', emoji: '🟣' },
    { value: 'bg-orange-500', label: 'สีส้ม', emoji: '🟠' },
    { value: 'bg-pink-500', label: 'สีชมพู', emoji: '🩷' },
    { value: 'bg-slate-400', label: 'สีเทา', emoji: '⚫' }
  ];

  const [unitType, setUnitType] = useState<string>('sterilization'); 
  const [customUnitName, setCustomUnitName] = useState<string>('');
  const [unitLetter, setUnitLetter] = useState<string>(''); 
  const [unitColor, setUnitColor] = useState<string>('bg-blue-500'); 

  const [isSplitTeam, setIsSplitTeam] = useState<boolean>(false);
  const [activeDistrictField, setActiveDistrictField] = useState<'A' | 'B' | null>(null);

  const [generalInfo, setGeneralInfo] = useState<GeneralInfo>({
    date: new Date().toISOString().split('T')[0],
    endDate: '', 
    locationName: '', district: '', mapLink: '',
    locationNameB: '', districtB: '', mapLinkB: '',
    departureTime: '07:30', closingTime: '12:00', note: '',
    controllerName: '', 
    controllerPhone: '',
    status: 'auto'
  });

  const [staff, setStaff] = useState<StaffState>({
    controllers: [''], 
    vets: ['', ''], registration: [''], prep_catch: [''], prep_shave: [''], prep_lift: [''], 
    vaccine_staff: [''], tattoo: [''], surgery_assist: [''], drivers: [''], assistants: [''] 
  });

  const [isCopyMode, setIsCopyMode] = useState<boolean>(false);
  const [savedControllers, setSavedControllers] = useState<StaffMember[]>([]);
  
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const isLoadedRef = useRef<boolean>(false);

  const busyStaff = useMemo(() => {
    if (!generalInfo.date || !generalInfo.departureTime || !allEvents) return [];
    const currentStart = timeToMins(generalInfo.departureTime);
    const currentEnd = timeToMins(generalInfo.closingTime || '16:00');
    const busy = new Set<string>();

    allEvents.forEach(evt => {
        if (initialData && evt._id === initialData._id) return; 
        if (evt.date !== generalInfo.date) return; 

        const evtStart = timeToMins(evt.time || evt.departureTime);
        const evtEnd = timeToMins(evt.closingTime || '16:00');

        if (isTimeOverlapping(currentStart, currentEnd, evtStart, evtEnd)) {
            Object.values(evt.staff || {}).forEach(roleArray => {
                if (Array.isArray(roleArray)) {
                    roleArray.forEach(person => {
                        if (person && typeof person === 'string' && person.trim() !== '') busy.add(person.trim());
                    });
                }
            });
        }
    });
    return Array.from(busy);
  }, [generalInfo.date, generalInfo.departureTime, generalInfo.closingTime, allEvents, initialData]);

  useEffect(() => {
    if (isOpen) {
        fetch(`${BASE_URL}/api/controllers`, {
            headers: {
                'Authorization': `Bearer ${getCurrentToken()}`
            }
        })
        .then(async (res) => {
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setSavedControllers(data);
            } else {
                setSavedControllers([]); 
            }
        })
        .catch(err => {
            console.error("Fetch Controllers Error:", err);
            setSavedControllers([]);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialData) {
      setIsCopyMode(false);
      setIsSplitTeam(false);
      setUnitType(initialData.unitType || 'sterilization');
      setCustomUnitName(initialData.customUnitName || '');
      setUnitLetter(initialData.unitLetter || ''); 
      setUnitColor(initialData.unitColor || 'bg-blue-500'); 
      setConflictNames([]); 
      
      const staffController = initialData.staff?.controllers?.[0] || '';
      const ctrlParts = staffController.split(' โทร. ');

      setGeneralInfo({
        date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: '',
        locationName: initialData.location || '',
        district: initialData.district || '',
        mapLink: initialData.mapLink || '',
        locationNameB: '', districtB: '', mapLinkB: '',
        departureTime: initialData.time || initialData.departureTime || '07:30',
        closingTime: initialData.closingTime || '12:00',
        note: initialData.note || '',
        controllerName: initialData.controllerName || ctrlParts[0] || '',
        controllerPhone: initialData.controllerPhone || ctrlParts[1] || '',
        status: initialData.status || 'auto'
      });

      if (initialData.staff) {
        setStaff({ 
          controllers: initialData.staff.controllers?.length ? initialData.staff.controllers : [''], 
          vets: initialData.staff.vets?.length ? initialData.staff.vets : ['', ''], 
          registration: initialData.staff.registration?.length ? initialData.staff.registration : [''], 
          prep_catch: initialData.staff.prep_catch?.length ? initialData.staff.prep_catch : [''], 
          prep_shave: initialData.staff.prep_shave?.length ? initialData.staff.prep_shave : [''], 
          prep_lift: initialData.staff.prep_lift?.length ? initialData.staff.prep_lift : [''], 
          vaccine_staff: initialData.staff.vaccine_staff?.length ? initialData.staff.vaccine_staff : [''], 
          tattoo: initialData.staff.tattoo?.length ? initialData.staff.tattoo : [''], 
          surgery_assist: initialData.staff.surgery_assist?.length ? initialData.staff.surgery_assist : [''], 
          drivers: initialData.staff.drivers?.length ? initialData.staff.drivers : [''], 
          assistants: initialData.staff.assistants?.length ? initialData.staff.assistants : [''] 
        });
      }
      
      setIsDirty(false);
      isLoadedRef.current = false;
      setTimeout(() => { isLoadedRef.current = true; }, 300);

    } else if (isOpen && !initialData) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setIsSplitTeam(false);
      setUnitType('sterilization');
      setCustomUnitName('');
      setUnitLetter(''); 
      setUnitColor('bg-blue-500'); 
      setConflictNames([]); 
      setGeneralInfo({
        date: formatDateLocal(tomorrow), 
        endDate: '',
        locationName: '', district: '', mapLink: '',
        locationNameB: '', districtB: '', mapLinkB: '',
        departureTime: '07:30', closingTime: '12:00', note: '',
        controllerName: '', controllerPhone: '',
        status: 'auto'
      });
      setStaff({ controllers: [''], vets: ['', ''], registration: [''], prep_catch: [''], prep_shave: [''], prep_lift: [''], vaccine_staff: [''], tattoo: [''], surgery_assist: [''], drivers: [''], assistants: [''] });
      
      setIsDirty(false);
      isLoadedRef.current = false;
      setTimeout(() => { isLoadedRef.current = true; }, 300);
    } else {
      isLoadedRef.current = false;
      setIsDirty(false);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isLoadedRef.current) {
        setIsDirty(true);
    }
  }, [generalInfo, staff, unitType, customUnitName, unitLetter, unitColor, isSplitTeam]);

  const handleCloseModal = () => {
    if (isDirty) {
        if (window.confirm("คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดใช่หรือไม่? ข้อมูลจะสูญหายทั้งหมด")) {
            playSound('pop');
            onClose();
        }
    } else {
        playSound('pop');
        onClose();
    }
  };

  const handleStaffChange = (role: keyof StaffState, index: number, value: string) => {
    const newRoleList = [...staff[role]];
    newRoleList[index] = value;
    setStaff({ ...staff, [role]: newRoleList });
    
    if (conflictNames.includes(value) || conflictNames.length > 0) {
        setConflictNames([]);
    }
  };

  const addStaffField = (role: keyof StaffState) => {
    playSound('pop');
    setStaff({ ...staff, [role]: [...staff[role], ''] });
  };

  const removeStaffField = (role: keyof StaffState, index: number) => {
    playSound('pop');
    const newRoleList = [...staff[role]];
    newRoleList.splice(index, 1);
    setStaff({ ...staff, [role]: newRoleList });
  };

  if (!isOpen) return null;

  const handleSendLine = () => { 
    if (isSplitTeam && (!generalInfo.locationName || !generalInfo.locationNameB)) {
      if(onToast) onToast('error', 'กรุณาระบุสถานที่ให้ครบทั้ง 2 ทีม');
      else alert('กรุณาระบุสถานที่ให้ครบทั้ง 2 ทีม');
      return;
    } else if (!isSplitTeam && !generalInfo.locationName) {
      if(onToast) onToast('error', 'กรุณาระบุสถานที่');
      else alert('กรุณาระบุสถานที่');
      return;
    }

    const formatStaffList = (list: string[]) => list.filter(s => s.trim()).join(', ') || '-';
    const currentUnit = UNIT_OPTIONS.find(u => u.value === unitType);
    const currentColor = COLOR_OPTIONS.find(c => c.value === unitColor);
    
    const displayUnitName = unitType === 'other' && customUnitName.trim() !== '' 
      ? customUnitName : currentUnit?.label;

    const unitNameDisplay = isSplitTeam 
      ? `${displayUnitName} (ทีม A และ B)` : `${displayUnitName} ${unitLetter}`.trim();
    
    let locationText = '';
    if (isSplitTeam) {
      locationText = `📍 ทีม A: ${generalInfo.locationName} (เขต ${generalInfo.district || '-'})
🗺️ แผนที่ A: ${generalInfo.mapLink || '-'}
📍 ทีม B: ${generalInfo.locationNameB} (เขต ${generalInfo.districtB || '-'})
🗺️ แผนที่ B: ${generalInfo.mapLinkB || '-'}`;
    } else {
      locationText = `📍 สถานที่: ${generalInfo.locationName} (เขต ${generalInfo.district || '-'})
🗺️ แผนที่: ${generalInfo.mapLink || '-'}`;
    }
    
    let staffDetails = "";
    const controllerDisplay = [generalInfo.controllerName, generalInfo.controllerPhone].filter(Boolean).join(' โทร. ') || '-';
    const commonStaff = `👮‍♂️ ผู้ควบคุมออกหน่วย: ${controllerDisplay}\n👨‍⚕️ สัตวแพทย์: ${formatStaffList(staff.vets)}\n🚐 พนักงานขับรถ: ${formatStaffList(staff.drivers)}`;

    if (unitType === 'sterilization'|| unitType === 'spay_neuter') {
      staffDetails = `${commonStaff}
📝 ลงทะเบียน: ${formatStaffList(staff.registration)}
🐕 จับ/วางยา: ${formatStaffList(staff.prep_catch)}
✂️ โกนขน: ${formatStaffList(staff.prep_shave)}
💪 ยกสัตว์: ${formatStaffList(staff.prep_lift)}
💉 วัคซีน: ${formatStaffList(staff.vaccine_staff)}
🔪 ผู้ช่วยผ่าตัด: ${formatStaffList(staff.surgery_assist)}`;
    } else if (unitType === 'cat_cage') {
      staffDetails = `${commonStaff}
🐕 จับ/วางยา: ${formatStaffList(staff.prep_catch)}
✂️ โกนขน: ${formatStaffList(staff.prep_shave)}
💪 ยกสัตว์: ${formatStaffList(staff.prep_lift)}
💉 วัคซีน: ${formatStaffList(staff.vaccine_staff)}
✒️ สักตัว: ${formatStaffList(staff.tattoo)}
🔪 ผู้ช่วยผ่าตัด: ${formatStaffList(staff.surgery_assist)}`;
    } else if (unitType === 'microchip') {
      staffDetails = `${commonStaff}\n🙋 ผู้ช่วย: ${formatStaffList(staff.assistants)}`;
    } else {
       staffDetails = `${commonStaff}\n🙋 เจ้าหน้าที่: ${formatStaffList(staff.assistants)}`;
    }

    const message = `📢 *แจ้งเตือนการออกหน่วย*
📌 *${unitNameDisplay}* ${currentColor?.emoji || ''}
📅 วันที่: ${new Date(generalInfo.date).toLocaleDateString('th-TH')}
${locationText}
⏰ เวลารถออก: ${generalInfo.departureTime} น.
🛑 เวลาปิดหน่วย: ${generalInfo.closingTime} น.
--------------------------------
${staffDetails}
--------------------------------
📝 หมายเหตุ: ${generalInfo.note || '-'}
`;

    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
    window.open(lineUrl, '_blank');
    if (onToast) onToast('success', 'เปิด Line เรียบร้อยแล้ว');
    setIsDirty(false); 
    onClose();
  };

  const handleSaveLocal = async (isSaveAndContinue = false) => {
    const isCreatingNew = !initialData || isCopyMode;

    const datesToSave = (isCreatingNew && generalInfo.endDate && generalInfo.endDate > generalInfo.date)
        ? getDatesInRange(generalInfo.date, generalInfo.endDate)
        : [generalInfo.date];

    let hasConflict = false;
    let allConflicts = new Set<string>();

    for (const targetDate of datesToSave) {
        const checkingPayload: EventData = {
            _id: isCreatingNew ? undefined : initialData?._id,
            date: targetDate,
            departureTime: generalInfo.departureTime,
            closingTime: generalInfo.closingTime,
            staff: staff
        };
        const conflictCheck = checkStaffConflict(checkingPayload, allEvents);
        if (!conflictCheck.isValid) {
            hasConflict = true;
            conflictCheck.conflictingNames.forEach(name => allConflicts.add(name));
        }
    }

    if (hasConflict) {
      playSound('delete');
      const conflictArray = Array.from(allConflicts);
      setConflictNames(conflictArray);
        
      if (!isCreatingNew) {
        if (onToast) onToast('warning', `แจ้งเตือน: พบรายชื่อติดงานซ้ำซ้อน แต่ระบบอนุญาตให้บันทึก (โหมดแก้ไข)`);
      } else {
        if (onToast) onToast('error', `พบรายชื่อซ้ำซ้อนเวลาเดียวกัน: ${conflictArray.join(', ')}`);
        return; 
      }
    }

    setConflictNames([]);

    const currentUnitLabel = UNIT_OPTIONS.find(u => u.value === unitType)?.label;
    const displayTitle = unitType === 'other' && customUnitName.trim() !== ''
      ? customUnitName : currentUnitLabel;
    
    const extractLatLng = (link: string) => {
        if (!link) return { lat: null, lng: null };
        try {
            const atMatch = link.match(/@([-\d.]+),([-\d.]+)/);
            if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
            const commaMatch = link.match(/([-\d.]+),\s*([-\d.]+)/);
            if (commaMatch) return { lat: parseFloat(commaMatch[1]), lng: parseFloat(commaMatch[2]) };
        } catch (e) { console.error("Error parsing map link", e) }
        return { lat: null, lng: null };
    };

    const coordsA = extractLatLng(generalInfo.mapLink);
    const coordsB = extractLatLng(generalInfo.mapLinkB);

    const payloadsToSave: any[] = [];

    datesToSave.forEach(targetDate => {
        if (isSplitTeam) {
            payloadsToSave.push({
                _id: isCreatingNew ? undefined : initialData?._id, 
                ...generalInfo, date: targetDate,
                status: isCreatingNew ? 'auto' : generalInfo.status, 
                unitType, customUnitName, unitLetter: 'A', unitColor, staff: staff, 
                title: `${displayTitle} A`.trim(),
                location: generalInfo.locationName, district: generalInfo.district, mapLink: generalInfo.mapLink,
                lat: coordsA.lat, lng: coordsA.lng, time: generalInfo.departureTime,
                team: staff.vets.filter(v => v).join(', ')
            });
            payloadsToSave.push({
                _id: undefined, 
                ...generalInfo, date: targetDate,
                status: isCreatingNew ? 'auto' : generalInfo.status,
                unitType, customUnitName, unitLetter: 'B', unitColor, staff: staff, 
                title: `${displayTitle} B`.trim(),
                location: generalInfo.locationNameB, district: generalInfo.districtB, mapLink: generalInfo.mapLinkB,
                lat: coordsB.lat, lng: coordsB.lng, time: generalInfo.departureTime,
                team: staff.vets.filter(v => v).join(', ')
            });
        } else {
            payloadsToSave.push({
                _id: isCreatingNew ? undefined : initialData?._id, 
                ...generalInfo, date: targetDate,
                status: isCreatingNew ? 'auto' : generalInfo.status, 
                unitType, customUnitName, unitLetter, unitColor, staff: staff, 
                title: `${displayTitle} ${unitLetter}`.trim(),
                location: generalInfo.locationName, district: generalInfo.district, mapLink: generalInfo.mapLink,
                lat: coordsA.lat, lng: coordsA.lng, time: generalInfo.departureTime,
                team: staff.vets.filter(v => v).join(', ')
            });
        }
    });

    const finalData = (payloadsToSave.length > 1) ? payloadsToSave : payloadsToSave[0];

    if (onSave) {
        const success = await onSave(finalData, !isSaveAndContinue);
        if (success && isSaveAndContinue) {
            setIsDirty(false); 
            setGeneralInfo(prev => ({
                ...prev,
                locationName: '', district: '', mapLink: '',
                locationNameB: '', districtB: '', mapLinkB: '',
                note: '', endDate: ''
            }));
            if (onToast) onToast('success', 'เคลียร์ฟอร์มเตรียมพร้อมสำหรับงานต่อไป');
        } else if (success && !isSaveAndContinue) {
            setIsDirty(false); 
            handleSendLine();
        }
    }
  };

  const allSelectedStaff = Object.values(staff).flat().filter(name => name && name.trim() !== '');

  const commonProps = { 
    onAdd: addStaffField, 
    onRemove: removeStaffField, 
    onChange: handleStaffChange, 
    savedStaffList: savedStaffList, 
    conflictNames: conflictNames,
    allSelectedStaff: allSelectedStaff,
    busyStaff: busyStaff 
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
         onClick={handleCloseModal}
    >
      <div className="bg-slate-50 w-full max-w-5xl flex flex-col h-[100dvh] sm:h-[90dvh] rounded-none sm:rounded-2xl shadow-2xl overflow-hidden border-0 sm:border border-slate-200"
           onClick={(e) => e.stopPropagation()}
      >
        
        {/* === Header === */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex justify-between items-center shrink-0 mt-safe sm:mt-0 z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isCopyMode ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {isCopyMode ? <Copy className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {initialData && !isCopyMode ? 'แก้ไขข้อมูลออกหน่วย' : isCopyMode ? 'คัดลอกแผนออกหน่วย' : 'เพิ่มแผนออกหน่วยใหม่'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                 {isCopyMode ? 'กรุณาแก้ไขวันที่และสถานที่ให้เรียบร้อยก่อนบันทึก' : 'จัดการข้อมูลหน่วยแพทย์และจัดสรรทีมงาน'}
              </p>
            </div>
          </div>
          <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* === Main Content Scrollable Area === */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 custom-scrollbar pb-24 sm:pb-6">
          <div className="max-w-5xl mx-auto space-y-5">
          
          {isCopyMode && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm">
               <Copy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
               <div>
                 <p className="font-bold text-sm">โหมดคัดลอกแผนงาน (Duplicate Mode)</p>
                 <p className="text-xs mt-1">คุณกำลังใช้ข้อมูลจากเคสเดิมเป็นตัวตั้งต้น <span className="font-semibold underline text-amber-900">โปรดตรวจสอบวันที่และสถานที่</span> ก่อนกดบันทึก</p>
               </div>
            </div>
          )}
          
          {/* Section 1: ข้อมูลหลัก & สถานที่ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left Column (Settings & Time) */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Card: ประเภทหน่วย */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Activity className="w-4 h-4 text-indigo-500" /> ข้อมูลหน่วยงาน
                </h4>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">ประเภทหน่วย (Unit Type)</label>
                  <div className="relative">
                    <select 
                      value={unitType} 
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setUnitType(e.target.value);
                        if(e.target.value !== 'cat_cage') setIsSplitTeam(false);
                      }}
                      className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-colors appearance-none cursor-pointer"
                    >
                      {UNIT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>

                  {unitType === 'other' && (
                    <input 
                      type="text" 
                      placeholder="ระบุชื่อหน่วยงานเพิ่มเติม..."
                      className="mt-2.5 w-full p-2 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={customUnitName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomUnitName(e.target.value)}
                    />
                  )}

                  {(!initialData && unitType === 'cat_cage') && (
                      <div className="mt-3 flex items-start gap-2 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors cursor-pointer" onClick={() => setIsSplitTeam(!isSplitTeam)}>
                          <input 
                              type="checkbox" 
                              checked={isSplitTeam} 
                              readOnly
                              className="w-3.5 h-3.5 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                          />
                          <div className="flex-1">
                              <p className="text-xs font-bold text-indigo-800 leading-tight">ออกหน่วย 2 สถานที่ (ทีม A และ B)</p>
                              <p className="text-[10px] text-indigo-600/80 mt-0.5">ใช้งานร่วมกับทีมงานชุดเดียวกัน</p>
                          </div>
                      </div>
                  )}
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  {!isSplitTeam && (
                    <div className="w-[80px] shrink-0">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">สาย/ทีม</label>
                      <div className="relative">
                        <select 
                          value={unitLetter} 
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUnitLetter(e.target.value)}
                          className="w-full pl-2 pr-6 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                        >
                          <option value="">-</option>
                          {LETTER_OPTIONS.map(letter => <option key={letter} value={letter}>ทีม {letter}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">สีประจำหน่วย</label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_OPTIONS.map(c => (
                        <button
                          key={c.value} type="button"
                          onClick={() => { playSound('pop'); setUnitColor(c.value); }}
                          className={`w-6 h-6 rounded-full transition-all duration-200 ${c.value} 
                            ${unitColor === c.value ? 'ring-2 ring-offset-2 ring-indigo-500/50 scale-110 shadow-sm' : 'hover:scale-110 opacity-90 border border-black/10'}`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: วันที่และเวลา */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-500" /> วันที่และเวลา
                  </h4>
                  <div className="relative w-[127px]">
                    <select
                      value={generalInfo.status}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGeneralInfo({ ...generalInfo, status: e.target.value })}
                      className={`w-full pl-2 pr-6 py-1 border rounded-md text-[11px] font-bold appearance-none transition-colors cursor-pointer outline-none
                        ${generalInfo.status === 'cancelled' ? 'bg-rose-50 border-rose-200 text-rose-700' : 
                          generalInfo.status === 'postponed' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                          generalInfo.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                      <option value="auto">⏱️ คำนวณอัตโนมัติ</option>
                      <option value="completed">✅ เสร็จสิ้นแล้ว</option>
                      <option value="postponed">⚠️ เลื่อนคิว</option>
                      <option value="cancelled">❌ ยกเลิกงาน</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 opacity-50 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 mb-1 block">วันที่เริ่ม</label>
                    <input 
                      type="date" 
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      value={generalInfo.date} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGeneralInfo({ ...generalInfo, date: e.target.value })} 
                    />
                  </div>
                  {(!initialData || isCopyMode) && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block">ถึงวันที่ <span className="text-slate-400 font-normal">(ตัวเลือก)</span></label>
                      <input 
                        type="date" min={generalInfo.date}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        value={generalInfo.endDate || ''} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGeneralInfo({ ...generalInfo, endDate: e.target.value })} 
                      />
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex gap-2 mb-2.5">
                      <button type="button" onClick={() => { playSound('pop'); setGeneralInfo(prev => ({ ...prev, departureTime: '08:20', closingTime: '12:00' })); }}
                              className="flex-1 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 border border-indigo-100 rounded-md transition-colors">
                          เช้า (08:20-12:00)
                      </button>
                      <button type="button" onClick={() => { playSound('pop'); setGeneralInfo(prev => ({ ...prev, departureTime: '13:00', closingTime: '15:00' })); }}
                              className="flex-1 py-1 text-[11px] font-bold text-orange-600 bg-orange-50/50 hover:bg-orange-100 border border-orange-100 rounded-md transition-colors">
                          บ่าย (13:00-15:00)
                      </button>
                      <button type="button" onClick={() => { playSound('pop'); setGeneralInfo(prev => ({ ...prev, departureTime: '08:20', closingTime: '15:00' })); }}
                              className="flex-1 py-1 text-[11px] font-bold text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100 border border-emerald-100 rounded-md transition-colors">
                          เต็มวัน (08:20-15:00)
                      </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> เวลารถออก</label>
                      <input 
                        type="time" 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        value={generalInfo.departureTime} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGeneralInfo({ ...generalInfo, departureTime: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> เวลาปิดหน่วย</label>
                      <input 
                        type="time" 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        value={generalInfo.closingTime} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGeneralInfo({ ...generalInfo, closingTime: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column (Location Form) */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Card: สถานที่ */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full opacity-50"></div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4 relative z-10">
                  <MapPin className="w-4 h-4 text-rose-500" /> รายละเอียดสถานที่ (Location)
                </h4>
                
                <div className="space-y-4 relative z-10">
                  {isSplitTeam && <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-xs rounded-md mb-1">📍 ข้อมูลทีม A</div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 relative">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">ชื่อสถานที่</label>
                      <input 
                        type="text" 
                        placeholder="ระบุชื่อวัด, ชุมชน, หรือสถานที่..." 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        value={generalInfo.locationName} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setGeneralInfo({ ...generalInfo, locationName: e.target.value });
                            setActiveLocationField('A');
                        }}
                        onFocus={() => setActiveLocationField('A')}
                        onBlur={() => setTimeout(() => setActiveLocationField(null), 200)}
                      />
                      {activeLocationField === 'A' && generalInfo.locationName && (
                        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                          {locationHistory.filter(loc => loc.name.toLowerCase().includes(generalInfo.locationName.toLowerCase())).length > 0 ? (
                            locationHistory.filter(loc => loc.name.toLowerCase().includes(generalInfo.locationName.toLowerCase())).map((loc, idx) => (
                              <div key={idx} className="px-3 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                                onClick={() => {
                                  setGeneralInfo({ 
                                      ...generalInfo, 
                                      locationName: loc.name,
                                      district: loc.district || generalInfo.district,
                                      mapLink: loc.mapLink || generalInfo.mapLink
                                  });
                                  setActiveLocationField(null);
                                  if (onToast) onToast('success', 'โหลดข้อมูลเขตและแผนที่อัตโนมัติ');
                                }}
                              >
                                <div className="font-bold">{loc.name}</div>
                                {(loc.district || loc.mapLink) && (
                                    <div className="text-[10px] text-slate-400 mt-1 flex gap-1.5">
                                        {loc.district && <span className="bg-slate-100 px-1.5 py-0.5 rounded">เขต{loc.district}</span>}
                                        {loc.mapLink && <span className="bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">📍 มีแผนที่</span>}
                                    </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-3 text-xs text-slate-400 text-center bg-slate-50">พิมพ์เพื่อบันทึกเป็นสถานที่ใหม่</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="relative">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">เขต (District)</label>
                      <input 
                        type="text" 
                        placeholder="พิมพ์ค้นหาเขต..." 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        value={generalInfo.district} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setGeneralInfo({ ...generalInfo, district: e.target.value });
                          setActiveDistrictField('A');
                        }}
                        onFocus={() => setActiveDistrictField('A')}
                        onBlur={() => setTimeout(() => setActiveDistrictField(null), 200)}
                      />
                      {activeDistrictField === 'A' && (
                        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto custom-scrollbar">
                          {BANGKOK_DISTRICTS.filter((d: string) => d.includes(generalInfo.district)).length > 0 ? (
                            BANGKOK_DISTRICTS.filter((d: string) => d.includes(generalInfo.district)).map((d: string) => (
                              <div key={d} className="px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                                onClick={() => { setGeneralInfo({ ...generalInfo, district: d }); setActiveDistrictField(null); }}
                              >
                                {d}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-3 text-xs text-slate-400 text-center bg-slate-50">ไม่พบชื่อเขตที่ค้นหา</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">ลิงก์ Google Map</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input 
                          type="text" placeholder="http://googleusercontent.com/maps..." 
                          className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                          value={generalInfo.mapLink} 
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGeneralInfo({ ...generalInfo, mapLink: e.target.value })} 
                        />
                      </div>
                    </div>
                  </div>

                  {isSplitTeam && (
                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <div className="inline-block px-3 py-1 bg-rose-100 text-rose-700 font-bold text-xs rounded-md mb-3">📍 ข้อมูลทีม B</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 relative">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">ชื่อสถานที่ (ทีม B)</label>
                          <input 
                            type="text" 
                            placeholder="ระบุชื่อวัด, ชุมชน, หรือสถานที่..." 
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                            value={generalInfo.locationNameB} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setGeneralInfo({ ...generalInfo, locationNameB: e.target.value });
                                setActiveLocationField('B');
                            }}
                            onFocus={() => setActiveLocationField('B')}
                            onBlur={() => setTimeout(() => setActiveLocationField(null), 200)}
                          />
                          {activeLocationField === 'B' && generalInfo.locationNameB && (
                            <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                              {locationHistory.filter(loc => loc.name.toLowerCase().includes(generalInfo.locationNameB.toLowerCase())).length > 0 ? (
                                locationHistory.filter(loc => loc.name.toLowerCase().includes(generalInfo.locationNameB.toLowerCase())).map((loc, idx) => (
                                  <div key={idx} className="px-3 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                                    onClick={() => {
                                      setGeneralInfo({ 
                                          ...generalInfo, 
                                          locationNameB: loc.name,
                                          districtB: loc.district || generalInfo.districtB,
                                          mapLinkB: loc.mapLink || generalInfo.mapLinkB
                                      });
                                      setActiveLocationField(null);
                                      if (onToast) onToast('success', 'โหลดข้อมูลเขตและแผนที่อัตโนมัติ');
                                    }}
                                  >
                                    <div className="font-bold">{loc.name}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-3 text-xs text-slate-400 text-center bg-slate-50">พิมพ์เพื่อบันทึกเป็นสถานที่ใหม่</div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="relative">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">เขต (District)</label>
                          <input 
                            type="text" placeholder="พิมพ์ค้นหาเขต..." 
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                            value={generalInfo.districtB} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setGeneralInfo({ ...generalInfo, districtB: e.target.value });
                              setActiveDistrictField('B');
                            }}
                            onFocus={() => setActiveDistrictField('B')}
                            onBlur={() => setTimeout(() => setActiveDistrictField(null), 200)}
                          />
                          {activeDistrictField === 'B' && (
                            <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto custom-scrollbar">
                              {BANGKOK_DISTRICTS.filter((d: string) => d.includes(generalInfo.districtB)).length > 0 && (
                                BANGKOK_DISTRICTS.filter((d: string) => d.includes(generalInfo.districtB)).map((d: string) => (
                                  <div key={d} className="px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                                    onClick={() => { setGeneralInfo({ ...generalInfo, districtB: d }); setActiveDistrictField(null); }}
                                  >
                                    {d}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">ลิงก์ Google Map</label>
                          <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                              type="text" placeholder="http://googleusercontent.com/maps..." 
                              className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                              value={generalInfo.mapLinkB} 
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGeneralInfo({ ...generalInfo, mapLinkB: e.target.value })} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">หมายเหตุ / รายละเอียดเพิ่มเติม</label>
                    <textarea 
                      rows={2} 
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none resize-none transition-all"
                      placeholder="เช่น จุดจอดรถ, รายละเอียดชุมชน..."
                      value={generalInfo.note} 
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGeneralInfo({ ...generalInfo, note: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Card: ผู้ควบคุม */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                  <UserPlus className="w-4 h-4 text-indigo-500" /> ผู้ควบคุมออกหน่วย
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">ชื่อ-นามสกุล</label>
                    <input 
                      list="controllers-list"
                      type="text" 
                      placeholder="ระบุหรือเลือกชื่อผู้ควบคุม..." 
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      value={generalInfo.controllerName} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const val = e.target.value;
                        const selected = savedControllers.find(c => c.name === val);
                        setGeneralInfo({ 
                          ...generalInfo, 
                          controllerName: val,
                          controllerPhone: selected ? selected.phone || '' : generalInfo.controllerPhone 
                        });
                      }} 
                    />
                    <datalist id="controllers-list">
                      {savedControllers.map((c, idx) => <option key={idx} value={c.name} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">เบอร์ติดต่อ</label>
                    <input 
                      type="text" 
                      placeholder="08X-XXX-XXXX" 
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      value={generalInfo.controllerPhone} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGeneralInfo({ ...generalInfo, controllerPhone: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: รายชื่อผู้ปฏิบัติงาน */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm mt-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-5 h-5 text-indigo-500" /> จัดทีมออกหน่วย (Staff Assignment)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">เพิ่มรายชื่อบุคลากรตามหน้าที่ที่รับผิดชอบ</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StaffInputGroup roleKey="vets" label="สัตวแพทย์" icon={UserPlus} staffList={staff.vets} {...commonProps} />
              <StaffInputGroup roleKey="drivers" label="คนขับรถ" icon={Activity} staffList={staff.drivers} {...commonProps} />
              
              {(unitType === 'sterilization' || unitType === 'cat_cage' || unitType === 'spay_neuter') && ( 
                <>
                  {(unitType === 'sterilization' || unitType === 'spay_neuter') && ( 
                    <StaffInputGroup roleKey="registration" label="ลงทะเบียน" icon={FileText} staffList={staff.registration} {...commonProps} />
                  )}
                  <StaffInputGroup roleKey="prep_catch" label="จับ/วางยา" staffList={staff.prep_catch} {...commonProps} />
                  <StaffInputGroup roleKey="prep_shave" label="โกนขน" staffList={staff.prep_shave} {...commonProps} />
                  <StaffInputGroup roleKey="prep_lift" label="ยกสัตว์" staffList={staff.prep_lift} {...commonProps} />
                  <StaffInputGroup roleKey="vaccine_staff" label="ฉีดวัคซีน" staffList={staff.vaccine_staff} {...commonProps} />
                  
                  {unitType === 'cat_cage' && (
                    <StaffInputGroup roleKey="tattoo" label="สักตัว" staffList={staff.tattoo} {...commonProps} />
                  )}
                  
                  <StaffInputGroup roleKey="surgery_assist" label="ผู้ช่วยผ่าตัด" staffList={staff.surgery_assist} {...commonProps} />
                </>
              )}

              {(unitType !== 'sterilization' && unitType !== 'cat_cage' && unitType !== 'spay_neuter') && (
                <StaffInputGroup roleKey="assistants" label="ผู้ช่วย/จนท." icon={Users} staffList={staff.assistants} {...commonProps} />
              )}
            </div>
          </div>

          </div>
        </div>

        {/* === Footer (Sticky Bottom) === */}
        <div className="bg-white border-t border-slate-200 p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-3 z-10 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          
          <div className="flex w-full sm:w-auto gap-2.5">
            {initialData && onDelete && !isCopyMode && (
              <button 
                onClick={() => { playSound('delete'); onDelete(initialData._id as string); }} 
                className="flex-1 sm:flex-none px-3 py-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-rose-200"
              >
                <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">ลบงานนี้</span>
              </button>
            )}
            
            {initialData && !isCopyMode && (
              <button 
                onClick={() => {
                  playSound('pop');
                  setIsCopyMode(true);
                  if (onToast) onToast('info', 'อยู่ในโหมดคัดลอก กรุณาเปลี่ยนวันที่ก่อนบันทึก');
                }} 
                className="flex-1 sm:flex-none px-3 py-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-amber-200"
              >
                <Copy className="w-4 h-4" /> <span className="hidden sm:inline">คัดลอกงาน</span>
              </button>
            )}
          </div>

          <div className="flex w-full sm:w-auto gap-2.5 items-center">
            <button 
              onClick={handleCloseModal}
              className="px-4 py-2.5 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-xs"
            >
              ยกเลิก
            </button>
            
            <div className="flex flex-1 sm:flex-none gap-2">
              {(!initialData || isCopyMode) && (
                  <button 
                    onClick={() => handleSaveLocal(true)} 
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                    title="บันทึกแล้วเคลียร์ฟอร์มเพื่อลงงานถัดไป"
                  >
                    <Plus className="w-4 h-4" /> 
                    <span className="hidden sm:inline">บันทึก & เพิ่มต่อ</span>
                    <span className="inline sm:hidden">บันทึก+</span>
                  </button>
              )}

              <button 
                onClick={() => handleSaveLocal(false)} 
                className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> 
                <span className="hidden md:inline">บันทึกข้อมูล</span>
                <span className="inline md:hidden">บันทึก</span>
              </button>
              
              <button 
                onClick={handleSendLine} 
                className="px-3.5 py-2.5 bg-[#06C755] hover:bg-[#05b64d] text-white rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 transition-all flex items-center justify-center"
                title="แชร์ไปที่ Line"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DispatchModal;