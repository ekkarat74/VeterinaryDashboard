import React, { useState, useEffect } from 'react';
import { 
  Users, X, Link, Share2, Trash2, List, 
  Calendar, Clock, AlignLeft, QrCode, ExternalLink, ChevronRight, Maximize2
} from 'lucide-react';

// --- Components ย่อยเพื่อความสวยงาม ---
const InputGroup = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5" />} {label}
    </label>
    {children}
  </div>
);

export const MeetingModal = ({ isOpen, onClose, onSave, onDelete, initialData, onToast }) => {
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        link: '',
        details: ''
    });
    const [isQrZoomed, setIsQrZoomed] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    title: initialData.title || '',
                    date: initialData.date || '',
                    startTime: initialData.startTime || '',
                    endTime: initialData.endTime || '',
                    link: initialData.link || '',
                    details: initialData.details || ''
                });
            } else {
                setFormData({
                    title: '',
                    date: new Date().toISOString().split('T')[0],
                    startTime: '09:00',
                    endTime: '10:00',
                    link: '',
                    details: ''
                });
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const qrCodeUrl = formData.link 
        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(formData.link)}` 
        : null;

    const handleSendLine = () => {
        if (!formData.title || !formData.link) {
            alert('กรุณาระบุหัวข้อและลิงก์การประชุม');
            return;
        }
        const message = `📢 *นัดหมายการประชุม*
