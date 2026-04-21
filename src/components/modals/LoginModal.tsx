// src/components/modals/LoginModal.tsx
import React, { useState } from 'react';
import { Lock, User, KeyRound, ChevronRight, X, Loader2, ShieldCheck } from 'lucide-react';

// กำหนด Type สำหรับ Props
interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    // onLogin สามารถเปลี่ยนจาก any เป็น Interface ของข้อมูล User ที่ Backend ส่งกลับมาได้ครับ
    onLogin: (data: any) => void; 
    apiBaseUrl: string;
    // กำหนด Type ให้ onToast (ทำให้เป็น Optional เผื่อไม่ได้ส่งค่ามา)
    onToast?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, apiBaseUrl, onToast }) => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    if (!isOpen) return null;

    // ระบุ Type ให้กับ Form Event
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const res = await fetch(`${apiBaseUrl}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                onLogin(data);
                if (onToast) onToast('success', 'เข้าสู่ระบบสำเร็จ');
                onClose();
            } else {
                if (onToast) onToast('error', data.message || 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง');
            }
        } catch (error) {
            if (onToast) onToast('error', `ไม่สามารถเชื่อมต่อ Server ได้`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative overflow-hidden border border-white/50">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors z-20"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Abstract Background Decoration (Medical/Clean Theme) */}
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-teal-100 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-100 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
                
                <div className="text-center mb-10 relative z-10 mt-4">
                    <div className="w-20 h-20 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-teal-500/20 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">ยินดีต้อนรับ</h2>
                    <p className="text-slate-500 mt-2 font-medium">เข้าสู่ระบบรายงานสัตวแพทย์</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">ชื่อผู้ใช้งาน</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                            <input 
                                className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400" 
                                placeholder="กรอกชื่อผู้ใช้งาน..." 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">รหัสผ่าน</label>
                        <div className="relative group">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                            <input 
                                className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400" 
                                type="password" 
                                placeholder="กรอกรหัสผ่าน..." 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="pt-6">
                        <button 
                            type="submit" 
                            disabled={isLoading || !username || !password}
                            className="w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-lg shadow-teal-600/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>กำลังเข้าสู่ระบบ...</span>
                                </>
                            ) : (
                                <>
                                    <span>เข้าสู่ระบบ</span> 
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;