import React, { useState } from 'react';
import { X, Bell, Mail, Smartphone, AlertCircle } from 'lucide-react';

const NotificationSettingsModal = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState({
        emailReport: true,
        pushOutbreak: true,
        lineNotify: false
    });

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
                            <h2 className="text-lg font-bold text-slate-800">การแจ้งเตือนระบบ</h2>
                            <p className="text-xs text-slate-500">ตั้งค่าช่องทางการรับข้อมูลข่าวสาร</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Item 1 */}
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

                    {/* Item 3 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-green-500" />
                            <div>
                                <p className="text-sm font-bold text-slate-700">Line Notify (ส่วนตัว)</p>
                                <p className="text-xs text-slate-500">แจ้งเตือนประวัติการแก้ไขข้อมูลต่างๆ</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.lineNotify} onChange={() => setSettings(s => ({...s, lineNotify: !s.lineNotify}))} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">บันทึกการตั้งค่า</button>
                </div>
            </div>
        </div>
    );
};
export default NotificationSettingsModal;