📌 หัวข้อ: ${formData.title}
📅 วันที่: ${new Date(formData.date).toLocaleDateString('th-TH')}
⏰ เวลา: ${formData.startTime} - ${formData.endTime} น.
📝 รายละเอียด: ${formData.details || '-'}
--------------------------------
🔗 ลิงก์เข้าร่วม: ${formData.link}
📱 QR Code (รูป): ${qrCodeUrl}
`;
        const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
        window.open(lineUrl, '_blank');
        if (onToast) onToast('success', 'เปิด Line เพื่อส่งข้อมูลแล้ว');
    };

    const handleSubmit = () => {
        if (!formData.title || !formData.date) {
            alert("กรุณากรอกข้อมูลสำคัญให้ครบ");
            return;
        }
        onSave({ ...formData, _id: initialData?._id });
        onClose();
    };

    // Style classes
    const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400";

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                <Users className="w-5 h-5" />
                            </span>
                            {initialData ? 'แก้ไขนัดหมาย' : 'สร้างนัดหมายใหม่'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 pl-11">กรอกรายละเอียดการประชุมด้านล่าง</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                    
                    <InputGroup label="หัวข้อการประชุม">
                        <input type="text" className={`${inputClass} font-medium`}
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
                            placeholder="เช่น Daily Standup, ประชุมวางแผน..." autoFocus />
                    </InputGroup>

                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="วันที่" icon={Calendar}>
                            <input type="date" className={inputClass}
                                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </InputGroup>
                        <div className="flex gap-2">
                             <div className="flex-1">
                                <InputGroup label="เริ่ม" icon={Clock}>
                                    <input type="time" className={`${inputClass} text-center`}
                                        value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                                </InputGroup>
                             </div>
                             <div className="flex-1">
                                <InputGroup label="ถึง" icon={Clock}>
                                    <input type="time" className={`${inputClass} text-center`}
                                        value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                                </InputGroup>
                             </div>
                        </div>
                    </div>

                    <InputGroup label="ลิงก์การประชุม (URL)" icon={Link}>
                        <div className="relative">
                            <input type="url" className={`${inputClass} pl-10 text-blue-600 font-mono text-xs`}
                                value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} 
                                placeholder="https://meet.google.com/..." />
                            <Link className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        </div>
                    </InputGroup>

                    {formData.link && (
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 flex items-center gap-4 group">
                            {/* กรอบรูป QR Code คลิกได้ */}
                            <div 
                                className="bg-white p-1.5 rounded-lg shadow-sm border border-indigo-100 shrink-0 cursor-pointer relative overflow-hidden group/qr"
                                onClick={() => setIsQrZoomed(true)}
                                title="คลิกเพื่อขยาย"
                            >
                                <img src={qrCodeUrl} alt="Meeting QR" className="w-16 h-16 object-contain" />
                                
                                {/* Overlay ไอคอนขยายเมื่อ Hover */}
                                <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center opacity-0 group-hover/qr:opacity-100 transition-opacity">
                                    <Maximize2 className="w-5 h-5 text-indigo-600 drop-shadow-sm bg-white/80 rounded p-0.5" />
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                                    <QrCode className="w-4 h-4" /> QR Code พร้อมใช้งาน
                                </h4>
                                <p className="text-xs text-indigo-600/80 mt-1">
                                    แตะที่รูปเพื่อขยายใหญ่ หรือส่งให้ผู้เข้าร่วม
                                </p>
                            </div>
                        </div>
                    )}

                    <InputGroup label="รายละเอียดเพิ่มเติม" icon={AlignLeft}>
                        <textarea rows="3" className={`${inputClass} resize-none`}
                            value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}
                            placeholder="วาระการประชุม, หมายเหตุ..."></textarea>
                    </InputGroup>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
                    <button onClick={handleSendLine} className="w-full py-2.5 bg-[#06C755] hover:bg-[#05b64d] text-white rounded-xl font-bold shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                        <Share2 className="w-5 h-5" /> ส่งบัตรเชิญเข้า LINE
                    </button>
                    
                    <div className="flex gap-3">
                        {initialData && onDelete && (
                            <button onClick={() => { if(window.confirm('ยืนยันลบนัดหมายนี้?')) { onDelete(initialData._id); onClose(); } }} 
                                className="px-4 py-2 bg-white text-red-500 border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-xl font-medium text-sm transition-colors flex items-center gap-2">
                                <Trash2 className="w-4 h-4" /> ลบ
                            </button>
                        )}
                        <div className="flex-1 flex gap-3 justify-end">
                            <button onClick={onClose} className="px-6 py-2 text-slate-600 hover:bg-slate-200/50 rounded-xl font-semibold text-sm transition-colors">
                                ยกเลิก
                            </button>
                            <button onClick={handleSubmit} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-200 hover:shadow-lg transition-all active:scale-[0.98]">
                                {initialData ? 'บันทึกการแก้ไข' : 'สร้างนัดหมาย'}
                            </button>
                        </div>
                    </div>
                </div>
                {isQrZoomed && (
                <div 
                    className="fixed inset-0 z-[3100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setIsQrZoomed(false)}
                >
                    <div 
                        className="bg-white p-6 rounded-3xl shadow-2xl relative animate-in zoom-in-95 flex flex-col items-center gap-4 max-w-sm w-full mx-4"
                        onClick={e => e.stopPropagation()} // ป้องกันคลิกในกล่องแล้วปิด
                    >
                        <button 
                            onClick={() => setIsQrZoomed(false)} 
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center w-full mt-2">
                            <h3 className="font-bold text-slate-800 text-lg">สแกนเพื่อเข้าร่วม</h3>
                            <p className="text-sm text-slate-500 truncate px-4">{formData.title}</p>
                        </div>

                        <div className="p-2 border-2 border-dashed border-slate-200 rounded-xl">
                            <img src={qrCodeUrl} alt="Large QR" className="w-64 h-64 object-contain" />
                        </div>

                        <button 
                            onClick={() => setIsQrZoomed(false)}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-sm transition-colors"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export const MeetingListModal = ({ isOpen, onClose, meetings, onEdit }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2950] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] ring-1 ring-black/5 animate-in slide-in-from-bottom-4 duration-300">
                
                {/* Header */}
                <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                         <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <List className="w-6 h-6 text-indigo-500" /> 
                            ประวัติการประชุม
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">รายการนัดหมายทั้งหมด {meetings.length} รายการ</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-auto bg-slate-50/50 custom-scrollbar p-6">
                    {meetings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                            <Calendar className="w-12 h-12 mb-3 text-slate-300" />
                            <p className="font-medium">ไม่พบข้อมูลการประชุม</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="p-4 w-32">วันที่</th>
                                        <th className="p-4 w-32">เวลา</th>
                                        <th className="p-4">หัวข้อประชุม</th>
                                        <th className="p-4 w-40">ช่องทาง</th>
                                        <th className="p-4 w-20 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {meetings.map((m) => (
                                        <tr key={m._id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="p-4 align-top">
                                                <div className="font-mono text-slate-600 font-medium bg-slate-100 inline-block px-2 py-1 rounded-md text-xs">
                                                    {new Date(m.date).toLocaleDateString('th-TH')}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="text-slate-600 flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    {m.startTime} - {m.endTime}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="font-bold text-slate-800 text-base mb-1 group-hover:text-indigo-600 transition-colors">{m.title}</div>
                                                {m.details && (
                                                    <div className="text-xs text-slate-500 line-clamp-1">{m.details}</div>
                                                )}
                                            </td>
                                            <td className="p-4 align-top">
                                                {m.link ? (
                                                    <a href={m.link} target="_blank" rel="noreferrer" 
                                                       className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors border border-blue-100">
                                                        <ExternalLink className="w-3 h-3" /> Link Meet
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <button onClick={() => onEdit(m)} 
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};