import React, { useState } from 'react';
import { 
    CalendarDays, X, Plus, List, Users, 
    ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle 
} from 'lucide-react';

// ==========================================
// Shared Components (คอมโพเนนต์ใช้ร่วมกัน)
// ==========================================

const StatCard = ({ label, value, colorClass, icon: Icon }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
        <div>
            <div className="text-slate-400 text-xs font-medium mb-1">{label}</div>
            <div className={`text-2xl font-black ${colorClass}`}>{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-white transition-colors`}>
            {Icon && <Icon className={`w-5 h-5 ${colorClass} opacity-70`} />}
        </div>
    </div>
);

// ----------------------------------------------------
// 1. MeetingCalendarDashboard (ปฏิทินนัดหมายประชุม)
// ----------------------------------------------------
const MeetingCalendarDashboard = ({ isOpen, onClose, onOpenForm, events = [], onEventClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    if (!isOpen) return null;

    // --- Helpers ---
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

    const selectedDateEvents = events.filter(e => e.date === toLocalISOString(selectedDate));
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => e.date >= toLocalISOString(new Date())).length;

    // --- Theme Config ---
    const theme = {
        primary: 'bg-teal-600',
        primaryHover: 'hover:bg-teal-700',
        lightBg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        ring: 'focus:ring-teal-500'
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
            <div className="bg-slate-50 rounded-none sm:rounded-3xl shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col h-[100dvh] sm:h-[90dvh] sm:max-h-[95vh] border-0 sm:border border-white/20">
                
                {/* Header */}
                <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 mt-safe sm:mt-0 flex justify-between items-center border-b border-slate-200 shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${theme.lightBg}`}>
                            <CalendarDays className={`w-5 h-5 sm:w-6 sm:h-6 ${theme.text}`} />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">ปฏิทินนัดหมายประชุม</h3>
                            <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">Meeting Calendar Dashboard</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Body Layout */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
                    
                    {/* Right Panel: Calendar Grid (สลับมาอยู่ด้านบนในมือถือ) */}
                    <div className="flex-1 bg-slate-50/50 p-4 md:p-6 flex flex-col order-1 lg:order-2 shrink-0 h-auto lg:h-full lg:overflow-hidden">
                        
                        {/* Calendar Navigation */}
                        <div className="flex justify-between items-center mb-4 sm:mb-6 px-1">
                            <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">
                                {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                                <button onClick={() => changeMonth(-1)} className="p-1.5 sm:p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                                <button onClick={() => setCurrentDate(new Date())} className="px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition">วันนี้</button>
                                <button onClick={() => changeMonth(1)} className="p-1.5 sm:p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                            </div>
                        </div>

                        {/* Days Header */}
                        <div className="grid grid-cols-7 mb-2">
                            {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((d, i) => (
                                <div key={d} className={`text-center text-xs sm:text-sm font-bold py-1 sm:py-2 ${i===0 || i===6 ? 'text-red-400' : 'text-slate-400'}`}>{d}</div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 grid-rows-6 gap-1.5 sm:gap-2 md:gap-3 lg:flex-1 lg:overflow-y-auto custom-scrollbar min-h-[350px] sm:min-h-[400px] md:min-h-[500px]">
                            {daysArray.map((day, i) => {
                                if (i < firstDay) return <div key={i} />;
                                const dayNum = i - firstDay + 1;
                                const dObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
                                const dateStr = toLocalISOString(dObj);
                                const isToday = dateStr === toLocalISOString(new Date());
                                const isSelected = dateStr === toLocalISOString(selectedDate);
                                const dayEvents = events.filter(e => e.date === dateStr);

                                return (
                                    <div key={i} onClick={() => setSelectedDate(dObj)}
                                        className={`
                                            relative p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border cursor-pointer flex flex-col gap-1 transition-all duration-200 group min-h-[60px] sm:min-h-[85px]
                                            ${isSelected 
                                                ? 'bg-white border-teal-500 ring-1 sm:ring-2 ring-teal-500/20 shadow-md z-10' 
                                                : 'bg-white border-slate-100 hover:border-teal-300 hover:shadow-md'
                                            }
                                        `}>
                                        <div className="flex justify-between items-start">
                                            <span className={`
                                                w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-bold transition-all
                                                ${isToday 
                                                    ? 'bg-red-500 text-white shadow-md shadow-red-200' 
                                                    : isSelected ? 'bg-teal-600 text-white' : 'text-slate-700 group-hover:bg-slate-100'}
                                            `}>
                                                {dayNum}
                                            </span>
                                            {dayEvents.length > 0 && !isSelected && (
                                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-teal-500 mt-1 mr-0.5 sm:mr-1"></span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1 mt-0.5 sm:mt-1 overflow-hidden">
                                            {dayEvents.slice(0, 3).map((evt, idx) => (
                                                <div key={idx} className="text-[9px] sm:text-[10px] px-1 sm:px-2 py-0.5 sm:py-1 rounded sm:rounded-md font-medium bg-teal-50 text-teal-800 truncate border border-teal-100/50">
                                                    {evt.time.split('-')[0]} <span className="hidden sm:inline">{evt.location}</span>
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[9px] sm:text-[10px] text-slate-400 pl-1 font-medium">+ {dayEvents.length - 3}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Left Panel: Sidebar (แสดงด้านล่างสุดในมือถือ) */}
                    <div className="w-full lg:w-[320px] bg-white border-t lg:border-t-0 lg:border-r border-slate-200 flex flex-col shrink-0 order-2 lg:order-1 h-auto lg:h-full">
                        {/* เพิ่ม pb-8 สำหรับมือถือกันขอบล่างบัง */}
                        <div className="p-4 sm:p-5 pb-8 sm:pb-5 flex flex-col gap-4 lg:overflow-y-auto custom-scrollbar flex-1">
                            
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard label="ทั้งหมด" value={totalEvents} colorClass="text-teal-600" icon={List} />
                                <StatCard label="เร็วๆ นี้" value={upcomingEvents} colorClass="text-orange-500" icon={Clock} />
                            </div>

                            {/* CTA Button */}
                            <button 
                                onClick={onOpenForm}
                                className={`w-full py-3 sm:py-3.5 ${theme.primary} ${theme.primaryHover} text-white rounded-xl font-semibold shadow-lg shadow-teal-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm sm:text-base`}
                            >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> สร้างนัดหมายใหม่
                            </button>

                            {/* Event List */}
                            <div className="mt-2">
                                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider">
                                    <span className="w-1.5 h-4 bg-teal-500 rounded-full"></span>
                                    {selectedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric'})}
                                </h4>
                                
                                <div className="space-y-3">
                                    {selectedDateEvents.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                            <CalendarDays className="w-8 h-8 sm:w-10 sm:h-10 mb-2 opacity-20" />
                                            <span className="text-xs sm:text-sm">ไม่มีนัดหมายในวันนี้</span>
                                        </div>
                                    ) : (
                                        selectedDateEvents.map((evt, idx) => (
                                            <div key={idx} onClick={() => onEventClick && onEventClick(evt)}
                                                className="group relative bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-300 cursor-pointer transition-all duration-200">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="inline-flex items-center gap-1 text-[10px] bg-teal-50 text-teal-700 px-2 py-1 rounded-md font-bold">
                                                        <Clock className="w-3 h-3" /> {evt.time}
                                                    </span>
                                                    {evt.location && <span className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3"/> {evt.location}</span>}
                                                </div>
                                                <div className="font-bold text-slate-800 text-sm mb-2 group-hover:text-teal-700 transition-colors line-clamp-2">
                                                    {evt.title || evt.location}
                                                </div>
                                                <div className="flex items-center gap-2 pt-2 border-t border-slate-50 mt-2">
                                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                        <Users className="w-3 h-3" />
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-medium truncate">{evt.team}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------
// 2. DispatchCalendarDashboard (ปฏิทินแผนงานออกหน่วย)
// ----------------------------------------------------
const DispatchCalendarDashboard = ({ isOpen, onClose, onOpenForm, events = [], onEventClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    if (!isOpen) return null;

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

    const selectedDateEvents = events.filter(e => e.date === toLocalISOString(selectedDate));
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => e.date >= toLocalISOString(new Date())).length;

    // --- Theme Config (Indigo/Blue) ---
    const theme = {
        primary: 'bg-[#545BE8]', 
        primaryHover: 'hover:bg-[#4349c2]',
        lightBg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
    };

    const getEventStyles = (evt) => {
        if (evt.type === 'meeting') {
            return {
                card: 'border-l-4 border-l-teal-500 border-y-slate-100 border-r-slate-100',
                badge: 'bg-teal-50 text-teal-800 border border-teal-100/50',
                icon: 'bg-teal-50 text-teal-500',
                hoverText: 'group-hover:text-teal-700'
            };
        }
        
        const colorMap = {
            'bg-red-500': { card: 'border-l-4 border-l-red-500 border-y-slate-100 border-r-slate-100', badge: 'bg-red-50 text-red-800 border border-red-100/50', icon: 'bg-red-100 text-red-500', hoverText: 'group-hover:text-red-600' },
            'bg-blue-500': { card: 'border-l-4 border-l-blue-500 border-y-slate-100 border-r-slate-100', badge: 'bg-blue-50 text-blue-800 border border-blue-100/50', icon: 'bg-blue-100 text-blue-500', hoverText: 'group-hover:text-blue-600' },
            'bg-green-500': { card: 'border-l-4 border-l-green-500 border-y-slate-100 border-r-slate-100', badge: 'bg-green-50 text-green-800 border border-green-100/50', icon: 'bg-green-100 text-green-500', hoverText: 'group-hover:text-green-600' },
            'bg-yellow-400': { card: 'border-l-4 border-l-yellow-400 border-y-slate-100 border-r-slate-100', badge: 'bg-yellow-50 text-yellow-800 border border-yellow-100/50', icon: 'bg-yellow-100 text-yellow-600', hoverText: 'group-hover:text-yellow-600' },
            'bg-purple-500': { card: 'border-l-4 border-l-purple-500 border-y-slate-100 border-r-slate-100', badge: 'bg-purple-50 text-purple-800 border border-purple-100/50', icon: 'bg-purple-100 text-purple-500', hoverText: 'group-hover:text-purple-600' },
            'bg-orange-500': { card: 'border-l-4 border-l-orange-500 border-y-slate-100 border-r-slate-100', badge: 'bg-orange-50 text-orange-800 border border-orange-100/50', icon: 'bg-orange-100 text-orange-500', hoverText: 'group-hover:text-orange-600' },
            'bg-pink-500': { card: 'border-l-4 border-l-pink-500 border-y-slate-100 border-r-slate-100', badge: 'bg-pink-50 text-pink-800 border border-pink-100/50', icon: 'bg-pink-100 text-pink-500', hoverText: 'group-hover:text-pink-600' },
            'bg-slate-400': { card: 'border-l-4 border-l-slate-400 border-y-slate-100 border-r-slate-100', badge: 'bg-slate-100 text-slate-800 border border-slate-200/50', icon: 'bg-slate-200 text-slate-600', hoverText: 'group-hover:text-slate-600' },
            'default': { card: 'border-l-4 border-l-[#545BE8] border-y-slate-100 border-r-slate-100', badge: 'bg-indigo-50 text-indigo-800 border border-indigo-100/50', icon: 'bg-indigo-100 text-indigo-500', hoverText: 'group-hover:text-[#545BE8]' }
        };

        return colorMap[evt.unitColor] || colorMap['default'];
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
            <div className="bg-slate-50 rounded-none sm:rounded-3xl shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col h-[100dvh] sm:h-[90dvh] sm:max-h-[95vh] border-0 sm:border border-white/20">
                
                {/* Header */}
                <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 mt-safe sm:mt-0 flex justify-between items-center border-b border-slate-200 shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${theme.lightBg}`}>
                            <CalendarDays className={`w-5 h-5 sm:w-6 sm:h-6 ${theme.text}`} />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">ตารางแผนงานออกหน่วย</h3>
                            <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">Dispatch Dashboard & Planning</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Body Layout */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
                    
                    {/* Right Panel: Calendar Grid */}
                    <div className="flex-1 bg-slate-50/50 p-4 md:p-6 flex flex-col order-1 lg:order-2 shrink-0 h-auto lg:h-full lg:overflow-hidden">
                        
                        <div className="flex justify-between items-center mb-4 sm:mb-6 px-1">
                            <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">
                                {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                                <button onClick={() => changeMonth(-1)} className="p-1.5 sm:p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                                <button onClick={() => setCurrentDate(new Date())} className="px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition">วันนี้</button>
                                <button onClick={() => changeMonth(1)} className="p-1.5 sm:p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 mb-2">
                            {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((d, i) => (
                                <div key={d} className={`text-center text-xs sm:text-sm font-bold py-1 sm:py-2 ${i===0 || i===6 ? 'text-red-400' : 'text-slate-400'}`}>{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 grid-rows-6 gap-1.5 sm:gap-2 md:gap-3 lg:flex-1 lg:overflow-y-auto custom-scrollbar min-h-[350px] sm:min-h-[400px] md:min-h-[500px]">
                            {daysArray.map((day, i) => {
                                if (i < firstDay) return <div key={i} />;
                                const dayNum = i - firstDay + 1;
                                const dObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
                                const dateStr = toLocalISOString(dObj);
                                const isToday = dateStr === toLocalISOString(new Date());
                                const isSelected = dateStr === toLocalISOString(selectedDate);
                                const dayEvents = events.filter(e => e.date === dateStr);

                                return (
                                    <div key={i} onClick={() => setSelectedDate(dObj)}
                                        className={`
                                            relative p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border cursor-pointer flex flex-col gap-1 transition-all duration-200 group min-h-[60px] sm:min-h-[85px]
                                            ${isSelected 
                                                ? 'bg-white border-[#545BE8] ring-1 sm:ring-2 ring-[#545BE8]/20 shadow-md z-10' 
                                                : 'bg-white border-slate-100 hover:border-[#545BE8]/50 hover:shadow-md'
                                            }
                                        `}>
                                        <div className="flex justify-between items-start">
                                            <span className={`
                                                w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-bold transition-all
                                                ${isToday 
                                                    ? 'bg-red-500 text-white shadow-md shadow-red-200' 
                                                    : isSelected ? 'bg-[#545BE8] text-white' : 'text-slate-700 group-hover:bg-slate-100'}
                                            `}>
                                                {dayNum}
                                            </span>
                                            {dayEvents.length > 0 && !isSelected && (
                                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#545BE8] mt-1 mr-0.5 sm:mr-1"></span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1 mt-0.5 sm:mt-1 overflow-hidden">
                                            {dayEvents.slice(0, 3).map((evt, idx) => {
                                                const styles = getEventStyles(evt); 
                                                return (
                                                    <div key={idx} className={`flex justify-between items-center text-[9px] sm:text-[10px] px-1 sm:px-2 py-0.5 sm:py-1 rounded sm:rounded-md font-medium border ${styles.badge}`}>
                                                        <span className="truncate">{evt.time.split('-')[0]} <span className="hidden sm:inline">{evt.location}</span></span>
                                                        {evt.unitLetter && (
                                                            <span className="font-bold ml-1 shrink-0 px-1 rounded-sm bg-white/40 hidden sm:inline-block">
                                                                {evt.unitLetter}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[9px] sm:text-[10px] text-slate-400 pl-1 font-medium">+ {dayEvents.length - 3}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Left Panel: Sidebar */}
                    <div className="w-full lg:w-[320px] bg-white border-t lg:border-t-0 lg:border-r border-slate-200 flex flex-col shrink-0 order-2 lg:order-1 h-auto lg:h-full">
                        {/* เพิ่ม pb-8 ตรงนี้สำหรับมือถือ */}
                        <div className="p-4 sm:p-5 pb-8 sm:pb-5 flex flex-col gap-4 lg:overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard label="งานทั้งหมด" value={totalEvents} colorClass="text-[#545BE8]" icon={CheckCircle} />
                                <StatCard label="รอบปฏิบัติ" value={upcomingEvents} colorClass="text-orange-500" icon={Clock} />
                            </div>

                            <button 
                                onClick={onOpenForm}
                                className={`w-full py-3 sm:py-3.5 ${theme.primary} ${theme.primaryHover} text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm sm:text-base`}
                            >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> บันทึกออกหน่วย
                            </button>

                            <div className="mt-2">
                                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider">
                                    <span className="w-1.5 h-4 bg-[#545BE8] rounded-full"></span>
                                    {selectedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric'})}
                                </h4>
                                
                                <div className="space-y-3">
                                    {selectedDateEvents.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                            <CalendarDays className="w-8 h-8 sm:w-10 sm:h-10 mb-2 opacity-20" />
                                            <span className="text-xs sm:text-sm">ไม่มีงานออกหน่วย</span>
                                        </div>
                                    ) : (
                                        selectedDateEvents.map((evt, idx) => {
                                            const styles = getEventStyles(evt); 
                                            return (
                                            <div key={idx} onClick={() => onEventClick && onEventClick(evt)}
                                                className={`group relative bg-white p-3 sm:p-4 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 ${styles.card}`}>
                                                
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold">
                                                            <Clock className="w-3 h-3" /> {evt.time}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-bold ${styles.badge}`}>
                                                            {evt.title || (evt.type === 'meeting' ? 'นัดหมายประชุม' : 'ออกหน่วย')}
                                                        </span>
                                                    </div>
                                                    {evt.unitLetter && (
                                                        <div className={`flex items-center justify-center min-w-[24px] sm:min-w-[28px] h-6 sm:h-7 px-1.5 rounded-lg text-xs sm:text-sm font-black shadow-sm shrink-0 border ${styles.badge}`}>
                                                            {evt.unitLetter}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`font-bold text-slate-800 text-sm mb-2 transition-colors line-clamp-2 ${styles.hoverText}`}>
                                                    {evt.location}
                                                </div>
                                                <div className="flex items-center gap-2 pt-2 border-t border-slate-50 mt-2">
                                                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${styles.icon}`}>
                                                        <Users className="w-3 h-3" />
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-medium truncate">{evt.team || 'ไม่ได้ระบุ'}</span>
                                                </div>
                                            </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { MeetingCalendarDashboard, DispatchCalendarDashboard };