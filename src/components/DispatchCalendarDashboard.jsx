import React, { useState, useEffect, useMemo } from 'react';
import { 
    CalendarDays, X, Plus, Clock, Users, CheckCircle, ChevronLeft, ChevronRight, Calendar, Search, Phone, MapPin,
    Unlock, LogOut,
    // ไอคอนสำหรับแถบเลื่อนที่เพิ่มเข้ามา
    Megaphone, Edit3, ChevronUp, ChevronDown, Trash2, Save 
} from 'lucide-react';
import DispatchModal from './modals/DispatchModal.jsx'; 
import LoginModal from './modals/LoginModal.jsx';
import ToastContainer from '../path/to/ToastContainer.jsx'; // ตรวจสอบ Path ของคุณอีกครั้ง

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
// 2. Announcement Components
// ==========================================
const AnnouncementBar = ({ announcements, onEditClick, canEdit }) => {
    const activeAnnouncements = announcements.filter(a => a.isActive);
    const [currentIndex, setCurrentIndex] = useState(0);

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
        <div className="bg-[#2D1B6B] text-white flex items-center px-4 text-sm relative z-40 shadow-md shrink-0 w-full h-11 overflow-hidden">
            <div className="bg-[#6B4BFA] text-white px-3 py-1 rounded-full font-bold text-xs mr-3 shrink-0 z-10 flex items-center gap-2 shadow-sm">
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

const AnnouncementModal = ({ isOpen, onClose, initialAnnouncements, onSave }) => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (isOpen) setItems([...initialAnnouncements]);
    }, [isOpen, initialAnnouncements]);

    if (!isOpen) return null;

    const handleToggle = (id) => setItems(items.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item));
    const handleChangeText = (id, text) => setItems(items.map(item => item.id === id ? { ...item, text } : item));
    const handleChangeIcon = (id, icon) => setItems(items.map(item => item.id === id ? { ...item, icon } : item));
    const handleDelete = (id) => setItems(items.filter(item => item.id !== id));
    const handleAdd = () => setItems([...items, { id: Date.now(), icon: '📌', text: 'ข้อความใหม่', isActive: true }]);

    return (
        <div className="fixed inset-0 z-[6000] flex justify-center items-end sm:items-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white w-full sm:w-[500px] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#6B4BFA] flex items-center justify-center text-white shadow-md">
                            <Edit3 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">แก้ไขข้อความแถบเลื่อน</h2>
                            <p className="text-xs text-slate-500">จัดการข้อความประชาสัมพันธ์ด้านบน</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-slate-600">รายการข้อความ ({items.length})</span>
                    </div>
                    
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className={`flex items-center gap-2 p-3 bg-white border ${item.isActive ? 'border-purple-100 shadow-sm' : 'border-slate-200 opacity-60'} rounded-xl transition-all`}>
                                <div className="flex flex-col text-slate-300 hover:text-slate-500 cursor-grab px-1">
                                    <ChevronUp className="w-4 h-4 -mb-1" />
                                    <ChevronDown className="w-4 h-4 -mt-1" />
                                </div>
                                <input type="text" value={item.icon} onChange={(e) => handleChangeIcon(item.id, e.target.value)} className="w-8 text-center bg-slate-50 border border-slate-200 rounded-md py-1 text-sm outline-none focus:border-purple-400" />
                                <input type="text" value={item.text} onChange={(e) => handleChangeText(item.id, e.target.value)} className="flex-1 bg-transparent border-none text-sm text-slate-700 outline-none placeholder-slate-400 focus:ring-0" placeholder="พิมพ์ข้อความ..." />
                                <div className="flex items-center gap-2 ml-2">
                                    <button onClick={() => handleToggle(item.id)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.isActive ? 'bg-[#6B4BFA]' : 'bg-slate-200'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100 bg-white"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button onClick={handleAdd} className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:text-[#6B4BFA] hover:border-[#6B4BFA] hover:bg-purple-50 transition-colors flex justify-center items-center gap-2">
                        <Plus className="w-4 h-4" /> เพิ่มข้อความใหม่
                    </button>
                </div>

                <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 shrink-0">
                    <button onClick={onClose} className="py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">ยกเลิก</button>
                    <button onClick={() => { onSave(items); onClose(); }} className="py-2.5 rounded-xl font-bold text-white bg-[#6B4BFA] hover:bg-[#5A3EE0] shadow-md shadow-purple-200 flex justify-center items-center gap-2 transition-colors"><Save className="w-4 h-4"/> บันทึกทั้งหมด</button>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 3. Main Component (Standalone Page)
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

    // --- State สำหรับแถบเลื่อน ---
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [announcements, setAnnouncements] = useState([
        { id: 1, icon: '💉', text: 'บริการฉีดวัคซีนสัตว์เลี้ยง ฟรี! ทุกวันอังคาร-ศุกร์', isActive: true },
        { id: 2, icon: '🏥', text: 'ทำหมันสุนัข-แมว ฟรี! รับจำนวนจำกัด โทรจองล่วงหน้า', isActive: true },
        { id: 3, icon: '🩺', text: 'ตรวจสุขภาพสัตว์เลี้ยงฟรี ทุกวันเสาร์-อาทิตย์', isActive: true },
        { id: 4, icon: '📞', text: 'แจ้งสัตว์จรจัดบาดเจ็บ โทร 1119 ตลอด 24 ชั่วโมง', isActive: true },
        { id: 5, icon: '🚑', text: 'หน่วยสัตวแพทย์เคลื่อนที่ พร้อมให้บริการทุกพื้นที่', isActive: true }
    ]);

    const handleSaveAnnouncements = (newAnnouncements) => {
        setAnnouncements(newAnnouncements);
        addToast('success', '✅ บันทึกข้อความแถบเลื่อนเรียบร้อยแล้ว');
    };

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
            
            {/* แถบเลื่อน Announcement Bar ด้านบนสุด */}
            <AnnouncementBar 
                announcements={announcements} 
                onEditClick={() => setIsAnnouncementModalOpen(true)} 
                canEdit={canEdit} 
            />

            <div className="bg-white px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 shadow-sm z-20 shrink-0 w-full">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-sm border border-indigo-100">
                        <Calendar className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">ตารางแผนงานออกหน่วย</h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Dispatch Dashboard & Planning</p>
                    </div>
                </div>

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

            <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden w-full">
                
                {/* Left Sidebar (ปฏิทิน) */}
                <div className="w-full lg:w-[420px] xl:w-[450px] p-4 sm:p-6 flex flex-col lg:h-full lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200/80 bg-slate-50 shrink-0 custom-scrollbar">
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <StatCard label="งานทั้งหมด" value={totalEvents} colorClass="text-indigo-600" bgClass="bg-indigo-100/50" icon={CheckCircle} />
                        <StatCard label="วันนี้" value={todayEventsCount} colorClass="text-blue-500" bgClass="bg-blue-100/50" icon={Calendar} />
                        <StatCard label="รอบปฏิบัติ" value={upcomingEvents} colorClass="text-orange-500" bgClass="bg-orange-100/50" icon={Clock} />
                        <StatCard label="เผยแพร่" value={publicEventsCount} colorClass="text-emerald-500" bgClass="bg-emerald-100/50" icon={Users} />
                    </div>

                    <div className="bg-white rounded-[1.5rem] p-4 sm:p-6 shadow-sm border border-slate-200">
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

                {/* Right Panel (Event List) */}
                <div className="flex-1 flex flex-col lg:h-full lg:overflow-hidden p-4 sm:p-6 lg:p-8 bg-white min-w-0">
                    <div className="flex flex-col gap-4 sm:gap-6 lg:overflow-y-auto lg:h-full lg:pr-2 custom-scrollbar">
                        
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
            
            {/* โชว์ Modal สำหรับแก้ไขข้อความแถบเลื่อน */}
            <AnnouncementModal 
                isOpen={isAnnouncementModalOpen} 
                onClose={() => setIsAnnouncementModalOpen(false)} 
                initialAnnouncements={announcements}
                onSave={handleSaveAnnouncements}
            />
        </div>
    );
};

export default DispatchCalendarDashboard;