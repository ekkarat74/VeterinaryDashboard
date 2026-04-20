import React, { useState } from 'react';
import { 
    Database, Trash2, Users, Pencil, X, MapPin, Calendar, 
    ImageIcon, Syringe, Scissors, QrCode, Stethoscope, FileText
} from 'lucide-react';

// ---------------------------------------------------------------------------
// 1. กำหนด Type (Interfaces) สำหรับข้อมูลและ Props
// ---------------------------------------------------------------------------

export interface ItemStats {
    vaccine?: number;
    sterilize?: number;
    register?: number;
    microchip?: number;
    medical?: number;
}

export interface DataItem {
    _id: string; // หากใช้ ID เป็นตัวเลขให้เปลี่ยนเป็น number
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

// ---------------------------------------------------------------------------
// 2. Component หลัก
// ---------------------------------------------------------------------------

const MainDataTable: React.FC<MainDataTableProps> = ({ 
    data = [], 
    canEdit = false, 
    isSuperAdmin = false, 
    onClearAll, 
    onEdit, 
    onDelete, 
    onViewImage 
}) => {
    // --- State สำหรับ Pagination ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // คำนวณจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(data.length / itemsPerPage);

    // ดึงข้อมูลเฉพาะหน้าปัจจุบัน
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = data.slice(startIndex, startIndex + itemsPerPage);

    // ฟังก์ชันจัดการการเปลี่ยนหน้า
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const formatNumber = (num?: number | string | null): string => 
        num ? Number(num).toLocaleString() : '0';

    // คำนวณผลรวมจากข้อมูล *ทั้งหมด* const totals = data.reduce((acc, item) => ({
        vaccine: acc.vaccine + (Number(item.stats?.vaccine) || 0),
        sterilize: acc.sterilize + (Number(item.stats?.sterilize) || 0),
        register: acc.register + (Number(item.stats?.register) || 0),
        microchip: acc.microchip + (Number(item.stats?.microchip) || 0),
        medical: acc.medical + (Number(item.stats?.medical) || 0),
    }), { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 });

    // สร้าง array ของหมายเลขหน้าเพื่อเอาไป map เป็นปุ่ม
    const getPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mt-8 overflow-hidden">
            {/* Header Section */}
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

            {/* Table Section */}
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
                            {canEdit && <th className="px-6 py-4 text-center w-28">จัดการ</th>}
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
            
            {/* Pagination & Footer Section */}
            {data.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-[11px] text-gray-500 font-medium">
                        แสดงข้อมูล {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, data.length)} จากทั้งหมด {data.length} รายการ
                    </span>
                    
                    {/* ปุ่มกด Pagination แบบแนบชิดกัน */}
                    {totalPages > 1 && (
                        <div className="inline-flex -space-x-px rounded-md shadow-sm">
                            {/* ปุ่ม First */}
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 rounded-l-md border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                First
                            </button>
                            
                            {/* ปุ่ม << (ย้อนกลับ) */}
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                &laquo;
                            </button>
                            
                            {/* ปุ่มตัวเลขหน้า */}
                            {getPageNumbers().map(number => (
                                <button
                                    key={number}
                                    onClick={() => handlePageChange(number)}
                                    className={`min-w-[40px] px-3 py-2 border text-sm font-medium transition-colors ${
                                        currentPage === number
                                            ? 'z-10 bg-indigo-500 border-indigo-500 text-white' // สีตอน Active (สีน้ำเงิน)
                                            : 'border-gray-200 bg-white text-indigo-600 hover:bg-indigo-50' // สีตอน Inactive
                                    }`}
                                >
                                    {number}
                                </button>
                            ))}

                            {/* ปุ่ม >> (ถัดไป) */}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                &raquo;
                            </button>
                            
                            {/* ปุ่ม Last */}
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 rounded-r-md border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Last
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MainDataTable;