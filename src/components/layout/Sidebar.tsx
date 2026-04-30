import React from 'react';
import { 
    Activity, Unlock, Settings, ChevronDown, FileText, Users, 
    Database, Download, Zap, List, CalendarDays, AlertTriangle, 
    Plus, Key, LogOut, Siren, ChevronLeft, ChevronRight, X,
    RefreshCw, Building2, Trash2, Sparkles, PaintBucket, Bell,
    PawPrint, ShieldCheck, Dog, Palette, LucideIcon
} from 'lucide-react';

// --- Types & Interfaces ---

type ActiveColor = 'indigo' | 'rose' | 'emerald';

interface NavItemProps {
    icon: LucideIcon;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
    isCollapsed: boolean;
    activeColor?: ActiveColor;
}

interface User {
    username: string;
    role: string;
    [key: string]: any;
}

interface SidebarProps {
    user: User | null;
    canEdit?: boolean;
    isSuperAdmin?: boolean;
    isMagaAdmin?: boolean;
    canAdd?: boolean;
    isSystemDeveloper?: boolean;
    isSystemMenuOpen: boolean;
    setIsSystemMenuOpen: (isOpen: boolean) => void;
    isDevOrSuper?: boolean;
    
    // Actions
    onLogin: () => void;
    onLogout: () => void;
    onChangePassword: () => void;
    onOpenLog: () => void;
    onOpenUserMgmt: () => void;
    onOpenBackup: () => void;
    onOpenCsvOutbreak: () => void;
    onOpenCsvReport: () => void;
    onGenerateMock: () => void;
    onOpenMeetingList: () => void;
    onOpenMeetingCalendar: () => void;
    onOpenAddOutbreak: () => void;
    onOpenAddData: () => void;
    onNotifyUpdate: () => void;
    onOpenCustomUnits: () => void;
    onClearData: () => void;
    onOpenBreedMgmt: () => void;
    onOpenColorMgmt: () => void;
    onOpenThemeSettings?: () => void;
    onOpenCalendar?: () => void;
    
    // Tabs & State Management
    tabsConfig?: Record<string, boolean>;
    toggleTab: (tabId: string) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isSidebarCollapsed: boolean;
    setIsSidebarCollapsed: (isCollapsed: boolean) => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
}

// --- Components ---

