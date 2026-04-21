// src/components/modals/PasswordConfirmModal.tsx
import React, { useState } from 'react';
import { X, Trash2, Key, Loader2 } from 'lucide-react';

// กำหนด Type สำหรับ Props
interface PasswordConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => Promise<void> | void; // รองรับทั้งฟังก์ชันที่เป็น async และ sync
    title: string;
    message: string | React.ReactNode; // เผื่อกรณีที่ส่งข้อความมาเป็น Element HTML
}

const PasswordConfirmModal: React.FC<PasswordConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message 
}) => {
    const [password, setPassword] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    if (!isOpen) return null;

    // กำหนด Type ให้ Event ของ Form
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        await onConfirm(password);
        setIsLoading(false);
        setPassword("");
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 sm:p-6 transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
                
                {/* ปุ่มปิด (X) มุมขวาบน */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* ส่วนหัวและรายละเอียด */}
                <div className="pt-8 px-6 pb-4 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50/50">
                        <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* ส่วนฟอร์ม */}
                <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            รหัสผ่าน Superadmin
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Key className="h-5 w-5 text-slate-400" />
                            </div>
                            <input 
                                type="password" 
                                className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all sm:text-sm"
                                placeholder="กรอกรหัสผ่านของคุณเพื่อยืนยัน" 
                                value={password} 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
                                required 
                                autoFocus 
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="flex-1 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-slate-900 font-semibold transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading || !password.trim()} 
                            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>กำลังตรวจสอบ...</span>
                                </>
                            ) : (
                                <span>ยืนยันการลบ</span>
                            )}
                        </button>
                    </div>
                </form>
                
            </div>
        </div>
    );
};

export default PasswordConfirmModal;