import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DogCatComparisonChart({ data }: { data: any[] }) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-200 h-[400px] flex flex-col">
            <h3 className="text-base font-bold text-slate-700 mb-4">เปรียบเทียบสัดส่วนการให้บริการ สุนัข vs แมว</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /> 
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip 
                            cursor={{ fill: '#f8fafc' }} 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }} 
                            itemStyle={{ fontSize: '11px' }}
                        />
                        
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        
                        <Bar dataKey="สุนัข" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                        <Bar dataKey="แมว" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}