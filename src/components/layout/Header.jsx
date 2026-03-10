import React from 'react';
import { 
    Activity, Unlock, Settings, ChevronDown, FileText, Users, 
    Database, Download, Zap, List, CalendarDays, AlertTriangle, 
    Plus, Key, LogOut
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
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* เปลี่ยน flex โครงสร้างหลักให้รองรับการแยก 3 ส่วน: ซ้าย (Logo), กลาง-ซ้าย (Menu), ขวาสุด (Profile) */}
                <div className="flex flex-col md:flex-row items-center py-3 md:h-16 md:py-0 gap-4 md:gap-8 w-full">
                    
                    {/* 1. Logo & Brand */}
                    <div className="w-full md:w-auto flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-default">
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

                        {/* Mobile Profile Toggle */}
                        <div className="flex md:hidden items-center gap-2">
                             {user && (
                                <button onClick={onLogout} className="p-2 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
                                    <LogOut className="w-4 h-4" />
                                </button>
                             )}
                        </div>
                    </div>

                    {/* 2. Controls & Actions (ย้ายมาชิดซ้าย md:justify-start และให้ขยายเต็มพื้นที่ md:flex-1) */}
                    <div className="w-full md:flex-1 flex flex-wrap items-center justify-center md:justify-start gap-3">
                        
                        {/* --- System Tools Dropdown --- */}
                        {user && (isSuperAdmin || canEdit) && (
                            <div className="relative">
                                <button 
                                    onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all font-medium text-sm
                                        ${isSystemMenuOpen 
                                            ? 'bg-slate-800 text-white' 
                                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                        }`}
                                >
                                    <Settings className="w-4 h-4" />
                                    <span className="hidden sm:inline">เครื่องมือระบบ</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSystemMenuOpen ? 'rotate-180 text-slate-300' : 'text-slate-400'}`} />
                                </button>

                                {isSystemMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[40]" onClick={() => setIsSystemMenuOpen(false)}></div>
                                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-[50] py-2 animate-in fade-in slide-in-from-top-2">
                                            
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
                                                            <label key={tab.id} className="group flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                                                <span className="group-hover:text-slate-900">{tab.label}</span>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={tabsConfig[tab.id]} 
                                                                    onChange={() => toggleTab(tab.id)} 
                                                                    className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer" 
                                                                />
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div className="h-px bg-slate-100 my-2 mx-2"></div>
                                                </div>
                                            )}

                                            <div className="px-4 py-1.5 mb-1">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">System Management</p>
                                            </div>

                                            <div className="space-y-1 px-2">
                                                {isSuperAdmin && (
                                                    <>
                                                        <button onClick={() => { onOpenLog(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors text-left group">
                                                            <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-500" /> ประวัติการใช้งาน (Logs)
                                                        </button>
                                                        <button onClick={() => { onOpenUserMgmt(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors text-left group">
                                                            <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-500" /> จัดการผู้ใช้งาน
                                                        </button>
                                                        <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                                    </>
                                                )}

                                                {canEdit && (
                                                    <>
                                                        <button onClick={() => { onOpenBackup(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left">
                                                            <Database className="w-4 h-4 text-emerald-500" /> สำรอง/กู้คืนข้อมูล
                                                        </button>
                                                        <button onClick={() => { onOpenCsvOutbreak(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left">
                                                            <Download className="w-4 h-4 text-rose-500" /> นำเข้า/ส่งออก จุดระบาด
                                                        </button>
                                                        <button onClick={() => { onOpenCsvReport(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left">
                                                            <Download className="w-4 h-4 text-emerald-500" /> นำเข้า/ส่งออก รายงาน
                                                        </button>
                                                        <button onClick={() => { onGenerateMock(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors text-left">
                                                            <Zap className="w-4 h-4 text-purple-500" /> จำลองข้อมูล (Mock Data)
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
                            <div className="flex items-center bg-slate-100/80 p-1 rounded-lg border border-slate-200/60">
                                <button onClick={onOpenMeetingList} className="p-1.5 hover:bg-white text-slate-500 hover:text-slate-800 rounded-md transition-all shadow-sm-hover" title="ประวัติประชุม">
                                    <List className="w-4 h-4" />
                                </button>
                                <button onClick={onOpenCalendar} className="p-1.5 hover:bg-white text-slate-500 hover:text-indigo-600 rounded-md transition-all shadow-sm-hover" title="แผนออกหน่วย">
                                    <CalendarDays className="w-4 h-4" />
                                </button>
                                <button onClick={onOpenMeetingCalendar} className="p-1.5 hover:bg-white text-slate-500 hover:text-teal-600 rounded-md transition-all shadow-sm-hover" title="ปฏิทินประชุม">
                                    <CalendarDays className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Main Actions */}
                        {user && canEdit && (
                            <div className="flex items-center gap-2">
                                <button onClick={onOpenAddOutbreak} className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-2 rounded-lg font-medium text-sm transition-colors border border-rose-100">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="hidden sm:inline">แจ้งโรค</span>
                                </button>

                                <button onClick={onOpenAddData} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline">เพิ่มข้อมูล</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 3. Login & Profile (แยกมาอยู่ขวาสุด ml-auto) */}
                    <div className="hidden md:flex ml-auto items-center gap-3 shrink-0">
                        
                        {!user && (
                            <button onClick={onLogin} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors justify-center">
                                <Unlock className="w-4 h-4" />
                                <span>เข้าสู่ระบบเจ้าหน้าที่</span>
                            </button>
                        )}

                        {/* Desktop Profile */}
                        {user && (
                            <div className="flex items-center pl-4 border-l border-slate-200">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-bold text-slate-800 leading-none mb-1">{user.username}</span>
                                        <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded">{user.role}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={onChangePassword} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="เปลี่ยนรหัสผ่าน">
                                            <Key className="w-4 h-4" />
                                        </button>
                                        <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="ออกจากระบบ">
                                            <LogOut className="w-4 h-4" />
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