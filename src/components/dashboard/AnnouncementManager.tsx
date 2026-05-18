import React, { useState, useEffect } from 'react';
import { Megaphone, Edit3, X, ChevronUp, ChevronDown, Trash2, Plus, Save } from 'lucide-react';

export interface Announcement {
    id: number;
    icon: string;
    text: string;
    isActive: boolean;
}

interface AnnouncementBarProps {
    announcements: Announcement[];
    onEditClick: () => void;
    canEdit: boolean | any;
}

interface AnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialAnnouncements: Announcement[];
    onSave: (items: Announcement[]) => void;
}

export const AnnouncementBar = React.memo(({ announcements, onEditClick, canEdit }: AnnouncementBarProps) => {
    const activeAnnouncements = announcements.filter(a => a.isActive);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (activeAnnouncements.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % activeAnnouncements.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [activeAnnouncements.length]);

    useEffect(() => {
        if (currentIndex >= activeAnnouncements.length) {
            setCurrentIndex(0);
        }
    }, [activeAnnouncements.length, currentIndex]);

    if (activeAnnouncements.length === 0 && !canEdit) return null;

    const safeIndex = currentIndex >= activeAnnouncements.length ? 0 : currentIndex;
    const currentItem = activeAnnouncements[safeIndex];

    return (
        <div className="bg-[#2D1B6B] text-white flex items-center px-4 text-xs relative z-40 shadow-md shrink-0 w-full h-11 overflow-hidden">
            <div className="bg-[#6B4BFA] text-white px-3 py-1 rounded-full font-bold text-xs mr-3 shrink-0 z-10 flex items-center gap-2 shadow-sm">
                <Megaphone className="w-3 h-3" /> PREVIEW
            </div>
            
            <div className="flex-1 relative h-full flex items-center overflow-hidden">
                {currentItem && (
                    <div 
                        key={currentItem.id + '-' + safeIndex} 
                        className={`flex items-center gap-2 absolute w-full ${activeAnnouncements.length > 1 ? 'animate-slide-left' : ''}`}
                    >
                        <span className="shrink-0">{currentItem.icon}</span>
                        <span className="truncate">{currentItem.text}</span>
                    </div>
                )}
            </div>

            {canEdit && (
                <button onClick={onEditClick} className="ml-3 p-1.5 hover:bg-white/20 rounded-lg transition-colors shrink-0 text-white/80 hover:text-white" title="แก้ไขข้อความแถบเลื่อน">
                    <Edit3 className="w-4 h-4" />
                </button>
            )}
        </div>
    );
});

