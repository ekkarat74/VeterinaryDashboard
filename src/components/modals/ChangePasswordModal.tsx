import React, { useState } from 'react';
import { KeyRound, CheckCircle, Shield, Lock, X, Loader2 } from 'lucide-react';

const ChangePasswordModal = ({ isOpen, onClose, apiBaseUrl, token, onToast }) => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            if(onToast) onToast('error', "รหัสผ่านใหม่ไม่ตรงกัน");
            return;
        }
        if (newPassword.length < 4) {
            if(onToast) onToast('error', "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร");
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
                if(onToast) onToast('success', 'เปลี่ยนรหัสผ่านสำเร็จ');
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                onClose();
            } else {
                if(onToast) onToast('error', data.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
            }
        } catch (error) {
            if(onToast) onToast('error', "เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = oldPassword && newPassword && confirmPassword;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl relative overflow-hidden border border-white/50">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors z-20"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Section */}
                <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-teal-100 rounded-full blur-3xl opacity-50"></div>
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-teal-100 relative z-10 text-teal-600">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h2>
                        <p className="text-sm text-slate-500 mt-0.5">เพื่อความปลอดภัยของบัญชีผู้ใช้</p>
                    </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    
                    {/* Old Password */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">รหัสผ่านเดิม</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                            <input 
                                type="password" 
                                required 
                                disabled={isLoading}
                                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400" 
                                placeholder="••••••••"
                                value={oldPassword} 
                                onChange={e => setOldPassword(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="h-px w-full bg-slate-100 my-2"></div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">รหัสผ่านใหม่</label>
                        <div className="relative group">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                            <input 
                                type="password" 
                                required 
                                disabled={isLoading}
                                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400" 
                                placeholder="กำหนดรหัสผ่านใหม่"
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">ยืนยันรหัสผ่านใหม่</label>
                        <div className="relative group">
                            <CheckCircle className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${confirmPassword && newPassword === confirmPassword ? 'text-teal-500' : 'text-slate-400 group-focus-within:text-teal-600'}`} />
                            <input 
                                type="password" 
                                required 
                                disabled={isLoading}
                                className={`w-full pl-12 pr-4 py-3 border rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400
                                    ${confirmPassword && newPassword !== confirmPassword 
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' 
                                        : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/10'
                                    }`} 
                                placeholder="พิมพ์รหัสใหม่อีกครั้ง"
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)} 
                            />
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-500 ml-1 mt-1 font-medium">รหัสผ่านไม่ตรงกัน</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isLoading}
                            className="flex-1 py-3.5 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold transition-colors disabled:opacity-50"
                        >
                            ยกเลิก
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading || !isFormValid || (newPassword !== confirmPassword)} 
                            className="flex-[1.5] py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold shadow-lg shadow-teal-600/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:bg-slate-300 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin"/> 
                                    <span>กำลังบันทึก...</span>
                                </>
                            ) : (
                                <>
                                    <Shield className="w-5 h-5"/> 
                                    <span>ยืนยันการเปลี่ยน</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;