import React, { useState } from 'react';
import { 
    Database, Users, Pencil, X, MapPin, Calendar, 
    ImageIcon, Syringe, Scissors, QrCode, Stethoscope, FileText, Printer
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
    location: string;
    district: string;
    imageUrl?: string | null;
    stats?: ItemStats;
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
    data: incomingData, // เปลี่ยนการรับค่าเพื่อป้องกันค่า null
    canEdit = false, 
    isSuperAdmin = false, 
    onClearAll, 
    onEdit, 
    onDelete, 
    onViewImage 
}) => {
    // บังคับให้เป็น Array เสมอ ป้องกัน Error .length หรือ .slice จากค่า null
    const data = incomingData || [];

    const [currentPage, setCurrentPage] = useState(1);
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
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (currentPage <= 3) {
            return [1, 2, 3, 4, 5, '...', totalPages];
        }
        if (currentPage >= totalPages - 2) {
            return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    // --- ฟังก์ชันจัดรูปแบบและสั่งปริ้นหน้าเอกสาร ---
    const handlePrint = (item: DataItem) => {
        const printContent = `
            <!DOCTYPE html>
            <html lang="th">
            <head>
                <meta charset="UTF-8">
                <title>พิมพ์เอกสารสรุปผล - ${item.location || 'ไม่ระบุสถานที่'}</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600&display=swap" rel="stylesheet">
                <style>
                    /* กำหนดหน้ากระดาษเป็น A4 และลดขอบเหลือ 10mm */
                    @page { size: A4; margin: 10mm; }
                    
                    body {
                        font-family: 'Sarabun', sans-serif;
                        color: #000;
                        font-size: 15px; /* ลดขนาดฟอนต์ลงเล็กน้อยจาก 16px เป็น 15px */
                        line-height: 1.4; /* ปรับระยะบรรทัดให้กระชับขึ้น */
                        margin: 0;
                        padding: 0;
                        /* พยายามบังคับไม่ให้เนื้อหาถูกตัดขึ้นหน้าใหม่ */
                        page-break-inside: avoid;
                    }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: 600; }
                    .underline { text-decoration: underline; }
                    
                    .header-group { margin-bottom: 15px; } /* ลดระยะห่างหัวกระดาษ */
                    .header-title { font-size: 18px; margin-bottom: 5px; }
                    
                    .form-line { 
                        display: flex; 
                        align-items: flex-end; 
                        margin-bottom: 8px; /* ลดระยะห่างระหว่างบรรทัดฟอร์ม */
                        white-space: nowrap;
                    }
                    .dotted-text {
                        border-bottom: 1.5px dotted #000;
                        text-align: center;
                        color: #0000FF; /* สีน้ำเงินเหมือนหมึกปากกา */
                        min-height: 22px;
                        display: inline-block;
                        line-height: 1.2;
                    }
                    .flex-1 { flex: 1; }
                    
                    /* จัดรูปแบบตารางข้อมูลให้ตรงกับในแบบฟอร์ม */
                    .data-grid {
                        width: 95%; /* ขยายตารางให้เต็มขึ้นเล็กน้อย */
                        margin: 15px auto; /* ลดระยะห่างบนล่างของตาราง */
                        border-collapse: collapse;
                    }
                    .data-grid td {
                        padding: 4px 0; /* ลด padding ในเซลล์ตาราง */
                        vertical-align: bottom;
                    }
                    .col-main { width: 45%; }
                    .col-sub { width: 25%; padding-left: 20px; }
                    .col-val { width: 20%; text-align: center; }
                    .col-unit { width: 10%; text-align: left; padding-left: 10px; }
                    
                    .val-dots {
                        display: inline-block;
                        width: 80%;
                        border-bottom: 1.5px dotted #000;
                        min-height: 20px;
                        text-align: center;
                        color: #0000FF; /* สีน้ำเงินเหมือนหมึกปากกา */
                        line-height: 1.2;
                    }

                    .section-gap { padding-top: 15px; } /* ลดระยะห่างระหว่างหมวดหมู่ข้อมูล */
                </style>
            </head>
            <body>
                <div class="header-group text-center font-bold">
                    <div class="header-title underline">สรุปผลการปฏิบัติงานสัตวแพทย์ กลุ่มควบคุมโรคพิษสุนัขบ้า</div>
                    <div class="header-title underline">สำนักงานสัตวแพทย์สาธารณสุข สำนักอนามัย</div>
                </div>
                
                <div class="form-line">
                    <span>ชื่อโครงการ</span>
                    <span class="dotted-text flex-1" style="margin: 0 10px;"></span>
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
                        <td class="col-val"><span class="val-dots"></span></td>
                        <td class="col-unit">โด๊ส</td>
                    </tr>
                    <tr>
                        <td class="col-main">จำนวนสัตว์ที่ฉีดวัคซีน</td>
                        <td class="col-sub">สุนัข</td>
                        <td class="col-val"><span class="val-dots"></span></td>
                        <td class="col-unit">ตัว</td>
                    </tr>
                    <tr>
                        <td class="col-main"></td>
                        <td class="col-sub">แมว</td>
                        <td class="col-val"><span class="val-dots"></span></td>
                        <td class="col-unit">ตัว</td>
                    </tr>
                    <tr>
                        <td class="col-main"></td>
                        <td class="col-sub">อื่นๆ</td>
                        <td class="col-val"><span class="val-dots"></span></td>
                        <td class="col-unit">ตัว</td>
                    </tr>
                    <tr>
                        <td class="col-main"></td>
                        <td class="col-sub">รวม</td>
                        <td class="col-val"><span class="val-dots">${item.stats?.vaccine || ''}</span></td>
                        <td class="col-unit">ตัว</td>
                    </tr>
                    <tr>
                        <td class="col-main" style="padding-top: 10px;">คงเหลือวัคซีน</td>
                        <td class="col-sub" style="padding-top: 10px;"></td>
                        <td class="col-val" style="padding-top: 10px;"><span class="val-dots"></span></td>
                        <td class="col-unit" style="padding-top: 10px;">โด๊ส</td>
                    </tr>

                    <tr>
                        <td class="col-main section-gap">จำนวนสุนัข / แมวทำหมัน</td>
                        <td class="col-sub section-gap">สุนัขเพศผู้</td>
                        <td class="col-val section-gap"><span class="val-dots"></span></td>
                        <td class="col-unit section-gap">ตัว</td>
                    </tr>
                    <tr>
                        <td class="col-main"></td>
                        <td class="col-sub">สุนัขเพศเมีย</td>
                        <td class="col-val"><span class="val-dots"></span></td>
                        <td class="col-unit">ตัว</td>
                    </tr>
                    <tr>
                        <td class="col-main"></td>
                        <td class="col-sub">แมวเพศผู้</td>
                        <td class="col-val"><span class="val-dots"></span></td>
                        <td class="col-unit">ตัว</td>
                    </tr>
                    <tr>
                        <td class="col-main"></td>
                        <td class="col-sub">แมวเพศเมีย</td>
                        <td class="col-val"><span class="val-dots"></span></td>
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
                        <td class="col-val section-gap"><span class="val-dots"></span></td>
                        <td class="col-unit section-gap">ตัว</td>
                    </tr>
                    <tr>
                        <td class="col-main"></td>
                        <td class="col-sub">แมวมีเจ้าของ</td>
                        <td class="col-val"><span class="val-dots"></span></td>
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
                        <td class="col-val section-gap"><span class="val-dots"></span></td>
                        <td class="col-unit section-gap">ตัว</td>
                    </tr>
                    <tr>
                        <td class="col-main"></td>
                        <td class="col-sub">ขึ้นทะเบียน แมว</td>
                        <td class="col-val"><span class="val-dots"></span></td>
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
                        <td class="col-val section-gap"><span class="val-dots"></span></td>
                        <td class="col-unit section-gap">ตัว</td>
                    </tr>
                    <tr>
                        <td class="col-main"></td>
                        <td class="col-sub">แมว</td>
                        <td class="col-val"><span class="val-dots"></span></td>
                        <td class="col-unit">ตัว</td>
                    </tr>
                    <tr>
                        <td class="col-main"></td>
                        <td class="col-sub">อื่นๆ</td>
                        <td class="col-val"><span class="val-dots"></span></td>
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
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            // หน่วงเวลาให้ Font Sarabun โหลดเสร็จก่อน
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    const renderPagination = (isTop: boolean) => {
        if (data.length === 0) return null;
        
        return (
            <div className={`px-4 sm:px-6 py-3 bg-white flex flex-col sm:flex-row justify-between items-center gap-3 ${isTop ? 'border-b border-gray-100' : 'border-t border-gray-100'}`}>
                <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium text-center sm:text-left">
                    แสดงข้อมูล {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, data.length)} จากทั้งหมด {data.length} รายการ
                </span>
                
                {totalPages > 1 && (
                    <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 custom-scrollbar flex justify-start sm:justify-end">
                        <div className="inline-flex -space-x-px rounded-md shadow-sm min-w-max">
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                                className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-l-md border border-gray-200 bg-white text-[10px] sm:text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                First
                            </button>
                            
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-2 sm:px-2.5 py-1 sm:py-1.5 border border-gray-200 bg-white text-[10px] sm:text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                &laquo;
                            </button>
                            
                            {getPageNumbers().map((number, index) => {
                                if (number === '...') {
                                    return (
                                        <span key={`ellipsis-${index}${isTop ? '-top' : '-bottom'}`} className="px-2 sm:px-2.5 py-1 sm:py-1.5 border-y border-gray-200 bg-gray-50 text-[10px] sm:text-xs font-medium text-gray-400">
                                            ...
                                        </span>
                                    );
                                }
                                return (
                                    <button
                                        key={`${number}${isTop ? '-top' : '-bottom'}`}
                                        onClick={() => handlePageChange(number as number)}
                                        className={`min-w-[28px] sm:min-w-[32px] px-2 sm:px-2.5 py-1 sm:py-1.5 border text-[10px] sm:text-xs font-medium transition-colors ${
                                            currentPage === number
                                                ? 'z-10 bg-indigo-500 border-indigo-500 text-white' 
                                                : 'border-gray-200 bg-white text-indigo-600 hover:bg-indigo-50'
                                        }`}
                                    >
                                        {number}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-2 sm:px-2.5 py-1 sm:py-1.5 border border-gray-200 bg-white text-[10px] sm:text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                &raquo;
                            </button>
                            
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-r-md border border-gray-200 bg-white text-[10px] sm:text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Last
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mt-8 overflow-hidden w-full">
            <div className="px-6 py-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Database className="w-5 h-5" />
                        </div>
                        ฐานข้อมูลทั้งหมด
                        <span className="ml-2 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium border border-gray-200">
                            {data.length} รายการ
                        </span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 pl-11">จัดการข้อมูลการลงพื้นที่และสถิติ</p>
                </div>
            </div>

            {renderPagination(true)}

            <div className="overflow-x-auto custom-scrollbar border-b border-gray-100 w-full">
                <table className="min-w-full text-xs text-left relative">
                    <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 font-medium border-b border-gray-100 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap w-32">วันที่</th>
                            <th className="px-6 py-4 whitespace-nowrap min-w-[200px]">สถานที่</th>
                            <th className="px-6 py-4 text-center w-24">รูปภาพ</th>
                            <th className="px-6 py-4 text-center w-24">วัคซีน</th>
                            <th className="px-6 py-4 text-center w-24">ทำหมัน</th>
                            <th className="px-6 py-4 text-center w-24">ขึ้นทะเบียน</th>
                            <th className="px-6 py-4 text-center w-24">ไมโครชิป</th>
                            <th className="px-6 py-4 text-center w-24">รักษา</th>
                            <th className="px-6 py-4 text-center w-32">ผู้บันทึก</th>
                            {canEdit && <th className="px-6 py-4 text-center w-36">จัดการ</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {currentData.length > 0 ? (
                            currentData.map((item) => (
                                <tr key={item._id} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-gray-500 align-middle">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="font-mono text-xs">{item.date}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 min-w-[16px]">
                                                <MapPin className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-800 text-sm">{item.location}</div>
                                                <div className="text-[10px] text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded mt-1">
                                                    {item.district}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-middle text-center">
                                        {item.imageUrl ? (
                                            <div className="relative w-12 h-12 mx-auto">
                                                <img 
                                                    src={item.imageUrl} 
                                                    alt="preview" 
                                                    onClick={() => onViewImage(item.imageUrl!)}
                                                    className="w-full h-full object-cover rounded-lg border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-all hover:scale-105" 
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 mx-auto rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 align-middle text-center">
                                        <div className="inline-flex flex-col items-center justify-center min-w-[60px] p-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700">
                                            <Syringe className="w-3 h-3 mb-1 opacity-50" />
                                            <span className="font-bold text-xs">{formatNumber(item.stats?.vaccine)}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-middle text-center">
                                        <div className="inline-flex flex-col items-center justify-center min-w-[60px] p-1.5 rounded-lg bg-orange-50 border border-orange-100 text-orange-700">
                                            <Scissors className="w-3 h-3 mb-1 opacity-50" />
                                            <span className="font-bold text-xs">{formatNumber(item.stats?.sterilize)}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-middle text-center">
                                        <div className="inline-flex flex-col items-center justify-center min-w-[60px] p-1.5 rounded-lg bg-teal-50 border border-teal-100 text-teal-700">
                                            <FileText className="w-3 h-3 mb-1 opacity-50" />
                                            <span className="font-bold text-xs">{formatNumber(item.stats?.register)}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-middle text-center">
                                        <div className="inline-flex flex-col items-center justify-center min-w-[60px] p-1.5 rounded-lg bg-purple-50 border border-purple-100 text-purple-700">
                                            <QrCode className="w-3 h-3 mb-1 opacity-50" />
                                            <span className="font-bold text-xs">{formatNumber(item.stats?.microchip)}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-middle text-center">
                                        <div className="inline-flex flex-col items-center justify-center min-w-[60px] p-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700">
                                            <Stethoscope className="w-3 h-3 mb-1 opacity-50" />
                                            <span className="font-bold text-xs">{formatNumber(item.stats?.medical)}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-middle text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-[10px] font-medium border border-gray-200">
                                                <Users className="w-3 h-3 text-gray-400"/>
                                                {item.createdBy || 'Unknown'}
                                            </div>
                                            {item.updatedBy && item.updatedBy !== item.createdBy && (
                                                <span className="text-[9px] text-gray-400 mt-1 italic">
                                                    แก้ไขโดย: {item.updatedBy}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {canEdit && (
                                        <td className="px-6 py-4 align-middle text-center">
                                            <div className="flex justify-center items-center gap-1">
                                                <button 
                                                    onClick={() => handlePrint(item)} 
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                    title="พิมพ์"
                                                >
                                                    <Printer className="w-4 h-4"/>
                                                </button>
                                                <button 
                                                    onClick={() => onEdit(item)} 
                                                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200"
                                                    title="แก้ไข"
                                                >
                                                    <Pencil className="w-4 h-4"/>
                                                </button>
                                                <button 
                                                    onClick={() => onDelete(item._id)} 
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                    title="ลบ"
                                                >
                                                    <X className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={canEdit ? 10 : 9} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <div className="p-4 bg-gray-50 rounded-full mb-3">
                                            <Database className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">ไม่พบข้อมูลในระบบ</p>
                                        <p className="text-[10px] text-gray-400 mt-1">เริ่มบันทึกข้อมูลใหม่ได้เลย</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {data.length > 0 && (
                        <tfoot className="bg-gray-50/80 border-t-2 border-gray-200 font-bold text-gray-700 sticky bottom-0 z-10">
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-right text-xs">รวมทั้งหมด (จากทุกหน้า):</td>
                                <td className="px-6 py-4 text-center text-blue-700 text-xs">{formatNumber(totals.vaccine)}</td>
                                <td className="px-6 py-4 text-center text-orange-700 text-xs">{formatNumber(totals.sterilize)}</td>
                                <td className="px-6 py-4 text-center text-teal-700 text-xs">{formatNumber(totals.register)}</td>
                                <td className="px-6 py-4 text-center text-purple-700 text-xs">{formatNumber(totals.microchip)}</td>
                                <td className="px-6 py-4 text-center text-emerald-700 text-xs">{formatNumber(totals.medical)}</td>
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