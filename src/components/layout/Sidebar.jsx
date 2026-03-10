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
            ${isSidebarCollapsed ? 'md:w-24' : 'md:w-[300px]'} 
            ${isMobileMenuOpen ? 'fixed inset-y-0 left-0 w-[300px] shadow-[20px_0_60px_-15px_rgba(0,0,0,0.3)] z-[5000] flex' : 'hidden md:flex'} 
            bg-white/60 backdrop-blur-2xl border-r border-white/80 flex-col h-screen sticky top-0 shrink-0 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        `}>
            
            {/* 1. Logo & Branding - Premium Glow */}
            <div className={`h-24 flex items-center px-6 border-b border-white/50 bg-gradient-to-b from-white/40 to-transparent transition-all duration-500 relative z-10 ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : 'justify-between'}`}>
                {(!isSidebarCollapsed || isMobileMenuOpen) && (
                    <div className="flex items-center gap-4 cursor-default group">
                        <div className="relative">
                            {/* Glowing background behind logo */}
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition-opacity duration-500 animate-pulse"></div>
                            <img 
                                src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" 
                                alt="Logo" 
                                className="relative w-12 h-12 object-cover rounded-xl shadow-lg ring-4 ring-white/90 shrink-0 transform group-hover:scale-105 transition-transform duration-300" 
                            />
                        </div>
                        <div className="flex flex-col truncate">
                            <h1 className="text-lg font-black bg-gradient-to-r from-indigo-800 via-violet-700 to-fuchsia-700 bg-clip-text text-transparent leading-tight truncate tracking-tight">
                                ระบบสัตวแพทย์
                            </h1>
                            <p className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-[0.3em] truncate mt-1">
                                Animal Control
                            </p>
                        </div>
                    </div>
                )}
                
                <div className="flex items-center gap-1">
                    {/* ปุ่มพับ/กาง Sidebar */}
                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                        className="hidden md:flex items-center justify-center w-9 h-9 text-slate-400 hover:text-indigo-600 bg-white/50 hover:bg-white shadow-sm hover:shadow-md border border-slate-100 rounded-xl transition-all hover:scale-110 shrink-0"
                    >
                        {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>

                    {/* ปุ่มปิด Sidebar (มือถือ) */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className="md:hidden flex items-center justify-center w-9 h-9 text-rose-400 hover:text-rose-600 bg-white/50 hover:bg-rose-50 border border-slate-100 rounded-xl transition-all hover:rotate-90 shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 2. Menu Items (Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-8 space-y-8 relative">
                
                {/* 🟢 ส่วนที่ 1: แท็บเมนูหลัก */}
                <div className="space-y-2">
                    {!isSidebarCollapsed && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-3"><span className="w-6 h-[2px] bg-gradient-to-r from-slate-200 to-transparent rounded-full"></span>เมนูหลัก</p>}
                    
                    {(user || tabsConfig.overview) && (
                        <button onClick={() => setActiveTab('overview')} title="ภาพรวมสถิติ" 
                            className={`relative w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-start gap-4 px-4 py-3.5'} rounded-2xl font-bold transition-all duration-300 text-sm group overflow-hidden
                            ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-[0_8px_30px_rgba(79,70,229,0.3)] translate-x-1' : 'text-slate-500 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:text-indigo-600 hover:translate-x-1'}`}>
                            {activeTab === 'overview' && <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>}
                            <Activity className={`w-5 h-5 shrink-0 transition-all duration-300 ${activeTab === 'overview' ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500 group-hover:scale-110'}`} />
                            {!isSidebarCollapsed && <span className="relative z-10">ภาพรวมสถิติ</span>}
                        </button>
                    )}
                    {(user || tabsConfig.outbreak) && (
                        <button onClick={() => setActiveTab('outbreak')} title="จัดการจุดเสี่ยง" 
                            className={`relative w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-start gap-4 px-4 py-3.5'} rounded-2xl font-bold transition-all duration-300 text-sm group overflow-hidden
                            ${activeTab === 'outbreak' ? 'bg-rose-500 text-white shadow-[0_8px_30px_rgba(244,63,94,0.3)] translate-x-1' : 'text-slate-500 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:text-rose-500 hover:translate-x-1'}`}>
                            {activeTab === 'outbreak' && <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>}
                            <Siren className={`w-5 h-5 shrink-0 transition-all duration-300 ${activeTab === 'outbreak' ? 'text-white' : 'text-slate-400 group-hover:text-rose-500 group-hover:scale-110'}`} />
                            {!isSidebarCollapsed && <span className="relative z-10">จัดการจุดเสี่ยง</span>}
                        </button>
                    )}
                    {(user || tabsConfig.database) && (
                        <button onClick={() => setActiveTab('database')} title="ฐานข้อมูลบริการ" 
                            className={`relative w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-start gap-4 px-4 py-3.5'} rounded-2xl font-bold transition-all duration-300 text-sm group overflow-hidden
                            ${activeTab === 'database' ? 'bg-emerald-500 text-white shadow-[0_8px_30px_rgba(16,185,129,0.3)] translate-x-1' : 'text-slate-500 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:text-emerald-600 hover:translate-x-1'}`}>
                            {activeTab === 'database' && <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>}
                            <Database className={`w-5 h-5 shrink-0 transition-all duration-300 ${activeTab === 'database' ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500 group-hover:scale-110'}`} />
                            {!isSidebarCollapsed && <span className="relative z-10">ฐานข้อมูลบริการ</span>}
                        </button>
                    )}
                </div>

                {/* 🟢 ส่วนที่ 3: เครื่องมือการดูข้อมูล */}
                {user && (
                    <div className="space-y-2">
                        {!isSidebarCollapsed && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-3"><span className="w-6 h-[2px] bg-gradient-to-r from-slate-200 to-transparent rounded-full"></span>นัดหมาย & ปฏิทิน</p>}
                        <button onClick={onOpenMeetingList} title="ประวัติประชุม" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-start gap-4 px-4 py-3.5'} rounded-2xl font-bold transition-all duration-300 text-sm text-slate-500 hover:bg-white hover:shadow-md hover:text-indigo-600 hover:translate-x-1 group`}>
                            <List className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            {!isSidebarCollapsed && <span>ประวัติประชุม</span>}
                        </button>
                        <button onClick={onOpenCalendar} title="แผนออกหน่วย" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-start gap-4 px-4 py-3.5'} rounded-2xl font-bold transition-all duration-300 text-sm text-slate-500 hover:bg-white hover:shadow-md hover:text-teal-600 hover:translate-x-1 group`}>
                            <CalendarDays className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-teal-500 transition-colors" />
                            {!isSidebarCollapsed && <span>แผนออกหน่วย</span>}
                        </button>
                        <button onClick={onOpenMeetingCalendar} title="ปฏิทินประชุม" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-start gap-4 px-4 py-3.5'} rounded-2xl font-bold transition-all duration-300 text-sm text-slate-500 hover:bg-white hover:shadow-md hover:text-amber-600 hover:translate-x-1 group`}>
                            <CalendarDays className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-amber-500 transition-colors" />
                            {!isSidebarCollapsed && <span>ปฏิทินประชุม</span>}
                        </button>
                    </div>
                )}

                {/* 🟢 ส่วนที่ 2: System Tools (เครื่องมือระบบ) */}
                <div className="pb-2">
                    {user && (isSuperAdmin || canEdit) && (
                        <div className="space-y-1">
                            {!isSidebarCollapsed ? (
                                <div className="bg-white/40 backdrop-blur-md rounded-3xl p-2.5 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all">
                                    <button onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)} className="w-full flex items-center justify-between px-3 py-3 text-slate-600 hover:text-indigo-600 transition-colors rounded-2xl hover:bg-white shadow-sm border border-transparent hover:border-slate-100 group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gradient-to-br from-slate-100 to-white rounded-xl shadow-inner border border-slate-100 group-hover:from-indigo-50 group-hover:to-white transition-colors">
                                                <Settings className="w-4 h-4 text-slate-500 group-hover:text-indigo-500 group-hover:rotate-90 transition-all duration-500" />
                                            </div>
                                            <span className="text-sm font-extrabold tracking-wide">เครื่องมือระบบ</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-500 ${isSystemMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    <div className={`grid transition-all duration-500 ease-in-out ${isSystemMenuOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden space-y-2">
                                            {isMagaAdmin && (
                                                <div className="bg-white/80 rounded-2xl p-3 shadow-sm border border-white mb-3">
                                                    <p className="text-[10px] font-black text-slate-400 mb-2 px-1 uppercase tracking-[0.2em]">Tab Controls</p>
                                                    {['overview', 'outbreak', 'database'].map(tab => (
                                                        <label key={tab} className="flex items-center justify-between px-3 py-2.5 hover:bg-indigo-50/50 rounded-xl cursor-pointer text-xs font-bold text-slate-600 transition-colors">
                                                            <span className="capitalize">{tab === 'overview' ? 'ภาพรวม' : tab === 'outbreak' ? 'จุดเสี่ยง' : 'ฐานข้อมูล'}</span>
                                                            <input type="checkbox" checked={tabsConfig[tab]} onChange={() => toggleTab(tab)} className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer transition-all shadow-sm" />
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            <div className="px-1 space-y-1.5">
                                                {isSuperAdmin && (
                                                    <>
                                                        <button onClick={onOpenLog} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl flex items-center gap-3 transition-all hover:translate-x-1"><FileText className="w-4 h-4 text-indigo-400"/> ประวัติใช้งาน</button>
                                                        <button onClick={onOpenUserMgmt} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl flex items-center gap-3 transition-all hover:translate-x-1"><Users className="w-4 h-4 text-indigo-400"/> จัดการผู้ใช้</button>
                                                    </>
                                                )}
                                                {canEdit && (
                                                    <>
                                                        <button onClick={onOpenBackup} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-all hover:translate-x-1"><Database className="w-4 h-4 text-emerald-400"/> สำรองข้อมูล</button>
                                                        <button onClick={onOpenCsvOutbreak} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-3 transition-all hover:translate-x-1"><Download className="w-4 h-4 text-rose-400"/> CSV ระบาด</button>
                                                        <button onClick={onOpenCsvReport} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-all hover:translate-x-1"><Download className="w-4 h-4 text-emerald-400"/> CSV บริการ</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setIsSidebarCollapsed(false)} title="เครื่องมือระบบ" className="w-full flex justify-center p-3.5 rounded-2xl text-slate-400 bg-white/50 hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all">
                                    <Settings className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 🟢 ส่วนที่ 4: Action Buttons - Premium 3D Glow Buttons */}
            {user && canEdit && (
                <div className="px-5 pb-5 space-y-3 relative z-10">
                    <button onClick={onOpenAddOutbreak} title="แจ้งโรคระบาด" 
                        className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-center gap-2 px-4 py-3.5'} rounded-2xl font-black transition-all duration-300 text-sm bg-white text-rose-600 border border-rose-100 shadow-[0_8px_20px_rgba(244,63,94,0.12)] hover:shadow-[0_12px_25px_rgba(244,63,94,0.25)] hover:-translate-y-1 group relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-rose-50/50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <AlertTriangle className="w-5 h-5 shrink-0 relative z-10 group-hover:animate-bounce" />
                        {!isSidebarCollapsed && <span className="relative z-10 tracking-wide">แจ้งโรคระบาด</span>}
                    </button>
                    <button onClick={onOpenAddData} title="เพิ่มข้อมูลบริการ" 
                        className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-center gap-2 px-4 py-3.5'} rounded-2xl font-black transition-all duration-300 text-sm bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-[0_10px_25px_rgba(79,70,229,0.4)] hover:shadow-[0_15px_35px_rgba(79,70,229,0.5)] hover:-translate-y-1 border border-indigo-400/30 group relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        <Plus className="w-5 h-5 shrink-0 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                        {!isSidebarCollapsed && <span className="relative z-10 tracking-wide">เพิ่มข้อมูลบริการ</span>}
                    </button>
                </div>
            )}

            {/* 3. Footer / Profile Section - Floating Premium Card */}
            <div className="p-5 bg-gradient-to-t from-slate-50 to-white/50 shrink-0 border-t border-white shadow-[0_-10px_30px_rgba(0,0,0,0.02)] relative z-10">
                {!user ? (
                    <button onClick={onLogin} className={`w-full flex items-center justify-center gap-3 ${isSidebarCollapsed ? 'p-3.5' : 'px-5 py-4'} bg-slate-900 hover:bg-black text-white rounded-2xl transition-all shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.3)] hover:-translate-y-1`}>
                        <Unlock className="w-5 h-5 shrink-0" />
                        {!isSidebarCollapsed && <span className="text-sm font-black tracking-widest uppercase">เข้าสู่ระบบ</span>}
                    </button>
                ) : (
                    <div className={`bg-white rounded-3xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all ${isSidebarCollapsed ? 'p-2.5' : 'p-3'} flex items-center justify-between gap-3`}>
                        {!isSidebarCollapsed && (
                            <div className="flex items-center gap-3.5 overflow-hidden pl-1">
                                <div className="relative group cursor-pointer">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-300"></div>
                                    <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-indigo-50 to-white text-indigo-600 flex items-center justify-center font-black text-lg shrink-0 border-2 border-white shadow-sm">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></div>
                                </div>
                                <div className="flex flex-col truncate">
                                    <span className="text-sm font-black text-slate-800 truncate tracking-tight">{user.username}</span>
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest truncate">{user.role}</span>
                                </div>
                            </div>
                        )}
                        <div className={`flex ${isSidebarCollapsed ? 'flex-col w-full gap-2' : 'gap-1.5 shrink-0 pr-1'}`}>
                            <button onClick={onChangePassword} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all hover:scale-110" title="เปลี่ยนรหัสผ่าน">
                                <Key className="w-4 h-4" />
                            </button>
                            <button onClick={onLogout} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all hover:scale-110" title="ออกจากระบบ">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Global Styles for Shimmer Effect */}
            <style jsx>{`
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;