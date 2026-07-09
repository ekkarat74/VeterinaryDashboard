import React, { useMemo, useState, useEffect } from 'react';
import { 
    Siren, Activity, Skull, AlertTriangle, MapPin, Calendar, Eye, 
    EyeOff, Edit, Trash2, TrendingUp, Search, PieChart as PieChartIcon, BarChart3,
    Database, Filter, ChevronLeft, ChevronRight, Syringe
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, Cell, Legend, PieChart, Pie, AreaChart, Area
} from 'recharts';
import OutbreakMap from '../modals/OutbreakMap';

// --------------------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------------------

interface AnimalDetail {
    male?: string | number;
    female?: string | number;
}

interface OutbreakInsight {
    spcc?: string;
    testNo?: string;
    animalType?: string;
    breed?: string;
    color?: string;
    gender?: string;
    age?: string;
    vaccineHistory?: string;
    ownership?: string;
}

export interface OutbreakItem {
    _id: string;
    date: string | Date;
    location: string;
    district: string;
    insight?: OutbreakInsight;
    stats?: {
        owned?: { dog?: AnimalDetail; cat?: AnimalDetail };
        unowned?: { dog?: AnimalDetail; cat?: AnimalDetail };
        feeder?: { dog?: AnimalDetail; cat?: AnimalDetail };
        dog?: AnimalDetail;
        cat?: AnimalDetail;
        dogs?: string | number;
        cats?: string | number;
    };
    dog?: AnimalDetail;
    cat?: AnimalDetail;
    dogMale?: string | number;
    dogFemale?: string | number;
    catMale?: string | number;
    catFemale?: string | number;
    dogs?: string | number;
    cats?: string | number;
    lat?: string | number;
    long?: string | number;
    createdBy?: string;
}

interface DistrictStat {
    name: string;
    count: number;
}

interface AnimalChartStat {
    name: string;
    dogMale: number;
    dogFemale: number;
    catMale: number;
    catFemale: number;
}

export interface OutbreakStats {
    total: number;
    topDistricts: DistrictStat[];
    animalChartData?: AnimalChartStat[];
}

interface RabiesOutbreakSectionProps {
    outbreakData: OutbreakItem[];
    filterYear: string;
    setFilterYear: (year: string) => void;
    years: string[];
    stats: OutbreakStats;
    filteredOutbreaks: OutbreakItem[];
    yearlyTrend?: any;
    hiddenIds: string[];
    toggleVisibility: (id: string) => void;
    onEdit: (item: OutbreakItem) => void;
    onDelete: (id: string) => void;
    canEdit: boolean;
    displayMode?: 'list' | 'table'; // รับค่าโหมดการแสดงผล
}

// --------------------------------------------------------
// CONSTANTS & HELPERS
// --------------------------------------------------------

const BAR_COLORS = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'];
const PIE_COLORS = ['#3b82f6', '#f97316', '#10b981']; 

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 ring-1 ring-slate-100/50">
                <p className="font-bold text-slate-800 mb-1 text-[10px]">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-[10px] text-slate-600 mt-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></span>
                            <span>{entry.name}:</span>
                        </div>
                        <span className="font-bold text-slate-800">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const calculateAnimalCounts = (item: OutbreakItem) => {
    let dog = 0, cat = 0;
    const getNum = (val: string | number | undefined) => typeof val === 'string' ? parseInt(val, 10) || 0 : val || 0;

    if (item.stats) {
        (['owned', 'unowned', 'feeder'] as const).forEach(type => {
            const statType = item.stats?.[type];
            if (statType) {
                dog += getNum(statType.dog?.male) + getNum(statType.dog?.female);
                cat += getNum(statType.cat?.male) + getNum(statType.cat?.female);
            }
        });
        dog += getNum(item.stats.dog?.male) + getNum(item.stats.dog?.female) + getNum(item.stats.dogs);
        cat += getNum(item.stats.cat?.male) + getNum(item.stats.cat?.female) + getNum(item.stats.cats);
    }
    dog += getNum(item.dog?.male) + getNum(item.dog?.female) + getNum(item.dogMale) + getNum(item.dogFemale) + getNum(item.dogs);
    cat += getNum(item.cat?.male) + getNum(item.cat?.female) + getNum(item.catMale) + getNum(item.catFemale) + getNum(item.cats);

    return { dog, cat };
};

