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
            ${isSidebarCollapsed ? 'md:w-20' : 'md:w-[280px]'} 
            ${isMobileMenuOpen ? 'fixed inset-y-0 left-0 w-[280px] shadow-[10px_0_40px_rgba(0,0,0,0.1)] z-[5000] flex' : 'hidden md:flex'} 
            bg-white/95 backdrop-blur-xl border-r border-slate-200/60 flex-col h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out
        `}>
            
            {/* 1. Logo & Branding - Premium Gradient */}
            <div className={`h-20 flex items-center px-5 border-b border-slate-100/80 transition-all duration-300 ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : 'justify-between'}`}>
                {(!isSidebarCollapsed || isMobileMenuOpen) && (
                    <div className="flex items-center gap-3.5 cursor-default overflow-hidden group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <img 
                                src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" 
                                alt="Logo" 
                                className="relative w-10 h-10 object-cover rounded-xl shadow-sm ring-2 ring-white shrink-0" 
                            />
                        </div>
                        <div className="flex flex-col truncate">
                            <h1 className="text-[16px] font-extrabold bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent leading-tight truncate">
                                ระบบสัตวแพทย์
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] truncate mt-0.5">
                                Animal Control
                            </p>
                        </div>
                    </div>
                )}
                
                <div className="flex items-center gap-1">
                    {/* ปุ่มพับ/กาง Sidebar (เฉพาะคอมพิวเตอร์) */}
                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                        className="hidden md:flex items-center justify-center w-8 h-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all hover:scale-110 shrink-0"
                    >
                        {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>

                    {/* ปุ่มปิด Sidebar (เฉพาะมือถือ) */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className="md:hidden flex items-center justify-center w-8 h-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all hover:rotate-90 shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 2. Menu Items (Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-8">
                
                {/* 🟢 ส่วนที่ 1: แท็บเมนูหลัก */}
                <div className="space-y-1.5">
                    {!isSidebarCollapsed && <p className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2"><span className="w-4 h-[1px] bg-slate-200"></span>เมนูหลัก</p>}
                    
                    {(user || tabsConfig.overview) && (
                        <button onClick={() => setActiveTab('overview')} title="ภาพรวมสถิติ" 
                            className={`relative w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-3'} rounded-xl font-medium transition-all duration-300 text-sm group ${activeTab === 'overview' ? 'bg-gradient-to-r from-indigo-50 to-white text-indigo-700 shadow-[0_2px_10px_rgba(79,70,229,0.05)] border border-indigo-100/50' : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-900 hover:translate-x-1'}`}>
                            {activeTab === 'overview' && !isSidebarCollapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full shadow-[0_0_8px_rgba(79,70,229,0.6)]"></div>}
                            <Activity className={`w-5 h-5 shrink-0 transition-all duration-300 ${activeTab === 'overview' ? 'text-indigo-600 scale-110' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                            {!isSidebarCollapsed && <span>ภาพรวมสถิติ</span>}
                        </button>
                    )}
                    {(user || tabsConfig.outbreak) && (
                        <button onClick={() => setActiveTab('outbreak')} title="จัดการจุดเสี่ยง" 
                            className={`relative w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-3'} rounded-xl font-medium transition-all duration-300 text-sm group ${activeTab === 'outbreak' ? 'bg-gradient-to-r from-rose-50 to-white text-rose-700 shadow-[0_2px_10px_rgba(244,63,94,0.05)] border border-rose-100/50' : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-900 hover:translate-x-1'}`}>
                            {activeTab === 'outbreak' && !isSidebarCollapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-rose-600 rounded-r-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>}
                            <Siren className={`w-5 h-5 shrink-0 transition-all duration-300 ${activeTab === 'outbreak' ? 'text-rose-600 scale-110' : 'text-slate-400 group-hover:text-rose-500'}`} />
                            {!isSidebarCollapsed && <span>จัดการจุดเสี่ยง</span>}
                        </button>
                    )}
                    {(user || tabsConfig.database) && (
                        <button onClick={() => setActiveTab('database')} title="ฐานข้อมูลบริการ" 
                            className={`relative w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-3'} rounded-xl font-medium transition-all duration-300 text-sm group ${activeTab === 'database' ? 'bg-gradient-to-r from-emerald-50 to-white text-emerald-700 shadow-[0_2px_10px_rgba(16,185,129,0.05)] border border-emerald-100/50' : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-900 hover:translate-x-1'}`}>
                            {activeTab === 'database' && !isSidebarCollapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-600 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>}
                            <Database className={`w-5 h-5 shrink-0 transition-all duration-300 ${activeTab === 'database' ? 'text-emerald-600 scale-110' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                            {!isSidebarCollapsed && <span>ฐานข้อมูลบริการ</span>}
                        </button>
                    )}
                </div>

                {/* 🟢 ส่วนที่ 3: เครื่องมือการดูข้อมูล (ปฏิทิน/ประชุม) */}
                {user && (
                    <div className="space-y-1.5">
                        {!isSidebarCollapsed && <p className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2"><span className="w-4 h-[1px] bg-slate-200"></span>นัดหมาย & ปฏิทิน</p>}
                        <button onClick={onOpenMeetingList} title="ประวัติประชุม" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-3'} rounded-xl font-medium transition-all duration-300 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1 group`}>
                            <List className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            {!isSidebarCollapsed && <span>ประวัติประชุม</span>}
                        </button>
                        <button onClick={onOpenCalendar} title="แผนออกหน่วย" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-3'} rounded-xl font-medium transition-all duration-300 text-sm text-slate-500 hover:bg-teal-50 hover:text-teal-700 hover:translate-x-1 group`}>
                            <CalendarDays className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-teal-500 transition-colors" />
                            {!isSidebarCollapsed && <span>แผนออกหน่วย</span>}
                        </button>
                        <button onClick={onOpenMeetingCalendar} title="ปฏิทินประชุม" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-3'} rounded-xl font-medium transition-all duration-300 text-sm text-slate-500 hover:bg-amber-50 hover:text-amber-700 hover:translate-x-1 group`}>
                            <CalendarDays className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-amber-500 transition-colors" />
                            {!isSidebarCollapsed && <span>ปฏิทินประชุม</span>}
                        </button>
                    </div>
                )}
            </div>

            {/* 🟢 ส่วนที่ 2: System Tools (เครื่องมือระบบ) */}
            <div className="px-4 pb-2">
                {user && (isSuperAdmin || canEdit) && (
                    <div className="space-y-1">
                        {!isSidebarCollapsed ? (
                            <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-200/50 shadow-sm">
                                <button onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)} className="w-full flex items-center justify-between px-2 py-2 text-slate-600 hover:text-indigo-600 transition-colors rounded-xl hover:bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                                            <Settings className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <span className="text-sm font-bold">เครื่องมือระบบ</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isSystemMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                <div className={`grid transition-all duration-300 ease-in-out ${isSystemMenuOpen ? 'grid-rows-[1fr] opacity-100 mt-2.5' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden space-y-1.5">
                                        {isMagaAdmin && (
                                            <div className="bg-white rounded-xl p-2.5 shadow-sm border border-slate-100 mb-2.5">
                                                <p className="text-[10px] font-bold text-slate-400 mb-2 px-1 uppercase tracking-wider">Tab Controls</p>
                                                {['overview', 'outbreak', 'database'].map(tab => (
                                                    <label key={tab} className="flex items-center justify-between px-2 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs font-medium text-slate-600 transition-colors">
                                                        <span className="capitalize">{tab === 'overview' ? 'ภาพรวม' : tab === 'outbreak' ? 'จุดเสี่ยง' : 'ฐานข้อมูล'}</span>
                                                        <input type="checkbox" checked={tabsConfig[tab]} onChange={() => toggleTab(tab)} className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer transition-all" />
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <div className="px-1 space-y-1">
                                            {isSuperAdmin && (
                                                <>
                                                    <button onClick={onOpenLog} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/80 rounded-lg flex items-center gap-2.5 transition-all hover:translate-x-1"><FileText className="w-3.5 h-3.5 text-slate-400"/> ประวัติใช้งาน</button>
                                                    <button onClick={onOpenUserMgmt} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/80 rounded-lg flex items-center gap-2.5 transition-all hover:translate-x-1"><Users className="w-3.5 h-3.5 text-slate-400"/> จัดการผู้ใช้</button>
                                                </>
                                            )}
                                            {canEdit && (
                                                <>
                                                    <button onClick={onOpenBackup} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/80 rounded-lg flex items-center gap-2.5 transition-all hover:translate-x-1"><Database className="w-3.5 h-3.5 text-emerald-500"/> สำรองข้อมูล</button>
                                                    <button onClick={onOpenCsvOutbreak} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-lg flex items-center gap-2.5 transition-all hover:translate-x-1"><Download className="w-3.5 h-3.5 text-rose-500"/> CSV ระบาด</button>
                                                    <button onClick={onOpenCsvReport} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/80 rounded-lg flex items-center gap-2.5 transition-all hover:translate-x-1"><Download className="w-3.5 h-3.5 text-emerald-500"/> CSV บริการ</button>
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
            </div>

            {/* 🟢 ส่วนที่ 4: Action Buttons (Sticky ล่างก่อน Profile) - Premium Glow Buttons */}
            {user && canEdit && (
                <div className="px-4 pb-4 space-y-3 mt-2">
                    <button onClick={onOpenAddOutbreak} title="แจ้งโรคระบาด" 
                        className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-center gap-2 px-4 py-3'} rounded-xl font-bold transition-all duration-300 text-sm bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 shadow-[0_4px_10px_rgba(244,63,94,0.06)] hover:shadow-[0_4px_15px_rgba(244,63,94,0.15)] hover:-translate-y-0.5`}>
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {!isSidebarCollapsed && <span>แจ้งโรคระบาด</span>}
                    </button>
                    <button onClick={onOpenAddData} title="เพิ่มข้อมูลบริการ" 
                        className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-center gap-2 px-4 py-3'} rounded-xl font-bold transition-all duration-300 text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 border border-indigo-500/50`}>
                        <Plus className="w-5 h-5 shrink-0" />
                        {!isSidebarCollapsed && <span>เพิ่มข้อมูลบริการ</span>}
                    </button>
                </div>
            )}

            {/* 3. Footer / Profile Section - Floating Card Style */}
            <div className="p-4 bg-slate-50/50 shrink-0 border-t border-slate-100">
                {!user ? (
                    <button onClick={onLogin} className={`w-full flex items-center justify-center gap-2 ${isSidebarCollapsed ? 'p-3' : 'px-4 py-3'} bg-slate-900 hover:bg-black text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5`}>
                        <Unlock className="w-4 h-4 shrink-0" />
                        {!isSidebarCollapsed && <span className="text-sm font-bold tracking-wide">เข้าสู่ระบบ</span>}
                    </button>
                ) : (
                    <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all ${isSidebarCollapsed ? 'p-2' : 'p-3'} flex items-center justify-between gap-2`}>
                        {!isSidebarCollapsed && (
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0 ring-2 ring-white shadow-sm">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div className="flex flex-col truncate">
                                    <span className="text-[13px] font-bold text-slate-800 truncate">{user.username}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{user.role}</span>
                                </div>
                            </div>
                        )}
                        <div className={`flex ${isSidebarCollapsed ? 'flex-col w-full gap-2' : 'gap-1 shrink-0'}`}>
                            <button onClick={onChangePassword} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="เปลี่ยนรหัสผ่าน">
                                <Key className="w-4 h-4" />
                            </button>
                            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="ออกจากระบบ">
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