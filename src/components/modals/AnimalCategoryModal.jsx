import React, { useState, useEffect } from 'react';
import { X, PawPrint, Plus, Trash2, Loader2 } from 'lucide-react';

const AnimalCategoryModal = ({ isOpen, onClose, apiBaseUrl, token, onToast }) => {
    const [categories, setCategories] = useState([]);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) fetchCategories();
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiBaseUrl}/api/animal-categories`);
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            onToast('error', 'ไม่สามารถโหลดข้อมูลได้');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            const res = await fetch(`${apiBaseUrl}/api/animal-categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: newName.trim() })
            });
            if (res.ok) {
                onToast('success', 'เพิ่มหมวดหมู่สัตว์สำเร็จ');
                setNewName('');
                fetchCategories();
            } else {
                const err = await res.json();
                onToast('error', err.message || 'เพิ่มไม่สำเร็จ');
            }
        } catch (error) {
            onToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`ยืนยันการลบหมวดหมู่ "${name}" ?`)) return;
        try {
            const res = await fetch(`${apiBaseUrl}/api/animal-categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                onToast('success', 'ลบหมวดหมู่สำเร็จ');
                fetchCategories();
            } else {
                onToast('error', 'ลบไม่สำเร็จ (อาจไม่มีสิทธิ์)');
            }
        } catch (error) {
            onToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[6000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <PawPrint className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">จัดการหมวดหมู่สัตว์</h2>
                            <p className="text-xs text-slate-500">เพิ่มหรือลดประเภทสัตว์ในระบบฐานข้อมูล</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                        <input type="text" placeholder="พิมพ์ชื่อหมวดหมู่..." value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
                        <button type="submit" disabled={!newName.trim()} className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1"><Plus className="w-4 h-4"/> เพิ่ม</button>
                    </form>

                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                        {loading ? (
                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-orange-500"/></div>
                        ) : categories.map((cat) => (
                            <div key={cat._id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm group">
                                <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                                <button onClick={() => handleDelete(cat._id, cat.name)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-all p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AnimalCategoryModal;