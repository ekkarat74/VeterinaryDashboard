import React, { useMemo } from 'react';
import { Siren, Activity, Skull, AlertTriangle, MapPin, Calendar, Eye, 
    EyeOff, Edit, Trash2, TrendingUp, Search, PieChart as PieChartIcon, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, Cell, Legend, PieChart, Pie, Sector, AreaChart, Area
} from 'recharts';
import OutbreakMap from '../modals/OutbreakMap';

const BAR_COLORS = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'];
const PIE_COLORS = ['#3b82f6', '#f97316', '#10b981']; // Blue (Owned), Orange (Unowned), Emerald (Feeder)

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 ring-1 ring-slate-100/50">
                <p className="font-bold text-slate-800 mb-1 text-xs">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-xs text-slate-600 mt-1">
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

// Helper Function ลดความซ้ำซ้อนในการนับจำนวนสัตว์
const calculateAnimalCounts = (item) => {
    let dog = 0, cat = 0;
    const getNum = (val) => parseInt(val, 10) || 0;

    if (item.stats) {
        ['owned', 'unowned', 'feeder'].forEach(type => {
            if (item.stats[type]) {
                dog += getNum(item.stats[type].dog?.male) + getNum(item.stats[type].dog?.female);
                cat += getNum(item.stats[type].cat?.male) + getNum(item.stats[type].cat?.female);
            }
        });
        dog += getNum(item.stats.dog?.male) + getNum(item.stats.dog?.female) + getNum(item.stats.dogs);
        cat += getNum(item.stats.cat?.male) + getNum(item.stats.cat?.female) + getNum(item.stats.cats);
    }
    dog += getNum(item.dog?.male) + getNum(item.dog?.female) + getNum(item.dogMale) + getNum(item.dogFemale) + getNum(item.dogs);
    cat += getNum(item.cat?.male) + getNum(item.cat?.female) + getNum(item.catMale) + getNum(item.catFemale) + getNum(item.cats);

    return { dog, cat };
};

