import React from 'react';
import { 
    Activity, Unlock, Settings, ChevronDown, FileText, Users, 
    Database, Download, Zap, List, CalendarDays, AlertTriangle, 
    Plus, Key, LogOut, Siren, ChevronLeft, ChevronRight, X,
    RefreshCw // ✅ เพิ่ม Icon สำหรับปุ่มอัปเดต
} from 'lucide-react';

// --------------------------------------------------------
// 🧩 Reusable Component: ปุ่มเมนูย่อย เพื่อลดความซ้ำซ้อนของโค้ด
// --------------------------------------------------------
const NavItem = ({ icon: Icon, label, isActive, onClick, isCollapsed, activeColor = 'indigo' }) => {
    const colorStyles = {
        indigo: isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        rose: isActive ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        emerald: isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    };

    const iconColors = {
        indigo: isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500',
        rose: isActive ? 'text-rose-600' : 'text-slate-400 group-hover:text-rose-500',
        emerald: isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500',
    };

    return (
        <button 
            onClick={onClick} 
            title={label} 
            className={`group w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium transition-all duration-200 ${colorStyles[activeColor]}`}
        >
            <Icon className={`w-5 h-5 shrink-0 transition-colors ${iconColors[activeColor]}`} />
            {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
        </button>
    );
};

// --------------------------------------------------------
// 🚀 Main Sidebar Component
// --------------------------------------------------------
const Sidebar = ({ 
    user, isSuperAdmin, canEdit, isSystemMenuOpen, setIsSystemMenuOpen,
    onLogin, onLogout, onChangePassword, onOpenLog, onOpenUserMgmt,
    onOpenBackup, onOpenCsvOutbreak, onOpenCsvReport, onGenerateMock,
    onOpenMeetingList, onOpenCalendar, onOpenMeetingCalendar,
    onOpenMeetingModal, onOpenAddOutbreak, onOpenAddData,
    onNotifyUpdate, // ✅ เพิ่ม Props รับคำสั่งอัปเดตระบบ
    isMagaAdmin, tabsConfig, toggleTab, activeTab, setActiveTab, 
    isSidebarCollapsed, setIsSidebarCollapsed, isMobileMenuOpen, setIsMobileMenuOpen 
}) => {
    
    const isCollapsed = isSidebarCollapsed && !isMobileMenuOpen;

    const handleAction = (callback) => {
        if (callback) callback();
        setIsMobileMenuOpen(false); 
    };

    const renderSectionHeader = (title) => (
        !isCollapsed && (
            <p className="px-3 mt-4 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                {title}
            </p>
        )
    );

    return (
        <>
            {/* 🟢 Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-slate-900/40 z-[4999] backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside className={`
                fixed md:relative top-0 left-0 h-[100dvh] z-[5000] md:z-auto
                bg-white border-r border-slate-200 flex flex-col shrink-0
                transition-all duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0 w-[260px] shadow-2xl' : '-translate-x-full w-[260px] md:translate-x-0'} 
                ${isCollapsed ? 'md:w-20' : 'md:w-[260px]'}
            `}>
                
                {/* --- 1. Logo & Branding --- */}
                <div className={`h-[72px] flex items-center px-4 border-b border-slate-100 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className={`flex items-center gap-3 overflow-hidden transition-opacity duration-300 ${isCollapsed ? 'hidden' : 'flex'}`}>
                        <img 
                            src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" 
                            alt="Logo" 
                            className="w-9 h-9 object-cover rounded-xl border border-slate-200 shrink-0 shadow-sm" 
                        />
                        <div className="flex flex-col whitespace-nowrap">
                            <h1 className="text-sm font-bold text-slate-800 tracking-tight">ระบบสัตวแพทย์</h1>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Animal Control</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                        className="hidden md:flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                    >
                        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>

                    <button 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className="md:hidden flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* --- 2. Menu Items --- */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-1 custom-scrollbar">
                    
                    {/* 🟢 แดชบอร์ด & ข้อมูล */}
                    {renderSectionHeader('แดชบอร์ด')}
                    {(user || tabsConfig?.overview) && <NavItem icon={Activity} label="ภาพรวมสถิติ" isActive={activeTab === 'overview'} onClick={() => handleAction(() => setActiveTab('overview'))} isCollapsed={isCollapsed} activeColor="indigo" />}
                    {(user || tabsConfig?.outbreak) && <NavItem icon={Siren} label="จัดการจุดเสี่ยง" isActive={activeTab === 'outbreak'} onClick={() => handleAction(() => setActiveTab('outbreak'))} isCollapsed={isCollapsed} activeColor="rose" />}
                    {(user || tabsConfig?.database) && <NavItem icon={Database} label="ฐานข้อมูลบริการ" isActive={activeTab === 'database'} onClick={() => handleAction(() => setActiveTab('database'))} isCollapsed={isCollapsed} activeColor="emerald" />}

                    {/* 🟢 ปฏิทิน & นัดหมาย */}
                    {user && (
                        <>
                            {renderSectionHeader('ปฏิทิน & นัดหมาย')}
                            <NavItem icon={List} label="ประวัติประชุม" onClick={() => handleAction(onOpenMeetingList)} isCollapsed={isCollapsed} />
                            <NavItem icon={CalendarDays} label="แผนออกหน่วย" onClick={() => handleAction(onOpenCalendar)} isCollapsed={isCollapsed} />
                            <NavItem icon={CalendarDays} label="ปฏิทินประชุม" onClick={() => handleAction(onOpenMeetingCalendar)} isCollapsed={isCollapsed} />
                        </>
                    )}

                    {/* 🟢 ตั้งค่าระบบ */}
                    {user && (isSuperAdmin || canEdit) && (
                        <>
                            {renderSectionHeader('การตั้งค่า')}
                            {!isCollapsed ? (
                                <div className="space-y-1">
                                    <button onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)} className="w-full flex items-center justify-between px-3 py-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <Settings className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-slate-600" />
                                            <span className="text-sm font-medium whitespace-nowrap">เครื่องมือระบบ</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${isSystemMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {/* Dropdown Content */}
                                   {isSystemMenuOpen && (
                                        <div className="pl-11 pr-3 py-2 space-y-3">
                                            {isMagaAdmin && (
                                                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                                    <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase">แสดงแท็บเมนู</p>
                                                    <div className="space-y-2">
                                                        {[
                                                            { id: 'overview', label: 'ภาพรวม' },
                                                            { id: 'outbreak', label: 'จุดเสี่ยง' },
                                                            { id: 'database', label: 'ฐานข้อมูล' }
                                                        ].map(tab => (
                                                            <label key={tab.id} className="flex items-center justify-between cursor-pointer group">
                                                                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{tab.label}</span>
                                                                <input type="checkbox" checked={tabsConfig?.[tab.id] || false} onChange={() => toggleTab(tab.id)} className="w-3.5 h-3.5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="space-y-1">
                                                {isSuperAdmin && (
                                                    <>
                                                        <button onClick={() => handleAction(onOpenLog)} className="w-full text-left py-1.5 px-2 rounded-lg text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors"><FileText className="w-4 h-4 shrink-0"/> ประวัติใช้งาน</button>
                                                        <button onClick={() => handleAction(onOpenUserMgmt)} className="w-full text-left py-1.5 px-2 rounded-lg text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors"><Users className="w-4 h-4 shrink-0"/> จัดการผู้ใช้</button>
                                                    </>
                                                )}
                                                {canEdit && (
                                                    <>
                                                        <button onClick={() => handleAction(onOpenBackup)} className="w-full text-left py-1.5 px-2 rounded-lg text-sm font-medium text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"><Database className="w-4 h-4 shrink-0"/> สำรองข้อมูล</button>
                                                        <button onClick={() => handleAction(onOpenCsvOutbreak)} className="w-full text-left py-1.5 px-2 rounded-lg text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"><Download className="w-4 h-4 shrink-0"/> นำเข้า CSV ระบาด</button>
                                                        <button onClick={() => handleAction(onOpenCsvReport)} className="w-full text-left py-1.5 px-2 rounded-lg text-sm font-medium text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"><Download className="w-4 h-4 shrink-0"/> นำเข้า CSV บริการ</button>
                                                        
                                                        {/* ✅ ปุ่มใหม่: แจ้งเตือนอัปเดตระบบ */}
                                                        <button onClick={() => handleAction(onNotifyUpdate)} className="w-full text-left py-1.5 px-2 mt-1 rounded-lg text-sm font-medium text-blue-600 bg-blue-50/50 hover:text-blue-700 hover:bg-blue-100 flex items-center gap-2 transition-colors border border-blue-100">
                                                            <RefreshCw className="w-4 h-4 shrink-0" />
                                                            บังคับอัปเดตระบบ (Refresh)
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button onClick={() => { setIsSidebarCollapsed(false); setIsSystemMenuOpen(true); }} title="เครื่องมือระบบ" className="w-full flex justify-center p-3 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                                    <Settings className="w-5 h-5 shrink-0" />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* --- 4. ดำเนินการด่วน (Action Buttons) --- */}
                {user && canEdit && (
                    <div className={`p-4 shrink-0 border-t border-slate-100 bg-white/50 space-y-2 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                        <button onClick={() => handleAction(onOpenAddOutbreak)} title="แจ้งโรคระบาด" 
                            className={`group flex items-center justify-center gap-2 ${isCollapsed ? 'w-10 h-10 p-0' : 'w-full px-4 py-2.5'} rounded-xl font-semibold text-sm bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all duration-300 border border-rose-100 hover:border-rose-600`}>
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">แจ้งโรคระบาด</span>}
                        </button>
                        <button onClick={() => handleAction(onOpenAddData)} title="เพิ่มข้อมูลบริการ" 
                            className={`group flex items-center justify-center gap-2 ${isCollapsed ? 'w-10 h-10 p-0' : 'w-full px-4 py-2.5'} rounded-xl font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-300 shadow-sm hover:shadow-md`}>
                            <Plus className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">เพิ่มข้อมูลบริการ</span>}
                        </button>
                    </div>
                )}

                {/* --- 5. Footer / Profile Section --- */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                    {!user ? (
                        <button onClick={() => handleAction(onLogin)} title="เข้าสู่ระบบ" className={`group w-full flex items-center justify-center gap-2 ${isCollapsed ? 'p-2.5' : 'px-4 py-2.5'} bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors`}>
                            <Unlock className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">เข้าสู่ระบบ</span>}
                        </button>
                    ) : (
                        <div className={`flex items-center justify-between gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
                            {!isCollapsed && (
                                <div className="flex items-center gap-3 w-full overflow-hidden bg-white p-2 rounded-xl border border-slate-200/60 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold text-slate-700 truncate">{user.username}</span>
                                        <span className="text-[10px] font-semibold text-indigo-500 uppercase truncate">{user.role}</span>
                                    </div>
                                </div>
                            )}
                            <div className={`flex ${isCollapsed ? 'flex-col gap-2 w-full' : 'gap-1 shrink-0'}`}>
                                <button onClick={() => handleAction(onChangePassword)} className={`p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-xl transition-all shrink-0 ${isCollapsed ? 'flex justify-center w-full bg-white border-slate-200' : ''}`} title="เปลี่ยนรหัสผ่าน">
                                    <Key className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleAction(onLogout)} className={`p-2.5 text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-xl transition-all shrink-0 ${isCollapsed ? 'flex justify-center w-full bg-white border-slate-200' : ''}`} title="ออกจากระบบ">
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