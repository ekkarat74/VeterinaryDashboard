import React, { useState } from 'react';
import { 
    X, 
    FileSpreadsheet, 
    UploadCloud, 
    Download, 
    Filter, 
    FileText, 
    Table 
} from 'lucide-react';

// กำหนด Interface สำหรับข้อมูลที่จะถูกส่งออกไปตอน Export (เพิ่ม format)
export interface ExportFilters {
    year: string;
    month: string;
    unit: string;
    district: string;
    format: 'csv' | 'excel';
}

// กำหนด Interface สำหรับ Props ของ Component นี้
export interface CsvActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExport: (filters: ExportFilters) => void;
    availableYears?: string[]; 
    thaiMonths?: string[];
    units?: string[];
    districts?: string[];
    csvMode?: string; 
}

const CsvActionModal: React.FC<CsvActionModalProps> = ({ 
    isOpen, 
    onClose, 
    onFileChange, 
    onExport, 
    availableYears = [], 
    thaiMonths = [], 
    units = [], 
    districts = [], 
    csvMode 
}) => {
    // State สำหรับตัวกรองต่างๆ
    const [exportYear, setExportYear] = useState<string>('ทั้งหมด');
    const [exportMonth, setExportMonth] = useState<string>('ทั้งหมด');
    const [exportUnit, setExportUnit] = useState<string>('ทั้งหมด');
    const [exportDistrict, setExportDistrict] = useState<string>('ทั้งหมด');
    
    // State ใหม่สำหรับเก็บรูปแบบไฟล์
    const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');

    if (!isOpen) return null;

    const handleExportClick = (): void => {
        onExport({ 
            year: exportYear, 
            month: exportMonth, 
            unit: exportUnit, 
            district: exportDistrict,
            format: exportFormat // ส่งรูปแบบไฟล์กลับไปให้ฟังก์ชันแม่
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[90vh]">
                
                {/* --- Header --- */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 text-center relative shrink-0">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <div className="relative w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 rotate-3 hover:rotate-0 transition-transform duration-300">
                        <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800">จัดการข้อมูล</h3>
                    <p className="text-sm text-slate-500 mt-1">นำเข้าหรือส่งออกข้อมูลเพื่อใช้งานในระบบ</p>
                </div>
                
                {/* --- Content Actions --- */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    {/* ปุ่ม Import (Dropzone) */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-0 group-hover:opacity-15 transition duration-300"></div>
                        
                        <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 group-hover:border-blue-400 bg-white group-hover:bg-blue-50/50 rounded-2xl transition-all cursor-pointer">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-slate-700 group-hover:text-blue-700">นำเข้าไฟล์ (Import)</h4>
                            <p className="text-xs text-slate-500 mt-1 text-center">อัปโหลดไฟล์ .csv จากเครื่องของคุณ</p>
                            
                            <input 
                                type="file" 
                                accept=".csv" 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { onFileChange(e); onClose(); }} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                title="คลิกเพื่อเลือกไฟล์ CSV" 
                            />
                        </div>
                    </div>
                    
                    <div className="relative flex items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400 uppercase tracking-wider">หรือ</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>
                    
                    {/* ส่วนของการ Export */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm mb-1">
                            <Filter className="w-4 h-4 text-emerald-500" />
                            <span>ตัวเลือกข้อมูลก่อนส่งออก</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">ปี (Year)</label>
                                <select 
                                    value={exportYear} 
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExportYear(e.target.value)} 
                                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white cursor-pointer"
                                >
                                    <option value="ทั้งหมด">ทั้งหมด</option>
                                    {availableYears?.map(y => (
                                        <option key={y} value={y}>
                                            {parseInt(y) + 543}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">เดือน (Month)</label>
                                <select 
                                    value={exportMonth} 
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExportMonth(e.target.value)} 
                                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white cursor-pointer"
                                >
                                    <option value="ทั้งหมด">ทั้งหมด</option>
                                    {thaiMonths?.map((m, i) => (
                                        <option key={i} value={String(i + 1).padStart(2, '0')}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {csvMode !== 'outbreak' && (
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">หน่วยงาน (Unit)</label>
                                    <select 
                                        value={exportUnit} 
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExportUnit(e.target.value)} 
                                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white cursor-pointer"
                                    >
                                        <option value="ทั้งหมด">ทั้งหมด</option>
                                        {units?.map((u, i) => (
                                            <option key={i} value={u}>
                                                {u}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">เขต (District)</label>
                                <select 
                                    value={exportDistrict} 
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExportDistrict(e.target.value)} 
                                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white cursor-pointer"
                                >
                                    <option value="ทั้งหมด">ทั้งหมด</option>
                                    {districts?.map((d, i) => (
                                        <option key={i} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 🟢 ส่วนที่เพิ่มใหม่: ตัวเลือก Format */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <label className="block text-[10px] font-bold text-slate-500 mb-2">รูปแบบไฟล์ (Format)</label>
                            <div className="flex gap-3">
                                <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-all ${exportFormat === 'csv' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                    <input 
                                        type="radio" 
                                        value="csv" 
                                        checked={exportFormat === 'csv'} 
                                        onChange={() => setExportFormat('csv')} 
                                        className="hidden" 
                                    />
                                    <FileText className="w-4 h-4" /> CSV
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-all ${exportFormat === 'excel' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                    <input 
                                        type="radio" 
                                        value="excel" 
                                        checked={exportFormat === 'excel'} 
                                        onChange={() => setExportFormat('excel')} 
                                        className="hidden" 
                                    />
                                    <Table className="w-4 h-4" /> Excel
                                </label>
                            </div>
                        </div>

                        {/* ปุ่ม Export */}
                        <button 
                            onClick={handleExportClick} 
                            className="w-full flex items-center justify-between p-3 mt-2 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white rounded-xl transition-all duration-300 group border border-emerald-100 hover:border-emerald-500 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/60 group-hover:bg-black/10 rounded-lg flex items-center justify-center transition-colors">
                                    <Download className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-sm">ส่งออกไฟล์ (Export)</h4>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CsvActionModal;