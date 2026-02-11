import React from 'react';
import { 
    Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    Legend, ResponsiveContainer, Area, ComposedChart
} from 'recharts';
import { Calendar, Users } from 'lucide-react';

const StatisticsCharts = ({ trendData, unitStats }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Monthly Trend Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" /> แนวโน้มรายเดือน (10 เดือนล่าสุด)
                </h2>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trendData} margin={{top:10, right:10, left:0, bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" tick={{fontSize:12}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{fontSize:12}} axisLine={false} tickLine={false} />
                            <RechartsTooltip />
                            <Legend />
                            <Area yAxisId="left" type="monotone" dataKey="total" fill="#e0e7ff" stroke="#6366f1" name="ยอดรวมทั้งหมด" />
                            <Bar yAxisId="left" dataKey="vaccine" fill="#3b82f6" barSize={10} radius={[4,4,0,0]} name="วัคซีน" />
                            <Bar yAxisId="left" dataKey="sterilize" fill="#f97316" barSize={10} radius={[4,4,0,0]} name="ทำหมัน" />
                            <Bar yAxisId="left" dataKey="medical" fill="#ec4899" barSize={10} radius={[4,4,0,0]} name="รักษาสัตว์" />
                            <Line yAxisId="right" type="monotone" dataKey="register" stroke="#10b981" strokeWidth={2} name="ขึ้นทะเบียน" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Unit Comparison Chart */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" /> เปรียบเทียบหน่วย
                </h2>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={unitStats} layout="vertical" margin={{top:5, right:30, left:20, bottom:5}}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize:10}} axisLine={false} tickLine={false} />
                            <RechartsTooltip />
                            <Bar dataKey="total" fill="#8b5cf6" radius={[0,4,4,0]} barSize={15} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default StatisticsCharts;