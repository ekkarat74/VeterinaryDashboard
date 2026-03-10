import React from 'react';
import { 
    Activity, Unlock, Settings, ChevronDown, FileText, Users, 
    Database, Download, Zap, List, CalendarDays, AlertTriangle, 
    Plus, Key, LogOut, Siren, ChevronLeft, ChevronRight
} from 'lucide-react';

// เปลี่ยนชื่อจาก Header เป็น Sidebar
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
    setIsSidebarCollapsed
}) => {
    return (
        <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200 hidden md:flex flex-col h-screen sticky top-0 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 transition-all duration-300`}>
            
            {/* 1. Logo & Branding */}
            <div className={`p-4 flex items-center border-b border-slate-100 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isSidebarCollapsed && (
                    <div className="flex items-center gap-3 cursor-default overflow-hidden animate-in fade-in">
                        <img src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" alt="Logo" className="w-10 h-10 object-cover rounded-xl shadow-sm ring-1 ring-slate-900/5 shrink-0" />
                        <div className="flex flex-col truncate">
                            <h1 className="text-sm font-bold text-slate-800 leading-none mb-1 truncate">ระบบสัตวแพทย์</h1>
                            <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wider truncate">Animal Control</p>
                        </div>
                    </div>
                )}
                {/* ปุ่มพับ/กาง Sidebar */}
                <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0">
                    {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>

            {/* 2. Menu Items (Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-6">
                
                {/* 🟢 ส่วนที่ 1: แท็บเมนูหลัก (ที่หายไป ผมเติมกลับมาให้แล้ว) */}
                <div className="space-y-1.5">
                    {!isSidebarCollapsed && <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">เมนูหลัก</p>}
                    
                    {(user || tabsConfig.overview) && (
                        <button onClick={() => setActiveTab('overview')} title="ภาพรวมสถิติ" 
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl font-bold transition-all text-sm ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'}`}>
                            <Activity className="w-5 h-5 shrink-0" />
                            {!isSidebarCollapsed && <span>ภาพรวมสถิติ</span>}
                        </button>
                    )}
                    {(user || tabsConfig.outbreak) && (
                        <button onClick={() => setActiveTab('outbreak')} title="จัดการจุดเสี่ยง" 
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl font-bold transition-all text-sm ${activeTab === 'outbreak' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-red-600'}`}>
                            <Siren className="w-5 h-5 shrink-0" />
                            {!isSidebarCollapsed && <span>จัดการจุดเสี่ยง</span>}
                        </button>
                    )}
                    {(user || tabsConfig.database) && (
                        <button onClick={() => setActiveTab('database')} title="ฐานข้อมูลบริการ" 
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl font-bold transition-all text-sm ${activeTab === 'database' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-600'}`}>
                            <Database className="w-5 h-5 shrink-0" />
                            {!isSidebarCollapsed && <span>ฐานข้อมูลบริการ</span>}
                        </button>
                    )}
                </div>

                {/* 🟢 ส่วนที่ 2: System Tools (เครื่องมือระบบ) */}
                {user && (isSuperAdmin || canEdit) && (
                    <div className="space-y-1.5">
                        {!isSidebarCollapsed ? (
                            <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                                <button onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)} className="w-full flex items-center justify-between px-2 py-1.5 text-slate-700 hover:text-indigo-600 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Settings className="w-4 h-4" />
                                        <span className="text-[12px] font-bold">เครื่องมือระบบ</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isSystemMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isSystemMenuOpen && (
                                    <div className="mt-2 pl-1 space-y-1 border-t border-slate-200 pt-2 animate-in fade-in slide-in-from-top-2">
                                        {isMagaAdmin && (
                                            <>
                                                <p className="text-[9px] font-bold text-rose-500 mt-1 mb-1 pl-2 uppercase tracking-wider">Tab Controls</p>
                                                {['overview', 'outbreak', 'database'].map(tab => (
                                                    <label key={tab} className="flex items-center justify-between px-2 py-1.5 hover:bg-white rounded-lg cursor-pointer text-[11px] font-medium text-slate-600 transition-colors">
                                                        <span className="capitalize">{tab === 'overview' ? 'ภาพรวม' : tab === 'outbreak' ? 'จุดเสี่ยง' : 'ฐานข้อมูล'}</span>
                                                        <input type="checkbox" checked={tabsConfig[tab]} onChange={() => toggleTab(tab)} className="w-3 h-3 rounded text-rose-500 focus:ring-rose-500 cursor-pointer" />
                                                    </label>
                                                ))}
                                                <div className="h-px bg-slate-200 my-1.5"></div>
                                            </>
                                        )}
                                        {isSuperAdmin && (
                                            <>
                                                <button onClick={onOpenLog} className="w-full text-left px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors"><FileText className="w-3 h-3"/> ประวัติใช้งาน</button>
                                                <button onClick={onOpenUserMgmt} className="w-full text-left px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors"><Users className="w-3 h-3"/> จัดการผู้ใช้</button>
                                            </>
                                        )}
                                        {canEdit && (
                                            <>
                                                <button onClick={onOpenBackup} className="w-full text-left px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 transition-colors"><Database className="w-3 h-3 text-emerald-500"/> สำรองข้อมูล</button>
                                                <button onClick={onOpenCsvOutbreak} className="w-full text-left px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors"><Download className="w-3 h-3 text-rose-500"/> CSV ระบาด</button>
                                                <button onClick={onOpenCsvReport} className="w-full text-left px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 transition-colors"><Download className="w-3 h-3 text-emerald-500"/> CSV บริการ</button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button onClick={() => setIsSidebarCollapsed(false)} title="เครื่องมือระบบ" className="w-full flex justify-center p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                <Settings className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* 🟢 ส่วนที่ 3: เครื่องมือการดูข้อมูล (ปฏิทิน/ประชุม) */}
                {user && (
                    <div className="space-y-1.5">
                        {!isSidebarCollapsed && <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">เครื่องมือการดูข้อมูล</p>}
                        <button onClick={onOpenMeetingList} title="ประวัติประชุม" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl font-medium transition-all text-[13px] text-slate-600 hover:bg-slate-100 hover:text-slate-900`}>
                            <List className="w-4 h-4 shrink-0 text-slate-400" />
                            {!isSidebarCollapsed && <span>ประวัติประชุม</span>}
                        </button>
                        <button onClick={onOpenCalendar} title="แผนออกหน่วย" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl font-medium transition-all text-[13px] text-slate-600 hover:bg-slate-100 hover:text-teal-600`}>
                            <CalendarDays className="w-4 h-4 shrink-0 text-teal-500" />
                            {!isSidebarCollapsed && <span>แผนออกหน่วย</span>}
                        </button>
                        <button onClick={onOpenMeetingCalendar} title="ปฏิทินประชุม" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl font-medium transition-all text-[13px] text-slate-600 hover:bg-slate-100 hover:text-amber-600`}>
                            <CalendarDays className="w-4 h-4 shrink-0 text-amber-500" />
                            {!isSidebarCollapsed && <span>ปฏิทินประชุม</span>}
                        </button>
                    </div>
                )}

                {/* 🟢 ส่วนที่ 4: ปุ่ม Action สีๆ (แจ้งโรค, เพิ่มข้อมูล) */}
                {user && canEdit && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <button onClick={onOpenAddOutbreak} title="แจ้งโรคระบาด" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-center gap-2 px-3 py-2.5'} rounded-xl font-bold transition-all text-sm bg-rose-50 text-rose-600 hover:bg-rose-100`}>
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {!isSidebarCollapsed && <span>แจ้งโรคระบาด</span>}
                        </button>
                        <button onClick={onOpenAddData} title="เพิ่มข้อมูลบริการ" className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-center gap-2 px-3 py-2.5'} rounded-xl font-bold transition-all text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm`}>
                            <Plus className="w-4 h-4 shrink-0" />
                            {!isSidebarCollapsed && <span>เพิ่มข้อมูลบริการ</span>}
                        </button>
                    </div>
                )}
            </div>

            {/* 3. Footer / Profile Section */}
            <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                {!user ? (
                    <button onClick={onLogin} className={`w-full flex items-center justify-center gap-2 ${isSidebarCollapsed ? 'p-2.5' : 'px-4 py-2.5'} bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm`}>
                        <Unlock className="w-4 h-4 shrink-0" />
                        {!isSidebarCollapsed && <span className="text-sm font-bold">เข้าสู่ระบบ</span>}
                    </button>
                ) : (
                    <div className="flex flex-col gap-3">
                        {!isSidebarCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-bold text-slate-800 truncate">{user.username}</span>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md self-start uppercase mt-1">{user.role}</span>
                            </div>
                        )}
                        <div className={`flex ${isSidebarCollapsed ? 'flex-col gap-2' : 'gap-2 w-full'}`}>
                            <button onClick={onChangePassword} className={`flex items-center justify-center ${isSidebarCollapsed ? 'p-2' : 'flex-1 py-2 px-2 gap-1'} text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 text-xs font-bold`} title="เปลี่ยนรหัสผ่าน">
                                <Key className="w-3.5 h-3.5 shrink-0" />
                                {!isSidebarCollapsed && <span>เปลี่ยนรหัส</span>}
                            </button>
                            <button onClick={onLogout} className={`flex items-center justify-center ${isSidebarCollapsed ? 'p-2' : 'flex-1 py-2 px-2 gap-1'} text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors border border-red-100 text-xs font-bold`} title="ออกจากระบบ">
                                <LogOut className="w-3.5 h-3.5 shrink-0" />
                                {!isSidebarCollapsed && <span>ออกจากระบบ</span>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;