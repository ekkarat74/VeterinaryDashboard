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

    // --- Helpers (Logic เดิม) ---
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[95vh] h-[90vh] ring-1 ring-white/20">
                
                {/* Header Style ใหม่: Gradient อ่อนๆ และดู Clean */}
                <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-200 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${theme.lightBg}`}>
                            <CalendarDays className={`w-6 h-6 ${theme.text}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 leading-tight">ปฏิทินนัดหมายประชุม</h3>
                            <p className="text-xs text-slate-500 font-medium">Meeting Calendar Dashboard</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                    {/* Left Panel: Sidebar */}
                    <div className="w-full lg:w-[320px] bg-white border-r border-slate-200 flex flex-col overflow-hidden order-2 lg:order-1">
                        <div className="p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
                            
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard label="ทั้งหมด" value={totalEvents} colorClass="text-teal-600" icon={List} />
                                <StatCard label="เร็วๆ นี้" value={upcomingEvents} colorClass="text-orange-500" icon={Clock} />
                            </div>

                            {/* CTA Button */}
                            <button 
                                onClick={onOpenForm}
                                className={`w-full py-3.5 ${theme.primary} ${theme.primaryHover} text-white rounded-xl font-semibold shadow-lg shadow-teal-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]`}
                            >
                                <Plus className="w-5 h-5" /> สร้างนัดหมายใหม่
                            </button>

                            {/* Event List for Selected Date */}
                            <div className="mt-2">
                                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <span className="w-1.5 h-4 bg-teal-500 rounded-full"></span>
                                    {selectedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric'})}
                                </h4>
                                
                                <div className="space-y-3 pb-4">
                                    {selectedDateEvents.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                            <CalendarDays className="w-10 h-10 mb-2 opacity-20" />
                                            <span className="text-sm">ไม่มีนัดหมายในวันนี้</span>
                                        </div>
                                    ) : (
                                        selectedDateEvents.map((evt, idx) => (
                                            <div key={idx} onClick={() => onEventClick && onEventClick(evt)}
                                                className="group relative bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-300 cursor-pointer transition-all duration-200">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="inline-flex items-center gap-1 text-[10px] bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md font-bold">
                                                        <Clock className="w-3 h-3" /> {evt.time}
                                                    </span>
                                                    {evt.location && <span className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3"/> {evt.location}</span>}
                                                </div>
                                                <div className="font-bold text-slate-800 text-sm mb-2 group-hover:text-teal-700 transition-colors line-clamp-2">
                                                    {evt.title || evt.location /* fallback if title missing */}
                                                </div>
                                                <div className="flex items-center gap-2 pt-2 border-t border-slate-50 mt-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
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

                    {/* Right Panel: Calendar Grid */}
                    <div className="flex-1 bg-slate-50/50 p-4 md:p-6 flex flex-col order-1 lg:order-2 overflow-hidden">
                        
                        {/* Calendar Navigation */}
                        <div className="flex justify-between items-center mb-6 px-1">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition">วันนี้</button>
                                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Days Header */}
                        <div className="grid grid-cols-7 mb-2">
                            {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((d, i) => (
                                <div key={d} className={`text-center text-sm font-bold py-2 ${i===0 || i===6 ? 'text-red-400' : 'text-slate-400'}`}>{d}</div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 grid-rows-6 gap-2 md:gap-3 flex-1 overflow-y-auto custom-scrollbar min-h-[500px]">
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
                                            relative p-2 rounded-2xl border cursor-pointer flex flex-col gap-1 transition-all duration-200 group min-h-[85px]
                                            ${isSelected 
                                                ? 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-lg z-10' 
                                                : 'bg-white border-slate-100 hover:border-teal-300 hover:shadow-md'
                                            }
                                        `}>
                                        
                                        <div className="flex justify-between items-start">
                                            <span className={`
                                                w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all
                                                ${isToday 
                                                    ? 'bg-red-500 text-white shadow-md shadow-red-200' 
                                                    : isSelected ? 'bg-teal-600 text-white' : 'text-slate-700 group-hover:bg-slate-100'}
                                            `}>
                                                {dayNum}
                                            </span>
                                            {dayEvents.length > 0 && !isSelected && (
                                                <span className="w-2 h-2 rounded-full bg-teal-500 mt-1 mr-1"></span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                                            {dayEvents.slice(0, 3).map((evt, idx) => (
                                                <div key={idx} className="text-[10px] px-2 py-1 rounded-md font-medium bg-teal-50 text-teal-800 truncate border border-teal-100/50">
                                                    {evt.time.split('-')[0]} {evt.location}
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[10px] text-slate-400 pl-1 font-medium">+ {dayEvents.length - 3} งาน</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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
    // Note: Structure เหมือนกับ Meeting แต่เปลี่ยน Theme เป็นสี Indigo/Blue
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
        primary: 'bg-[#545BE8]', // Indigo
        primaryHover: 'hover:bg-[#4349c2]',
        lightBg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[95vh] h-[90vh] ring-1 ring-white/20">
                
                {/* Header Dispatch */}
                <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-200 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${theme.lightBg}`}>
                            <CalendarDays className={`w-6 h-6 ${theme.text}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 leading-tight">ตารางแผนงานออกหน่วย</h3>
                            <p className="text-xs text-slate-500 font-medium">Dispatch Dashboard & Planning</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-full lg:w-[320px] bg-white border-r border-slate-200 flex flex-col overflow-hidden order-2 lg:order-1">
                        <div className="p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard label="งานทั้งหมด" value={totalEvents} colorClass="text-[#545BE8]" icon={CheckCircle} />
                                <StatCard label="รอบปฏิบัติ" value={upcomingEvents} colorClass="text-orange-500" icon={Clock} />
                            </div>

                            <button 
                                onClick={onOpenForm}
                                className={`w-full py-3.5 ${theme.primary} ${theme.primaryHover} text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]`}
                            >
                                <Plus className="w-5 h-5" /> บันทึกออกหน่วย
                            </button>

                            <div className="mt-2">
                                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <span className="w-1.5 h-4 bg-[#545BE8] rounded-full"></span>
                                    {selectedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric'})}
                                </h4>
                                
                                <div className="space-y-3 pb-4">
                                    {selectedDateEvents.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                            <CalendarDays className="w-10 h-10 mb-2 opacity-20" />
                                            <span className="text-sm">ไม่มีงานออกหน่วย</span>
                                        </div>
                                    ) : (
                                        selectedDateEvents.map((evt, idx) => (
                                            <div key={idx} onClick={() => onEventClick && onEventClick(evt)}
                                                className={`
                                                    group relative bg-white p-4 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition-all duration-200
                                                    ${evt.type === 'meeting' ? 'border-l-4 border-l-teal-500 border-y-slate-100 border-r-slate-100' : 'border-l-4 border-l-[#545BE8] border-y-slate-100 border-r-slate-100'}
                                                `}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-bold">
                                                        <Clock className="w-3 h-3" /> {evt.time}
                                                    </span>
                                                </div>
                                                <div className="font-bold text-slate-800 text-sm mb-2 group-hover:text-[#545BE8] transition-colors line-clamp-2">
                                                    {evt.location}
                                                </div>
                                                <div className="flex items-center gap-2 pt-2 border-t border-slate-50 mt-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
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

                    {/* Right Panel: Calendar */}
                    <div className="flex-1 bg-slate-50/50 p-4 md:p-6 flex flex-col order-1 lg:order-2 overflow-hidden">
                        
                        <div className="flex justify-between items-center mb-6 px-1">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition">วันนี้</button>
                                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 mb-2">
                            {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((d, i) => (
                                <div key={d} className={`text-center text-sm font-bold py-2 ${i===0 || i===6 ? 'text-red-400' : 'text-slate-400'}`}>{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 grid-rows-6 gap-2 md:gap-3 flex-1 overflow-y-auto custom-scrollbar min-h-[500px]">
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
                                            relative p-2 rounded-2xl border cursor-pointer flex flex-col gap-1 transition-all duration-200 group min-h-[85px]
                                            ${isSelected 
                                                ? 'bg-white border-[#545BE8] ring-2 ring-[#545BE8]/20 shadow-lg z-10' 
                                                : 'bg-white border-slate-100 hover:border-[#545BE8]/50 hover:shadow-md'
                                            }
                                        `}>
                                        
                                        <div className="flex justify-between items-start">
                                            <span className={`
                                                w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all
                                                ${isToday 
                                                    ? 'bg-red-500 text-white shadow-md shadow-red-200' 
                                                    : isSelected ? 'bg-[#545BE8] text-white' : 'text-slate-700 group-hover:bg-slate-100'}
                                            `}>
                                                {dayNum}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                                            {dayEvents.slice(0, 3).map((evt, idx) => (
                                                <div key={idx} className={`
                                                    text-[10px] px-2 py-1 rounded-md font-medium truncate border
                                                    ${evt.type === 'meeting' 
                                                        ? 'bg-teal-50 text-teal-800 border-teal-100/50' 
                                                        : 'bg-indigo-50 text-indigo-800 border-indigo-100/50'}
                                                `}>
                                                    {evt.time.split('-')[0]} {evt.location}
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[10px] text-slate-400 pl-1 font-medium">+ {dayEvents.length - 3}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { MeetingCalendarDashboard, DispatchCalendarDashboard };