import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Palette } from 'lucide-react';

const ColorModal = ({ isOpen, onClose, apiBaseUrl, token, onToast }) => {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState('');

    useEffect(() => {
        if (isOpen) fetchItems();
    }, [isOpen]);

    const fetchItems = async () => {
        try {
            const res = await fetch(`${apiBaseUrl}/api/colors`);
            if (res.ok) setItems(await res.json());
        } catch (err) { onToast('error', 'โหลดข้อมูลสีไม่สำเร็จ'); }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        try {
            const res = await fetch(`${apiBaseUrl}/api/colors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: newItem.trim() })
            });
            if (res.ok) {
                setNewItem('');
                fetchItems();
                onToast('success', 'เพิ่มสีสำเร็จ');
            } else {
                const data = await res.json();
                onToast('error', data.message || 'เพิ่มไม่สำเร็จ');
            }
        } catch (err) { onToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('⚠️ ยืนยันการลบสีนี้?')) return;
        try {
            const res = await fetch(`${apiBaseUrl}/api/colors/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchItems();
                onToast('success', 'ลบสีสำเร็จ');
            }
        } catch (err) { onToast('error', 'ลบข้อมูลไม่สำเร็จ'); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-indigo-500" /> จัดการสีสัตว์
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <input type="text" placeholder="พิมพ์ชื่อสีใหม่..." className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"><Plus className="w-4 h-4"/> เพิ่ม</button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {items.length > 0 ? items.map((item, index) => (
                        <div key={item._id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-100 transition-colors shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{index + 1}</span>
                                <span className="font-medium text-slate-700">{item.name}</span>
                            </div>
                            <button onClick={() => handleDelete(item._id)} className="p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-slate-400 text-sm">ยังไม่มีข้อมูลสี</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ColorModal;