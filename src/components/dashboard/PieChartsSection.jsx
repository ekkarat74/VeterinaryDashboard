import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const PIE_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#64748b'];

export default function PieChartsSection({
    unitByDistrictPieData = [], 
    unitByUnitTypePieData = [], 
    unitByWorkTypePieData = [], 
    outbreakPieData = [] 
}) {
    const safeFormatTooltip = (value, name, unit) => {
        const safeValue = value ?? 0;
        return [`${safeValue.toLocaleString()} ${unit}`, name || 'ไม่ระบุ'];
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            
            {/* กราฟวงที่ 1: ออกหน่วย (ตามเขต) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2 text-center text-xs">ยอดงานสะสม (แยกตามเขต)</h3>
                <div className="h-[220px] w-full flex items-center justify-center">
                    {unitByDistrictPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <Pie 
                                    data={unitByDistrictPieData} 
                                    cx="50%" cy="50%" labelLine={true} outerRadius={55} fill="#8884d8" dataKey="value"
                                    style={{ fontSize: '10px' }}
                                    label={({ name, percent }) => percent > 0.05 ? `${name || 'ไม่ระบุ'} ${(percent * 100).toFixed(0)}%` : ""}
                                >
                                    {unitByDistrictPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                                </Pie>
                                <Tooltip formatter={(value, name) => safeFormatTooltip(value, name, 'รายการ')} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <span className="text-slate-400 text-xs">ไม่มีข้อมูล</span>
                    )}
                </div>
            </div>

            {/* กราฟวงที่ 2: ออกหน่วย (ตามหน่วยงาน) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2 text-center text-xs">ยอดงานสะสม (แยกตามหน่วย)</h3>
                <div className="h-[220px] w-full flex items-center justify-center">
                    {unitByUnitTypePieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <Pie 
                                    data={unitByUnitTypePieData} 
                                    cx="50%" cy="50%" labelLine={true} outerRadius={55} fill="#8884d8" dataKey="value"
                                    style={{ fontSize: '10px' }}
                                    label={({ name, percent }) => percent > 0.05 ? `${name || 'ไม่ระบุ'} ${(percent * 100).toFixed(0)}%` : ""}
                                >
                                    {unitByUnitTypePieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                                </Pie>
                                <Tooltip formatter={(value, name) => safeFormatTooltip(value, name, 'รายการ')} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <span className="text-slate-400 text-xs">ไม่มีข้อมูล</span>
                    )}
                </div>
            </div>

            {/* กราฟวงที่ 3: ออกหน่วย (ตามประเภทงาน) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2 text-center text-xs">สัดส่วนประเภทงานที่ออกหน่วย</h3>
                <div className="h-[220px] w-full flex items-center justify-center">
                    {unitByWorkTypePieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <Pie 
                                    data={unitByWorkTypePieData} 
                                    cx="50%" cy="50%" labelLine={true} outerRadius={55} fill="#8884d8" dataKey="value"
                                    style={{ fontSize: '10px' }}
                                    label={({ name, percent }) => percent > 0 ? `${name || 'ไม่ระบุ'} ${(percent * 100).toFixed(0)}%` : ""}
                                >
                                    {unitByWorkTypePieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                                </Pie>
                                <Tooltip formatter={(value, name) => safeFormatTooltip(value, name, 'ตัว')} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <span className="text-slate-400 text-xs">ไม่มีข้อมูล</span>
                    )}
                </div>
            </div>

            {/* กราฟวงที่ 4: โรคพิษสุนัขบ้า */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2 text-center text-xs">จุดเสี่ยงโรคระบาด (แยกตามเขต)</h3>
                <div className="h-[220px] w-full flex items-center justify-center">
                    {outbreakPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <Pie 
                                    data={outbreakPieData} 
                                    cx="50%" cy="50%" labelLine={true} outerRadius={55} fill="#82ca9d" dataKey="value"
                                    style={{ fontSize: '10px' }}
                                    label={({ name, percent }) => percent > 0.05 ? `${name || 'ไม่ระบุ'} ${(percent * 100).toFixed(0)}%` : ""}
                                >
                                    {outbreakPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                                </Pie>
                                <Tooltip formatter={(value, name) => safeFormatTooltip(value, name, 'จุด')} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <span className="text-slate-400 text-xs">ไม่มีข้อมูล</span>
                    )}
                </div>
            </div>

        </div>
    );
}