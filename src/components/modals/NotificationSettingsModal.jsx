import React, { useState, useEffect } from 'react';
import { X, Bell, Mail, Smartphone, AlertCircle, Loader2, Send } from 'lucide-react';

const NotificationSettingsModal = ({ isOpen, onClose, apiBaseUrl, token, onToast }) => {
    const [settings, setSettings] = useState({ emailReport: true, pushOutbreak: true, lineNotify: false, targetEmails: '' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false); // ✨ State สำหรับปุ่มโหลดตอนเทส

    useEffect(() => {
        if (isOpen) {
            const fetchSettings = async () => {
                setLoading(true);
                try {
                    const res = await fetch(`${apiBaseUrl}/api/settings/notifications`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) setSettings(await res.json());
                } catch (error) {
                    console.error(error);
                } finally { setLoading(false); }
            };
            fetchSettings();
        }
    }, [isOpen, apiBaseUrl, token]);

    const handleSave = async () => {
        if (settings.emailReport && !settings.targetEmails.trim()) {
            return onToast('error', 'กรุณาระบุอีเมลผู้รับ หากต้องการเปิดใช้การแจ้งเตือนผ่านอีเมล');
        }

        try {
            setSaving(true);
            const res = await fetch(`${apiBaseUrl}/api/settings/notifications`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ notificationConfig: settings })
            });
            if (res.ok) {
                onToast('success', 'บันทึกการตั้งค่าการแจ้งเตือนสำเร็จ');
                onClose();
            } else {
                onToast('error', 'บันทึกไม่สำเร็จ');
            }
        } catch (error) {
            onToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally { setSaving(false); }
    };

    // ✨ ฟังก์ชันใหม่ สำหรับกดยิง API ทดสอบ
    const handleTestEmail = async () => {
        if (!settings.targetEmails.trim()) {
            return onToast('error', 'กรุณาระบุอีเมลก่อนทำการทดสอบ');
        }

        try {
            setTestingEmail(true);
            const res = await fetch(`${apiBaseUrl}/api/settings/test-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ emails: settings.targetEmails })
            });
            const data = await res.json();
            
            if (res.ok) {
                onToast('success', data.message);
            } else {
                onToast('error', data.message || 'ส่งทดสอบไม่สำเร็จ');
            }
        } catch (error) {
            onToast('error', 'เกิดข้อผิดพลาด ไม่สามารถเชื่อมต่อกับ Server ได้');
        } finally {
            setTestingEmail(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[6000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">การแจ้งเตือนส่วนตัว</h2>
                            <p className="text-xs text-slate-500">ตั้งค่าช่องทางการรับข้อมูลข่าวสาร</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-5 relative overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600"/></div>
                    )}
                    
                    {/* Item 1: Email */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-sm font-bold text-slate-700">อีเมลสรุปรายงานประจำสัปดาห์</p>
                                    <p className="text-xs text-slate-500">ส่งข้อมูลสรุปสถิติไปยังอีเมลของคุณ</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={settings.emailReport} onChange={() => setSettings(s => ({...s, emailReport: !s.emailReport}))} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        
                        {settings.emailReport && (
                            // ✨ เพิ่มปุ่มทดสอบส่งตรงนี้
                            <div className="flex gap-2 pl-8 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex-1">
                                    <input 
                                        type="text" 
                                        placeholder="ระบุอีเมล (คั่นด้วยลูกน้ำ ,)" 
                                        value={settings.targetEmails || ''} 
                                        onChange={(e) => setSettings(s => ({...s, targetEmails: e.target.value}))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">ตัวอย่าง: admin@mail.com</p>
                                </div>
                                <button 
                                    onClick={handleTestEmail}
                                    disabled={testingEmail || !settings.targetEmails}
                                    className="px-3 py-2 h-[38px] bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                                >
                                    {testingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5"/>}
                                    ทดสอบ
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-slate-100 my-2"></div>

                    {/* Item 2 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-400" />
                            <div>
                                <p className="text-sm font-bold text-slate-700">แจ้งเตือนโรคระบาดด่วน</p>
                                <p className="text-xs text-slate-500">แจ้งทันทีเมื่อมีการลงจุดเสี่ยงใหม่ในระบบ</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.pushOutbreak} onChange={() => setSettings(s => ({...s, pushOutbreak: !s.pushOutbreak}))} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                    </div>

                    <div className="h-px bg-slate-100 my-2"></div>

                    {/* Item 3 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-green-500" />
                            <div>
                                <p className="text-sm font-bold text-slate-700">Line Notify (เร็วๆ นี้)</p>
                                <p className="text-xs text-slate-500">แจ้งเตือนประวัติการแก้ไขข้อมูลต่างๆ</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                            <input type="checkbox" className="sr-only peer" disabled checked={settings.lineNotify} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                    <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
                        {saving && <Loader2 className="w-4 h-4 animate-spin"/>} บันทึกการตั้งค่า
                    </button>
                </div>
            </div>
        </div>
    );
};
export default NotificationSettingsModal;