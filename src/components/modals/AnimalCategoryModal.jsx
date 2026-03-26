import React from 'react';
import { X, PawPrint, Plus } from 'lucide-react';

const AnimalCategoryModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    // ข้อมูลตัวอย่าง (ยังไม่ได้ต่อ API)
    const categories = ['สุนัข (Dog)', 'แมว (Cat)', 'นก (Bird)', 'สัตว์เอ็กโซติก (Exotic)'];

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[6000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <PawPrint className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">จัดการหมวดหมู่สัตว์</h2>
                            <p className="text-xs text-slate-500">เพิ่มหรือลดประเภทสัตว์ในระบบฐานข้อมูล</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6">
                    <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="พิมพ์ชื่อหมวดหมู่..." className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 flex items-center gap-1"><Plus className="w-4 h-4"/> เพิ่ม</button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                        {categories.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <span className="text-sm font-medium text-slate-700">{cat}</span>
                                <button className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 bg-rose-50 rounded-lg">ลบ</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AnimalCategoryModal;