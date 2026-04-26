import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    CalendarDays, X, Plus, Clock, Users, CheckCircle, ChevronLeft, ChevronRight, Calendar, Search, Phone, MapPin,
    Unlock, LogOut, Megaphone, Edit3, ChevronUp, ChevronDown, Trash2, Save, UserPlus,
    Volume2, VolumeX,
    FileText
} from 'lucide-react';
// สมมติว่ามี Component เหล่านี้อยู่จริง โปรดตรวจสอบ Path อีกครั้ง
import DispatchModal from './modals/DispatchModal'; 
import LoginModal from './modals/LoginModal';

// นำเข้า ToastContainer และถ้ามีการ export Type Toast มาด้วย ก็สามารถ import มาใช้ได้เลย
import ToastContainer from '../path/to/ToastContainer'; 

import { playSound } from '../utils/soundUtils';

// ==========================================
// 0. Interfaces
// ==========================================

export interface User {
    username: string;
    role: string;
    token: string;
    [key: string]: any;
}

export interface ControllerData {
    _id?: string;
    name: string;
    phone?: string;
}

export interface StaffData {
    _id?: string;
    name: string;
    role?: 'vet' | 'general';
    controllers?: string[];
}

export interface EventData {
    _id?: string;
    title?: string;
    type?: string;
    date: string; // YYYY-MM-DD
    time?: string; // HH:mm
    closingTime?: string; // HH:mm
    location?: string;
    district?: string;
    lat?: number | string;
    lng?: number | string;
    team?: string;
    status?: 'cancelled' | 'postponed' | 'completed' | string;
    isVisibleToPublic?: boolean;
    unitColor?: string;
    controllerName?: string;
    controllerPhone?: string;
    services?: string[];
    details?: string;
    description?: string;
    mapLink?: string;
    staff?: StaffData;
    originalData?: any;
    unit?: string;
    unitName?: string;
}

export interface Announcement {
    id: number;
    icon: string;
    text: string;
    isActive: boolean;
}

// เปลี่ยนจาก ToastMessage เป็น Toast เพื่อให้ตรงกับ Props ที่ ToastContainer ต้องการ
export interface Toast {
    id: number | string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
}

// ==========================================
// 1. Shared Components & Utils
// ==========================================

interface StatCardProps {
    label: string;
    value: string | number;
    colorClass: string;
    bgClass: string;
    icon?: React.ElementType;
}

const StatCard: React.FC<StatCardProps> = React.memo(({ label, value, colorClass, bgClass, icon: Icon }) => (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all duration-300">
        <div>
            <div className="text-slate-500 text-[10px] sm:text-[11px] font-bold mb-1">{label}</div>
            <div className={`text-lg sm:text-xl font-black tracking-tight ${colorClass}`}>{value}</div>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${bgClass} transition-transform group-hover:scale-110 duration-300 shrink-0`}>
            {Icon && <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorClass}`} />}
        </div>
    </div>
));

const toLocalISOString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface EventStyle {
    border: string;
    bg: string;
    text: string;
    dot: string;
}

