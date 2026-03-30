import React, { useState } from 'react';
import { 
    CalendarDays, X, Plus, Clock, Users, CheckCircle, ChevronLeft, ChevronRight, MapPin 
} from 'lucide-react';

// ==========================================
// 1. Shared Components (คอมโพเนนต์ใช้ร่วมกัน)
// ==========================================
const StatCard = ({ label, value, colorClass, bgClass, icon: Icon }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <div>
            <div className="text-slate-500 text-xs font-semibold mb-1">{label}</div>
            <div className={`text-2xl font-black ${colorClass}`}>{value}</div>
        </div>
        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${bgClass} transition-colors`}>
            {Icon && <Icon className={`w-5 h-5 ${colorClass}`} />}
        </div>
    </div>
);

// ==========================================
// 2. Helpers (ฟังก์ชันคำนวณสถานะ)
// ==========================================
const getDispatchStatus = (dateStr, timeStr, closeTimeStr) => {
    if (!dateStr || !timeStr) return null;
    const closeTime = closeTimeStr || '16:00'; 

    const now = new Date();
    const start = new Date(`${dateStr}T${timeStr}:00`);
    const end = new Date(`${dateStr}T${closeTime}:00`);
    
    const thirtyMins = 30 * 60 * 1000; 

    if (now < new Date(start.getTime() - thirtyMins)) {
        return { text: 'รอปฏิบัติงาน', badge: 'bg-slate-100 text-slate-600 border-slate-200' };
    } else if (now >= new Date(start.getTime() - thirtyMins) && now < start) {
        return { text: 'เตรียมพร้อมปฏิบัติงาน', badge: 'bg-amber-100 text-amber-700 border-amber-200' };
    } else if (now >= start && now < new Date(end.getTime() - thirtyMins)) {
        return { text: 'กำลังดำเนินงาน', badge: 'bg-blue-100 text-blue-700 border-blue-200' };
    } else {
        return { text: 'สิ้นสุดปฏิบัติงาน', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
};

// ==========================================
// 3. Main Component: DispatchCalendarDashboard
// ==========================================
const DispatchCalendarDashboard = ({ isOpen, onClose, onOpenForm, events = [], onEventClick, isInline = false, canEdit, onToggleVisibility }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    if (!isInline && !isOpen) return null;

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
        primary: 'bg-[#545BE8]', 
        primaryHover: 'hover:bg-[#4349c2]',
        lightBg: 'bg-indigo-50',
        text: 'text-indigo-700',
    };

    const getEventStyles = (evt) => {
        if (evt.type === 'meeting') {
            return { border: 'border-l-teal-500', bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' };
        }
        
        const colorMap = {
            'bg-red-500': { border: 'border-l-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
            'bg-blue-500': { border: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
            'bg-green-500': { border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
            'bg-yellow-400': { border: 'border-l-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
            'bg-purple-500': { border: 'border-l-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
            'bg-orange-500': { border: 'border-l-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
            'bg-pink-500': { border: 'border-l-pink-500', bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
            'bg-slate-400': { border: 'border-l-slate-400', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
            'default': { border: 'border-l-[#545BE8]', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-[#545BE8]' }
        };

        return colorMap[evt.unitColor] || colorMap['default'];
    };

    return (
        <div className={isInline 
            ? "w-full flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            : "fixed inset-0 z-50 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"}>
            
            <div className={`w-full flex flex-col overflow-hidden bg-white shadow-2xl rounded-2xl ${isInline ? 'h-full min-h-[600px] shadow-none rounded-none' : 'max-w-7xl h-[90vh] border border-slate-100'}`}>
                
                {/* Header */}
                <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-slate-100 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${theme.lightBg} shadow-inner`}>
                            <CalendarDays className={`w-6 h-6 ${theme.text}`} />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 leading-tight tracking-tight">ตารางแผนงานออกหน่วย</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Dispatch Dashboard & Planning</p>
                        </div>
                    </div>
                    {!isInline && (
                        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body Layout */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden bg-slate-50/30">
                    
                    {/* Left Panel (ข้อมูลหน่วย) */}
                    <div className="w-full lg:w-[380px] bg-white border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col shrink-0 order-2 lg:order-1 h-auto lg:h-full z-10 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">
                        <div className="p-5 flex flex-col gap-6 lg:overflow-y-auto custom-scrollbar flex-1">
                            
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard label="งานทั้งหมด" value={totalEvents} colorClass="text-[#545BE8]" bgClass="bg-indigo-50" icon={CheckCircle} />
                                <StatCard label="รอบปฏิบัติ" value={upcomingEvents} colorClass="text-orange-500" bgClass="bg-orange-50" icon={Clock} />
                            </div>

                            {canEdit && (
                                <button 
                                    onClick={onOpenForm}
                                    className={`w-full py-3.5 ${theme.primary} ${theme.primaryHover} text-white rounded-xl font-bold shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98] text-sm sm:text-base`}
                                >
                                    <Plus className="w-5 h-5" /> บันทึกออกหน่วย
                                </button>
                            )}

                            <div className="flex-1 flex flex-col">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-base">
                                    <span className="w-2 h-6 bg-[#545BE8] rounded-full"></span>
                                    {selectedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric'})}
                                </h4>
                                
                                <div className="space-y-3 pb-4">
                                    {selectedDateEvents.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                                                <CalendarDays className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <span className="text-slate-500 font-semibold text-sm">ไม่มีกำหนดการในวันนี้</span>
                                            <span className="text-slate-400 text-xs mt-1">คุณสามารถเพิ่มแผนงานออกหน่วยใหม่ได้</span>
                                        </div>
                                    ) : (
                                        selectedDateEvents.map((evt, idx) => {
                                            const styles = getEventStyles(evt); 
                                            const status = typeof getDispatchStatus === 'function' ? getDispatchStatus(evt.date, evt.time, evt.closingTime) : null; 

                                            return (
                                                <div key={idx} onClick={() => canEdit && onEventClick && onEventClick(evt)}
                                                    className={`group bg-white p-4 rounded-xl border border-slate-100 border-l-4 ${styles.border} shadow-sm hover:shadow-md transition-all duration-200 ${canEdit ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default'}`}
                                                >
                                                    <div className="flex justify-between items-start gap-3 mb-2">
                                                        <div className="flex flex-col gap-2 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-semibold">
                                                                    <Clock className="w-3.5 h-3.5" /> {evt.time} - {evt.closingTime || '12:00'} 
                                                                </span>
                                                                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-bold ${styles.bg} ${styles.text}`}>
                                                                    {evt.title || (evt.type === 'meeting' ? 'นัดหมายประชุม' : 'ออกหน่วย')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {canEdit && (
                                                            <div className="shrink-0" onClick={(e) => e.stopPropagation()} title={evt.isVisibleToPublic !== false ? "แสดงให้ประชาชนเห็น" : "ซ่อนจากประชาชน"}>
                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        className="sr-only peer" 
                                                                        checked={evt.isVisibleToPublic !== false} 
                                                                        onChange={() => onToggleVisibility(evt._id, evt.isVisibleToPublic !== false)}
                                                                    />
                                                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className={`font-bold text-slate-800 text-sm sm:text-base leading-tight mb-3 transition-colors ${canEdit ? `group-hover:${styles.text}` : ''}`}>
                                                        {evt.location}
                                                    </div>
                                                    
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-50">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                                            <span className="truncate">{evt.team || 'ไม่ได้ระบุทีม'}</span>
                                                        </div>
                                                        {status && (
                                                            <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded font-bold border ${status.badge}`}>
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

                    {/* Right Panel: Calendar Grid */}
                    {/* 1. ลด p-4 เป็น p-2 บนมือถือ เพื่อเพิ่มพื้นที่ให้ตาราง */}
                    <div className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 flex flex-col order-1 lg:order-2 shrink-0 h-auto lg:h-full lg:overflow-hidden relative bg-slate-50/50">
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight capitalize px-2 sm:px-0">
                                {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-200 p-1 self-end sm:self-auto">
                                <button onClick={() => changeMonth(-1)} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                                <div className="w-px h-5 bg-slate-200 mx-1"></div>
                                <button onClick={() => setCurrentDate(new Date())} className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">วันนี้</button>
                                <div className="w-px h-5 bg-slate-200 mx-1"></div>
                                <button onClick={() => changeMonth(1)} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Days of week header */}
                        {/* 2. ใส่ gap-1 ให้ตรงกับช่องด้านล่าง (ช่วยให้คอลัมน์ตรงกันเป๊ะ) */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
                            {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((d, i) => (
                                <div key={d} className={`text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider pb-1 sm:pb-2 ${i===0 || i===6 ? 'text-rose-500' : 'text-slate-400'}`}>
                                    <span className="hidden sm:inline">{d}</span>
                                    <span className="sm:hidden">{d.substring(0, 1)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        {/* 1. ใช้ auto-rows-[minmax(65px,1fr)] เพื่อให้แต่ละแถวมีความสูงขั้นต่ำ 65px/90px ถ้าจอใหญ่ขึ้นก็ขยายตาม (1fr) ช่วยป้องกันกล่องซ้อนกัน */}
                        {/* 2. ให้แสดง overflow-y-auto ตลอดเวลา เพื่อให้เลื่อนปฏิทินดูได้ในจอที่ความสูงน้อยๆ */}
                        <div className="grid grid-cols-7 auto-rows-[minmax(65px,1fr)] sm:auto-rows-[minmax(90px,1fr)] gap-1 sm:gap-2 flex-1 pb-4 overflow-y-auto custom-scrollbar p-1">
                            {daysArray.map((day, i) => {
                                if (i < firstDay) return <div key={i} className="bg-transparent" />;
                                const dayNum = i - firstDay + 1;
                                const dObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
                                const dateStr = toLocalISOString(dObj);
                                const isToday = dateStr === toLocalISOString(new Date());
                                const isSelected = dateStr === toLocalISOString(selectedDate);
                                const dayEvents = events.filter(e => e.date === dateStr);

                                return (
                                    <div key={i} onClick={() => setSelectedDate(dObj)}
                                        // 3. เอา min-h-[80px] ออกจากกล่อง เพราะเราคุมขั้นต่ำจาก auto-rows ของ Grid ไปแล้ว
                                        className={`
                                            relative p-1 sm:p-3 rounded-lg sm:rounded-2xl border cursor-pointer flex flex-col gap-1 transition-all duration-200 group h-full bg-white overflow-hidden
                                            ${isSelected 
                                                ? 'border-[#545BE8] ring-[2px] sm:ring-[3px] ring-[#545BE8]/20 shadow-md z-10' 
                                                : 'border-slate-100 hover:border-[#545BE8]/40 hover:shadow-md'
                                            }
                                        `}>
                                        <div className="flex justify-between items-start mb-0.5 sm:mb-1.5">
                                            <span className={`
                                                w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-[10px] sm:text-sm font-bold transition-all shrink-0
                                                ${isToday 
                                                    ? 'bg-[#545BE8] text-white shadow-md shadow-indigo-200' 
                                                    : isSelected ? 'bg-indigo-100 text-[#545BE8]' : 'text-slate-600 group-hover:bg-slate-50'}
                                            `}>
                                                {dayNum}
                                            </span>
                                            {dayEvents.length > 0 && !isSelected && !isToday && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 sm:mt-2 mr-0.5 sm:mr-1 shrink-0"></span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-0.5 sm:gap-1 overflow-hidden">
                                            {dayEvents.slice(0, 3).map((evt, idx) => {
                                                const styles = getEventStyles(evt); 
                                                return (
                                                    <div key={idx} className={`flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded sm:rounded-md font-medium ${styles.bg} ${styles.text} truncate`}>
                                                        <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0 ${styles.dot}`}></div>
                                                        <span className="truncate flex-1">{evt.time.split('-')[0]} <span className="hidden sm:inline ml-0.5 opacity-80">{evt.location}</span></span>
                                                    </div>
                                                );
                                            })}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[8px] sm:text-[10px] text-slate-400 font-semibold pl-1 mt-0.5">
                                                    +{dayEvents.length - 3} <span className="hidden sm:inline">งาน</span>
                                                </div>
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

export default DispatchCalendarDashboard;