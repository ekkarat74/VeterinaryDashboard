import React, { useState, useEffect, useMemo } from 'react';
import { 
    CalendarDays, X, Plus, Clock, Users, CheckCircle, ChevronLeft, ChevronRight, Calendar, Search, Phone, MapPin,
    Unlock, LogOut
} from 'lucide-react';
import DispatchModal from './modals/DispatchModal.jsx'; 
import LoginModal from './modals/LoginModal.jsx';
import ToastContainer from '../path/to/ToastContainer.jsx';

// ==========================================
// 1. Shared Components
// ==========================================
const StatCard = ({ label, value, colorClass, bgClass, icon: Icon }) => (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all duration-300">
        <div>
            <div className="text-slate-500 text-[11px] sm:text-xs font-bold mb-1">{label}</div>
            <div className={`text-xl sm:text-2xl font-black tracking-tight ${colorClass}`}>{value}</div>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${bgClass} transition-transform group-hover:scale-110 duration-300 shrink-0`}>
            {Icon && <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorClass}`} />}
        </div>
    </div>
);

const getDispatchStatus = (evt) => {
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

const getBaseType = (title, type) => {
    let t = title || (type === 'meeting' ? 'นัดหมายประชุม' : 'ออกหน่วย');
    if (t === 'นัดหมายประชุม') return t;
    t = t.replace(/\s*\(.*?\)/g, '');
    t = t.replace(/\s+(ทีม|สาย)?\s*[A-Za-zก-ฮ0-9]$/i, '');
    return t.trim() || 'ออกหน่วย';
};

// ==========================================
// 2. Main Component (Standalone Page)
// ==========================================
const DispatchCalendarDashboard = () => {
    const [events, setEvents] = useState([]);
    const [user, setUser] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('ทุกประเภท');

    const BASE_URL = 'https://veterinarydashboard-hwho.onrender.com';
    
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('vet_user', JSON.stringify(userData));
        setIsLoginModalOpen(false);
        addToast('success', 'เข้าสู่ระบบสำเร็จ');
    };

    const handleLogout = () => {
        if (window.confirm("ยืนยันการออกจากระบบ?")) {
            setUser(null);
            localStorage.removeItem('vet_user');
            addToast('info', 'ออกจากระบบแล้ว');
        }
    };

    // State สำหรับ Modal เพิ่ม/แก้ไขงาน
    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
    const [viewingDispatch, setViewingDispatch] = useState(null);
    const [toasts, setToasts] = useState([]);

    const addToast = (type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
    };
    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    // ตรวจสอบสิทธิ์ User
    useEffect(() => {
        const storedUser = localStorage.getItem('vet_user');
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);
    
    const canEdit = user && ['Developer', 'MagaAdmin', 'admin'].includes(user.role);
    const canViewHidden = user && ['Developer', 'MagaAdmin', 'admin', 'executive'].includes(user.role);

    // ดึงข้อมูล API ด้วยตัวเองเมื่อโหลดหน้าเว็บ
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/dispatches`);
                const data = await res.json();
                
                // กรองข้อมูลตามสิทธิ์
                const filtered = canViewHidden ? data : data.filter(d => d.isVisibleToPublic !== false);
                const mappedEvents = filtered.map(d => ({ ...d, type: 'dispatch', originalData: d }));
                setEvents(mappedEvents);
            } catch (error) {
                console.error("Fetch Data Error", error);
            }
        };
        fetchData();
    }, [canViewHidden, BASE_URL]);

    // ฟังก์ชันจัดการ Modal แผนงาน
    const openDispatchForm = () => { setViewingDispatch(null); setIsDispatchModalOpen(true); };
    const openDispatchEvent = (evt) => { 
        if (canEdit) {
            setViewingDispatch(evt.originalData); 
            setIsDispatchModalOpen(true); 
        }
    };

    const handleSaveDispatchEvent = async (payload) => {
        try {
            const method = payload._id ? 'PUT' : 'POST';
            const url = payload._id ? `${BASE_URL}/api/dispatches/${payload._id}` : `${BASE_URL}/api/dispatches`;
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                addToast('success', payload._id ? 'แก้ไขแผนงานเรียบร้อย' : 'บันทึกแผนงานเรียบร้อย');
                setIsDispatchModalOpen(false);
                // โหลดข้อมูลใหม่
                const fetchRes = await fetch(`${BASE_URL}/api/dispatches`);
                const data = await fetchRes.json();
                const filtered = canViewHidden ? data : data.filter(d => d.isVisibleToPublic !== false);
                setEvents(filtered.map(d => ({ ...d, type: 'dispatch', originalData: d })));
            } else {
                const err = await res.json();
                addToast('error', `บันทึกไม่สำเร็จ: ${err.message}`);
            }
        } catch (error) {
            addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const handleDeleteDispatch = async (id) => {
        if (!window.confirm('ยืนยันลบแผนงานนี้?')) return;
        try {
            const res = await fetch(`${BASE_URL}/api/dispatches/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                addToast('success', 'ลบแผนงานเรียบร้อย');
                setIsDispatchModalOpen(false);
                setEvents(prev => prev.filter(e => e._id !== id));
            }
        } catch (error) {
            addToast('error', 'ลบไม่สำเร็จ');
        }
    };

    const toLocalISOString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const changeMonth = (offset) => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + offset)));

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const daysArray = [...Array(daysInMonth + firstDay).keys()];

    const eventTypes = useMemo(() => {
        const counts = { 'ทุกประเภท': events.length };
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

    const selectedDateEvents = displayEvents.filter(e => e.date === toLocalISOString(selectedDate));
    const totalEvents = displayEvents.length;
    const upcomingEvents = displayEvents.filter(e => e.date >= toLocalISOString(new Date())).length;
    const todayEventsCount = displayEvents.filter(e => e.date === toLocalISOString(new Date())).length;
    const publicEventsCount = displayEvents.filter(e => e.isVisibleToPublic !== false).length;

    const theme = { primary: 'bg-indigo-600', text: 'text-indigo-600' };

    const getEventStyles = (evt) => {
        if (evt.type === 'meeting') return { border: 'border-l-teal-400', bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-400' };
        const colorMap = {
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
        return colorMap[evt.unitColor] || colorMap['default'];
    };

    return (
        <div className="w-full h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
            
            {/* Header (Top Bar) - Full Width */}
            <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-200 shadow-sm z-20 shrink-0 w-full">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-sm border border-indigo-100">
                        <Calendar className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">ตารางแผนงานออกหน่วย</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Dispatch Dashboard & Planning</p>
                    </div>
                </div>

                {/* ✨ แก้ไขบล็อกนี้เพื่อแสดงปุ่ม Login/Logout */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-2 py-1.5 rounded-xl">
                            <div className="hidden sm:flex flex-col items-end px-2">
                                <span className="text-sm font-bold text-slate-800">{user.username}</span>
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{user.role}</span>
                            </div>
                            <button onClick={handleLogout} className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all shadow-sm border border-slate-200" title="ออกจากระบบ">
                                <LogOut className="w-4 h-4"/>
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsLoginModalOpen(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-sm shadow-sm flex items-center gap-2">
                            <Unlock className="w-4 h-4"/> เข้าสู่ระบบ
                        </button>
                    )}
                    
                    <div className="w-px h-8 bg-slate-200 mx-1"></div>
                    
                    <button onClick={() => window.close()} className="px-4 py-2 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded-xl font-bold transition-all text-sm shadow-sm flex items-center gap-2">
                        <X className="w-4 h-4"/> ปิดหน้าต่างนี้
                    </button>
                </div>
            </div>

            {/* Content Body - Split 2 Columns */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full">
                
                {/* Left Sidebar (Calendar & Stats) - Fixed Width */}
                <div className="w-full lg:w-[420px] xl:w-[450px] p-6 flex flex-col h-full overflow-y-auto border-r border-slate-200/80 bg-slate-50 shrink-0 custom-scrollbar">
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <StatCard label="งานทั้งหมด" value={totalEvents} colorClass="text-indigo-600" bgClass="bg-indigo-100/50" icon={CheckCircle} />
                        <StatCard label="วันนี้" value={todayEventsCount} colorClass="text-blue-500" bgClass="bg-blue-100/50" icon={Calendar} />
                        <StatCard label="รอบปฏิบัติ" value={upcomingEvents} colorClass="text-orange-500" bgClass="bg-orange-100/50" icon={Clock} />
                        <StatCard label="เผยแพร่" value={publicEventsCount} colorClass="text-emerald-500" bgClass="bg-emerald-100/50" icon={Users} />
                    </div>

                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex items-center bg-slate-50 rounded-lg border border-slate-100 p-1">
                                <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white rounded-md text-slate-500 transition-colors shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold text-indigo-600 hover:bg-white rounded-md transition-colors shadow-sm">วันนี้</button>
                                <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white rounded-md text-slate-500 transition-colors shadow-sm"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-3">
                            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d, i) => (
                                <div key={d} className={`text-center text-xs font-bold pb-2 ${i===0 || i===6 ? 'text-rose-500' : 'text-slate-400'}`}>{d}</div>
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

                                return (
                                    <div key={i} onClick={() => setSelectedDate(dObj)}
                                        className={`relative p-1.5 rounded-xl border cursor-pointer flex flex-col items-center justify-start gap-1.5 transition-all duration-200 bg-white
                                        ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md z-10 scale-105' : 'border-slate-100 hover:border-indigo-300 hover:bg-slate-50'}`}>
                                        <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all
                                            ${isToday ? 'bg-indigo-600 text-white shadow-md' : isSelected ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700'}`}>
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
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold"><div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div> วัคซีน</div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold"><div className="w-2.5 h-2.5 rounded-full bg-pink-400"></div> ทำหมัน</div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div> ตรวจสุขภาพ</div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold"><div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div> รักษา</div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold"><div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div> ด่วน</div>
                        </div>
                    </div>
                </div>

                {/* Right Panel (Event List) - Flexible Width */}
                <div className="flex-1 flex flex-col h-full overflow-hidden p-6 lg:p-8 bg-white min-w-0">
                    <div className="flex flex-col gap-6 overflow-y-auto h-full pr-2 custom-scrollbar">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-slate-800 text-2xl leading-tight">
                                    {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}
                                </h4>
                                <p className="text-slate-500 font-medium mt-1.5">
                                    มี {selectedDateEvents.length} กิจกรรม {selectedDateEvents.length > 0 && ` (แสดง ${selectedDateEvents.length})`}
                                </p>
                            </div>
                            {canEdit && (
                                <button onClick={openDispatchForm} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all hover:-translate-y-0.5">
                                    <Plus className="w-5 h-5" /> เพิ่มงานใหม่
                                </button>
                            )}
                        </div>

                        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input type="text" placeholder="ค้นหางาน โลเคชัน ทีม เบอร์โทร..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow font-medium text-slate-700 shadow-sm" />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2.5">
                                {eventTypes.map(([type, count]) => {
                                    const isSelected = selectedType === type;
                                    const getIcon = (t) => {
                                        if (t === 'ทุกประเภท') return '✨';
                                        if (t.includes('วัคซีน')) return '💉';
                                        if (t.includes('ทำหมัน')) return '✂️';
                                        if (t.includes('ตรวจสุขภาพ')) return '🩺';
                                        if (t.includes('รักษา')) return '💊';
                                        if (t.includes('ประชุม')) return '💼';
                                        return '📌';
                                    };
                                    return (
                                        <button key={type} onClick={() => setSelectedType(type)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 shadow-sm ${
                                                isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-500/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                            }`}>
                                            <span className="text-base leading-none">{getIcon(type)}</span>
                                            {type}
                                            <span className={`px-2 py-0.5 rounded-md text-xs ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            {selectedDateEvents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm border border-slate-100">
                                        <CalendarDays className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <span className="text-slate-600 font-bold text-xl mb-2">ไม่พบกิจกรรม</span>
                                    <span className="text-slate-400 text-sm font-medium">ไม่มีกำหนดการในวันนี้ คลิกปุ่ม "เพิ่มงานใหม่" เพื่อสร้างกำหนดการ</span>
                                </div>
                            ) : (
                                selectedDateEvents.map((evt, idx) => {
                                    const styles = getEventStyles(evt); 
                                    const status = getDispatchStatus(evt);
                                    let phoneNum = evt.controllerPhone;
                                    if (!phoneNum && evt.staff?.controllers?.[0]) {
                                        const splitData = evt.staff.controllers[0].split('โทร.');
                                        if (splitData.length > 1) phoneNum = splitData[1].trim();
                                    }

                                    return (
                                        <div key={idx} onClick={() => openDispatchEvent(evt)} className={`bg-white p-6 rounded-2xl border border-slate-200 border-l-[6px] ${styles.border} shadow-sm hover:shadow-md transition-all duration-300 ${canEdit ? 'cursor-pointer hover:-translate-y-1' : 'cursor-default'}`}>
                                            <div className="flex justify-between items-start gap-4 mb-4">
                                                <div className="flex flex-col gap-3 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2.5">
                                                        <span className="inline-flex items-center gap-1.5 text-sm bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold">
                                                            <Clock className="w-4 h-4 text-slate-400" /> {evt.time} - {evt.closingTime || '12:00'} 
                                                        </span>
                                                        <span className={`inline-flex items-center text-xs px-3 py-1.5 rounded-lg font-bold ${styles.bg} ${styles.text}`}>
                                                            {evt.title || (evt.type === 'meeting' ? 'นัดหมายประชุม' : 'ออกหน่วย')}
                                                        </span>
                                                        {evt.isVisibleToPublic === false && !canEdit && (
                                                            <span className="inline-flex items-center text-xs px-3 py-1.5 rounded-lg font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                                (ซ่อนจากสาธารณะ)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="font-bold text-slate-800 text-xl leading-snug mb-5">
                                                {evt.location}
                                            </div>

                                            {(evt.mapLink || phoneNum) && (
                                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                                    {evt.mapLink && (
                                                        <a href={evt.mapLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-bold transition-all border border-blue-100 shadow-sm">
                                                            <MapPin className="w-4 h-4" /> แผนที่
                                                        </a>
                                                    )}
                                                    {phoneNum && (
                                                        <a href={`tel:${phoneNum.replace(/\D/g, '')}`} onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-sm font-bold transition-all border border-emerald-100 shadow-sm">
                                                            <Phone className="w-4 h-4" /> โทร: {phoneNum}
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                                                    <Users className="w-4 h-4 text-indigo-400" />
                                                    <span>{evt.team || 'ไม่ได้ระบุทีม'}</span>
                                                </div>
                                                {status && (
                                                    <span className={`inline-flex items-center text-xs px-3 py-1.5 rounded-lg font-bold border ${status.badge}`}>
                                                        {status.text}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} apiBaseUrl={BASE_URL} onToast={addToast} />
            <DispatchModal isOpen={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} onToast={addToast} onSave={handleSaveDispatchEvent} onDelete={handleDeleteDispatch} initialData={viewingDispatch} />
        </div>
    );
};

export default DispatchCalendarDashboard;