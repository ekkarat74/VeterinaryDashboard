import React from 'react';
import { 
    Database, Trash2, Users, Pencil, X, MapPin, Calendar, 
    ImageIcon, Syringe, Scissors, QrCode, Stethoscope, FileText
} from 'lucide-react';

const MainDataTable = ({ 
    data = [], 
    canEdit, 
    isSuperAdmin, 
    onClearAll, 
    onEdit, 
    onDelete, 
    onViewImage 
}) => {

    const formatNumber = (num) => num ? num.toLocaleString() : '0';
    const totals = data.reduce((acc, item) => ({
        vaccine: acc.vaccine + (Number(item.stats?.vaccine) || 0),
        sterilize: acc.sterilize + (Number(item.stats?.sterilize) || 0),
        register: acc.register + (Number(item.stats?.register) || 0),
        microchip: acc.microchip + (Number(item.stats?.microchip) || 0),
        medical: acc.medical + (Number(item.stats?.medical) || 0),
    }), { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 });

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
                        {data.length > 0 ? (
                            data.map((item) => (
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
                                <td colSpan="3" className="px-6 py-4 text-right text-xs">รวมทั้งหมด:</td>
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
            
            {data.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-500 flex justify-between items-center">
                     <span>แสดงข้อมูลทั้งหมด {data.length} รายการ</span>
                </div>
            )}
        </div>
    );
};

export default MainDataTable;