import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GenderSterilizationChartProps {
    data: {
        name: string;
        'ตัวผู้': number;
        'ตัวเมีย': number;
    }[];
}

const GenderSterilizationChart: React.FC<GenderSterilizationChartProps> = ({ data }) => {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
            <div className="mb-4">
                <h3 className="font-bold text-slate-800 text-base">สัดส่วนการทำหมันแยกตามเพศ</h3>
                <p className="text-[10px] text-slate-500">เปรียบเทียบจำนวนการทำหมันสุนัขและแมว (ตัวผู้ vs ตัวเมีย)</p>
            </div>
            <div className="flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 10 }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }} 
                        />
                        <Tooltip 
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                            itemStyle={{ fontSize: '11px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Bar dataKey="ตัวผู้" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={40} />
                        <Bar dataKey="ตัวเมีย" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GenderSterilizationChart;