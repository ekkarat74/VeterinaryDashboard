import React from 'react';
import { Syringe, Scissors, FileText, Database, Stethoscope, Activity } from 'lucide-react';

// --- Sub-Component: การ์ดแต่ละใบ ---
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

// --- Main Component: ส่วนแสดงผล KPI ทั้งหมด ---
const KPISection = ({ totals }) => {
    return (
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
    );
};

export default KPISection;