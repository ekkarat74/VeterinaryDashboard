import React from 'react';
import { 
    Syringe, Scissors, FileText, Database, Stethoscope, 
    Activity, Truck, BarChart3, MapPin, Trophy, Cat, Dog,
    AlertCircle
} from 'lucide-react';

const getPercentage = (part, total) => (total > 0 ? (part / total) * 100 : 0);

const KPICard = ({ title, value, subtext, icon: Icon, colorClass, shadowClass, dogCount = 0, catCount = 0 }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow duration-300 cursor-default group relative overflow-hidden h-full">
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${colorClass}`}></div>
        <div className="flex justify-between items-start w-full relative z-10 mb-4">
            <div className="flex-1 pr-2">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1 leading-tight line-clamp-2 min-h-[2rem]">
                    {title}
                </p>
                <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                    {(value || 0).toLocaleString()}
                </h3>
                <p className="text-[9px] text-slate-400 mt-2 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${colorClass.split(' ')[0].replace('bg-gradient-to-br', 'bg-blue-500')}`}></span>
                    {subtext}
                </p>
            </div>
            
            <div className={`w-14 h-14 rounded-2xl ${colorClass} ${shadowClass} flex items-center justify-center shrink-0`}>
                <Icon className="w-7 h-7 text-white drop-shadow-md" />
            </div>
        </div>

        {(dogCount > 0 || catCount > 0) && (
            <div className="pt-3 border-t border-slate-100 mt-auto relative z-10">
                <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1">
                        <Dog className="w-3 h-3 text-orange-500" />
                        <span className="text-[9px] font-bold text-slate-600">{dogCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-600">{catCount.toLocaleString()}</span>
                        <Cat className="w-3 h-3 text-blue-500" />
                    </div>
                </div>
                
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                        style={{ width: `${getPercentage(dogCount, (dogCount + catCount))}%` }} 
                        className="bg-orange-400 h-full transition-all duration-1000" 
                    />
                    <div 
                        style={{ width: `${getPercentage(catCount, (dogCount + catCount))}%` }} 
                        className="bg-blue-400 h-full transition-all duration-1000" 
                    />
                </div>
            </div>
        )}
    </div>
);

const UnitCard = ({ unit, index, maxVal }) => {
    const percentage = maxVal > 0 ? (unit.count / maxVal) * 100 : 0;
    
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

    const theme = colorThemes[index % colorThemes.length];
    const IconComponent = index === 0 ? Trophy : MapPin;

    return (
        <div className={`group relative ${theme.bg} rounded-xl border border-slate-200 shadow-sm hover:shadow-lg ${theme.border} transition-all duration-300 overflow-hidden h-full flex flex-col`}>
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1"> 
                        <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-white shadow-sm`}>
                            <IconComponent className={`w-5 h-5 ${theme.icon}`} />
                        </div>
                        <div className="min-w-0"> 
                            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Unit No.{index + 1}</p>
                            <h4 className="font-bold text-slate-800 text-xs leading-tight truncate" title={unit.name}>
                                {unit.name}
                            </h4>
                        </div>
                    </div>
                    
                    <div className={`text-[9px] font-bold px-2 py-1 rounded-md ${theme.rank}`}>
                        #{index + 1}
                    </div>
                </div>

                <div className={`mt-auto ${unit.count === 0 ? 'opacity-40' : 'opacity-100'}`}>
                    <div className="flex items-end gap-1.5 mb-2">
                        <span className="text-2xl font-extrabold text-slate-800 tracking-tighter">
                            {unit.count.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold mb-1.5 uppercase">ครั้ง</span>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200/50">
                        <div className="flex items-center gap-1 bg-white/70 px-2 py-1 rounded shadow-sm">
                            <Dog className="w-3 h-3 text-orange-600" />
                            <span className="text-[9px] font-bold text-orange-700">{unit.dog.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/70 px-2 py-1 rounded shadow-sm">
                            <Cat className="w-3 h-3 text-blue-600" />
                            <span className="text-[9px] font-bold text-blue-700">{unit.cat.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-200/30">
                <div 
                    className={`h-full ${theme.bar}`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const KPISection = ({ totals = {}, unitStats = [] }) => {
    const maxUnitCount = unitStats.length > 0 ? Math.max(...unitStats.map(u => u.count), 1) : 1;

    return (
        <div className="p-4 space-y-10">
            {/* 1. ส่วนสถิติแยกตามหน่วย (Unit Dispatch) */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                                <Truck className="w-5 h-5 text-white" /> 
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 leading-none mb-1">สถิติการออกปฏิบัติงาน</h3>
                                <p className="text-[11px] text-slate-400 font-medium">แยกตามหน่วยให้บริการ (Unit Dispatch)</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full uppercase tracking-wider">
                            Active: {unitStats.length} Units
                        </span>
                    </div>
                </div>

                {unitStats.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                        {unitStats.map((unit, index) => (
                            <UnitCard 
                                key={unit.id || index} 
                                unit={unit} 
                                index={index} 
                                maxVal={maxUnitCount} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                        <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-xs font-medium">ไม่พบข้อมูลสถิติรายหน่วยงาน</p>
                    </div>
                )}
            </div>

            {/* 2. ส่วนยอดรวม (Overall Statistics) */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <div>
                    <div className="flex items-center gap-2 mb-5">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <h3 className="text-base font-bold text-slate-700">สรุปยอดรวมการให้บริการ (Overall)</h3>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <KPICard 
                        title="จำนวนวัคซีนทั้งหมด" 
                        value={totals.vaccine} 
                        dogCount={totals.dog?.vaccine}
                        catCount={totals.cat?.vaccine}
                        subtext="สะสมรวมทุกหน่วย" 
                        icon={Syringe} 
                        colorClass="bg-gradient-to-br from-blue-500 to-blue-700" 
                        shadowClass="shadow-lg shadow-blue-500/30"
                    />
                    <KPICard 
                        title="จำนวนการทำหมัน" 
                        value={totals.sterilize}
                        dogCount={totals.dog?.sterilize}
                        catCount={totals.cat?.sterilize} 
                        subtext="สุนัขและแมว" 
                        icon={Scissors} 
                        colorClass="bg-gradient-to-br from-orange-400 to-orange-600" 
                        shadowClass="shadow-lg shadow-orange-500/30" 
                    />
                    <KPICard 
                        title="ขึ้นทะเบียนสัตว์เลี้ยง" 
                        value={totals.register} 
                        dogCount={totals.dog?.register}
                        catCount={totals.cat?.register}
                        subtext="ลงระบบฐานข้อมูล" 
                        icon={FileText} 
                        colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600" 
                        shadowClass="shadow-lg shadow-emerald-500/30" 
                    />
                    <KPICard 
                        title="ฝังไมโครชิป" 
                        value={totals.microchip} 
                        dogCount={totals.dog?.microchip}
                        catCount={totals.cat?.microchip}
                        subtext="ระบุตัวตนสัตว์" 
                        icon={Database} 
                        colorClass="bg-gradient-to-br from-purple-500 to-purple-700" 
                        shadowClass="shadow-lg shadow-purple-500/30" 
                    />
                    <KPICard 
                        title="จำนวนการรักษาสัตว์" 
                        value={totals.medical}
                        dogCount={totals.dog?.medical}
                        catCount={totals.cat?.medical} 
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