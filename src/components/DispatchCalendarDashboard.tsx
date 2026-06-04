import React, { useState, useEffect, useMemo, useRef, useDeferredValue, useCallback } from 'react';
import { 
    CalendarDays, X, Plus, Clock, Users, CheckCircle, ChevronLeft, ChevronRight, Calendar, Search, Phone, MapPin,
    Unlock, LogOut, Megaphone, Edit3, ChevronUp, ChevronDown, Trash2, Save, UserPlus,
    Volume2, VolumeX, FileText, LayoutDashboard, Activity, Truck, Settings, Bell, MoreHorizontal, Menu, FileDown, Table, Columns, Copy, AlertTriangle,
    User, Shield, Database, Smartphone, TrendingUp, Layers
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { io } from "socket.io-client";

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

const ActivityPage: React.FC<{ events: EventData[], activeCategory?: string, onNavigateToEvent?: (dateStr: string, eventId?: string) => void }> = ({ events, activeCategory = 'all', onNavigateToEvent }) => {
    const [view, setView] = useState<'table' | 'kanban'>('table');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('ทั้งหมด');
    const [filterUnit, setFilterUnit] = useState('ทั้งหมด');

    const [filterStatus, setFilterStatus] = useState('ทั้งหมด');

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredEvents = useMemo(() => {
    return events.filter(e => {
        const matchesSearch = !searchTerm || e.location?.toLowerCase().includes(searchTerm.toLowerCase()) || e.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDistrict = filterDistrict === 'ทั้งหมด' || e.district === filterDistrict;
        const matchUnit = filterUnit === 'ทั้งหมด' || (e.unit || e.unitName) === filterUnit;
        const matchesDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);

        const st = getDispatchStatus(e)?.text || '';

        let matchStatus = true;
        if (filterStatus !== 'ทั้งหมด') {
            if (filterStatus === 'รอปฏิบัติงาน/เตรียมพร้อม') {
                matchStatus = st === 'เตรียมพร้อม' || st === 'รอปฏิบัติงาน';
            } else if (filterStatus === 'เสร็จสิ้น') {
                matchStatus = st === 'เสร็จสิ้น (Manual)' || st === 'สิ้นสุดปฏิบัติงาน';
            } else {
                matchStatus = st === filterStatus;
            }
        }

        let matchesCategory = true;
            if (activeCategory === 'pending') {
                matchesCategory = st === 'เตรียมพร้อม' || st === 'รอปฏิบัติงาน';
            } else if (activeCategory === 'in-progress') {
                matchesCategory = st === 'กำลังดำเนินงาน';
            } else if (activeCategory === 'history') {
                matchesCategory = st === 'เสร็จสิ้น (Manual)' || st === 'สิ้นสุดปฏิบัติงาน' || st === 'ยกเลิก';
            } else if (activeCategory === 'vet-unit') {
                matchesCategory = !!e.title?.includes('สัตวแพทย์');
            } else if (activeCategory === 'vaccine') {
                matchesCategory = !!e.title?.includes('วัคซีน') || !!e.title?.includes('ไมโครชิป');
            } else if (activeCategory === 'spay') {
                matchesCategory = !!e.title?.includes('ทำหมัน');
            } else if (activeCategory === 'governor') {
                matchesCategory = !!e.title?.includes('ผู้ว่า');
            } else if (activeCategory === 'cat-cage') {
                matchesCategory = !!e.title?.includes('กรงแมว');
            }
        return matchesSearch && matchesDistrict && matchUnit && matchesDate && matchesCategory && matchStatus;
    });
}, [events, searchTerm, filterDistrict, filterUnit, startDate, endDate, activeCategory, filterStatus]);

const stats = useMemo(() => {
    let completed = 0, inProgress = 0, pending = 0, cancelled = 0;
    filteredEvents.forEach(e => {
        const st = getDispatchStatus(e)?.text;
        if (st === 'เสร็จสิ้น (Manual)' || st === 'สิ้นสุดปฏิบัติงาน') completed++;
        else if (st === 'กำลังดำเนินงาน') inProgress++;
        else if (st === 'เตรียมพร้อม' || st === 'รอปฏิบัติงาน') pending++;
        else if (st === 'ยกเลิก') cancelled++;
    });
    return { total: filteredEvents.length, completed, inProgress, pending, cancelled };
}, [filteredEvents]);

    const districts = useMemo(() => ['ทั้งหมด', ...Array.from(new Set(events.map(e => e.district).filter(Boolean)))], [events]);
    const units = useMemo(() => ['ทั้งหมด', ...Array.from(new Set(events.map(e => e.unit || e.unitName).filter(Boolean)))], [events]);

    const exportToCSV = () => {
        const headers = ["วันที่", "เขต", "สถานที่", "หน่วย", "สถานะ"];
        const rows = filteredEvents.map(e => [e.date, e.district || '-', e.location, (e.unit || e.unitName || '-'), getDispatchStatus(e)?.text || '']);
        const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `report_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
    };

    return (
        <div className="flex flex-col min-h-full h-auto bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 animate-in fade-in duration-300">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                <input type="text" placeholder="ค้นหา..." className="col-span-2 md:col-span-1 p-2.5 bg-slate-50 rounded-xl text-[10px] border border-slate-200" onChange={(e) => setSearchTerm(e.target.value)} />
                <select className="p-2.5 bg-slate-50 rounded-xl text-[10px] border border-slate-200" onChange={(e) => setFilterDistrict(e.target.value)}>{districts.map(d => <option key={d}>{d}</option>)}</select>
                <select className="p-2.5 bg-slate-50 rounded-xl text-[10px] border border-slate-200" onChange={(e) => setFilterUnit(e.target.value)}>
                    {units.map(u => <option key={u}>{u}</option>)}
                </select>
                <select className="p-2.5 bg-slate-50 rounded-xl text-[10px] border border-slate-200" onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="ทั้งหมด">ทุกสถานะ</option>
                    <option value="รอปฏิบัติงาน/เตรียมพร้อม">รอปฏิบัติงาน / เตรียมพร้อม</option>
                    <option value="กำลังดำเนินงาน">กำลังดำเนินงาน</option>
                    <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                    <option value="ยกเลิก">ยกเลิก</option>
                </select>
                
                <input type="date" className="p-2.5 bg-slate-50 rounded-xl text-[10px] border border-slate-200" onChange={(e) => setStartDate(e.target.value)} />
                <input type="date" className="p-2.5 bg-slate-50 rounded-xl text-[10px] border border-slate-200" onChange={(e) => setEndDate(e.target.value)} />
            </div>

            {/* Views */}
            <div className="w-full overflow-x-auto pb-6">
                {view === 'table' ? (
                    <div className="max-h-[420px] overflow-y-auto custom-scrollbar relative border border-slate-100 rounded-xl">
                        <table className="w-full min-w-[600px] text-[10px] text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                                <tr><th className="p-3">วันที่</th><th className="p-3">เขต</th><th className="p-3">สถานที่</th><th className="p-3">หน่วย</th><th className="p-3">สถานะ</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEvents.map((e, i) => {
                                    const st = getDispatchStatus(e);
                                    return (
                                        <tr key={i} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => onNavigateToEvent?.(e.date, e._id)}>
                                            <td className="p-3 font-mono">{e.date}</td>
                                
                                            <td className="p-3 font-bold text-slate-800">{e.district || '-'}</td>
                                
                                            <td className="p-3">{e.location}</td>
                                
                                            <td className="p-3">
                                                <span className="font-medium text-indigo-600">
                                                    {e.unit || e.unitName || e.title || '-'}
                                                </span>
                                            </td>
                                
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-md font-bold text-[8px] flex items-center gap-1 w-fit border ${st?.badge || 'bg-slate-100 text-slate-600'}`}>
                                                    {st?.icon && <st.icon className="w-3 h-3" />} {st?.text || 'เตรียมพร้อม'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex gap-4 min-w-[800px] h-full">
                        {['เตรียมพร้อม', 'กำลังดำเนินงาน', 'เสร็จสิ้น', 'ยกเลิก'].map(statusGroup => (
                            <div key={statusGroup} className="flex-1 bg-slate-50 rounded-2xl p-3 flex flex-col gap-3 max-h-[420px] overflow-y-auto custom-scrollbar border border-slate-100">
                                <h4 className="font-bold text-slate-700 text-[10px] px-1 sticky top-0 bg-slate-50 py-1 z-10">{statusGroup} ({filteredEvents.filter(e => getDispatchStatus(e)?.text === statusGroup).length})</h4>
                                {filteredEvents.filter(e => {
                                    const currentStatus = getDispatchStatus(e)?.text || '';
                                    if (statusGroup === 'เตรียมพร้อม') return currentStatus === 'เตรียมพร้อม' || currentStatus === 'รอปฏิบัติงาน';
                                    if (statusGroup === 'เสร็จสิ้น') return currentStatus === 'เสร็จสิ้น (Manual)' || currentStatus === 'สิ้นสุดปฏิบัติงาน';
                                    return currentStatus === statusGroup;
                                }).map((e, i) => (
                                <div key={i} onClick={() => onNavigateToEvent?.(e.date, e._id)} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-[10px] shrink-0 cursor-pointer hover:border-indigo-300 transition-colors">
                                    <p className="font-bold text-indigo-600 mb-0.5">{e.unit || e.unitName || e.title || 'ไม่ระบุหน่วย'}</p>
                                    <p className="text-slate-700 font-medium text-[9px]">{e.location}</p>
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
// Component: SettingsPage (อัปเดตใหม่ เพิ่มจัดการข้อมูลพื้นฐาน)
// ==========================================
interface SettingsPageProps {
    activeTab: string;
    user: User | null;
    token: string; 
    addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ activeTab, user, token, addToast }) => {
    // --- State: ตั้งค่าโปรไฟล์ ---
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isProfileLoading, setIsProfileLoading] = useState(false);

    // --- State: จัดการสิทธิ์ (Permissions) ---
    const [users, setUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);

    const [formUsername, setFormUsername] = useState('');
    const [formFullName, setFormFullName] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formRole, setFormRole] = useState('user');
    const [formStatus, setFormStatus] = useState('active');

    // --- State: จัดการข้อมูลพื้นฐาน (Master Data) ---
    const canManageUnits = ['Developer', 'MagaAdmin'].includes(user?.role || '');
    const [masterDataTab, setMasterDataTab] = useState<'units' | 'breeds' | 'colors'>(canManageUnits ? 'units' : 'breeds');
    const [masterDataList, setMasterDataList] = useState<any[]>([]);
    const [newMasterDataName, setNewMasterDataName] = useState('');
    const [isMasterDataLoading, setIsMasterDataLoading] = useState(false);

    const BASE_URL = 'https://veterinarydashboard-hwho.onrender.com';

    // ----------------------------------------------------
    // Function: เปลี่ยนรหัสผ่านตัวเอง (Profile)
    // ----------------------------------------------------
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            addToast('error', 'รหัสผ่านใหม่ไม่ตรงกัน');
            return;
        }
        if (!oldPassword || !newPassword) {
            addToast('warning', 'กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        setIsProfileLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            const data = await res.json();
            if (res.ok) {
                addToast('success', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                addToast('error', data.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
            }
        } catch (error) {
            addToast('error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        } finally {
            setIsProfileLoading(false);
        }
    };

    // ----------------------------------------------------
    // Functions: จัดการผู้ใช้งาน (Permissions)
    // ----------------------------------------------------
    const fetchUsers = useCallback(async () => {
        if (!user || !['Developer', 'MagaAdmin'].includes(user.role)) return;
        setIsLoadingUsers(true);
        try {
            const res = await fetch(`${BASE_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                addToast('error', 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้');
            }
        } catch (err) {
            addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsLoadingUsers(false);
        }
    }, [user, addToast]);

    useEffect(() => {
        if (activeTab === 'permissions') fetchUsers();
    }, [activeTab, fetchUsers]);

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formUsername || (!editingUser && !formPassword)) {
            addToast('warning', 'กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const isEdit = !!editingUser;
        const url = isEdit ? `${BASE_URL}/api/users/${editingUser._id}` : `${BASE_URL}/api/users`;
        
        const payload: any = { username: formUsername, fullName: formFullName, role: formRole, status: formStatus }; // <--- เพิ่ม fullName
        if (!isEdit) payload.password = formPassword;

        try {
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                addToast('success', isEdit ? 'อัปเดตข้อมูลสำเร็จ' : 'เพิ่มผู้ใช้งานสำเร็จ');
                setShowUserForm(false);
                fetchUsers();
            } else {
                addToast('error', data.message || 'ไม่สามารถบันทึกข้อมูลได้');
            }
        } catch (error) {
            addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!window.confirm('ยืนยันการลบบัญชีผู้ใช้งานนี้?')) return;
        try {
            const res = await fetch(`${BASE_URL}/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                addToast('success', 'ลบผู้ใช้งานสำเร็จ');
                fetchUsers();
            } else {
                const data = await res.json();
                addToast('error', data.message || 'ไม่สามารถลบข้อมูลได้');
            }
        } catch (err) {
             addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const handleResetPassword = async (id: string) => {
        const newPassword = window.prompt('กรุณากรอกรหัสผ่านใหม่:');
        if (!newPassword) return;

        try {
            const res = await fetch(`${BASE_URL}/api/users/${id}/reset-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ newPassword })
            });
            if (res.ok) {
                addToast('success', 'รีเซ็ตรหัสผ่านสำเร็จ');
            } else {
                const data = await res.json();
                addToast('error', data.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้');
            }
        } catch (err) {
             addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    // ----------------------------------------------------
    // Functions: จัดการข้อมูลพื้นฐาน (Master Data)
    // ----------------------------------------------------
    const fetchMasterData = useCallback(async () => {
        if (!user) return;
        setIsMasterDataLoading(true);
        try {
            const endpoint = masterDataTab === 'units' ? 'custom-units' : masterDataTab;
            const res = await fetch(`${BASE_URL}/api/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMasterDataList(data);
            }
        } catch (err) {
            addToast('error', 'ไม่สามารถดึงข้อมูลพื้นฐานได้');
        } finally {
            setIsMasterDataLoading(false);
        }
    }, [user, masterDataTab, addToast]);

    useEffect(() => {
        if (activeTab === 'master-data') fetchMasterData();
    }, [activeTab, fetchMasterData, masterDataTab]);

    const handleAddMasterData = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMasterDataName.trim()) return;
        
        try {
            const endpoint = masterDataTab === 'units' ? 'custom-units' : masterDataTab;
            const res = await fetch(`${BASE_URL}/api/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ name: newMasterDataName.trim() })
            });

            if (res.ok) {
                playSound('success');
                addToast('success', 'เพิ่มข้อมูลเรียบร้อยแล้ว');
                setNewMasterDataName('');
                fetchMasterData();
            } else {
                const data = await res.json();
                addToast('error', data.message || 'ไม่สามารถเพิ่มข้อมูลได้ (อาจมีข้อมูลนี้อยู่แล้ว)');
            }
        } catch (err) {
            addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const handleDeleteMasterData = async (id: string) => {
        if (!window.confirm('ยืนยันการลบข้อมูลนี้?')) return;
        try {
            const endpoint = masterDataTab === 'units' ? 'custom-units' : masterDataTab;
            const res = await fetch(`${BASE_URL}/api/${endpoint}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            
            if (res.ok) {
                playSound('delete');
                addToast('success', 'ลบข้อมูลเรียบร้อยแล้ว');
                fetchMasterData();
            } else {
                addToast('error', 'ไม่สามารถลบข้อมูลได้ หรือไม่มีสิทธิ์');
            }
        } catch (err) {
            addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    return (
        <div className="animate-in fade-in duration-300 bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 min-h-[500px]">
            <div className="flex items-center gap-4 mb-8 border-b pb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Settings className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-800">
                        {activeTab === 'profile' && 'ตั้งค่าโปรไฟล์'}
                        {activeTab === 'permissions' && 'จัดการสิทธิ์ผู้ใช้งาน'}
                        {activeTab === 'master-data' && 'จัดการข้อมูลพื้นฐาน'}
                        {activeTab === 'preferences' && 'ตั้งค่าการแสดงผล'}
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium">จัดการรายละเอียดส่วนการตั้งค่า {activeTab}</p>
                </div>
            </div>
            
            {/* -------------------- TAB: ตั้งค่าโปรไฟล์ -------------------- */}
            {activeTab === 'profile' && (
                <div className="max-w-2xl">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 flex items-center gap-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-black shadow-inner shrink-0">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-black text-slate-800">{user?.username || 'ไม่ระบุชื่อผู้ใช้'}</h3>
                            <div className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200">
                                สิทธิ์การใช้งาน: {user?.role || 'User'}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h4 className="text-[12px] font-bold text-slate-800 mb-5 flex items-center gap-2">
                            <Unlock className="w-4 h-4 text-indigo-500" /> เปลี่ยนรหัสผ่าน (Change Password)
                        </h4>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5">รหัสผ่านเดิม</label>
                                <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] sm:text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="กรอกรหัสผ่านปัจจุบัน" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5">รหัสผ่านใหม่</label>
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] sm:text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="กรอกรหัสผ่านใหม่" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
                                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] sm:text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" />
                                </div>
                            </div>
                            <div className="pt-5 border-t border-slate-100 flex justify-end mt-6">
                                <button type="submit" disabled={isProfileLoading} className={`px-6 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs shadow-sm flex items-center gap-2 transition-all ${isProfileLoading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                                    <Save className="w-4 h-4" /> {isProfileLoading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* -------------------- TAB: จัดการสิทธิ์ผู้ใช้งาน -------------------- */}
            {activeTab === 'permissions' && (
                <div className="max-w-4xl">
                    {!['Developer', 'MagaAdmin'].includes(user?.role || '') ? (
                        <div className="flex flex-col items-center justify-center py-10 bg-rose-50 rounded-2xl border border-rose-100 text-rose-500">
                            <Shield className="w-12 h-12 mb-3 text-rose-300" />
                            <h3 className="font-bold text-base">ไม่มีสิทธิ์เข้าถึง</h3>
                            <p className="text-[10px] mt-1">เฉพาะผู้ดูแลระบบระดับ Developer หรือ MagaAdmin เท่านั้น</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-500"/> จัดการบัญชีผู้ใช้งาน</h3>
                                    <p className="text-[10px] text-slate-500 mt-1">เพิ่ม แก้ไข ลบ หรือกำหนดสิทธิ์การเข้าถึงระบบ</p>
                                </div>
                                {!showUserForm && (
                                    <button onClick={() => {
                                        setEditingUser(null);
                                        setFormUsername('');
                                        setFormFullName('');
                                        setFormPassword('');
                                        setFormRole('user');
                                        setFormStatus('active');
                                        setShowUserForm(true);
                                    }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold shadow-sm flex items-center gap-2 transition-colors">
                                        <UserPlus className="w-4 h-4" /> เพิ่มผู้ใช้งานใหม่
                                    </button>
                                )}
                            </div>

                            {/* ฟอร์มเพิ่ม/แก้ไขผู้ใช้ */}
                            {showUserForm && (
                                <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 mb-6 animate-in slide-in-from-top-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-[12px] font-bold text-indigo-800 flex items-center gap-1.5">
                                            {editingUser ? <Edit3 className="w-4 h-4"/> : <Plus className="w-4 h-4"/>} 
                                            {editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'สร้างผู้ใช้งานใหม่'}
                                        </h4>
                                        <button onClick={() => setShowUserForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"><X className="w-4 h-4"/></button>
                                    </div>
                                    <form onSubmit={handleSaveUser} className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5">ชื่อผู้ใช้งาน (Username)</label>
                                                <input type="text" required value={formUsername} onChange={e => setFormUsername(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" placeholder="ตั้งชื่อผู้ใช้งาน" />
                                            </div>
                                            <div>
        <label className="block text-[10px] font-bold text-slate-600 mb-1.5">ชื่อ-นามสกุล (Full Name)</label>
        <input type="text" value={formFullName} onChange={e => setFormFullName(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" placeholder="ระบุชื่อ-นามสกุล" />
    </div>
                                            {!editingUser && (
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5">รหัสผ่าน</label>
                                                    <input type="password" required value={formPassword} onChange={e => setFormPassword(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" placeholder="ตั้งรหัสผ่านเริ่มต้น" />
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5">ระดับสิทธิ์ (Role)</label>
                                                <select value={formRole} onChange={e => setFormRole(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400">
                                                    <option value="user">User (ใช้งานทั่วไป)</option>
                                                    <option value="admin">Admin (จัดการข้อมูล)</option>
                                                    <option value="executive">Executive (ดูรายงานผล)</option>
                                                    <option value="MagaAdmin">MagaAdmin (ผู้ดูแลสูงสุด)</option>
                                                    <option value="Developer">Developer (ผู้พัฒนาระบบ)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5">สถานะ</label>
                                                <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400">
                                                    <option value="active">Active (ใช้งานปกติ)</option>
                                                    <option value="suspended">Suspended (ระงับการใช้งาน)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-2 border-t border-indigo-100 mt-4">
                                            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-colors">
                                                <Save className="w-4 h-4"/> บันทึกข้อมูลบัญชี
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* ตารางแสดงผู้ใช้งาน */}
                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[10px]">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
    <tr>
        <th className="p-4 uppercase tracking-wider">บัญชีผู้ใช้งาน</th>
        <th className="p-4 uppercase tracking-wider">ชื่อ-นามสกุล</th> {/* <--- เพิ่มบรรทัดนี้ */}
        <th className="p-4 uppercase tracking-wider">สิทธิ์เข้าถึง</th>
                                                <th className="p-4 uppercase tracking-wider">สถานะบัญชี</th>
                                                <th className="p-4 uppercase tracking-wider">เข้าสู่ระบบล่าสุด</th>
                                                <th className="p-4 text-center uppercase tracking-wider">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {isLoadingUsers ? (
                                                <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">กำลังโหลดข้อมูลผู้ใช้งาน...</td></tr>
                                            ) : users.length === 0 ? (
                                                <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">ไม่พบข้อมูลในระบบ</td></tr>
                                            ) : (
                                                users.map(u => (
                                                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="p-4 font-bold text-slate-700 flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200 shadow-sm">
                                                                {u.username.charAt(0).toUpperCase()}
                                                            </div>
                                                            {u.username}
                                                        </td>
                                                        <td className="p-4 text-slate-600">{u.fullName || '-'}</td>
                                                        <td className="p-4 text-slate-600 font-medium">
                                                            <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">{u.role}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 w-fit border ${u.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                                                {u.status === 'active' ? <CheckCircle className="w-3 h-3"/> : <X className="w-3 h-3"/>}
                                                                {u.status === 'active' ? 'ปกติ' : 'ระงับ'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-slate-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleString('th-TH') : 'ยังไม่เคยเข้าสู่ระบบ'}</td>
                                                        <td className="p-4">
                                                            <div className="flex justify-center gap-1.5">
                                                                <button onClick={() => {
                                                                    setEditingUser(u);
                                                                    setFormUsername(u.username);
                                                                    setFormFullName(u.fullName || '');
                                                                    setFormRole(u.role);
                                                                    setFormStatus(u.status);
                                                                    setShowUserForm(true);
                                                                }} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-transparent hover:border-blue-200" title="แก้ไข">
                                                                    <Edit3 className="w-4 h-4"/>
                                                                </button>
                                                                <button onClick={() => handleResetPassword(u._id)} className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors border border-transparent hover:border-amber-200" title="รีเซ็ตรหัสผ่าน">
                                                                    <Unlock className="w-4 h-4"/>
                                                                </button>
                                                                <button onClick={() => handleDeleteUser(u._id)} disabled={user?.username === u.username} className={`p-1.5 rounded-lg transition-colors border border-transparent ${user?.username === u.username ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-200'}`} title={user?.username === u.username ? 'ไม่สามารถลบบัญชีตัวเองได้' : 'ลบ'}>
                                                                    <Trash2 className="w-4 h-4"/>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* -------------------- TAB: จัดการข้อมูลพื้นฐาน (Master Data) -------------------- */}
            {activeTab === 'master-data' && (
                <div className="max-w-4xl animate-in fade-in duration-300">
                    {!['Developer', 'MagaAdmin', 'admin'].includes(user?.role || '') ? (
                        <div className="flex flex-col items-center justify-center py-10 bg-rose-50 rounded-2xl border border-rose-100 text-rose-500">
                            <Shield className="w-12 h-12 mb-3 text-rose-300" />
                            <h3 className="font-bold text-base">ไม่มีสิทธิ์เข้าถึง</h3>
                            <p className="text-[10px] mt-1">เฉพาะผู้ดูแลระบบเท่านั้นที่มีสิทธิ์จัดการข้อมูลพื้นฐานได้</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* เมนูจัดการข้อมูลย่อยด้านซ้าย */}
                            <div className="md:col-span-4 flex flex-col gap-2">
                                {canManageUnits && (
                                    <button onClick={() => setMasterDataTab('units')} className={`p-3.5 rounded-xl text-[10px] font-bold text-left transition-colors flex items-center justify-between ${masterDataTab === 'units' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'}`}>
                                        <span className="flex items-center gap-2"><Database className="w-4 h-4"/> หน่วยงาน (Units)</span>
                                        {masterDataTab === 'units' && <ChevronRight className="w-4 h-4 opacity-50"/>}
                                    </button>
                                )}
                                <button onClick={() => setMasterDataTab('breeds')} className={`p-3.5 rounded-xl text-[10px] font-bold text-left transition-colors flex items-center justify-between ${masterDataTab === 'breeds' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'}`}>
                                    <span className="flex items-center gap-2"><Database className="w-4 h-4"/> สายพันธุ์สัตว์ (Breeds)</span>
                                    {masterDataTab === 'breeds' && <ChevronRight className="w-4 h-4 opacity-50"/>}
                                </button>
                                <button onClick={() => setMasterDataTab('colors')} className={`p-3.5 rounded-xl text-[10px] font-bold text-left transition-colors flex items-center justify-between ${masterDataTab === 'colors' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'}`}>
                                    <span className="flex items-center gap-2"><Database className="w-4 h-4"/> สีสัตว์ (Colors)</span>
                                    {masterDataTab === 'colors' && <ChevronRight className="w-4 h-4 opacity-50"/>}
                                </button>
                            </div>

                            {/* พื้นที่จัดการข้อมูลด้านขวา */}
                            <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col">
                                <h3 className="text-[12px] font-black text-slate-800 mb-5 pb-4 border-b border-slate-100">
                                    จัดการ: {masterDataTab === 'units' ? 'รายชื่อหน่วยงาน' : masterDataTab === 'breeds' ? 'ข้อมูลสายพันธุ์สัตว์' : 'ข้อมูลสีสัตว์'}
                                </h3>
                                
                                <form onSubmit={handleAddMasterData} className="flex flex-col sm:flex-row gap-3 mb-6">
                                    <input 
                                        type="text" 
                                        value={newMasterDataName}
                                        onChange={e => setNewMasterDataName(e.target.value)}
                                        className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                                        placeholder={`พิมพ์ชื่อ${masterDataTab === 'units' ? 'หน่วยงาน' : masterDataTab === 'breeds' ? 'สายพันธุ์' : 'สี'} ที่ต้องการเพิ่ม...`}
                                    />
                                    <button type="submit" disabled={!newMasterDataName.trim()} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-[10px] font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 shrink-0">
                                        <Plus className="w-4 h-4"/> เพิ่มข้อมูล
                                    </button>
                                </form>

                                <div className="flex-1 min-h-[250px] max-h-[350px] overflow-y-auto custom-scrollbar pr-1 bg-slate-50/50 rounded-xl border border-slate-100 p-2">
                                    {isMasterDataLoading ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-[10px] font-medium">กำลังโหลดข้อมูล...</span>
                                        </div>
                                    ) : masterDataList.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                            <Database className="w-8 h-8 text-slate-200" />
                                            <span className="text-[10px] font-medium">ยังไม่มีข้อมูลในระบบ</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {masterDataList.map((item, idx) => (
                                                <div key={item._id || idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all group">
                                                    <div className="text-[10px] font-bold text-slate-700 truncate pr-2" title={item.name}>{item.name}</div>
                                                    <button onClick={() => handleDeleteMasterData(item._id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0" title="ลบข้อมูล">
                                                        <Trash2 className="w-3.5 h-3.5"/>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 text-[9px] text-slate-400 font-medium text-right">
                                    จำนวนข้อมูลทั้งหมด: {masterDataList.length} รายการ
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* -------------------- TAB: Placeholder อื่นๆ -------------------- */}
            {activeTab !== 'profile' && activeTab !== 'permissions' && activeTab !== 'master-data' && (
                <div className="flex flex-col items-center justify-center text-slate-400 py-10">
                    <Database className="w-12 h-12 mb-3 text-slate-200" />
                    <p className="text-[10px]">ส่วนการตั้งค่านี้กำลังอยู่ระหว่างการพัฒนา</p>
                </div>
            )}
        </div>
    );
};

// ==========================================
// Component: DuplicateCheckModal (อัปเดตใหม่: เพิ่มฟิลเตอร์ วันที่, สถานที่, หน่วย)
// ==========================================
interface DuplicateCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: EventData[]; // Dispatch Data
    reports: any[];      // Report Data ที่เพิ่มใหม่
    onSelectDate: (date: string) => void; 
}

const DuplicateCheckModal: React.FC<DuplicateCheckModalProps> = ({ isOpen, onClose, events, reports, onSelectDate }) => { 
    const [activeTab, setActiveTab] = useState<'duplicates' | 'unreported' | 'unscheduled' | 'mismatch' | 'no-map'>('duplicates');
    const [filterDate, setFilterDate] = useState<string>('');
    const [filterLocation, setFilterLocation] = useState<string>('');
    const [filterUnit, setFilterUnit] = useState<string>('ทั้งหมด');

    const [filterDistrict, setFilterDistrict] = useState<string>('ทั้งหมด');

    const [liveEvents, setLiveEvents] = useState<EventData[]>(events);
    const [liveReports, setLiveReports] = useState<any[]>(reports);

    // 🟢 2. ซิงค์จาก Props
    useEffect(() => {
        setLiveEvents(events);
        setLiveReports(reports);
    }, [events, reports]);

    // 🟢 3. ฟัง Event Socket
    useEffect(() => {
        if (!isOpen) return;
        const socket = io('https://veterinarydashboard-hwho.onrender.com');

        socket.on('server_data_update', (payload: any) => {
            if (payload.type === 'DISPATCH_ADDED') {
                setLiveEvents(prev => [...prev, payload.data]);
            } else if (payload.type === 'DISPATCH_UPDATED') {
                setLiveEvents(prev => prev.map(d => d._id === payload.data._id ? payload.data : d));
            } else if (payload.type === 'DISPATCH_DELETED') {
                setLiveEvents(prev => prev.filter(d => d._id !== payload.id));
            } else if (payload.type === 'REPORT_ADDED') {
                setLiveReports(prev => [payload.data, ...prev]);
            } else if (payload.type === 'REPORT_UPDATED') {
                setLiveReports(prev => prev.map(r => r._id === payload.data._id ? payload.data : r));
            } else if (payload.type === 'REPORT_DELETED') {
                setLiveReports(prev => prev.filter(r => r._id !== payload.id));
            }
        });

        // 🟢 แก้ไขบรรทัดนี้: ใส่ {} เพื่อบังคับให้ return type เป็น void
        return () => {
            socket.disconnect();
        };
    }, [isOpen]);

    const availableUnits = useMemo(() => {
    const units = new Set<string>();
    // --- [แก้ไข] สลับให้เช็ค e.title ก่อน ---
    liveEvents.forEach(e => { if(e.title) units.add(e.title); else if(e.unit) units.add(e.unit); else if(e.unitName) units.add(e.unitName); });
    liveReports.forEach(r => { if(r.unit) units.add(r.unit); });
    return ['ทั้งหมด', ...Array.from(units).filter(Boolean)];
}, [liveEvents, liveReports]);

    const availableDistricts = useMemo(() => {
    const districts = new Set<string>();
    liveEvents.forEach(e => { if(e.district) districts.add(e.district); });
    liveReports.forEach(r => { if(r.district) districts.add(r.district); });
    return ['ทั้งหมด', ...Array.from(districts).filter(Boolean)];
}, [liveEvents, liveReports]);

    const { duplicateData, unscheduledData, unreportedData, mismatchData, noMapData } = useMemo(() => {
        const normalize = (str: any) => (str || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

        const locationMap = new Map<string, EventData[]>();
        const noMaps: any[] = []; // <-- [แก้ไข] ย้ายมาประกาศด้านบนสุด

        // 🟢 เปลี่ยนมาใช้ liveEvents
        liveEvents.forEach(evt => {
            // --- [แก้ไข] ย้ายการเช็ค Map มาไว้ลูปแรก เพื่อให้ทำงานแม้ไม่มีข้อมูล Reports ---
            if (!evt.mapLink && !(evt.lat && evt.lng) && evt.status !== 'cancelled') {
                noMaps.push(evt);
            }

            const loc = evt.location?.trim();
            if (!loc) return;
            const normalizedLoc = normalize(loc);
            const key = `${evt.date}|${normalizedLoc}`;
            if (!locationMap.has(key)) locationMap.set(key, []);
            locationMap.get(key)!.push(evt);
        });

        const duplicates: any[] = [];
        const dupByLoc = new Map<string, any[]>();
        locationMap.forEach((evts) => {
            if (evts.length > 1) {
                const loc = evts[0].location || 'ไม่ระบุ';
                if (!dupByLoc.has(loc)) dupByLoc.set(loc, []);
                dupByLoc.get(loc)!.push(...evts);
            }
        });

        dupByLoc.forEach((evts, loc) => {
            duplicates.push({ location: loc, count: evts.length, events: evts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) });
        });
        duplicates.sort((a, b) => b.count - a.count);

        // 🟢 เปลี่ยนมาใช้ liveReports
        if (!liveReports || liveReports.length === 0) {
            // <-- [แก้ไข] คืนค่า noMapData ออกไปด้วยในกรณีที่ไม่มี Reports (แก้ Error undefined)
            return { 
                duplicateData: duplicates, 
                unscheduledData: [], 
                unreportedData: [], 
                mismatchData: [],
                noMapData: noMaps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            };
        }

        const unschByLocation = new Map<string, any[]>();
        const unrepByLocation = new Map<string, any[]>();
        const mismatches: any[] = [];

        // 🟢 เปลี่ยนมาใช้ liveReports
        liveReports.forEach(rep => {
            const loc = rep.location?.trim();
            if (!loc) return;
            const normLoc = normalize(loc);

            // 🟢 เปลี่ยนมาใช้ liveEvents
            const matchedDispatch = liveEvents.find(d => d.date === rep.date && normalize(d.location) === normLoc);

            if (!matchedDispatch) {
                if (!unschByLocation.has(loc)) unschByLocation.set(loc, []);
                unschByLocation.get(loc)!.push(rep);
            } else {
                const mismatchFields = [];
                const repUnit = normalize(rep.unit);
                const dispUnit = normalize(matchedDispatch.title || matchedDispatch.unit || matchedDispatch.unitName);
                const repTeam = (rep.team || '').toString().toLowerCase().replace(/\s+/g, '');
                const dispTeam = (matchedDispatch.team || '').toString().toLowerCase().replace(/\s+/g, '');

                const isVetDisp = dispUnit.includes('สัตวแพทย์') || dispUnit.includes('สัตว์แพทย์');
                const isVetRep = repUnit.includes('สัตวแพทย์') || repUnit.includes('สัตว์แพทย์');
                const isSpayDisp = dispUnit.includes('ทำหมัน');
                const isSpayRep = repUnit.includes('ทำหมัน');

                const isSpayVetMatch = (isSpayDisp && isVetRep) || (isVetDisp && isSpayRep);

                if (repUnit && dispUnit && !repUnit.includes(dispUnit) && !dispUnit.includes(repUnit) && !isSpayVetMatch) {
                    mismatchFields.push('หน่วยงาน');
                }
                if (repTeam && dispTeam && repTeam !== dispTeam) {
                    mismatchFields.push('ทีมปฏิบัติการ');
                }

                if (mismatchFields.length > 0) {
                    mismatches.push({ date: rep.date, location: rep.location, mismatchFields, report: rep, dispatch: matchedDispatch });
                }
            }
        });

        const today = new Date().toISOString().split('T')[0];

        // 🟢 เปลี่ยนมาใช้ liveEvents
        liveEvents.forEach(d => {
            // (เอาบล็อกที่เคยเช็ค noMaps ตรงนี้ออก เพราะย้ายไปด้านบนสุดแล้ว)
            if (d.date > today || d.status === 'cancelled') return;
            const loc = d.location?.trim();
            if (!loc) return;

            // 🟢 เปลี่ยนมาใช้ liveReports
            const isReported = liveReports.some(rep => rep.date === d.date && normalize(rep.location) === normalize(loc));
            if (!isReported) {
                if (!unrepByLocation.has(loc)) unrepByLocation.set(loc, []);
                unrepByLocation.get(loc)!.push(d);
            }
        });

        const unscheduledResults = Array.from(unschByLocation.entries()).map(([loc, reps]) => ({
            location: loc, count: reps.length, reports: reps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        })).sort((a, b) => b.count - a.count);

        const unreportedResults = Array.from(unrepByLocation.entries()).map(([loc, evts]) => ({
            location: loc, count: evts.length, events: evts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        })).sort((a, b) => b.count - a.count);

        return { 
            duplicateData: duplicates, 
            unscheduledData: unscheduledResults, 
            unreportedData: unreportedResults, 
            mismatchData: mismatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            noMapData: noMaps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
    }, [liveEvents, liveReports]);

    // --- Logic การกรองข้อมูลตามฟิลเตอร์ ---
    const { fDup, fUnsch, fUnrep, fMis, fNoMap } = useMemo(() => {
    const checkLoc = (loc: string) => !filterLocation || (loc || '').toLowerCase().includes(filterLocation.toLowerCase());
    const checkDate = (date: string) => !filterDate || date === filterDate;
    const checkUnit = (u1?: string, u2?: string) => {
        if (filterUnit === 'ทั้งหมด') return true;
        return (u1 === filterUnit) || (u2 === filterUnit);
    };
    
    // --- [เพิ่ม] ฟังก์ชันเช็คเขต ---
    const checkDistrict = (d1?: string, d2?: string) => {
        if (filterDistrict === 'ทั้งหมด') return true;
        return (d1 === filterDistrict) || (d2 === filterDistrict);
    };

    const fDup = duplicateData.map(d => {
    const eFiltered = d.events ? d.events.filter((e: any) => 
        // --- [แก้ไข] สลับให้เช็ค e.title ก่อน ---
        checkDate(e.date) && checkUnit(e.title || e.unit || e.unitName, '') && checkDistrict(e.district, '')
    ) : [];
    return { ...d, events: eFiltered, count: eFiltered.length };
}).filter(d => checkLoc(d.location) && d.count > 1);

    const fUnsch = unscheduledData.map(d => {
        const rFiltered = d.reports.filter((r: any) => 
            checkDate(r.date) && checkUnit(r.unit, '') && checkDistrict(r.district, '') // <-- [แก้ไข] เพิ่ม checkDistrict
        );
        return { ...d, reports: rFiltered, count: rFiltered.length };
    }).filter(d => checkLoc(d.location) && d.count > 0);

    const fUnrep = unreportedData.map(d => {
    const eFiltered = d.events.filter((e: any) => 
        checkDate(e.date) && checkUnit(e.title || e.unit || e.unitName, '') && checkDistrict(e.district, '')
    );
    return { ...d, events: eFiltered, count: eFiltered.length };
}).filter(d => checkLoc(d.location) && d.count > 0);

    const fMis = mismatchData.filter(m =>
    checkLoc(m.location) && checkDate(m.date) && 
    checkUnit(m.report?.unit, m.dispatch?.title || m.dispatch?.unit || m.dispatch?.unitName) &&
    checkDistrict(m.report?.district, m.dispatch?.district) 
);

    const fNoMap = (noMapData || []).filter((e: any) => 
        checkLoc(e.location) && checkDate(e.date) && 
        checkUnit(e.title || e.unit || e.unitName, '') && checkDistrict(e.district, '')
    );

    return { fDup, fUnsch, fUnrep, fMis, fNoMap };
}, [duplicateData, unscheduledData, unreportedData, mismatchData, noMapData, filterDate, filterLocation, filterUnit, filterDistrict]); // <-- [แก้ไข] เพิ่ม noMapData ใน Dependency

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[6000] flex justify-center items-center bg-slate-900/50 backdrop-blur-sm transition-opacity p-4">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-md">
                            <Copy className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-800">ตรวจสอบความถูกต้อง (Cross-check)</h2>
                            <p className="text-[10px] text-slate-500">ตรวจสอบปฏิทินซ้ำซ้อน และเทียบกับข้อมูลรายงานผล</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-50/80 px-4 sm:px-6 py-4 border-b border-slate-200 shrink-0 z-10">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="ค้นหาสถานที่..." value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-sm transition-all" />
                    </div>
                    <div className="w-full sm:w-[150px]">
                        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-600 cursor-pointer shadow-sm transition-all" />
                    </div>
                    <div className="w-full sm:w-[150px]">
                        <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-600 cursor-pointer shadow-sm transition-all">
                            {availableUnits.map((u, i) => <option key={i} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="w-full sm:w-[150px]">
                        <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-600 cursor-pointer shadow-sm transition-all">
                            {availableDistricts.map((d, i) => <option key={i} value={d}>{d}</option>)}
                        </select>
                    </div>

                    {(filterLocation || filterDate || filterUnit !== 'ทั้งหมด' || filterDistrict !== 'ทั้งหมด') && (
                        <button onClick={() => { setFilterLocation(''); setFilterDate(''); setFilterUnit('ทั้งหมด'); setFilterDistrict('ทั้งหมด'); }} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-sm">
                            <X className="w-3.5 h-3.5" /> ล้าง
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-50 border-b border-slate-200 px-4 sm:px-6 pt-3 gap-2 shrink-0 overflow-x-auto custom-scrollbar">
                    <button onClick={() => setActiveTab('duplicates')} className={`px-4 py-2.5 text-[11px] font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'duplicates' ? 'bg-white text-rose-600 border border-slate-200 border-b-0 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)] relative top-[1px]' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
                        <Copy className="w-4 h-4 hidden sm:block" /> 1. ปฏิทินซ้ำ <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'duplicates' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>{fDup.length} แห่ง</span>
                    </button>
                    <button onClick={() => setActiveTab('unreported')} className={`px-4 py-2.5 text-[11px] font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'unreported' ? 'bg-white text-emerald-600 border border-slate-200 border-b-0 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)] relative top-[1px]' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
                        <Database className="w-4 h-4 hidden sm:block" /> 2. ยังไม่ลงยอด <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'unreported' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{fUnrep.length} แห่ง</span>
                    </button>
                    <button onClick={() => setActiveTab('unscheduled')} className={`px-4 py-2.5 text-[11px] font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'unscheduled' ? 'bg-white text-amber-600 border border-slate-200 border-b-0 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)] relative top-[1px]' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
                        <CalendarDays className="w-4 h-4 hidden sm:block" /> 3. ไม่มีในปฏิทิน <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'unscheduled' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{fUnsch.length} แห่ง</span>
                    </button>
                    <button onClick={() => setActiveTab('mismatch')} className={`px-4 py-2.5 text-[11px] font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'mismatch' ? 'bg-white text-orange-600 border border-slate-200 border-b-0 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)] relative top-[1px]' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
                        <AlertTriangle className="w-4 h-4 hidden sm:block" /> 4. ข้อมูลขัดแย้ง <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'mismatch' ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'}`}>{fMis.length} แห่ง</span>
                    </button>
                    <button onClick={() => setActiveTab('no-map')} className={`px-4 py-2.5 text-[11px] font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'no-map' ? 'bg-white text-purple-600 border border-slate-200 border-b-0 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)] relative top-[1px]' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
                        <MapPin className="w-4 h-4 hidden sm:block" /> 5. ไม่มีลิงก์ Map <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'no-map' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}`}>{fNoMap.length} แห่ง</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/50">
                    
                    {/* TAB 1: ปฏิทินซ้ำ */}
                    {activeTab === 'duplicates' && (
                        fDup.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-emerald-500"><CheckCircle className="w-12 h-12 mb-3 text-emerald-300" /><h3 className="font-bold text-sm">ไม่พบปฏิทินซ้ำซ้อน</h3></div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4 bg-rose-50 text-rose-700 text-[10px] p-3 rounded-xl border border-rose-200">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>พบปฏิทินที่มี <strong>สถานที่และวันที่ตรงกัน</strong> จำนวน <strong>{fDup.length}</strong> แห่ง</span>
                                </div>
                                {fDup.map((item, idx) => {
                                    const dateCounts = item.events.reduce((acc: any, curr: any) => { acc[curr.date] = (acc[curr.date] || 0) + 1; return acc; }, {});
                                    return (
                                        <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                            <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                                <h4 className="font-bold text-[11px] text-slate-800 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-rose-500" />{item.location}</h4>
                                                <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg text-[9px] font-bold">ซ้ำ {item.count} ครั้ง</span>
                                            </div>
                                            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {item.events.map((evt: any, eIdx: number) => {
                                                    const isDuplicated = dateCounts[evt.date] > 1;
                                                    return (
                                                        <div key={eIdx} onClick={() => onSelectDate(evt.date)} className={`text-[9px] p-2 rounded-lg border flex flex-col gap-1 cursor-pointer hover:shadow-md ${isDuplicated ? 'border-rose-200 bg-rose-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                                                            <div className={`font-bold flex justify-between ${isDuplicated ? 'text-rose-600' : 'text-indigo-600'}`}>
                                                                <span>{evt.date}</span><span>{evt.time || '-'}</span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-600 mt-1">
                                                                เขต: {evt.district || '-'} | หน่วย: {evt.unit || evt.unitName || evt.title || '-'} | ทีม: {evt.team || '-'}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}

                    {/* TAB 2: ปฏิทินที่ยังไม่ลงยอด */}
                    {activeTab === 'unreported' && (
                        fUnrep.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-emerald-500"><CheckCircle className="w-12 h-12 mb-3 text-emerald-300" /><h3 className="font-bold text-sm">ปฏิทินทั้งหมดลงยอดครบถ้วน</h3></div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4 bg-emerald-50 text-emerald-700 text-[10px] p-3 rounded-xl border border-emerald-200">
                                    <Database className="w-4 h-4 shrink-0" /><span>พบปฏิทิน (ที่ผ่านไปแล้ว) <strong>ยังไม่ได้บันทึกยอด</strong> จำนวน <strong>{fUnrep.length}</strong> แห่ง</span>
                                </div>
                                {fUnrep.map((item, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500" /> {item.location}</h4>
                                        </div>
                                        <div className="flex flex-col divide-y divide-slate-100">
                                            {item.events.map((evt: any, eIdx: number) => (
                                                <div key={eIdx} onClick={() => onSelectDate(evt.date)} className="p-3.5 flex justify-between gap-3 cursor-pointer hover:bg-emerald-50">
                                                    <div className="flex gap-4">
                                                        <div className="text-emerald-600 font-bold text-[11px]">{evt.date}</div>
                                                            <div className="text-[10px] text-slate-600">
                                                                เขต: {evt.district || '-'} | หน่วย: {evt.unit || evt.unitName || evt.title || '-'} | ทีม: {evt.team || '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* TAB 3: ลงยอดแต่ไม่มีในปฏิทิน */}
                    {activeTab === 'unscheduled' && (
                        fUnsch.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-emerald-500"><CheckCircle className="w-12 h-12 mb-3 text-emerald-300" /><h3 className="font-bold text-sm">ยอดเยี่ยม! ข้อมูลรายงานทั้งหมดตรงกับปฏิทิน</h3></div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4 bg-amber-50 text-amber-700 text-[10px] p-3 rounded-xl border border-amber-200">
                                    <CalendarDays className="w-4 h-4 shrink-0" /><span>พบรายงานผลที่ <strong>ไม่มีในปฏิทินออกหน่วย</strong> จำนวน <strong>{fUnsch.length}</strong> แห่ง</span>
                                </div>
                                {fUnsch.map((item, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-500" /> {item.location}</h4>
                                        </div>
                                        <div className="flex flex-col divide-y divide-slate-100">
                                            {item.reports.map((rep: any, eIdx: number) => (
                                                <div key={eIdx} onClick={() => onSelectDate(rep.date)} className="p-3.5 flex justify-between gap-3 cursor-pointer hover:bg-amber-50">
                                                    <div className="flex gap-4">
                                                        <div className="text-amber-600 font-bold text-[11px]">{rep.date}</div>
                                                            <div className="text-[10px] text-slate-600">
                                                                เขต: {rep.district || '-'} | หน่วย: {rep.unit || '-'} | ทีม: {rep.team || '-'}
                                                            </div>
                                                    </div>  
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* TAB 4: Mismatch */}
                    {activeTab === 'mismatch' && (
                        fMis.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-emerald-500"><CheckCircle className="w-12 h-12 mb-3 text-emerald-300" /><h3 className="font-bold text-sm">ข้อมูลตรงกันทั้งหมด</h3></div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4 bg-orange-50 text-orange-700 text-[10px] p-3 rounded-xl border border-orange-200">
                                    <AlertTriangle className="w-4 h-4 shrink-0" /><span>พบข้อมูล <strong>ระบุรายละเอียดขัดแย้งกัน</strong> จำนวน <strong>{fMis.length}</strong> แห่ง</span>
                                </div>
                                {fMis.map((item, idx) => (
                                    <div key={idx} onClick={() => onSelectDate(item.date)} className="bg-white border border-orange-200 rounded-xl overflow-hidden shadow-sm cursor-pointer hover:bg-orange-50 transition-colors">
                                        <div className="px-4 py-3 bg-orange-50/50 border-b border-orange-100 flex justify-between items-center">
                                            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" /> {item.date} - {item.location}</h4>
                                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-[10px] font-bold">ขัดแย้ง: {item.mismatchFields.join(', ')}</span>
                                        </div>
                                            <div className="p-3.5 text-[11px] grid grid-cols-2 gap-4">
                                                <div className="border-r border-orange-100 pr-4">
                                                <div className="font-bold text-slate-500 mb-1">ฝั่งปฏิทิน (Dispatch)</div>
                                                <div className="truncate"><span className="font-medium text-slate-400">เขต:</span> {item.dispatch.district || '-'}</div>
                                                <div className="truncate"><span className="font-medium text-slate-400">หน่วย:</span> {item.dispatch.title || item.dispatch.unit || item.dispatch.unitName || '-'}</div>
                                                <div className="truncate"><span className="font-medium text-slate-400">ทีม:</span> {item.dispatch.team || '-'}</div>
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-500 mb-1">ฝั่งลงยอด (Report)</div>
                                                <div className="truncate"><span className="font-medium text-slate-400">เขต:</span> {item.report.district || '-'}</div>
                                                <div className="truncate"><span className="font-medium text-slate-400">หน่วย:</span> {item.report.unit || '-'}</div>
                                                <div className="truncate"><span className="font-medium text-slate-400">ทีม:</span> {item.report.team || '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                    {activeTab === 'no-map' && (
                        fNoMap.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-emerald-500"><CheckCircle className="w-12 h-12 mb-3 text-emerald-300" /><h3 className="font-bold text-sm">ข้อมูลแผนที่และพิกัดครบถ้วนทั้งหมด</h3></div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4 bg-purple-50 text-purple-700 text-[10px] p-3 rounded-xl border border-purple-200">
                                    <MapPin className="w-4 h-4 shrink-0" /><span>พบปฏิทินที่ <strong>ไม่มีลิงก์ Google Map หรือพิกัด</strong> จำนวน <strong>{fNoMap.length}</strong> แห่ง</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {fNoMap.map((evt: any, idx: number) => (
                                        <div key={idx} onClick={() => onSelectDate(evt.date)} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 hover:shadow-md transition-all flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <span className="text-purple-600 font-bold text-[11px]">{evt.date}</span>
                                                <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-bold">ไม่มีพิกัด</span>
                                            </div>
                                            <h4 className="font-bold text-[11px] text-slate-800 flex items-start gap-1.5 mt-1">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                                <span className="line-clamp-2">{evt.location || 'ไม่ระบุสถานที่'}</span>
                                            </h4>
                                            <div className="text-[10px] text-slate-500 mt-auto pt-3 border-t border-slate-100/80">
                                                เขต: {evt.district || '-'} | หน่วย: {evt.unit || evt.unitName || evt.title || '-'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

// ==========================================
// Component: ReportsPage (หน้าต่างรายงานและกราฟ)
// ==========================================
const ReportsPage: React.FC<{ events: EventData[], reports: any[] }> = ({ events, reports }) => {
    const outcomeStats = useMemo(() => {
        let dogTotal = 0;
        let catTotal = 0;
        
        (reports || []).forEach(r => {
            const d = r.details?.dog || {};
            const c = r.details?.cat || {};
            const toNum = (val: any) => parseInt(val, 10) || 0;
            
            dogTotal += (toNum(d.vaccine) + toNum(d.maleSterilize) + toNum(d.femaleSterilize) + toNum(d.microchip) + toNum(d.register) + toNum(d.medical));
            catTotal += (toNum(c.vaccine) + toNum(c.maleSterilize) + toNum(c.femaleSterilize) + toNum(c.microchip) + toNum(c.register) + toNum(c.medical));
        });
        
        return { dogTotal, catTotal };
    }, [reports]);
    const stats = useMemo(() => {
        const unitCount: Record<string, number> = {};
        const districtCount: Record<string, number> = {};
        const statusCount: Record<string, number> = {
            'เสร็จสิ้น': 0, 'กำลังดำเนินงาน': 0, 'รอปฏิบัติงาน': 0, 'ยกเลิก': 0
        };
        const monthCount: Record<string, number> = {};
        const typeCount: Record<string, number> = {};
        const teamCount: Record<string, number> = {};
        const dayOfWeekCount: Record<string, number> = {
            'อาทิตย์': 0, 'จันทร์': 0, 'อังคาร': 0, 'พุธ': 0, 'พฤหัสบดี': 0, 'ศุกร์': 0, 'เสาร์': 0
        };

        events.forEach(e => {
            // นับจำนวนตามหน่วยงาน
            const u = e.unit || e.unitName || e.title || 'ไม่ระบุ';
            unitCount[u] = (unitCount[u] || 0) + 1;

            // นับจำนวนตามเขตพื้นที่
            const d = e.district || 'ไม่ระบุเขต';
            districtCount[d] = (districtCount[d] || 0) + 1;

            // นับจำนวนตามสถานะ
            const st = getDispatchStatus(e)?.text || '';
            if (st.includes('เสร็จสิ้น') || st.includes('สิ้นสุด')) statusCount['เสร็จสิ้น']++;
            else if (st.includes('กำลังดำเนินงาน')) statusCount['กำลังดำเนินงาน']++;
            else if (st.includes('ยกเลิก')) statusCount['ยกเลิก']++;
            else statusCount['รอปฏิบัติงาน']++;

            // นับจำนวนรายเดือน (YYYY-MM) สำหรับกราฟเส้น
            if (e.date) {
                const monthKey = e.date.substring(0, 7); 
                monthCount[monthKey] = (monthCount[monthKey] || 0) + 1;

                // 🌟 ส่วนที่เพิ่ม: หาวันในสัปดาห์
                const dateObj = new Date(e.date);
                const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
                const dayName = days[dateObj.getDay()];
                if(dayName) dayOfWeekCount[dayName]++;
            }

            // นับตามประเภทงาน สำหรับกราฟโดนัท
            let typeKey = 'ทั่วไป/อื่นๆ';
            const titleStr = (e.title || '').toLowerCase();
            if (titleStr.includes('วัคซีน') || titleStr.includes('ไมโครชิป')) typeKey = 'วัคซีน/ไมโครชิป';
            else if (titleStr.includes('ทำหมัน')) typeKey = 'หน่วยทำหมัน';
            else if (titleStr.includes('สัตวแพทย์')) typeKey = 'หน่วยสัตวแพทย์';
            else if (titleStr.includes('กรงแมว')) typeKey = 'กรงแมว';
            else if (titleStr.includes('ผู้ว่า')) typeKey = 'หน่วยผู้ว่าฯ';

            typeCount[typeKey] = (typeCount[typeKey] || 0) + 1;
            const team = e.team?.trim() || 'ไม่ระบุทีม';
            teamCount[team] = (teamCount[team] || 0) + 1;
        });

        const unitData = Object.keys(unitCount).map(k => ({ name: k, value: unitCount[k] })).sort((a, b) => b.value - a.value).slice(0, 10);
        const districtData = Object.keys(districtCount).map(k => ({ name: k, value: districtCount[k] })).sort((a, b) => b.value - a.value).slice(0, 10);
        const statusData = Object.keys(statusCount).map(k => ({ name: k, value: statusCount[k] }));
        const monthData = Object.keys(monthCount).sort().map(k => ({ name: k, value: monthCount[k] }));
        const typeData = Object.keys(typeCount).map(k => ({ name: k, value: typeCount[k] })).sort((a, b) => b.value - a.value);
        const teamData = Object.keys(teamCount).map(k => ({ name: k, value: teamCount[k] })).sort((a, b) => b.value - a.value).slice(0, 10);
        const dayOfWeekData = Object.keys(dayOfWeekCount).map(k => ({ name: k, value: dayOfWeekCount[k] }));

        return { unitData, districtData, statusData, monthData, typeData, teamData, dayOfWeekData, total: events.length };
    }, [events]);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6', '#f43f5e', '#f97316', '#14b8a6'];
    const STATUS_COLORS: Record<string, string> = { 'เสร็จสิ้น': '#10b981', 'กำลังดำเนินงาน': '#3b82f6', 'รอปฏิบัติงาน': '#f59e0b', 'ยกเลิก': '#f43f5e' };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Header KPI */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h2 className="text-lg font-black text-slate-800">ภาพรวมรายงานและสถิติ</h2>
                    <p className="text-[10px] text-slate-500 font-medium">สรุปข้อมูลการออกหน่วยสัตวแพทย์ทั้งหมดในระบบ</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-indigo-50 px-6 py-3.5 rounded-2xl border border-indigo-100 text-center min-w-[140px] flex flex-col justify-center shadow-sm">
                        <div className="text-[10px] font-bold text-indigo-500 mb-1">จำนวนงานทั้งหมด</div>
                        <div className="text-3xl font-black text-indigo-700 leading-none">{stats.total}</div>
                    </div>
                    
                    <div className="bg-blue-50 px-5 py-3.5 rounded-2xl border border-blue-100 min-w-[160px] flex items-center gap-4 shadow-sm">
                        <div className="text-3xl drop-shadow-sm">🐶</div>
                        <div className="text-right flex-1">
                            <div className="text-[10px] font-bold text-blue-500 mb-1">ให้บริการสุนัข</div>
                            <div className="text-xl font-black text-blue-700 leading-none">
                                {outcomeStats.dogTotal.toLocaleString()} <span className="text-[10px]">ตัว</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-rose-50 px-5 py-3.5 rounded-2xl border border-rose-100 min-w-[160px] flex items-center gap-4 shadow-sm">
                        <div className="text-3xl drop-shadow-sm">🐱</div>
                        <div className="text-right flex-1">
                            <div className="text-[10px] font-bold text-rose-500 mb-1">ให้บริการแมว</div>
                            <div className="text-xl font-black text-rose-700 leading-none">
                                {outcomeStats.catTotal.toLocaleString()} <span className="text-[10px]">ตัว</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. กราฟวงกลม: สถานะการดำเนินงาน */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-500"/> สัดส่วนสถานะงาน</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {stats.statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. กราฟโดนัท: สัดส่วนประเภทกิจกรรม */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-purple-500"/> สัดส่วนประเภทกิจกรรม</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                                    {stats.typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. กราฟเส้น: แนวโน้มปริมาณงานรายเดือน */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500"/> แนวโน้มปริมาณงาน (รายเดือน)</h3>
                    <div className="h-[250px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.monthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#2563eb' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. กราฟแท่ง: ปริมาณงานรายเขต */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-500"/> พื้นที่ให้บริการสูงสุด (Top 10 เขต)</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.districtData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#475569', fontWeight: 'bold' }} axisLine={false} tickLine={false} width={80} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#f43f5e" radius={[0, 6, 6, 0]} barSize={16}>
                                    {stats.districtData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. กราฟแท่ง: ปริมาณงานรายหน่วย */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-emerald-500"/> ปริมาณงานแบ่งตามหน่วย (Top 10 หน่วย)</h3>
                    <div className="h-[250px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.unitData} margin={{ top: 20, right: 10, left: -20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-teal-500"/> วันที่ออกปฏิบัติงานบ่อยที่สุด</h3>
                    <div className="h-[250px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.dayOfWeekData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#14b8a6" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

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

    const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
    const [filterDistrict, setFilterDistrict] = useState<string>('ทั้งหมด');
    const [filterUnit, setFilterUnit] = useState<string>('ทั้งหมด');
    const [filterStatus, setFilterStatus] = useState<string>('ทั้งหมด');
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');

    const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const [activeMenu, setActiveMenu] = useState<'dashboard' | 'calendar' | 'activities' | 'settings' | 'reports'>('dashboard');

    const [isSettingsExpanded, setIsSettingsExpanded] = useState<boolean>(false);
    const [activeSettingsTab, setActiveSettingsTab] = useState<string>('profile');

    const [isActivitiesExpanded, setIsActivitiesExpanded] = useState<boolean>(false);
    const [activeActivityTab, setActiveActivityTab] = useState<string>('all');
    
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(0.3); 
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const socket = io(BASE_URL);

        socket.on('server_data_update', (payload: any) => {
            if (payload.type === 'REPORT_ADDED') {
                setReports(prev => [payload.data, ...prev]);
            } else if (payload.type === 'REPORT_UPDATED') {
                setReports(prev => prev.map(r => r._id === payload.data._id ? payload.data : r));
            } else if (payload.type === 'REPORT_DELETED') {
                setReports(prev => prev.filter(r => r._id !== payload.id));
            } else if (payload.type === 'DISPATCH_ADDED') {
                setEvents(prev => [...prev, { ...payload.data, type: 'dispatch', originalData: payload.data }]);
            } else if (payload.type === 'DISPATCH_UPDATED') {
                setEvents(prev => prev.map(e => e._id === payload.data._id ? { ...payload.data, type: 'dispatch', originalData: payload.data } : e));
            } else if (payload.type === 'DISPATCH_DELETED') {
                setEvents(prev => prev.filter(e => e._id !== payload.id));
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const activitiesCounts = useMemo(() => {
        let pending = 0;
        let inProgress = 0;
        let history = 0;
    
        events.forEach(e => {
            const st = getDispatchStatus(e)?.text;
            if (st === 'เตรียมพร้อม' || st === 'รอปฏิบัติงาน') pending++;
            else if (st === 'กำลังดำเนินงาน') inProgress++;
            else if (st === 'เสร็จสิ้น (Manual)' || st === 'สิ้นสุดปฏิบัติงาน' || st === 'ยกเลิก') history++;
        });
    
        return { all: events.length, pending, inProgress, history };
    }, [events]);;

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

    const filterOptions = useMemo(() => {
        const districts = new Set<string>();
        const units = new Set<string>();
        events.forEach(e => {
            if (e.district) districts.add(e.district);
            if (e.unit) units.add(e.unit);
            else if (e.unitName) units.add(e.unitName);
        });
        return {
            districts: ['ทั้งหมด', ...Array.from(districts).sort()],
            units: ['ทั้งหมด', ...Array.from(units).sort()],
            statuses: ['ทั้งหมด', 'รอปฏิบัติงาน', 'กำลังดำเนินงาน', 'เสร็จสิ้น', 'ยกเลิก']
        };
    }, [events]);

    const displayEvents = useMemo(() => {
        return events.filter(e => {
            // ค้นหาข้อความ
            const matchSearch = !deferredSearchTerm || 
                e.location?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) || 
                e.title?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
                e.team?.toLowerCase().includes(deferredSearchTerm.toLowerCase());
        
            // กรองประเภท
            const baseType = getBaseType(e.title, e.type);
            const matchType = selectedType === 'ทุกประเภท' || baseType === selectedType;

            // ฟิลเตอร์ใหม่
            const matchDistrict = filterDistrict === 'ทั้งหมด' || e.district === filterDistrict;
            const matchUnit = filterUnit === 'ทั้งหมด' || (e.unit || e.unitName) === filterUnit;
            
            const st = getDispatchStatus(e)?.text || '';
            const matchStatus = filterStatus === 'ทั้งหมด' || st.includes(filterStatus);

            const matchDate = (!filterStartDate || e.date >= filterStartDate) && (!filterEndDate || e.date <= filterEndDate);

            return matchSearch && matchType && matchDistrict && matchUnit && matchStatus && matchDate;
        });
    }, [events, deferredSearchTerm, selectedType, filterDistrict, filterUnit, filterStatus, filterStartDate, filterEndDate]);

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
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState<boolean>(false);
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

    const handleNavigateFromDuplicate = (dateStr: string) => {
        playSound('pop');
        const targetDate = new Date(dateStr);
        setCurrentDate(targetDate);
        setSelectedDate(targetDate);
        setActiveMenu('calendar');
        setIsDuplicateModalOpen(false);
    };

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
                <aside 
                    className={`flex-col text-white transition-all duration-300 shadow-xl z-50 fixed inset-y-0 left-0 lg:relative ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:flex w-[260px] shrink-0`}
                    style={{
                        backgroundImage: "linear-gradient(rgba(49, 32, 105, 0.85), rgba(49, 32, 105, 0.95)), url('https://img.magnific.com/free-photo/cute-cat-studio_23-2150932393.jpg?semt=ais_hybrid&w=740&q=80')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
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
                        <div className="flex flex-col gap-1">
                            <button 
                                onClick={() => { 
                                    playSound('switch'); 
                                    setActiveMenu('activities'); 
                                    setIsActivitiesExpanded(!isActivitiesExpanded);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-[10px] transition-all border ${activeMenu === 'activities' ? 'bg-[#44308a] text-white shadow-sm border-[#5a42b1]' : 'text-white/70 hover:bg-white/5 hover:text-white border-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Activity className={`w-4 h-4 ${activeMenu === 'activities' ? 'text-indigo-300' : ''}`} /> กิจกรรม
                                </div>
                                <div className="flex items-center gap-2">
                                    {activitiesCounts.pending > 0 && (
                                        <span className="bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                                            {activitiesCounts.pending}
                                        </span>
                                    )}
                                    {isActivitiesExpanded ? <ChevronDown className="w-4 h-4 text-white/50" /> : <ChevronRight className="w-4 h-4 text-white/50" />}
                                </div>
                            </button>

                            {/* Sub-menus ที่จะกางออกมา */}
                            {isActivitiesExpanded && (
                                <div className="pl-4 pr-2 py-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                    <div className="text-[8px] font-bold text-indigo-300/70 mb-1 mt-2 px-2 uppercase tracking-wider">สถานะการดำเนินงาน</div>
                                    <button onClick={() => { playSound('pop'); setActiveMenu('activities'); setActiveActivityTab('all'); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[9px] font-bold transition-colors ${activeActivityTab === 'all' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                                        <span className="flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> กิจกรรมทั้งหมด</span>
                                        <span className="text-[8px] bg-white/10 px-1.5 rounded-md text-white">{activitiesCounts.all}</span>
                                    </button>

                                    <button onClick={() => { playSound('pop'); setActiveMenu('activities'); setActiveActivityTab('pending'); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[9px] font-bold transition-colors ${activeActivityTab === 'pending' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                                        <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> คำขอรอดำเนินการ</span>
                                        {activitiesCounts.pending > 0 && <span className="text-[8px] bg-white/10 px-1.5 rounded-md text-white">{activitiesCounts.pending}</span>}
                                    </button>
                                    
                                    <button onClick={() => { playSound('pop'); setActiveMenu('activities'); setActiveActivityTab('in-progress'); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[9px] font-bold transition-colors ${activeActivityTab === 'in-progress' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                                        <span className="flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> กำลังดำเนินการ</span>
                                        {activitiesCounts.inProgress > 0 && <span className="text-[8px] bg-white/10 px-1.5 rounded-md text-white">{activitiesCounts.inProgress}</span>}
                                    </button>
                                    
                                    <button onClick={() => { playSound('pop'); setActiveMenu('activities'); setActiveActivityTab('history'); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[9px] font-bold transition-colors ${activeActivityTab === 'history' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                                        <span className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5" /> ประวัติกิจกรรม</span>
                                        {activitiesCounts.history > 0 && <span className="text-[8px] bg-white/10 px-1.5 rounded-md text-white">{activitiesCounts.history}</span>}
                                    </button>

                                    <div className="text-[8px] font-bold text-indigo-300/70 mb-1 mt-3 px-2 uppercase tracking-wider">ประเภทหน่วย</div>
                                        {[
                                            { id: 'all', label: 'ทุกหน่วย', icon: '🏢' },
                                            { id: 'vet-unit', label: 'หน่วยสัตวแพทย์', icon: '🏥' },
                                            { id: 'spay', label: 'หน่วยทำหมัน', icon: '✂️' },
                                            { id: 'vaccine', label: 'หน่วยวัคซีน + ไมโครชิป', icon: '💉' },
                                            { id: 'governor', label: 'หน่วยผู้ว่า', icon: '👔' },
                                            { id: 'cat-cage', label: 'หน่วยกรงแมว', icon: '🐱' }
                                        ].map((item) => (
                                        <button 
                                            key={item.id}
                                            onClick={() => { playSound('pop'); setActiveMenu('activities'); setActiveActivityTab(item.id); }} 
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[9px] font-bold transition-colors ${activeActivityTab === item.id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                        >
                                            <span>{item.icon} {item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => { playSound('switch'); setActiveMenu('reports'); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[10px] transition-all border ${activeMenu === 'reports' ? 'bg-[#44308a] text-white shadow-sm border-[#5a42b1]' : 'text-white/70 hover:bg-white/5 hover:text-white border-transparent'}`}>
                            <FileText className={`w-4 h-4 ${activeMenu === 'reports' ? 'text-indigo-300' : ''}`} /> สถิติและกราฟ
                        </button>
                        <div className="flex flex-col gap-1">
                            <button 
                                onClick={() => { 
                                    playSound('switch'); 
                                    setActiveMenu('settings'); 
                                    setIsSettingsExpanded(!isSettingsExpanded);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-[10px] transition-all border ${activeMenu === 'settings' ? 'bg-[#44308a] text-white shadow-sm border-[#5a42b1]' : 'text-white/70 hover:bg-white/5 hover:text-white border-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Settings className={`w-4 h-4 ${activeMenu === 'settings' ? 'text-indigo-300' : ''}`} /> ตั้งค่า
                                </div>
                                <div className="flex items-center gap-2">
                                    {isSettingsExpanded ? <ChevronDown className="w-4 h-4 text-white/50" /> : <ChevronRight className="w-4 h-4 text-white/50" />}
                                </div>
                            </button>

                            {/* Sub-menus Settings ที่จะกางออกมา */}
                            {isSettingsExpanded && (
                                <div className="pl-4 pr-2 py-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                    {[
                                        { id: 'profile', label: 'ตั้งค่าโปรไฟล์', icon: User },
                                        { id: 'permissions', label: 'จัดการสิทธิ์ผู้ใช้งาน', icon: Shield },
                                        { id: 'master-data', label: 'จัดการข้อมูลพื้นฐาน', icon: Database },
                                        { id: 'announcements', label: 'ตั้งค่าประกาศระบบ', icon: Megaphone },
                                        { id: 'preferences', label: 'ตั้งค่าการแสดงผล', icon: Smartphone }
                                    ].map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <button 
                                                key={item.id}
                                                onClick={() => { 
                                                    playSound('pop'); 
                                                    setActiveMenu('settings'); 
                                                    setActiveSettingsTab(item.id); 

                                                    if (item.id === 'announcements') {
                                                        setIsAnnouncementModalOpen(true);
                                                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                                    }
                                                }} 
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-bold transition-colors ${(activeSettingsTab === item.id && activeMenu === 'settings' && item.id !== 'announcements') ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                            >
                                                <Icon className="w-3.5 h-3.5" /> {item.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {canEdit && (
                            <div className="xl:hidden pt-4 mt-4 border-t border-white/10 space-y-1.5">
                                <div className="px-4 pb-1 text-[8px] font-bold text-indigo-300 uppercase tracking-wider">สำหรับผู้ดูแลระบบ</div>
                                <button 
                                    onClick={() => { playSound('pop'); setIsDuplicateModalOpen(true); setIsSidebarOpen(false); }} 
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-amber-400 hover:bg-white/5 rounded-xl font-bold text-[10px] transition-all"
                                >
                                    <Copy className="w-4 h-4" /> ตรวจสอบข้อมูลซ้ำ
                                </button>
                                <button 
                                    onClick={() => { playSound('pop'); setIsAddControllerOpen(true); setIsSidebarOpen(false); }} 
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-emerald-400 hover:bg-white/5 rounded-xl font-bold text-[10px] transition-all"
                                >
                                    <UserPlus className="w-4 h-4" /> เพิ่มผู้ควบคุม
                                </button>
                                <button 
                                    onClick={() => { playSound('pop'); setIsManageStaffOpen(true); setIsSidebarOpen(false); }} 
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-blue-400 hover:bg-white/5 rounded-xl font-bold text-[10px] transition-all"
                                >
                                    <Users className="w-4 h-4" /> จัดการทีมงาน
                                </button>
                                <button 
                                    onClick={() => { playSound('pop'); openDispatchForm(); setIsSidebarOpen(false); }} 
                                    className="w-full flex items-center gap-3 px-4 py-2.5 mt-2 text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-[10px] shadow-sm transition-all"
                                >
                                    <Plus className="w-4 h-4" /> เพิ่มงานใหม่
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-4 shrink-0">
                        <div className="bg-white/5 rounded-2xl p-3 mb-4 border border-white/10 flex flex-col gap-2 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-indigo-200 flex items-center gap-2">
                                    {isPlaying ? <Volume2 className="w-4 h-4 text-indigo-300" /> : <VolumeX className="w-4 h-4 text-white/40" />}
                                    เสียงพื้นหลัง
                                </span>
                                <button
                                    onClick={togglePlay}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-colors shadow-sm border ${
                                        isPlaying 
                                        ? 'bg-indigo-500/40 text-white border-indigo-400/50' 
                                        : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'
                                    }`}
                                    title={isPlaying ? "ปิดเสียง" : "เปิดเสียง"}
                                >
                                    {isPlaying ? 'ปิด' : 'เปิด'}
                                </button>
                            </div>
                            {isPlaying && (
                                <div className="px-1 mt-1 flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                                    <input
                                        type="range" min="0" max="1" step="0.05" value={volume} onChange={handleVolumeChange}
                                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                                    />
                                </div>
                            )}
                        </div>
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
                <div 
                className="flex-1 flex flex-col overflow-hidden relative"
                style={{
                    backgroundImage: "url('https://img.freepik.com/premium-vector/cute-cartoon-cats-adorable-kittens-with-big-eyes-pink-background_1305385-77191.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-[#F5F6FA]/80 backdrop-blur-sm pointer-events-none z-0"></div>
                
                {/* Topbar */}
                <header className="relative h-[76px] bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300">                   
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
                                    สวัสดี, {user ? (user.fullName || user.username) : 'ผู้เยี่ยมชม'} 👋
                                </h2>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">ยินดีต้อนรับสู่ระบบปฏิทินออกหน่วยสัตวแพทย์เคลื่อนที่</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <RealTimeClock />
                            
                            <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>

                            {canEdit && (
                                <div className="hidden xl:flex items-center gap-2 mr-2">
                                    <button onClick={() => { playSound('pop'); setIsDuplicateModalOpen(true); }} className="px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl font-bold transition-all text-[10px] shadow-sm flex items-center gap-1.5 border border-amber-200">
                                        <Copy className="w-3.5 h-3.5"/> ข้อมูลซ้ำ
                                    </button>
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
                                        <div className="text-[10px] font-bold text-slate-700 leading-tight">{user.fullName || user.username}</div>
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
                    <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 custom-scrollbar relative z-10">
                        
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
                                            <div className="flex flex-col gap-3">
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
                                                    <button 
                                                        onClick={() => { playSound('pop'); setShowAdvancedFilters(!showAdvancedFilters); }}
                                                        className={`w-full sm:w-auto px-4 py-3 border rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 text-[10px] font-bold ${showAdvancedFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                                    >
                                                        <Settings className="w-4 h-4" /> ฟิลเตอร์เพิ่มเติม
                                                    </button>
                                                </div>

                                                {showAdvancedFilters && (
                                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in slide-in-from-top-2">
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 mb-1">เขต/พื้นที่</label>
                                                            <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} className="w-full p-2.5 bg-white rounded-lg text-[10px] border border-slate-200 outline-none focus:border-indigo-400">
                                                                {filterOptions.districts.map(d => <option key={d} value={d}>{d}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 mb-1">หน่วยงาน</label>
                                                            <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)} className="w-full p-2.5 bg-white rounded-lg text-[10px] border border-slate-200 outline-none focus:border-indigo-400">
                                                                {filterOptions.units.map(u => <option key={u} value={u}>{u}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 mb-1">สถานะ</label>
                                                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full p-2.5 bg-white rounded-lg text-[10px] border border-slate-200 outline-none focus:border-indigo-400">
                                                                {filterOptions.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 mb-1">ตั้งแต่วันที่</label>
                                                            <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-full p-2.5 bg-white rounded-lg text-[10px] border border-slate-200 outline-none focus:border-indigo-400" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 mb-1">ถึงวันที่</label>
                                                            <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-full p-2.5 bg-white rounded-lg text-[10px] border border-slate-200 outline-none focus:border-indigo-400" />
                                                        </div>
                                                        
                                                        {(filterDistrict !== 'ทั้งหมด' || filterUnit !== 'ทั้งหมด' || filterStatus !== 'ทั้งหมด' || filterStartDate || filterEndDate) && (
                                                            <div className="col-span-2 md:col-span-5 flex justify-end mt-1">
                                                                <button 
                                                                    onClick={() => { setFilterDistrict('ทั้งหมด'); setFilterUnit('ทั้งหมด'); setFilterStatus('ทั้งหมด'); setFilterStartDate(''); setFilterEndDate(''); }} 
                                                                    className="text-[9px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1"
                                                                >
                                                                    <X className="w-3 h-3" /> ล้างฟิลเตอร์ทั้งหมด
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
                                            <div className="space-y-4 pb-4 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
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
                                                        const isRecorded = reports.some(r => r.date === evt.date && r.location?.trim() === evt.location?.trim());
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
                            <div className="bg-white rounded-3xl p-5 lg:p-8 shadow-sm border border-slate-100 flex flex-col min-h-[700px] h-fit animate-in fade-in duration-300">
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
                            <div className="min-h-full h-auto pb-10">
                                <ActivityPage events={events} activeCategory={activeActivityTab} />
                            </div>
                        )}

                        {/* ===================== หน้าตั้งค่า (Settings) ===================== */}
                        {activeMenu === 'settings' && activeSettingsTab !== 'announcements' && (
                            <SettingsPage activeTab={activeSettingsTab} user={user} token={getCurrentToken()} addToast={addToast} />
                        )}

                        {/* ===================== หน้ารายงาน (Reports) ===================== */}
                        {activeMenu === 'reports' && (
                            <div className="min-h-full h-auto pb-10">
                                <ReportsPage events={events} reports={reports} />
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
            <DuplicateCheckModal 
                isOpen={isDuplicateModalOpen} 
                onClose={() => setIsDuplicateModalOpen(false)} 
                events={events} 
                reports={reports}
                onSelectDate={handleNavigateFromDuplicate}
            />
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