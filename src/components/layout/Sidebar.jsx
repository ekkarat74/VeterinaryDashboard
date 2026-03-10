import React from 'react';
import { 
    Activity, Unlock, Settings, ChevronDown, FileText, Users, 
    Database, Download, Zap, List, CalendarDays, AlertTriangle, 
    Plus, Key, LogOut, Siren, ChevronLeft, ChevronRight, X, LayoutDashboard
} from 'lucide-react';

const Sidebar = ({ 
    user, 
    isSuperAdmin, 
    canEdit, 
    isSystemMenuOpen, 
    setIsSystemMenuOpen,
    onLogin,
    onLogout,
    onChangePassword,
    onOpenLog,
    onOpenUserMgmt,
    onOpenBackup,
    onOpenCsvOutbreak,
    onOpenCsvReport,
    onGenerateMock,
    onOpenMeetingList,
    onOpenCalendar,
    onOpenMeetingCalendar,
    onOpenMeetingModal,
    onOpenAddOutbreak,
    onOpenAddData,
    isMagaAdmin,
    tabsConfig,
    toggleTab,
    activeTab, 
    setActiveTab, 
    isSidebarCollapsed, 
    setIsSidebarCollapsed,
    isMobileMenuOpen, 
    setIsMobileMenuOpen 
}) => {
    
    // 💡 ถ้าเปิดบนมือถือ ให้ถือว่าไม่ได้ย่อเมนู (เพื่อให้แสดงผลเต็มตา)
    const isCollapsed = isSidebarCollapsed && !isMobileMenuOpen;

    // 💡 ฟังก์ชันตัวช่วย: ทำคำสั่งที่ได้รับมา แล้ว "ปิด Sidebar บนมือถือ" อัตโนมัติ
    const handleAction = (callback) => {
        if (callback) callback();
        setIsMobileMenuOpen(false); // สั่งปิดเมนูมือถือเสมอ
    };

    return (
        <>
            {/* 🟢 Mobile Backdrop (แผ่นใสๆ สีดำกั้นฉากหลังตอนเปิดเมนูบนมือถือ) */}
            {isMobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-slate-900/50 z-[4999] backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside className={`
                fixed md:relative top-0 left-0 h-[100dvh] z-[5000] md:z-auto
                bg-white border-r border-slate-200 flex flex-col shrink-0
                transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'} 
                ${isCollapsed ? 'md:w-20' : 'md:w-64'}
            `}>
                
                {/* --- 1. Logo & Branding --- */}
                <div className={`h-16 flex items-center px-4 border-b border-slate-200 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {/* โชว์ Logo เฉพาะตอนขยาย หรือเปิดบนมือถือ */}
                    <div className={`flex items-center gap-3 overflow-hidden transition-opacity duration-300 ${isCollapsed ? 'hidden' : 'flex'}`}>
                        <img 
                            src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" 
                            alt="Logo" 
                            className="w-8 h-8 object-cover rounded-lg border border-slate-200 shrink-0" 
                        />
                        <div className="flex flex-col whitespace-nowrap">
                            <h1 className="text-sm font-bold text-slate-800">ระบบสัตวแพทย์</h1>
                            <p className="text-[10px] font-medium text-slate-500 uppercase">Animal Control</p>
                        </div>
                    </div>

                    {/* ปุ่ม ย่อ/ขยาย สำหรับ Desktop */}
                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                        className="hidden md:flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                    >
                        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>

                    {/* ปุ่ม ปิด สำหรับ Mobile */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className="md:hidden flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* --- 2. Menu Items --- */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6 custom-scrollbar">
                    
                    {/* 🟢 หมวดหมู่ที่ 1: แดชบอร์ด & ข้อมูล */}
                    <div className="space-y-1">
                        {!isCollapsed && (
                            <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                แดชบอร์ด
                            </p>
                        )}
                        
                        {(user || tabsConfig?.overview) && (
                            <button onClick={() => handleAction(() => setActiveTab('overview'))} title="ภาพรวมสถิติ" 
                                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium transition-colors
                                ${activeTab === 'overview' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                                <Activity className={`w-5 h-5 shrink-0 ${activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                {!isCollapsed && <span className="whitespace-nowrap">ภาพรวมสถิติ</span>}
                            </button>
                        )}
                        {(user || tabsConfig?.outbreak) && (
                            <button onClick={() => handleAction(() => setActiveTab('outbreak'))} title="จัดการจุดเสี่ยง" 
                                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium transition-colors
                                ${activeTab === 'outbreak' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                                <Siren className={`w-5 h-5 shrink-0 ${activeTab === 'outbreak' ? 'text-rose-600' : 'text-slate-400'}`} />
                                {!isCollapsed && <span className="whitespace-nowrap">จัดการจุดเสี่ยง</span>}
                            </button>
                        )}
                        {(user || tabsConfig?.database) && (
                            <button onClick={() => handleAction(() => setActiveTab('database'))} title="ฐานข้อมูลบริการ" 
                                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium transition-colors
                                ${activeTab === 'database' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                                <Database className={`w-5 h-5 shrink-0 ${activeTab === 'database' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                {!isCollapsed && <span className="whitespace-nowrap">ฐานข้อมูลบริการ</span>}
                            </button>
                        )}
                    </div>

                    {/* 🟢 หมวดหมู่ที่ 2: ปฏิทิน & นัดหมาย */}
                    {user && (
                        <div className="space-y-1">
                            {!isCollapsed && (
                                <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                    ปฏิทิน & นัดหมาย
                                </p>
                            )}
                            <button onClick={() => handleAction(onOpenMeetingList)} title="ประวัติประชุม" className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors`}>
                                <List className="w-5 h-5 shrink-0 text-slate-400" />
                                {!isCollapsed && <span className="whitespace-nowrap">ประวัติประชุม</span>}
                            </button>
                            <button onClick={() => handleAction(onOpenCalendar)} title="แผนออกหน่วย" className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors`}>
                                <CalendarDays className="w-5 h-5 shrink-0 text-slate-400" />
                                {!isCollapsed && <span className="whitespace-nowrap">แผนออกหน่วย</span>}
                            </button>
                            <button onClick={() => handleAction(onOpenMeetingCalendar)} title="ปฏิทินประชุม" className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors`}>
                                <CalendarDays className="w-5 h-5 shrink-0 text-slate-400" />
                                {!isCollapsed && <span className="whitespace-nowrap">ปฏิทินประชุม</span>}
                            </button>
                        </div>
                    )}

                    {/* 🟢 หมวดหมู่ที่ 3: ตั้งค่าระบบ */}
                    {user && (isSuperAdmin || canEdit) && (
                        <div className="space-y-1">
                            {!isCollapsed ? (
                                <>
                                    <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                        การตั้งค่าระบบ
                                    </p>
                                    <button onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)} className="w-full flex items-center justify-between px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Settings className="w-5 h-5 shrink-0 text-slate-400" />
                                            <span className="text-sm font-medium whitespace-nowrap">เครื่องมือระบบ</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${isSystemMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {isSystemMenuOpen && (
                                        <div className="pl-11 pr-3 py-2 space-y-2 animate-in fade-in slide-in-from-top-2">
                                            {isMagaAdmin && (
                                                <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <p className="text-xs font-semibold text-slate-500 mb-2">แสดงแท็บ (Menu)</p>
                                                    {['overview', 'outbreak', 'database'].map(tab => (
                                                        <label key={tab} className="flex items-center justify-between py-1.5 cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900">
                                                            <span>{tab === 'overview' ? 'ภาพรวม' : tab === 'outbreak' ? 'จุดเสี่ยง' : 'ฐานข้อมูล'}</span>
                                                            <input type="checkbox" checked={tabsConfig?.[tab] || false} onChange={() => toggleTab(tab)} className="w-3.5 h-3.5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {isSuperAdmin && (
                                                <>
                                                    <button onClick={() => handleAction(onOpenLog)} className="w-full text-left py-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-2"><FileText className="w-4 h-4 shrink-0"/> ประวัติใช้งาน</button>
                                                    <button onClick={() => handleAction(onOpenUserMgmt)} className="w-full text-left py-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-2"><Users className="w-4 h-4 shrink-0"/> จัดการผู้ใช้</button>
                                                </>
                                            )}
                                            {canEdit && (
                                                <>
                                                    <button onClick={() => handleAction(onOpenBackup)} className="w-full text-left py-1.5 text-sm font-medium text-slate-500 hover:text-emerald-600 flex items-center gap-2"><Database className="w-4 h-4 shrink-0"/> สำรองข้อมูล</button>
                                                    <button onClick={() => handleAction(onOpenCsvOutbreak)} className="w-full text-left py-1.5 text-sm font-medium text-slate-500 hover:text-rose-600 flex items-center gap-2"><Download className="w-4 h-4 shrink-0"/> นำเข้า CSV ระบาด</button>
                                                    <button onClick={() => handleAction(onOpenCsvReport)} className="w-full text-left py-1.5 text-sm font-medium text-slate-500 hover:text-emerald-600 flex items-center gap-2"><Download className="w-4 h-4 shrink-0"/> นำเข้า CSV บริการ</button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <button 
                                    onClick={() => {
                                        setIsSidebarCollapsed(false);
                                        setIsSystemMenuOpen(true);
                                    }} 
                                    title="เครื่องมือระบบ" 
                                    className="w-full flex justify-center p-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                >
                                    <Settings className="w-5 h-5 shrink-0" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* --- 🟢 หมวดหมู่ที่ 4: ดำเนินการด่วน (Action Buttons) --- */}
                {user && canEdit && (
                    <div className={`px-4 pb-4 space-y-2 shrink-0 border-t border-slate-100 pt-4 bg-white ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                        <button onClick={() => handleAction(onOpenAddOutbreak)} title="แจ้งโรคระบาด" 
                            className={`flex items-center justify-center gap-2 ${isCollapsed ? 'w-10 h-10 p-0 rounded-xl' : 'w-full px-4 py-2.5 rounded-xl'} font-semibold text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-200`}>
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">แจ้งโรคระบาด</span>}
                        </button>
                        <button onClick={() => handleAction(onOpenAddData)} title="เพิ่มข้อมูลบริการ" 
                            className={`flex items-center justify-center gap-2 ${isCollapsed ? 'w-10 h-10 p-0 rounded-xl' : 'w-full px-4 py-2.5 rounded-xl'} font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm hover:shadow`}>
                            <Plus className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">เพิ่มข้อมูลบริการ</span>}
                        </button>
                    </div>
                )}

                {/* --- 3. Footer / Profile Section --- */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                    {!user ? (
                        <button onClick={() => handleAction(onLogin)} title="เข้าสู่ระบบ" className={`w-full flex items-center justify-center gap-2 ${isCollapsed ? 'p-2.5' : 'px-4 py-2.5'} bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors`}>
                            <Unlock className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">เข้าสู่ระบบ</span>}
                        </button>
                    ) : (
                        <div className={`flex items-center justify-between gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
                            {!isCollapsed && (
                                <div className="flex items-center gap-3 w-full overflow-hidden">
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-200">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold text-slate-800 truncate">{user.username}</span>
                                        <span className="text-[10px] font-medium text-slate-500 uppercase truncate">{user.role}</span>
                                    </div>
                                </div>
                            )}
                            <div className={`flex ${isCollapsed ? 'flex-col gap-2 w-full' : 'gap-1 shrink-0'}`}>
                                <button onClick={() => handleAction(onChangePassword)} className={`p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0 ${isCollapsed ? 'flex justify-center w-full' : ''}`} title="เปลี่ยนรหัสผ่าน">
                                    <Key className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleAction(onLogout)} className={`p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 ${isCollapsed ? 'flex justify-center w-full' : ''}`} title="ออกจากระบบ">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;