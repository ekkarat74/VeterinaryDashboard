import React from 'react';
import { 
    Activity, Unlock, Settings, ChevronDown, FileText, Users, 
    Database, Download, Zap, List, CalendarDays, AlertTriangle, 
    Plus, Key 
} from 'lucide-react';

const Header = ({ 
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
    onOpenAddData
}) => {
    return (
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between py-3 md:h-20 md:py-0 gap-3 md:gap-4">
                    
                    {/* 1. Logo & Brand */}
                    <div className="w-full md:w-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg shadow-lg shadow-blue-500/20 shrink-0">
                                {/* แก้ไข: เพิ่ม className เพื่อกำหนดขนาดรูปภาพ (w-10 h-10 คือ 40px) */}
                                <img 
                                    src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" 
                                    alt="" 
                                    className="w-10 h-10 object-cover rounded-md bg-white/10"
                                />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-base font-extrabold text-slate-800 leading-tight">
                                    ระบบรายงานสัตวแพทย์
                                </h1>
                                <p className="text-[10px] font-medium text-slate-500">
                                    Veterinary & Animal Control
                                </p>
                            </div>
                        </div>

                        {/* Mobile Profile (แสดงเฉพาะมือถือ) */}
                        <div className="flex md:hidden items-center gap-2">
                             {user && (
                                <button onClick={onLogout} className="p-2 text-slate-400 bg-slate-50 border border-slate-100 rounded-full hover:bg-red-50 hover:text-red-600 transition">
                                    <Unlock className="w-4 h-4" />
                                </button>
                             )}
                        </div>
                    </div>

                    {/* 2. Controls & Actions */}
                    <div className="w-full md:w-auto flex flex-wrap items-center justify-center md:justify-end gap-2">
                        
                        {/* --- System Tools Dropdown --- */}
                        {user && (isSuperAdmin || canEdit) && (
                            <div className="relative">
                                <button 
                                    onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all font-bold text-xs shadow-sm
                                        ${isSystemMenuOpen 
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 ring-2 ring-indigo-100' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                                        }`}
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>เครื่องมือ</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isSystemMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isSystemMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[40]" onClick={() => setIsSystemMenuOpen(false)}></div>
                                        <div className="absolute top-full left-0 md:left-auto md:right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-[50] p-1.5 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                                            <div className="px-3 py-2 bg-slate-50 rounded-lg mb-1 border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Management</p>
                                            </div>

                                            {isSuperAdmin && (
                                                <>
                                                    <button onClick={() => { onOpenLog(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-left">
                                                        <FileText className="w-4 h-4 text-slate-400" /> ประวัติการใช้งาน (Logs)
                                                    </button>
                                                    <button onClick={() => { onOpenUserMgmt(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-left">
                                                        <Users className="w-4 h-4 text-slate-400" /> จัดการผู้ใช้งาน
                                                    </button>
                                                    <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                                </>
                                            )}

                                            {canEdit && (
                                                <>
                                                    <button onClick={() => { onOpenBackup(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors text-left">
                                                        <Database className="w-4 h-4 text-emerald-500" /> สำรอง/กู้คืนข้อมูล
                                                    </button>
                                                    <button onClick={() => { onOpenCsvOutbreak(); setIsSystemMenuOpen(false); }} 
                                                        className="w-full flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-left">
                                                        <Download className="w-4 h-4 text-red-500" /> นำเข้า/ส่งออก จุดระบาด (CSV)
                                                    </button>
                                                    <button onClick={() => { onOpenCsvReport(); setIsSystemMenuOpen(false); }} 
                                                        className="w-full flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors text-left">
                                                        <Download className="w-4 h-4 text-emerald-500" /> นำเข้า/ส่งออก รายงาน (CSV)
                                                    </button>
                                                    <button onClick={() => { onGenerateMock(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors text-left">
                                                        <Zap className="w-4 h-4 text-purple-500" /> จำลองข้อมูล (Mock Data)
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* View Tools Group */}
                        {user && (
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                                {/* ปุ่มดูประวัติ (List) */}
                                <button onClick={onOpenMeetingList} className="p-2 hover:bg-slate-50 text-slate-600 rounded-md transition relative group">
                                    <List className="w-4 h-4" />
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">ประวัติประชุม</span>
                                </button>
                                
                                <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
                                
                                {/* [แก้ไข] ปุ่มปฏิทินออกหน่วย (สี Indigo) */}
                                <button onClick={onOpenCalendar} className="p-2 hover:bg-slate-50 text-indigo-600 rounded-md transition relative group">
                                    <CalendarDays className="w-4 h-4" />
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">แผนออกหน่วย</span>
                                </button>

                                <div className="w-px h-4 bg-slate-200 mx-0.5"></div>

                                {/* [เพิ่ม] ปุ่มปฏิทินประชุม (สี Teal) */}
                                <button onClick={onOpenMeetingCalendar} className="p-2 hover:bg-slate-50 text-teal-600 rounded-md transition relative group">
                                    <CalendarDays className="w-4 h-4" />
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">ปฏิทินประชุม</span>
                                </button>
                            </div>
                        )}

                        {/* Main Actions */}
                        {user && canEdit && (
                            <>
                                <button onClick={onOpenAddOutbreak} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-2 md:px-3 md:py-2 rounded-lg shadow-sm transition-all active:scale-95">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="hidden sm:inline text-xs font-bold">แจ้งโรค</span>
                                </button>

                                <button onClick={onOpenAddData} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white p-2 md:px-3 md:py-2 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95">
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline text-xs font-bold">เพิ่มข้อมูล</span>
                                </button>
                            </>
                        )}
                        
                        {!user && (
                            <button onClick={onLogin} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-lg transition-all w-full justify-center md:w-auto">
                                <Unlock className="w-4 h-4" />
                                <span>เข้าสู่ระบบเจ้าหน้าที่</span>
                            </button>
                        )}

                         {/* Desktop Profile (ซ่อนบนมือถือ) */}
                         {user && (
                            <div className="hidden md:flex ml-2 pl-2 border-l border-slate-200 items-center gap-1">
                                <div className="flex flex-col items-end mr-2">
                                    <span className="text-[10px] font-bold text-slate-700 leading-none">{user.username}</span>
                                    <span className="text-[9px] text-slate-400 uppercase leading-none">{user.role}</span>
                                </div>
                                <button onClick={onChangePassword} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors" title="เปลี่ยนรหัสผ่าน">
                                    <Key className="w-4 h-4" />
                                </button>
                                <button onClick={onLogout} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="ออกจากระบบ">
                                    <Unlock className="w-4 h-4" />
                                </button>
                            </div>
                         )}

                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;