const RabiesOutbreakSection = ({ 
    outbreakData, filterYear, setFilterYear, years, stats, 
    filteredOutbreaks, yearlyTrend, hiddenIds, toggleVisibility, 
    onEdit, onDelete, canEdit 
}) => {
    
    // --------------------------------------------------------
    // DATA ANALYTICS: คำนวณข้อมูลใหม่สำหรับกราฟรายเดือนและสัดส่วนสัตว์
    // --------------------------------------------------------
    const { monthlyData, ownershipData } = useMemo(() => {
        const monthsThai = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const monthly = monthsThai.map(m => ({ month: m, count: 0 }));
        
        let owned = 0, unowned = 0, feeder = 0;

        filteredOutbreaks.forEach(item => {
            // คำนวณรายเดือน
            const d = new Date(item.date);
            if (!isNaN(d)) {
                monthly[d.getMonth()].count += 1;
            }

            // คำนวณสัดส่วนสถานะสัตว์
            const getNum = (val) => parseInt(val, 10) || 0;
            if (item.stats) {
                ['owned', 'unowned', 'feeder'].forEach(type => {
                    const total = getNum(item.stats[type]?.dog?.male) + getNum(item.stats[type]?.dog?.female) +
                                  getNum(item.stats[type]?.cat?.male) + getNum(item.stats[type]?.cat?.female);
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
        ].filter(d => d.value > 0); // ซ่อนกลุ่มที่เป็น 0

        return { monthlyData: monthly, ownershipData: ownership };
    }, [filteredOutbreaks]);

    if (outbreakData.length === 0) return null;

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
                            <span className="bg-rose-500/20 text-rose-300 text-[9px] font-bold px-2 py-1 rounded-full border border-rose-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                LIVE MONITORING
                            </span>
                        </div>
                        <h3 className="text-2xl font-black tracking-tight text-white">
                            ศูนย์เฝ้าระวัง<span className="text-rose-500">โรคพิษสุนัขบ้า</span>
                        </h3>
                        <p className="text-slate-400 font-medium flex items-center gap-2 text-xs">
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
                            className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer py-2 pr-4 [&>option]:text-slate-900"
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
                        <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-red-500" /> แผนที่พิกัดจุดเกิดโรคพิษสุนัขบ้า
                        </h4>
                        <p className="text-xs text-slate-400">แสดงพิกัดและการจำลองรัศมีเฝ้าระวังโรค</p>
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
                                <span className="text-rose-100 text-[10px] font-bold bg-black/10 px-2 py-1 rounded-lg">
                                    {filterYear === 'ทั้งหมด' ? 'ยอดสะสม' : `ปี ${parseInt(filterYear) + 543}`}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-rose-100 text-xs font-medium">จุดพบเชื้อรวม</p>
                                <h2 className="text-5xl font-black tracking-tighter">{stats.total}</h2>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/20 flex items-center gap-2 text-xs font-medium text-rose-50">
                                <AlertTriangle className="w-4 h-4" /> พื้นที่เฝ้าระวังพิเศษ (Red Zone)
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-2 mb-3 text-slate-400">
                                <MapPin className="w-4 h-4 group-hover:text-rose-500 transition-colors" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Top Zone</span>
                            </div>
                            <p className="text-base font-bold text-slate-800 truncate" title={stats?.topDistricts?.[0]?.name}>
                                {stats?.topDistricts?.length > 0 ? stats.topDistricts[0].name : '-'}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1">พบมากที่สุด</p>
                        </div>
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-2 mb-3 text-slate-400">
                                <Calendar className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Update</span>
                            </div>
                            <p className="text-base font-bold text-slate-800">
                                {filteredOutbreaks?.length > 0 
                                    ? (() => {
                                        const validDates = filteredOutbreaks.map(e => new Date(e.date).getTime()).filter(time => !isNaN(time));
                                        return validDates.length > 0 ? new Date(Math.max(...validDates)).toLocaleDateString('th-TH', {day: 'numeric', month: 'short'}) : '-';
                                    })()
                                    : '-'
                                }
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1">ล่าสุด</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
                        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h4 className="font-bold text-slate-700 text-xs flex items-center gap-2">
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
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] shadow-sm ${isHidden ? 'bg-slate-200 text-slate-500' : 'bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className={`text-xs font-bold truncate pr-2 ${isHidden ? 'text-slate-500' : 'text-slate-800'}`}>
                                                        {item.location}
                                                    </p>
                                                    <span className="text-[9px] text-slate-400 whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded">
                                                        {new Date(item.date).toLocaleDateString('th-TH', {day: 'numeric', month: 'short'})}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" /> {item.district}
                                                    </span>
                                                </div>
                                                {item.insight && (item.insight.spcc || item.insight.animalType) && (
                                                    <div className="mt-2 pt-2 border-t border-slate-100 border-dashed text-[10px] text-slate-500 flex flex-col gap-1">
                                                        <div><span className="font-bold text-slate-600">ศบส:</span> {item.insight.spcc || '-'} | <span className="font-bold text-slate-600">เลขที่ตรวจ:</span> {item.insight.testNo || '-'}</div>
                                                        <div>
                                                            {item.insight.animalType} {item.insight.breed ? `(${item.insight.breed})` : ''} {item.insight.color ? `สี${item.insight.color}` : ''} {item.insight.gender ? `เพศ${item.insight.gender}` : ''} {item.insight.age ? `อายุ ${item.insight.age}` : ''}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[9px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md border border-orange-100">🐶 {dogCount}</span>
                                                    <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100">🐱 {catCount}</span>
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
                                <h4 className="text-base font-bold text-slate-800">5 เขตพื้นที่เสี่ยงสูงสุด</h4>
                                <p className="text-xs text-slate-400">จัดอันดับตามจำนวนเคสที่พบเชื้อ</p>
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
                                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize:11, fontWeight: 600, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                                        <RechartsTooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                                        <Bar dataKey="count" name="จำนวนเคส" radius={[0, 8, 8, 0]} background={{ fill: '#f8fafc', radius: [0, 8, 8, 0] }}>
                                            {(stats?.topDistricts || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                    <Search className="w-6 h-6 text-slate-300 mb-2" />
                                    <span className="text-xs">ไม่พบข้อมูลในปีที่เลือก</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Two-Column Grid for Analytics: Monthly Trend & Ownership Donut */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                        
                        {/* Monthly Trend Heatmap/Area Chart */}
                        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h4 className="text-base font-bold text-slate-800">ฤดูกาลระบาด (รายเดือน)</h4>
                                    <p className="text-xs text-slate-400">แนวโน้มเคสรายเดือนของข้อมูลที่เลือก</p>
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
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                            <RechartsTooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="count" name="จำนวนเหตุการณ์" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                        <Activity className="w-6 h-6 text-slate-300 mb-2" />
                                        <span className="text-xs">ไม่มีข้อมูลรายเดือน</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ownership Pie Chart */}
                        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h4 className="text-base font-bold text-slate-800">สถานะของสัตว์</h4>
                                    <p className="text-xs text-slate-400">สัดส่วนสัตว์มีเจ้าของและไม่มีเจ้าของ</p>
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
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                        <PieChartIcon className="w-6 h-6 text-slate-300 mb-2" />
                                        <span className="text-xs">ไม่มีข้อมูลสัดส่วนสัตว์</span>
                                    </div>
                                )}
                                {/* Label ตรงกลาง Donut */}
                                {ownershipData.length > 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                                        <span className="text-xl font-black text-slate-800">{ownershipData.reduce((acc, curr) => acc + curr.value, 0)}</span>
                                        <span className="text-[9px] text-slate-400">ตัวทั้งหมด</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Bottom Row: สถิติแยกตามชนิดสัตว์ (Bar Chart) */}
                <div className="lg:col-span-12 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mt-2">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="text-base font-bold text-slate-800">สถิติจำนวนสัตว์ในพื้นที่เสี่ยง (แยกตามเขต)</h4>
                            <p className="text-xs text-slate-400">หมา ตัวผู้-เมีย / แมว ตัวผู้-เมีย</p>
                        </div>
                    </div>
                    <div className="w-full h-[350px]">
                        {stats.animalChartData && stats.animalChartData.some(d => d.dogMale > 0 || d.dogFemale > 0 || d.catMale > 0 || d.catFemale > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.animalChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                                    <Bar dataKey="dogMale" name="หมา (ตัวผู้)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="dogFemale" name="หมา (ตัวเมีย)" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="catMale" name="แมว (ตัวผู้)" fill="#f97316" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="catFemale" name="แมว (ตัวเมีย)" fill="#fdba74" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                <Activity className="w-6 h-6 text-slate-300 mb-3" />
                                <span className="text-xs">ยังไม่มีข้อมูลสถิติสัตว์ที่บันทึกไว้</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RabiesOutbreakSection;