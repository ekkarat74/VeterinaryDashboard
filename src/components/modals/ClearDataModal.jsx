import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

export default function ClearDataModal({ isOpen, onClose, onConfirm, availableYears, units, thaiMonths }) {
    const [password, setPassword] = useState('');
    const [selectedYear, setSelectedYear] = useState('ทั้งหมด');
    const [selectedMonth, setSelectedMonth] = useState('ทั้งหมด');
    const [selectedUnit, setSelectedUnit] = useState('ทั้งหมด');

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setSelectedYear('ทั้งหมด');
            setSelectedMonth('ทั้งหมด');
            setSelectedUnit('ทั้งหมด');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(password, { 
            year: selectedYear, 
            month: selectedMonth, 
            unit: selectedUnit 
        });
    };

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-red-50/50">
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        <h2 className="text-lg font-bold">ล้างข้อมูล (Clear Data)</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
                    <p className="text-slate-600 mb-4">
                        กรุณาเลือกเงื่อนไขข้อมูลที่ต้องการลบ หากเลือก <b>"ทั้งหมด"</b> ข้อมูลในส่วนนั้นจะถูกลบทั้งหมด (การกระทำนี้ไม่สามารถกู้คืนได้)
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        {/* เลือกปี */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">ปี (Year)</label>
                            <select 
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                <option value="ทั้งหมด">ทั้งหมด</option>
                                {availableYears.map(y => <option key={y} value={y}>{parseInt(y) + 543}</option>)}
                            </select>
                        </div>

                        {/* เลือกเดือน */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">เดือน (Month)</label>
                            <select 
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                            >
                                <option value="ทั้งหมด">ทั้งหมด</option>
                                {thaiMonths.map((m, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
                            </select>
                        </div>

                        {/* เลือกหน่วยงาน */}
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">หน่วยงาน (Unit)</label>
                            <select 
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}
                            >
                                <option value="ทั้งหมด">ทั้งหมด</option>
                                {units.map((u, i) => <option key={i} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* รหัสผ่านยืนยัน */}
                    <div className="pt-4 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-500 mb-1">รหัสผ่านยืนยัน (SuperAdmin)</label>
                        <input 
                            type="password" 
                            required 
                            placeholder="ใส่รหัสผ่านเพื่อยืนยันการลบ" 
                            className="w-full p-2.5 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-red-50/30"
                            value={password} onChange={(e) => setPassword(e.target.value)} 
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold transition-colors">
                            ยกเลิก
                        </button>
                        <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors">
                            <Trash2 className="w-4 h-4" /> ยืนยันการลบข้อมูล
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}