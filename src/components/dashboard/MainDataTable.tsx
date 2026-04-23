import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { 
    Database, Users, Pencil, X, MapPin, Calendar, 
    ImageIcon, Syringe, Scissors, QrCode, Stethoscope, FileText, Printer,
    Download, Share2, Filter
} from 'lucide-react';

export interface ItemStats {
    vaccine?: number;
    sterilize?: number;
    register?: number;
    microchip?: number;
    medical?: number;
}

export interface DataItem {
    _id: string;
    date: string;
    unit?: string;
    location: string;
    district: string;
    lat?: number | string;
    long?: number | string;
    imageUrl?: string | null;
    stats?: ItemStats;
    details?: any;
    createdBy?: string;
    updatedBy?: string;
}

interface MainDataTableProps {
    data?: DataItem[];
    canEdit?: boolean;
    isSuperAdmin?: boolean;
    onClearAll?: () => void;
    onEdit: (item: DataItem) => void;
    onDelete: (id: string) => void;
    onViewImage: (url: string) => void;
}

const MainDataTable: React.FC<MainDataTableProps> = ({ 
    data: incomingData, 
    canEdit = false,
    onEdit, 
    onDelete, 
    onViewImage 
}) => {
    const baseData = incomingData || [];
    const [coordinateFilter, setCoordinateFilter] = useState<'all' | 'with' | 'without'>('all');

    // กรองข้อมูลตามพิกัดก่อนนำไปให้ตารางและ Pagination ใช้
    const data = baseData.filter(item => {
        if (coordinateFilter === 'all') return true;
        const hasCoords = item.lat && item.long && parseFloat(item.lat.toString()) !== 0 && parseFloat(item.long.toString()) !== 0;
        return coordinateFilter === 'with' ? hasCoords : !hasCoords;
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
    const itemsPerPage = 25;

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = data.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const formatNumber = (num?: number | string | null): string => 
        num ? Number(num).toLocaleString() : '0';

    const totals = data.reduce((acc, item) => ({
        vaccine: acc.vaccine + (Number(item.stats?.vaccine) || 0),
        sterilize: acc.sterilize + (Number(item.stats?.sterilize) || 0),
        register: acc.register + (Number(item.stats?.register) || 0),
        microchip: acc.microchip + (Number(item.stats?.microchip) || 0),
        medical: acc.medical + (Number(item.stats?.medical) || 0),
    }), { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 });

    const getPageNumbers = (): (number | string)[] => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (currentPage <= 3) return [1, 2, 3, 4, 5, '...', totalPages];
        if (currentPage >= totalPages - 2) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    const getDocumentStyle = () => `
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600&display=swap');
        .report-doc {
            font-family: 'Sarabun', sans-serif;
            color: #000;
            font-size: 14px; /* ปรับลดจาก 15px */
            line-height: 1.4;
            margin: 0 auto;
            padding: 40px 50px;
            background: #fff;
            width: 794px;
            min-height: 1123px;
            box-sizing: border-box;
        }
        .report-doc .text-center { text-align: center; }
        .report-doc .font-bold { font-weight: 600; }
        .report-doc .underline { text-decoration: underline; }
        
        .report-doc .header-group { margin-bottom: 25px; }
        .report-doc .header-title { font-size: 16px; margin-bottom: 4px; }
        
        .report-doc .form-line { 
            display: flex; 
            align-items: flex-end; 
            margin-bottom: 12px;
            white-space: nowrap; 
        }
        
        .report-doc .dotted-text { 
            border-bottom: 1px dotted #000; 
            text-align: center; 
            color: #000000; 
            padding-bottom: 4px;
            line-height: 1.2; 
        }
        .report-doc .flex-1 { flex: 1; }
        
        .report-doc .data-grid { 
            width: 95%; 
            margin: 20px auto; 
            border-collapse: collapse; 
        }
        .report-doc .data-grid td { 
            padding: 6px 0;
            vertical-align: bottom; 
        }
        .report-doc .col-main { width: 45%; }
        .report-doc .col-sub { width: 25%; padding-left: 15px; }
        .report-doc .col-val { width: 20%; text-align: center; }
        .report-doc .col-unit { width: 10%; text-align: left; padding-left: 5px; }
        
        .report-doc .val-dots { 
            display: inline-block; 
            width: 80%; 
            border-bottom: 1px dotted #000; 
            text-align: center; 
            color: #000; 
            padding-bottom: 4px;
            line-height: 1.2; 
        }
        .report-doc .section-gap { padding-top: 15px; }

        @media print {
            @page { size: A4; margin: 10mm; }
            .report-doc {
                width: auto;
                min-height: auto;
                padding: 0;
            }
        }
    `;

    const getDocumentHTML = (item: DataItem) => `
        <div class="report-doc">
            <div class="header-group text-center font-bold">
                <div class="header-title underline">สรุปผลการปฏิบัติงานสัตวแพทย์ กลุ่มควบคุมโรคพิษสุนัขบ้า</div>
                <div class="header-title underline">สำนักงานสัตวแพทย์สาธารณสุข สำนักอนามัย</div>
            </div>
            
            <div class="form-line">
                <span>ชื่อโครงการ</span>
                <span class="dotted-text flex-1" style="margin: 0 10px;">${item.unit || ''}</span>
                <span>สถานที่</span>
                <span class="dotted-text" style="width: 35%; margin-left: 10px;">${item.location || ''}</span>
            </div>
            
            <div class="form-line">
                <span>วันที่</span>
                <span class="dotted-text" style="width: 250px; margin: 0 10px;">${item.date || ''}</span>
                <span>เขต</span>
                <span class="dotted-text flex-1" style="margin-left: 10px;">${item.district || ''}</span>
            </div>
            
            <div class="form-line">
                <span>นสพ.ควบคุมหน่วย</span>
                <span class="dotted-text flex-1" style="margin: 0 10px;"></span>
                <span>สังกัด</span>
                <span class="dotted-text" style="width: 200px; margin-left: 10px;">สำนักอนามัย</span>
            </div>

            <table class="data-grid">
                <tr>
                    <td class="col-main">จำนวนวัคซีนที่เบิก</td>
                    <td class="col-sub"></td>
                    <td class="col-val"><span class="val-dots">${item.details?.vaccineRequisitioned || ''}</span></td>
                    <td class="col-unit">โด๊ส</td>
                </tr>
                <tr>
                    <td class="col-main">จำนวนสัตว์ที่ฉีดวัคซีน</td>
                    <td class="col-sub">สุนัข</td>
                    <td class="col-val"><span class="val-dots">${item.details?.dog?.vaccine || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main"></td>
                    <td class="col-sub">แมว</td>
                    <td class="col-val"><span class="val-dots">${item.details?.cat?.vaccine || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main"></td>
                    <td class="col-sub">อื่นๆ</td>
                    <td class="col-val"><span class="val-dots">${item.details?.other?.vaccine || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main"></td>
                    <td class="col-sub">รวม</td>
                    <td class="col-val"><span class="val-dots">${item.stats?.vaccine || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main" style="padding-top: 6px;">คงเหลือวัคซีน</td>
                    <td class="col-sub" style="padding-top: 6px;"></td>
                    <td class="col-val" style="padding-top: 6px;"><span class="val-dots">${item.details?.vaccineRemaining || ''}</span></td>
                    <td class="col-unit" style="padding-top: 6px;">โด๊ส</td>
                </tr>

                <tr>
                    <td class="col-main section-gap">จำนวนสุนัข / แมวทำหมัน</td>
                    <td class="col-sub section-gap">สุนัขเพศผู้</td>
                    <td class="col-val section-gap"><span class="val-dots">${item.details?.dog?.maleSterilize || ''}</span></td>
                    <td class="col-unit section-gap">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main"></td>
                    <td class="col-sub">สุนัขเพศเมีย</td>
                    <td class="col-val"><span class="val-dots">${item.details?.dog?.femaleSterilize || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main"></td>
                    <td class="col-sub">แมวเพศผู้</td>
                    <td class="col-val"><span class="val-dots">${item.details?.cat?.maleSterilize || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main"></td>
                    <td class="col-sub">แมวเพศเมีย</td>
                    <td class="col-val"><span class="val-dots">${item.details?.cat?.femaleSterilize || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main"></td>
                    <td class="col-sub">รวม</td>
                    <td class="col-val"><span class="val-dots">${item.stats?.sterilize || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>

                <tr>
                    <td class="col-main section-gap">จำนวนสุนัข / แมวที่ฉีดไมโครชิป</td>
                    <td class="col-sub section-gap">สุนัขมีเจ้าของ</td>
                    <td class="col-val section-gap"><span class="val-dots">${item.details?.dog?.microchip || ''}</span></td>
                    <td class="col-unit section-gap">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main"></td>
                    <td class="col-sub">แมวมีเจ้าของ</td>
                    <td class="col-val"><span class="val-dots">${item.details?.cat?.microchip || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main"></td>
                    <td class="col-sub">รวม</td>
                    <td class="col-val"><span class="val-dots">${item.stats?.microchip || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>

                <tr>
                    <td class="col-main section-gap">จำนวนสุนัข / แมว ขึ้นทะเบียน</td>
                    <td class="col-sub section-gap">ขึ้นทะเบียน สุนัข</td>
                    <td class="col-val section-gap"><span class="val-dots">${item.details?.dog?.register || ''}</span></td>
                    <td class="col-unit section-gap">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main"></td>
                    <td class="col-sub">ขึ้นทะเบียน แมว</td>
                    <td class="col-val"><span class="val-dots">${item.details?.cat?.register || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main"></td>
                    <td class="col-sub">รวม</td>
                    <td class="col-val"><span class="val-dots">${item.stats?.register || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>

                <tr>
                    <td class="col-main section-gap">รักษาสัตว์</td>
                    <td class="col-sub section-gap">สุนัข</td>
                    <td class="col-val section-gap"><span class="val-dots">${item.details?.dog?.medical || ''}</span></td>
                    <td class="col-unit section-gap">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main"></td>
                    <td class="col-sub">แมว</td>
                    <td class="col-val"><span class="val-dots">${item.details?.cat?.medical || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main"></td>
                    <td class="col-sub">อื่นๆ</td>
                    <td class="col-val"><span class="val-dots">${item.details?.other?.medical || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>
                <tr>
                    <td class="col-main"></td>
                    <td class="col-sub">รวม</td>
                    <td class="col-val"><span class="val-dots">${item.stats?.medical || ''}</span></td>
                    <td class="col-unit">ตัว</td>
                </tr>
            </table>

            <div class="form-line" style="margin-top: 30px; padding-left: 20px;">
                <span>ผู้รายงาน</span>
                <span class="dotted-text" style="width: 250px; margin: 0 15px;"></span>
                <span>สังกัด</span>
                <span class="dotted-text flex-1" style="margin-left: 15px;">สำนักอนามัย</span>
            </div>
        </div>
    `;

    // 1. ฟังก์ชัน ปริ้น
    const handlePrint = (item: DataItem) => {
        const printContent = `
            <!DOCTYPE html>
            <html lang="th">
            <head>
                <meta charset="UTF-8">
                <title>พิมพ์เอกสารสรุปผล - ${item.location || 'ไม่ระบุสถานที่'}</title>
                <style>
                    ${getDocumentStyle()}
                </style>
            </head>
            <body>
                ${getDocumentHTML(item)}
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 500);
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

    // 2. ฟังก์ชัน ดาวน์โหลด JPG
    const handleDownloadJpg = async (item: DataItem) => {
        if (isGeneratingDocument) return;
        setIsGeneratingDocument(true);
        try {
            const canvas = await generateImageCanvas(item);
            const link = document.createElement('a');
            link.download = `รายงาน_${item.location || 'เอกสาร'}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.click();
        } catch (error) {
            console.error('Error generating image:', error);
            alert('เกิดข้อผิดพลาดในการสร้างไฟล์รูปภาพ');
        } finally {
            setIsGeneratingDocument(false);
        }
    };

    // 3. ฟังก์ชัน แชร์เข้า LINE
    const handleShareLine = async (item: DataItem) => {
        if (isGeneratingDocument) return;
        setIsGeneratingDocument(true);
        try {
            const canvas = await generateImageCanvas(item);
            
            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9);
            });

            if (!blob) {
                alert('ไม่สามารถสร้างไฟล์รูปภาพได้');
                return;
            }

            const fileName = `รายงาน_${item.location || 'เอกสาร'}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'รายงานสรุปผล',
                    text: `รายงานสรุปผลการปฏิบัติงาน - ${item.location || ''}`
                });
            } else {
                alert('อุปกรณ์ไม่รองรับการแชร์รูปโดยตรง ระบบจะทำการดาวน์โหลดภาพให้แทน จากนั้นสามารถส่งเข้า LINE ได้เลยครับ');
                
                const link = document.createElement('a');
                link.download = fileName;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
            }
        } catch (error: any) {
            console.error('Error sharing file:', error);
            if (error.name !== 'AbortError') {
                alert('เกิดข้อผิดพลาดในการแชร์ หรือเบราว์เซอร์บล็อกการทำงาน (แนะนำให้ใช้ฟังก์ชันดาวน์โหลดรูปแทน)');
            }
        } finally {
            setIsGeneratingDocument(false);
        }
    };

    const renderPagination = (isTop: boolean) => {
        if (data.length === 0) return null;
        return (
            <div className={`px-6 py-3 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 ${isTop ? 'border-b border-gray-100' : 'border-t border-gray-100'}`}>
                <span className="text-xs text-gray-500 font-medium">
                    แสดงข้อมูล <span className="text-gray-900">{startIndex + 1}</span> ถึง <span className="text-gray-900">{Math.min(startIndex + itemsPerPage, data.length)}</span> จาก <span className="text-gray-900">{data.length}</span> รายการ
                </span>
                
                {totalPages > 1 && (
                    <div className="flex rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="px-3 py-1.5 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-300 transition-colors border-r border-gray-200">
                            หน้าแรก
                        </button>
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-300 transition-colors border-r border-gray-200">
                            &laquo;
                        </button>
                        
                        {getPageNumbers().map((number, index) => {
                            if (number === '...') {
                                return <span key={`ellipsis-${index}`} className="px-3 py-1.5 bg-gray-50 text-xs font-medium text-gray-400 border-r border-gray-200">...</span>;
                            }
                            return (
                                <button key={number} onClick={() => handlePageChange(number as number)} className={`min-w-[36px] px-3 py-1.5 text-xs font-medium transition-colors border-r border-gray-200 ${currentPage === number ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}>
                                    {number}
                                </button>
                            );
                        })}

                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-300 transition-colors border-r border-gray-200">
                            &raquo;
                        </button>
                        <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-300 transition-colors">
                            หน้าสุดท้าย
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-8 overflow-hidden w-full flex flex-col">
            {/* Header Section */}
            <div className="px-6 py-5 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-3">
                            ฐานข้อมูลการลงพื้นที่
                            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                                {data.length} รายการ
                            </span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">จัดการข้อมูลสถิติและสร้างรายงานสรุปผล</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                    <div className="pl-3 pr-1 text-gray-400">
                        <Filter className="w-4 h-4" />
                    </div>
                    <select
                        value={coordinateFilter}
                        onChange={(e) => {
                            setCoordinateFilter(e.target.value as 'all' | 'with' | 'without');
                            setCurrentPage(1);
                        }}
                        className="w-full sm:w-auto text-sm bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer py-1.5 pr-4 border-l border-gray-300 pl-3"
                    >
                        <option value="all">แสดงพื้นที่ทั้งหมด</option>
                        <option value="with">📍 เฉพาะพื้นที่ระบุพิกัด</option>
                        <option value="without">⚠️ พื้นที่ขาดพิกัด</option>
                    </select>
                </div>
            </div>

            {renderPagination(true)}

            {/* Table Section */}
            <div className="overflow-x-auto w-full">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-xs">
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
                                                <span className="font-medium text-xs">{item.date}</span>
                                            </div>
                                            <div className="inline-flex w-fit items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
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
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                                                        {item.district}
                                                    </span>
                                                    {(item.lat && item.long && parseFloat(item.lat.toString()) !== 0 && parseFloat(item.long.toString()) !== 0) ? (
                                                        <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> มีพิกัด
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> ไม่มีพิกัด
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-middle">
                                        {item.imageUrl ? (
                                            <div className="relative w-14 h-14 mx-auto group-hover:scale-105 transition-transform duration-300">
                                                <img 
                                                    src={item.imageUrl} 
                                                    alt="preview" 
                                                    onClick={() => onViewImage(item.imageUrl!)}
                                                    className="w-full h-full object-cover rounded-xl border border-gray-200 cursor-pointer shadow-sm hover:shadow-md" 
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 mx-auto rounded-xl bg-gray-50 border border-gray-200 dashed flex items-center justify-center text-gray-300">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex flex-wrap items-center justify-center gap-2 max-w-[280px] mx-auto">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50/80 border border-blue-100/50" title="วัคซีน">
                                                <Syringe className="w-3.5 h-3.5 text-blue-500" />
                                                <span className="font-bold text-blue-700 text-xs">{formatNumber(item.stats?.vaccine)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50/80 border border-orange-100/50" title="ทำหมัน">
                                                <Scissors className="w-3.5 h-3.5 text-orange-500" />
                                                <span className="font-bold text-orange-700 text-xs">{formatNumber(item.stats?.sterilize)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50/80 border border-teal-100/50" title="ขึ้นทะเบียน">
                                                <FileText className="w-3.5 h-3.5 text-teal-500" />
                                                <span className="font-bold text-teal-700 text-xs">{formatNumber(item.stats?.register)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50/80 border border-purple-100/50" title="ไมโครชิป">
                                                <QrCode className="w-3.5 h-3.5 text-purple-500" />
                                                <span className="font-bold text-purple-700 text-xs">{formatNumber(item.stats?.microchip)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50/80 border border-emerald-100/50" title="รักษา">
                                                <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="font-bold text-emerald-700 text-xs">{formatNumber(item.stats?.medical)}</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-middle text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-1.5 text-gray-700 text-xs font-medium">
                                                <Users className="w-3.5 h-3.5 text-gray-400"/>
                                                {item.createdBy || 'Unknown'}
                                            </div>
                                            {item.updatedBy && item.updatedBy !== item.createdBy && (
                                                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                    แก้โดย: {item.updatedBy}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {canEdit && (
                                        <td className="px-6 py-4 align-middle text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Document Actions */}
                                                <div className="flex bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                                                    <button onClick={() => handlePrint(item)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition-colors" title="พิมพ์เอกสาร">
                                                        <Printer className="w-4 h-4"/>
                                                    </button>
                                                    <button onClick={() => handleDownloadJpg(item)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="ดาวน์โหลด">
                                                        <Download className="w-4 h-4"/>
                                                    </button>
                                                    <button onClick={() => handleShareLine(item)} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="แชร์ LINE">
                                                        <Share2 className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                                
                                                {/* Data Actions */}
                                                <div className="flex bg-gray-50 border border-gray-200 rounded-lg p-0.5">
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
                                        <p className="text-sm text-gray-600 font-semibold">ไม่พบข้อมูลในระบบ</p>
                                        <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนตัวกรองพื้นที่ หรือเริ่มบันทึกข้อมูลใหม่</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {data.length > 0 && (
                        <tfoot className="bg-indigo-50/50 border-t-2 border-indigo-100 font-bold text-gray-800">
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-right text-sm">ยอดรวมสถิติทุกหน้า:</td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-4 text-xs">
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
        </div>
    );
};

export default MainDataTable;