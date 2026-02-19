import React, { useState } from 'react';
import { 
    Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    Legend, ResponsiveContainer, Area, ComposedChart, LabelList 
} from 'recharts';
import { Calendar, Users, BarChart3 } from 'lucide-react';

const StatisticsCharts = ({ trendData, unitStats, dispatchStats }) => {
    const [freqFilter, setFreqFilter] = useState('monthly'); 
    const currentFreqData = freqFilter === 'monthly' ? dispatchStats.monthly : dispatchStats.daily;
    // [ส่วนที่เพิ่ม] ป้องกัน Error กรณีข้อมูลยังไม่มาหรือเป็น null
    if (!trendData || !unitStats || !dispatchStats) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-50/50 rounded-2xl border border-slate-100 m-2">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-slate-400 font-medium">กำลังโหลดข้อมูลสถิติ...</p>
            </div>
        );
    }

    // [ส่วนที่เพิ่ม] ฟังก์ชันย่อตัวเลขแกน Y เพื่อประหยัดพื้นที่
    const formatCompactNumber = (number) => {
        if (number >= 1000) {
            return (number / 1000).toFixed(number % 1000 !== 0 ? 1 : 0) + 'k';
        }
        return number;
    };

    // Custom Tooltip (ใช้ร่วมกันได้ทั้ง 3 กราฟ)
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-100 shadow-xl rounded-lg">
                    <p className="text-sm font-bold text-slate-700 mb-2 border-b pb-1">{label}</p>
                    {payload.map((entry, index) => (
                        // เพิ่มการจัดการค่าให้เซฟขึ้น
                        <div key={index} className="flex items-center justify-between gap-6 text-xs py-0.5">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-500">{entry.name}:</span>
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                                {entry.value ? entry.value.toLocaleString() : '0'}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-2">
            
            {/* 1. Monthly Trend Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            แนวโน้มผลงานการให้บริการ
                        </h2>
                        <p className="text-xs text-slate-400 mt-1 ml-7">สถิติภาพรวม 10 เดือนล่าสุด</p>
                    </div>
                </div>
                
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                        <ComposedChart data={trendData} margin={{top:10, right:10, left: -20, bottom:0}}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" tickFormatter={formatCompactNumber} tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tickFormatter={formatCompactNumber} tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }} />
                            
                            <Area yAxisId="left" type="monotone" dataKey="total" fill="url(#colorTotal)" stroke="#6366f1" strokeWidth={2} name="ยอดรวมทั้งหมด" />
                            <Bar yAxisId="left" dataKey="vaccine" fill="#38bdf8" barSize={12} radius={[4,4,0,0]} name="วัคซีน" activeBar={{ stroke: '#0284c7', strokeWidth: 1, fill: '#7dd3fc' }} />
                            <Bar yAxisId="left" dataKey="sterilize" fill="#fb923c" barSize={12} radius={[4,4,0,0]} name="ทำหมัน" activeBar={{ stroke: '#ea580c', strokeWidth: 1, fill: '#fdba74' }} />
                            <Bar yAxisId="left" dataKey="medical" fill="#f472b6" barSize={12} radius={[4,4,0,0]} name="รักษาสัตว์" activeBar={{ stroke: '#db2777', strokeWidth: 1, fill: '#f9a8d4' }} />
                            <Line yAxisId="right" type="monotone" dataKey="register" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} name="ขึ้นทะเบียน" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. Frequency Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-teal-500" />
                            ความถี่การออกหน่วย
                        </h2>
                        <p className="text-xs text-slate-400 mt-1 ml-7">แยกตามประเภทภารกิจ</p>
                    </div>
                    
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                        {['daily', 'monthly'].map((type) => (
                            <button 
                                key={type}
                                onClick={() => setFreqFilter(type)}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    freqFilter === type ? 'bg-white text-teal-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {type === 'daily' ? 'รายวัน' : 'รายเดือน'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 h-72">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                        <BarChart data={currentFreqData} margin={{top:10, right:5, left:-25, bottom:10}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                tick={{fontSize:10, fill:'#94a3b8'}} 
                                axisLine={false} 
                                tickLine={false}
                                angle={-30}
                                textAnchor="end"
                            />
                            <YAxis tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} allowDecimals={false} />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                            <Legend iconType="rect" wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }} />
                            
                            <Bar dataKey="sterilization" fill="#60a5fa" name="สัตวแพทย์" radius={[3,3,0,0]} stackId="a" />
                            <Bar dataKey="microchip" fill="#34d399" name="ไมโครชิป" radius={[3,3,0,0]} stackId="a" />
                            <Bar dataKey="governor" fill="#fb923c" name="ผู้ว่าฯ" radius={[3,3,0,0]} stackId="a" />
                            <Bar dataKey="cat_cage" fill="#a78bfa" name="กรงแมว" radius={[3,3,0,0]} stackId="a" />
                            <Bar dataKey="other" fill="#cbd5e1" name="อื่นๆ" radius={[3,3,0,0]} stackId="a" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3. Unit Comparison Chart - ปรับเป็นธีมสีอ่อน (Light Theme) */}
            <div className="lg:col-span-2 bg-indigo-50 p-8 rounded-3xl shadow-sm border border-indigo-100 overflow-hidden relative">
                {/* Background Decoration (ปรับให้จางลงมาก) */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/20 rounded-full -mr-32 -mt-32 blur-3xl" />
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-500">
                                    <Users className="w-6 h-6" />
                                </div>
                                ประสิทธิภาพและจำนวนครั้งที่ออกหน่วย
                            </h2>
                            <p className="text-sm text-slate-500 mt-1 ml-12">
                                เปรียบเทียบยอดบริการสะสม กับจำนวนครั้งที่ลงพื้นที่แยกตามหน่วย
                            </p>
                        </div>
                        {/* Legend */}
                        <div className="flex gap-4 text-xs ml-12 md:ml-0">
                            <div className="flex items-center gap-2 text-slate-600">
                                <div className="w-3 h-3 bg-indigo-500 rounded-sm" /> ยอดบริการรวม
                            </div>
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                [ตัวเลข] ครั้ง = จำนวนที่ออกหน่วย
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                        <BarChart 
                                data={unitStats} 
                                layout="vertical" 
                                margin={{top: 5, right: 100, left: 20, bottom: 5}}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={110} 
                                    tick={{fontSize: 13, fill: '#475569', fontWeight: 600}} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                <RechartsTooltip 
                                    cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-xl">
                                                    <p className="text-indigo-600 font-bold mb-1">{label}</p>
                                                    <div className="text-xs text-slate-600 space-y-1">
                                                        <p>ยอดบริการ: <span className="text-slate-900 font-mono font-bold">{data.total.toLocaleString()}</span> เคส</p>
                                                        <p>ออกหน่วย: <span className="text-slate-900 font-mono font-bold">{data.count}</span> ครั้ง</p>
                                                        <p className="pt-1 border-t border-slate-100 mt-1 text-slate-400 italic">
                                                            เฉลี่ย: {(data.total / data.count).toFixed(1)} เคส/ครั้ง
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                
                                <Bar 
                                    dataKey="total" 
                                    fill="#6366f1" 
                                    radius={[0, 12, 12, 0]} 
                                    barSize={28}
                                    animationDuration={1500}
                                    activeBar={{ fill: '#818cf8' }}
                                >
                                    <LabelList 
                                        dataKey="total" 
                                        position="right" 
                                        content={(props) => {
                                            const { x, y, width, value, index } = props;
                                            const count = unitStats[index]?.count || 0;
                                            return (
                                                <g>
                                                    {/* ยอดบริการรวม (สีเข้ม) */}
                                                    <text 
                                                        x={x + width + 10} 
                                                        y={y + 18} 
                                                        fill="#334155" 
                                                        fontSize="14" 
                                                        fontWeight="bold"
                                                        className="font-mono"
                                                    >
                                                        {value.toLocaleString()}
                                                    </text>
                                                    {/* จำนวนครั้งที่ออกหน่วย (สี Indigo) */}
                                                    <text 
                                                        x={x + width + 55} 
                                                        y={y + 18} 
                                                        fill="#6366f1" 
                                                        fontSize="12"
                                                        fontWeight="600"
                                                    >
                                                        | {count} ครั้ง
                                                    </text>
                                                </g>
                                            );
                                        }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default StatisticsCharts;