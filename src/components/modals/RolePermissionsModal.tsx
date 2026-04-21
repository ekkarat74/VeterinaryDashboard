// src/components/modals/RolePermissionsModal.tsx
import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, Save, Loader2, AlertTriangle } from 'lucide-react';

// 1. กำหนด Type สำหรับ Props
interface RolePermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiBaseUrl: string;
    token: string;
    onToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
    userRole: string; // หรือจะระบุเป็น Type แบบเจาะจงก็ได้ เช่น 'Developer' | 'MagaAdmin' | 'SuperAdmin' | 'Admin'
}

// 2. กำหนด Type สำหรับ State ของ Permissions
interface PermissionsState {
    strictHierarchy: boolean;
    allowSuperAdminToClearData: boolean;
}

const RolePermissionsModal: React.FC<RolePermissionsModalProps> = ({ 
    isOpen, 
    onClose, 
    apiBaseUrl, 
    token, 
    onToast, 
    userRole 
}) => {
    // 3. ใส่ Type ให้กับ useState
    const [permissions, setPermissions] = useState<PermissionsState>({ 
        strictHierarchy: true, 
        allowSuperAdminToClearData: false 
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const isAuthorized = userRole === 'Developer' || userRole === 'MagaAdmin';

    useEffect(() => {
        if (isOpen) {
            const fetchPermissions = async () => {
                setLoading(true);
                try {
                    const res = await fetch(`${apiBaseUrl}/api/settings/permissions`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) setPermissions(await res.json());
                } catch (error) {
                    console.error(error);
                } finally { setLoading(false); }
            };
            fetchPermissions();
        }
    }, [isOpen, apiBaseUrl, token]);

    const handleSave = async () => {
        if (!isAuthorized) return onToast('error', 'ไม่มีสิทธิ์บันทึกการตั้งค่าระดับนี้');
        try {
            setSaving(true);
            const res = await fetch(`${apiBaseUrl}/api/settings/permissions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ rolePermissionsConfig: permissions })
            });
            if (res.ok) {
                onToast('success', 'บันทึกสิทธิ์การเข้าถึงเรียบร้อยแล้ว');
                onClose();
            } else {
                onToast('error', 'บันทึกไม่สำเร็จ');
            }
        } catch (error) {
            onToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally { setSaving(false); }
    };

    if (!isOpen) return null;

    const roles = [
        { name: 'Developer', color: 'text-indigo-600 bg-indigo-50', desc: 'ควบคุมระบบสูงสุด แก้ไขโค้ดและฐานข้อมูล' },
        { name: 'MagaAdmin (ผู้บริหาร)', color: 'text-emerald-600 bg-emerald-50', desc: 'เข้าถึงสถิติเชิงลึก จัดการการแสดงผล' },
        { name: 'SuperAdmin', color: 'text-blue-600 bg-blue-50', desc: 'จัดการผู้ใช้งานทั่วไป นำเข้า/ส่งออกข้อมูล' },
        { name: 'Admin', color: 'text-orange-600 bg-orange-50', desc: 'เพิ่ม/ลบ/แก้ไขข้อมูลบริการในระบบ' }
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[6000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">สิทธิ์การเข้าถึงเชิงลึก (Hierarchy)</h2>
                            <p className="text-xs text-slate-500">ลำดับชั้นและกฎของบทบาทในระบบ</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 bg-slate-50/50 flex-1 overflow-y-auto custom-scrollbar relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-800"/></div>
                    )}

                    {/* กฎที่ตั้งค่าได้ */}
                    <div className="mb-6 space-y-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">กฎการเข้าถึงพิเศษ</p>
                        
                        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                            <div>
                                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-indigo-500"/> บังคับใช้ระบบ Hierarchy
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">ป้องกันไม่ให้ตำแหน่งที่ต่ำกว่า (เช่น SuperAdmin) ลบ/แก้ไข หรือรีเซ็ตรหัสผ่านของ Developer และ MagaAdmin</p>
                            </div>
                            <label className={`relative inline-flex items-center ${isAuthorized ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                <input type="checkbox" className="sr-only peer" disabled={!isAuthorized} checked={permissions.strictHierarchy} onChange={() => setPermissions(s => ({...s, strictHierarchy: !s.strictHierarchy}))} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                            <div>
                                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500"/> อนุญาต SuperAdmin ล้างข้อมูล
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">ให้สิทธิ์ SuperAdmin ลบฐานข้อมูลทั้งหมด (อันตราย)</p>
                            </div>
                            <label className={`relative inline-flex items-center ${isAuthorized ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                <input type="checkbox" className="sr-only peer" disabled={!isAuthorized} checked={permissions.allowSuperAdminToClearData} onChange={() => setPermissions(s => ({...s, allowSuperAdminToClearData: !s.allowSuperAdminToClearData}))} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                            </label>
                        </div>
                    </div>

                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">ลำดับขั้นของบทบาทปัจจุบัน</p>
                    <div className="space-y-3">
                        {roles.map((role, idx) => (
                            <div key={idx} className="flex gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden">
                                {idx !== roles.length - 1 && ( <div className="absolute left-6 top-10 w-0.5 h-full bg-slate-200 -z-10"></div> )}
                                <div className="mt-1 relative z-10"><CheckCircle2 className="w-5 h-5 text-emerald-500 bg-white rounded-full" /></div>
                                <div>
                                    <h4 className={`text-sm font-bold px-2 py-0.5 rounded-md inline-block mb-1 ${role.color}`}>{role.name}</h4>
                                    <p className="text-xs text-slate-500">{role.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
                    {!isAuthorized ? (
                        <p className="text-xs font-bold text-rose-500">*อ่านอย่างเดียว (เฉพาะ Developer และ ผู้บริหาร ถึงจะแก้ไขได้)</p>
                    ) : (
                        <p className="text-xs text-slate-500"></p>
                    )}
                    <button onClick={handleSave} disabled={saving || !isAuthorized} className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {saving && <Loader2 className="w-4 h-4 animate-spin"/>} บันทึกการตั้งค่า
                    </button>
                </div>
            </div>
        </div>
    );
};
export default RolePermissionsModal;