// --------------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------------

const RabiesOutbreakSection: React.FC<RabiesOutbreakSectionProps> = ({ 
    outbreakData, filterYear, setFilterYear, years, stats, 
    filteredOutbreaks, yearlyTrend, hiddenIds, toggleVisibility, 
    onEdit, onDelete, canEdit,
    displayMode = 'table' // กำหนดค่าเริ่มต้นเป็น table
}) => {
    
    // --------------------------------------------------------
    // PAGINATION STATE
    // --------------------------------------------------------
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    useEffect(() => {
        setCurrentPage(1);
    }, [filterYear]);

    const totalPages = Math.ceil(filteredOutbreaks.length / itemsPerPage);
    const paginatedData = filteredOutbreaks.slice(
        (currentPage - 1) * itemsPerPage, 
        currentPage * itemsPerPage
    );

    // --------------------------------------------------------
    // DATA ANALYTICS
    // --------------------------------------------------------
    const { monthlyData, ownershipData } = useMemo(() => {
        const monthsThai = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const monthly = monthsThai.map(m => ({ month: m, count: 0 }));
        
        let owned = 0, unowned = 0, feeder = 0;

        filteredOutbreaks.forEach(item => {
            const d = new Date(item.date);
            if (!isNaN(d.getTime())) {
                monthly[d.getMonth()].count += 1;
            }

            const getNum = (val: string | number | undefined) => typeof val === 'string' ? parseInt(val, 10) || 0 : val || 0;
            
            if (item.stats) {
                (['owned', 'unowned', 'feeder'] as const).forEach(type => {
                    const statType = item.stats?.[type];
                    const total = getNum(statType?.dog?.male) + getNum(statType?.dog?.female) +
                                  getNum(statType?.cat?.male) + getNum(statType?.cat?.female);
                    if (type === 'owned') owned += total;
                    if (type === 'unowned') unowned += total;
                    if (type === 'feeder') feeder += total;
                });
            }
        });

        const ownership = [
            { name: 'มีเจ้าของ', value: owned },
            { name: 'ไม่มีเจ้าของ', value: unowned },
            { name: 'มีผู้ให้อาหาร', value: feeder }
        ].filter(d => d.value > 0);

        return { monthlyData: monthly, ownershipData: ownership };
    }, [filteredOutbreaks]);

    if (outbreakData.length === 0) {
        return (
            <div className="mt-8 mb-16 bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center shadow-sm">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                    <Siren className="w-7 h-7 text-rose-500" />
                </div>

                <h3 className="text-base font-black text-slate-800">
                    ยังไม่มีข้อมูลจุดเสี่ยงโรคพิษสุนัขบ้า
                </h3>

                <p className="text-xs text-slate-500 mt-2">
                    เมื่อเพิ่มข้อมูลจุดเสี่ยงหรือ Import CSV สำเร็จ รายการจะแสดงในหน้านี้ทันที
                </p>
            </div>
        );
    }

    if (outbreakData.length > 0 && filteredOutbreaks.length === 0) {
        return (
            <div className="mt-8 mb-16 bg-white rounded-3xl border border-amber-200 p-10 text-center shadow-sm">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                    <Filter className="w-7 h-7 text-amber-500" />
                </div>

                <h3 className="text-base font-black text-slate-800">
                    มีข้อมูลจุดเสี่ยงแล้ว แต่ถูกตัวกรองซ่อนไว้
                </h3>

                <p className="text-xs text-slate-500 mt-2">
                    พบข้อมูลทั้งหมด {outbreakData.length.toLocaleString('th-TH')} รายการ แต่ไม่ตรงกับปีหรือตัวกรองที่เลือกอยู่
                </p>

                <button
                    type="button"
                    onClick={() => setFilterYear('ทั้งหมด')}
                    className="mt-5 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 transition-colors"
                >
                    แสดงข้อมูลสะสมทั้งหมด
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700 mt-8 mb-16 font-sans">
            
            {/* Header Section */}
            <div className="relative overflow-hidden bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl shadow-slate-200">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Siren className="w-64 h-64 -mr-16 -mt-16 text-rose-500" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-rose-500/20 text-rose-300 text-[8px] font-bold px-2 py-1 rounded-full border border-rose-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                LIVE MONITORING
                            </span>
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-white">
                            ศูนย์เฝ้าระวัง<span className="text-rose-500">โรคพิษสุนัขบ้า</span>
                        </h3>
                        <p className="text-slate-400 font-medium flex items-center gap-2 text-[10px]">
                            <Activity className="w-4 h-4 text-rose-500" /> 
                            Rabies Outbreak Monitoring Center
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex items-center">
                        <div className="px-3 text-slate-400">
                            <Search className="w-4 h-4" />
                        </div>
                        <select 
                            value={filterYear} 
                            onChange={(e) => setFilterYear(e.target.value)} 
                            className="bg-transparent text-[11px] font-bold text-white outline-none cursor-pointer py-2 pr-4 [&>option]:text-slate-900"
                        >
                            <option value="ทั้งหมด">ข้อมูลสะสมทั้งหมด ({outbreakData.length})</option>
                            {years.map(y => (
                                <option key={y} value={y}>ปี พ.ศ. {parseInt(y) + 543}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Map Section */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 h-[45rem] relative z-0 flex flex-col">
                <div className="flex justify-between items-center mb-4 px-2">
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-red-500" /> แผนที่พิกัดจุดเกิดโรคพิษสุนัขบ้า
                        </h4>
                        <p className="text-[10px] text-slate-400">แสดงพิกัดและการจำลองรัศมีเฝ้าระวังโรค</p>
                    </div>
                </div>
                <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200">
                    <OutbreakMap 
                        outbreaks={filteredOutbreaks.filter(item => !hiddenIds.includes(item._id))} 
                        onDeleteOutbreak={canEdit ? onDelete : undefined} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column (Stats & Alerts) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="relative bg-gradient-to-br from-rose-500 via-red-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-rose-200 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                                    <Skull className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-rose-100 text-[9px] font-bold bg-black/10 px-2 py-1 rounded-lg">
                                    {filterYear === 'ทั้งหมด' ? 'ยอดสะสม' : `ปี ${parseInt(filterYear) + 543}`}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-rose-100 text-[10px] font-medium">จุดพบเชื้อรวม</p>
                                <h2 className="text-4xl font-black tracking-tighter">{stats.total}</h2>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/20 flex items-center gap-2 text-[10px] font-medium text-rose-50">
                                <AlertTriangle className="w-4 h-4" /> พื้นที่เฝ้าระวังพิเศษ (Red Zone)
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-2 mb-3 text-slate-400">
                                <MapPin className="w-4 h-4 group-hover:text-rose-500 transition-colors" />
                                <span className="text-[8px] font-bold uppercase tracking-wider">Top Zone</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 truncate" title={stats?.topDistricts?.[0]?.name}>
                                {stats?.topDistricts?.length > 0 ? stats.topDistricts[0].name : '-'}
                            </p>
                            <p className="text-[8px] text-slate-400 mt-1">พบมากที่สุด</p>
                        </div>
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-2 mb-3 text-slate-400">
                                <Calendar className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                                <span className="text-[8px] font-bold uppercase tracking-wider">Update</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800">
                                {filteredOutbreaks?.length > 0 
                                    ? (() => {
                                        const validDates = filteredOutbreaks.map(e => new Date(e.date).getTime()).filter(time => !isNaN(time));
                                        return validDates.length > 0 ? new Date(Math.max(...validDates)).toLocaleDateString('th-TH', {day: 'numeric', month: 'short'}) : '-';
                                    })()
                                    : '-'
                                }
                            </p>
                            <p className="text-[8px] text-slate-400 mt-1">ล่าสุด</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
                        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h4 className="font-bold text-slate-700 text-[10px] flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                การแจ้งเตือนล่าสุด
                            </h4>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-3 h-64 lg:h-auto space-y-2">
                            {filteredOutbreaks.slice(0, 5).map((item, idx) => {
                                const isHidden = hiddenIds.includes(item._id);
                                const { dog: dogCount, cat: catCount } = calculateAnimalCounts(item);

                                return (
                                    <div key={idx} className={`relative p-3 rounded-2xl transition-all duration-300 border ${isHidden ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-rose-100 hover:shadow-md hover:shadow-rose-100/50'}`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-[9px] shadow-sm ${isHidden ? 'bg-slate-200 text-slate-500' : 'bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className={`text-[11px] font-bold truncate pr-2 ${isHidden ? 'text-slate-500' : 'text-slate-800'}`}>
                                                        {item.location}
                                                    </p>
                                                    <span className="text-[8px] text-slate-400 whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded">
                                                        {new Date(item.date).toLocaleDateString('th-TH', {day: 'numeric', month: 'short'})}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] text-slate-500 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" /> {item.district}
                                                    </span>
                                                </div>
                                                {item.insight && (item.insight.spcc || item.insight.animalType) && (
                                                    <div className="mt-2 pt-2 border-t border-slate-100 border-dashed text-[9px] text-slate-500 flex flex-col gap-1">
                                                        <div><span className="font-bold text-slate-600">เลขที่ตรวจ:</span> {item.insight.testNo || '-'}</div>
                                                        <div>
                                                            {item.insight.animalType} {item.insight.breed ? `(${item.insight.breed})` : ''} {item.insight.color ? `สี${item.insight.color}` : ''} {item.insight.gender ? `เพศ${item.insight.gender}` : ''} {item.insight.age ? `อายุ ${item.insight.age}` : ''}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[8px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md border border-orange-100">🐶 {dogCount}</span>
                                                    <span className="text-[8px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100">🐱 {catCount}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 shrink-0 ml-1 self-center border-l border-slate-100 pl-2">
                                                <button onClick={(e) => { e.stopPropagation(); toggleVisibility(item._id); }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title={isHidden ? "แสดง" : "ซ่อน"}>
                                                    {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                                {canEdit && !isHidden && (
                                                    <>
                                                        <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors" title="แก้ไข">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); onDelete(item._id); }} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors" title="ลบ">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column (Top Districts & Monthly/Yearly Trends) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* Top 5 Districts */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">5 เขตพื้นที่เสี่ยงสูงสุด</h4>
                                <p className="text-[10px] text-slate-400">จัดอันดับตามจำนวนเคสที่พบเชื้อ</p>
                            </div>
                            <div className="bg-rose-50 p-2 rounded-xl text-rose-500">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="w-full h-72">
                            {stats?.total > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={stats?.topDistricts || []} margin={{top:0, right:20, left:0, bottom:0}} barSize={28}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize:10, fontWeight: 600, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                                        <RechartsTooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                                        <Bar dataKey="count" name="จำนวนเคส" radius={[0, 8, 8, 0] as any} background={{ fill: '#f8fafc', radius: [0, 8, 8, 0] as any }}>
                                            {(stats?.topDistricts || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                    <Search className="w-6 h-6 text-slate-300 mb-2" />
                                    <span className="text-[10px]">ไม่พบข้อมูลในปีที่เลือก</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Two-Column Grid for Analytics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                        
                        {/* Monthly Trend */}
                        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">ฤดูกาลระบาด (รายเดือน)</h4>
                                    <p className="text-[10px] text-slate-400">แนวโน้มเคสรายเดือนของข้อมูลที่เลือก</p>
                                </div>
                                <div className="bg-indigo-50 p-2 rounded-xl text-indigo-500">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="w-full h-60 mt-auto">
                                {monthlyData.some(d => d.count > 0) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={monthlyData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                                            <RechartsTooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="count" name="จำนวนเหตุการณ์" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                        <Activity className="w-6 h-6 text-slate-300 mb-2" />
                                        <span className="text-[10px]">ไม่มีข้อมูลรายเดือน</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ownership */}
                        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">สถานะของสัตว์</h4>
                                    <p className="text-[10px] text-slate-400">สัดส่วนสัตว์มีเจ้าของและไม่มีเจ้าของ</p>
                                </div>
                                <div className="bg-emerald-50 p-2 rounded-xl text-emerald-500">
                                    <PieChartIcon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="w-full h-60 mt-auto relative">
                                {ownershipData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={ownershipData}
                                                cx="50%" cy="50%"
                                                innerRadius={60} outerRadius={80}
                                                paddingAngle={5} dataKey="value"
                                            >
                                                {ownershipData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                        <PieChartIcon className="w-6 h-6 text-slate-300 mb-2" />
                                        <span className="text-[10px]">ไม่มีข้อมูลสัดส่วนสัตว์</span>
                                    </div>
                                )}
                                {ownershipData.length > 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                                        <span className="text-lg font-black text-slate-800">{ownershipData.reduce((acc, curr) => acc + curr.value, 0)}</span>
                                        <span className="text-[8px] text-slate-400">ตัวทั้งหมด</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Bottom Row - สถิติแยกตามเขต */}
                <div className="lg:col-span-12 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mt-2">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">สถิติจำนวนสัตว์ในพื้นที่เสี่ยง (แยกตามเขต)</h4>
                            <p className="text-[10px] text-slate-400">หมา ตัวผู้-เมีย / แมว ตัวผู้-เมีย</p>
                        </div>
                    </div>
                    <div className="w-full h-[350px]">
                        {stats.animalChartData && stats.animalChartData.some(d => d.dogMale > 0 || d.dogFemale > 0 || d.catMale > 0 || d.catFemale > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.animalChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />
                                    <Bar dataKey="dogMale" name="หมา (ตัวผู้)" fill="#3b82f6" radius={[4, 4, 0, 0] as any} />
                                    <Bar dataKey="dogFemale" name="หมา (ตัวเมีย)" fill="#93c5fd" radius={[4, 4, 0, 0] as any} />
                                    <Bar dataKey="catMale" name="แมว (ตัวผู้)" fill="#f97316" radius={[4, 4, 0, 0] as any} />
                                    <Bar dataKey="catFemale" name="แมว (ตัวเมีย)" fill="#fdba74" radius={[4, 4, 0, 0] as any} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                <Activity className="w-6 h-6 text-slate-300 mb-3" />
                                <span className="text-[10px]">ยังไม่มีข้อมูลสถิติสัตว์ที่บันทึกไว้</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- ตารางฐานข้อมูลการลงพื้นที่ --- */}
                <div className="lg:col-span-12 bg-white rounded-3xl shadow-sm border border-slate-100 mt-2 overflow-hidden flex flex-col">
                    {/* Header ตาราง */}
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100">
                                <Database className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-base font-bold text-slate-800">ฐานข้อมูลจุดเสี่ยงโรคระบาด</h3>
                                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                        {filteredOutbreaks.length} รายการ
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">จัดการข้อมูลจุดเกิดเหตุและรายละเอียดสัตว์</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 transition-colors appearance-none cursor-pointer">
                                    <option>แสดงพื้นที่ทั้งหมด</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar & Pagination (Top) */}
                    <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                        <div className="text-xs text-slate-600">
                            แสดงข้อมูล <span className="font-bold text-slate-800">{filteredOutbreaks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> ถึง <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredOutbreaks.length)}</span> จาก <span className="font-bold text-slate-800">{filteredOutbreaks.length}</span> รายการ
                        </div>
                        
                        {/* Pagination Controls */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors">First</button>
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                            
                            <button className="px-3 py-1.5 text-[11px] font-bold bg-indigo-600 text-white rounded-lg shadow-sm">{currentPage}</button>
                            {currentPage < totalPages && <button onClick={() => setCurrentPage(currentPage + 1)} className="px-3 py-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">{currentPage + 1}</button>}
                            {currentPage < totalPages - 1 && <span className="px-2 text-slate-400">...</span>}
                            {currentPage < totalPages - 1 && <button onClick={() => setCurrentPage(totalPages)} className="px-3 py-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">{totalPages}</button>}

                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors">Last</button>
                        </div>
                    </div>

                    {/* --- LIST VIEW (Mobile) --- */}
                    <div className={`${displayMode === 'list' ? 'block' : 'hidden'} bg-slate-50/50 p-4`}>
                        <div className="flex flex-col gap-4">
                            {paginatedData.map((item, idx) => {
                                const { dog: dogCount, cat: catCount } = calculateAnimalCounts(item);
                                
                                return (
                                    <div key={item._id || idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
                                        {/* Row 1: Test No & Date */}
                                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                                            <div className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-indigo-100">
                                                {item.insight?.testNo ? `Lab: ${item.insight.testNo}` : 'ไม่ระบุเลขที่ตรวจ'}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-2 py-1 rounded-md">
                                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                                {new Date(item.date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </div>
                                        </div>
                                        
                                        {/* Row 2: Location & District */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-start gap-2 text-sm font-bold text-slate-800">
                                                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                                <span className="leading-snug">{item.location || '-'}</span>
                                            </div>
                                            <div className="pl-6">
                                                <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                                                    เขต{item.district || '-'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Row 3: Animal Info */}
                                        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 grid grid-cols-2 gap-2 mt-1">
                                            <div className="col-span-2 flex justify-between border-b border-slate-100 pb-1.5">
                                                <span className="font-semibold text-slate-400 text-[10px]">ชนิด/เพศ:</span> 
                                                <span className="font-bold">{item.insight?.animalType || '-'} / {item.insight?.gender || '-'}</span>
                                            </div>
                                            <div className="col-span-2 flex justify-between border-b border-slate-100 pb-1.5">
                                                <span className="font-semibold text-slate-400 text-[10px]">สายพันธุ์:</span> 
                                                <span className="font-medium">{item.insight?.breed || '-'}</span>
                                            </div>
                                            <div className="col-span-2 flex justify-between">
                                                <span className="font-semibold text-slate-400 text-[10px]">สี/อายุ:</span> 
                                                <span className="font-medium">{item.insight?.color || '-'} / {item.insight?.age ? `${item.insight.age}` : '-'}</span>
                                            </div>
                                        </div>

                                        {/* Row 4: Status & Vaccine */}
                                        <div className="flex flex-col gap-2 mt-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${item.insight?.ownership === 'มีเจ้าของ' ? 'bg-blue-500' : item.insight?.ownership === 'ไม่มีเจ้าของ' ? 'bg-orange-500' : 'bg-slate-300'}`}></span>
                                                <span className="text-xs font-bold text-slate-700">{item.insight?.ownership || 'ไม่ระบุสถานะ'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg border border-emerald-100 w-fit">
                                                <Syringe className="w-3.5 h-3.5" /> 
                                                วัคซีน: {item.insight?.vaccineHistory || '-'}
                                            </div>
                                        </div>

                                        {/* Row 5: Actions */}
                                        {canEdit && (
                                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
                                                <button onClick={() => onEdit(item)} className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors">
                                                    <Edit className="w-3.5 h-3.5" /> แก้ไข
                                                </button>
                                                <button onClick={() => onDelete(item._id)} className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1.5 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" /> ลบ
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            
                            {paginatedData.length === 0 && (
                                <div className="p-10 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                                    <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <span>ไม่พบข้อมูลลงพื้นที่ในระบบ</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- TABLE VIEW (Desktop) --- */}
                    <div className={`${displayMode === 'table' ? 'block' : 'hidden'} overflow-x-auto custom-scrollbar`}>
                        <table className="w-full text-left border-collapse min-w-[1050px]">
                            <thead>
                                <tr className="bg-slate-50 border-y border-slate-100">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-600 whitespace-nowrap w-48">เลขที่ตรวจ / วันที่</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-600 whitespace-nowrap">สถานที่ / เขต</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-600 whitespace-nowrap">ข้อมูลสัตว์ (ชนิด/เพศ/สายพันธุ์/สี/อายุ)</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-600 whitespace-nowrap">สถานะ / ประวัติวัคซีน</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-600 whitespace-nowrap text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.map((item, idx) => {
                                    return (
                                        <tr key={item._id || idx} className="hover:bg-slate-50/50 transition-colors group bg-white">
                                            
                                            {/* 1. เลขที่ตรวจ / วันที่ */}
                                            <td className="px-6 py-4 align-top">
                                                <div className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-indigo-100 mb-2">
                                                    {item.insight?.testNo ? `Lab: ${item.insight.testNo}` : 'ไม่ระบุเลขที่ตรวจ'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                                                    <Calendar className="w-4 h-4 text-indigo-400" />
                                                    {new Date(item.date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </div>
                                            </td>

                                            {/* 2. สถานที่ / เขต */}
                                            <td className="px-6 py-4 align-top max-w-[250px]">
                                                <div className="flex items-start gap-2 text-xs font-bold text-slate-800 mb-2">
                                                    <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                                                    <span className="line-clamp-2">{item.location || '-'}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 ml-6">
                                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                                                        เขต{item.district || '-'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* 3. ข้อมูลสัตว์ */}
                                            <td className="px-6 py-4 align-top">
                                                <div className="text-xs text-slate-700 space-y-1.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 inline-block min-w-[200px]">
                                                    <div className="flex justify-between gap-4">
                                                        <span className="font-semibold text-slate-400 text-[10px]">ชนิด/เพศ:</span> 
                                                        <span className="font-bold">{item.insight?.animalType || '-'} / {item.insight?.gender || '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-4">
                                                        <span className="font-semibold text-slate-400 text-[10px]">สายพันธุ์:</span> 
                                                        <span className="font-medium">{item.insight?.breed || '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-4">
                                                        <span className="font-semibold text-slate-400 text-[10px]">สี/อายุ:</span> 
                                                        <span className="font-medium">{item.insight?.color || '-'} / {item.insight?.age ? `${item.insight.age}` : '-'}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 4. สถานะ / ประวัติวัคซีน */}
                                            <td className="px-6 py-4 align-top">
                                                <div className="flex flex-col gap-2.5 mt-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${item.insight?.ownership === 'มีเจ้าของ' ? 'bg-blue-500' : item.insight?.ownership === 'ไม่มีเจ้าของ' ? 'bg-orange-500' : 'bg-slate-300'}`}></span>
                                                        <span className="text-xs font-bold text-slate-700">{item.insight?.ownership || 'ไม่ระบุสถานะ'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 w-fit">
                                                        <Syringe className="w-3.5 h-3.5 text-emerald-500" /> 
                                                        วัคซีน: {item.insight?.vaccineHistory || '-'}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 5. จัดการ */}
                                            <td className="px-6 py-4 align-top">
                                                <div className="flex items-center justify-center gap-1 mt-1">
                                                    {canEdit ? (
                                                        <>
                                                            <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="แก้ไขข้อมูล">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => onDelete(item._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="ลบข้อมูล">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">ดูได้อย่างเดียว</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {paginatedData.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-slate-500 bg-slate-50/50">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Database className="w-8 h-8 text-slate-300" />
                                                <span>ไม่พบข้อมูลลงพื้นที่ในระบบ</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RabiesOutbreakSection;