import React from 'react';
import { 
    Activity, Unlock, Settings, ChevronDown, FileText, Users, 
    Database, Download, Zap, List, CalendarDays, AlertTriangle, 
    Plus, Key, LogOut, Siren, ChevronLeft, ChevronRight, X
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
    return (
        <aside className={`
            ${isSidebarCollapsed ? 'md:w-20' : 'md:w-[260px]'} 
            ${isMobileMenuOpen ? 'fixed inset-y-0 left-0 w-[260px] shadow-2xl z-[5000] flex' : 'hidden md:flex'} 
            bg-white border-r border-slate-200/80 flex-col h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out
        `}>
            
            {/* 1. Logo & Branding */}
            <div className={`h-16 flex items-center px-4 border-b border-slate-100 transition-all duration-300 ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : 'justify-between'}`}>
                {(!isSidebarCollapsed || isMobileMenuOpen) && (
                    <div className="flex items-center gap-3 cursor-default overflow-hidden">
                        <img 
                            src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" 
                            alt="Logo" 
                            className="w-9 h-9 object-cover rounded-xl shadow-sm ring-1 ring-slate-900/5 shrink-0" 
                        />
                        <div className="flex flex-col truncate">
                            <h1 className="text-[15px] font-bold text-slate-800 leading-tight truncate">ระบบสัตวแพทย์</h1>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest truncate">Animal Control</p>
                        </div>
                    </div>
                )}
                
                <div className="flex items-center gap-1">
                    {/* ปุ่มพับ/กาง Sidebar (เฉพาะคอมพิวเตอร์) */}
                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                        className="hidden md:flex items-center justify-center w-8 h-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0"
                    >
                        {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>

                    {/* ปุ่มปิด Sidebar (เฉพาะมือถือ) */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className="md:hidden flex items-center justify-center w-8 h-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 2. Menu Items (Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-5 space-y-8">
                
                {/* 🟢 ส่วนที่ 1: แท็บเมนูหลัก */}
                <div className="space-y-1">
                    {!isSidebarCollapsed && <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">เมนูหลัก</p>}
                    
                    {(user || tabsConfig.overview) && (
                        <button onClick={() => setActiveTab('overview')} title="ภาพรวมสถิติ" 
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl font-medium transition-all text-sm group ${activeTab === 'overview' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                            <Activity className={`w-5 h-5 shrink-0 ${activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'} transition-colors`} />
                            {!isSidebarCollapsed && <span>ภาพรวมสถิติ</span>}
                        </button>
                    )}
                    {(user || tabsConfig.outbreak) && (
                        <button onClick={() => setActiveTab('outbreak')} title="จัดการจุดเสี่ยง" 
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl font-medium transition-all text-sm group ${activeTab === 'outbreak' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                            <Siren className={`w-5 h-5 shrink-0 ${activeTab === 'outbreak' ? 'text-rose-600' : 'text-slate-400 group-hover:text-rose-500'} transition-colors`} />
                            {!isSidebarCollapsed && <span>จัดการจุดเสี่ยง</span>}
                        </button>
                    )}
                    {(user || tabsConfig.database) && (
                        <button onClick={() => setActiveTab('database')} title="ฐานข้อมูลบริการ" 
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl font-medium transition-all text-sm group ${activeTab === 'database' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                            <Database className={`w-5 h-5 shrink-0 ${activeTab === 'database' ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'} transition-colors`} />
                            {!isSidebarCollapsed && <span>ฐานข้อมูลบริการ</span>}
                        </button>
                    )}
                </div>

                {/* 🟢 ส่วนที่ 2: System Tools (เครื่องมือระบบ) */}
                {user && (isSuperAdmin || canEdit) && (
                    <div className="space-y-1">
                        {!isSidebarCollapsed ? (
                            <div className="bg-slate-50/50 rounded-2xl p-2 border border-slate-100">
                                <button onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)} className="w-full flex items-center justify-between px-2 py-2 text-slate-600 hover:text-indigo-600 transition-colors rounded-xl hover:bg-white">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1 bg-white rounded-lg shadow-sm border border-slate-100">
                                            <Settings className="w-3.5 h-3.5 text-slate-500" />
                                        </div>
                                        <span className="text-sm font-semibold">เครื่องมือระบบ</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isSystemMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                <div className={`grid transition-all duration-300 ease-in-out ${isSystemMenuOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden space-y-1">
                                        {isMagaAdmin && (
                                            <div className="bg-white rounded-xl p-2 shadow-sm border border-slate-100 mb-2">
                                                <p className="text-[10px] font-bold text-slate-400 mb-2 px-1 uppercase tracking-wider">Tab Controls</p>
                                                {['overview', 'outbreak', 'database'].map(tab => (
                                                    <label key={tab} className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-xs font-medium text-slate-600 transition-colors">
                                                        <span className="capitalize">{tab === 'overview' ? 'ภาพรวม' : tab === 'outbreak' ? 'จุดเสี่ยง' : 'ฐานข้อมูล'}</span>
                                                        <input type="checkbox" checked={tabsConfig[tab]} onChange={() => toggleTab(tab)} className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer" />
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <div className="px-1 space-y-0.5">
                                            {isSuperAdmin && (
                                                <>
                                                    <button onClick={onOpenLog} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg flex items-center gap-2.5 transition-colors"><FileText className="w-3.5 h-3.5 text-slate-400"/> ประวัติใช้งาน</button>
                                                    <button onClick={onOpenUserMgmt} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg flex items-center gap-2.5 transition-colors"><Users className="w-3.5 h-3.5 text-slate-400"/> จัดการผู้ใช้</button>
                                                </>
                                            )}
                                            {canEdit && (
                                                <>
                                                    <button onClick={onOpenBackup} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2.5 transition-colors"><Database className="w-3.5 h-3.5 text-emerald-500"/> สำรองข้อมูล</button>
                                                    <button onClick={onOpenCsvOutbreak} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-2.5 transition-colors"><Download className="w-3.5 h-3.5 text-rose-500"/> CSV ระบาด</button>
                                                    <button onClick={onOpenCsvReport} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2.5 transition-colors"><Download className="w-3.5 h-3.5 text-emerald-500"/> CSV บริการ</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setIsSidebarCollapsed(false)} title="เครื่องมือระบบ" className="w-full flex justify-center p-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                                <Settings className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* 🟢 ส่วนที่ 3: เครื่องมือการดูข้อมูล (ปฏิทิน/ประชุม) */}
                {user && (
                    <div className="space-y-1">
                        {!isSidebarCollapsed && <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">นัดหมาย & ปฏิทิน</p>}
                        <button onClick={onOpenMeetingList} title="ประวัติประชุม" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl font-medium transition-all text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 group`}>
                            <List className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            {!isSidebarCollapsed && <span>ประวัติประชุม</span>}
                        </button>
                        <button onClick={onOpenCalendar} title="แผนออกหน่วย" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl font-medium transition-all text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 group`}>
                            <CalendarDays className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-teal-600 transition-colors" />
                            {!isSidebarCollapsed && <span>แผนออกหน่วย</span>}
                        </button>
                        <button onClick={onOpenMeetingCalendar} title="ปฏิทินประชุม" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl font-medium transition-all text-sm text-slate-600 hover:bg-amber-50 hover:text-amber-700 group`}>
                            <CalendarDays className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-amber-500 transition-colors" />
                            {!isSidebarCollapsed && <span>ปฏิทินประชุม</span>}
                        </button>
                    </div>
                )}
            </div>

            {/* 🟢 ส่วนที่ 4: Action Buttons (Sticky ล่างก่อน Profile) */}
            {user && canEdit && (
                <div className="px-4 pb-4 space-y-2">
                    <button onClick={onOpenAddOutbreak} title="แจ้งโรคระบาด" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-center gap-2 px-4 py-2.5'} rounded-xl font-semibold transition-all text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 hover:shadow-sm border border-rose-100`}>
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {!isSidebarCollapsed && <span>แจ้งโรคระบาด</span>}
                    </button>
                    <button onClick={onOpenAddData} title="เพิ่มข้อมูลบริการ" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-center gap-2 px-4 py-2.5'} rounded-xl font-semibold transition-all text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-200`}>
                        <Plus className="w-4 h-4 shrink-0" />
                        {!isSidebarCollapsed && <span>เพิ่มข้อมูลบริการ</span>}
                    </button>
                </div>
            )}

            {/* 3. Footer / Profile Section */}
            <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 shrink-0">
                {!user ? (
                    <button onClick={onLogin} className={`w-full flex items-center justify-center gap-2 ${isSidebarCollapsed ? 'p-3' : 'px-4 py-2.5'} bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all shadow-sm`}>
                        <Unlock className="w-4 h-4 shrink-0" />
                        {!isSidebarCollapsed && <span className="text-sm font-semibold">เข้าสู่ระบบ</span>}
                    </button>
                ) : (
                    <div className="flex items-center justify-between gap-2">
                        {!isSidebarCollapsed && (
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-200">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col truncate">
                                    <span className="text-[13px] font-bold text-slate-700 truncate">{user.username}</span>
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase truncate">{user.role}</span>
                                </div>
                            </div>
                        )}
                        <div className={`flex ${isSidebarCollapsed ? 'flex-col w-full gap-2' : 'gap-1 shrink-0'}`}>
                            <button onClick={onChangePassword} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200 hover:shadow-sm" title="เปลี่ยนรหัสผ่าน">
                                <Key className="w-4 h-4" />
                            </button>
                            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200 hover:shadow-sm" title="ออกจากระบบ">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;