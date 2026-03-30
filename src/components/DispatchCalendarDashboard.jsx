import React, { useState } from 'react';
import { 
    CalendarDays, X, Plus, Clock, Users, CheckCircle, ChevronLeft, ChevronRight, MapPin, Calendar 
} from 'lucide-react';

// ==========================================
// 1. Shared Components
// ==========================================
const StatCard = ({ label, value, colorClass, bgClass, icon: Icon }) => (
    <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100/60 flex items-center justify-between group hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.15)] hover:-translate-y-1 transition-all duration-300">
        <div>
            <div className="text-slate-500 text-xs font-medium mb-1.5">{label}</div>
            <div className={`text-2xl font-black tracking-tight ${colorClass}`}>{value}</div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass} transition-colors group-hover:scale-110 duration-300`}>
            {Icon && <Icon className={`w-6 h-6 ${colorClass}`} />}
        </div>
    </div>
);

// ==========================================
// 2. Helpers 
// ==========================================
const getDispatchStatus = (dateStr, timeStr, closeTimeStr) => {
    if (!dateStr || !timeStr) return null;
    const closeTime = closeTimeStr || '16:00'; 

    const now = new Date();
    const start = new Date(`${dateStr}T${timeStr}:00`);
    const end = new Date(`${dateStr}T${closeTime}:00`);
    
    const thirtyMins = 30 * 60 * 1000; 

    if (now < new Date(start.getTime() - thirtyMins)) {
        return { text: 'รอปฏิบัติงาน', badge: 'bg-slate-100 text-slate-600 border-slate-200/60' };
    } else if (now >= new Date(start.getTime() - thirtyMins) && now < start) {
        return { text: 'เตรียมพร้อม', badge: 'bg-amber-100 text-amber-700 border-amber-200' };
    } else if (now >= start && now < new Date(end.getTime() - thirtyMins)) {
        return { text: 'กำลังดำเนินงาน', badge: 'bg-blue-100 text-blue-700 border-blue-200' };
    } else {
        return { text: 'สิ้นสุดปฏิบัติงาน', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
};

// ==========================================
// 3. Main Component
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
        primary: 'bg-indigo-600', 
        primaryHover: 'hover:bg-indigo-700',
        lightBg: 'bg-indigo-50',
        text: 'text-indigo-600',
    };

    const getEventStyles = (evt) => {
        if (evt.type === 'meeting') {
            return { border: 'border-l-teal-400', bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-400' };
        }
        
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
        <div className={isInline 
            ? "w-full flex-1 flex flex-col bg-slate-50 rounded-3xl overflow-hidden"
            : "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300"}>
            
            <div className={`w-full flex flex-col overflow-hidden bg-slate-50/50 shadow-2xl rounded-3xl ring-1 ring-slate-900/5 ${isInline ? 'h-full min-h-[600px] shadow-none ring-0' : 'max-w-7xl h-[90vh]'}`}>
                
                {/* Header */}
                <div className="bg-white px-6 py-5 flex justify-between items-center border-b border-slate-200/60 shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 shadow-sm border border-indigo-100`}>
                            <Calendar className={`w-6 h-6 ${theme.text}`} />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 leading-tight tracking-tight">ตารางแผนงานออกหน่วย</h3>
                            <p className="text-sm text-slate-500 font-medium mt-1">Dispatch Dashboard & Planning</p>
                        </div>
                    </div>
                    {!isInline && (
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/20">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body Layout */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden relative">
                    
                    {/* Left Panel (ข้อมูลหน่วย) */}
                    <div className="w-full lg:w-[400px] bg-slate-50/80 border-b lg:border-b-0 lg:border-r border-slate-200/60 flex flex-col shrink-0 order-2 lg:order-1 h-auto lg:h-full z-10">
                        <div className="p-6 flex flex-col gap-6 lg:overflow-y-auto custom-scrollbar flex-1">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard label="งานทั้งหมด" value={totalEvents} colorClass="text-indigo-600" bgClass="bg-indigo-100/50" icon={CheckCircle} />
                                <StatCard label="รอบปฏิบัติ" value={upcomingEvents} colorClass="text-orange-500" bgClass="bg-orange-100/50" icon={Clock} />
                            </div>

                            {canEdit && (
                                <button 
                                    onClick={onOpenForm}
                                    className={`w-full py-3.5 ${theme.primary} ${theme.primaryHover} text-white rounded-2xl font-bold shadow-[0_8px_16px_-6px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2 transition-all hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] text-sm sm:text-base`}
                                >
                                    <Plus className="w-5 h-5" /> เพิ่มแผนงานออกหน่วย
                                </button>
                            )}

                            <div className="flex-1 flex flex-col bg-white rounded-3xl p-5 shadow-sm border border-slate-100/60">
                                <div className="flex items-center justify-between mb-5">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2.5 text-base">
                                        <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                                        {selectedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric'})}
                                    </h4>
                                    <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">{selectedDateEvents.length} งาน</span>
                                </div>
                                
                                <div className="space-y-4 pb-2">
                                    {selectedDateEvents.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                                                <CalendarDays className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <span className="text-slate-600 font-semibold text-sm">ไม่มีกำหนดการในวันนี้</span>
                                            <span className="text-slate-400 text-xs mt-1.5">คลิกที่ปุ่มเพิ่มแผนงานเพื่อสร้างกำหนดการใหม่</span>
                                        </div>
                                    ) : (
                                        selectedDateEvents.map((evt, idx) => {
                                            const styles = getEventStyles(evt); 
                                            const status = typeof getDispatchStatus === 'function' ? getDispatchStatus(evt.date, evt.time, evt.closingTime) : null; 

                                            return (
                                                <div key={idx} onClick={() => canEdit && onEventClick && onEventClick(evt)}
                                                    className={`group bg-white p-4.5 rounded-2xl border border-slate-100 border-l-4 ${styles.border} shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.1)] transition-all duration-300 ${canEdit ? 'cursor-pointer hover:-translate-y-1' : 'cursor-default'}`}
                                                >
                                                    <div className="flex justify-between items-start gap-3 mb-3">
                                                        <div className="flex flex-col gap-2.5 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="inline-flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-semibold">
                                                                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {evt.time} - {evt.closingTime || '12:00'} 
                                                                </span>
                                                                <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-bold ${styles.bg} ${styles.text}`}>
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
                                                                    <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className={`font-bold text-slate-800 text-sm sm:text-base leading-snug mb-4 transition-colors ${canEdit ? `group-hover:${styles.text}` : ''}`}>
                                                        {evt.location}
                                                    </div>
                                                    
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-slate-100/80">
                                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                                                            <span className="truncate">{evt.team || 'ไม่ได้ระบุทีม'}</span>
                                                        </div>
                                                        {status && (
                                                            <span className={`inline-flex items-center text-[11px] px-2.5 py-1 rounded-lg font-bold border ${status.badge}`}>
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
                    <div className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 flex flex-col order-1 lg:order-2 shrink-0 h-auto lg:h-full lg:overflow-hidden bg-white">
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight capitalize px-2 sm:px-0">
                                {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-200/80 p-1 self-end sm:self-auto">
                                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                                <div className="w-px h-5 bg-slate-200 mx-1"></div>
                                <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">วันนี้</button>
                                <div className="w-px h-5 bg-slate-200 mx-1"></div>
                                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Days of week header */}
                        <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-2 sm:mb-3">
                            {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((d, i) => (
                                <div key={d} className={`text-center text-[11px] sm:text-xs font-bold uppercase tracking-wider pb-2 ${i===0 || i===6 ? 'text-rose-500' : 'text-slate-400'}`}>
                                    <span className="hidden sm:inline">{d}</span>
                                    <span className="sm:hidden">{d.substring(0, 1)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 auto-rows-[minmax(70px,1fr)] sm:auto-rows-[minmax(100px,1fr)] gap-2 sm:gap-3 flex-1 pb-4 overflow-y-auto custom-scrollbar p-1">
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
                                        className={`
                                            relative p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border cursor-pointer flex flex-col gap-1.5 transition-all duration-300 group h-full bg-white overflow-hidden
                                            ${isSelected 
                                                ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-md z-10' 
                                                : 'border-slate-100 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5'
                                            }
                                        `}>
                                        <div className="flex justify-between items-start mb-1 sm:mb-2">
                                            <span className={`
                                                w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-[11px] sm:text-sm font-bold transition-all shrink-0
                                                ${isToday 
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                                                    : isSelected ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700 group-hover:bg-slate-100'}
                                            `}>
                                                {dayNum}
                                            </span>
                                            {dayEvents.length > 0 && !isSelected && !isToday && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 mr-1 shrink-0"></span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1 sm:gap-1.5 overflow-hidden">
                                            {dayEvents.slice(0, 3).map((evt, idx) => {
                                                const styles = getEventStyles(evt); 
                                                return (
                                                    <div key={idx} className={`flex items-center gap-1.5 text-[9px] sm:text-xs px-1.5 sm:px-2 py-1 rounded-md sm:rounded-lg font-medium ${styles.bg} ${styles.text} border border-white/50 truncate`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`}></div>
                                                        <span className="truncate flex-1">{evt.time.split('-')[0]} <span className="hidden xl:inline ml-1 opacity-70 font-normal">{evt.location}</span></span>
                                                    </div>
                                                );
                                            })}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[10px] sm:text-xs text-slate-400 font-semibold pl-1.5 mt-0.5">
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