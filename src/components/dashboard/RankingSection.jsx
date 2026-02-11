import React from 'react';
import { Filter, Activity, CheckCircle } from 'lucide-react';

const RankingSection = ({
    rankingYear, setRankingYear,
    rankingMonth, setRankingMonth,
    availableYears,
    thaiMonths,
    rankingUnitStats,
    rankingDistrictStats
}) => {
    return (
        <div className="lg:col-span-5 space-y-6 flex flex-col">
            {/* Local Filter for Ranking */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2">
                <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <Filter className="w-4 h-4 text-yellow-600" /> ตัวกรองการจัดอันดับ
                </div>
                <div className="flex gap-2">
                    <select 
                        value={rankingYear} 
                        onChange={(e) => setRankingYear(e.target.value)} 
                        className="bg-slate-50 border border-slate-200 text-xs rounded p-2 flex-1 outline-none focus:ring-1 focus:ring-yellow-400"
                    >
                        <option value="ทั้งหมด">ทุกปี</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select 
                        value={rankingMonth} 
                        onChange={(e) => setRankingMonth(e.target.value)} 
                        className="bg-slate-50 border border-slate-200 text-xs rounded p-2 flex-1 outline-none focus:ring-1 focus:ring-yellow-400"
                    >
                        <option value="ทั้งหมด">ทุกเดือน</option>
                        {thaiMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                </div>
            </div>

            {/* Top Units Table */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                <h2 className="text-md font-bold mb-4 flex items-center gap-2 text-slate-800">
                    <Activity className="w-5 h-5 text-orange-500" /> สถิติการออกหน่วย
                </h2>
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left text-xs min-w-[600px]"> {/* ปรับ min-w เพิ่มเล็กน้อยเผื่อคอลัมน์ใหม่ */}
                        <thead className="bg-slate-50 font-bold text-slate-500 sticky top-0 z-10">
                            <tr>
                                <th className="p-3 rounded-tl-lg rounded-bl-lg text-center w-10">#</th>
                                <th className="p-3">หน่วยงาน</th>
                                <th className="p-3 text-center bg-yellow-50 text-yellow-700 border-x border-yellow-100">ออกหน่วย (ครั้ง)</th>
                                <th className="p-3 text-center text-blue-600">วัคซีน</th>
                                <th className="p-3 text-center text-orange-500">ทำหมัน</th>
                                <th className="p-3 text-center text-purple-600">ชิป</th>
                                
                                {/* --- [ส่วนที่เพิ่ม] : หัวตาราง ขึ้นทะเบียน และ รักษา --- */}
                                <th className="p-3 text-center text-teal-600">ขึ้นทะเบียน</th>
                                <th className="p-3 text-center text-pink-500">รักษา</th>
                                {/* ------------------------------------------------ */}

                                <th className="p-3 text-right rounded-tr-lg rounded-br-lg text-slate-800">ผลงานรวม</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {rankingUnitStats.map((u, i) => (
                                <tr key={u.name} className="hover:bg-yellow-50/50 transition-colors group">
                                    <td className="p-3 text-center font-bold">
                                        <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[10px] ${i === 0 ? 'bg-yellow-400 text-white shadow-md shadow-yellow-200' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</span>
                                    </td>
                                    <td className="p-3 font-bold text-slate-700">{u.name}</td>
                                    
                                    <td className="p-3 text-center font-extrabold text-yellow-700 bg-yellow-50/30 border-x border-slate-100 text-sm">
                                        {u.count.toLocaleString()}
                                    </td>
                                    
                                    <td className="p-3 text-center text-slate-500 group-hover:text-blue-600 transition-colors">{u.vaccine.toLocaleString()}</td>
                                    <td className="p-3 text-center text-slate-500 group-hover:text-orange-500 transition-colors">{u.sterilize.toLocaleString()}</td>
                                    <td className="p-3 text-center text-slate-500 group-hover:text-purple-600 transition-colors">{u.microchip.toLocaleString()}</td>
                                    <td className="p-3 text-center text-slate-500 group-hover:text-teal-600 transition-colors">
                                        {u.register.toLocaleString()}
                                    </td>
                                    <td className="p-3 text-center text-slate-500 group-hover:text-pink-500 transition-colors">
                                        {u.medical.toLocaleString()}
                                    </td>
                                    {/* ------------------------------------------------ */}

                                    <td className="p-3 text-right font-bold text-slate-800">{u.total.toLocaleString()}</td>
                                </tr>
                            ))}
                            {rankingUnitStats.length === 0 && (
                                <tr>
                                    {/* ปรับ colSpan เป็น 9 ให้พอดีกับจำนวนคอลัมน์ใหม่ */}
                                    <td colSpan="9" className="p-4 text-center text-slate-400">ไม่พบข้อมูล</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Districts Table */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-md font-bold mb-4 flex items-center gap-2 text-slate-800">
                    <CheckCircle className="w-5 h-5 text-indigo-500" /> 5 อันดับเขตสูงสุด
                </h2>
                <div className="space-y-4">
                    {rankingDistrictStats.map((item, index) => (
                        <div key={item.name} className="relative">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-xs font-bold text-slate-600">{index + 1}. {item.name}</span>
                                <span className="text-sm font-extrabold text-slate-800">{item.total.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" 
                                    style={{ width: `${(item.total / (rankingDistrictStats[0]?.total || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                    {rankingDistrictStats.length === 0 && <p className="text-center text-xs text-slate-400 py-4">ไม่พบข้อมูลในช่วงเวลานี้</p>}
                </div>
            </div>
        </div>
    );
};

export default RankingSection;