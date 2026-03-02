import React from 'react';
import { Siren, Activity, Skull, AlertTriangle, MapPin, Calendar, Eye, EyeOff, Edit, Trash2, TrendingUp, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import OutbreakMap from '../modals/OutbreakMap';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 ring-1 ring-slate-100/50">
                <p className="font-bold text-slate-800 mb-1">{label}</p>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    พบเชื้อ: <span className="font-bold text-rose-600 text-lg">{payload[0].value}</span> จุด
                </div>
            </div>
        );
    }
    return null;
};

const RabiesOutbreakSection = ({ 
    outbreakData, 
    filterYear, 
    setFilterYear, 
    years, 
    stats, 
    filteredOutbreaks, 
    yearlyTrend, 
    hiddenIds, 
    toggleVisibility, 
    onEdit, 
    onDelete, 
    canEdit 
}) => {
    
    if (outbreakData.length === 0) return null;

    const barColors = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'];

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700 mt-8 mb-16 font-sans">
            
            {/* --- Header Section --- */}
            <div className="relative overflow-hidden bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl shadow-slate-200">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Siren className="w-64 h-64 -mr-16 -mt-16 text-rose-500" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-1 rounded-full border border-rose-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                LIVE MONITORING
                            </span>
                        </div>
                        <h3 className="text-3xl font-black tracking-tight text-white">
                            ศูนย์เฝ้าระวัง<span className="text-rose-500">โรคพิษสุนัขบ้า</span>
                        </h3>
                        <p className="text-slate-400 font-medium flex items-center gap-2 text-sm">
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
                            className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer py-2 pr-4 [&>option]:text-slate-900"
                        >
                            <option value="ทั้งหมด">ข้อมูลสะสมทั้งหมด ({outbreakData.length})</option>
                            {years.map(y => (
                                <option key={y} value={y}>ปี พ.ศ. {y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 h-[45rem] relative z-0 flex flex-col">
                <div className="flex justify-between items-center mb-4 px-2">
                    <div>
                        <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-red-500" /> แผนที่พิกัดจุดเกิดเหตุ
                        </h4>
                        <p className="text-sm text-slate-400">แสดงพิกัดและการจำลองรัศมีเฝ้าระวังโรค</p>
                    </div>
                </div>
                <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200">
                    <OutbreakMap 
                        outbreaks={filteredOutbreaks.filter(item => !hiddenIds.includes(item._id))} 
                        onDeleteOutbreak={canEdit ? onDelete : undefined} 
                    />
                </div>
            </div>

            {/* --- Main Dashboard Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* --- Left Column: Stats & List --- */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    
                    {/* Hero Stat Card */}
                    <div className="relative bg-gradient-to-br from-rose-500 via-red-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-rose-200 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                                    <Skull className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-rose-100 text-xs font-bold bg-black/10 px-2 py-1 rounded-lg">
                                    {filterYear === 'ทั้งหมด' ? 'ยอดสะสม' : `ปี ${filterYear}`}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-rose-100 text-sm font-medium">จุดพบเชื้อรวม</p>
                                <h2 className="text-6xl font-black tracking-tighter">{stats.total}</h2>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/20 flex items-center gap-2 text-sm font-medium text-rose-50">
                                <AlertTriangle className="w-4 h-4" />
                                พื้นที่เฝ้าระวังพิเศษ (Red Zone)
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-2 mb-3 text-slate-400">
                                <MapPin className="w-4 h-4 group-hover:text-rose-500 transition-colors" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Top Zone</span>
                            </div>
                            <p className="text-lg font-bold text-slate-800 truncate" title={stats.topDistricts[0]?.name}>
                                {stats.topDistricts.length > 0 ? stats.topDistricts[0].name : '-'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">พบมากที่สุด</p>
                        </div>
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-2 mb-3 text-slate-400">
                                <Calendar className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Update</span>
                            </div>
                            <p className="text-lg font-bold text-slate-800">
                                {filteredOutbreaks.length > 0 
                                    ? new Date(Math.max(...filteredOutbreaks.map(e => new Date(e.date)))).toLocaleDateString('th-TH', {day: 'numeric', month: 'short'})
                                    : '-'
                                }
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">ล่าสุด</p>
                        </div>
                    </div>

                    {/* Recent List */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
                        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                การแจ้งเตือนล่าสุด
                            </h4>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-3 h-64 lg:h-auto space-y-2">
                            {filteredOutbreaks.slice(0, 5).map((item, idx) => {
                                const isHidden = hiddenIds.includes(item._id);
                                return (
                                    <div key={idx} className={`relative p-3 rounded-2xl transition-all duration-300 border ${isHidden ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-rose-100 hover:shadow-md hover:shadow-rose-100/50'}`}>
                                        <div className="flex items-start gap-3">
                                            {/* Rank Circle */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs shadow-sm ${isHidden ? 'bg-slate-200 text-slate-500' : 'bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600'}`}>
                                                {idx + 1}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className={`text-sm font-bold truncate pr-2 ${isHidden ? 'text-slate-500' : 'text-slate-800'}`}>
                                                        {item.location}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded">
                                                        {new Date(item.date).toLocaleDateString('th-TH', {day: 'numeric', month: 'short'})}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" /> {item.district}
                                                    </span>
                                                </div>
                                                {item.stats && (
                                                    <div className="flex gap-2 mt-2">
                                                        <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md border border-orange-100">
                                                            🐶 {(item.stats.dog?.male || 0) + (item.stats.dog?.female || 0)}
                                                        </span>
                                                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100">
                                                            🐱 {(item.stats.cat?.male || 0) + (item.stats.cat?.female || 0)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
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

                {/* --- Right Column: Charts --- */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Top 5 Chart */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h4 className="text-lg font-bold text-slate-800">5 เขตพื้นที่เสี่ยงสูงสุด</h4>
                                <p className="text-sm text-slate-400">จัดอันดับตามจำนวนเคสที่พบเชื้อ</p>
                            </div>
                            <div className="bg-rose-50 p-2 rounded-xl text-rose-500">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="w-full h-72">
                            {stats.total > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={stats.topDistricts} margin={{top:0, right:20, left:0, bottom:0}} barSize={32}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize:13, fontWeight: 600, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                                        <RechartsTooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                                        <Bar dataKey="count" radius={[0, 8, 8, 0]} background={{ fill: '#f8fafc', radius: [0, 8, 8, 0] }}>
                                            {stats.topDistricts.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                    <div className="bg-slate-100 p-4 rounded-full mb-3">
                                        <Search className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <span>ไม่พบข้อมูลในปีที่เลือก</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Trend Chart */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                             <div>
                                <h4 className="text-lg font-bold text-slate-800">แนวโน้มการระบาดรายปี</h4>
                                <p className="text-sm text-slate-400">เปรียบเทียบสถิติย้อนหลัง</p>
                            </div>
                        </div>
                        <div className="w-full h-80 mt-6">
                            {yearlyTrend && yearlyTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={yearlyTrend} margin={{top: 10, right: 0, left: -20, bottom: 0}} barSize={40}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 500}} dy={15} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                        <RechartsTooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip />} />
                                        <Bar dataKey="count" name="จุดเสี่ยงที่พบ" fill="#6366f1" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                    <div className="bg-slate-100 p-4 rounded-full mb-3">
                                        <TrendingUp className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <span>ไม่พบข้อมูลแนวโน้มในปีที่เลือก</span>
                                </div>
                            )}
                         </div>
                    </div>
                </div>

                {/* --- สถิติจำนวนสัตว์ --- */}
                <div className="lg:col-span-12 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mt-2">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="text-lg font-bold text-slate-800">สถิติจำนวนสัตว์ในพื้นที่เสี่ยง (แยกตามกลุ่ม)</h4>
                            <p className="text-sm text-slate-400">หมา ตัวผู้-เมีย / แมว ตัวผู้-เมีย</p>
                        </div>
                    </div>
                    <div className="w-full h-[350px]">
                        {stats.animalChartData && stats.animalChartData.some(d => d.dogMale > 0 || d.dogFemale > 0 || d.catMale > 0 || d.catFemale > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.animalChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                    <RechartsTooltip 
                                        cursor={{ fill: '#f8fafc' }} 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Bar dataKey="dogMale" name="หมา (ตัวผู้)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="dogFemale" name="หมา (ตัวเมีย)" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="catMale" name="แมว (ตัวผู้)" fill="#f97316" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="catFemale" name="แมว (ตัวเมีย)" fill="#fdba74" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                <div className="bg-slate-100 p-4 rounded-full mb-3">
                                    <Activity className="w-6 h-6 text-slate-300" />
                                </div>
                                <span>ยังไม่มีข้อมูลสถิติสัตว์ที่บันทึกไว้</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RabiesOutbreakSection;