import React from 'react';
import { X, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

const RolePermissionsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const roles = [
        { name: 'Developer', color: 'text-indigo-600 bg-indigo-50', desc: 'ควบคุมระบบสูงสุด แก้ไขโค้ดและฐานข้อมูล' },
        { name: 'MagaAdmin (ผู้บริหาร)', color: 'text-emerald-600 bg-emerald-50', desc: 'เข้าถึงสถิติเชิงลึก จัดการการแสดงผล' },
        { name: 'SuperAdmin', color: 'text-blue-600 bg-blue-50', desc: 'จัดการผู้ใช้งานทั่วไป นำเข้า/ส่งออกข้อมูล' },
        { name: 'Admin', color: 'text-orange-600 bg-orange-50', desc: 'เพิ่ม/ลบ/แก้ไขข้อมูลบริการในระบบ' }
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[6000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">สิทธิ์การเข้าถึงเชิงลึก (Hierarchy)</h2>
                            <p className="text-xs text-slate-500">ลำดับชั้นของบทบาทในระบบ</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-200">
                        <Lock className="w-4 h-4 shrink-0"/> ระบบป้องกันความปลอดภัยเปิดทำงานอยู่ ตำแหน่งที่ต่ำกว่าไม่สามารถแก้ไขบัญชีตำแหน่งที่สูงกว่าได้
                    </div>

                    <div className="space-y-3">
                        {roles.map((role, idx) => (
                            <div key={idx} className="flex gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden">
                                {/* เส้นแบ่ง Hierarchy */}
                                {idx !== roles.length - 1 && (
                                    <div className="absolute left-6 top-10 w-0.5 h-full bg-slate-200 -z-10"></div>
                                )}
                                
                                <div className="mt-1 relative z-10">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 bg-white rounded-full" />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-bold px-2 py-0.5 rounded-md inline-block mb-1 ${role.color}`}>{role.name}</h4>
                                    <p className="text-xs text-slate-500">{role.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-colors">รับทราบ</button>
                </div>
            </div>
        </div>
    );
};
export default RolePermissionsModal;