import React, { useState } from 'react';
import { Key, CheckCircle } from 'lucide-react';

const ChangePasswordModal = ({ isOpen, onClose, apiBaseUrl, token, onToast }) => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            onToast('error', "รหัสผ่านใหม่ไม่ตรงกัน");
            return;
        }
        if (newPassword.length < 4) {
            onToast('error', "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${apiBaseUrl}/api/change-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await res.json();

            if (res.ok) {
                onToast('success', 'เปลี่ยนรหัสผ่านสำเร็จ');
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                onClose();
            } else {
                onToast('error', data.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
            }
        } catch (error) {
            onToast('error', "เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <Key className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h2>
                        <p className="text-xs text-slate-500">เพื่อความปลอดภัยของบัญชี</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">รหัสผ่านเดิม</label>
                        <input type="password" required className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                            placeholder="••••••"
                            value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">รหัสผ่านใหม่</label>
                        <input type="password" required className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                            placeholder="กำหนดรหัสผ่านใหม่"
                            value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
                        <input type="password" required className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                            placeholder="พิมพ์รหัสใหม่อีกครั้ง"
                            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-sm transition-colors">ยกเลิก</button>
                        <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                            {isLoading ? 'กำลังบันทึก...' : <><CheckCircle className="w-4 h-4"/> ยืนยัน</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;