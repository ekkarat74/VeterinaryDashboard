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
    onOpenAddData,

    isMagaAdmin,
    tabsConfig,
    toggleTab
}) => {
    return (
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-30 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between py-4 md:h-20 md:py-0 gap-4">
                    
                    {/* 1. Logo & Brand */}
                    <div className="w-full md:w-auto flex items-center justify-between">
                        <div className="flex items-center gap-4 hover:opacity-90 transition-opacity cursor-default">
                            <div className="shrink-0 relative">
                                <img 
                                    src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" 
                                    alt="Logo" 
                                    className="w-11 h-11 object-cover rounded-xl shadow-sm ring-1 ring-slate-900/5"
                                />
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-white"></div>
                            </div>

                            <div className="flex flex-col justify-center">
                                <h1 className="text-base font-bold text-slate-800 tracking-tight leading-snug">
                                    ระบบรายงานสัตวแพทย์
                                </h1>
                                <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                                    Veterinary & Animal Control
                                </p>
                            </div>
                        </div>

                        {/* Mobile Profile Toggle */}
                        <div className="flex md:hidden items-center gap-2">
                             {user && (
                                <button onClick={onLogout} className="p-2.5 text-slate-400 bg-white border border-slate-200 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm">
                                    <Unlock className="w-4 h-4" />
                                </button>
                             )}
                        </div>
                    </div>

                    {/* 2. Controls & Actions */}
                    <div className="w-full md:w-auto flex flex-wrap items-center justify-center md:justify-end gap-2.5 md:gap-3">
                        
                        {/* --- System Tools Dropdown --- */}
                        {user && (isSuperAdmin || canEdit) && (
                            <div className="relative">
                                <button 
                                    onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
                                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all font-semibold text-xs
                                        ${isSystemMenuOpen 
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 shadow-sm'
                                        }`}
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>เครื่องมือ</span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isSystemMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isSystemMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[40]" onClick={() => setIsSystemMenuOpen(false)}></div>
                                        <div className="absolute top-full left-0 md:left-auto md:right-0 mt-2.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 z-[50] p-2 animate-in fade-in slide-in-from-top-2 overflow-hidden ring-1 ring-black/5">
                                            
                                            {/* --- MagaAdmin Tab Management --- */}
                                            {isMagaAdmin && (
                                                <div className="mb-2">
                                                    <div className="px-3 py-2 bg-rose-50/80 rounded-xl mb-1.5 border border-rose-100/50">
                                                        <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                                                            <Activity className="w-3 h-3" /> Tab Management
                                                        </p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {[
                                                            { id: 'overview', label: 'ภาพรวมสถิติ' },
                                                            { id: 'outbreak', label: 'จัดการจุดเสี่ยง' },
                                                            { id: 'database', label: 'ฐานข้อมูลบริการ' }
                                                        ].map((tab) => (
                                                            <label key={tab.id} className="group flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                                                                <span className="group-hover:text-slate-900">{tab.label}</span>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={tabsConfig[tab.id]} 
                                                                    onChange={() => toggleTab(tab.id)} 
                                                                    className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer transition-all" 
                                                                />
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div className="h-px bg-slate-100 my-2 mx-3"></div>
                                                </div>
                                            )}

                                            <div className="px-3 py-2 bg-slate-50 rounded-xl mb-1.5 border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Management</p>
                                            </div>

                                            <div className="space-y-0.5">
                                                {isSuperAdmin && (
                                                    <>
                                                        <button onClick={() => { onOpenLog(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors text-left group">
                                                            <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" /> ประวัติการใช้งาน (Logs)
                                                        </button>
                                                        <button onClick={() => { onOpenUserMgmt(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors text-left group">
                                                            <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" /> จัดการผู้ใช้งาน
                                                        </button>
                                                        <div className="h-px bg-slate-100 my-1.5 mx-3"></div>
                                                    </>
                                                )}

                                                {canEdit && (
                                                    <>
                                                        <button onClick={() => { onOpenBackup(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors text-left group">
                                                            <Database className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" /> สำรอง/กู้คืนข้อมูล
                                                        </button>
                                                        <button onClick={() => { onOpenCsvOutbreak(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors text-left group">
                                                            <Download className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" /> นำเข้า/ส่งออก จุดระบาด
                                                        </button>
                                                        <button onClick={() => { onOpenCsvReport(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors text-left group">
                                                            <Download className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" /> นำเข้า/ส่งออก รายงาน
                                                        </button>
                                                        <button onClick={() => { onGenerateMock(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-colors text-left group">
                                                            <Zap className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" /> จำลองข้อมูล (Mock Data)
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* View Tools Group (Segmented Control Style) */}
                        {user && (
                            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl shadow-inner border border-slate-200/50">
                                <button onClick={onOpenMeetingList} className="p-2 hover:bg-white text-slate-500 hover:text-slate-800 rounded-lg transition-all relative group hover:shadow-sm" title="ประวัติประชุม">
                                    <List className="w-4 h-4" />
                                </button>
                                
                                <div className="w-px h-4 bg-slate-300/50 mx-1"></div>
                                
                                <button onClick={onOpenCalendar} className="p-2 hover:bg-white text-indigo-500 hover:text-indigo-700 rounded-lg transition-all relative group hover:shadow-sm" title="แผนออกหน่วย">
                                    <CalendarDays className="w-4 h-4" />
                                </button>

                                <div className="w-px h-4 bg-slate-300/50 mx-1"></div>

                                <button onClick={onOpenMeetingCalendar} className="p-2 hover:bg-white text-teal-500 hover:text-teal-700 rounded-lg transition-all relative group hover:shadow-sm" title="ปฏิทินประชุม">
                                    <CalendarDays className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Main Actions */}
                        {user && canEdit && (
                            <div className="flex items-center gap-2">
                                <button onClick={onOpenAddOutbreak} className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 p-2.5 md:px-4 md:py-2.5 rounded-xl shadow-sm transition-all hover:shadow-rose-100/50 hover:-translate-y-0.5 active:translate-y-0">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="hidden sm:inline text-xs font-bold">แจ้งโรค</span>
                                </button>

                                <button onClick={onOpenAddData} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white p-2.5 md:px-4 md:py-2.5 rounded-xl shadow-md transition-all hover:shadow-lg hover:shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0">
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline text-xs font-bold tracking-wide">เพิ่มข้อมูล</span>
                                </button>
                            </div>
                        )}
                        
                        {!user && (
                            <button onClick={onLogin} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-indigo-600/20 transition-all w-full justify-center md:w-auto hover:-translate-y-0.5">
                                <Unlock className="w-4 h-4" />
                                <span>เข้าสู่ระบบเจ้าหน้าที่</span>
                            </button>
                        )}

                         {/* Desktop Profile (Pill Style) */}
                         {user && (
                            <div className="hidden md:flex ml-1 pl-3 border-l border-slate-200 items-center">
                                <div className="flex items-center gap-3 bg-white border border-slate-200 py-1.5 pl-3 pr-1.5 rounded-full shadow-sm">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[11px] font-bold text-slate-700 leading-tight">{user.username}</span>
                                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{user.role}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-slate-50 rounded-full p-1 border border-slate-100">
                                        <button onClick={onChangePassword} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-white rounded-full transition-all shadow-sm" title="เปลี่ยนรหัสผ่าน">
                                            <Key className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={onLogout} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-full transition-all shadow-sm" title="ออกจากระบบ">
                                            <Unlock className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                         )}

                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;