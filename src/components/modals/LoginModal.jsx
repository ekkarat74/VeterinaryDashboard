import React, { useState } from 'react';
import { Lock, Users, Key, ChevronRight, X } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onLogin, apiBaseUrl, onToast }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiBaseUrl}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                onLogin(data);
                if(onToast) onToast('success', 'เข้าสู่ระบบสำเร็จ');
                onClose();
            } else {
                if(onToast) onToast('error', data.message || 'เข้าสู่ระบบไม่สำเร็จ');
            }
        } catch (error) {
            if(onToast) onToast('error', `Login Failed: ไม่สามารถเชื่อมต่อ Server ได้`);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative overflow-hidden border border-white/20">
                {/* Background Decoration */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                
                <div className="text-center mb-8 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 transform -rotate-3">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">เข้าสู่ระบบ</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">ระบบรายงานสัตวแพทย์</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 ml-1">ชื่อผู้ใช้งาน</label>
                        <div className="relative group">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400" 
                                placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 ml-1">รหัสผ่าน</label>
                        <div className="relative group">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400" 
                                type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xl shadow-slate-200 hover:shadow-2xl transition-all flex items-center justify-center gap-2 transform active:scale-95">
                            <span>เข้าสู่ระบบ</span> <ChevronRight className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={onClose} className="w-full mt-3 py-2 text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors">
                            ยกเลิก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;