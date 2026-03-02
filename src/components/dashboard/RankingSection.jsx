import React from 'react';
import {
  Filter, Activity, CheckCircle, Trophy, Medal, ChevronDown,
  MapPin, Building2, LayoutDashboard,
  Syringe, Scissors, FileText, Cpu, Stethoscope
} from 'lucide-react';

const RankingSection = ({
  rankingYear,
  setRankingYear,
  rankingMonth,
  setRankingMonth,
  availableYears,
  thaiMonths,
  rankingUnitStats,
  rankingNestedStats
}) => {
  const maxTotal = rankingUnitStats.length > 0 
    ? Math.max(...rankingUnitStats.map(u => u.total)) 
    : 0;

  const RankBadge = ({ rank }) => {
    if (rank === 1) return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 shadow-sm border border-yellow-200"><Trophy className="w-4 h-4" /></div>;
    if (rank === 2) return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 shadow-sm border border-slate-200"><Medal className="w-4 h-4" /></div>;
    if (rank === 3) return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 shadow-sm border border-orange-200"><Medal className="w-4 h-4" /></div>;
    return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 font-semibold text-xs border border-slate-100">{rank}</div>;
  };

  // Helper Component สำหรับแสดง Stat ย่อย
  const ServiceStat = ({ icon: Icon, color, label, value }) => (
    <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
      <div className={`p-1.5 rounded-full mb-1 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="text-[10px] text-slate-500 font-medium">{label}</span>
      <span className="text-sm font-bold text-slate-700">{value.toLocaleString()}</span>
    </div>
  );

  const totalAllServices = rankingUnitStats.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="lg:col-span-5 space-y-6 flex flex-col font-sans h-[56rem]">
      
      {/* Top Stats Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 p-4 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">ข้อมูลบริการทั้งหมด</h2>
            <p className="text-xs text-indigo-100 opacity-90">ยอดสะสมจากทุกหน่วยงาน</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold tracking-tight">
            {totalAllServices.toLocaleString()}
          </div>
          <div className="text-xs text-indigo-200 font-medium">รายการ</div>
        </div>
      </div>
      
      {/* CARD 1: ตารางอันดับหน่วยงาน */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 overflow-hidden flex flex-col flex-1 max-h-[40%]">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">สถิติหน่วยงาน</h2>
              <p className="text-xs text-slate-500 mt-0.5">จัดอันดับตามผลงานรวม</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <select 
                value={rankingYear} 
                onChange={(e) => setRankingYear(e.target.value)} 
                className="appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer hover:border-indigo-300 transition-colors"
              >
                <option value="ทั้งหมด">ทุกปี</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative group">
              <select 
                value={rankingMonth} 
                onChange={(e) => setRankingMonth(e.target.value)} 
                className="appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer hover:border-indigo-300 transition-colors"
              >
                <option value="ทั้งหมด">ทุกเดือน</option>
                {thaiMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-white shadow-sm">
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-3 text-center w-14">#</th>
                <th className="p-3">หน่วยงาน</th>
                <th className="p-3 text-center w-24">สัดส่วน</th>
                <th className="p-3 text-right pr-6">ผลงานรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rankingUnitStats.length > 0 ? (
                rankingUnitStats.map((u, i) => (
                  <tr key={u.name} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="p-2 text-center">
                      <div className="flex justify-center transform scale-75">
                        <RankBadge rank={i + 1} />
                      </div>
                    </td>
                    <td className="p-2 font-medium text-slate-700 group-hover:text-indigo-700 truncate max-w-[150px]" title={u.name}>
                      {u.name}
                    </td>
                    <td className="p-2 text-center text-xs font-semibold text-slate-500">
                      {totalAllServices > 0 ? ((u.total / totalAllServices) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="p-2 text-right pr-6 font-bold text-slate-800 bg-slate-50/30 relative">
                      <div 
                        className="absolute right-0 top-1 bottom-1 bg-indigo-50/50 transition-all duration-500 ease-out z-0 rounded-l-md"
                        style={{ width: `${(u.total / maxTotal) * 100}%` }}
                      />
                      <span className="relative z-10">{u.total.toLocaleString()}</span>
                      {u.trend && (
                        <span className={`relative z-10 ml-2 text-[10px] ${u.trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {u.trend > 0 ? '▲' : '▼'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-400">ไม่พบข้อมูล</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CARD 2: เจาะลึก 5 อันดับแรก */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white sticky top-0 z-10">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-md font-bold text-slate-800">เจาะลึก 5 อันดับแรก</h2>
            <p className="text-xs text-slate-500">แยกตามประเภทบริการ และเขตพื้นที่</p>
          </div>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
          {rankingNestedStats && rankingNestedStats.length > 0 ? (
            rankingNestedStats.map((unit, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                
                {/* 1. Unit Header */}
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                      index === 1 ? 'bg-slate-200 text-slate-600' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      #{index + 1}
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {unit.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 mr-1">รวม</span>
                    <span className="text-sm font-extrabold text-indigo-600">{unit.totalWork.toLocaleString()}</span>
                  </div>
                </div>

                {/* 2. Service Stats Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                  <ServiceStat icon={Syringe} color="bg-blue-100 text-blue-600" label="วัคซีน" value={unit.stats?.vaccine || 0} />
                  <ServiceStat icon={Scissors} color="bg-red-100 text-red-600" label="ทำหมัน" value={unit.stats?.sterilize || 0} />
                  <ServiceStat icon={FileText} color="bg-yellow-100 text-yellow-600" label="ทะเบียน" value={unit.stats?.register || 0} />
                  <ServiceStat icon={Cpu} color="bg-purple-100 text-purple-600" label="ไมโครชิป" value={unit.stats?.microchip || 0} />
                  <ServiceStat icon={Stethoscope} color="bg-green-100 text-green-600" label="รักษา" value={unit.stats?.medical || 0} />
                </div>

                {/* 3. Top Districts List */}
                <div className="space-y-2 pt-2 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 pl-1">พื้นที่ให้บริการสูงสุด (Top 5 Areas)</p>
                  {unit.topDistricts && unit.topDistricts.length > 0 ? (
                    unit.topDistricts.map((dist, dIndex) => {
                      const distPercent = unit.totalWork > 0 ? ((dist.total / unit.totalWork) * 100).toFixed(1) : 0;
                      
                      return (
                        <div key={dIndex} className="flex flex-col py-2 px-2 rounded hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 relative overflow-hidden">
                          
                          {/* Progress bar พื้นหลังจางๆ แสดงสัดส่วนของเขต */}
                          <div 
                            className="absolute left-0 bottom-0 top-0 bg-slate-100/50 z-0 transition-all duration-500" 
                            style={{ width: `${distPercent}%` }}
                          />

                          {/* ข้อมูลเขตและยอดรวม */}
                          <div className="relative z-10 flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                              <span className="w-4 text-[10px] text-slate-400 font-mono">{dIndex + 1}.</span>
                              <span className="text-xs text-slate-700 font-bold">{dist.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-400">{distPercent}%</span>
                              <span className="text-[10px] font-bold text-indigo-600 bg-white shadow-sm border border-indigo-50 px-2 py-0.5 rounded-full">
                                รวม {dist.total.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* แสดงรายละเอียดบริการย่อย */}
                          <div className="relative z-10 flex flex-wrap gap-x-3 gap-y-1 pl-6">
                            {dist.stats.vaccine > 0 && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1" title="วัคซีน">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> 
                                วัคซีน: {dist.stats.vaccine}
                              </span>
                            )}
                            {dist.stats.sterilize > 0 && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1" title="ทำหมัน">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> 
                                ทำหมัน: {dist.stats.sterilize}
                              </span>
                            )}
                            {dist.stats.microchip > 0 && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1" title="ไมโครชิป">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div> 
                                ชิป: {dist.stats.microchip}
                              </span>
                            )}
                            {dist.stats.register > 0 && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1" title="ขึ้นทะเบียน">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div> 
                                ทะเบียน: {dist.stats.register}
                              </span>
                            )}
                            {dist.stats.medical > 0 && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1" title="รักษา">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> 
                                รักษา: {dist.stats.medical}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-xs text-slate-400 py-2">- ไม่ระบุเขต -</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Filter className="w-10 h-10 opacity-20" />
              <p className="text-sm">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankingSection;