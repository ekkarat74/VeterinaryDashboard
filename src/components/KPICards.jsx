import React from 'react';
import { 
    Syringe, Scissors, FileText, Database, Stethoscope, 
    Activity, Truck, BarChart3, MapPin, Trophy, Cat, Dog
} from 'lucide-react';

// --- 1. Sub-Component: การ์ด KPI (สำหรับยอดรวม) ---
const KPICard = ({ title, value, subtext, icon: Icon, colorClass, shadowClass }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default group relative overflow-hidden">
        {/* Decoration: วงกลมจางๆ ด้านหลัง */}
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 duration-500 ${colorClass}`}></div>
        
        <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{value.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full inline-block animate-pulse ${colorClass}`}></span>
                {subtext}
            </p>
        </div>
        
        {/* Icon Box */}
        <div className={`w-14 h-14 rounded-2xl ${colorClass} ${shadowClass} flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
            <Icon className="w-7 h-7 text-white drop-shadow-md" />
        </div>
    </div>
);

// --- 2. Sub-Component: การ์ด Unit (สำหรับแยกหน่วยงาน) ---
const UnitCard = ({ unit, index, maxVal }) => {
    // คำนวณ % ความยาวของหลอดพลัง (Progress Bar)
    const percentage = maxVal > 0 ? (unit.count / maxVal) * 100 : 0;
    
    // สร้างชุดสี Pastel หวานๆ อ่อนๆ 10 โทนสี
    const colorThemes = [
        { bg: "bg-blue-50/80", border: "hover:border-blue-300", icon: "text-blue-500", bar: "bg-blue-400", rank: "bg-blue-100 text-blue-700" },
        { bg: "bg-emerald-50/80", border: "hover:border-emerald-300", icon: "text-emerald-500", bar: "bg-emerald-400", rank: "bg-emerald-100 text-emerald-700" },
        { bg: "bg-purple-50/80", border: "hover:border-purple-300", icon: "text-purple-500", bar: "bg-purple-400", rank: "bg-purple-100 text-purple-700" },
        { bg: "bg-orange-50/80", border: "hover:border-orange-300", icon: "text-orange-500", bar: "bg-orange-400", rank: "bg-orange-100 text-orange-700" },
        { bg: "bg-pink-50/80", border: "hover:border-pink-300", icon: "text-pink-500", bar: "bg-pink-400", rank: "bg-pink-100 text-pink-700" },
        { bg: "bg-cyan-50/80", border: "hover:border-cyan-300", icon: "text-cyan-500", bar: "bg-cyan-400", rank: "bg-cyan-100 text-cyan-700" },
        { bg: "bg-amber-50/80", border: "hover:border-amber-300", icon: "text-amber-500", bar: "bg-amber-400", rank: "bg-amber-100 text-amber-700" },
        { bg: "bg-rose-50/80", border: "hover:border-rose-300", icon: "text-rose-500", bar: "bg-rose-400", rank: "bg-rose-100 text-rose-700" },
        { bg: "bg-teal-50/80", border: "hover:border-teal-300", icon: "text-teal-500", bar: "bg-teal-400", rank: "bg-teal-100 text-teal-700" },
        { bg: "bg-indigo-50/80", border: "hover:border-indigo-300", icon: "text-indigo-500", bar: "bg-indigo-400", rank: "bg-indigo-100 text-indigo-700" }
    ];

    // เลือกธีมสีตามลำดับ (index) โดยใช้ Modulo (%) เพื่อให้วนลูปสีได้หากมีหน่วยงานเยอะกว่า 10 หน่วย
    const theme = colorThemes[index % colorThemes.length];

    // ให้หน่วยงานอันดับ 1 (index 0) เป็นไอคอนถ้วยรางวัล นอกนั้นเป็นหมุดแผนที่
    const IconComponent = index === 0 ? Trophy : MapPin;

    return (
        <div className={`group relative ${theme.bg} rounded-xl border border-slate-200 shadow-sm hover:shadow-lg ${theme.border} transition-all duration-300 overflow-hidden h-full flex flex-col`}>
            <div className="p-5 flex flex-col flex-grow mb-1.5">
                <div className="flex justify-between items-start mb-4">
                    {/* Icon & Name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1"> 
                        <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-white shadow-sm group-hover:scale-110 transition-transform`}>
                            <IconComponent className={`w-5 h-5 ${theme.icon}`} />
                        </div>
                        <div className="min-w-0"> 
                            <p className="text-xs text-slate-500 font-medium">หน่วยงาน</p>
                            {/* เอา truncate ออก และใส่ leading-tight break-words เพื่อให้แสดงชื่อเต็มได้ (อาจจะขึ้นบรรทัดใหม่ถ้ายาวเกินกรอบ) */}
                            <h4 className="font-bold text-slate-800 text-sm leading-tight break-words" title={unit.name}>
                                {unit.name}
                            </h4>
                        </div>
                    </div>
                    
                    {/* Rank Badge */}
                    <div className={`text-xs font-bold px-2 py-1 rounded-md ${theme.rank}`}>
                        #{index + 1}
                    </div>
                </div>

                <div className="mt-auto">
                    {/* Value Section */}
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                            {unit.count.toLocaleString()}
                        </span>
                        <span className="text-sm text-slate-500 font-medium mb-1">ครั้ง</span>
                    </div>

                    {/* ข้อมูลสุนัข/แมว */}
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-200/50">
                        <div className="flex items-center gap-1.5 bg-white/70 px-2 py-1 rounded-md shadow-sm">
                            <Dog className="w-3.5 h-3.5 text-orange-600" />
                            <span className="text-xs font-bold text-orange-700">{unit.dog.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/70 px-2 py-1 rounded-md shadow-sm">
                            <Cat className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-bold text-blue-700">{unit.cat.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar Background */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-200/50">
                {/* Active Progress */}
                <div 
                    className={`h-full ${theme.bar} group-hover:h-2 transition-all duration-500 ease-out`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

// --- 3. Main Component: ส่วนแสดงผลทั้งหมด ---
const KPISection = ({ totals, unitStats = [] }) => {
    // หาค่าสูงสุดเพื่อทำ Progress Bar
    const maxUnitCount = Math.max(...unitStats.map(u => u.count), 1);

    return (
        <div className="space-y-8">
            {/* ส่วนสถิติแยกตามหน่วย (Unit Dispatch) - ใช้ UnitCard ใหม่ */}
            {unitStats.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Truck className="w-5 h-5 text-indigo-600" /> 
                            </div>
                            <span>สถิติการออกปฏิบัติงาน (Unit Dispatch)</span>
                        </h3>
                        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            รวม {unitStats.length} หน่วย
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                        {unitStats.map((unit, index) => (
                            <UnitCard 
                                key={index} 
                                unit={unit} 
                                index={index} 
                                maxVal={maxUnitCount} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ส่วนยอดรวม (Overall Statistics) - ใช้ KPICard เดิม */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    สรุปยอดรวมการให้บริการ (Overall Statistics)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <KPICard 
                        title="จำนวนวัคซีนทั้งหมด" 
                        value={totals.vaccine} 
                        subtext="สะสมรวมทุกหน่วย" 
                        icon={Syringe} 
                        colorClass="bg-gradient-to-br from-blue-500 to-blue-700" 
                        shadowClass="shadow-lg shadow-blue-500/30"
                    />
                    <KPICard 
                        title="จำนวนการทำหมัน" 
                        value={totals.sterilize} 
                        subtext="สุนัขและแมว" 
                        icon={Scissors} 
                        colorClass="bg-gradient-to-br from-orange-400 to-orange-600" 
                        shadowClass="shadow-lg shadow-orange-500/30" 
                    />
                    <KPICard 
                        title="ขึ้นทะเบียนสัตว์เลี้ยง" 
                        value={totals.register} 
                        subtext="ลงระบบฐานข้อมูล" 
                        icon={FileText} 
                        colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600" 
                        shadowClass="shadow-lg shadow-emerald-500/30" 
                    />
                    <KPICard 
                        title="ฝังไมโครชิป" 
                        value={totals.microchip} 
                        subtext="ระบุตัวตนสัตว์" 
                        icon={Database} 
                        colorClass="bg-gradient-to-br from-purple-500 to-purple-700" 
                        shadowClass="shadow-lg shadow-purple-500/30" 
                    />
                    <KPICard 
                        title="จำนวนการรักษาสัตว์" 
                        value={totals.medical} 
                        subtext="บริการรักษาพยาบาล" 
                        icon={Stethoscope} 
                        colorClass="bg-gradient-to-br from-rose-400 to-rose-600" 
                        shadowClass="shadow-lg shadow-rose-500/30" 
                    />
                </div>
            </div>
        </div>
    );
};

export default KPISection;