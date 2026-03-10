import React from 'react';
import { 
    Activity, Unlock, Settings, ChevronDown, FileText, Users, 
    Database, Download, Zap, List, CalendarDays, AlertTriangle, 
    Plus, Key, LogOut
} from 'lucide-react';

const SidebarHeader = ({ 
    user, 
    isSuperAdmin, 
    canEdit, 
    isSystemMenuOpen, 
    setIsSystemMenuOpen,
    onLogin,
    onLogout,
    onChangePassword,
    // System Menu Actions
    onOpenLog,
    onOpenUserMgmt,
    onOpenBackup,
    onOpenCsvOutbreak,
    onOpenCsvReport,
    onGenerateMock,
    // View Actions
    onOpenMeetingList,
    onOpenCalendar,
    onOpenMeetingCalendar,
    // Main Actions
    onOpenMeetingModal,
    onOpenAddOutbreak,
    onOpenAddData,

    isMagaAdmin,
    tabsConfig,
    toggleTab
}) => {
    return (
        // เปลี่ยนเป็น Sidebar ติดซ้าย (fixed left-0 top-0), สูงเต็มจอ (h-screen), กว้าง 64 (w-64 = 256px)
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white/90 backdrop-blur-md border-r border-slate-200 z-40 shadow-sm transition-all duration-300 flex flex-col overflow-y-auto">
            <div className="flex flex-col h-full p-4 gap-6">
                
                {/* 1. Logo & Brand */}
                <div className="flex items-center gap-3 shrink-0 pb-4 border-b border-slate-100">
                    <div className="shrink-0 relative">
                        <img 
                            src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" 
                            alt="Logo" 
                            className="w-10 h-10 object-cover rounded-xl shadow-sm ring-1 ring-slate-900/5"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-3 h-3 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-none mb-1">
                            ระบบรายงานสัตวแพทย์
                        </h1>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                            Veterinary & Animal Control
                        </p>
                    </div>
                </div>

                {/* 2. Controls & Actions (จัดเรียงแนวตั้ง flex-col) */}
                <div className="flex flex-col gap-4 flex-1">
                    
                    {/* --- System Tools Dropdown --- */}
                    {user && (isSuperAdmin || canEdit) && (
                        <div className="flex flex-col w-full">
                            <button 
                                onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
                                className={`flex items-center justify-between w-full gap-2 px-3 py-2.5 rounded-lg transition-all font-medium text-sm
                                    ${isSystemMenuOpen 
                                        ? 'bg-slate-800 text-white' 
                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4" />
                                    <span>เครื่องมือระบบ</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSystemMenuOpen ? 'rotate-180 text-slate-300' : 'text-slate-400'}`} />
                            </button>

                            {/* ปรับ Dropdown ให้แทรกตัวลงมาด้านล่าง (Inline Accordion) แทนการซ้อนทับ */}
                            {isSystemMenuOpen && (
                                <div className="mt-2 w-full bg-slate-50 rounded-xl border border-slate-200 py-2 animate-in fade-in slide-in-from-top-2">
                                    
                                    {/* --- MagaAdmin Tab Management --- */}
                                    {isMagaAdmin && (
                                        <div className="mb-2 px-2">
                                            <div className="px-3 py-1.5 mb-1">
                                                <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Activity className="w-3.5 h-3.5" /> Tab Management
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                {[
                                                    { id: 'overview', label: 'ภาพรวมสถิติ' },
                                                    { id: 'outbreak', label: 'จัดการจุดเสี่ยง' },
                                                    { id: 'database', label: 'ฐานข้อมูลบริการ' }
                                                ].map((tab) => (
                                                    <label key={tab.id} className="group flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                                                        <span className="group-hover:text-slate-900">{tab.label}</span>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={tabsConfig[tab.id]} 
                                                            onChange={() => toggleTab(tab.id)} 
                                                            className="w-3.5 h-3.5 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer" 
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="h-px bg-slate-200 my-2 mx-2"></div>
                                        </div>
                                    )}

                                    <div className="px-4 py-1.5 mb-1">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">System Management</p>
                                    </div>

                                    <div className="space-y-1 px-2">
                                        {isSuperAdmin && (
                                            <>
                                                <button onClick={() => { onOpenLog(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors text-left group">
                                                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-500" /> ประวัติการใช้งาน (Logs)
                                                </button>
                                                <button onClick={() => { onOpenUserMgmt(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors text-left group">
                                                    <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-500" /> จัดการผู้ใช้งาน
                                                </button>
                                                <div className="h-px bg-slate-200 my-1 mx-2"></div>
                                            </>
                                        )}

                                        {canEdit && (
                                            <>
                                                <button onClick={() => { onOpenBackup(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors text-left">
                                                    <Database className="w-4 h-4 text-emerald-500" /> สำรอง/กู้คืนข้อมูล
                                                </button>
                                                <button onClick={() => { onOpenCsvOutbreak(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors text-left">
                                                    <Download className="w-4 h-4 text-rose-500" /> นำเข้า/ส่งออก จุดระบาด
                                                </button>
                                                <button onClick={() => { onOpenCsvReport(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors text-left">
                                                    <Download className="w-4 h-4 text-emerald-500" /> นำเข้า/ส่งออก รายงาน
                                                </button>
                                                <button onClick={() => { onGenerateMock(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-colors text-left">
                                                    <Zap className="w-4 h-4 text-purple-500" /> จำลองข้อมูล (Mock Data)
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* View Tools Group */}
                    {user && (
                        <div className="flex flex-col gap-1.5 bg-slate-100/80 p-1.5 rounded-lg border border-slate-200/60">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">เครื่องมือการดูข้อมูล</p>
                            <button onClick={onOpenMeetingList} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-md transition-all shadow-sm-hover text-sm font-medium">
                                <List className="w-4 h-4" /> ประวัติประชุม
                            </button>
                            <button onClick={onOpenCalendar} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white text-slate-600 hover:text-indigo-600 rounded-md transition-all shadow-sm-hover text-sm font-medium">
                                <CalendarDays className="w-4 h-4" /> แผนออกหน่วย
                            </button>
                            <button onClick={onOpenMeetingCalendar} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white text-slate-600 hover:text-teal-600 rounded-md transition-all shadow-sm-hover text-sm font-medium">
                                <CalendarDays className="w-4 h-4" /> ปฏิทินประชุม
                            </button>
                        </div>
                    )}

                    {/* Main Actions */}
                    {user && canEdit && (
                        <div className="flex flex-col gap-2 mt-2">
                            <button onClick={onOpenAddOutbreak} className="flex items-center justify-center gap-2 w-full bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-2.5 rounded-lg font-bold text-sm transition-colors border border-rose-100">
                                <AlertTriangle className="w-4 h-4" />
                                <span>แจ้งโรคระบาด</span>
                            </button>

                            <button onClick={onOpenAddData} className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm">
                                <Plus className="w-4 h-4" />
                                <span>เพิ่มข้อมูลบริการ</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* 3. Login & Profile (ดันมาอยู่ล่างสุดด้วย mt-auto) */}
                <div className="mt-auto pt-4 border-t border-slate-200 flex flex-col gap-3">
                    {!user && (
                        <button onClick={onLogin} className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors">
                            <Unlock className="w-4 h-4" />
                            <span>เข้าสู่ระบบเจ้าหน้าที่</span>
                        </button>
                    )}

                    {user && (
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800 leading-none mb-1.5">{user.username}</span>
                                <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded inline-block w-fit">{user.role}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button onClick={onChangePassword} className="flex flex-1 items-center justify-center gap-2 px-2 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors">
                                    <Key className="w-3.5 h-3.5" /> เปลี่ยนรหัส
                                </button>
                                <button onClick={onLogout} className="flex flex-1 items-center justify-center gap-2 px-2 py-2 text-xs font-bold text-red-500 hover:text-white bg-red-50 hover:bg-red-500 border border-red-100 rounded-lg transition-colors">
                                    <LogOut className="w-3.5 h-3.5" /> ออกจากระบบ
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </aside>
    );
};

export default SidebarHeader;