import React from 'react';
import { Filter, Activity, CheckCircle, Trophy, Medal, ChevronDown } from 'lucide-react';

const RankingSection = ({
    rankingYear, setRankingYear,
    rankingMonth, setRankingMonth,
    availableYears,
    thaiMonths,
    rankingUnitStats,
    rankingDistrictStats
}) => {

    // Helper component for Rank Badge
    const RankBadge = ({ rank }) => {
        if (rank === 1) return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 shadow-sm border border-yellow-200"><Trophy className="w-4 h-4" /></div>;
        if (rank === 2) return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 shadow-sm border border-slate-200"><Medal className="w-4 h-4" /></div>;
        if (rank === 3) return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 shadow-sm border border-orange-200"><Medal className="w-4 h-4" /></div>;
        return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 font-semibold text-xs border border-slate-100">{rank}</div>;
    };

    return (
        <div className="lg:col-span-5 space-y-6 flex flex-col font-sans">
            
            {/* Main Card: Ranking Table & Filters */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 overflow-hidden flex flex-col">
                
                {/* Header Section with Title & Filters */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Activity className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 leading-tight">สถิติการออกหน่วย</h2>
                            <p className="text-xs text-slate-500 mt-0.5">อันดับผลงานแยกตามหน่วยงาน</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <select 
                                value={rankingYear} 
                                onChange={(e) => setRankingYear(e.target.value)} 
                                className="appearance-none bg-white border border-slate-200 text-slate-600 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer hover:border-indigo-300 transition-colors"
                            >
                                <option value="ทั้งหมด">ทุกปี</option>
                                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                        </div>

                        <div className="relative group">
                            <select 
                                value={rankingMonth} 
                                onChange={(e) => setRankingMonth(e.target.value)} 
                                className="appearance-none bg-white border border-slate-200 text-slate-600 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer hover:border-indigo-300 transition-colors"
                            >
                                <option value="ทั้งหมด">ทุกเดือน</option>
                                {thaiMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="p-4 text-center w-16">อันดับ</th>
                                <th className="p-4">หน่วยงาน</th>
                                <th className="p-4 text-center">วัคซีน</th>
                                <th className="p-4 text-center">ทำหมัน</th>
                                <th className="p-4 text-center">ไมโครชิป</th>
                                <th className="p-4 text-center">ขึ้นทะเบียน</th>
                                <th className="p-4 text-center">รักษา</th>
                                <th className="p-4 text-right pr-6 text-slate-700 bg-slate-50">ผลงานรวม</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {rankingUnitStats.map((u, i) => (
                                <tr key={u.name} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="p-3 text-center">
                                        <div className="flex justify-center"><RankBadge rank={i + 1} /></div>
                                    </td>
                                    <td className="p-3 font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">{u.name}</td>
                                    <td className="p-3 text-center text-slate-500">{u.vaccine.toLocaleString()}</td>
                                    <td className="p-3 text-center text-slate-500">{u.sterilize.toLocaleString()}</td>
                                    <td className="p-3 text-center text-slate-500">{u.microchip.toLocaleString()}</td>
                                    <td className="p-3 text-center text-slate-500">{u.register.toLocaleString()}</td>
                                    <td className="p-3 text-center text-slate-500">{u.medical.toLocaleString()}</td>
                                    <td className="p-3 text-right pr-6 font-bold text-slate-800 bg-slate-50/50 group-hover:bg-indigo-50/20">
                                        {u.total.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {rankingUnitStats.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="p-10 text-center text-slate-400 bg-slate-50/30">
                                        <Filter className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                        ไม่พบข้อมูลตามเงื่อนไขที่เลือก
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Districts Card - Clean Leaderboard Style */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-1.5 bg-green-100 rounded-md">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <h2 className="text-md font-bold text-slate-800">5 อันดับเขตที่มีผลงานสูงสุด</h2>
                </div>
                
                <div className="space-y-5">
                    {rankingDistrictStats.map((item, index) => {
                        const maxVal = rankingDistrictStats[0]?.total || 1;
                        const percent = (item.total / maxVal) * 100;
                        
                        return (
                            <div key={item.name} className="group">
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold w-5 text-center ${index < 3 ? 'text-indigo-600' : 'text-slate-400'}`}>#{index + 1}</span>
                                        <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">{item.total.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                                            index === 0 ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 
                                            index === 1 ? 'bg-indigo-400' : 
                                            'bg-indigo-300'
                                        }`}
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                    {rankingDistrictStats.length === 0 && <p className="text-center text-sm text-slate-400 py-2">ไม่มีข้อมูลแสดง</p>}
                </div>
            </div>
        </div>
    );
};

export default RankingSection;