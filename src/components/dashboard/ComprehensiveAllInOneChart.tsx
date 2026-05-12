import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ComprehensiveChartProps {
    data: any[];
}

export default function ComprehensiveAllInOneChart({ data }: ComprehensiveChartProps) {
    // ประมวลผลข้อมูล: จัดกลุ่มตาม "เขต" และ "หน่วยงาน"
    const chartData = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) return [];

        const map: Record<string, any> = {};

        data.forEach(item => {
            const district = item.district || 'ไม่ระบุเขต';
            const unit = item.unit || 'ไม่ระบุหน่วย';
            // สร้าง Key ที่รวมเขตและหน่วยเข้าด้วยกัน
            const key = `${district}_${unit}`;

            if (!map[key]) {
                map[key] = {
                    district,
                    unit,
                    label: `${district} (${unit})`, // ชื่อที่จะโชว์บนแกน X
                    vaccine: 0,
                    sterilize: 0,
                    register: 0,
                    microchip: 0,
                    medical: 0,
                    total: 0
                };
            }

            const toNum = (val: any) => parseInt(val, 10) || 0;
            const v = toNum(item.stats?.vaccine);
            const s = toNum(item.stats?.sterilize);
            const r = toNum(item.stats?.register);
            const m = toNum(item.stats?.microchip);
            const med = toNum(item.stats?.medical);

            map[key].vaccine += v;
            map[key].sterilize += s;
            map[key].register += r;
            map[key].microchip += m;
            map[key].medical += med;
            map[key].total += (v + s + r + m + med);
        });

        // แปลงเป็น Array -> กรองอันที่ไม่มีผลงานทิ้ง -> เรียงตามเขต และตามจำนวนงาน
        return Object.values(map)
            .filter(d => d.total > 0)
            .sort((a, b) => a.district.localeCompare(b.district) || b.total - a.total);
    }, [data]);

    // คำนวณความกว้างของกราฟแบบไดนามิก (ให้แท่งละ 60px เป็นอย่างน้อย) 
    // เพื่อให้กราฟไม่เบียดกันเมื่อมีหน่วยงานเยอะๆ
    const dynamicWidth = Math.max(800, chartData.length * 60);

    if (chartData.length === 0) {
        return (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 w-full h-[400px] flex items-center justify-center text-slate-400">
                ไม่มีข้อมูลสำหรับการแสดงผล
            </div>
        );
    }

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 w-full">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800">สรุปการให้บริการครอบคลุมทุกมิติ</h3>
                <p className="text-xs text-slate-500">แยกตามพื้นที่เขต หน่วยปฏิบัติงาน และประเภทการให้บริการ (เลื่อนซ้าย-ขวาเพื่อดูทั้งหมด)</p>
            </div>

            {/* กรอบสำหรับ Scroll แนวนอน */}
            <div className="overflow-x-auto custom-scrollbar border border-slate-50 rounded-xl w-full">
                {/* พื้นที่ของกราฟที่จะยืดความกว้างตามข้อมูล */}
                <div style={{ width: `${dynamicWidth}px`, height: '500px', minWidth: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 80 }} // เพิ่ม bottom เพื่อเผื่อที่ให้ข้อความเอียง
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                            
                            <XAxis 
                                dataKey="label" 
                                type="category" 
                                interval={0} // บังคับให้แสดงชื่อทุกแท่ง
                                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600, angle: -45, textAnchor: 'end' }} // เอียงข้อความ 45 องศา
                            />
                            
                            <YAxis 
                                type="number" 
                                tick={{ fontSize: 12, fill: '#64748B' }} 
                            />
                            
                            <Tooltip
                                cursor={{ fill: '#F1F5F9' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '13px' }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                            
                            {/* ขยับ Legend ไปไว้ด้านบนเพื่อให้มีพื้นที่ด้านล่างมากขึ้น */}
                            <Legend wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }} verticalAlign="top" />

                            {/* กำหนดสีให้ตรงกับ Theme ของระบบ */}
                            <Bar dataKey="vaccine" name="ฉีดวัคซีน" stackId="a" fill="#6B4BFA" />
                            <Bar dataKey="sterilize" name="ผ่าตัดทำหมัน" stackId="a" fill="#F43F5E" />
                            <Bar dataKey="medical" name="รักษาพยาบาล" stackId="a" fill="#10B981" />
                            <Bar dataKey="microchip" name="ฝังไมโครชิป" stackId="a" fill="#F59E0B" />
                            {/* ใส่ความโค้งมนที่แท่งบนสุด (จดทะเบียน) -> [บนซ้าย, บนขวา, ล่างขวา, ล่างซ้าย] */}
                            <Bar dataKey="register" name="จดทะเบียน" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}