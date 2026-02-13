import React from 'react';
import { Database, Trash2, Users, Pencil, X, MapPin, Calendar, ImageIcon, Syringe, Scissors } from 'lucide-react';

const MainDataTable = ({ 
    data = [], 
    canEdit, 
    isSuperAdmin, 
    onClearAll, 
    onEdit, 
    onDelete, 
    onViewImage 
}) => {

    // Helper สำหรับจัดรูปแบบตัวเลข (ถ้าต้องการ)
    const formatNumber = (num) => num ? num.toLocaleString() : '0';

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mt-8 overflow-hidden">
            {/* Header Section */}
            <div className="px-6 py-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Database className="w-5 h-5" />
                        </div>
                        ฐานข้อมูลทั้งหมด
                        <span className="ml-2 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                            {data.length} รายการ
                        </span>
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 pl-11">จัดการข้อมูลการลงพื้นที่และสถิติ</p>
                </div>

                {isSuperAdmin && data.length > 0 && (
                    <button 
                        onClick={onClearAll} 
                        className="group flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 text-sm font-medium rounded-xl border border-gray-200 hover:border-red-200 transition-all duration-200 shadow-sm"
                    >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
                        ล้างข้อมูล
                    </button>
                )}
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap w-32">วันที่</th>
                            <th className="px-6 py-4 whitespace-nowrap min-w-[200px]">สถานที่</th>
                            <th className="px-6 py-4 text-center w-24">รูปภาพ</th>
                            <th className="px-6 py-4 text-center w-24">วัคซีน</th>
                            <th className="px-6 py-4 text-center w-24">ทำหมัน</th>
                            <th className="px-6 py-4 text-center w-32">ผู้บันทึก</th>
                            {canEdit && <th className="px-6 py-4 text-center w-28">จัดการ</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.length > 0 ? (
                            data.map((item) => (
                                <tr key={item._id} className="hover:bg-indigo-50/30 transition-colors group">
                                    {/* วันที่ */}
                                    <td className="px-6 py-4 text-gray-500 align-middle">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="font-mono text-sm">{item.date}</span>
                                        </div>
                                    </td>

                                    {/* สถานที่ */}
                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 min-w-[16px]">
                                                <MapPin className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-800 text-base">{item.location}</div>
                                                <div className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded mt-1">
                                                    {item.district}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* รูปภาพ */}
                                    <td className="px-6 py-4 align-middle text-center">
                                        {item.imageUrl ? (
                                            <div className="relative w-12 h-12 mx-auto">
                                                <img 
                                                    src={item.imageUrl} 
                                                    alt="preview" 
                                                    onClick={() => onViewImage(item.imageUrl)}
                                                    className="w-full h-full object-cover rounded-lg border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-all hover:scale-105" 
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 mx-auto rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                    </td>

                                    {/* วัคซีน */}
                                    <td className="px-6 py-4 align-middle text-center">
                                        <div className="inline-flex flex-col items-center justify-center min-w-[60px] p-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700">
                                            <Syringe className="w-3 h-3 mb-1 opacity-50" />
                                            <span className="font-bold text-sm">{formatNumber(item.stats.vaccine)}</span>
                                        </div>
                                    </td>

                                    {/* ทำหมัน */}
                                    <td className="px-6 py-4 align-middle text-center">
                                        <div className="inline-flex flex-col items-center justify-center min-w-[60px] p-1.5 rounded-lg bg-orange-50 border border-orange-100 text-orange-700">
                                            <Scissors className="w-3 h-3 mb-1 opacity-50" />
                                            <span className="font-bold text-sm">{formatNumber(item.stats.sterilize)}</span>
                                        </div>
                                    </td>

                                    {/* ผู้บันทึก */}
                                    <td className="px-6 py-4 align-middle text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                                                <Users className="w-3 h-3 text-gray-400"/>
                                                {item.createdBy || 'Unknown'}
                                            </div>
                                            {item.updatedBy && item.updatedBy !== item.createdBy && (
                                                <span className="text-[10px] text-gray-400 mt-1 italic">
                                                    แก้ไขโดย: {item.updatedBy}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Action Buttons */}
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
                            /* Empty State */
                            <tr>
                                <td colSpan={canEdit ? 7 : 6} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <div className="p-4 bg-gray-50 rounded-full mb-3">
                                            <Database className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-gray-500 font-medium">ไม่พบข้อมูลในระบบ</p>
                                        <p className="text-xs text-gray-400 mt-1">เริ่มบันทึกข้อมูลใหม่ได้เลย</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Footer Summary (Optional) */}
            {data.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
                     <span>แสดงข้อมูลล่าสุด {Math.min(data.length, 50)} รายการ</span>
                     {/* ตรงนี้สามารถเพิ่ม Pagination ได้ในอนาคต */}
                </div>
            )}
        </div>
    );
};

export default MainDataTable;