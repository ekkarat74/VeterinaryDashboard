import { Database, Trash2, Users, Pencil, X } from 'lucide-react';

const MainDataTable = ({ 
    data, 
    canEdit, 
    isSuperAdmin, 
    onClearAll, 
    onEdit, 
    onDelete, 
    onViewImage 
}) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Database className="w-5 h-5 text-slate-600" /> ข้อมูลทั้งหมด
                </h2>
                {isSuperAdmin && data.length > 0 && (
                    <button onClick={onClearAll} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg border border-red-200">
                        <Trash2 className="w-4 h-4" /> ล้างข้อมูลทั้งหมด
                    </button>
                )}
            </div>
            <div className="overflow-auto max-h-[600px] custom-scrollbar border border-slate-100 rounded-lg relative">
                <table className="min-w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 whitespace-nowrap">วันที่</th>
                            <th className="px-4 py-3 whitespace-nowrap">สถานที่</th>
                            <th className="px-4 py-3 text-center">รูปภาพ</th>
                            <th className="px-4 py-3 text-center">วัคซีน</th>
                            <th className="px-4 py-3 text-center">ทำหมัน</th>
                            <th className="px-4 py-3 text-center">ผู้บันทึก</th>
                            {canEdit && <th className="px-4 py-3 text-center w-28">จัดการ</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((item) => (
                            <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 text-slate-600">{item.date}</td>
                                <td className="px-4 py-3">
                                    <div className="font-bold text-slate-800">{item.location}</div>
                                    <div className="text-xs text-slate-500">{item.district}</div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {item.imageUrl ? 
                                        <img src={item.imageUrl} alt="preview" className="w-10 h-10 object-cover rounded mx-auto cursor-pointer hover:scale-150 transition-transform" onClick={()=>onViewImage(item.imageUrl)}/> 
                                        : <span className="text-slate-300">-</span>
                                    }
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-blue-600">{item.stats.vaccine}</td>
                                <td className="px-4 py-3 text-center font-bold text-orange-500">{item.stats.sterilize}</td>
                                <td className="px-4 py-3 text-center">
                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                        <Users className="w-3 h-3 mr-1 text-slate-400"/>
                                        {item.createdBy || '-'}
                                    </div>
                                    {item.updatedBy && item.updatedBy !== item.createdBy && (
                                        <div className="text-[10px] text-slate-400 mt-1">
                                            แก้ไข: {item.updatedBy}
                                        </div>
                                    )}
                                </td>
                                {canEdit && (
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => onEdit(item)} className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg"><Pencil className="w-4 h-4"/></button>
                                            <button onClick={() => onDelete(item._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X className="w-4 h-4"/></button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MainDataTable;