import React, { useState } from 'react';
import { 
    Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    Legend, ResponsiveContainer, Area, ComposedChart, LabelList 
} from 'recharts';
import { Calendar, Users, BarChart2 } from 'lucide-react';

const StatisticsCharts = ({ trendData, unitStats, dispatchStats }) => {
    // State สำหรับสลับรายวัน/รายเดือน
    const [freqFilter, setFreqFilter] = useState('monthly'); 

    const currentFreqData = freqFilter === 'monthly' ? dispatchStats.monthly : dispatchStats.daily;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Monthly Trend Chart (แนวโน้มผลงาน) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" /> แนวโน้มผลงาน (10 เดือนล่าสุด)
                </h2>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trendData} margin={{top:10, right:10, left:0, bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" tick={{fontSize:12}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{fontSize:12}} axisLine={false} tickLine={false} />
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Area yAxisId="left" type="monotone" dataKey="total" fill="#e0e7ff" stroke="#6366f1" name="ยอดรวมทั้งหมด" />
                            <Bar yAxisId="left" dataKey="vaccine" fill="#3b82f6" barSize={10} radius={[4,4,0,0]} name="วัคซีน" />
                            <Bar yAxisId="left" dataKey="sterilize" fill="#f97316" barSize={10} radius={[4,4,0,0]} name="ทำหมัน" />
                            <Bar yAxisId="left" dataKey="medical" fill="#ec4899" barSize={10} radius={[4,4,0,0]} name="รักษาสัตว์" />
                            <Line yAxisId="right" type="monotone" dataKey="register" stroke="#10b981" strokeWidth={2} dot={{r: 2}} name="ขึ้นทะเบียน" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. Frequency Chart (จำนวนครั้งที่ออกหน่วย - แก้ไขภาษาไทยตรงนี้) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 leading-tight">
                        <BarChart2 className="w-5 h-5 text-teal-500" /> จำนวนครั้ง<br/>ที่ออกหน่วย
                    </h2>
                    
                    <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                        <button 
                            onClick={() => setFreqFilter('daily')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${freqFilter === 'daily' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            รายวัน
                        </button>
                        <button 
                            onClick={() => setFreqFilter('monthly')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${freqFilter === 'monthly' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            รายเดือน
                        </button>
                    </div>
                </div>

                <div className="flex-1 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={currentFreqData} margin={{top:15, right:5, left:-20, bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                tick={{fontSize:9}} 
                                axisLine={false} 
                                tickLine={false} 
                                interval={freqFilter === 'daily' ? 1 : 0} 
                                angle={-45}
                                textAnchor="end"
                                height={40}
                            />
                            <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} allowDecimals={false} />
                            <RechartsTooltip 
                                cursor={{fill: '#f0fdf4'}}
                                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                            />
                            
                            {/* แก้ไขชื่อ prop "name" เป็นภาษาไทย */}
                            <Bar dataKey="sterilization" fill="#3b82f6" name="สัตวแพทย์" radius={[2,2,0,0]} barSize={8} />
                            <Bar dataKey="microchip" fill="#10b981" name="ไมโครชิป" radius={[2,2,0,0]} barSize={8} />
                            <Bar dataKey="governor" fill="#f97316" name="ผู้ว่าฯ" radius={[2,2,0,0]} barSize={8} />
                            <Bar dataKey="cat_cage" fill="#8b5cf6" name="กรงแมว" radius={[2,2,0,0]} barSize={8} />
                            <Bar dataKey="other" fill="#94a3b8" name="อื่นๆ" radius={[2,2,0,0]} barSize={8} />

                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconSize={8} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-center text-[10px] text-slate-400 mt-1">
                    {freqFilter === 'daily' ? '(14 วันล่าสุด)' : '(10 เดือนล่าสุด)'}
                </div>
            </div>

            {/* 3. Unit Comparison Chart (เทียบหน่วย) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" /> เทียบหน่วย<span className="text-xs text-slate-400 font-normal">(รวม/ครั้ง)</span>
                </h2>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={unitStats} layout="vertical" margin={{top:5, right:40, left:0, bottom:5}}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={120} tick={{fontSize:11}} axisLine={false} tickLine={false} />
                            <RechartsTooltip cursor={{fill: 'transparent'}} />
                            
                            <Bar dataKey="total" fill="#8b5cf6" radius={[0,4,4,0]} barSize={20} name="ยอดบริการรวม">
                                <LabelList 
                                    dataKey="count" 
                                    position="right" 
                                    formatter={(value) => `${value} ครั้ง`}
                                    style={{ fontSize: '10px', fill: '#64748b', fontWeight: 'bold' }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

export default StatisticsCharts;