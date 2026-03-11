import React from 'react';
import { X, FileSpreadsheet, UploadCloud, Download } from 'lucide-react';

const CsvActionModal = ({ isOpen, onClose, onFileChange, onExport }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 border border-slate-100">
                
                {/* --- ส่วน Header --- */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 text-center relative overflow-hidden">
                    {/* ปุ่มปิด */}
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    {/* ไอคอนหลัก */}
                    <div className="relative w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 rotate-3 hover:rotate-0 transition-transform duration-300">
                        <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800">จัดการข้อมูล CSV</h3>
                    <p className="text-sm text-slate-500 mt-1">นำเข้าหรือส่งออกข้อมูลเพื่อใช้งานในระบบ</p>
                </div>
                
                {/* --- ส่วน Content Actions --- */}
                <div className="p-6 space-y-6">
                    
                    {/* ปุ่ม Import (ทำเป็นกล่องคล้าย Dropzone) */}
                    <div className="relative group">
                        {/* Glow effect ด้านหลัง (แสดงตอน Hover) */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-0 group-hover:opacity-15 transition duration-300"></div>
                        
                        <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 group-hover:border-blue-400 bg-white group-hover:bg-blue-50/50 rounded-2xl transition-all cursor-pointer">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-slate-700 group-hover:text-blue-700">นำเข้าไฟล์ (Import)</h4>
                            <p className="text-xs text-slate-500 mt-1">อัปโหลดไฟล์ .csv จากเครื่องของคุณ</p>
                            
                            {/* Input ซ่อนไว้ทับตัวกล่อง */}
                            <input 
                                type="file" 
                                accept=".csv" 
                                onChange={(e) => { onFileChange(e); onClose(); }} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                title="คลิกเพื่อเลือกไฟล์ CSV" 
                            />
                        </div>
                    </div>
                    
                    {/* เส้นคั่น */}
                    <div className="relative flex items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400 uppercase tracking-wider">หรือ</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>
                    
                    {/* ปุ่ม Export */}
                    <button 
                        onClick={() => { onExport(); onClose(); }} 
                        className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white rounded-2xl transition-all duration-300 group border border-emerald-100 hover:border-emerald-500 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/60 group-hover:bg-black/10 rounded-xl flex items-center justify-center transition-colors">
                                <Download className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-sm">ส่งออกไฟล์ (Export)</h4>
                                <p className="text-xs opacity-80 mt-0.5">ดาวน์โหลดข้อมูลปัจจุบันเป็น .csv</p>
                            </div>
                        </div>
                    </button>
                    
                </div>
            </div>
        </div>
    );
};

export default CsvActionModal;