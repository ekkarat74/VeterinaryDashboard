import React, { useState, useEffect, useMemo, useRef, useDeferredValue, useCallback } from 'react';
import { 
    CalendarDays, X, Plus, Clock, Users, CheckCircle, ChevronLeft, ChevronRight, Calendar, Search, Phone, MapPin,
    Unlock, LogOut, Megaphone, Edit3, ChevronUp, ChevronDown, Trash2, Save, UserPlus,
    Volume2, VolumeX, FileText, LayoutDashboard, Activity, Truck, Settings, Bell, MoreHorizontal, Menu, FileDown, Table, Columns,
} from 'lucide-react';

import DispatchModal from './modals/DispatchModal'; 
import LoginModal from './modals/LoginModal';
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
    lat?: number | string | null;
    lng?: number | string | null;
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
    staff?: any;
    originalData?: Record<string, unknown>;
    unit?: string;
    unitName?: string;
    [key: string]: any;
}

export interface Announcement {
    id: number;
    icon: string;
    text: string;
    isActive: boolean;
}

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
    trend?: string;
}

const StatCard: React.FC<StatCardProps> = React.memo(({ label, value, colorClass, bgClass, icon: Icon, trend }) => (
    <div className="bg-white p-3 lg:p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bgClass} shrink-0`}>
                {Icon && <Icon className={`w-4 h-4 ${colorClass}`} />}
            </div>
            <div className="text-slate-500 text-[10px] font-bold">{label}</div>
        </div>
        <div className="flex items-end justify-between mt-0.5">
            <div className={`text-xl lg:text-2xl font-black tracking-tight ${colorClass} leading-none pl-1`}>{value}</div>
            {trend && (
                <div className="text-[8px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md mb-0.5">
                    {trend}
                </div>
            )}
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
    if (evt.type === 'meeting') return { border: 'border-teal-400', bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-400' };
    
    const colorMap: Record<string, EventStyle> = {
        'bg-red-500': { border: 'border-rose-400', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-400' },
        'bg-blue-500': { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
        'bg-green-500': { border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
        'bg-yellow-400': { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
        'bg-purple-500': { border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
        'bg-orange-500': { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
        'bg-pink-500': { border: 'border-pink-400', bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-400' },
        'bg-slate-400': { border: 'border-slate-400', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
        'default': { border: 'border-indigo-400', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-400' }
    };
    return colorMap[evt.unitColor || ''] || colorMap['default'];
};

const getDispatchStatus = (evt: EventData): { text: string, badge: string, icon?: React.ElementType } | null => {
    if (!evt || !evt.date || !evt.time) return null;
    if (evt.status === 'cancelled') return { text: 'ยกเลิก', badge: 'bg-rose-100 text-rose-700 border-rose-200', icon: X };
    if (evt.status === 'postponed') return { text: 'เลื่อน', badge: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock };
    if (evt.status === 'completed') return { text: 'เสร็จสิ้น (Manual)', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle };

    const closeTime = evt.closingTime || '16:00'; 
    const now = new Date();
    const start = new Date(`${evt.date}T${evt.time}:00`);
    const end = new Date(`${evt.date}T${closeTime}:00`);
    const thirtyMins = 30 * 60 * 1000; 

    if (now < new Date(start.getTime() - thirtyMins)) return { text: 'รอปฏิบัติงาน', badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock };
    else if (now >= new Date(start.getTime() - thirtyMins) && now < start) return { text: 'เตรียมพร้อม', badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: Activity };
    else if (now >= start && now < new Date(end.getTime() - thirtyMins)) return { text: 'กำลังดำเนินงาน', badge: 'bg-blue-100 text-blue-700 border-blue-200', icon: Activity };
    else return { text: 'สิ้นสุดปฏิบัติงาน', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle };
};

const getBaseType = (title?: string, type?: string): string => {
    let t = title || (type === 'meeting' ? 'นัดหมายประชุม' : 'ออกหน่วย');
    if (t === 'นัดหมายประชุม') return t;
    t = t.replace(/\s*\(.*?\)/g, '');
    t = t.replace(/\s+(ทีม|สาย)?\s*[A-Za-zก-ฮ0-9]$/i, '');
    return t.trim() || 'ออกหน่วย';
};

const calculateDuration = (start?: string, end?: string) => {
    if (!start) return 'ไม่ระบุเวลา';
    const endTime = end || '12:00';
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    let totalMins = (eH * 60 + eM) - (sH * 60 + sM);
    if (totalMins < 0) totalMins = 0;
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hours > 0 ? `${hours} ชม. ` : ''}${mins > 0 ? `${mins} นาที` : ''}`.trim() || 'ไม่ระบุ';
};

const RealTimeClock: React.FC = React.memo(() => {
    const [realTime, setRealTime] = useState<Date>(new Date());
    useEffect(() => {
        const timer = setInterval(() => setRealTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-700 text-[10px] font-bold shadow-sm">
            <Clock className="w-4 h-4 text-indigo-500" />
            {realTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.
        </div>
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
        const timer = setInterval(updatePosition, 60000);
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

    if (activeAnnouncements.length === 0 && !canEdit) return null;

    const safeIndex = currentIndex >= activeAnnouncements.length ? 0 : currentIndex;
    const currentItem = activeAnnouncements[safeIndex];

    return (
        <div className="bg-[#2D1B6B] text-white flex items-center px-4 text-[10px] relative z-40 shadow-md shrink-0 w-full h-11 overflow-hidden">
            <div className="bg-[#6B4BFA] text-white px-3 py-1 rounded-full font-bold text-[8px] mr-3 shrink-0 z-10 flex items-center gap-2 shadow-sm">
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
                            <h2 className="text-xs font-bold text-slate-800">แก้ไขข้อความแถบเลื่อน</h2>
                            <p className="text-[9px] text-slate-500">จัดการข้อความประชาสัมพันธ์ด้านบน</p>
                        </div>
                    </div>
                    <button onClick={() => { playSound('pop'); onClose(); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-slate-600">รายการข้อความ ({items.length})</span>
                    </div>
                    
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className={`flex items-center gap-2 p-3 bg-white border ${item.isActive ? 'border-purple-100 shadow-sm' : 'border-slate-200 opacity-60'} rounded-xl transition-all`}>
                                <div className="flex flex-col text-slate-300 hover:text-slate-500 cursor-grab px-1">
                                    <ChevronUp className="w-4 h-4 -mb-1" />
                                    <ChevronDown className="w-4 h-4 -mt-1" />
                                </div>
                                <input type="text" value={item.icon} onChange={(e) => handleChangeIcon(item.id, e.target.value)} className="w-8 text-center bg-slate-50 border border-slate-200 rounded-md py-1 text-[10px] outline-none focus:border-purple-400" />
                                <input type="text" value={item.text} onChange={(e) => handleChangeText(item.id, e.target.value)} className="flex-1 bg-transparent border-none text-[10px] text-slate-700 outline-none placeholder-slate-400 focus:ring-0" placeholder="พิมพ์ข้อความ..." />
                                <div className="flex items-center gap-2 ml-2">
                                    <button onClick={() => handleToggle(item.id)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.isActive ? 'bg-[#6B4BFA]' : 'bg-slate-200'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100 bg-white"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button onClick={handleAdd} className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 hover:text-[#6B4BFA] hover:border-[#6B4BFA] hover:bg-purple-50 transition-colors flex justify-center items-center gap-2">
                        <Plus className="w-4 h-4" /> เพิ่มข้อความใหม่
                    </button>
                </div>

                <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 shrink-0">
                    <button onClick={() => { playSound('pop'); onClose(); }} className="py-2.5 rounded-xl font-bold text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">ยกเลิก</button>
                    <button onClick={() => { playSound('success'); onSave(items); onClose(); }} className="py-2.5 rounded-xl font-bold text-[10px] text-white bg-[#6B4BFA] hover:bg-[#5A3EE0] shadow-md shadow-purple-200 flex justify-center items-center gap-2 transition-colors"><Save className="w-4 h-4"/> บันทึกทั้งหมด</button>
                </div>
            </div>
        </div>
    );
};

const ActivityPage: React.FC<{ events: EventData[] }> = ({ events }) => {
    const [view, setView] = useState<'table' | 'kanban'>('table');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('ทั้งหมด');
    const [filterTeam, setFilterTeam] = useState('ทั้งหมด');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredEvents = useMemo(() => {
        return events.filter(e => {
            const matchesSearch = !searchTerm || e.location?.toLowerCase().includes(searchTerm.toLowerCase()) || e.title?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDistrict = filterDistrict === 'ทั้งหมด' || e.district === filterDistrict;
            const matchesTeam = filterTeam === 'ทั้งหมด' || e.team === filterTeam;
            const matchesDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
            return matchesSearch && matchesDistrict && matchesTeam && matchesDate;
        });
    }, [events, searchTerm, filterDistrict, filterTeam, startDate, endDate]);

    // คำนวณ Stats
    const stats = useMemo(() => ({
        total: filteredEvents.length,
        completed: filteredEvents.filter(e => e.status === 'completed').length,
        pending: filteredEvents.filter(e => !e.status || e.status === 'เตรียมพร้อม').length,
        cancelled: filteredEvents.filter(e => e.status === 'cancelled').length
    }), [filteredEvents]);

    const districts = useMemo(() => ['ทั้งหมด', ...Array.from(new Set(events.map(e => e.district).filter(Boolean)))], [events]);
    const teams = useMemo(() => ['ทั้งหมด', ...Array.from(new Set(events.map(e => e.team).filter(Boolean)))], [events]);

    const exportToCSV = () => {
        const headers = ["วันที่", "ชื่อกิจกรรม", "สถานที่", "เขต", "ทีม", "สถานะ"];
        const rows = filteredEvents.map(e => [e.date, e.title, e.location, e.district, e.team, e.status]);
        const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `report_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-in fade-in duration-300">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[ {label: 'ทั้งหมด', val: stats.total, color: 'text-indigo-600'}, {label: 'เสร็จสิ้น', val: stats.completed, color: 'text-emerald-600'}, {label: 'รอดำเนินการ', val: stats.pending, color: 'text-amber-600'}, {label: 'ยกเลิก', val: stats.cancelled, color: 'text-rose-600'} ].map((s, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-[8px] font-bold text-slate-500 uppercase">{s.label}</div>
                        <div className={`text-lg font-black ${s.color}`}>{s.val} <span className="text-[10px]">งาน</span></div>
                    </div>
                ))}
            </div>

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-black text-slate-800">จัดการข้อมูลกิจกรรม</h2>
                    <p className="text-[10px] text-slate-500 font-medium">จัดการกรองข้อมูลและส่งออกรายงาน</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={exportToCSV} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] flex items-center gap-2 shadow-sm transition-colors">
                        <FileDown className="w-4 h-4"/> Export CSV
                    </button>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setView('table')} className={`p-2 rounded-lg ${view === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}><Table className="w-4 h-4"/></button>
                        <button onClick={() => setView('kanban')} className={`p-2 rounded-lg ${view === 'kanban' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}><Columns className="w-4 h-4"/></button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <input type="text" placeholder="ค้นหา..." className="col-span-2 md:col-span-1 p-2.5 bg-slate-50 rounded-xl text-[10px] border border-slate-200" onChange={(e) => setSearchTerm(e.target.value)} />
                <select className="p-2.5 bg-slate-50 rounded-xl text-[10px] border border-slate-200" onChange={(e) => setFilterDistrict(e.target.value)}>{districts.map(d => <option key={d}>{d}</option>)}</select>
                <select className="p-2.5 bg-slate-50 rounded-xl text-[10px] border border-slate-200" onChange={(e) => setFilterTeam(e.target.value)}>{teams.map(t => <option key={t}>{t}</option>)}</select>
                <input type="date" className="p-2.5 bg-slate-50 rounded-xl text-[10px] border border-slate-200" onChange={(e) => setStartDate(e.target.value)} />
                <input type="date" className="p-2.5 bg-slate-50 rounded-xl text-[10px] border border-slate-200" onChange={(e) => setEndDate(e.target.value)} />
            </div>

            {/* Views */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                {view === 'table' ? (
                    <table className="w-full text-[10px] text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                            <tr><th className="p-3">วันที่</th><th className="p-3">กิจกรรม</th><th className="p-3">สถานที่</th><th className="p-3">ทีม</th><th className="p-3">สถานะ</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredEvents.map((e, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-3 font-mono">{e.date}</td>
                                    <td className="p-3 font-bold text-slate-800">{e.title}</td>
                                    <td className="p-3">{e.location}</td>
                                    <td className="p-3">{e.team || '-'}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-md font-bold text-[8px] ${e.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : e.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                                            {e.status || 'เตรียมพร้อม'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex gap-4 min-w-[800px] h-full">
                        {['เตรียมพร้อม', 'กำลังดำเนินงาน', 'เสร็จสิ้น', 'ยกเลิก'].map(status => (
                            <div key={status} className="flex-1 bg-slate-50 rounded-2xl p-3 flex flex-col gap-3">
                                <h4 className="font-bold text-slate-700 text-[10px] px-1">{status}</h4>
                                {filteredEvents.filter(e => (status === 'เตรียมพร้อม' ? !e.status || e.status === 'เตรียมพร้อม' : e.status === status)).map((e, i) => (
                                    <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-[10px]">
                                        <p className="font-bold mb-1">{e.title}</p>
                                        <p className="text-slate-500 text-[8px]">{e.location}</p>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
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
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const [selectedType, setSelectedType] = useState<string>('ทุกประเภท');

    const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const [activeMenu, setActiveMenu] = useState<'dashboard' | 'calendar' | 'activities'>('dashboard');

    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(0.3); 
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'); 
            audioRef.current.loop = true;
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(e => console.log('Autoplay prevented:', e));
        }
        audioRef.current.volume = volume;
    }, [volume]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play().catch(e => console.log('Autoplay prevented:', e));
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
            const matchSearch = !deferredSearchTerm || 
                e.location?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) || 
                e.title?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
                e.team?.toLowerCase().includes(deferredSearchTerm.toLowerCase());
        
            const baseType = getBaseType(e.title, e.type);
            const matchType = selectedType === 'ทุกประเภท' || baseType === selectedType;
            return matchSearch && matchType;
        });
    }, [events, deferredSearchTerm, selectedType]);

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
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
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
        if (!controllerNameInput.trim()) { addToast('error', 'กรุณาระบุชื่อผู้ควบคุม'); return; }

        const payload = { name: controllerNameInput.trim(), phone: controllerPhoneInput.trim() };
        const isEditing = editingControllerIndex !== null;
        const url = isEditing ? `${BASE_URL}/api/controllers/${savedControllersList[editingControllerIndex]._id}` : `${BASE_URL}/api/controllers`;

        try {
            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
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
                        setControllerNameInput(''); setControllerPhoneInput(''); setEditingControllerIndex(null);
                    } else if (editingControllerIndex !== null && editingControllerIndex > index) {
                        setEditingControllerIndex(editingControllerIndex - 1);
                    }
                }
            } catch (error) { addToast('error', 'ไม่สามารถลบข้อมูลได้'); }
        }
    };

    const handleSaveStaff = async () => {
        if (!staffNameInput.trim()) { addToast('error', 'กรุณาระบุชื่อทีมงาน'); return; }

        const payload = { name: staffNameInput.trim(), role: staffRoleInput };
        const isEditing = editingStaffIndex !== null;
        const url = isEditing ? `${BASE_URL}/api/staffs/${savedStaffList[editingStaffIndex]._id}` : `${BASE_URL}/api/staffs`;

        try {
            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                playSound('success');
                addToast('success', isEditing ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มรายชื่อสำเร็จ');
                fetchSavedStaffs(); 
                setStaffNameInput('');
                setEditingStaffIndex(null);
            }
        } catch (error) { addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล'); }
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
            } catch (error) { addToast('error', 'ไม่สามารถลบข้อมูลได้'); }
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
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };
    const removeToast = (id: number | string) => setToasts(prev => prev.filter(t => t.id !== id));

    useEffect(() => {
        const storedUser = localStorage.getItem('vet_user');
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);
    
    const canEdit = user && ['Developer', 'MagaAdmin', 'admin'].includes(user.role);
    const canViewHidden = user && ['Developer', 'MagaAdmin', 'admin', 'executive'].includes(user.role);

    const getCurrentToken = useCallback(() => {
        try {
            const storedUser = localStorage.getItem('vet_user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                return parsed?.token || user?.token || '';
            }
        } catch (e) { console.error('Error parsing token', e); }
        return user?.token || '';
    }, [user?.token]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = getCurrentToken();
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const [res, reportsRes] = await Promise.all([
                    fetch(`${BASE_URL}/api/dispatches`, { headers }),
                    fetch(`${BASE_URL}/api/reports?limit=5000`, { headers })
                ]);
                
                if (res.ok) {
                    const data: EventData[] = await res.json();
                    const filtered = canViewHidden ? data : data.filter(d => d.isVisibleToPublic !== false);
                    setEvents(filtered.map(d => ({ ...d, type: 'dispatch', originalData: d })));
                } else if (res.status === 401 || res.status === 403) {
                    addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
                    setUser(null);
                    localStorage.removeItem('vet_user');
                    setIsLoginModalOpen(true);
                }

                if (reportsRes.ok) {
                    const rData = await reportsRes.json();
                    setReports(Array.isArray(rData) ? rData : (rData.data || []));
                }
            } catch (error) { console.error("Fetch Data Error", error); }
        };
        fetchData();
    }, [canViewHidden, BASE_URL, setUser, getCurrentToken]);

    const scrollToForm = () => {
        setTimeout(() => {
            if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const openDispatchForm = () => { 
        playSound('pop'); setViewingDispatch(null); setIsDispatchModalOpen(true); scrollToForm(); 
    };
    
    const openDispatchEvent = (evt: EventData) => { 
        if (canEdit) {
            setViewingDispatch((evt.originalData as EventData) || evt);
            setIsDispatchModalOpen(true); scrollToForm();
        }
    };

    const handleSaveDispatchEvent = async (payload: any, shouldClose = true) => {
        try {
            const isUpdate = !Array.isArray(payload) && payload._id;
            const method = isUpdate ? 'PUT' : 'POST';
            const url = isUpdate ? `${BASE_URL}/api/dispatches/${payload._id}` : `${BASE_URL}/api/dispatches`;
            const token = getCurrentToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(url, { method: method, headers: headers, body: JSON.stringify(payload) });
            
            if (res.ok) {
                playSound('success');
                addToast('success', isUpdate ? 'แก้ไขแผนงานเรียบร้อย' : 'บันทึกแผนงานเรียบร้อย');
                if (shouldClose) setIsDispatchModalOpen(false);

                const fetchHeaders: Record<string, string> = {};
                if (token) fetchHeaders['Authorization'] = `Bearer ${token}`;
                const fetchRes = await fetch(`${BASE_URL}/api/dispatches`, { headers: fetchHeaders });
                
                if (fetchRes.ok) {
                    const data: EventData[] = await fetchRes.json();
                    const filtered = canViewHidden ? data : data.filter(d => d.isVisibleToPublic !== false);
                    setEvents(filtered.map(d => ({ ...d, type: 'dispatch', originalData: d })));
                }
                return true;
            } else if (res.status === 401 || res.status === 403) {
                addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์");
                setUser(null); localStorage.removeItem('vet_user'); setIsLoginModalOpen(true);
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
            } else { addToast('error', 'ลบไม่สำเร็จ'); }
        } catch (error) { addToast('error', 'ลบไม่สำเร็จ'); }
    };

    const [dragOverDate, setDragOverDate] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, eventId?: string) => {
        if (!canEdit || !eventId) { e.preventDefault(); return; }
        e.dataTransfer.setData('eventId', eventId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, dateStr: string) => {
        e.preventDefault(); 
        if (canEdit && dragOverDate !== dateStr) setDragOverDate(dateStr);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragOverDate(null); };

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
        
        if (!window.confirm(`ยืนยันการเลื่อนงาน "${draggedEvent.title || 'ออกหน่วย'}" \nไปยังวันที่ ${formattedDate} หรือไม่?`)) return;

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
            } else {
                addToast('error', `ไม่สามารถย้ายได้`);
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
            const teamName = evt.team?.trim() || '';
            const unitName = evt.unit || evt.unitName || evt.title || 'ไม่ระบุหน่วย';
            const locationName = evt.location?.trim() || 'ไม่ระบุสถานที่';
            const groupKey = teamName ? `team|${teamName}|${locationName}` : `unit|${unitName}|${locationName}`;
            if (!grouped[groupKey]) grouped[groupKey] = [];
            grouped[groupKey].push(evt);
        });
        return grouped;
    }, [selectedDateEvents]);

    return (
        <div className="flex flex-col h-screen w-full bg-[#F5F6FA] overflow-hidden font-sans">
            <style>{`
                @keyframes slideLeft {
                    0% { transform: translateX(100%); opacity: 0; }
                    10% { transform: translateX(0); opacity: 1; }
                    90% { transform: translateX(0); opacity: 1; }
                    100% { transform: translateX(-100%); opacity: 0; }
                }
                .animate-slide-left { animation: slideLeft 8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
            `}</style>
            
            <AnnouncementBar announcements={announcements} onEditClick={() => setIsAnnouncementModalOpen(true)} canEdit={canEdit} />

            <div className="flex flex-1 overflow-hidden relative">
                {isSidebarOpen && (
        <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" 
            onClick={() => setIsSidebarOpen(false)} 
        />
    )}
                {/* ================= Sidebar (Left) ================= */}
                <aside className={`bg-[#312069] flex-col text-white transition-all duration-300 shadow-xl z-50 fixed inset-y-0 left-0 lg:relative ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:flex w-[260px] shrink-0`}>
                    <div className="p-6 flex items-center gap-3 border-b border-white/10 shrink-0">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-sm">
                            <Truck className="w-6 h-6 text-indigo-300" />
                        </div>
                        <div>
                            <h1 className="font-black tracking-wide text-xs leading-tight text-white/90">ปฏิทินออกหน่วยสัตวแพทย์เคลื่อนที่</h1>
                            <h2 className="text-[8px] text-indigo-300 font-bold uppercase tracking-wider">Mobile Veterinary Unit Calendar</h2>
                        </div>
                    </div>

                   <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
                        <button 
                            onClick={() => { playSound('switch'); setActiveMenu('dashboard'); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[10px] transition-all border ${activeMenu === 'dashboard' ? 'bg-[#44308a] text-white shadow-sm border-[#5a42b1]' : 'text-white/70 hover:bg-white/5 hover:text-white border-transparent'}`}>
                            <LayoutDashboard className={`w-4 h-4 ${activeMenu === 'dashboard' ? 'text-indigo-300' : ''}`} /> หน้าหลัก
                        </button>
                        <button 
                            onClick={() => { playSound('switch'); setActiveMenu('calendar'); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[10px] transition-all border ${activeMenu === 'calendar' ? 'bg-[#44308a] text-white shadow-sm border-[#5a42b1]' : 'text-white/70 hover:bg-white/5 hover:text-white border-transparent'}`}>
                            <CalendarDays className={`w-4 h-4 ${activeMenu === 'calendar' ? 'text-indigo-300' : ''}`} /> ปฏิทิน
                        </button>
                        <button 
                            onClick={() => { playSound('switch'); setActiveMenu('activities'); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[10px] transition-all border ${activeMenu === 'activities' ? 'bg-[#44308a] text-white shadow-sm border-[#5a42b1]' : 'text-white/70 hover:bg-white/5 hover:text-white border-transparent'}`}>
                            <Activity className={`w-4 h-4 ${activeMenu === 'activities' ? 'text-indigo-300' : ''}`} /> กิจกรรม
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white rounded-xl font-bold text-[10px] transition-all">
                            <Users className="w-4 h-4" /> หน่วยสัตวแพทย์
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white rounded-xl font-bold text-[10px] transition-all">
                            <FileText className="w-4 h-4" /> รายงาน
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white rounded-xl font-bold text-[10px] transition-all">
                            <Settings className="w-4 h-4" /> ตั้งค่า
                        </button>
                    </div>

                    <div className="p-4 shrink-0">
                        {/* Help Section */}
                        <div className="bg-[#44308a] rounded-2xl p-4 text-center border border-white/10 relative overflow-hidden">
                            <div className="flex justify-center gap-2 mb-3">
                                <div className="w-10 h-10 bg-[#5a42b1] rounded-full flex items-center justify-center text-lg shadow-sm">🐶</div>
                                <div className="w-8 h-8 bg-[#5a42b1] rounded-full flex items-center justify-center text-base mt-2 shadow-sm">🐱</div>
                            </div>
                            <h4 className="text-[9px] font-bold text-white/90 mb-1">ต้องการความช่วยเหลือ?</h4>
                            <button className="w-full py-2 bg-white text-[#312069] rounded-lg text-[8px] font-black shadow-sm hover:bg-slate-50 transition-colors">
                                ติดต่อเจ้าหน้าที่
                            </button>
                        </div>
                        <div className="text-[7px] text-white/40 text-center mt-4 mb-2">
                            © {new Date().getFullYear()} สำนักงานสัตวแพทย์สาธารณสุข สำนักอนามัย กรุงเทพมหานคร
                        </div>
                    </div>
                </aside>

                {/* ================= Main Content (Right) ================= */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    
                    {/* Topbar */}
                    <header className="h-[76px] bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300">
                        <div className="flex items-center gap-3 sm:gap-4">
        
                            {/* ปุ่มเปิด-ปิด Sidebar ที่อยู่ใน Header */}
                            <button 
                                onClick={() => { playSound('switch'); setIsSidebarOpen(!isSidebarOpen); }}
                                className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors block"
                                title={isSidebarOpen ? "ซ่อนเมนู" : "แสดงเมนู"}
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                                    สวัสดี, {user ? user.username : 'ผู้เยี่ยมชม'} 👋
                                </h2>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">ยินดีต้อนรับสู่ระบบปฏิทินออกหน่วยสัตวแพทย์เคลื่อนที่</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <RealTimeClock />
                            
                            <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-100 px-2 py-1.5 rounded-full shadow-sm">
                                <button
                                    onClick={togglePlay}
                                    className={`p-1.5 rounded-full transition-colors ${isPlaying ? 'text-indigo-600 bg-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
                                    title={isPlaying ? "ปิดเสียง" : "เปิดเสียง"}
                                >
                                    {isPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                </button>
                                {isPlaying && (
                                    <input
                                        type="range" min="0" max="1" step="0.05" value={volume} onChange={handleVolumeChange}
                                        className="w-16 sm:w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                )}
                            </div>

                            <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>

                            {/* ========================================================= */}
                            {/* ย้ายปุ่ม Admin Action Buttons มาไว้ตรงนี้ (ข้างๆ ข้อมูล User) */}
                            {/* ========================================================= */}
                            {canEdit && (
                                <div className="hidden xl:flex items-center gap-2 mr-2">
                                    <button onClick={() => { playSound('pop'); setIsAddControllerOpen(true); }} className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-bold transition-all text-[10px] shadow-sm flex items-center gap-1.5 border border-emerald-200">
                                        <UserPlus className="w-3.5 h-3.5"/> เพิ่มผู้ควบคุม
                                    </button>
                                    <button onClick={() => { playSound('pop'); setIsManageStaffOpen(true); }} className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold transition-all text-[10px] shadow-sm flex items-center gap-1.5 border border-blue-200">
                                        <Users className="w-3.5 h-3.5"/> จัดการทีมงาน
                                    </button>
                                    <button onClick={() => { playSound('pop'); openDispatchForm(); }} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-[10px] shadow-sm flex items-center gap-1.5">
                                        <Plus className="w-3.5 h-3.5" /> เพิ่มงานใหม่
                                    </button>
                                </div>
                            )}

                            {user ? (
                                <div className="flex items-center gap-3 pl-2 cursor-pointer group">
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center overflow-hidden shadow-sm">
                                        <Users className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div className="hidden md:block">
                                        <div className="text-[10px] font-bold text-slate-700 leading-tight">{user.username}</div>
                                        <div className="text-[8px] text-slate-400 font-medium">{user.role}</div>
                                    </div>
                                    <button onClick={handleLogout} className="ml-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setIsLoginModalOpen(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-[10px] shadow-sm flex items-center gap-2">
                                    <Unlock className="w-4 h-4"/> เข้าสู่ระบบ
                                </button>
                            )}
                        </div>
                    </header>

                    {/* Main Scrollable Area */}
                    <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 custom-scrollbar relative">
                        
                        {/* ===================== หน้าหลัก (Dashboard) ===================== */}
                        {activeMenu === 'dashboard' && (
                            <div className="animate-in fade-in duration-300">

                                {/* Stats Row */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
                                    <StatCard label="งานทั้งหมด" value={stats.total} trend="+12 จากสัปดาห์ที่แล้ว" colorClass="text-indigo-600" bgClass="bg-indigo-50" icon={CalendarDays} />
                                    <StatCard label="วันนี้" value={stats.today} trend="อัปเดตล่าสุด" colorClass="text-blue-500" bgClass="bg-blue-50" icon={Calendar} />
                                    <StatCard label="รอปฏิบัติ" value={stats.upcoming} trend="รอดำเนินการ" colorClass="text-amber-500" bgClass="bg-amber-50" icon={Clock} />
                                    <StatCard label="หน่วยให้บริการ" value={stats.publicCount} trend="ครอบคลุมพื้นที่" colorClass="text-emerald-500" bgClass="bg-emerald-50" icon={Users} />
                                </div>

                                {/* Layout 2 Columns (Calendar vs Event List) */}
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
                                    
                                    {/* Left Column: Calendar & Map Card */}
                                    <div className="xl:col-span-4 space-y-6">
                                        
                                        {/* Calendar Widget */}
                                        <div className="bg-white rounded-[1.5rem] p-4 lg:p-5 shadow-sm border border-slate-100">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-base font-black text-slate-800">
                                                    {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                                                </h3>
                                                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                                    <button onClick={() => { playSound('pop'); changeMonth(-1); }} className="p-1.5 hover:bg-white rounded-lg text-slate-500 shadow-sm transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                                                    <button onClick={() => { playSound('pop'); setCurrentDate(new Date()); }} className="px-3 py-1 text-[9px] font-bold text-indigo-600 hover:bg-white rounded-lg shadow-sm transition-colors">วันนี้</button>
                                                    <button onClick={() => { playSound('pop'); changeMonth(1); }} className="p-1.5 hover:bg-white rounded-lg text-slate-500 shadow-sm transition-colors"><ChevronRight className="w-4 h-4" /></button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-7 gap-1 mb-4">
                                                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d, i) => (
                                                    <div key={d} className={`text-center text-[8px] lg:text-[9px] font-bold pb-2 ${i===0 || i===6 ? 'text-rose-500' : 'text-slate-400'}`}>{d}</div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-7 auto-rows-[minmax(32px,1fr)] lg:auto-rows-[minmax(38px,1fr)] gap-1.5">
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
                                                            className={`relative rounded-2xl cursor-pointer flex flex-col items-center justify-center transition-all duration-200
                                                            ${isDragOver ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/50 scale-105 z-10' :
                                                              isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105 z-10' : 'bg-white hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}
                                                        >
                                                            <span className={`text-[10px] lg:text-xs font-bold ${isDragOver ? 'text-emerald-600' : isSelected ? 'text-white' : isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                                {dayNum}
                                                            </span>
                                                            {dotColors.length > 0 && (
                                                                <div className="absolute bottom-1.5 flex gap-0.5 justify-center w-full">
                                                                    {dotColors.slice(0, 3).map((dot, idx) => (<span key={idx} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : dot}`}></span>))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            
                                            {/* Legend */}
                                            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-slate-100">
                                                <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-bold"><div className="w-2 h-2 rounded-full bg-blue-500"></div> หน่วยวัคซีน+ไมโครชิป</div>
                                                <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-bold"><div className="w-2 h-2 rounded-full bg-rose-500"></div> หน่วยทำหมัน</div>
                                                <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-bold"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> หน่วยสัตว์แพทย์</div>
                                                <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-bold"><div className="w-2 h-2 rounded-full bg-orange-500"></div> หน่วยผู้ว่า</div>
                                                <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-bold"><div className="w-2 h-2 rounded-full bg-purple-500"></div> หน่วยกรงแมว</div>
                                            </div>
                                        </div>

                                        {/* Service Map Card */}
                                        <div className="bg-gradient-to-br from-[#F5F3FF] to-white rounded-3xl p-6 border border-indigo-50 shadow-sm flex items-center justify-between relative overflow-hidden">
                                            <div className="relative z-10">
                                                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-indigo-500 border border-indigo-100">
                                                    <MapPin className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-xs font-black text-slate-800 mb-1">ดูแผนที่ออกให้บริการ</h4>
                                                <p className="text-[8px] text-slate-500 font-medium mb-4 max-w-[120px] leading-relaxed">
                                                    ค้นหาหน่วยสัตวแพทย์ใกล้คุณบนแผนที่ออนไลน์
                                                </p>
                                                <button className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-[8px] font-bold shadow-sm border border-indigo-50 hover:bg-indigo-50 transition-colors flex items-center gap-1.5">
                                                    เปิดแผนที่ <ChevronRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-60 pointer-events-none">
                                                 <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-200 stroke-current" fill="none" strokeWidth="2">
                                                    <path d="M 20,80 Q 40,30 70,50 T 90,20" strokeDasharray="4 4" />
                                                    <circle cx="20" cy="80" r="4" fill="#6366F1" stroke="none" />
                                                    <circle cx="70" cy="50" r="4" fill="#10B981" stroke="none" />
                                                 </svg>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Right Column: Event List */}
                                    <div className="xl:col-span-8 flex flex-col gap-5">
                                        
                                        {/* Header & Controls */}
<div className="bg-white rounded-[1.5rem] p-4 lg:p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="text-base lg:text-lg font-black text-slate-800 tracking-tight">
                                                        {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                                                        มี {selectedDateEvents.length} กิจกรรม {selectedDateEvents.length > 0 && `(แสดง ${selectedDateEvents.length})`}
                                                    </p>
                                                </div>
                                                <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
                                                    <button onClick={() => { playSound('pop'); setViewMode('list'); }}
                                                        className={`px-5 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
                                                    >
                                                        <LayoutDashboard className="w-3.5 h-3.5" /> มุมมองรายการ
                                                    </button>
                                                    <button onClick={() => { playSound('pop'); setViewMode('timeline'); }}
                                                        className={`px-5 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'timeline' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
                                                    >
                                                        <Activity className="w-3.5 h-3.5" /> มุมมองไทม์ไลน์
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                                <div className="relative w-full flex-1">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input 
                                                        type="text" 
                                                        placeholder="ค้นหางาน โลเคชัน ทีม สถานที่..." 
                                                        value={searchTerm} 
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-[10px] font-medium text-slate-700 shadow-sm" 
                                                    />
                                                </div>
                                                <button className="w-full sm:w-auto px-4 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center">
                                                    <Settings className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Filter Chips */}
                                            <div className="flex flex-wrap gap-2">
                                                {eventTypes.map(([type, count]) => {
                                                    const isSelected = selectedType === type;
                                                    return (
                                                        <button 
                                                            key={type} 
                                                            onClick={() => { playSound('pop'); setSelectedType(type); }}
                                                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[9px] font-bold transition-all duration-200 shadow-sm border
                                                                ${isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-500/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                                                            `}
                                                        >
                                                            {type}
                                                            <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                {count}
                                                            </span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Event Cards (ViewMode = List) */}
                                        {viewMode === 'list' && (
                                            <div className="space-y-4 pb-10">
                                                {selectedDateEvents.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                            <CalendarDays className="w-8 h-8 text-slate-300" />
                                                        </div>
                                                        <span className="text-slate-600 font-bold text-[10px] mb-1">ไม่พบกิจกรรม</span>
                                                        <span className="text-slate-400 text-[8px] font-medium">ไม่มีกำหนดการในวันนี้ กรุณาเลือกวันอื่น</span>
                                                    </div>
                                                ) : (
                                                    selectedDateEvents.map((evt, idx) => {
                                                        const styles = getEventStyles(evt); 
                                                        const status = getDispatchStatus(evt);
                                                        const isRecorded = reports.some(r => r.date === evt.date && r.location === evt.location);
                                                        const duration = calculateDuration(evt.time, evt.closingTime);
                                                        const isExpanded = expandedEventId === (evt._id || idx);

                                                        return (
                                                            <div key={idx} 
                                                                draggable={canEdit || false}
                                                                onDragStart={(e) => handleDragStart(e, evt._id)}
                                                                onContextMenu={(e) => {
                                                                    e.preventDefault();
                                                                    const menuWidth = 180;
                                                                    const menuHeight = canEdit ? 120 : 50;
                                                                    let posX = e.clientX;
                                                                    let posY = e.clientY;
                                                                    if (posX + menuWidth > window.innerWidth) posX = window.innerWidth - menuWidth - 10;
                                                                    if (posY + menuHeight > window.innerHeight) posY = window.innerHeight - menuHeight - 10;
                                                                    setContextMenu({ visible: true, x: posX, y: posY, event: evt, uniqueId: evt._id || idx });
                                                                }}
                                                                className={`bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row overflow-hidden group hover:shadow-md transition-shadow ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                                            >
                                                                
                                                                {/* Color Bar Marker */}
                                                                <div className={`w-1.5 sm:w-2 shrink-0 ${styles.dot}`}></div>

                                                                <div className="flex-1 flex flex-col">
                                                                    {/* Card Content Row */}
                                                                    <div className="p-3 lg:p-4 flex flex-col md:flex-row md:items-center gap-3 lg:gap-4">
                                                                        {/* Col 1: Time & Duration */}
                                                                        <div className="w-full md:w-[130px] shrink-0 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start">
                                                                            <div className="text-[10px] font-black text-slate-800 tracking-tight">
                                                                                {evt.time} - {evt.closingTime || '12:00'}
                                                                            </div>
                                                                            <div className="text-[8px] text-slate-400 font-bold mt-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                                                {duration}
                                                                            </div>
                                                                        </div>

                                                                        {/* Col 2: Icon & Main Info */}
                                                                        <div className="flex-1 flex items-start gap-4">
                                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styles.bg}`}>
                                                                                <Activity className={`w-5 h-5 ${styles.text}`} />
                                                                            </div>
                                                                            <div className="flex flex-col gap-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md ${styles.bg} ${styles.text}`}>
                                                                                        {evt.title || 'หน่วยบริการ'}
                                                                                    </span>
                                                                                    {evt.isVisibleToPublic === false && !canEdit && (
                                                                                        <span className="text-[8px] px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                                                            ซ่อน
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <h4 className="text-[10px] font-black text-slate-800 leading-snug">
                                                                                    {evt.location || 'ไม่ระบุสถานที่'}
                                                                                </h4>
                                                                                <div className="text-[9px] font-bold text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                                                                                    <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-indigo-300"/> {evt.team || '-'}</span>
                                                                                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-indigo-300"/> {evt.controllerName || '-'}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Col 3: Actions & Status */}
                                                                        <div className="w-full md:w-auto shrink-0 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                                                                            <div className="flex flex-row md:flex-col gap-1.5 items-end">
                                                                                {status && (
                                                                                    <div className={`flex items-center gap-1.5 text-[8px] px-2.5 py-1 rounded-md font-bold border ${status.badge}`}>
                                                                                        {status.icon && <status.icon className="w-3 h-3" />} {status.text}
                                                                                    </div>
                                                                                )}
                                                                                {isRecorded ? (
                                                                                    <div className="flex items-center gap-1.5 text-[8px] px-2.5 py-1 rounded-md font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                                                                        <CheckCircle className="w-3 h-3" /> บันทึกผลแล้ว
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-1.5 text-[8px] px-2.5 py-1 rounded-md font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                                                                        <FileText className="w-3 h-3" /> ยังไม่บันทึก
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {canEdit && (
                                                                                    <button onClick={() => openDispatchEvent(evt)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100" title="แก้ไข">
                                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                )}
                                                                                <button 
                                                                                    onClick={() => setExpandedEventId(isExpanded ? null : (evt._id || idx))}
                                                                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-bold transition-colors flex items-center gap-1 ${isExpanded ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                                                                                >
                                                                                    {isExpanded ? 'ซ่อน' : 'ดูข้อมูล'} {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Expanded Details Section */}
                                                                    {isExpanded && (
                                                                        <div className="border-t border-dashed border-slate-200 p-4 lg:p-6 bg-slate-50/50 animate-in slide-in-from-top-2">
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                                                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                                                    <div className="text-[8px] font-bold text-slate-400 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-rose-400"/> เขต/พื้นที่</div>
                                                                                    <div className="text-[10px] font-bold text-slate-700">{evt.district || '-'}</div>
                                                                                </div>
                                                                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                                                    <div className="text-[8px] font-bold text-slate-400 mb-1 flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-400"/> เบอร์ติดต่อ</div>
                                                                                    <div className="text-[10px] font-bold text-slate-700">{evt.controllerPhone || '-'}</div>
                                                                                </div>
                                                                                <div className="md:col-span-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                                                    <div className="text-[8px] font-bold text-slate-400 mb-1">พิกัดแผนที่ (GPS)</div>
                                                                                    {evt.mapLink || (evt.lat && evt.lng) ? (
                                                                                        <a 
                                                                                            href={evt.mapLink || `https://www.google.com/maps/search/?api=1&query=${evt.lat},${evt.lng}`}
                                                                                            target="_blank" 
                                                                                            rel="noopener noreferrer" 
                                                                                            className="text-[10px] font-mono text-indigo-600 hover:underline break-all block"
                                                                                        >
                                                                                            {evt.lat && evt.lng ? `${evt.lat}, ${evt.lng}` : 'เปิดใน Google Maps'}
                                                                                        </a>
                                                                                    ) : (
                                                                                        <div className="text-[10px] font-mono text-slate-400">ไม่ระบุพิกัด</div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="sm:col-span-2 md:col-span-4 bg-amber-50/30 p-3.5 rounded-xl border border-amber-100">
                                                                                    <div className="text-[8px] font-bold text-amber-500 mb-1.5 flex items-center gap-1">📋 รายละเอียดเพิ่มเติม</div>
                                                                                    <div className="text-[10px] text-slate-700 leading-relaxed whitespace-pre-wrap">{evt.details || evt.description || '-'}</div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}

                                        {/* Timeline View */}
                                        {viewMode === 'timeline' && (
                                            <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col mb-10 min-h-[500px]">
                                                <div className="flex border-b border-slate-200 bg-slate-50">
                                                    <div className="w-32 shrink-0 border-r border-slate-200 p-3 flex items-center justify-center font-bold text-[10px] text-slate-500">
                                                        ทีมปฏิบัติการ
                                                    </div>
                                                    <div className="flex-1 relative flex">
                                                        {Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }).map((_, i) => (
                                                            <div key={i} className="flex-1 border-l border-slate-200/50 relative h-10 first:border-l-0">
                                                                <span className="absolute -left-3 top-2 text-[8px] font-bold text-slate-400 bg-slate-50 px-1">
                                                                    {String(TIMELINE_START_HOUR + i).padStart(2, '0')}:00
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="overflow-y-auto custom-scrollbar flex-1 relative">
                                                    {Object.entries(eventsByTeam).length === 0 ? (
                                                        <div className="p-10 text-center text-slate-400 text-[10px] font-medium flex flex-col items-center gap-3">
                                                            <CalendarDays className="w-10 h-10 text-slate-200" />
                                                            ไม่มีตารางงานในวันนี้
                                                        </div>
                                                    ) : (
                                                        Object.entries(eventsByTeam).map(([groupKey, teamEvents], index) => {
                                                            const firstEvent = teamEvents[0] || {};
                                                            const unitName = firstEvent.unit || firstEvent.unitName || firstEvent.title || 'ไม่ระบุหน่วย';
                                                            const teamName = firstEvent.team?.trim() || 'ไม่ได้ระบุทีม';
                                                            const locationName = firstEvent.location?.trim() || 'ไม่ระบุสถานที่';

                                                            return (
                                                                <div key={groupKey} className="flex border-b border-slate-100 hover:bg-slate-50/50 transition-colors group relative">
                                                                    
                                                                    <div className="w-32 shrink-0 border-r border-slate-200 p-3 flex flex-col justify-center bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                                                        <span className="text-[9px] font-extrabold text-indigo-600 mb-0.5 truncate" title={unitName}>{unitName}</span>
                                                                        <span className="text-[10px] font-bold text-slate-700 line-clamp-2" title={teamName}>{teamName}</span>
                                                                        <span className="text-[8px] font-medium text-slate-500 mt-1 line-clamp-2 leading-tight" title={locationName}>📍 {locationName}</span>
                                                                    </div>
                                                                    
                                                                    <div className="flex-1 relative min-h-[70px] py-2">
                                                                        {toLocalISOString(selectedDate) === toLocalISOString(new Date()) && (
                                                                            <TimelineCurrentTimeLine startHour={TIMELINE_START_HOUR} endHour={TIMELINE_END_HOUR} />
                                                                        )}
                                                                        <div className="absolute inset-0 flex pointer-events-none">
                                                                            {Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR }).map((_, i) => (
                                                                                <div key={i} className="flex-1 border-l border-slate-100"></div>
                                                                            ))}
                                                                        </div>

                                                                        {teamEvents.map((evt, idx) => {
                                                                            const { left, width } = getTimelineStyle(evt.time, evt.closingTime);
                                                                            const styles = getEventStyles(evt);
                                                                            return (
                                                                                <div key={idx} onClick={() => openDispatchEvent(evt)} 
                                                                                    className={`absolute top-2 bottom-2 rounded-lg border shadow-sm cursor-pointer overflow-hidden transition-all hover:scale-[1.02] hover:shadow-md hover:z-20 ${styles.bg} ${styles.border} border-l-[4px] opacity-90 hover:opacity-100 flex flex-col justify-center px-2 min-w-[20px]`}
                                                                                    style={{ left, width }}
                                                                                >
                                                                                    <div className={`text-[8px] font-bold truncate flex items-center gap-1 ${styles.text}`}>
                                                                                        {evt.time} - {evt.title || 'ออกหน่วย'}
                                                                                    </div>
                                                                                    {parseFloat(width) > 10 && ( 
                                                                                        <div className="text-[7px] text-slate-500 truncate mt-0.5 font-medium">{evt.location}</div>
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
                        )}

                        {/* ===================== หน้าปฏิทินเต็มรูปแบบ ===================== */}
                        {activeMenu === 'calendar' && (
                            <div className="bg-white rounded-3xl p-5 lg:p-8 shadow-sm border border-slate-100 flex flex-col min-h-[700px] h-full animate-in fade-in duration-300">
                                {/* Header ปฏิทิน */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-lg font-black text-slate-800 tracking-tight">
                                            {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                                        </h2>
                                        <p className="text-[10px] text-slate-500 font-medium mt-1">ตารางปฏิบัติงานและหน่วยสัตวแพทย์เคลื่อนที่ทั้งหมด</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-sm shrink-0">
                                        <button onClick={() => { playSound('pop'); changeMonth(-1); }} className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                                        <button onClick={() => { playSound('pop'); setCurrentDate(new Date()); }} className="px-5 py-2 text-[10px] font-bold text-indigo-600 hover:bg-white rounded-lg shadow-sm transition-colors">ไปที่วันนี้</button>
                                        <button onClick={() => { playSound('pop'); changeMonth(1); }} className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm transition-colors"><ChevronRight className="w-5 h-5" /></button>
                                    </div>
                                </div>

                                {/* หัววันในสัปดาห์ */}
                                <div className="grid grid-cols-7 gap-2 mb-2">
                                    {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((d, i) => (
                                        <div key={d} className={`text-center text-[10px] font-bold py-2.5 rounded-xl bg-slate-50 border border-slate-100 ${i === 0 || i === 6 ? 'text-rose-500' : 'text-slate-600'}`}>{d}</div>
                                    ))}
                                </div>

                                {/* Grid ปฏิทิน */}
                                <div className="grid grid-cols-7 auto-rows-[minmax(120px,1fr)] gap-2 flex-1">
                                    {daysArray.map((day, i) => {
                                        if (i < firstDay) return <div key={`empty-${i}`} className="bg-transparent rounded-2xl" />;
                                        const dayNum = i - firstDay + 1;
                                        const dObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
                                        const dateStr = toLocalISOString(dObj);
                                        const isToday = dateStr === toLocalISOString(new Date());
                                        const isSelected = dateStr === toLocalISOString(selectedDate);
                                        
                                        const dayEvents = displayEvents.filter(e => e.date === dateStr);

                                        return (
                                            <div key={i} 
                                                onClick={() => { 
                                                    playSound('pop'); 
                                                    setSelectedDate(dObj); 
                                                    setActiveMenu('dashboard'); 
                                                }}
                                                className={`border rounded-2xl p-2 flex flex-col gap-1 transition-all cursor-pointer overflow-hidden group hover:shadow-md
                                                ${isSelected ? 'border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-sm' : 
                                                  isToday ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-indigo-300'}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-bold ${isToday ? 'bg-indigo-600 text-white shadow-sm' : isSelected ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 group-hover:text-indigo-600'}`}>
                                                        {dayNum}
                                                    </span>
                                                    {dayEvents.length > 0 && (
                                                        <span className="text-[8px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md mt-0.5">
                                                            {dayEvents.length} งาน
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* รายการกิจกรรมย่อยในแต่ละวัน */}
                                                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-0.5">
                                                    {dayEvents.slice(0, 3).map((evt, idx) => {
                                                        const styles = getEventStyles(evt);
                                                        return (
                                                            <div key={idx} 
                                                                className={`text-[8px] px-2 py-1.5 rounded-lg truncate font-bold border-l-[3px] ${styles.bg} ${styles.text} ${styles.border} shadow-sm`} 
                                                                title={evt.location || evt.title}
                                                            >
                                                                {evt.time} - {evt.location || evt.title || 'ออกหน่วย'}
                                                            </div>
                                                        );
                                                    })}
                                                    {dayEvents.length > 3 && (
                                                        <div className="text-[8px] text-slate-500 font-bold text-center bg-slate-50 border border-slate-100 py-1 rounded-lg">
                                                            +{dayEvents.length - 3} งานเพิ่มเติม
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeMenu === 'activities' && (
                            <div className="h-full">
                                <ActivityPage events={events} />
                            </div>
                        )}
                    </main>
                </div>
            </div>
            
            {/* Context Menu (Right Click) */}
            {contextMenu.visible && contextMenu.event && (
                <div className="fixed z-[99999] bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-100" style={{ top: contextMenu.y, left: contextMenu.x }}>
                    <button onClick={(e) => { e.stopPropagation(); setExpandedEventId(contextMenu.uniqueId); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-4 py-2 text-[10px] text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                        <ChevronDown className="w-4 h-4 text-slate-400" /> ดูรายละเอียด
                    </button>
                    {canEdit && (
                        <>
                            <div className="h-px bg-slate-100 my-1 w-full"></div>
                            <button onClick={(e) => { e.stopPropagation(); if(contextMenu.event) openDispatchEvent(contextMenu.event); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-4 py-2 text-[10px] text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors">
                                <Edit3 className="w-4 h-4 text-indigo-400" /> แก้ไขข้อมูล
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteDispatch(contextMenu.event?._id); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-4 py-2 text-[10px] text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors">
                                <Trash2 className="w-4 h-4 text-rose-400" /> ลบรายการ
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Admin Modals (Add Controller & Manage Staff) */}
            {isAddControllerOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h3 className="text-[10px] font-bold text-slate-800">จัดการรายชื่อผู้ควบคุม</h3>
                            <button onClick={() => setIsAddControllerOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="space-y-3 shrink-0 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-2 mb-1">
                                <UserPlus className="w-4 h-4 text-indigo-500" />
                                <span className="text-[10px] font-bold text-indigo-700">{editingControllerIndex !== null ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <input type="text" className="w-full p-2.5 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none rounded-lg text-[10px] bg-white" value={controllerNameInput} onChange={(e) => setControllerNameInput(e.target.value)} placeholder="ชื่อ-นามสกุล..." />
                                </div>
                                <div className="col-span-2">
                                    <input type="text" className="w-full p-2.5 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none rounded-lg text-[10px] bg-white" value={controllerPhoneInput} onChange={(e) => setControllerPhoneInput(e.target.value)} placeholder="เบอร์โทร (เช่น 08X-XXX-XXXX)" />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-1">
                                {editingControllerIndex !== null && (
                                    <button onClick={() => { setControllerNameInput(''); setControllerPhoneInput(''); setEditingControllerIndex(null); }} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold text-[9px] transition-colors shadow-sm">ยกเลิก</button>
                                )}
                                <button onClick={handleSaveController} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[9px] shadow-sm transition-colors flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5"/> {editingControllerIndex !== null ? 'บันทึก' : 'เพิ่ม'}
                                </button>
                            </div>
                        </div>
                        <div className="mt-5 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[150px]">
                            <h4 className="text-[9px] font-bold text-slate-500 mb-3 uppercase tracking-wider">รายชื่อที่บันทึกไว้ ({savedControllersList.length})</h4>
                            {savedControllersList.length === 0 ? (
                                <div className="text-center text-slate-400 text-[10px] py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">ยังไม่มีข้อมูลในระบบ</div>
                            ) : (
                                <div className="space-y-2">
                                    {savedControllersList.map((item, idx) => (
                                        <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${editingControllerIndex === idx ? 'border-indigo-300 bg-indigo-50/70 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-700">{item.name}</div>
                                                <div className="text-[9px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5"><Phone className="w-3 h-3 text-slate-400"/> {item.phone || '-'}</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleEditController(idx)} className={`p-1.5 rounded-lg transition-colors ${editingControllerIndex === idx ? 'bg-indigo-100 text-indigo-600' : 'text-blue-500 hover:bg-blue-50'}`} title="แก้ไข"><Edit3 className="w-4 h-4"/></button>
                                                <button onClick={() => handleDeleteController(idx)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="ลบ"><Trash2 className="w-4 h-4"/></button>
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
                            <h3 className="text-[10px] font-bold text-slate-800">จัดการรายชื่อทีมงานทั้งหมด</h3>
                            <button onClick={() => setIsManageStaffOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="space-y-3 shrink-0 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-blue-500" />
                                <span className="text-[10px] font-bold text-blue-700">{editingStaffIndex !== null ? 'แก้ไขรายชื่อ' : 'เพิ่มรายชื่อใหม่'}</span>
                            </div>
                            <div className="flex flex-col gap-3">
                                <input type="text" className="w-full p-2.5 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none rounded-lg text-[10px] bg-white" value={staffNameInput} onChange={(e) => setStaffNameInput(e.target.value)} placeholder="พิมพ์ชื่อ-นามสกุล..." />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 px-1">
                                        <label className="flex items-center gap-1.5 text-[10px] font-medium text-slate-700 cursor-pointer">
                                            <input type="radio" name="staffRole" value="vet" checked={staffRoleInput === 'vet'} onChange={() => setStaffRoleInput('vet')} className="accent-blue-600 w-3.5 h-3.5" /> สัตวแพทย์
                                        </label>
                                        <label className="flex items-center gap-1.5 text-[10px] font-medium text-slate-700 cursor-pointer">
                                            <input type="radio" name="staffRole" value="general" checked={staffRoleInput === 'general'} onChange={() => setStaffRoleInput('general')} className="accent-blue-600 w-3.5 h-3.5" /> บุคลากรทั่วไป
                                        </label>
                                    </div>
                                    <button onClick={handleSaveStaff} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[9px] shadow-sm transition-colors flex items-center gap-1.5 shrink-0">
                                        <Plus className="w-3.5 h-3.5"/> {editingStaffIndex !== null ? 'บันทึก' : 'เพิ่ม'}
                                    </button>
                                </div>
                            </div>
                            {editingStaffIndex !== null && (
                                <div className="flex justify-end mt-1">
                                    <button onClick={() => { setStaffNameInput(''); setStaffRoleInput('general'); setEditingStaffIndex(null); }} className="text-[8px] text-slate-500 hover:text-slate-700 underline">ยกเลิกการแก้ไข</button>
                                </div>
                            )}
                        </div>
                        <div className="mt-5 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[150px]">
                            <h4 className="text-[9px] font-bold text-slate-500 mb-3 uppercase tracking-wider">รายชื่อในระบบ ({savedStaffList.length})</h4>
                            {savedStaffList.length === 0 ? (
                                <div className="text-center text-slate-400 text-[10px] py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">ยังไม่มีรายชื่อทีมงาน</div>
                            ) : (
                                <div className="space-y-4">
                                    {savedStaffList.some(s => s.role === 'vet') && (
                                        <div>
                                            <div className="text-[9px] font-bold text-indigo-600 mb-2 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> สัตวแพทย์</div>
                                            <div className="space-y-2">
                                                {savedStaffList.map((item, idx) => {
                                                    if (item.role !== 'vet') return null;
                                                    return (
                                                        <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${editingStaffIndex === idx ? 'border-blue-300 bg-blue-50/70 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                                                            <div className="text-[10px] font-bold text-slate-700">{item.name}</div>
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
                                    {savedStaffList.some(s => s.role !== 'vet') && (
                                        <div>
                                            <div className="text-[9px] font-bold text-slate-600 mb-2 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> บุคลากรทั่วไป</div>
                                            <div className="space-y-2">
                                                {savedStaffList.map((item, idx) => {
                                                    if (item.role === 'vet') return null;
                                                    return (
                                                        <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${editingStaffIndex === idx ? 'border-blue-300 bg-blue-50/70 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                                                            <div className="text-[10px] font-bold text-slate-700">{item.name}</div>
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

            {/* Other Modals */}
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} apiBaseUrl={BASE_URL} onToast={addToast} />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <AnnouncementModal isOpen={isAnnouncementModalOpen} onClose={() => setIsAnnouncementModalOpen(false)} initialAnnouncements={announcements} onSave={handleSaveAnnouncements} />
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
        </div>
    );
};

export default DispatchCalendarDashboard;