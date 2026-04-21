import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Users } from 'lucide-react';

// 1. เพิ่ม Interface เพื่อกำหนด Type ให้กับ props ป้องกัน Error ts(7031)
interface UnitStat {
  name: string;
  total: number;
  count: number;
  [key: string]: any; // เผื่อมี properties อื่นๆ ส่งมาด้วย
}

interface UnitComparisonChartProps {
  unitStats: UnitStat[];
}

export default function UnitComparisonChart({ unitStats }: UnitComparisonChartProps) {
  if (!unitStats || unitStats.length === 0) return null;

  return (
    <div className="bg-indigo-50 p-8 rounded-3xl shadow-sm border border-indigo-100 overflow-hidden relative h-full flex flex-col">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/20 rounded-full -mr-32 -mt-32 blur-3xl" />
      
      <div className="relative z-10 flex flex-col flex-1 h-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-500">
                <Users className="w-5 h-5" />
              </div>
              ประสิทธิภาพและจำนวนครั้งที่ออกหน่วย
            </h2>
            <p className="text-xs text-slate-500 mt-1 ml-11">
              เปรียบเทียบยอดบริการสะสม กับจำนวนครั้งที่ลงพื้นที่แยกตามหน่วย
            </p>
          </div>
          {/* Legend */}
          <div className="flex gap-4 text-[10px] ml-11 md:ml-0">
            <div className="flex items-center gap-2 text-slate-600">
              <div className="w-3 h-3 bg-indigo-500 rounded-sm" /> ยอดบริการรวม
            </div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold">
              [ตัวเลข] ครั้ง = จำนวนที่ออกหน่วย
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full relative min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
            <BarChart data={unitStats} layout="vertical" margin={{top: 5, right: 130, left: 20, bottom: 5}}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={110} 
                tick={{fontSize: 11, fill: '#475569', fontWeight: 600}} 
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
                        <p className="text-indigo-600 text-xs font-bold mb-1">{label}</p>
                        <div className="text-[10px] text-slate-600 space-y-1">
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
                barSize={24}
                animationDuration={1500}
                activeBar={{ fill: '#818cf8' }}
              >
                <LabelList 
                  dataKey="total" 
                  position="right" 
                  content={(props: any) => {
                    const { x, y, width, value, index } = props;
                  
                    const count = unitStats[Number(index)]?.count || 0;
                    const displayValue = Number(value) || 0; 
                    const numX = Number(x) || 0;
                    const numY = Number(y) || 0;
                    const numWidth = Number(width) || 0;

                    return (
                      <g>
                        <text x={numX + numWidth + 8} y={numY + 16} className="font-mono">
                          <tspan fill="#334155" fontSize="12" fontWeight="bold">
                            {displayValue.toLocaleString()}
                          </tspan>
                          <tspan fill="#6366f1" fontSize="10" fontWeight="600" dx="6">
                            | {count} ครั้ง
                          </tspan>
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
  );
}