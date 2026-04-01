import React, { useState, useMemo } from 'react';
import { 
    CalendarDays, X, Plus, Clock, Users, CheckCircle, ChevronLeft, ChevronRight, Calendar, Search,
    Phone, MapPin
} from 'lucide-react';

// ==========================================
// 1. Shared Components
// ==========================================
const StatCard = ({ label, value, colorClass, bgClass, icon: Icon }) => (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100/60 flex items-center justify-between group hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.15)] hover:-translate-y-1 transition-all duration-300">
        <div>
            <div className="text-slate-500 text-[11px] sm:text-xs font-bold mb-1">{label}</div>
            <div className={`text-xl sm:text-2xl font-black tracking-tight ${colorClass}`}>{value}</div>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${bgClass} transition-colors group-hover:scale-110 duration-300 shrink-0`}>
            {Icon && <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorClass}`} />}
        </div>
    </div>
);

// ==========================================
// 2. Helpers 
// ==========================================
const getDispatchStatus = (evt) => {
    if (!evt || !evt.date || !evt.time) return null;

    // 1. ตรวจสอบสถานะ Manual Override ก่อน
    if (evt.status === 'cancelled') {
        return { text: 'ยกเลิก', badge: 'bg-rose-100 text-rose-700 border-rose-200' };
    }
    if (evt.status === 'postponed') {
        return { text: 'เลื่อน', badge: 'bg-orange-100 text-orange-700 border-orange-200' };
    }
    if (evt.status === 'completed') {
        return { text: 'เสร็จสิ้น (Manual)', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }

    // 2. ถ้าเป็น 'auto' หรือไม่มีสถานะ ให้คำนวณจากเวลา
    const closeTime = evt.closingTime || '16:00'; 
    const now = new Date();
    const start = new Date(`${evt.date}T${evt.time}:00`);
    const end = new Date(`${evt.date}T${closeTime}:00`);
    
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

// ฟังก์ชันจัดกลุ่มชื่อหน่วยงานให้เหลือแค่ประเภทหลัก (ตัด A, B, ทีม, ภาษาอังกฤษ ออก)
const getBaseType = (title, type) => {
    let t = title || (type === 'meeting' ? 'นัดหมายประชุม' : 'ออกหน่วย');
    if (t === 'นัดหมายประชุม') return t;
    
    // ตัดข้อความในวงเล็บ (เช่น ภาษาอังกฤษ) ออก
    t = t.replace(/\s*\(.*?\)/g, '');
    // ตัดคำว่า ทีม/สาย และตัวอักษร 1 ตัวที่ต่อท้าย (เช่น A, B)
    t = t.replace(/\s+(ทีม|สาย)?\s*[A-Za-zก-ฮ0-9]$/i, '');
    
    return t.trim() || 'ออกหน่วย';
};

// ==========================================
// 3. Main Component
// ==========================================
const DispatchCalendarDashboard = ({ isOpen, onClose, onOpenForm, events = [], onEventClick, isInline = false, canEdit, onToggleVisibility }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('ทุกประเภท');

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

    // --- นับจำนวนแยกตามประเภทหลัก (Breakdown) ---
    const eventTypes = useMemo(() => {
        const counts = { 'ทุกประเภท': events.length };
        events.forEach(e => {
            const baseType = getBaseType(e.title, e.type);
            counts[baseType] = (counts[baseType] || 0) + 1;
        });
        
        // จัดเรียงให้ 'ทุกประเภท' อยู่ซ้ายสุด นอกนั้นเรียงตามจำนวนจากมากไปน้อย
        return Object.entries(counts).sort((a, b) => {
            if (a[0] === 'ทุกประเภท') return -1;
            if (b[0] === 'ทุกประเภท') return 1;
            return b[1] - a[1];
        });
    }, [events]);

    // --- ระบบค้นหาและตัวกรองแบบกลุ่มประเภท ---
    const displayEvents = useMemo(() => {
        return events.filter(e => {
            // ค้นหาข้อความ
            const matchSearch = !searchTerm || 
                e.location?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.team?.toLowerCase().includes(searchTerm.toLowerCase());
            
            // กรองประเภทหลัก
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
                <div className="bg-white px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center border-b border-slate-200/60 shrink-0 z-20">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 shadow-sm border border-indigo-100`}>
                            <Calendar className={`w-5 h-5 sm:w-6 h-6 ${theme.text}`} />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-2xl font-extrabold text-slate-800 leading-tight tracking-tight">ตารางแผนงานออกหน่วย</h3>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 sm:mt-1">Dispatch Dashboard & Planning</p>
                        </div>
                    </div>
                    
                    {/* กลุ่มปุ่มด้านขวาบน */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {canEdit && (
                            <button 
                                onClick={onOpenForm}
                                className={`px-3 sm:px-5 py-2 sm:py-2.5 ${theme.primary} ${theme.primaryHover} text-white rounded-lg sm:rounded-xl font-bold shadow-[0_4px_12px_-4px_rgba(79,70,229,0.5)] flex items-center gap-1.5 sm:gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 text-xs sm:text-sm`}
                            >
                                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                                <span className="hidden sm:inline">เพิ่มงาน</span>
                            </button>
                        )}
                        
                        {!isInline && (
                            <button onClick={onClose} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/20">
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Body Layout */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden relative bg-slate-50/50">
                    
                    {/* Left Panel: Calendar & Stats (ปรับขนาดให้เป็น Sidebar ด้านซ้าย) */}
                    <div className="w-full lg:w-[360px] xl:w-[400px] p-4 sm:p-5 flex flex-col order-1 shrink-0 h-auto lg:h-full lg:overflow-y-auto custom-scrollbar lg:border-r border-slate-200/60">
                        
                        {/* Stat Cards (ปรับเป็น Grid 2x2) */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <StatCard label="งานทั้งหมด" value={totalEvents} colorClass="text-indigo-600" bgClass="bg-indigo-100/50" icon={CheckCircle} />
                            <StatCard label="วันนี้" value={todayEventsCount} colorClass="text-blue-500" bgClass="bg-blue-100/50" icon={Calendar} />
                            <StatCard label="รอบปฏิบัติ" value={upcomingEvents} colorClass="text-orange-500" bgClass="bg-orange-100/50" icon={Clock} />
                            <StatCard label="เผยแพร่" value={publicEventsCount} colorClass="text-emerald-500" bgClass="bg-emerald-100/50" icon={Users} />
                        </div>

                        {/* Calendar Card */}
                        <div className="bg-white rounded-[1.5rem] p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100/80">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-black text-slate-800 tracking-tight">
                                    {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                                </h2>
                                <div className="flex items-center bg-slate-50 rounded-lg border border-slate-100 p-0.5">
                                    <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white rounded-md text-slate-500 transition-colors shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
                                    <button onClick={() => setCurrentDate(new Date())} className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:bg-white rounded-md transition-colors shadow-sm">วันนี้</button>
                                    <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white rounded-md text-slate-500 transition-colors shadow-sm"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                            </div>

                            {/* Days of week header */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d, i) => (
                                    <div key={d} className={`text-center text-[11px] font-bold pb-2 ${i===0 || i===6 ? 'text-rose-500' : 'text-slate-400'}`}>
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid (ย่อให้แสดงเป็นจุดสีแทนข้อความ) */}
                            <div className="grid grid-cols-7 auto-rows-[minmax(45px,1fr)] gap-1.5">
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
                                            className={`
                                                relative p-1 rounded-xl border cursor-pointer flex flex-col items-center justify-start gap-1 transition-all duration-300 bg-white
                                                ${isSelected 
                                                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm z-10' 
                                                    : 'border-slate-100 hover:border-indigo-300 hover:bg-slate-50/50'
                                                }
                                            `}>
                                            <span className={`
                                                w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-bold transition-all
                                                ${isToday 
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                                                    : isSelected ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700'}
                                            `}>
                                                {dayNum}
                                            </span>
                                            
                                            {/* Dots (จุดสีแทนกิจกรรม) */}
                                            {dotColors.length > 0 && (
                                                <div className="flex flex-wrap justify-center gap-0.5 px-1 pb-1">
                                                    {dotColors.slice(0, 4).map((dot, idx) => (
                                                        <span key={idx} className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
                                                    ))}
                                                    {dotColors.length > 4 && <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend (คำอธิบายสี) */}
                            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mt-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold"><div className="w-2 h-2 rounded-full bg-blue-400"></div> วัคซีน</div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold"><div className="w-2 h-2 rounded-full bg-pink-400"></div> ทำหมัน</div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> ตรวจสุขภาพ</div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold"><div className="w-2 h-2 rounded-full bg-orange-400"></div> รักษา</div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold"><div className="w-2 h-2 rounded-full bg-rose-400"></div> ด่วน</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: ข้อมูลและการ์ดเหตุการณ์ */}
                    <div className="flex-1 flex flex-col shrink-0 order-2 h-[500px] lg:h-full z-10 p-4 sm:p-5 lg:p-8 bg-transparent">
                        <div className="flex flex-col gap-5 lg:gap-6 lg:overflow-y-auto custom-scrollbar flex-1 pb-8">
                            
                            {/* Header Panel ขวา */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg sm:text-xl leading-tight">
                                        {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}
                                    </h4>
                                    <p className="text-sm text-slate-500 font-medium mt-1">
                                        มี {selectedDateEvents.length} กิจกรรม
                                        {selectedDateEvents.length > 0 && ` (แสดง ${selectedDateEvents.length})`}
                                    </p>
                                </div>
                            </div>

                            {/* Search and Filters */}
                            <div className="space-y-4">
                                {/* กล่องค้นหา (Search) */}
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="ค้นหางาน โลเคชัน ทีม เบอร์โทร..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-11 pr-11 py-3 bg-white border border-slate-200/80 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow shadow-sm font-medium text-slate-700 placeholder:font-normal"
                                    />
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* ปุ่มกรองแยกประเภทงานหลัก (Breakdown Filters) */}
                                <div className="flex flex-wrap gap-2">
                                    {eventTypes.map(([type, count]) => {
                                        const isSelected = selectedType === type;
                                        
                                        // กำหนด Icon ของแต่ละป้ายกำกับ
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
                                            <button
                                                key={type}
                                                onClick={() => setSelectedType(type)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-bold border transition-all duration-200 ${
                                                    isSelected 
                                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-1 ring-indigo-500/10' 
                                                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                                }`}
                                            >
                                                <span className="mr-0.5 text-sm">{getIcon(type)}</span>
                                                {type}
                                                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${isSelected ? 'bg-indigo-100/80 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {count}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* รายการเหตุการณ์ */}
                            <div className="flex-1 flex flex-col relative">
                                <div className="space-y-4 pb-4">
                                    {selectedDateEvents.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white/50 rounded-3xl border border-dashed border-slate-200 mt-2">
                                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                                                <CalendarDays className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <span className="text-slate-600 font-bold text-sm">ไม่พบกิจกรรม</span>
                                            <span className="text-slate-400 text-xs mt-1.5 font-medium max-w-[200px]">
                                                {searchTerm || selectedType !== 'ทุกประเภท' 
                                                    ? 'ลองปรับเปลี่ยนเงื่อนไขการค้นหา หรือเลือกตัวกรองใหม่' 
                                                    : 'ไม่มีกำหนดการในวันนี้ คลิกที่ปุ่มเพิ่มงานเพื่อสร้างกำหนดการใหม่'}
                                            </span>
                                        </div>
                                    ) : (
                                        selectedDateEvents.map((evt, idx) => {
                                            const styles = getEventStyles(evt); 
                                            const status = typeof getDispatchStatus === 'function' ? getDispatchStatus(evt) : null;

                                            // ✨ ดึงเบอร์โทร (รองรับฟอร์แมตเก่าและฟอร์แมตใหม่)
                                            let phoneNum = evt.controllerPhone;
                                            if (!phoneNum && evt.staff?.controllers?.[0]) {
                                                const splitData = evt.staff.controllers[0].split('โทร.');
                                                if (splitData.length > 1) phoneNum = splitData[1].trim();
                                            }

                                            return (
                                                <div key={idx} onClick={() => canEdit && onEventClick && onEventClick(evt)}
                                                    className={`group bg-white p-5 rounded-2xl border border-slate-100 border-l-[5px] ${styles.border} shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] transition-all duration-300 ${canEdit ? 'cursor-pointer hover:-translate-y-1' : 'cursor-default'}`}
                                                >
                                                    <div className="flex justify-between items-start gap-3 mb-3.5">
                                                        <div className="flex flex-col gap-2.5 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="inline-flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200/60 text-slate-600 px-2.5 py-1 rounded-lg font-bold">
                                                                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {evt.time} - {evt.closingTime || '12:00'} 
                                                                </span>
                                                                <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-bold ${styles.bg} ${styles.text}`}>
                                                                    {evt.title || (evt.type === 'meeting' ? 'นัดหมายประชุม' : 'ออกหน่วย')}
                                                                </span>
                                                                {evt.isVisibleToPublic === false && !canEdit && (
                                                                    <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                                        (ซ่อน)
                                                                    </span>
                                                                )}
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

                                                    <div className={`font-bold text-slate-800 text-base leading-snug mb-3 transition-colors ${canEdit ? `group-hover:${styles.text}` : ''}`}>
                                                        {evt.location}
                                                    </div>

                                                    {/* ✨ ส่วนปุ่มแผนที่ และ โทรศัพท์ */}
                                                    {(evt.mapLink || phoneNum) && (
                                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                                            {evt.mapLink && (
                                                                <a 
                                                                    href={evt.mapLink} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    onClick={(e) => e.stopPropagation()} 
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-xs font-bold transition-all border border-blue-100 shadow-sm"
                                                                >
                                                                    <MapPin className="w-3.5 h-3.5" /> แผนที่
                                                                </a>
                                                            )}
                                                            
                                                            {phoneNum && (
                                                                <a 
                                                                    href={`tel:${phoneNum.replace(/\D/g, '')}`} 
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg text-xs font-bold transition-all border border-emerald-100 shadow-sm"
                                                                    title="โทรหาผู้ควบคุม"
                                                                >
                                                                    <Phone className="w-3.5 h-3.5" /> โทร: {phoneNum}
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                                                        <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
                                                            <Users className="w-4 h-4 text-indigo-400" />
                                                            <span className="truncate">{evt.team || 'ไม่ได้ระบุทีม'}</span>
                                                        </div>
                                                        {status && (
                                                            <span className={`inline-flex items-center text-[11px] px-2.5 py-1.5 rounded-lg font-bold border ${status.badge}`}>
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
                </div>
            </div>
        </div>
    );
};

export default DispatchCalendarDashboard;