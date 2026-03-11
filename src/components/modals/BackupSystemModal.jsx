import React from 'react';
import { Database, X, Download, Upload, AlertCircle } from 'lucide-react';

const BackupSystemModal = ({ isOpen, onClose, onRestoreSuccess, token, apiBaseUrl }) => {
    if (!isOpen) return null;
    const TARGET_URL = apiBaseUrl || 'http://localhost:5000';

    const handleDownloadBackup = async () => {
        try {
            const response = await fetch(`${TARGET_URL}/api/system/backup`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Backup failed');
            const data = await response.json();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `VET_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            onClose();
        } catch (error) {
            alert("❌ เกิดข้อผิดพลาดในการสำรองข้อมูล (ตรวจสอบสิทธิ์ Admin)");
            console.error(error);
        }
    };

    const handleRestoreBackup = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (!window.confirm("⚠️ คำเตือน: การกู้คืนข้อมูลจะ 'ลบข้อมูลปัจจุบันทั้งหมด' และแทนที่ด้วยไฟล์ Backup\n\nคุณแน่ใจหรือไม่?")) return;
                const response = await fetch(`${TARGET_URL}/api/system/restore`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: event.target.result 
                });
                const result = await response.json();
                if (response.ok) {
                    alert(`✅ กู้คืนข้อมูลสำเร็จ!\n- รายงาน: ${result.reportCount} รายการ\n- จุดระบาด: ${result.outbreakCount} รายการ`);
                    onRestoreSuccess(); 
                    onClose();
                } else {
                    alert("❌ กู้คืนข้อมูลล้มเหลว: " + result.message);
                }
            } catch (error) {
                alert("❌ ไฟล์ Backup ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึง");
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Database className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">จัดการข้อมูลระบบ</h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 bg-slate-50/50">
                    
                    {/* Backup Section */}
                    <button 
                        onClick={handleDownloadBackup} 
                        className="w-full group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 transition-all hover:shadow-md hover:border-indigo-300 hover:ring-2 hover:ring-indigo-50 text-left flex items-start gap-4"
                    >
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Download className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-base mb-1 group-hover:text-indigo-600 transition-colors">
                                สำรองข้อมูล (Backup)
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                ดาวน์โหลดข้อมูลทั้งหมดของระบบเก็บไว้ในไฟล์ .json เพื่อความปลอดภัย
                            </p>
                        </div>
                    </button>

                    <div className="relative flex items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400">หรือ</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    {/* Restore Section */}
                    <div className="relative w-full group">
                        <div className="w-full rounded-2xl bg-rose-50/50 border-2 border-dashed border-rose-200 p-5 transition-all group-hover:bg-rose-50 group-hover:border-rose-400 flex items-start gap-4 cursor-pointer">
                            <div className="p-3 bg-white shadow-sm text-rose-500 rounded-xl group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-rose-700 text-base mb-1">
                                    กู้คืนข้อมูล (Restore)
                                </h4>
                                <p className="text-xs text-rose-600/70 mb-2 leading-relaxed">
                                    อัปโหลดไฟล์ Backup เพื่อกู้คืนข้อมูล
                                </p>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-100/70 text-rose-700 text-[10px] font-bold">
                                    <AlertCircle className="w-3 h-3" /> ข้อมูลปัจจุบันจะถูกแทนที่ทั้งหมด
                                </div>
                            </div>
                        </div>
                        {/* Hidden Input File */}
                        <input 
                            type="file" 
                            accept=".json" 
                            onChange={handleRestoreBackup} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            title="คลิกเพื่ออัปโหลดไฟล์ .json"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BackupSystemModal;