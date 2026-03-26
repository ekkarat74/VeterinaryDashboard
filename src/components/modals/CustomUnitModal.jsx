import React, { useState, useEffect } from 'react';
import { X, Building2, Plus, Edit2, Trash2, Check, Loader2 } from 'lucide-react';

const CustomUnitModal = ({ isOpen, onClose, apiBaseUrl, token, onToast }) => {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        if (isOpen) fetchUnits();
    }, [isOpen]);

    const fetchUnits = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiBaseUrl}/api/custom-units`);
            const data = await res.json();
            setUnits(Array.isArray(data) ? data : []);
        } catch (error) {
            onToast('error', 'ไม่สามารถโหลดข้อมูลหน่วยงานได้');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            const res = await fetch(`${apiBaseUrl}/api/custom-units`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: newName.trim() })
            });
            if (res.ok) {
                onToast('success', 'เพิ่มหน่วยงานสำเร็จ');
                setNewName('');
                fetchUnits();
            } else {
                const err = await res.json();
                onToast('error', err.message || 'เพิ่มไม่สำเร็จ');
            }
        } catch (error) {
            onToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const handleUpdate = async (id) => {
        if (!editName.trim()) return;
        try {
            const res = await fetch(`${apiBaseUrl}/api/custom-units/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: editName.trim() })
            });
            if (res.ok) {
                onToast('success', 'แก้ไขหน่วยงานสำเร็จ');
                setEditingId(null);
                fetchUnits();
            } else {
                onToast('error', 'แก้ไขไม่สำเร็จ');
            }
        } catch (error) {
            onToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`ยืนยันการลบหน่วยงาน "${name}" ?`)) return;
        try {
            const res = await fetch(`${apiBaseUrl}/api/custom-units/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                onToast('success', 'ลบหน่วยงานสำเร็จ');
                fetchUnits();
            } else {
                onToast('error', 'ลบไม่สำเร็จ');
            }
        } catch (error) {
            onToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[6000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">จัดการรายชื่อหน่วยงาน</h2>
                            <p className="text-xs text-slate-500">เพิ่มหรือแก้ไขหน่วยงานที่ใช้ในระบบ</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form เพิ่มหน่วยงาน */}
                <div className="p-6 border-b border-slate-100 shrink-0">
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="พิมพ์ชื่อหน่วยงานใหม่..." 
                            value={newName} 
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={!newName.trim()}
                            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> เพิ่ม
                        </button>
                    </form>
                </div>

                {/* List หน่วยงาน */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
                    ) : units.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">ยังไม่มีข้อมูลหน่วยงานแบบกำหนดเอง</div>
                    ) : (
                        <div className="space-y-2">
                            {units.map((unit) => (
                                <div key={unit._id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 transition-colors group">
                                    {editingId === unit._id ? (
                                        <div className="flex items-center gap-2 w-full">
                                            <input 
                                                type="text" 
                                                value={editName} 
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="flex-1 px-3 py-1.5 border border-indigo-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                autoFocus
                                            />
                                            <button onClick={() => handleUpdate(unit._id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-sm font-medium text-slate-700 truncate pl-2">{unit.name}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => { setEditingId(unit._id); setEditName(unit.name); }} 
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(unit._id, unit.name)} 
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomUnitModal;