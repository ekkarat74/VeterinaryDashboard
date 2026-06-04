import React, { useState, useMemo } from 'react';
import { 
    Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    Legend, ResponsiveContainer, Area, ComposedChart 
} from 'recharts';
import { Calendar, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

// --- กำหนด Type ---
interface TrendData {
    name: string;
    total?: number;
    vaccine?: number;
    sterilize?: number;
    medical?: number;
    register?: number;
    microchip?: number;
    growthRates?: Record<string, number>; 
    [key: string]: any;
}

interface DispatchStatData {
    name: string;
    sterilization?: number;
    vaccine_microchip?: number;
    governor?: number;
    cat_cage?: number;
    other?: number;
    [key: string]: any;
}

interface DispatchStats {
    monthly?: DispatchStatData[];
    daily?: DispatchStatData[];
}

interface StatisticsChartsProps {
    trendData: TrendData[];
    unitStats: any[]; 
    dispatchStats: DispatchStats;
    trendOffset: number;
    setTrendOffset: React.Dispatch<React.SetStateAction<number>>;
    freqDailyOffset: number;
    setFreqDailyOffset: React.Dispatch<React.SetStateAction<number>>;
    freqMonthlyOffset: number;
    setFreqMonthlyOffset: React.Dispatch<React.SetStateAction<number>>;
    chartBaseYear: string | number;
    setChartBaseYear: (val: string | number) => void;
    chartBaseMonth: string | number;
    setChartBaseMonth: (val: string | number) => void;
    availableYears?: (string | number)[];
    allUnits?: string[];
}

// --- ฟังก์ชันช่วยเหลือ (Helpers) ---
const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", 
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const THAI_MONTH_MAP: Record<string, number> = {
    "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4, "พฤษภาคม": 5, "มิถุนายน": 6,
    "กรกฎาคม": 7, "สิงหาคม": 8, "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
    "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4, "พ.ค.": 5, "มิ.ย.": 6,
    "ก.ค.": 7, "ส.ค.": 8, "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12
};

const formatCompactNumber = (value: any): string => {
    const num = Number(value);
    if (isNaN(num)) return String(value);
    if (num >= 1000) return (num / 1000).toFixed(num % 1000 !== 0 ? 1 : 0) + 'k';
    return num.toString(); 
};

// ฟังก์ชันคำนวณ Growth Rate เทียบกับแท่งก่อนหน้า (เพื่อใช้ใน Tooltip)
const calculateTrendWithGrowth = (data: TrendData[]): TrendData[] => {
    return data.map((current, index) => {
        const growthRates: Record<string, number> = {};
        if (index > 0) {
            const prev = data[index - 1];
            const keysToCompare = ['total', 'vaccine', 'microchip', 'sterilize', 'medical', 'register'];
            
            keysToCompare.forEach(key => {
                const currentVal = current[key] || 0;
                const prevVal = prev[key] || 0;
                
                if (prevVal > 0) {
                    growthRates[key] = Number((((currentVal - prevVal) / prevVal) * 100).toFixed(1));
                } else if (currentVal > 0) {
                    growthRates[key] = 100; // จาก 0 เป็นมีค่า
                } else {
                    growthRates[key] = 0; // 0 เท่าเดิม
                }
            });
        }
        return { ...current, growthRates };
    });
};

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-100 shadow-xl rounded-lg z-50 min-w-[180px]">
                <p className="text-xs font-bold text-slate-700 mb-2 border-b pb-1">{label}</p>
                {payload.map((entry: any, index: number) => {
                    const dataKey = entry.dataKey as string;
                    const growthRate = entry.payload?.growthRates?.[dataKey];
                    
                    return (
                        <div key={index} className="flex items-center justify-between gap-6 text-[10px] py-1">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-600 font-medium">{entry.name}:</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-800 text-xs">
                                    {entry.value?.toLocaleString() || '0'}
                                </span>
                                {growthRate !== undefined && (
                                    <span className={`flex items-center justify-end font-bold text-[9px] w-[36px]
                                        ${growthRate > 0 ? 'text-emerald-500' : growthRate < 0 ? 'text-rose-500' : 'text-slate-400'}`}
                                    >
                                        {growthRate > 0 ? '▲' : growthRate < 0 ? '▼' : '−'}
                                        {Math.abs(growthRate)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

// --- Main Component ---
const StatisticsCharts: React.FC<StatisticsChartsProps> = ({ 
    trendData, unitStats, dispatchStats, trendOffset, setTrendOffset,
    freqDailyOffset, setFreqDailyOffset, freqMonthlyOffset, setFreqMonthlyOffset,
    chartBaseYear, setChartBaseYear, chartBaseMonth, setChartBaseMonth, availableYears,
    allUnits = []
}) => {
    const CHART_COLORS = ['#60a5fa', '#34d399', '#fb923c', '#a78bfa', '#f472b6', '#facc15', '#2dd4bf', '#818cf8', '#f87171', '#38bdf8', '#c084fc', '#4ade80'];
    const [freqFilter, setFreqFilter] = useState<'monthly' | 'daily'>('monthly'); 
    const currentFreqData = freqFilter === 'monthly' ? (dispatchStats?.monthly || []) : (dispatchStats?.daily || []);

    // คำนวณ Growth Rate ก่อนส่งให้ Chart
    const processedTrendData = useMemo(() => calculateTrendWithGrowth(trendData), [trendData]);

    const handleFreqPrev = () => {
        if (freqFilter === 'monthly') setFreqMonthlyOffset(prev => prev + 1);
        else setFreqDailyOffset(prev => prev + 1);
    };

    const handleFreqNext = () => {
        if (freqFilter === 'monthly') setFreqMonthlyOffset(prev => Math.max(0, prev - 1));
        else setFreqDailyOffset(prev => Math.max(0, prev - 1));
    };

    // --- ฟังก์ชัน Drill-down ---
    const handleTrendClick = (data: any) => {
        if (!data) return;

        let clickedName = "";
        
        if (data.activePayload && data.activePayload.length > 0) {
            clickedName = data.activePayload[0].payload.name;
        } else if (data.name) {
            clickedName = data.name;
        } else if (data.payload && data.payload.name) {
            clickedName = data.payload.name;
        }

        if (clickedName) {
            const foundMonthKey = Object.keys(THAI_MONTH_MAP).find(key => clickedName.includes(key));
            if (foundMonthKey) {
                console.log(`[Drill-Down] เปลี่ยนไปดูรายวันของเดือน: ${foundMonthKey}`);
                setChartBaseMonth(THAI_MONTH_MAP[foundMonthKey]); 
                setFreqFilter('daily'); 
                setFreqDailyOffset(0); 
            }
        }
    };

    const currentFreqOffset = freqFilter === 'monthly' ? freqMonthlyOffset : freqDailyOffset;

    if (!trendData || !unitStats || !dispatchStats) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-50/50 rounded-2xl border border-slate-100 m-2">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                <p className="text-xs text-slate-400 font-medium">กำลังโหลดข้อมูลสถิติ...</p>
            </div>
        );
    }

    const FilterSelectors = () => (
        <div className="flex gap-2">
            <select 
                className="px-2 py-1.5 text-[10px] font-semibold border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-600 shadow-sm cursor-pointer"
                value={chartBaseMonth}
                onChange={(e) => {
                    const val = e.target.value;
                    setChartBaseMonth(val === 'ทั้งหมด' ? 'ทั้งหมด' : parseInt(val));
                    setTrendOffset(0); 
                    setFreqDailyOffset(0);
                    setFreqMonthlyOffset(0);
                }}
            >
                <option value="ทั้งหมด">ทุกเดือน</option>
                {THAI_MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                ))}
            </select>
            <select 
                className="px-2 py-1.5 text-[10px] font-semibold border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-600 shadow-sm cursor-pointer"
                value={chartBaseYear}
                onChange={(e) => {
                    const val = e.target.value;
                    setChartBaseYear(val === 'ทั้งหมด' ? 'ทั้งหมด' : parseInt(val));
                    setTrendOffset(0); 
                    setFreqDailyOffset(0);
                    setFreqMonthlyOffset(0);
                }}
            >
                <option value="ทั้งหมด">ทุกปี</option>
                {(availableYears?.length ? availableYears : [new Date().getFullYear()]).map(y => (
                    <option key={y} value={y}>{parseInt(y as string) + 543}</option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-2">
            
            {/* 1. Monthly Trend Chart (With Drill-down & Growth Rate) */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col hover:border-indigo-100 transition-colors">
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            แนวโน้มผลงานการให้บริการ
                        </h2>
                        <p className="text-[10px] text-slate-400 mt-1 ml-7">
                            คลิกที่กราฟเพื่อเจาะลึกความถี่รายวัน {trendOffset > 0 && `(ย้อนหลัง ${trendOffset} เดือน)`}
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <FilterSelectors />
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                            <button onClick={() => setTrendOffset(prev => prev + 1)} className="p-1.5 hover:bg-white rounded-md shadow-sm text-slate-500 hover:text-indigo-600 transition-all" title="ดูข้อมูลเก่าขึ้น">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setTrendOffset(prev => Math.max(0, prev - 1))} disabled={trendOffset === 0} className="p-1.5 hover:bg-white rounded-md shadow-sm text-slate-500 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:hover:text-slate-500 disabled:shadow-none" title="ดูข้อมูลใหม่ขึ้น">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="h-80 w-full relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
                        <ComposedChart 
                            data={processedTrendData} // ใช้ Data ที่คำนวณ Growth Rate แล้ว
                            margin={{top:10, right:10, left: -20, bottom:0}}
                            onClick={handleTrendClick} // ดักจับ Event คลิก Drill-down
                            style={{ cursor: 'pointer' }}
                        >
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{fontSize:10, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" tickFormatter={formatCompactNumber} tick={{fontSize:10, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tickFormatter={formatCompactNumber} tick={{fontSize:10, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                            
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px' }} />
                            
                            <Area isAnimationActive={false} yAxisId="left" type="monotone" dataKey="total" fill="url(#colorTotal)" stroke="#6366f1" strokeWidth={2} name="ยอดรวมทั้งหมด" />
                            <Bar isAnimationActive={false} yAxisId="left" dataKey="vaccine" fill="#38bdf8" barSize={12} radius={[4,4,0,0]} name="ฉีดวัคซีน" />
                            <Bar isAnimationActive={false} yAxisId="left" dataKey="microchip" fill="#c084fc" barSize={12} radius={[4,4,0,0]} name="ฝังไมโครชิป" />
                            <Bar isAnimationActive={false} yAxisId="left" dataKey="sterilize" fill="#fb923c" barSize={12} radius={[4,4,0,0]} name="ทำหมัน" />
                            <Bar isAnimationActive={false} yAxisId="left" dataKey="medical" fill="#f472b6" barSize={12} radius={[4,4,0,0]} name="รักษาสัตว์" />
                            <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="register" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} name="ขึ้นทะเบียน" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. Frequency Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col transition-colors"
                 style={{ borderColor: freqFilter === 'daily' ? '#ccfbf1' : '#f1f5f9' }} 
            >
                {/* ... (ส่วน Frequency Chart โค้ดเดิมของคุณ ใช้งานได้สมบูรณ์อยู่แล้วครับ) ... */}
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-teal-500" />
                            ความถี่การออกหน่วย
                        </h2>
                        <p className="text-[10px] text-slate-400 mt-1 ml-7">
                             {freqFilter === 'monthly' ? `แยกรายเดือน ${freqMonthlyOffset > 0 ? `(ย้อนหลัง ${freqMonthlyOffset} เดือน)` : ''}` : `แยกรายวัน ${freqDailyOffset > 0 ? `(ย้อนหลัง ${freqDailyOffset} วัน)` : ''}`}
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <FilterSelectors />
                        
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                            <button onClick={handleFreqPrev} className="p-1.5 hover:bg-white rounded-md shadow-sm text-slate-500 hover:text-teal-600 transition-all" title="ดูข้อมูลเก่าขึ้น">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={handleFreqNext} disabled={currentFreqOffset === 0} className="p-1.5 hover:bg-white rounded-md shadow-sm text-slate-500 hover:text-teal-600 transition-all disabled:opacity-30 disabled:hover:text-slate-500 disabled:shadow-none" title="ดูข้อมูลใหม่ขึ้น">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            {(['daily', 'monthly'] as const).map((type) => (
                                <button 
                                    key={type}
                                    onClick={() => setFreqFilter(type)}
                                    className={`px-4 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                                        freqFilter === type ? 'bg-white text-teal-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {type === 'daily' ? 'รายวัน' : 'รายเดือน'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="h-80 w-full relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
                        <BarChart data={currentFreqData} margin={{top:10, right:5, left:-25, bottom:10}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                tick={{fontSize:9, fill:'#94a3b8'}} 
                                axisLine={false} 
                                tickLine={false}
                                angle={-30}
                                textAnchor="end"
                            />
                            <YAxis tick={{fontSize:10, fill:'#94a3b8'}} axisLine={false} tickLine={false} allowDecimals={false} />
                            <RechartsTooltip cursor={{fill: '#f8fafc'}} content={(props) => {
                                const filteredPayload = props.payload?.filter(item => (item.value as number) > 0);
                                return <CustomTooltip {...props} payload={filteredPayload} />;
                                }} 
                            />
                            <Legend iconType="rect" wrapperStyle={{ paddingTop: '20px', fontSize: '9px' }} />
                            
                            {allUnits.map((unit, index) => (
                                <Bar 
                                    key={unit}
                                    dataKey={unit} 
                                    fill={CHART_COLORS[index % CHART_COLORS.length]} 
                                    name={unit} 
                                    stackId="a" 
                                />
                            ))}
                            <Bar dataKey="other" fill="#cbd5e1" name="อื่นๆ" radius={[3,3,0,0]} stackId="a" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default StatisticsCharts;