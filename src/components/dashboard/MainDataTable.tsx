import React, { useState, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { 
    Database, Users, Pencil, X, MapPin, Calendar, 
    ImageIcon, Syringe, Scissors, QrCode, Stethoscope, FileText, Printer,
    Download, Share2, Filter, History, Clock, Activity, Search, ArrowUpDown
} from 'lucide-react';

import { DataItem } from '../../types'; 
import { formatThaiDate, getDocumentStyle, getDocumentHTML } from '../../utils/reportTemplate';

interface MainDataTableProps {
    data?: DataItem[];
    canEdit?: boolean;
    isSuperAdmin?: boolean;
    onClearAll?: () => void;
    onEdit: (item: DataItem) => void;
    onDelete: (id: string) => void;
    onViewImage: (item: DataItem) => void;
    displayMode?: 'list' | 'table';
}

// Helper สำหรับ Track Changes (Audit Trail)
const renderDiffJSON = (obj: any, compareObj: any, mode: 'before' | 'after', indentLevel = 1): React.ReactNode => {
    if (typeof obj !== 'object' || obj === null) {
        const isDiff = compareObj === undefined || obj !== compareObj;
        const valStr = typeof obj === 'string' ? `"${obj}"` : String(obj);
        if (isDiff) {
            return (
                <span className={`font-bold px-1 rounded ${mode === 'before' ? 'bg-rose-500/40 text-rose-100' : 'bg-emerald-500/40 text-emerald-100'}`}>
                    {valStr}
                </span>
            );
        }
        return <span className={typeof obj === 'string' ? 'text-amber-200' : 'text-sky-300'}>{valStr}</span>;
    }

    const isArray = Array.isArray(obj);
    const keys = Object.keys(obj);
    const indent = "  ".repeat(indentLevel);
    const closeIndent = "  ".repeat(indentLevel - 1);

    return (
        <span>
            <span className="text-slate-400">{isArray ? '[' : '{'}</span>
            <br />
            {keys.map((key, index) => {
                const val = obj[key];
                const compVal = compareObj && typeof compareObj === 'object' ? compareObj[key] : undefined;
                const isMissingInComp = compVal === undefined;
                const keyClass = isMissingInComp 
                    ? `font-bold px-1 rounded ${mode === 'before' ? 'bg-rose-500/40 text-rose-100' : 'bg-emerald-500/40 text-emerald-100'}`
                    : "text-slate-300";

                return (
                    <span key={key}>
                        {indent}
                        {!isArray && <span className={keyClass}>"{key}"</span>}
                        {!isArray && <span className="text-slate-400">{": "}</span>}
                        {renderDiffJSON(val, compVal, mode, indentLevel + 1)}
                        {index < keys.length - 1 && <span className="text-slate-400">{","}</span>}
                        <br />
                    </span>
                );
            })}
            {closeIndent}
            <span className="text-slate-400">{isArray ? ']' : '}'}</span>
        </span>
    );
};

const MainDataTable: React.FC<MainDataTableProps> = ({ 
    data: incomingData, 
    canEdit = false,
    onEdit, 
    onDelete, 
    onViewImage,
    displayMode = 'table'
}) => {
    const baseData = incomingData || [];
    
    // --- States ---
    const [coordinateFilter, setCoordinateFilter] = useState<'all' | 'with' | 'without'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
    
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [recordLogs, setRecordLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<DataItem | null>(null);

    const itemsPerPage = 25;

    // --- Performance Optimization (Memoization) ---
    const processedData = useMemo(() => {
        let result = baseData.filter(item => {
            // 1. Coordinate Filter
            if (coordinateFilter !== 'all') {
                const hasCoords = item.lat && item.long && parseFloat(item.lat.toString()) !== 0 && parseFloat(item.long.toString()) !== 0;
                if (coordinateFilter === 'with' && !hasCoords) return false;
                if (coordinateFilter === 'without' && hasCoords) return false;
            }
            
            // 2. Search Filter
            if (searchTerm.trim() !== '') {
                const term = searchTerm.toLowerCase();
                const matchLoc = item.location?.toLowerCase().includes(term);
                const matchSubDist = item.subdistrict?.toLowerCase().includes(term);
                const matchDist = item.district?.toLowerCase().includes(term);
                const matchUnit = item.unit?.toLowerCase().includes(term);
                if (!matchLoc && !matchSubDist && !matchDist && !matchUnit) return false;
            }
            
            return true;
        });

        // 3. Sorting
        result.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [baseData, coordinateFilter, searchTerm, sortOrder]);

    const totals = useMemo(() => {
        return processedData.reduce((acc, item) => ({
            vaccine: acc.vaccine + (Number(item.stats?.vaccine) || 0),
            sterilize: acc.sterilize + (Number(item.stats?.sterilize) || 0),
            register: acc.register + (Number(item.stats?.register) || 0),
            microchip: acc.microchip + (Number(item.stats?.microchip) || 0),
            medical: acc.medical + (Number(item.stats?.medical) || 0),
        }), { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 });
    }, [processedData]);

    // --- Pagination Calculation ---
    const totalPages = Math.ceil(processedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = processedData.slice(startIndex, startIndex + itemsPerPage);

    // Reset page on filter/search change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [coordinateFilter, searchTerm, sortOrder]);

    // --- Handlers ---
    const handleViewHistory = async (item: DataItem) => {
        setSelectedRecordData(item);
        setHistoryModalOpen(true);
        setIsLoadingLogs(true);
        try {
            const token = JSON.parse(localStorage.getItem('vet_user') || '{}').token;
            const res = await fetch(`https://veterinarydashboard-hwho.onrender.com/api/logs/record/${item._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRecordLogs(data);
            }
        } catch (error) {
            console.error("Fetch history error", error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const formatNumber = (num?: number | string | null): string => 
        num ? Number(num).toLocaleString() : '0';

    const recordHasImage = (item: DataItem): boolean => Boolean(item.imageUrl || item.hasImage);

    const getPageNumbers = (): (number | string)[] => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (currentPage <= 3) return [1, 2, 3, 4, 5, '...', totalPages];
        if (currentPage >= totalPages - 2) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    // --- Document Generation Handlers ---
    const handlePrint = (item: DataItem) => {
        const printContent = `
            <!DOCTYPE html>
            <html lang="th">
            <head>
                <meta charset="UTF-8">
                <title>พิมพ์เอกสารสรุปผล - ${item.location || 'ไม่ระบุสถานที่'}</title>
                <style>${getDocumentStyle()}</style>
            </head>
            <body>${getDocumentHTML(item)}</body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            setTimeout(() => { printWindow.print(); }, 500);
        }
    };

    const generateImageCanvas = async (item: DataItem) => {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        
        container.innerHTML = `<style>${getDocumentStyle()}</style>${getDocumentHTML(item)}`;
        document.body.appendChild(container);

        const reportDocNode = container.querySelector('.report-doc') as HTMLElement;
        await document.fonts.ready;
        await new Promise(res => setTimeout(res, 500));

        const canvas = await html2canvas(reportDocNode, {
            scale: 2, 
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        document.body.removeChild(container);
        return canvas;
    };

    const handleDownloadWebp = async (item: DataItem) => {
        if (isGeneratingDocument) return;
        setIsGeneratingDocument(true);
        try {
            const canvas = await generateImageCanvas(item);
            const link = document.createElement('a');
            link.download = `รายงาน_${item.location || 'เอกสาร'}.webp`;
            link.href = canvas.toDataURL('image/webp', 0.9);
            link.click();
        } catch (error) {
            console.error('Error generating image:', error);
            alert('เกิดข้อผิดพลาดในการสร้างไฟล์รูปภาพ');
        } finally {
            setIsGeneratingDocument(false);
        }
    };

    const handleShareLine = async (item: DataItem) => {
        if (isGeneratingDocument) return;
        setIsGeneratingDocument(true);
        try {
            const canvas = await generateImageCanvas(item);
            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), 'image/webp', 0.9);
            });

            if (!blob) {
                alert('ไม่สามารถสร้างไฟล์รูปภาพได้');
                return;
            }

            const fileName = `รายงาน_${item.location || 'เอกสาร'}.webp`;
            const file = new File([blob], fileName, { type: 'image/webp' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'รายงานสรุปผล',
                    text: `รายงานสรุปผลการปฏิบัติงาน - ${item.location || ''}`
                });
            } else {
                alert('อุปกรณ์ไม่รองรับการแชร์รูปโดยตรง ระบบจะทำการดาวน์โหลดภาพให้แทน');
                const link = document.createElement('a');
                link.download = fileName;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
            }
        } catch (error: any) {
            console.error('Error sharing file:', error);
            if (error.name !== 'AbortError') {
                alert('เกิดข้อผิดพลาดในการแชร์ หรือเบราว์เซอร์บล็อกการทำงาน');
            }
        } finally {
            setIsGeneratingDocument(false);
        }
    };

    // --- Render Helpers ---
    const renderPagination = (isTop: boolean) => {
        if (processedData.length === 0) return null;
        return (
            <div className={`px-4 md:px-6 py-3 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 ${isTop ? 'border-b border-gray-100' : 'border-t border-gray-100'}`}>
                <span className="text-[11px] text-gray-500 font-medium text-center sm:text-left">
                    แสดงข้อมูล <span className="text-gray-900">{startIndex + 1}</span> ถึง <span className="text-gray-900">{Math.min(startIndex + itemsPerPage, processedData.length)}</span> จาก <span className="text-gray-900">{processedData.length}</span> รายการ
                </span>
                
                {totalPages > 1 && (
                    <div className="flex rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full sm:w-auto justify-center">
                        <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="px-2 md:px-3 py-1.5 bg-white text-[11px] font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-300 transition-colors border-r border-gray-200">
                            First
                        </button>
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 md:px-3 py-1.5 bg-white text-[11px] font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-300 transition-colors border-r border-gray-200">
                            &laquo;
                        </button>
                        
                        {getPageNumbers().map((number, index) => {
                            if (number === '...') {
                                return <span key={`ellipsis-${index}`} className="px-2 md:px-3 py-1.5 bg-gray-50 text-[11px] font-medium text-gray-400 border-r border-gray-200">...</span>;
                            }
                            return (
                                <button key={number} onClick={() => handlePageChange(number as number)} className={`min-w-[32px] md:min-w-[36px] px-2 md:px-3 py-1.5 text-[11px] font-medium transition-colors border-r border-gray-200 ${currentPage === number ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}>
                                    {number}
                                </button>
                            );
                        })}

                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 md:px-3 py-1.5 bg-white text-[11px] font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-300 transition-colors border-r border-gray-200">
                            &raquo;
                        </button>
                        <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="px-2 md:px-3 py-1.5 bg-white text-[11px] font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-300 transition-colors">
                            Last
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-8 overflow-hidden w-full flex flex-col relative">
            
            {/* --- Header & Tools Section --- */}
            <div className="px-4 md:px-6 py-5 bg-white flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm shrink-0">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-3">
                            ฐานข้อมูลการลงพื้นที่
                            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-100">
                                {processedData.length} รายการ
                            </span>
                        </h2>
                        <p className="text-[11px] text-gray-500 mt-1">จัดการข้อมูลสถิติและสร้างรายงานสรุปผล</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="ค้นหาสถานที่, แขวง, เขต, โครงการ..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <div className="flex w-full sm:w-auto gap-2">
                        {/* Filter Select */}
                        <div className="flex items-center flex-1 sm:flex-none bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                            <div className="pl-2 pr-1 text-gray-400">
                                <Filter className="w-4 h-4" />
                            </div>
                            <select
                                value={coordinateFilter}
                                onChange={(e) => setCoordinateFilter(e.target.value as 'all' | 'with' | 'without')}
                                className="w-full sm:w-auto text-xs bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer py-0.5 pr-2 border-l border-gray-300 pl-2"
                            >
                                <option value="all">พื้นที่ทั้งหมด</option>
                                <option value="with">📍 ระบุพิกัด</option>
                                <option value="without">⚠️ ขาดพิกัด</option>
                            </select>
                        </div>

                        {/* Sort Button */}
                        <button
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center justify-center gap-1.5 bg-gray-50 p-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                            title="เรียงตามวันที่"
                        >
                            <ArrowUpDown className="w-4 h-4 text-gray-500" />
                            <span className="hidden sm:inline">{sortOrder === 'desc' ? 'ล่าสุด' : 'เก่าสุด'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {renderPagination(true)}

            {/* --- Mobile Card View (Hidden on md and up) --- */}
            <div className={`${displayMode === 'list' || window.innerWidth < 768 ? 'block' : 'hidden'} bg-gray-50/50`}>
                <div className="flex flex-col gap-3 p-4">
                    {currentData.length > 0 ? (
                        currentData.map((item) => (
                            <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4">
                                    <div className="flex justify-between items-start gap-2 mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                                <span className="text-[11px] font-medium">{formatThaiDate(item.date)}</span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-xs leading-tight">{item.location}</h3>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                                <span className="text-[9px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                                                    {item.subdistrict ? `${item.subdistrict} / ` : ''}{item.district} {/* <-- นำแขวงมาต่อหน้าเขต */}
                                                </span>
                                                {(item.lat && item.long && parseFloat(item.lat.toString()) !== 0 && parseFloat(item.long.toString()) !== 0) ? (
                                                    <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> มีพิกัด
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> ไม่มีพิกัด
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {recordHasImage(item) ? (
                                            <button
                                                type="button"
                                                onClick={() => onViewImage(item)}
                                                className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-400"
                                                title="ดูรูปภาพ"
                                            >
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt="preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5" />
                                                )}
                                            </button>
                                        ) : (
                                            <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-50 border border-gray-100 dashed flex items-center justify-center text-gray-300">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>

                                    {item.unit && (
                                        <div className="mb-3 px-2 py-1 rounded bg-indigo-50/50 text-indigo-700 text-[11px] font-semibold border border-indigo-100/50 w-fit">
                                            {item.unit}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-5 gap-2 mb-3 bg-gray-50 rounded-lg p-2 border border-gray-100">
                                        <div className="flex flex-col items-center p-1 bg-white rounded-md shadow-sm border border-gray-100">
                                            <Syringe className="w-3.5 h-3.5 text-blue-500 mb-0.5" />
                                            <span className="font-bold text-blue-700 text-[11px]">{formatNumber(item.stats?.vaccine)}</span>
                                        </div>
                                        <div className="flex flex-col items-center p-1 bg-white rounded-md shadow-sm border border-gray-100">
                                            <Scissors className="w-3.5 h-3.5 text-orange-500 mb-0.5" />
                                            <span className="font-bold text-orange-700 text-[11px]">{formatNumber(item.stats?.sterilize)}</span>
                                        </div>
                                        <div className="flex flex-col items-center p-1 bg-white rounded-md shadow-sm border border-gray-100">
                                            <FileText className="w-3.5 h-3.5 text-teal-500 mb-0.5" />
                                            <span className="font-bold text-teal-700 text-[11px]">{formatNumber(item.stats?.register)}</span>
                                        </div>
                                        <div className="flex flex-col items-center p-1 bg-white rounded-md shadow-sm border border-gray-100">
                                            <QrCode className="w-3.5 h-3.5 text-purple-500 mb-0.5" />
                                            <span className="font-bold text-purple-700 text-[11px]">{formatNumber(item.stats?.microchip)}</span>
                                        </div>
                                        <div className="flex flex-col items-center p-1 bg-white rounded-md shadow-sm border border-gray-100">
                                            <Stethoscope className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />
                                            <span className="font-bold text-emerald-700 text-[11px]">{formatNumber(item.stats?.medical)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                                        <div className="flex items-center gap-1.5 text-gray-500 text-[9px]">
                                            <Users className="w-3 h-3"/> {item.createdBy || 'Unknown'}
                                        </div>
                                        {canEdit && (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handlePrint(item)} className="p-1.5 text-gray-500 bg-gray-50 hover:bg-white border border-gray-200 rounded-md"><Printer className="w-3.5 h-3.5"/></button>
                                                <button onClick={() => handleShareLine(item)} className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 border border-green-100 rounded-md"><Share2 className="w-3.5 h-3.5"/></button>
                                                <div className="w-px h-5 bg-gray-200 mx-1"></div>
                                                <button onClick={() => handleViewHistory(item)} className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-md"><History className="w-3.5 h-3.5"/></button>
                                                <button onClick={() => onEdit(item)} className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-md"><Pencil className="w-3.5 h-3.5"/></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-gray-200">
                            <Database className="w-8 h-8 text-gray-300 mb-3" />
                            <p className="text-xs font-semibold">ไม่พบข้อมูลในระบบ</p>
                            <p className="text-[11px] mt-1">ลองเปลี่ยนคำค้นหา หรือตัวกรอง</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Desktop Table View (Hidden on smaller than md) --- */}
            <div className={`${displayMode === 'table' && window.innerWidth >= 768 ? 'block' : 'hidden'} overflow-x-auto w-full`}>
                <table className="min-w-full text-xs text-left">
                    <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap">วันที่ / ข้อมูล</th>
                            <th className="px-6 py-4 whitespace-nowrap min-w-[220px]">สถานที่</th>
                            <th className="px-6 py-4 text-center">รูปภาพ</th>
                            <th className="px-6 py-4 text-center">สถิติการดำเนินการ</th>
                            <th className="px-6 py-4 text-center">ผู้บันทึก</th>
                            {canEdit && <th className="px-6 py-4 text-center">จัดการ</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentData.length > 0 ? (
                            currentData.map((item) => (
                                <tr key={item._id} className="hover:bg-indigo-50/40 transition-colors group">
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-4 h-4 text-indigo-400" />
                                                <span className="font-medium text-[11px]">{formatThaiDate(item.date)}</span>
                                            </div>
                                            <div className="inline-flex w-fit items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-100">
                                                {item.unit || '-'}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                                            <div className="flex flex-col gap-1.5">
                                                <span className="font-semibold text-gray-900 leading-tight">{item.location}</span>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                                                        {item.subdistrict ? `${item.subdistrict} / ` : ''}{item.district}
                                                    </span>
                                                    {(item.lat && item.long && parseFloat(item.lat.toString()) !== 0 && parseFloat(item.long.toString()) !== 0) ? (
                                                        <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> มีพิกัด
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> ไม่มีพิกัด
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-middle">
                                        {recordHasImage(item) ? (
                                            <div className="relative w-14 h-14 mx-auto group-hover:scale-105 transition-transform duration-300">
                                                <button
                                                    type="button"
                                                    onClick={() => onViewImage(item)}
                                                    className="w-full h-full rounded-xl border border-gray-200 bg-gray-50 text-gray-400 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md overflow-hidden"
                                                    title="ดูรูปภาพ"
                                                >
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt="preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <ImageIcon className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 mx-auto rounded-xl bg-gray-50 border border-gray-200 dashed flex items-center justify-center text-gray-300">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex flex-nowrap items-center justify-center gap-1.5 w-full mx-auto">
                                            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-50/80 border border-blue-100/50" title="วัคซีน">
                                                <Syringe className="w-3.5 h-3.5 text-blue-500" />
                                                <span className="font-bold text-blue-700 text-[11px]">{formatNumber(item.stats?.vaccine)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-orange-50/80 border border-orange-100/50" title="ทำหมัน">
                                                <Scissors className="w-3.5 h-3.5 text-orange-500" />
                                                <span className="font-bold text-orange-700 text-[11px]">{formatNumber(item.stats?.sterilize)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-teal-50/80 border border-teal-100/50" title="ขึ้นทะเบียน">
                                                <FileText className="w-3.5 h-3.5 text-teal-500" />
                                                <span className="font-bold text-teal-700 text-[11px]">{formatNumber(item.stats?.register)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-purple-50/80 border border-purple-100/50" title="ไมโครชิป">
                                                <QrCode className="w-3.5 h-3.5 text-purple-500" />
                                                <span className="font-bold text-purple-700 text-[11px]">{formatNumber(item.stats?.microchip)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-50/80 border border-emerald-100/50" title="รักษา">
                                                <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="font-bold text-emerald-700 text-[11px]">{formatNumber(item.stats?.medical)}</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-middle text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-1.5 text-gray-700 text-[11px] font-medium">
                                                <Users className="w-3.5 h-3.5 text-gray-400"/>
                                                {item.createdBy || 'Unknown'}
                                            </div>
                                            {item.updatedBy && item.updatedBy !== item.createdBy && (
                                                <span className="text-[9px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                    แก้โดย: {item.updatedBy}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {canEdit && (
                                        <td className="px-6 py-4 align-middle text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="flex bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                                                    <button onClick={() => handlePrint(item)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition-colors" title="พิมพ์เอกสาร">
                                                        <Printer className="w-4 h-4"/>
                                                    </button>
                                                    <button onClick={() => handleDownloadWebp(item)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="ดาวน์โหลด">
                                                        <Download className="w-4 h-4"/>
                                                    </button>
                                                    <button onClick={() => handleShareLine(item)} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="แชร์ LINE">
                                                        <Share2 className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                                
                                                <div className="flex bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                                                    <button onClick={() => handleViewHistory(item)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="ประวัติการแก้ไข">
                                                        <History className="w-4 h-4"/>
                                                    </button>
                                                    <button onClick={() => onEdit(item)} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="แก้ไข">
                                                        <Pencil className="w-4 h-4"/>
                                                    </button>
                                                    <button onClick={() => onDelete(item._id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="ลบ">
                                                        <X className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={canEdit ? 6 : 5} className="px-6 py-16 text-center"> 
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <div className="p-5 bg-gray-50 rounded-full mb-4 border border-gray-100 shadow-inner">
                                            <Database className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <p className="text-xs text-gray-600 font-semibold">ไม่พบข้อมูลในระบบ</p>
                                        <p className="text-[11px] text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือตัวกรอง</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {processedData.length > 0 && (
                        <tfoot className="bg-indigo-50/50 border-t-2 border-indigo-100 font-bold text-gray-800">
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-right text-xs">ยอดรวมสถิติตามการกรองข้อมูล:</td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-4 text-[11px]">
                                        <span className="text-blue-700 flex items-center gap-1"><Syringe className="w-3 h-3"/> {formatNumber(totals.vaccine)}</span>
                                        <span className="text-orange-700 flex items-center gap-1"><Scissors className="w-3 h-3"/> {formatNumber(totals.sterilize)}</span>
                                        <span className="text-teal-700 flex items-center gap-1"><FileText className="w-3 h-3"/> {formatNumber(totals.register)}</span>
                                        <span className="text-purple-700 flex items-center gap-1"><QrCode className="w-3 h-3"/> {formatNumber(totals.microchip)}</span>
                                        <span className="text-emerald-700 flex items-center gap-1"><Stethoscope className="w-3 h-3"/> {formatNumber(totals.medical)}</span>
                                    </div>
                                </td>
                                <td colSpan={canEdit ? 2 : 1}></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
            
            {renderPagination(false)}

            {/* --- Modal ประวัติการแก้ไข (Track Changes) --- */}
            {historyModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200">
                        <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">ประวัติการแก้ไขข้อมูล</h3>
                                    <p className="text-[11px] text-slate-500">{selectedRecordData?.location}</p>
                                </div>
                            </div>
                            <button onClick={() => setHistoryModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-0 overflow-auto bg-slate-50 flex-1 custom-scrollbar">
                            {isLoadingLogs ? (
                                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                                    <Activity className="w-8 h-8 animate-pulse text-indigo-400" />
                                    <span className="text-[11px]">กำลังโหลดประวัติการแก้ไข...</span>
                                </div>
                            ) : recordLogs.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 text-[11px]">ไม่พบประวัติการแก้ไขของรายการนี้</div>
                            ) : (
                                <div className="divide-y divide-slate-200">
                                    {recordLogs.map((log) => (
                                        <div key={log._id} className="p-6 bg-white">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[11px] border border-slate-200">
                                                        {log.user?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-800">{log.user}</div>
                                                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {new Date(log.createdAt).toLocaleString('th-TH')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 text-[9px] font-bold uppercase rounded-full border ${log.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : log.action.includes('UPDATE') ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                    {log.action}
                                                </span>
                                            </div>
                                            
                                            {log.metadata && log.metadata.before && log.metadata.after ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-[#1e1e1e] p-4 rounded-xl overflow-hidden shadow-inner">
                                                    <div className="overflow-auto custom-scrollbar pr-2">
                                                        <div className="flex items-center gap-2 mb-2 text-rose-400 font-bold text-[10px] bg-rose-500/10 px-2 py-1 rounded w-fit">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> ข้อมูลก่อนแก้ไข
                                                        </div>
                                                        <pre className="text-[10px] font-mono leading-relaxed whitespace-pre-wrap">
                                                            {renderDiffJSON(log.metadata.before, log.metadata.after, 'before')}
                                                        </pre>
                                                    </div>
                                                    <div className="overflow-auto custom-scrollbar pl-2 md:border-l border-slate-700 md:pt-0 pt-4 md:mt-0 mt-2 border-t md:border-t-0">
                                                        <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-1 rounded w-fit">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> ข้อมูลหลังแก้ไข
                                                        </div>
                                                        <pre className="text-[10px] font-mono leading-relaxed whitespace-pre-wrap">
                                                            {renderDiffJSON(log.metadata.after, log.metadata.before, 'after')}
                                                        </pre>
                                                    </div>
                                                </div>
                                            ) : log.metadata ? (
                                                <div className="mt-4 bg-[#1e1e1e] p-4 rounded-xl overflow-auto custom-scrollbar shadow-inner">
                                                    <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-1 rounded w-fit">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> ข้อมูลที่บันทึก
                                                    </div>
                                                    <pre className="text-[10px] font-mono leading-relaxed whitespace-pre-wrap">
                                                        {renderDiffJSON(log.metadata, log.metadata, 'after')}
                                                    </pre>
                                                </div>
                                            ) : (
                                                <div className="text-[11px] text-slate-400 mt-2 italic border-l-2 border-slate-200 pl-2">ไม่มีรายละเอียดการเปลี่ยนแปลงที่บันทึกไว้</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainDataTable;
