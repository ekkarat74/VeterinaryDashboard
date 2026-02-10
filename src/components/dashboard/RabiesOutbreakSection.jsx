import React, { useMemo } from 'react';
import { Siren, Activity, Skull, AlertTriangle, MapPin, Calendar, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

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

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 mt-8 mb-12">
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border-l-4 border-red-500">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <Siren className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-800">ศูนย์เฝ้าระวังโรคพิษสุนัขบ้า</h3>
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                            <Activity className="w-3 h-3 text-red-500" /> Rabies Outbreak Monitoring Center
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">กรองข้อมูลปี:</span>
                    <select 
                        value={filterYear} 
                        onChange={(e) => setFilterYear(e.target.value)} 
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer hover:text-red-600 transition-colors"
                    >
                        <option value="ทั้งหมด">ข้อมูลสะสมทั้งหมด ({outbreakData.length} เคส)</option>
                        {years.map(y => (
                            <option key={y} value={y}>พ.ศ. {y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Stats Cards */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Big Red Card */}
                    <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-6 text-white shadow-xl shadow-red-200 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12 duration-700">
                            <Skull className="w-40 h-40" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <p className="text-red-100 text-sm font-bold mb-1">จุดพบเชื้อรวม ({filterYear === 'ทั้งหมด' ? 'สะสม' : `ปี ${filterYear}`})</p>
                                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                                    <AlertTriangle className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <h2 className="text-7xl font-black tracking-tighter mb-2 mt-2">{stats.total}</h2>
                            <div className="flex items-center gap-2 mt-4">
                                <span className="text-xs bg-red-800/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 font-medium">
                                    พื้นที่เฝ้าระวังพิเศษ (Red Zone)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Sub Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                         {/* Top District */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="text-slate-400 mb-3 flex justify-between">
                                <MapPin className="w-5 h-5" />
                                <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">Top 1</span>
                            </div>
                            <div>
                                <span className="text-xl font-extrabold text-slate-800 block truncate" title={stats.topDistricts[0]?.name || '-'}>
                                    {stats.topDistricts.length > 0 ? stats.topDistricts[0].name : '-'}
                                </span>
                                <p className="text-[10px] text-slate-500 mt-1">เขตที่พบเชื้อมากที่สุด</p>
                            </div>
                        </div>
                        {/* Latest Date */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="text-slate-400 mb-3 flex justify-between">
                                <Calendar className="w-5 h-5" />
                                <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">Latest</span>
                            </div>
                            <div>
                                <span className="text-xl font-extrabold text-slate-800 block">
                                    {filteredOutbreaks.length > 0 
                                        ? new Date(Math.max(...filteredOutbreaks.map(e => new Date(e.date)))).toLocaleDateString('th-TH', {day: 'numeric', month: 'short', year: '2-digit'})
                                        : '-'
                                    }
                                </span>
                                <p className="text-[10px] text-slate-500 mt-1">วันที่พบเชื้อล่าสุด</p>
                            </div>
                        </div>
                    </div>

                    {/* List Section */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div>
                                รายการแจ้งเหตุล่าสุด
                            </h4>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-2 h-48 lg:h-auto">
                            {filteredOutbreaks.slice(0, 5).map((item, idx) => {
                                const isHidden = hiddenIds.includes(item._id);
                                return (
                                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl transition-all border-b border-slate-50 last:border-0 group cursor-default ${isHidden ? 'bg-slate-100 opacity-60 grayscale' : 'hover:bg-red-50/50'}`}>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleVisibility(item._id); }}
                                            className={`p-1.5 rounded-lg transition-colors shrink-0 ${isHidden ? 'text-slate-400 hover:text-slate-600' : 'text-blue-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                        >
                                            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border font-bold text-xs group-hover:scale-110 transition-transform ${isHidden ? 'bg-slate-200 border-slate-300 text-slate-500' : 'bg-red-100 border-red-200 text-red-600'}`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-bold truncate ${isHidden ? 'text-slate-500' : 'text-slate-800'}`}>
                                                {item.location} {isHidden && "(ซ่อน)"}
                                            </p>
                                            {item.stats && (
   <div className="flex gap-2 mt-1 text-[10px] text-slate-500">
       <span className="flex items-center gap-0.5"><span className="font-bold text-slate-700">🐶 {(item.stats.dog?.male || 0) + (item.stats.dog?.female || 0)}</span></span>
       <span className="flex items-center gap-0.5"><span className="font-bold text-slate-700">🐱 {(item.stats.cat?.male || 0) + (item.stats.cat?.female || 0)}</span></span>
   </div>
)}
                                            <div className="flex justify-between items-center mt-0.5">
                                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 rounded">{item.district}</span>
                                                <span className="text-[9px] text-slate-400">
                                                    {new Date(item.date).toLocaleDateString('th-TH', {day: 'numeric', month: 'short', year: '2-digit'})}
                                                </span>
                                            </div>
                                        </div>
                                        {canEdit && !isHidden && (
    <div className="flex gap-1 shrink-0"> 
        <button 
            onClick={(e) => { e.stopPropagation(); onEdit(item); }} 
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
        >
            <Edit className="w-3 h-3" />
        </button>
        <button 
            onClick={(e) => { e.stopPropagation(); onDelete(item._id); }} 
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
        >
            <Trash2 className="w-3 h-3" />
        </button>
    </div>
)}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Charts */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Top 5 Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                                5 อันดับเขตพื้นที่เสี่ยงสูงสุด
                            </h4>
                        </div>
                        <div className="h-64 w-full">
                            {stats.total > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={stats.topDistricts} margin={{top:0, right:30, left:0, bottom:0}} barSize={28}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={110} tick={{fontSize:12, fontWeight: 600, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                                        <RechartsTooltip cursor={{fill: '#fef2f2'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                            {stats.topDistricts.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#dc2626' : index === 1 ? '#ea580c' : '#f87171'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    ไม่พบข้อมูลในปีที่เลือก
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Trend Chart (Gradient Bar) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                             <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                <div className="w-1 h-6 bg-slate-800 rounded-full"></div>
                                แนวโน้มการระบาดรายปี
                            </h4>
                        </div>
                         <div className="flex-1 min-h-[250px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={yearlyTrend} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                                    <defs>
                                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                                            <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.6}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                    <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                    <Bar dataKey="count" name="จุดเสี่ยงที่พบ" fill="url(#trendGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RabiesOutbreakSection;