const getEventStyles = (evt: EventData): EventStyle => {
    if (evt.type === 'meeting') return { border: 'border-l-teal-400', bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-400' };
    
    const colorMap: Record<string, EventStyle> = {
        'bg-red-500': { border: 'border-l-rose-400', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-400' },
        'bg-blue-500': { border: 'border-l-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
        'bg-green-500': { border: 'border-l-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
        'bg-yellow-400': { border: 'border-l-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
        'bg-purple-500': { border: 'border-l-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
        'bg-orange-500': { border: 'border-l-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
        'bg-pink-500': { border: 'border-l-pink-400', bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-400' },
        'bg-slate-400': { border: 'border-l-slate-400', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
        'default': { border: 'border-l-indigo-400', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-400' }
    };
    return colorMap[evt.unitColor || ''] || colorMap['default'];
};

const getDispatchStatus = (evt: EventData): { text: string, badge: string } | null => {
    if (!evt || !evt.date || !evt.time) return null;
    if (evt.status === 'cancelled') return { text: 'ยกเลิก', badge: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (evt.status === 'postponed') return { text: 'เลื่อน', badge: 'bg-orange-100 text-orange-700 border-orange-200' };
    if (evt.status === 'completed') return { text: 'เสร็จสิ้น (Manual)', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' };

    const closeTime = evt.closingTime || '16:00'; 
    const now = new Date();
    const start = new Date(`${evt.date}T${evt.time}:00`);
    const end = new Date(`${evt.date}T${closeTime}:00`);
    const thirtyMins = 30 * 60 * 1000; 

    if (now < new Date(start.getTime() - thirtyMins)) return { text: 'รอปฏิบัติงาน', badge: 'bg-slate-100 text-slate-600 border-slate-200/60' };
    else if (now >= new Date(start.getTime() - thirtyMins) && now < start) return { text: 'เตรียมพร้อม', badge: 'bg-amber-100 text-amber-700 border-amber-200' };
    else if (now >= start && now < new Date(end.getTime() - thirtyMins)) return { text: 'กำลังดำเนินงาน', badge: 'bg-blue-100 text-blue-700 border-blue-200' };
    else return { text: 'สิ้นสุดปฏิบัติงาน', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
};

const getBaseType = (title?: string, type?: string): string => {
    let t = title || (type === 'meeting' ? 'นัดหมายประชุม' : 'ออกหน่วย');
    if (t === 'นัดหมายประชุม') return t;
    t = t.replace(/\s*\(.*?\)/g, '');
    t = t.replace(/\s+(ทีม|สาย)?\s*[A-Za-zก-ฮ0-9]$/i, '');
    return t.trim() || 'ออกหน่วย';
};

const RealTimeClock: React.FC = React.memo(() => {
    const [realTime, setRealTime] = useState<Date>(new Date());
    useEffect(() => {
        const timer = setInterval(() => setRealTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <>
            <Clock className="w-4 h-4 text-indigo-500" />
            {realTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.
        </>
    );
});

interface TimelineLineProps {
    startHour: number;
    endHour: number;
}

const TimelineCurrentTimeLine: React.FC<TimelineLineProps> = React.memo(({ startHour, endHour }) => {
    const [position, setPosition] = useState<number>(0);

    useEffect(() => {
        const updatePosition = () => {
            const now = new Date();
            const currentMins = (now.getHours() * 60) + now.getMinutes();
            const startMins = startHour * 60;
            const totalMins = (endHour - startHour) * 60;
            
            let percent = ((currentMins - startMins) / totalMins) * 100;
            if (percent < 0) percent = 0;
            if (percent > 100) percent = 100;
            
            setPosition(percent);
        };
        
        updatePosition();
        const timer = setInterval(updatePosition, 60000); // อัปเดตทุก 1 นาที
        return () => clearInterval(timer);
    }, [startHour, endHour]);

    if (position === 0 || position === 100) return null;

    return (
        <div 
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none"
            style={{ left: `${position}%` }}
        >
            <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.6)]"></div>
        </div>
    );
});

// ==========================================
// 2. Announcement Components
// ==========================================

interface AnnouncementBarProps {
    announcements: Announcement[];
    onEditClick: () => void;
    canEdit: boolean | null;
}

const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ announcements, onEditClick, canEdit }) => {
    const activeAnnouncements = announcements.filter(a => a.isActive);
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    useEffect(() => {
        if (activeAnnouncements.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % activeAnnouncements.length);
        }, 8000); 
        return () => clearInterval(timer);
    }, [activeAnnouncements.length]);

    useEffect(() => {
        if (currentIndex >= activeAnnouncements.length) {
            setCurrentIndex(0);
        }
    }, [activeAnnouncements.length, currentIndex]);

    if (activeAnnouncements.length === 0 && !canEdit) return null;

    const safeIndex = currentIndex >= activeAnnouncements.length ? 0 : currentIndex;
    const currentItem = activeAnnouncements[safeIndex];

    return (
        <div className="bg-[#2D1B6B] text-white flex items-center px-4 text-xs relative z-40 shadow-md shrink-0 w-full h-11 overflow-hidden">
            <div className="bg-[#6B4BFA] text-white px-3 py-1 rounded-full font-bold text-[10px] mr-3 shrink-0 z-10 flex items-center gap-2 shadow-sm">
                <Megaphone className="w-3 h-3" /> PREVIEW
            </div>
            
            <div className="flex-1 relative h-full flex items-center overflow-hidden">
                {currentItem && (
                    <div 
                        key={currentItem.id + '-' + safeIndex} 
                        className={`flex items-center gap-2 absolute w-full ${activeAnnouncements.length > 1 ? 'animate-slide-left' : ''}`}
                    >
                        <span className="shrink-0">{currentItem.icon}</span>
                        <span className="truncate">{currentItem.text}</span>
                    </div>
                )}
            </div>

            {canEdit && (
                <button onClick={onEditClick} className="ml-3 p-1.5 hover:bg-white/20 rounded-lg transition-colors shrink-0 text-white/80 hover:text-white" title="แก้ไขข้อความแถบเลื่อน">
                    <Edit3 className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

interface AnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialAnnouncements: Announcement[];
    onSave: (items: Announcement[]) => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ isOpen, onClose, initialAnnouncements, onSave }) => {
    const [items, setItems] = useState<Announcement[]>([]);

    useEffect(() => {
        if (isOpen) setItems([...initialAnnouncements]);
    }, [isOpen, initialAnnouncements]);

    if (!isOpen) return null;

    const handleToggle = (id: number) => { playSound('switch'); setItems(items.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item)); };
    const handleChangeText = (id: number, text: string) => setItems(items.map(item => item.id === id ? { ...item, text } : item));
    const handleChangeIcon = (id: number, icon: string) => setItems(items.map(item => item.id === id ? { ...item, icon } : item));
    const handleDelete = (id: number) => { playSound('delete'); setItems(items.filter(item => item.id !== id)); };
    const handleAdd = () => { playSound('pop'); setItems([...items, { id: Date.now(), icon: '📌', text: 'ข้อความใหม่', isActive: true }]); };

    return (
        <div className="fixed inset-0 z-[6000] flex justify-center items-end sm:items-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white w-full sm:w-[500px] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#6B4BFA] flex items-center justify-center text-white shadow-md">
                            <Edit3 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800">แก้ไขข้อความแถบเลื่อน</h2>
                            <p className="text-[11px] text-slate-500">จัดการข้อความประชาสัมพันธ์ด้านบน</p>
                        </div>
                    </div>
                    <button onClick={() => { playSound('pop'); onClose(); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-600">รายการข้อความ ({items.length})</span>
                    </div>
                    
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className={`flex items-center gap-2 p-3 bg-white border ${item.isActive ? 'border-purple-100 shadow-sm' : 'border-slate-200 opacity-60'} rounded-xl transition-all`}>
                                <div className="flex flex-col text-slate-300 hover:text-slate-500 cursor-grab px-1">
                                    <ChevronUp className="w-4 h-4 -mb-1" />
                                    <ChevronDown className="w-4 h-4 -mt-1" />
                                </div>
                                <input type="text" value={item.icon} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChangeIcon(item.id, e.target.value)} className="w-8 text-center bg-slate-50 border border-slate-200 rounded-md py-1 text-xs outline-none focus:border-purple-400" />
                                <input type="text" value={item.text} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChangeText(item.id, e.target.value)} className="flex-1 bg-transparent border-none text-xs text-slate-700 outline-none placeholder-slate-400 focus:ring-0" placeholder="พิมพ์ข้อความ..." />
                                <div className="flex items-center gap-2 ml-2">
                                    <button onClick={() => handleToggle(item.id)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.isActive ? 'bg-[#6B4BFA]' : 'bg-slate-200'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100 bg-white"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button onClick={handleAdd} className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-[#6B4BFA] hover:border-[#6B4BFA] hover:bg-purple-50 transition-colors flex justify-center items-center gap-2">
                        <Plus className="w-4 h-4" /> เพิ่มข้อความใหม่
                    </button>
                </div>

                <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 shrink-0">
                    <button onClick={() => { playSound('pop'); onClose(); }} className="py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">ยกเลิก</button>
                    <button onClick={() => { playSound('success'); onSave(items); onClose(); }} className="py-2.5 rounded-xl font-bold text-xs text-white bg-[#6B4BFA] hover:bg-[#5A3EE0] shadow-md shadow-purple-200 flex justify-center items-center gap-2 transition-colors"><Save className="w-4 h-4"/> บันทึกทั้งหมด</button>
                </div>
            </div>
        </div>
    );
};

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-slate-200 py-3 px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] sm:text-xs text-slate-500 shrink-0 z-20 w-full mt-auto">
            <div className="font-medium">
                &copy; {new Date().getFullYear()} สำนักงานสัตวแพทย์สาธารณสุข สำนักอนามัย กรุงเทพมหานคร
            </div>
        </footer>
    );
};

// ==========================================
// 3. Main Component (Standalone Page)
// ==========================================

const DispatchCalendarDashboard: React.FC = () => {
    const [events, setEvents] = useState<EventData[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('ทุกประเภท');

    const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(0.3); // ค่าเริ่มต้นความดัง 30%
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); 
            audioRef.current.loop = true;
        }
        audioRef.current.volume = volume;
    }, [volume]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.log('Autoplay prevented:', e));
            }
            setIsPlaying(!isPlaying);
            playSound('switch');
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(parseFloat(e.target.value));
    };

    const TIMELINE_START_HOUR = 6;
    const TIMELINE_END_HOUR = 18;
    const TIMELINE_TOTAL_MINS = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;

    const displayEvents = useMemo(() => {
        return events.filter(e => {
            const matchSearch = !searchTerm || 
                e.location?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.team?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const baseType = getBaseType(e.title, e.type);
            const matchType = selectedType === 'ทุกประเภท' || baseType === selectedType;
            return matchSearch && matchType;
        });
    }, [events, searchTerm, selectedType]);

    const stats = useMemo(() => {
        const todayStr = toLocalISOString(new Date());
        let total = displayEvents.length;
        let upcoming = 0;
        let today = 0;
        let publicCount = 0;

        displayEvents.forEach(e => {
            if (e.date >= todayStr) upcoming++;
            if (e.date === todayStr) today++;
            if (e.isVisibleToPublic !== false) publicCount++;
        });

        return { total, upcoming, today, publicCount };
    }, [displayEvents]);

    const selectedDateEvents = useMemo(() => {
        const selectedStr = toLocalISOString(selectedDate);
        return displayEvents.filter(e => e.date === selectedStr);
    }, [displayEvents, selectedDate]);
    
    const getTimelineStyle = (startTime?: string, closingTime?: string) => {
        const parseTime = (t?: string) => {
            if (!t) return 0;
            const [h, m] = t.split(':').map(Number);
            return (h * 60) + m;
        };

        let startMins = parseTime(startTime) - (TIMELINE_START_HOUR * 60);
        let endMins = closingTime ? (parseTime(closingTime) - (TIMELINE_START_HOUR * 60)) : startMins + 120;

        if (startMins < 0) startMins = 0;
        if (endMins > TIMELINE_TOTAL_MINS) endMins = TIMELINE_TOTAL_MINS;
        if (endMins <= startMins) endMins = startMins + 60; 

        const leftPercent = (startMins / TIMELINE_TOTAL_MINS) * 100;
        const widthPercent = ((endMins - startMins) / TIMELINE_TOTAL_MINS) * 100;

        return { left: `${leftPercent}%`, width: `${widthPercent}%` };
    };

    const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, event: EventData | null, uniqueId: string | number | null }>({ visible: false, x: 0, y: 0, event: null, uniqueId: null });

    useEffect(() => {
        const handleClickOutside = () => setContextMenu({ visible: false, x: 0, y: 0, event: null, uniqueId: null });
        if (contextMenu.visible) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [contextMenu.visible]);

    const BASE_URL = 'https://veterinarydashboard-hwho.onrender.com';

    const [expandedEventId, setExpandedEventId] = useState<string | number | null>(null);

    // ---- Controller Management State ----
    const [isAddControllerOpen, setIsAddControllerOpen] = useState<boolean>(false);
    const [controllerNameInput, setControllerNameInput] = useState<string>('');
    const [controllerPhoneInput, setControllerPhoneInput] = useState<string>('');
    const [savedControllersList, setSavedControllersList] = useState<ControllerData[]>([]); 
    const [editingControllerIndex, setEditingControllerIndex] = useState<number | null>(null); 

    // ---- Staff Management State ----
    const [savedStaffList, setSavedStaffList] = useState<StaffData[]>([]);
    const [isManageStaffOpen, setIsManageStaffOpen] = useState<boolean>(false);
    const [staffNameInput, setStaffNameInput] = useState<string>('');
    const [staffRoleInput, setStaffRoleInput] = useState<'vet' | 'general'>('general');
    const [editingStaffIndex, setEditingStaffIndex] = useState<number | null>(null);

    const formRef = useRef<HTMLDivElement | HTMLFormElement | null>(null);

    const fetchSavedControllers = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/controllers`);
            const data: ControllerData[] = await res.json();
            setSavedControllersList(data);
        } catch (error) {
            console.error("Fetch Controllers Error", error);
        }
    };

    const fetchSavedStaffs = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/staffs`);
            if (!res.ok) {
                 throw new Error(`API Error: ${res.status}`);
            }
            const data: StaffData[] = await res.json();
            setSavedStaffList(data);
        } catch (error) {
            console.error("Fetch Staffs Error", error);
        }
    };

    useEffect(() => {
        fetchSavedStaffs();
    }, []);

    useEffect(() => {
        if (isAddControllerOpen) {
            fetchSavedControllers();
            setControllerNameInput('');
            setControllerPhoneInput('');
            setEditingControllerIndex(null);
        }
    }, [isAddControllerOpen]);

    useEffect(() => {
        if (isManageStaffOpen) {
            fetchSavedStaffs();
            setStaffNameInput('');
            setStaffRoleInput('general');
            setEditingStaffIndex(null);
        }
    }, [isManageStaffOpen]);

    const handleSaveController = async () => {
        if (!controllerNameInput.trim()) {
            addToast('error', 'กรุณาระบุชื่อผู้ควบคุม');
            return;
        }

        const payload = { name: controllerNameInput.trim(), phone: controllerPhoneInput.trim() };
        const isEditing = editingControllerIndex !== null;
        const url = isEditing 
            ? `${BASE_URL}/api/controllers/${savedControllersList[editingControllerIndex]._id}`
            : `${BASE_URL}/api/controllers`;

        try {
            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                playSound('success');
                addToast('success', isEditing ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มข้อมูลสำเร็จ');
                fetchSavedControllers(); 
                setControllerNameInput('');
                setControllerPhoneInput('');
                setEditingControllerIndex(null);
            }
        } catch (error) {
            addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล');
        }
    };

    const handleEditController = (index: number) => {
        const item = savedControllersList[index];
        setControllerNameInput(item.name);
        setControllerPhoneInput(item.phone || '');
        setEditingControllerIndex(index);
    };

    const handleDeleteController = async (index: number) => {
        const target = savedControllersList[index];
        if (window.confirm(`ยืนยันการลบคุณ ${target.name}?`)) {
            try {
                const res = await fetch(`${BASE_URL}/api/controllers/${target._id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                if (res.ok) {
                    playSound('delete');
                    addToast('success', 'ลบข้อมูลเรียบร้อยแล้ว');
                    fetchSavedControllers();
                    
                    if (editingControllerIndex === index) {
                        setControllerNameInput('');
                        setControllerPhoneInput('');
                        setEditingControllerIndex(null);
                    } else if (editingControllerIndex !== null && editingControllerIndex > index) {
                        setEditingControllerIndex(editingControllerIndex - 1);
                    }
                }
            } catch (error) {
                addToast('error', 'ไม่สามารถลบข้อมูลได้');
            }
        }
    };

    const handleSaveStaff = async () => {
        if (!staffNameInput.trim()) {
            addToast('error', 'กรุณาระบุชื่อทีมงาน');
            return;
        }

        const payload = { 
            name: staffNameInput.trim(), 
            role: staffRoleInput 
        };
        const isEditing = editingStaffIndex !== null;
        const url = isEditing 
            ? `${BASE_URL}/api/staffs/${savedStaffList[editingStaffIndex]._id}`
            : `${BASE_URL}/api/staffs`;

        try {
            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                playSound('success');
                addToast('success', isEditing ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มรายชื่อสำเร็จ');
                fetchSavedStaffs(); 
                setStaffNameInput('');
                setEditingStaffIndex(null);
            }
        } catch (error) {
            addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล');
        }
    };

    const handleDeleteStaff = async (index: number) => {
        const target = savedStaffList[index];
        if (window.confirm(`ยืนยันการลบคุณ ${target.name}?`)) {
            try {
                const res = await fetch(`${BASE_URL}/api/staffs/${target._id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                if (res.ok) {
                    playSound('delete');
                    addToast('success', 'ลบรายชื่อเรียบร้อยแล้ว');
                    fetchSavedStaffs();
                }
            } catch (error) {
                addToast('error', 'ไม่สามารถลบข้อมูลได้');
            }
        }
    };
    
    const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState<boolean>(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([
        { id: 1, icon: '💉', text: 'บริการฉีดวัคซีนสัตว์เลี้ยง ฟรี! ทุกวันอังคาร-ศุกร์', isActive: true },
        { id: 2, icon: '🏥', text: 'ทำหมันสุนัข-แมว ฟรี! รับจำนวนจำกัด โทรจองล่วงหน้า', isActive: true },
        { id: 3, icon: '🩺', text: 'ตรวจสุขภาพสัตว์เลี้ยงฟรี ทุกวันเสาร์-อาทิตย์', isActive: true },
        { id: 4, icon: '📞', text: 'แจ้งสัตว์จรจัดบาดเจ็บ โทร 1119 ตลอด 24 ชั่วโมง', isActive: true },
        { id: 5, icon: '🚑', text: 'หน่วยสัตวแพทย์เคลื่อนที่ พร้อมให้บริการทุกพื้นที่', isActive: true }
    ]);

    const handleSaveAnnouncements = (newAnnouncements: Announcement[]) => {
        setAnnouncements(newAnnouncements);
        addToast('success', '✅ บันทึกข้อความแถบเลื่อนเรียบร้อยแล้ว');
    };

    const handleLogin = (userData: User) => {
        playSound('success');
        setUser(userData);
        localStorage.setItem('vet_user', JSON.stringify(userData));
        setIsLoginModalOpen(false);
        addToast('success', 'เข้าสู่ระบบสำเร็จ');
    };

    const handleLogout = () => {
        if (window.confirm("ยืนยันการออกจากระบบ?")) {
            playSound('switch');
            setUser(null);
            localStorage.removeItem('vet_user');
            addToast('info', 'ออกจากระบบแล้ว');
        }
    };

    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
    const [viewingDispatch, setViewingDispatch] = useState<EventData | null>(null);
    
    // State ใช้ Type เป็น Toast ตาม Interface ที่อัปเดตใหม่
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
    };
    const removeToast = (id: number | string) => setToasts(prev => prev.filter(t => t.id !== id));

    useEffect(() => {
        const storedUser = localStorage.getItem('vet_user');
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);
    
    const canEdit = user && ['Developer', 'MagaAdmin', 'admin'].includes(user.role);
    const canViewHidden = user && ['Developer', 'MagaAdmin', 'admin', 'executive'].includes(user.role);

    useEffect(() => {
    const fetchData = async () => {
        try {
            const token = getCurrentToken();
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // ✨ ดึงข้อมูล Dispatches และ Reports พร้อมกัน
            const [res, reportsRes] = await Promise.all([
                fetch(`${BASE_URL}/api/dispatches`, { headers }),
                fetch(`${BASE_URL}/api/reports?limit=5000`, { headers })
            ]);
            
            if (res.ok) {
                const data: EventData[] = await res.json();
                const filtered = canViewHidden ? data : data.filter(d => d.isVisibleToPublic !== false);
                const mappedEvents = filtered.map(d => ({ ...d, type: 'dispatch', originalData: d }));
                setEvents(mappedEvents);
            } else if (res.status === 401 || res.status === 403) {
                addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
                setUser(null);
                localStorage.removeItem('vet_user');
                setIsLoginModalOpen(true);
            }

            // ✨ เก็บข้อมูล Reports เพื่อเอาไปเช็คสถานะการบันทึกยอด
            if (reportsRes.ok) {
                const rData = await reportsRes.json();
                setReports(Array.isArray(rData) ? rData : (rData.data || []));
            }

        } catch (error) {
            console.error("Fetch Data Error", error);
        }
    };
    fetchData();
}, [canViewHidden, BASE_URL, setUser]);

    const scrollToForm = () => {
        setTimeout(() => {
            if (formRef.current) {
                formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const openDispatchForm = () => { 
        playSound('pop');
        setViewingDispatch(null); 
        setIsDispatchModalOpen(true); 
        scrollToForm(); 
    };
    
    const openDispatchEvent = (evt: EventData) => { 
        if (canEdit) {
            setViewingDispatch(evt.originalData || evt); 
            setIsDispatchModalOpen(true); 
            scrollToForm();
        }
    };

    // 1. แก้ไขให้ดึง Token ปลอดภัยขึ้น
const getCurrentToken = () => {
    try {
        const storedUser = localStorage.getItem('vet_user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            return parsed?.token || user?.token || '';
        }
    } catch (e) {
        console.error('Error parsing token', e);
    }
    return user?.token || '';
};

// 2. ดักจับ Session ตอนดึงข้อมูลโหลดปฏิทิน
useEffect(() => {
    const fetchData = async () => {
        try {
            const token = getCurrentToken();
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(`${BASE_URL}/api/dispatches`, { headers });
            
            if (res.ok) {
                const data: EventData[] = await res.json();
                const filtered = canViewHidden ? data : data.filter(d => d.isVisibleToPublic !== false);
                const mappedEvents = filtered.map(d => ({ ...d, type: 'dispatch', originalData: d }));
                setEvents(mappedEvents);
            } else if (res.status === 401 || res.status === 403) {
                // จัดการ Token หมดอายุ
                addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
                setUser(null);
                localStorage.removeItem('vet_user');
                setIsLoginModalOpen(true);
            } else {
                console.error("Fetch Data Error:", res.status);
            }
        } catch (error) {
            console.error("Fetch Data Error", error);
        }
    };
    fetchData();
}, [canViewHidden, BASE_URL, setUser]);


// 3. แก้ไข Header ในการ Save/Edit (POST/PUT Request ที่ Error ในภาพ)
const handleSaveDispatchEvent = async (payload: any, shouldClose = true) => {
    try {
        const isUpdate = !Array.isArray(payload) && payload._id;
        const method = isUpdate ? 'PUT' : 'POST';
        const url = isUpdate ? `${BASE_URL}/api/dispatches/${payload._id}` : `${BASE_URL}/api/dispatches`;

        const token = getCurrentToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            playSound('success');
            addToast('success', isUpdate ? 'แก้ไขแผนงานเรียบร้อย' : 'บันทึกแผนงานเรียบร้อย');
            
            if (shouldClose) {
                setIsDispatchModalOpen(false);
            }

            // โหลดข้อมูลใหม่ โดยป้องกัน Header ผิดพลาดเช่นกัน
            const fetchHeaders: Record<string, string> = {};
            if (token) {
                fetchHeaders['Authorization'] = `Bearer ${token}`;
            }
            const fetchRes = await fetch(`${BASE_URL}/api/dispatches`, { headers: fetchHeaders });
            
            if (fetchRes.ok) {
                const data: EventData[] = await fetchRes.json();
                const filtered = canViewHidden ? data : data.filter(d => d.isVisibleToPublic !== false);
                setEvents(filtered.map(d => ({ ...d, type: 'dispatch', originalData: d })));
            }
            
            return true;
        } else if (res.status === 401 || res.status === 403) {
            addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
            setUser(null);
            localStorage.removeItem('vet_user');
            setIsLoginModalOpen(true);
            return false;
        } else {
            const err = await res.json();
            addToast('error', `บันทึกไม่สำเร็จ: ${err.message}`);
            return false;
        }
    } catch (error) {
        addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        return false;
    }
};

    const handleDeleteDispatch = async (id?: string) => {
    if(!id) return;
    if (!window.confirm('ยืนยันลบแผนงานนี้?')) return;
    try {
        const res = await fetch(`${BASE_URL}/api/dispatches/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getCurrentToken()}` }
        });
        if (res.ok) {
            playSound('delete');
            addToast('success', 'ลบแผนงานเรียบร้อย');
            setIsDispatchModalOpen(false);
            setEvents(prev => prev.filter(e => e._id !== id));
        } else if (res.status === 401 || res.status === 403) {
            addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
            setUser(null);
            localStorage.removeItem('vet_user');
            setIsLoginModalOpen(true);
        } else {
            addToast('error', 'ลบไม่สำเร็จ');
        }
    } catch (error) {
        addToast('error', 'ลบไม่สำเร็จ');
    }
};

    const [dragOverDate, setDragOverDate] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, eventId?: string) => {
        if (!canEdit || !eventId) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('eventId', eventId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, dateStr: string) => {
        e.preventDefault(); 
        if (canEdit && dragOverDate !== dateStr) {
            setDragOverDate(dateStr);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverDate(null);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetDateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!canEdit) return;

    const eventId = e.dataTransfer.getData('eventId');
    if (!eventId) return;

    const draggedEvent = events.find(ev => ev._id === eventId);
    if (!draggedEvent || draggedEvent.date === targetDateStr) return;

    const targetDateObj = new Date(targetDateStr);
    const formattedDate = targetDateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    
    if (!window.confirm(`ยืนยันการเลื่อนงาน "${draggedEvent.title || 'ออกหน่วย'}" \nไปยังวันที่ ${formattedDate} หรือไม่?`)) {
        return;
    }

    const previousEvents = [...events];
    setEvents(prev => prev.map(ev => ev._id === eventId ? { ...ev, date: targetDateStr } : ev));

    try {
        const payload = { ...draggedEvent.originalData, date: targetDateStr };
        const res = await fetch(`${BASE_URL}/api/dispatches/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getCurrentToken()}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            addToast('success', 'ย้ายวันปฏิบัติงานเรียบร้อยแล้ว');
        } else if (res.status === 401 || res.status === 403) {
            addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
            setUser(null);
            localStorage.removeItem('vet_user');
            setIsLoginModalOpen(true);
            setEvents(previousEvents);
        } else {
            const err = await res.json();
            addToast('error', `ไม่สามารถย้ายได้: ${err.message}`);
            setEvents(previousEvents);
        }
    } catch (error) {
        addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        setEvents(previousEvents);
    }
};

    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const changeMonth = (offset: number) => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + offset)));

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const daysArray = [...Array(daysInMonth + firstDay).keys()];

    const eventTypes = useMemo(() => {
        const counts: Record<string, number> = { 'ทุกประเภท': events.length };
        events.forEach(e => {
            const baseType = getBaseType(e.title, e.type);
            counts[baseType] = (counts[baseType] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => {
            if (a[0] === 'ทุกประเภท') return -1;
            if (b[0] === 'ทุกประเภท') return 1;
            return b[1] - a[1];
        });
    }, [events]);

    const eventsByTeam = useMemo(() => {
        const grouped: Record<string, EventData[]> = {};
        selectedDateEvents.forEach(evt => {
            const teamName = evt.team || 'ไม่ได้ระบุทีม';
            if (!grouped[teamName]) grouped[teamName] = [];
            grouped[teamName].push(evt);
        });
        return grouped;
    }, [selectedDateEvents]);

    return (
        <div className="w-full h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
            <style>{`
                @keyframes slideLeft {
                    0% { transform: translateX(100%); opacity: 0; }
                    10% { transform: translateX(0); opacity: 1; }
                    90% { transform: translateX(0); opacity: 1; }
                    100% { transform: translateX(-100%); opacity: 0; }
                }
                .animate-slide-left {
                    animation: slideLeft 8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
            `}</style>
            
            <AnnouncementBar announcements={announcements} onEditClick={() => setIsAnnouncementModalOpen(true)} canEdit={canEdit} />

            <div className="bg-white px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 shadow-sm z-20 shrink-0 w-full">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-sm border border-indigo-100">
                        <Calendar className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">ปฏิทินออกหน่วยสัตวแพทย์เคลื่อนที่</h3>
                        <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">Mobile Veterinary Unit Calendar</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-xs font-bold shadow-sm">
                        <RealTimeClock />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-2 py-1.5 rounded-xl shadow-sm transition-all">
                        <button
                            onClick={togglePlay}
                            className={`p-1.5 rounded-lg transition-colors ${isPlaying ? 'text-indigo-600 bg-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
                            title={isPlaying ? "ปิดเสียง" : "เปิดเสียง"}
                        >
                            {isPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        {isPlaying && (
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="w-16 sm:w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 animate-in fade-in slide-in-from-left-2"
                                title={`ระดับเสียง ${Math.round(volume * 100)}%`}
                            />
                        )}
                    </div>

                    {canEdit && (
                        <>
                            <button onClick={() => { playSound('pop'); setIsAddControllerOpen(true); }} className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-bold transition-all text-xs shadow-sm flex items-center gap-2 border border-emerald-200">
                                <UserPlus className="w-4 h-4"/> <span className="hidden sm:inline">เพิ่มผู้ควบคุม</span>
                            </button>
                            <button onClick={() => { playSound('pop'); setIsManageStaffOpen(true); }} className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold transition-all text-xs shadow-sm flex items-center gap-2 border border-blue-200">
                                <Users className="w-4 h-4"/> <span className="hidden sm:inline">จัดการทีมงาน</span>
                            </button>
                            <button onClick={() => { playSound('pop'); openDispatchForm(); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-xs shadow-sm flex items-center gap-2">
                                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">เพิ่มงานใหม่</span>
                            </button>
                        </>
                    )}
                    {user ? (
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-2 py-1.5 rounded-xl">
                            <div className="hidden sm:flex flex-col items-end px-2">
                                <span className="text-xs font-bold text-slate-800">{user.username}</span>
                                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">{user.role}</span>
                            </div>
                            <button onClick={handleLogout} className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all shadow-sm border border-slate-200" title="ออกจากระบบ">
                                <LogOut className="w-4 h-4"/>
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsLoginModalOpen(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-xs shadow-sm flex items-center gap-2">
                            <Unlock className="w-4 h-4"/> เข้าสู่ระบบ
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden w-full">
                
                {/* Left Sidebar (ปฏิทิน) */}
                <div className="w-full lg:w-[420px] xl:w-[450px] p-4 sm:p-6 flex flex-col lg:h-full lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200/80 bg-slate-50 shrink-0 custom-scrollbar">
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <StatCard label="งานทั้งหมด" value={stats.total} colorClass="text-indigo-600" bgClass="bg-indigo-100/50" icon={CheckCircle} />
                        <StatCard label="วันนี้" value={stats.today} colorClass="text-blue-500" bgClass="bg-blue-100/50" icon={Calendar} />
                        <StatCard label="รอบปฏิบัติ" value={stats.upcoming} colorClass="text-orange-500" bgClass="bg-orange-100/50" icon={Clock} />
                        <StatCard label="เผยแพร่" value={stats.publicCount} colorClass="text-emerald-500" bgClass="bg-emerald-100/50" icon={Users} />
                    </div>

                    <div className="bg-white rounded-[1.5rem] p-4 sm:p-6 shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">
                                {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex items-center bg-slate-50 rounded-lg border border-slate-100 p-1">
                                <button onClick={() => { playSound('pop'); changeMonth(-1); }} className="p-1.5 hover:bg-white rounded-md text-slate-500 transition-colors shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={() => { playSound('pop'); setCurrentDate(new Date()); }} className="px-3 py-1 text-[11px] font-bold text-indigo-600 hover:bg-white rounded-md transition-colors shadow-sm">วันนี้</button>
                                <button onClick={() => { playSound('pop'); changeMonth(1); }} className="p-1.5 hover:bg-white rounded-md text-slate-500 transition-colors shadow-sm"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-3">
                            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d, i) => (
                                <div key={d} className={`text-center text-[11px] font-bold pb-2 ${i===0 || i===6 ? 'text-rose-500' : 'text-slate-400'}`}>{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 auto-rows-[minmax(45px,1fr)] gap-2">
                            {daysArray.map((day, i) => {
                                if (i < firstDay) return <div key={i} className="bg-transparent" />;
                                const dayNum = i - firstDay + 1;
                                const dObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
                                const dateStr = toLocalISOString(dObj);
                                const isToday = dateStr === toLocalISOString(new Date());
                                const isSelected = dateStr === toLocalISOString(selectedDate);
                                
                                const dayEvents = displayEvents.filter(e => e.date === dateStr);
                                const dotColors = Array.from(new Set(dayEvents.map(e => getEventStyles(e).dot)));
                                
                                const isDragOver = dragOverDate === dateStr;

                                return (
                                    <div key={i} 
                                        onClick={() => { playSound('pop'); setSelectedDate(dObj); }}
                                        onDragOver={(e) => handleDragOver(e, dateStr)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, dateStr)}
                                        className={`relative p-1.5 rounded-xl border cursor-pointer flex flex-col items-center justify-start gap-1.5 transition-all duration-200 bg-white
                                        ${isDragOver ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-400/50 scale-105 z-10' : 
                                          isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md z-10 scale-105' : 
                                          'border-slate-100 hover:border-indigo-300 hover:bg-slate-50'}`}
                                    >
                                        <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all
                                            ${isDragOver ? 'bg-emerald-500 text-white shadow-md' : 
                                              isToday ? 'bg-indigo-600 text-white shadow-md' : 
                                              isSelected ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700'}`}>
                                            {dayNum}
                                        </span>
                                        {dotColors.length > 0 && (
                                            <div className="flex flex-wrap justify-center gap-1 px-1">
                                                {dotColors.slice(0, 4).map((dot, idx) => (<span key={idx} className={`w-2 h-2 rounded-full ${dot}`}></span>))}
                                                {dotColors.length > 4 && <span className="w-2 h-2 rounded-full bg-slate-300"></span>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mt-6 pt-5 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold"><div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div> วัคซีน</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold"><div className="w-2.5 h-2.5 rounded-full bg-pink-400"></div> ทำหมัน</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div> ตรวจสุขภาพ</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold"><div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div> รักษา</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold"><div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div> ด่วน</div>
                        </div>
                    </div>
                </div>

                {/* Right Panel (Event List) */}
                <div className="flex-1 flex flex-col lg:h-full lg:overflow-hidden p-4 sm:p-6 lg:p-8 bg-white min-w-0">
                    <div className="flex flex-col gap-4 sm:gap-6 lg:overflow-y-auto lg:h-full lg:pr-2 custom-scrollbar">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-slate-800 text-xl leading-tight">
                                    {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}
                                </h4>
                                <p className="text-slate-500 text-sm font-medium mt-1.5">
                                    มี {selectedDateEvents.length} กิจกรรม {selectedDateEvents.length > 0 && ` (แสดง ${selectedDateEvents.length})`}
                                </p>
                            </div>
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                               <button onClick={() => { playSound('pop'); setViewMode('list'); }}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    มุมมองรายการ
                                </button>
                               <button onClick={() => { playSound('pop'); setViewMode('timeline'); }}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    มุมมองไทม์ไลน์
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="ค้นหางาน โลเคชัน ทีม เบอร์โทร..." 
                                    value={searchTerm} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-xs font-medium text-slate-700 shadow-sm" 
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {eventTypes.map(([type, count]) => {
                                    const isSelected = selectedType === type;
                                    const getIcon = (t: string) => {
                                        if (t === 'ทุกประเภท') return '';
                                        if (t.includes('วัคซีน')) return '';
                                        if (t.includes('ทำหมัน')) return '';
                                        if (t.includes('ตรวจสุขภาพ')) return '';
                                        if (t.includes('รักษา')) return '';
                                        if (t.includes('ประชุม')) return '';
                                        return '';
                                    };
                                    return (
                                        <button 
                                            key={type} 
                                            onClick={() => { playSound('pop'); setSelectedType(type); }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-200 shadow-sm ${
                                                isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-500/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="text-xs leading-none">{getIcon(type)}</span>
                                            {type}
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {count}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    {viewMode === 'list' ? (
                        <div className="flex-1 space-y-4">
                            {selectedDateEvents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm border border-slate-100">
                                        <CalendarDays className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <span className="text-slate-600 font-bold text-lg mb-2">ไม่พบกิจกรรม</span>
                                    <span className="text-slate-400 text-xs font-medium">ไม่มีกำหนดการในวันนี้ คลิกปุ่ม "เพิ่มงานใหม่" เพื่อสร้างกำหนดการ</span>
                                </div>
                            ) : (
                                selectedDateEvents.map((evt, idx) => {
                                    const styles = getEventStyles(evt); 
                                    const status = getDispatchStatus(evt);
                                    
                                    let phoneNum = evt.controllerPhone;
                                    let controllerName = evt.controllerName; 

                                    if (evt.staff?.controllers?.[0]) {
                                        const splitData = evt.staff.controllers[0].split('โทร.');
                                        if (!controllerName) controllerName = splitData[0].trim();
                                        if (!phoneNum && splitData.length > 1) phoneNum = splitData[1].trim();
                                    }

                                    const uniqueId = evt._id || idx;
                                    const isExpanded = expandedEventId === uniqueId;
                                    const isRecorded = reports.some(r => r.date === evt.date && r.location === evt.location);

                                    return (
                                        <div key={idx} 
                                            draggable={canEdit || false}
                                            onDragStart={(e) => handleDragStart(e, evt._id)}
                                            onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
                                                e.preventDefault();
                                                setContextMenu({ 
                                                    visible: true, 
                                                    x: e.clientX, 
                                                    y: e.clientY, 
                                                    event: evt,
                                                    uniqueId: uniqueId 
                                                });
                                            }}
                                            className={`bg-white p-4 rounded-xl border border-slate-200 border-l-[4px] sm:border-l-[5px] ${styles.border} shadow-sm hover:shadow-md transition-all duration-300 ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                        >
                                            <div className="flex justify-between items-start gap-3 mb-2.5">
                                                
                                                <div className="flex flex-col gap-2 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-bold">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {evt.time} - {evt.closingTime || '12:00'} 
                                                        </span>
                                                        <span className={`inline-flex items-center text-[10px] sm:text-[11px] px-2 py-1 rounded-md font-bold ${styles.bg} ${styles.text}`}>
                                                            {evt.title || (evt.type === 'meeting' ? 'นัดหมายประชุม' : 'ออกหน่วย')}
                                                        </span>
                                                        {evt.isVisibleToPublic === false && !canEdit && (
                                                            <span className="inline-flex items-center text-[10px] px-2 py-1 rounded-md font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                                (ซ่อนจากสาธารณะ)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="font-bold text-slate-800 text-base sm:text-lg leading-snug mb-1.5">
                                                {evt.location}
                                            </div>

                                            {(evt.district || controllerName) && (
                                                <div className="flex flex-col gap-1 mb-3 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                                    {evt.district && (
                                                        <div className="text-[11px] sm:text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                                                            <MapPin className="w-3 h-3 text-indigo-400" />
                                                            <span><span className="font-bold text-slate-700">เขต:</span> {evt.district}</span>
                                                        </div>
                                                    )}
                                                    {controllerName && (
                                                        <div className="text-[11px] sm:text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                                                            <Users className="w-3 h-3 text-indigo-400" />
                                                            <span><span className="font-bold text-slate-700">ผู้ควบคุม:</span> {controllerName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                                                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                                                    <span>{evt.team || 'ไม่ได้ระบุทีม'}</span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {status && (
                                                        <span className={`inline-flex items-center text-[10px] sm:text-[11px] px-2 py-1 rounded-md font-bold border ${status.badge}`}>
                                                            {status.text}
                                                        </span>
                                                    )}
                                                    {isRecorded ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-1 rounded-md font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                            <CheckCircle className="w-3 h-3" /> บันทึกผลแล้ว
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-1 rounded-md font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                            <FileText className="w-3 h-3" /> ยังไม่บันทึก
                                                        </span>
                                                    )}
                                                    
                                                    <button 
                                                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                            e.stopPropagation();
                                                            setExpandedEventId(isExpanded ? null : uniqueId);
                                                        }}
                                                        className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2.5 py-1.5 rounded-md font-bold transition-all shadow-sm border ${
                                                            isExpanded 
                                                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200' 
                                                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100'
                                                        }`}
                                                    >
                                                        {isExpanded ? 'ซ่อน' : 'ดูข้อมูล'}
                                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="mt-3 pt-3 border-t border-dashed border-slate-200 animate-in slide-in-from-top-2 fade-in duration-200 flex flex-col gap-2.5">
                                                    
                                                    <div className="flex flex-wrap gap-2 mb-1">
                                                        {phoneNum && (
                                                            <a href={`tel:${phoneNum.replace(/\D/g, '')}`} className="px-2.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 border border-emerald-100">
                                                                <Phone className="w-3 h-3" /> โทร
                                                            </a>
                                                        )}
                                                        {evt.mapLink && (
                                                            <a href={evt.mapLink} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 border border-blue-100">
                                                                <MapPin className="w-3 h-3" /> นำทาง
                                                            </a>
                                                        )}
                                                        {canEdit && (
                                                            <>
                                                                <button onClick={(e) => { e.stopPropagation(); openDispatchEvent(evt); }} className="px-2.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 border border-indigo-100">
                                                                    <Edit3 className="w-3 h-3" /> แก้ไข
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteDispatch(evt._id); }} className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 border border-rose-100">
                                                                    <Trash2 className="w-3 h-3" /> ลบ
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                        <div className="text-[10px] font-bold text-slate-400 mb-0.5 flex items-center gap-1">สถานที่ออกหน่วยเคลื่อนที่</div>
                                                        <div className="text-xs font-medium text-slate-700">{evt.location || '-'}</div>
                                                    </div>

                                                    {(evt.lat || evt.lng) && (
                                                        <div className="bg-sky-50/50 p-2 rounded-lg border border-sky-100">
                                                            <div className="text-[10px] font-bold text-sky-500 mb-0.5 flex items-center gap-1">พิกัด GPS</div>
                                                            <div className="text-xs font-mono text-slate-600">{evt.lat}, {evt.lng}</div>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        <div className="bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                                                            <div className="text-[10px] font-bold text-indigo-400 mb-0.5 flex items-center gap-1">สัตว์แพทย์ผู้นำทีม</div>
                                                            <div className="text-xs font-bold text-indigo-900">{evt.team || '-'}</div>
                                                        </div>
                                                        
                                                        {(controllerName || phoneNum) && (
                                                            <div className="bg-rose-50/30 p-2 rounded-lg border border-rose-100">
                                                                <div className="text-[10px] font-bold text-rose-400 mb-0.5 flex items-center gap-1">ผู้ควบคุมและประสานงาน</div>
                                                                <div className="text-xs font-bold text-rose-900">{controllerName || '-'}</div>
                                                                {phoneNum && (
                                                                    <div className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                                                                        <Phone className="w-3 h-3" /> {phoneNum}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {evt.services && evt.services.length > 0 && (
                                                        <div className="mt-1">
                                                            <div className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">🩺 บริการ</div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {evt.services.map((srv, i) => (
                                                                    <span key={i} className="px-2 py-0.5 rounded-md border border-amber-200 text-amber-700 bg-amber-50/50 text-[10px] font-bold">
                                                                        {srv}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(evt.details || evt.description) && (
                                                        <div className="bg-amber-50/30 p-2.5 rounded-lg border border-amber-100 mt-1">
                                                            <div className="text-[10px] font-bold text-amber-500 mb-1 flex items-center gap-1">📋 รายละเอียด</div>
                                                            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                                {evt.details || evt.description}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col mt-2">
                                {/* Header แกนเวลา (X-Axis) */}
                                <div className="flex border-b border-slate-200 bg-slate-50">
                                    <div className="w-32 shrink-0 border-r border-slate-200 p-3 flex items-center justify-center font-bold text-xs text-slate-500">
                                        ทีมปฏิบัติการ
                                    </div>
                                    <div className="flex-1 relative flex">
                                        {Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }).map((_, i) => (
                                            <div key={i} className="flex-1 border-l border-slate-200/50 relative h-10 first:border-l-0">
                                                <span className="absolute -left-3 top-2 text-[10px] font-bold text-slate-400 bg-slate-50 px-1">
                                                    {String(TIMELINE_START_HOUR + i).padStart(2, '0')}:00
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Body จำแนกตามทีม (Y-Axis) */}
                                <div className="overflow-y-auto custom-scrollbar flex-1 relative">
                                    {Object.entries(eventsByTeam).length === 0 ? (
                                        <div className="p-10 text-center text-slate-400 text-sm font-medium">ไม่มีตารางงานในวันนี้</div>
                                    ) : (
                                        Object.entries(eventsByTeam).map(([team, teamEvents], index) => {
                                            const firstEvent = teamEvents[0] || {};
                                            const unitName = firstEvent.unit || firstEvent.unitName || firstEvent.title || 'ไม่ระบุหน่วย';

                                            return (
                                                <div key={team} className="flex border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                                    
                                                    {/* แกน Y (ชื่อทีม) */}
                                                    <div className="w-32 shrink-0 border-r border-slate-200 p-3 flex flex-col justify-center bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                                        <span className="text-[11px] font-extrabold text-indigo-600 mb-0.5 truncate" title={unitName}>
                                                            {unitName}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-700 truncate" title={team}>{team}</span>
                                                        <span className="text-[10px] text-slate-400 mt-0.5">{teamEvents.length} งาน</span>
                                                    </div>
                                                    
                                                    {/* เลนเวลา (Time Lane) */}
                                                    <div className="flex-1 relative min-h-[60px] py-2">
                                                        {toLocalISOString(selectedDate) === toLocalISOString(new Date()) && (
                                                            <TimelineCurrentTimeLine startHour={TIMELINE_START_HOUR} endHour={TIMELINE_END_HOUR} />
                                                        )}

                                                        {/* เส้น Grid บางๆ */}
                                                        <div className="absolute inset-0 flex pointer-events-none">
                                                            {Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR }).map((_, i) => (
                                                                <div key={i} className="flex-1 border-l border-slate-100"></div>
                                                            ))}
                                                        </div>

                                                        {/* แท่งงาน (Timeline Blocks) */}
                                                        {teamEvents.map((evt, idx) => {
                                                            const { left, width } = getTimelineStyle(evt.time, evt.closingTime);
                                                            const styles = getEventStyles(evt);
                                                            
                                                            return (
                                                                <div 
                                                                    key={idx}
                                                                    onClick={() => openDispatchEvent(evt)} 
                                                                    className={`absolute top-2 bottom-2 rounded-lg border shadow-sm cursor-pointer overflow-hidden transition-all hover:scale-[1.02] hover:shadow-md hover:z-20 ${styles.bg} ${styles.border} border-l-[4px] opacity-90 hover:opacity-100 flex flex-col justify-center px-2 min-w-[20px]`}
                                                                    style={{ left, width }}
                                                                >
                                                                    <div className={`text-[10px] font-bold truncate flex items-center gap-1 ${styles.text}`}>
                                                                        {evt.time} - {evt.title || 'ออกหน่วย'}
                                                                    </div>
                                                                    {parseFloat(width) > 10 && ( 
                                                                        <div className="text-[9px] text-slate-500 truncate mt-0.5 font-medium">
                                                                            {evt.location}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />

            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} apiBaseUrl={BASE_URL} onToast={addToast} />

            <DispatchModal 
                isOpen={isDispatchModalOpen} 
                onClose={() => setIsDispatchModalOpen(false)} 
                onToast={addToast} 
                onSave={handleSaveDispatchEvent} 
                onDelete={handleDeleteDispatch} 
                initialData={viewingDispatch}
                savedStaffList={savedStaffList} 
                allEvents={events} 
                playSound={playSound}
            />

            <AnnouncementModal 
                isOpen={isAnnouncementModalOpen} 
                onClose={() => setIsAnnouncementModalOpen(false)} 
                initialAnnouncements={announcements}
                onSave={handleSaveAnnouncements}
            />
            
            {isAddControllerOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h3 className="text-base font-bold text-slate-800">จัดการรายชื่อผู้ควบคุม</h3>
                            <button onClick={() => setIsAddControllerOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="space-y-3 shrink-0 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-2 mb-1">
                                <UserPlus className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs font-bold text-indigo-700">{editingControllerIndex !== null ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <input type="text" className="w-full p-2.5 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none rounded-lg text-xs bg-white" value={controllerNameInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setControllerNameInput(e.target.value)} placeholder="ชื่อ-นามสกุล..." />
                                </div>
                                <div className="col-span-2">
                                    <input type="text" className="w-full p-2.5 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none rounded-lg text-xs bg-white" value={controllerPhoneInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setControllerPhoneInput(e.target.value)} placeholder="เบอร์โทร (เช่น 08X-XXX-XXXX)" />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-1">
                                {editingControllerIndex !== null && (
                                    <button onClick={() => { setControllerNameInput(''); setControllerPhoneInput(''); setEditingControllerIndex(null); }} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold text-[11px] transition-colors shadow-sm">ยกเลิกแก้ไข</button>
                                )}
                                <button onClick={handleSaveController} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition-colors flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5"/> {editingControllerIndex !== null ? 'บันทึกการแก้ไข' : 'เพิ่มรายชื่อ'}
                                </button>
                            </div>
                        </div>

                        <div className="mt-5 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[150px]">
                            <h4 className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider">รายชื่อที่บันทึกไว้ ({savedControllersList.length})</h4>
                            {savedControllersList.length === 0 ? (
                                <div className="text-center text-slate-400 text-xs py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">ยังไม่มีข้อมูลในระบบ</div>
                            ) : (
                                <div className="space-y-2">
                                    {savedControllersList.map((item, idx) => (
                                        <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${editingControllerIndex === idx ? 'border-indigo-300 bg-indigo-50/70 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                                            <div>
                                                <div className="text-xs font-bold text-slate-700">{item.name}</div>
                                                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5"><Phone className="w-3 h-3 text-slate-400"/> {item.phone || '-'}</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleEditController(idx)} className={`p-1.5 rounded-lg transition-colors ${editingControllerIndex === idx ? 'bg-indigo-100 text-indigo-600' : 'text-blue-500 hover:bg-blue-50'}`} title="แก้ไข">
                                                    <Edit3 className="w-4 h-4"/>
                                                </button>
                                                <button onClick={() => handleDeleteController(idx)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="ลบ">
                                                    <Trash2 className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isManageStaffOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h3 className="text-base font-bold text-slate-800">จัดการรายชื่อทีมงานทั้งหมด</h3>
                            <button onClick={() => setIsManageStaffOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="space-y-3 shrink-0 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-bold text-blue-700">{editingStaffIndex !== null ? 'แก้ไขรายชื่อ' : 'เพิ่มรายชื่อใหม่'}</span>
                            </div>
                            <div className="flex flex-col gap-3">
                                <input type="text" className="w-full p-2.5 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none rounded-lg text-xs bg-white" value={staffNameInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStaffNameInput(e.target.value)} placeholder="พิมพ์ชื่อ-นามสกุล..." />
                                
                                {/* ✨ ส่วนที่เพิ่ม: Radio Buttons สำหรับเลือกประเภท */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 px-1">
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                                            <input type="radio" name="staffRole" value="vet" checked={staffRoleInput === 'vet'} onChange={() => setStaffRoleInput('vet')} className="accent-blue-600 w-3.5 h-3.5" />
                                            สัตวแพทย์
                                        </label>
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                                            <input type="radio" name="staffRole" value="general" checked={staffRoleInput === 'general'} onChange={() => setStaffRoleInput('general')} className="accent-blue-600 w-3.5 h-3.5" />
                                            บุคลากรทั่วไป
                                        </label>
                                    </div>
                                    <button onClick={handleSaveStaff} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition-colors flex items-center gap-1.5 shrink-0">
                                        <Plus className="w-3.5 h-3.5"/> {editingStaffIndex !== null ? 'บันทึก' : 'เพิ่ม'}
                                    </button>
                                </div>
                            </div>

                            {editingStaffIndex !== null && (
                                <div className="flex justify-end mt-1">
                                    <button onClick={() => { setStaffNameInput(''); setStaffRoleInput('general'); setEditingStaffIndex(null); }} className="text-[10px] text-slate-500 hover:text-slate-700 underline">ยกเลิกการแก้ไข</button>
                                </div>
                            )}
                        </div>

                        {/* ✨ ส่วนที่แก้ไข: แบ่งกลุ่มแสดงผล สัตวแพทย์ และ บุคลากรทั่วไป */}
                        <div className="mt-5 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[150px]">
                            <h4 className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider">รายชื่อในระบบ ({savedStaffList.length})</h4>
                            {savedStaffList.length === 0 ? (
                                <div className="text-center text-slate-400 text-xs py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">ยังไม่มีรายชื่อทีมงาน</div>
                            ) : (
                                <div className="space-y-4">
                                    {/* กลุ่มสัตวแพทย์ */}
                                    {savedStaffList.some(s => s.role === 'vet') && (
                                        <div>
                                            <div className="text-[11px] font-bold text-indigo-600 mb-2 flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> สัตวแพทย์
                                            </div>
                                            <div className="space-y-2">
                                                {savedStaffList.map((item, idx) => {
                                                    if (item.role !== 'vet') return null;
                                                    return (
                                                        <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${editingStaffIndex === idx ? 'border-blue-300 bg-blue-50/70 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                                                            <div className="text-xs font-bold text-slate-700">{item.name}</div>
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => { setStaffNameInput(item.name); setStaffRoleInput(item.role || 'vet'); setEditingStaffIndex(idx); }} className={`p-1.5 rounded-lg transition-colors ${editingStaffIndex === idx ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100 hover:text-blue-500'}`} title="แก้ไข"><Edit3 className="w-4 h-4"/></button>
                                                                <button onClick={() => handleDeleteStaff(idx)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="ลบ"><Trash2 className="w-4 h-4"/></button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* กลุ่มบุคลากรทั่วไป */}
                                    {savedStaffList.some(s => s.role !== 'vet') && (
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> บุคลากรทั่วไป
                                            </div>
                                            <div className="space-y-2">
                                                {savedStaffList.map((item, idx) => {
                                                    if (item.role === 'vet') return null;
                                                    return (
                                                        <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${editingStaffIndex === idx ? 'border-blue-300 bg-blue-50/70 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                                                            <div className="text-xs font-bold text-slate-700">{item.name}</div>
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => { setStaffNameInput(item.name); setStaffRoleInput(item.role || 'general'); setEditingStaffIndex(idx); }} className={`p-1.5 rounded-lg transition-colors ${editingStaffIndex === idx ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100 hover:text-blue-500'}`} title="แก้ไข"><Edit3 className="w-4 h-4"/></button>
                                                                <button onClick={() => handleDeleteStaff(idx)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="ลบ"><Trash2 className="w-4 h-4"/></button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {contextMenu.visible && contextMenu.event && (
                <div
                    className="fixed z-[99999] bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            setExpandedEventId(contextMenu.uniqueId);
                            setContextMenu({ ...contextMenu, visible: false });
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                        <ChevronDown className="w-4 h-4 text-slate-400" /> ดูรายละเอียด
                    </button>
                    
                    {canEdit && (
                        <>
                            <div className="h-px bg-slate-100 my-1 w-full"></div>
                            <button
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation();
                                    if(contextMenu.event) openDispatchEvent(contextMenu.event);
                                    setContextMenu({ ...contextMenu, visible: false });
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors"
                            >
                                <Edit3 className="w-4 h-4 text-indigo-400" /> แก้ไขข้อมูล
                            </button>
                            <button
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation();
                                    handleDeleteDispatch(contextMenu.event?._id);
                                    setContextMenu({ ...contextMenu, visible: false });
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                            >
                                <Trash2 className="w-4 h-4 text-rose-400" /> ลบรายการ
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default DispatchCalendarDashboard;