const NavItem: React.FC<NavItemProps> = ({ 
    icon: Icon, 
    label, 
    isActive = false, 
    onClick, 
    isCollapsed, 
    activeColor = 'indigo' 
}) => {
    const colorStyles: Record<ActiveColor, string> = {
        indigo: isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
        rose: isActive ? 'bg-rose-50 text-rose-700 shadow-sm ring-1 ring-rose-100/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
        emerald: isActive ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
    };

    const iconColors: Record<ActiveColor, string> = {
        indigo: isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500',
        rose: isActive ? 'text-rose-600' : 'text-slate-400 group-hover:text-rose-500',
        emerald: isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500',
    };

    const indicatorColors: Record<ActiveColor, string> = {
        indigo: 'bg-indigo-600',
        rose: 'bg-rose-600',
        emerald: 'bg-emerald-600',
    };

    return (
        <button 
            onClick={onClick} 
            title={label} 
            className={`relative group w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'} rounded-xl text-xs ${isActive ? 'font-semibold' : 'font-medium'} transition-all duration-200 ${colorStyles[activeColor]}`}
        >
            {isActive && !isCollapsed && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-md ${indicatorColors[activeColor]}`} />
            )}
            
            <Icon className={`w-5 h-5 shrink-0 transition-colors ${iconColors[activeColor]}`} />
            {!isCollapsed && <span className="whitespace-nowrap tracking-wide">{label}</span>}
        </button>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ 
    user, canAdd, isSystemDeveloper, isSystemMenuOpen, setIsSystemMenuOpen, isDevOrSuper,
    onLogin, onLogout, onChangePassword, onOpenLog, onOpenUserMgmt,
    onOpenBackup, onOpenCsvOutbreak, onOpenCsvReport, onGenerateMock,
    onOpenMeetingList, onOpenMeetingCalendar, onOpenAddOutbreak, onOpenAddData,
    onNotifyUpdate, onOpenCustomUnits, onClearData, onOpenBreedMgmt, onOpenColorMgmt,
    onOpenThemeSettings = () => alert("กำลังพัฒนาระบบเปลี่ยนสีธีม..."),
    tabsConfig, toggleTab, activeTab, setActiveTab, 
    isSidebarCollapsed, setIsSidebarCollapsed, isMobileMenuOpen, setIsMobileMenuOpen,
    onOpenCalendar 
}) => {
    
    const isCollapsed = isSidebarCollapsed && !isMobileMenuOpen;

    const handleAction = (callback?: () => void) => {
        if (callback) callback();
        setIsMobileMenuOpen(false); 
    };

    const renderSectionHeader = (title: string) => (
        !isCollapsed && (
            <p className="px-3 mt-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                {title}
            </p>
        )
    );

    const checkTabVisibility = (tabName: string): boolean => {
        if (!user) return tabsConfig?.[`public_${tabName}`] ?? false; 
        if (['executive', 'superadmin'].includes(user.role)) return tabsConfig?.[`sa_${tabName}`] ?? false; 
        
        return true; 
    };

    return (
        <>
            {isMobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-slate-900/50 z-[4999] backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside className={`
                fixed md:relative top-0 left-0 h-[100dvh] z-[5000] md:z-auto
                bg-white border-r border-slate-200/70 flex flex-col shrink-0
                transition-all duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0 w-[280px] shadow-2xl' : '-translate-x-full w-[280px] md:translate-x-0'} 
                ${isCollapsed ? 'md:w-[88px]' : 'md:w-[280px]'}
            `}>
                <div className={`h-[80px] flex items-center px-5 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className={`flex items-center gap-3.5 overflow-hidden flex-1 min-w-0 transition-opacity duration-300 ${isCollapsed ? 'hidden' : 'flex'}`}>
                        <div className="relative shrink-0">
                            <img 
                                src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" 
                                alt="Logo" 
                                className="w-11 h-11 object-cover rounded-xl border border-slate-100 shrink-0 shadow-sm" 
                            />
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                        
                        <div className="flex flex-col min-w-0 pr-2">
                            <h1 className="text-xs font-bold text-slate-800 tracking-tight leading-tight mb-1 break-words">
                                ระบบรายงานออกหน่วยสัตวแพทย์เคลื่อนที่
                            </h1>
                            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider leading-none">
                                Mobile Veterinary Unit Reporting System
                            </p>
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

                <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent shrink-0"></div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-1.5 custom-scrollbar">
                    
                    {renderSectionHeader('แดชบอร์ด')}
                    {checkTabVisibility('overview') && <NavItem icon={Activity} label="ภาพรวมสถิติออกหน่วยเคลื่อนที่" isActive={activeTab === 'overview'} onClick={() => handleAction(() => setActiveTab('overview'))} isCollapsed={isCollapsed} activeColor="indigo" />}
                        {checkTabVisibility('database') && <NavItem icon={Database} label="ฐานข้อมูลออกหน่วยเคลื่อนที่" isActive={activeTab === 'database'} onClick={() => handleAction(() => setActiveTab('database'))} isCollapsed={isCollapsed} activeColor="emerald" />}
                    {checkTabVisibility('outbreak') && <NavItem icon={Siren} label="จุดเสี่ยงโรคพิษสุนัขบ้า" isActive={activeTab === 'outbreak'} onClick={() => handleAction(() => setActiveTab('outbreak'))} isCollapsed={isCollapsed} activeColor="rose" />}
                    {checkTabVisibility('calendar') && <NavItem icon={CalendarDays} label="ปฏิทินออกหน่วยเคลื่อนที่" isActive={false} onClick={() => window.open('/DispatchCalendarDashboard', '_blank')} isCollapsed={isCollapsed} activeColor="indigo" />}
                    
                    {user && !['superadmin', 'executive', 'user'].includes(user.role) && (
                    <>
                        {renderSectionHeader('ปฏิทิน & นัดหมาย')}
                            <NavItem icon={List} label="ประวัติประชุม" onClick={() => handleAction(onOpenMeetingList)} isCollapsed={isCollapsed} />
                            <NavItem icon={CalendarDays} label="ปฏิทินประชุม" onClick={() => handleAction(onOpenMeetingCalendar)} isCollapsed={isCollapsed} />
                        </>
                    )}

                    {isDevOrSuper && (
                        <>
                            {renderSectionHeader('การตั้งค่าระบบ')}
                            {!isCollapsed ? (
                                <div className="space-y-1">
                                    <button onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)} className="w-full flex items-center justify-between px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all group">
                                        <div className="flex items-center gap-3">
                                            <Settings className={`w-5 h-5 shrink-0 transition-colors ${isSystemMenuOpen ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                            <span className={`text-xs whitespace-nowrap ${isSystemMenuOpen ? 'font-semibold text-slate-800' : 'font-medium'}`}>ศูนย์ควบคุมระบบ</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 ${isSystemMenuOpen ? 'rotate-180 text-slate-800' : ''}`} />
                                    </button>
                                    
                                   <div className={`grid transition-all duration-300 ease-in-out ${isSystemMenuOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <div className="pl-11 pr-2 py-1 space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 before:rounded-full">
                                                
                                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                                    <div>
                                                        <p className="text-[9px] font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-indigo-500"/> เปิด-ปิดแท็บ (Executive)</p>
                                                        <div className="space-y-3">
                                                            {[
                                                                { id: 'sa_overview', label: 'ภาพรวมออกหน่วย' },
                                                                { id: 'sa_database', label: 'ฐานข้อมูลออกหน่วย' },
                                                                { id: 'sa_outbreak', label: 'จุดเสี่ยงโรค' },
                                                                { id: 'sa_calendar', label: 'ปฏิทินออกหน่วย' }
                                                            ].map(tab => (
                                                                <label key={tab.id} className="flex items-center justify-between cursor-pointer group">
                                                                    <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{tab.label}</span>
                                                                    <div className="relative inline-flex items-center cursor-pointer">
                                                                        <input type="checkbox" checked={tabsConfig?.[tab.id] || false} onChange={() => toggleTab(tab.id)} className="sr-only peer" />
                                                                        <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="h-px bg-slate-100"></div>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-1.5"><Unlock className="w-3.5 h-3.5 text-emerald-500"/> เปิด-ปิดแท็บ (Guest)</p>
                                                        <div className="space-y-3">
                                                            {[
                                                                { id: 'public_overview', label: 'ภาพรวมออกหน่วย' },
                                                                { id: 'public_database', label: 'ฐานข้อมูลออกหน่วย' },
                                                                { id: 'public_outbreak', label: 'จุดเสี่ยงโรค' },
                                                                { id: 'public_calendar', label: 'ปฏิทินออกหน่วย' }
                                                            ].map(tab => (
                                                                <label key={tab.id} className="flex items-center justify-between cursor-pointer group">
                                                                    <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{tab.label}</span>
                                                                    <div className="relative inline-flex items-center cursor-pointer">
                                                                        <input type="checkbox" checked={tabsConfig?.[tab.id] || false} onChange={() => toggleTab(tab.id)} className="sr-only peer" />
                                                                        <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-1.5">
                                                    <p className="text-[9px] font-bold text-slate-400 mb-2 uppercase tracking-wider">จัดการระบบหลัก</p>
                                                    <button onClick={() => handleAction(onOpenThemeSettings)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors"><PaintBucket className="w-4 h-4 shrink-0 text-slate-400"/> รูปแบบหน้าจอ</button>
                                                    <button onClick={() => handleAction(onOpenUserMgmt)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors"><Users className="w-4 h-4 shrink-0 text-slate-400"/> บัญชีผู้ใช้</button>
                                                    <button onClick={() => handleAction(onOpenCustomUnits)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors"><Building2 className="w-4 h-4 shrink-0 text-slate-400"/> รายชื่อหน่วยงาน</button>
                                                    
                                                    <button onClick={() => handleAction(onOpenBreedMgmt)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors"><Dog className="w-4 h-4 shrink-0 text-slate-400"/> จัดการสายพันธุ์</button>
                                                    <button onClick={() => handleAction(onOpenColorMgmt)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors"><Palette className="w-4 h-4 shrink-0 text-slate-400"/> จัดการสีสัตว์</button>
                                                    
                                                    {isSystemDeveloper && (
                                                        <button onClick={() => handleAction(onNotifyUpdate)} className="w-full text-left py-2 px-3 mt-3 rounded-xl text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 flex items-center gap-3 transition-all border border-sky-200">
                                                            <RefreshCw className="w-4 h-4 shrink-0" />
                                                            บังคับอัปเดตระบบ
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5 pb-2">
                                                    <p className="text-[9px] font-bold text-slate-400 mb-2 uppercase tracking-wider">ความปลอดภัย & ข้อมูล</p>
                                                    <button onClick={() => handleAction(onOpenLog)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 transition-colors"><FileText className="w-4 h-4 shrink-0 text-slate-400"/> ประวัติใช้งาน (Log)</button>
                                                    <button onClick={() => handleAction(onOpenBackup)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 transition-colors"><Database className="w-4 h-4 shrink-0 text-slate-400"/> สำรอง/กู้คืนข้อมูล</button>
                                                    <button onClick={() => handleAction(onOpenCsvOutbreak)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors"><Download className="w-4 h-4 shrink-0 text-slate-400"/> นำเข้า CSV (ระบาด)</button>
                                                    <button onClick={() => handleAction(onOpenCsvReport)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 transition-colors"><Download className="w-4 h-4 shrink-0 text-slate-400"/> นำเข้า CSV (บริการ)</button>
                                                    <button onClick={() => handleAction(onGenerateMock)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors"><Sparkles className="w-4 h-4 shrink-0 text-slate-400"/> สร้าง Mock Data</button>
                                                    <button onClick={() => handleAction(onClearData)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors mt-2"><Trash2 className="w-4 h-4 shrink-0"/> ล้างข้อมูลทั้งหมด</button>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => { setIsSidebarCollapsed(false); setIsSystemMenuOpen(true); }} title="ศูนย์ควบคุม" className="w-full flex justify-center p-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                                    <Settings className="w-5 h-5 shrink-0" />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {user && canAdd && !['superadmin', 'executive'].includes(user.role) && (
                    <div className={`px-4 pt-2 pb-4 shrink-0 bg-white space-y-2.5 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                        <button onClick={() => handleAction(onOpenAddOutbreak)} title="แจ้งโรคระบาด" 
                            className={`group flex items-center justify-center gap-2 ${isCollapsed ? 'w-12 h-12 p-0 rounded-[14px]' : 'w-full px-4 py-3 rounded-xl'} font-semibold text-xs bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all duration-300 border border-rose-200/50 hover:border-transparent hover:shadow-lg hover:shadow-rose-500/25`}>
                            <AlertTriangle className="w-[18px] h-[18px] shrink-0" />
                            {!isCollapsed && <span>แจ้งโรคระบาด</span>}
                        </button>
                        <button onClick={() => handleAction(onOpenAddData)} title="เพิ่มข้อมูลบริการ" 
                            className={`group flex items-center justify-center gap-2 ${isCollapsed ? 'w-12 h-12 p-0 rounded-[14px]' : 'w-full px-4 py-3 rounded-xl'} font-semibold text-xs bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/25 transition-all duration-300`}>
                            <Plus className="w-[18px] h-[18px] shrink-0" />
                            {!isCollapsed && <span>เพิ่มข้อมูลบริการ</span>}
                        </button>
                    </div>
                )}

                <div className={`m-3 shrink-0 ${isCollapsed ? 'mt-0' : 'mt-auto'}`}>
                    <div className={`bg-slate-50 border border-slate-200/60 rounded-2xl ${isCollapsed ? 'p-2' : 'p-3'}`}>
                        {!user ? (
                            <button onClick={() => handleAction(onLogin)} title="เข้าสู่ระบบ" className={`group w-full flex items-center justify-center gap-2 ${isCollapsed ? 'p-2.5' : 'px-4 py-2.5'} bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-all shadow-md`}>
                                <Unlock className="w-[18px] h-[18px] shrink-0" />
                                {!isCollapsed && <span>เข้าสู่ระบบ</span>}
                            </button>
                        ) : (
                            <div className={`flex items-center justify-between gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
                                {!isCollapsed && (
                                    <div className="flex items-center gap-3 w-full overflow-hidden pl-1">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-xs font-bold text-slate-800 truncate">{user.username}</span>
                                        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                                            {user.role === 'Developer' ? 'ผู้พัฒนาระบบ' : user.role}
                                        </span>
                                    </div>
                                    </div>
                                )}
                                <div className={`flex ${isCollapsed ? 'flex-col gap-1 w-full' : 'gap-1 shrink-0'}`}>
                                    <button onClick={() => handleAction(onChangePassword)} className={`p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-xl transition-all shrink-0 ${isCollapsed ? 'flex justify-center w-full bg-white border border-slate-200 shadow-sm' : ''}`} title="เปลี่ยนรหัสผ่าน">
                                        <Key className="w-[18px] h-[18px]" />
                                    </button>
                                    <button onClick={() => handleAction(onLogout)} className={`p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl transition-all shrink-0 ${isCollapsed ? 'flex justify-center w-full bg-white border border-slate-200 shadow-sm' : ''}`} title="ออกจากระบบ">
                                        <LogOut className="w-[18px] h-[18px]" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;