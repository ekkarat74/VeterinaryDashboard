import React from 'react';
import { 
    Activity, Unlock, Settings, ChevronDown, FileText, Users, 
    Database, Download, Zap, List, CalendarDays, AlertTriangle, 
    Plus, Key, LogOut, Siren, ChevronLeft, ChevronRight, X,
    RefreshCw 
} from 'lucide-react';

// --------------------------------------------------------
// 🧩 Reusable Component: ปุ่มเมนูย่อย
// --------------------------------------------------------
const NavItem = ({ icon: Icon, label, isActive, onClick, isCollapsed, activeColor = 'indigo' }) => {
    // กำหนดสีพื้นหลังและตัวอักษร
    const colorStyles = {
        indigo: isActive ? 'bg-indigo-50/80 text-indigo-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
        rose: isActive ? 'bg-rose-50/80 text-rose-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
        emerald: isActive ? 'bg-emerald-50/80 text-emerald-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
    };

    // กำหนดสีไอคอน
    const iconColors = {
        indigo: isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500',
        rose: isActive ? 'text-rose-600' : 'text-slate-400 group-hover:text-rose-500',
        emerald: isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500',
    };

    // กำหนดสีของแถบ Indicator ด้านซ้าย (เพื่อความโมเดิร์น)
    const indicatorColors = {
        indigo: 'bg-indigo-600',
        rose: 'bg-rose-600',
        emerald: 'bg-emerald-600',
    };

    return (
        <button 
            onClick={onClick} 
            title={label} 
            className={`relative group w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl text-sm ${isActive ? 'font-semibold' : 'font-medium'} transition-all duration-200 ${colorStyles[activeColor]}`}
        >
            {/* Active Indicator Line */}
            {isActive && !isCollapsed && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full ${indicatorColors[activeColor]}`} />
            )}
            
            <Icon className={`w-5 h-5 shrink-0 transition-colors ${iconColors[activeColor]}`} />
            {!isCollapsed && <span className="whitespace-nowrap tracking-wide">{label}</span>}
        </button>
    );
};

// --------------------------------------------------------
// 🚀 Main Sidebar Component
// --------------------------------------------------------
const Sidebar = ({ 
    user, isSuperAdmin, canEdit, isSystemDeveloper, isSystemMenuOpen, setIsSystemMenuOpen, isDevOrSuper,
    onLogin, onLogout, onChangePassword, onOpenLog, onOpenUserMgmt,
    onOpenBackup, onOpenCsvOutbreak, onOpenCsvReport, onGenerateMock,
    onOpenMeetingList, onOpenCalendar, onOpenMeetingCalendar,
    onOpenMeetingModal, onOpenAddOutbreak, onOpenAddData,
    onNotifyUpdate,
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
            <p className="px-4 mt-5 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">
                {title}
            </p>
        )
    );

    // ✨ Helper: ตรวจสอบสิทธิ์การมองเห็นแท็บตามแต่ละ Role และการตั้งค่า
    const checkTabVisibility = (tabName) => {
        if (!user) return tabsConfig?.[`public_${tabName}`] || false; // ถ้าไม่ได้ล็อกอิน
        if (user.role === 'superadmin') return tabsConfig?.[`sa_${tabName}`] || false; // ถ้าเป็น SuperAdmin
        return true; // Developer, MagaAdmin และระดับที่สูงกว่าให้เห็นทั้งหมด
    };

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
                bg-white border-r border-slate-200/80 flex flex-col shrink-0
                transition-all duration-300 ease-out
                ${isMobileMenuOpen ? 'translate-x-0 w-[270px] shadow-2xl' : '-translate-x-full w-[270px] md:translate-x-0'} 
                ${isCollapsed ? 'md:w-[84px]' : 'md:w-[270px]'}
            `}>
                
                {/* --- 1. Logo & Branding --- */}
                <div className={`h-[76px] flex items-center px-4 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className={`flex items-center gap-3 overflow-hidden transition-opacity duration-300 ${isCollapsed ? 'hidden' : 'flex'}`}>
                        <div className="relative">
                            <img 
                                src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" 
                                alt="Logo" 
                                className="w-10 h-10 object-cover rounded-xl border border-slate-100 shrink-0 shadow-sm" 
                            />
                            {/* Decorative dot */}
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex flex-col whitespace-nowrap">
                            <h1 className="text-[15px] font-bold text-slate-800 tracking-tight leading-none mb-1">ระบบสัตวแพทย์</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Animal Control</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                        className="hidden md:flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                    >
                        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>

                    <button 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className="md:hidden flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent shrink-0"></div>

                {/* --- 2. Menu Items --- */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1.5 custom-scrollbar">
                    
                    {/* 🟢 แดชบอร์ด & ข้อมูล */}
                    {renderSectionHeader('แดชบอร์ด')}
                    {checkTabVisibility('overview') && <NavItem icon={Activity} label="ภาพรวมสถิติ" isActive={activeTab === 'overview'} onClick={() => handleAction(() => setActiveTab('overview'))} isCollapsed={isCollapsed} activeColor="indigo" />}
                    {checkTabVisibility('outbreak') && <NavItem icon={Siren} label="จัดการจุดเสี่ยง" isActive={activeTab === 'outbreak'} onClick={() => handleAction(() => setActiveTab('outbreak'))} isCollapsed={isCollapsed} activeColor="rose" />}
                    {checkTabVisibility('database') && <NavItem icon={Database} label="ฐานข้อมูลบริการ" isActive={activeTab === 'database'} onClick={() => handleAction(() => setActiveTab('database'))} isCollapsed={isCollapsed} activeColor="emerald" />}
                    {checkTabVisibility('calendar') && <NavItem icon={CalendarDays} label="ปฏิทินออกหน่วย" isActive={activeTab === 'calendar'} onClick={() => handleAction(() => setActiveTab('calendar'))} isCollapsed={isCollapsed} activeColor="indigo" />}
                    
                    {/* 🟢 ปฏิทิน & นัดหมาย (ซ่อนจาก superadmin) */}
                    {user && user.role !== 'superadmin' && (
                    <>
                        {renderSectionHeader('ปฏิทิน & นัดหมาย')}
                            <NavItem icon={List} label="ประวัติประชุม" onClick={() => handleAction(onOpenMeetingList)} isCollapsed={isCollapsed} />
                            <NavItem icon={CalendarDays} label="ปฏิทินประชุม" onClick={() => handleAction(onOpenMeetingCalendar)} isCollapsed={isCollapsed} />
                        </>
                    )}

                    {/* 🟢 ตั้งค่าระบบ (ซ่อนจาก superadmin) */}
                    {user && user.role !== 'superadmin' && (isSuperAdmin || canEdit) && (
                        <>
                            {renderSectionHeader('การตั้งค่า')}
                            {!isCollapsed ? (
                                <div className="space-y-1">
                                    <button onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)} className="w-full flex items-center justify-between px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all group">
                                        <div className="flex items-center gap-3">
                                            <Settings className={`w-5 h-5 shrink-0 transition-colors ${isSystemMenuOpen ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                            <span className={`text-sm whitespace-nowrap ${isSystemMenuOpen ? 'font-semibold text-slate-800' : 'font-medium'}`}>เครื่องมือระบบ</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 ${isSystemMenuOpen ? 'rotate-180 text-slate-800' : ''}`} />
                                    </button>
                                    
                                    {/* Dropdown Content */}
                                   <div className={`grid transition-all duration-300 ease-in-out ${isSystemMenuOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <div className="pl-11 pr-3 py-2 space-y-3 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                                                
                                                {/* ✨ โซนจัดการแท็บ (เฉพาะ MagaAdmin / Developer) */}
                                                {(isMagaAdmin || isSystemDeveloper) && (
                                                    <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                                                        
                                                        {/* ส่วนที่ 1: สำหรับ SuperAdmin */}
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">เปิด-ปิดแท็บ (SuperAdmin)</p>
                                                            <div className="space-y-2.5">
                                                                {[
                                                                    { id: 'sa_overview', label: 'ภาพรวม' },
                                                                    { id: 'sa_outbreak', label: 'จุดเสี่ยง' },
                                                                    { id: 'sa_database', label: 'ฐานข้อมูล' },
                                                                    { id: 'sa_calendar', label: 'ปฏิทิน' }
                                                                ].map(tab => (
                                                                    <label key={tab.id} className="flex items-center justify-between cursor-pointer group">
                                                                        <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{tab.label}</span>
                                                                        <input type="checkbox" checked={tabsConfig?.[tab.id] || false} onChange={() => toggleTab(tab.id)} className="w-3.5 h-3.5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 transition-all" />
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="h-px bg-slate-200"></div>

                                                        {/* ส่วนที่ 2: สำหรับคนทั่วไป */}
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">เปิด-ปิดแท็บ (ไม่ได้ล็อกอิน)</p>
                                                            <div className="space-y-2.5">
                                                                {[
                                                                    { id: 'public_overview', label: 'ภาพรวม' },
                                                                    { id: 'public_outbreak', label: 'จุดเสี่ยง' },
                                                                    { id: 'public_database', label: 'ฐานข้อมูล' },
                                                                    { id: 'public_calendar', label: 'ปฏิทิน' }
                                                                ].map(tab => (
                                                                    <label key={tab.id} className="flex items-center justify-between cursor-pointer group">
                                                                        <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{tab.label}</span>
                                                                        <input type="checkbox" checked={tabsConfig?.[tab.id] || false} onChange={() => toggleTab(tab.id)} className="w-3.5 h-3.5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 transition-all" />
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>

                                                    </div>
                                                )}
                                                
                                                <div className="space-y-0.5">
                                                    {isSuperAdmin && (
                                                        <>
                                                            <button onClick={() => handleAction(onOpenLog)} className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-2.5 transition-colors"><FileText className="w-4 h-4 shrink-0"/> ประวัติใช้งาน</button>
                                                            <button onClick={() => handleAction(onOpenUserMgmt)} className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-2.5 transition-colors"><Users className="w-4 h-4 shrink-0"/> จัดการผู้ใช้</button>
                                                        </>
                                                    )}
                                                    {canEdit && (
                                                        <>
                                                            <button onClick={() => handleAction(onOpenBackup)} className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors"><Database className="w-4 h-4 shrink-0"/> สำรองข้อมูล</button>
                                                            <button onClick={() => handleAction(onOpenCsvOutbreak)} className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"><Download className="w-4 h-4 shrink-0"/> นำเข้า CSV ระบาด</button>
                                                            <button onClick={() => handleAction(onOpenCsvReport)} className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors"><Download className="w-4 h-4 shrink-0"/> นำเข้า CSV บริการ</button>
                                                            
                                                            {isSystemDeveloper && (
                                                                <button onClick={() => handleAction(onNotifyUpdate)} className="w-full text-left py-2 px-3 mt-2 rounded-lg text-sm font-medium text-sky-600 bg-sky-50/80 hover:text-sky-700 hover:bg-sky-100 flex items-center gap-2.5 transition-all shadow-sm border border-sky-100/50">
                                                                    <RefreshCw className="w-4 h-4 shrink-0" />
                                                                    บังคับอัปเดตระบบ
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => { setIsSidebarCollapsed(false); setIsSystemMenuOpen(true); }} title="เครื่องมือระบบ" className="w-full flex justify-center p-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                                    <Settings className="w-5 h-5 shrink-0" />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* --- 4. ดำเนินการด่วน (Action Buttons) --- */}
                {/* ✨ ซ่อนปุ่มการกระทำทั้งหมดจาก superadmin */}
                {user && canEdit && user.role !== 'superadmin' && (
                    <div className={`p-4 shrink-0 border-t border-slate-100 bg-white space-y-2.5 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                        <button onClick={() => handleAction(onOpenAddOutbreak)} title="แจ้งโรคระบาด" 
                            className={`group flex items-center justify-center gap-2 ${isCollapsed ? 'w-11 h-11 p-0 rounded-xl' : 'w-full px-4 py-2.5 rounded-xl'} font-semibold text-sm bg-rose-50/50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all duration-300 border border-rose-200/60 hover:border-rose-500 hover:shadow-md hover:shadow-rose-500/20`}>
                            <AlertTriangle className="w-[18px] h-[18px] shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">แจ้งโรคระบาด</span>}
                        </button>
                        <button onClick={() => handleAction(onOpenAddData)} title="เพิ่มข้อมูลบริการ" 
                            className={`group flex items-center justify-center gap-2 ${isCollapsed ? 'w-11 h-11 p-0 rounded-xl' : 'w-full px-4 py-2.5 rounded-xl'} font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 transition-all duration-300`}>
                            <Plus className="w-[18px] h-[18px] shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">เพิ่มข้อมูลบริการ</span>}
                        </button>
                    </div>
                )}

                {/* --- 5. Footer / Profile Section --- */}
                <div className="p-4 bg-[#F8FAFC] border-t border-slate-200/80 shrink-0">
                    {!user ? (
                        <button onClick={() => handleAction(onLogin)} title="เข้าสู่ระบบ" className={`group w-full flex items-center justify-center gap-2 ${isCollapsed ? 'p-3' : 'px-4 py-3'} bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg`}>
                            <Unlock className="w-[18px] h-[18px] shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">เข้าสู่ระบบ</span>}
                        </button>
                    ) : (
                        <div className={`flex items-center justify-between gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
                            {!isCollapsed && (
                                <div className="flex items-center gap-3 w-full overflow-hidden">
                                    <div className="w-9 h-9 rounded-[10px] bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ring-2 ring-white">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm font-bold text-slate-800 truncate">{user.username}</span>
                                    {/* ✅ แปลงข้อความ Role 'Developer' ให้เป็น 'ผู้พัฒนาระบบ' */}
                                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider truncate">
                                        {user.role === 'Developer' ? 'ผู้พัฒนาระบบ' : user.role}
                                    </span>
                                </div>
                                </div>
                            )}
                            <div className={`flex ${isCollapsed ? 'flex-col gap-2 w-full' : 'gap-1 shrink-0'}`}>
                                {/* ✨ ซ่อนปุ่มเปลี่ยนรหัสจาก superadmin */}
                                {user.role !== 'superadmin' && (
                                    <button onClick={() => handleAction(onChangePassword)} className={`p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all shrink-0 ${isCollapsed ? 'flex justify-center w-full bg-white border border-slate-200 shadow-sm' : ''}`} title="เปลี่ยนรหัสผ่าน">
                                        <Key className="w-[18px] h-[18px]" />
                                    </button>
                                )}
                                <button onClick={() => handleAction(onLogout)} className={`p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0 ${isCollapsed ? 'flex justify-center w-full bg-white border border-slate-200 shadow-sm' : ''}`} title="ออกจากระบบ">
                                    <LogOut className="w-[18px] h-[18px]" />
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