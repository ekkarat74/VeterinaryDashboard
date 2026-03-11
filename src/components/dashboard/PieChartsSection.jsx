import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const PIE_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#64748b'];

export default function PieChartsSection({ 
    unitByDistrictPieData, 
    unitByUnitTypePieData, 
    unitByWorkTypePieData, 
    outbreakPieData 
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            
            {/* กราฟวงที่ 1: ออกหน่วย (ตามเขต) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2 text-center text-sm">ยอดงานสะสม (แยกตามเขต)</h3>
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <Pie data={unitByDistrictPieData} cx="50%" cy="50%" labelLine={true} outerRadius={55} fill="#8884d8" dataKey="value"
                                style={{ fontSize: '11px' }}
                                label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : null}
                            >
                                {unitByDistrictPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value.toLocaleString()} รายการ`, name]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* กราฟวงที่ 2: ออกหน่วย (ตามหน่วยงาน) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2 text-center text-sm">ยอดงานสะสม (แยกตามหน่วย)</h3>
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <Pie data={unitByUnitTypePieData} cx="50%" cy="50%" labelLine={true} outerRadius={55} fill="#8884d8" dataKey="value"
                                style={{ fontSize: '11px' }}
                                label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : null}
                            >
                                {unitByUnitTypePieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value.toLocaleString()} รายการ`, name]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* กราฟวงที่ 3: ออกหน่วย (ตามประเภทงาน) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2 text-center text-sm">สัดส่วนประเภทงานที่ออกหน่วย</h3>
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <Pie data={unitByWorkTypePieData} cx="50%" cy="50%" labelLine={true} outerRadius={55} fill="#8884d8" dataKey="value"
                                style={{ fontSize: '11px' }}
                                label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : null}
                            >
                                {unitByWorkTypePieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value.toLocaleString()} ตัว`, name]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* กราฟวงที่ 4: โรคพิษสุนัขบ้า */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2 text-center text-sm">จุดเสี่ยงโรคระบาด (แยกตามเขต)</h3>
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <Pie data={outbreakPieData} cx="50%" cy="50%" labelLine={true} outerRadius={55} fill="#82ca9d" dataKey="value"
                                style={{ fontSize: '11px' }}
                                label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : null}
                            >
                                {outbreakPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value.toLocaleString()} จุด`, name]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}