export const AnnouncementModal = React.memo(({ isOpen, onClose, initialAnnouncements, onSave }: AnnouncementModalProps) => {
    const [items, setItems] = useState<Announcement[]>([]);

    useEffect(() => {
        if (isOpen) setItems([...initialAnnouncements]);
    }, [isOpen, initialAnnouncements]);

    if (!isOpen) return null;

    const handleToggle = (id: number) => {
        setItems(items.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item));
    };

    const handleChangeText = (id: number, text: string) => {
        setItems(items.map(item => item.id === id ? { ...item, text } : item));
    };

    const handleChangeIcon = (id: number, icon: string) => {
        setItems(items.map(item => item.id === id ? { ...item, icon } : item));
    };

    const handleDelete = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleAdd = () => {
        setItems([...items, { id: Date.now(), icon: '📌', text: 'ข้อความใหม่', isActive: true }]);
    };

    return (
        <div className="fixed inset-0 z-[6000] flex justify-center items-end sm:items-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white w-full sm:w-[500px] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#6B4BFA] flex items-center justify-center text-white shadow-md">
                            <Edit3 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">แก้ไขข้อความแถบเลื่อน</h2>
                            <p className="text-xs text-slate-500">จัดการข้อความประชาสัมพันธ์ด้านบน</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Body List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-slate-600">รายการข้อความ ({items.length})</span>
                    </div>
                    
                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={item.id} className={`flex items-center gap-2 p-3 bg-white border ${item.isActive ? 'border-purple-100 shadow-sm' : 'border-slate-200 opacity-60'} rounded-xl transition-all`}>
                                <div className="flex flex-col text-slate-300 hover:text-slate-500 cursor-grab px-1">
                                    <ChevronUp className="w-4 h-4 -mb-1" />
                                    <ChevronDown className="w-4 h-4 -mt-1" />
                                </div>
                                
                                <input type="text" value={item.icon} onChange={(e) => handleChangeIcon(item.id, e.target.value)} className="w-8 text-center bg-slate-50 border border-slate-200 rounded-md py-1 text-sm outline-none focus:border-purple-400" />
                                
                                <input type="text" value={item.text} onChange={(e) => handleChangeText(item.id, e.target.value)} className="flex-1 bg-transparent border-none text-sm text-slate-700 outline-none placeholder-slate-400 focus:ring-0" placeholder="พิมพ์ข้อความ..." />
                                
                                <div className="flex items-center gap-2 ml-2">
                                    <button onClick={() => handleToggle(item.id)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.isActive ? 'bg-[#6B4BFA]' : 'bg-slate-200'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100 bg-white"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button onClick={handleAdd} className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:text-[#6B4BFA] hover:border-[#6B4BFA] hover:bg-purple-50 transition-colors flex justify-center items-center gap-2">
                        <Plus className="w-4 h-4" /> เพิ่มข้อความใหม่
                    </button>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 shrink-0">
                    <button onClick={onClose} className="py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">ยกเลิก</button>
                    <button onClick={() => { onSave(items); onClose(); }} className="py-2.5 rounded-xl font-bold text-white bg-[#6B4BFA] hover:bg-[#5A3EE0] shadow-md shadow-purple-200 flex justify-center items-center gap-2 transition-colors"><Save className="w-4 h-4"/> บันทึกทั้งหมด</button>
                </div>
            </div>
        </div>
    );
});

const AnnouncementManager = React.memo(({ canEdit, addToast }: { canEdit: any, addToast: any }) => {
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    
    const [announcements, setAnnouncements] = useState<Announcement[]>([
        { id: 0, icon: '👋', text: 'ยินดีต้อนรับสู่ระบบรายงานออกหน่วยสัตวแพทย์เคลื่อนที่ - ติดตามข้อมูลวัคซีนและทำหมันสุนัข-แมว', isActive: true },
        { id: 1, icon: '💉', text: 'บริการฉีดวัคซีนสัตว์เลี้ยง ฟรี! ทุกวันอังคาร-ศุกร์', isActive: true },
        { id: 2, icon: '🏥', text: 'ทำหมันสุนัข-แมว ฟรี! รับจำนวนจำกัด โทรจองล่วงหน้า', isActive: true },
        { id: 3, icon: '🩺', text: 'ตรวจสุขภาพสัตว์เลี้ยงฟรี ทุกวันเสาร์-อาทิตย์', isActive: true },
        { id: 4, icon: '📞', text: 'แจ้งสัตว์จรจัดบาดเจ็บ โทร 1119 ตลอด 24 ชั่วโมง', isActive: true },
        { id: 5, icon: '🚑', text: 'หน่วยสัตวแพทย์เคลื่อนที่ พร้อมให้บริการทุกพื้นที่', isActive: true }
    ]);

    const handleSaveAnnouncements = (newAnnouncements: Announcement[]) => {
        setAnnouncements(newAnnouncements);
        addToast('success', '✅ บันทึกข้อความแถบเลื่อนเรียบร้อยแล้ว');
    };

    return (
        <>
            <AnnouncementBar 
                announcements={announcements} 
                onEditClick={() => setIsAnnouncementModalOpen(true)} 
                canEdit={canEdit} 
            />
            <AnnouncementModal 
                isOpen={isAnnouncementModalOpen} 
                onClose={() => setIsAnnouncementModalOpen(false)} 
                initialAnnouncements={announcements}
                onSave={handleSaveAnnouncements}
            />
        </>
    );
});

export default AnnouncementManager;