import React from 'react';
import { 
    Activity, Unlock, Settings, ChevronDown, FileText, Users, 
    Database, Download, Zap, List, CalendarDays, AlertTriangle, 
    Plus, Key, LogOut, Siren, ChevronLeft, ChevronRight, X,
    RefreshCw, Building2, Trash2, Sparkles, PaintBucket, Bell,
    PawPrint, ShieldCheck, Dog, Palette, LucideIcon, Copy // <-- เพิ่ม Copy ตรงนี้
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
    availableOutbreakYears?: string[];
    
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
    onOpenClinicData: () => void;
    onNotifyUpdate: () => void;
    onOpenCustomUnits: () => void;
    onClearData: () => void;
    onOpenBreedMgmt: () => void;
    onOpenColorMgmt: () => void;
    onOpenDuplicateCheck: () => void;
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

    // Notifications
    notifications?: any[];
    isNotifOpen?: boolean;
    setIsNotifOpen?: (isOpen: boolean) => void;
    markAllAsRead?: () => void;
    unreadCount?: number;
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
    const baseStyle = "relative group w-full flex items-center rounded-xl text-xs transition-all duration-300";
    const paddingStyle = isCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3.5 py-3';
    
    const colorStyles: Record<ActiveColor, string> = {
        indigo: isActive ? 'bg-indigo-50/80 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
        rose: isActive ? 'bg-rose-50/80 text-rose-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
        emerald: isActive ? 'bg-emerald-50/80 text-emerald-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
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
            className={`${baseStyle} ${paddingStyle} ${isActive ? 'font-semibold' : 'font-medium'} ${colorStyles[activeColor]}`}
        >
            {isActive && !isCollapsed && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full ${indicatorColors[activeColor]} shadow-sm`} />
            )}
            
            <Icon className={`w-5 h-5 shrink-0 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'} ${iconColors[activeColor]}`} />
            {!isCollapsed && <span className="whitespace-nowrap tracking-wide">{label}</span>}
        </button>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ 
    user, canAdd, isSystemDeveloper, isSystemMenuOpen, setIsSystemMenuOpen, isDevOrSuper,
    onLogin, onLogout, onChangePassword, onOpenLog, onOpenUserMgmt,
    onOpenBackup, onOpenCsvOutbreak, onOpenCsvReport, onGenerateMock,
    onOpenMeetingList, onOpenMeetingCalendar, onOpenAddOutbreak, onOpenAddData, onOpenClinicData,
    onNotifyUpdate, onOpenCustomUnits, onClearData, onOpenBreedMgmt, onOpenColorMgmt,
    onOpenDuplicateCheck,
    onOpenThemeSettings = () => alert("กำลังพัฒนาระบบเปลี่ยนสีธีม..."),
    tabsConfig, toggleTab, activeTab, setActiveTab, 
    isSidebarCollapsed, setIsSidebarCollapsed, isMobileMenuOpen, setIsMobileMenuOpen,
    onOpenCalendar, availableOutbreakYears = [], notifications = [],
    isNotifOpen = false, setIsNotifOpen, markAllAsRead, unreadCount = 0
}) => {
    
    const isCollapsed = isSidebarCollapsed && !isMobileMenuOpen;

    const handleAction = (callback?: () => void) => {
        if (callback) callback();
        setIsMobileMenuOpen(false); 
    };

    const renderSectionHeader = (title: string) => (
        !isCollapsed && (
            <div className="flex items-center px-4 mt-6 mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                    {title}
                </p>
                <div className="ml-3 h-px flex-1 bg-slate-100"></div>
            </div>
        )
    );

    const checkTabVisibility = (tabName: string): boolean => {
        if (!user) return tabsConfig?.[`public_${tabName}`] ?? false; 
        if (['executive', 'superadmin'].includes(user.role)) return tabsConfig?.[`sa_${tabName}`] ?? false; 
        return true; 
    };

    // Custom Switch Component
    const ToggleSwitch = ({ checked, onChange, colorClass }: { checked: boolean, onChange: () => void, colorClass: string }) => (
        <div className="relative inline-flex items-center cursor-pointer" onClick={onChange}>
            <div className={`w-8 h-4.5 rounded-full transition-colors duration-300 ease-in-out shadow-inner ${checked ? colorClass : 'bg-slate-200'}`}></div>
            <div className={`absolute left-0.5 top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-300 ease-in-out ${checked ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
        </div>
    );

    return (
        <>
            {isMobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-slate-900/40 z-[4999] backdrop-blur-sm transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside className={`
                fixed md:relative top-0 left-0 h-[100dvh] z-[5000] md:z-auto
                bg-white border-r border-slate-200/80 flex flex-col shrink-0
                transition-all duration-300 ease-out
                ${isMobileMenuOpen ? 'translate-x-0 w-[280px] shadow-2xl' : '-translate-x-full w-[280px] md:translate-x-0'} 
                ${isCollapsed ? 'md:w-[88px]' : 'md:w-[280px]'}
            `}>
                {/* Header Logo Area */}
                <div className={`h-[88px] flex items-center px-5 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className={`flex items-center gap-3.5 overflow-hidden flex-1 min-w-0 transition-opacity duration-300 ${isCollapsed ? 'hidden' : 'flex'}`}>
                        <div className="relative shrink-0">
                            <img 
                                src="https://img1.pic.in.th/images/LOGO49be9f8730bf13de.jpg" 
                                alt="Logo" 
                                className="w-11 h-11 object-cover rounded-xl border border-slate-100 shrink-0 shadow-sm" 
                            />
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                        
                        <div className="flex flex-col min-w-0 pr-2">
                            <h1 className="text-xs font-bold text-slate-800 tracking-tight leading-tight mb-0.5 break-words">
                                ระบบสำนักงานสัตวแพทย์สาธารณสุข
                            </h1>
                            <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest leading-none">
                                Public Health Veterinary Office System
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                        className="hidden md:flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all shrink-0"
                    >
                        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>

                    <button 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className="md:hidden flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent shrink-0"></div>

                {/* Main Navigation Scroll Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-4 space-y-1.5 scrollbar-hide">
                    
                    {renderSectionHeader('แดชบอร์ด')}
                    {checkTabVisibility('overview') && <NavItem icon={Activity} label="แดชบอร์ดออกหน่วย" isActive={activeTab === 'overview'} onClick={() => handleAction(() => setActiveTab('overview'))} isCollapsed={isCollapsed} activeColor="indigo" />}
                    {checkTabVisibility('clinic') && <NavItem icon={Building2} label="แดชบอร์ดคลินิก" isActive={activeTab === 'clinic'} onClick={() => handleAction(() => setActiveTab('clinic'))} isCollapsed={isCollapsed} activeColor="emerald" />}
                    {checkTabVisibility('database') && <NavItem icon={Database} label="ฐานข้อมูลออกหน่วย" isActive={activeTab === 'database'} onClick={() => handleAction(() => setActiveTab('database'))} isCollapsed={isCollapsed} activeColor="emerald" />}
                    {checkTabVisibility('outbreak') && <NavItem icon={Siren} label="จุดเสี่ยงโรคพิษสุนัขบ้า" isActive={activeTab === 'outbreak'} onClick={() => handleAction(() => setActiveTab('outbreak'))} isCollapsed={isCollapsed} activeColor="rose" />}
                    {checkTabVisibility('calendar') && <NavItem icon={CalendarDays} label="ปฏิทินออกหน่วย" isActive={false} onClick={() => window.open('/DispatchCalendarDashboard', '_blank')} isCollapsed={isCollapsed} activeColor="indigo" />}
                    
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
                                <div className="space-y-1 bg-slate-50/50 rounded-2xl p-1.5 border border-slate-100/50">
                                    <button onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)} className="w-full flex items-center justify-between px-3 py-2.5 text-slate-600 hover:bg-white hover:shadow-sm rounded-xl transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1 rounded-lg transition-colors ${isSystemMenuOpen ? 'bg-slate-200/50' : 'bg-transparent'}`}>
                                                <Settings className={`w-4 h-4 shrink-0 transition-colors ${isSystemMenuOpen ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                            </div>
                                            <span className={`text-xs whitespace-nowrap ${isSystemMenuOpen ? 'font-semibold text-slate-800' : 'font-medium'}`}>ศูนย์ควบคุมระบบ</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 ${isSystemMenuOpen ? 'rotate-180 text-slate-800' : ''}`} />
                                    </button>
                                    
                                   <div className={`grid transition-all duration-300 ease-in-out ${isSystemMenuOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <div className="px-2 py-2 space-y-4">
                                                
                                                {/* Executive Setting Card */}
                                                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
                                                    <p className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5 text-indigo-500"/> เปิด-ปิดแท็บ (Executive)
                                                    </p>
                                                    <div className="space-y-2.5">
                                                        {[
                                                            { id: 'sa_overview', label: 'ภาพรวมออกหน่วย' },
                                                            { id: 'sa_clinic', label: 'แดชบอร์ดคลินิก' },
                                                            { id: 'sa_database', label: 'ฐานข้อมูลออกหน่วย' },
                                                            { id: 'sa_outbreak', label: 'จุดเสี่ยงโรค' },
                                                            { id: 'sa_calendar', label: 'ปฏิทินออกหน่วย' }
                                                        ].map(tab => (
                                                            <div key={tab.id} className="flex items-center justify-between group">
                                                                <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{tab.label}</span>
                                                                <ToggleSwitch checked={tabsConfig?.[tab.id] || false} onChange={() => toggleTab(tab.id)} colorClass="bg-indigo-500" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Guest Setting Card */}
                                                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
                                                    <p className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Unlock className="w-3.5 h-3.5 text-emerald-500"/> เปิด-ปิดแท็บ (Guest)
                                                    </p>
                                                    <div className="space-y-2.5">
                                                        {[
                                                            { id: 'public_overview', label: 'ภาพรวมออกหน่วย' },
                                                            { id: 'public_clinic', label: 'แดชบอร์ดคลินิก' },
                                                            { id: 'public_database', label: 'ฐานข้อมูลออกหน่วย' },
                                                            { id: 'public_outbreak', label: 'จุดเสี่ยงโรค' },
                                                            { id: 'public_calendar', label: 'ปฏิทินออกหน่วย' }
                                                        ].map(tab => (
                                                            <div key={tab.id} className="flex items-center justify-between group">
                                                                <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{tab.label}</span>
                                                                <ToggleSwitch checked={tabsConfig?.[tab.id] || false} onChange={() => toggleTab(tab.id)} colorClass="bg-emerald-500" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                {/* Outbreak Year Setting Card */}
                                                <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-sm">
                                                    <p className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Siren className="w-3.5 h-3.5 text-rose-500"/> ข้อมูลโรคระบาดรายปี
                                                    </p>
                                                    <div className="space-y-2.5">
                                                        {availableOutbreakYears.map((year) => {
                                                            const configKey = `outbreak_year_${year}`;
                                                            const isChecked = tabsConfig?.[configKey] ?? true;
                                                            return (
                                                                <div key={configKey} className="flex items-center justify-between group">
                                                                    <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">ปี พ.ศ. {parseInt(year) + 543}</span>
                                                                    <ToggleSwitch checked={isChecked} onChange={() => toggleTab(configKey)} colorClass="bg-rose-500" />
                                                                </div>
                                                            );
                                                        })}
                                                        {availableOutbreakYears.length === 0 && (
                                                            <div className="text-center py-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                                                <span className="text-[10px] text-slate-400">ไม่มีข้อมูลปีในระบบ</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                            
                                            {/* System Management Menu */}
                                            <div className="px-2 pb-2 space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 mb-2 mt-2 px-2 uppercase tracking-wider">จัดการระบบหลัก</p>
                                                <button onClick={() => handleAction(onOpenThemeSettings)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors"><PaintBucket className="w-4 h-4 shrink-0 text-slate-400"/> รูปแบบหน้าจอ</button>
                                                <button onClick={() => handleAction(onOpenUserMgmt)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors"><Users className="w-4 h-4 shrink-0 text-slate-400"/> บัญชีผู้ใช้</button>
                                                <button onClick={() => handleAction(onOpenCustomUnits)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors"><Building2 className="w-4 h-4 shrink-0 text-slate-400"/> รายชื่อหน่วยงาน</button>
                                                <button onClick={() => handleAction(onOpenBreedMgmt)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors"><Dog className="w-4 h-4 shrink-0 text-slate-400"/> จัดการสายพันธุ์</button>
                                                <button onClick={() => handleAction(onOpenColorMgmt)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors"><Palette className="w-4 h-4 shrink-0 text-slate-400"/> จัดการสีสัตว์</button>
                                                
                                                {isSystemDeveloper && (
                                                    <button onClick={() => handleAction(onNotifyUpdate)} className="w-full text-left py-2 px-3 mt-3 rounded-xl text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 flex items-center justify-center gap-2 transition-all border border-sky-200/60 shadow-sm">
                                                        <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                                                        บังคับอัปเดตระบบ
                                                    </button>
                                                )}
                                            </div>

                                            <div className="px-2 pb-3 space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 mb-2 mt-2 px-2 uppercase tracking-wider">ความปลอดภัย & ข้อมูล</p>
                                                <button onClick={() => handleAction(onOpenDuplicateCheck)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-amber-600 hover:bg-amber-50 flex items-center gap-3 transition-colors">
                                                    <Copy className="w-4 h-4 shrink-0 text-slate-400"/> ตรวจสอบข้อมูลซ้ำ
                                                </button>
                                                <button onClick={() => handleAction(onOpenLog)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 transition-colors"><FileText className="w-4 h-4 shrink-0 text-slate-400"/> ประวัติใช้งาน (Log)</button>
                                                <button onClick={() => handleAction(onOpenBackup)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 transition-colors"><Database className="w-4 h-4 shrink-0 text-slate-400"/> สำรอง/กู้คืนข้อมูล</button>
                                                <button onClick={() => handleAction(onOpenCsvOutbreak)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors"><Download className="w-4 h-4 shrink-0 text-slate-400"/> นำเข้า CSV (ระบาด)</button>
                                                <button onClick={() => handleAction(onOpenCsvReport)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 transition-colors"><Download className="w-4 h-4 shrink-0 text-slate-400"/> นำเข้า CSV (บริการ)</button>
                                                <button onClick={() => handleAction(onGenerateMock)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors"><Sparkles className="w-4 h-4 shrink-0 text-slate-400"/> สร้าง Mock Data</button>
                                                <div className="pt-2">
                                                    <button onClick={() => handleAction(onClearData)} className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-2 transition-colors border border-rose-100"><Trash2 className="w-3.5 h-3.5 shrink-0"/> ล้างข้อมูลทั้งหมด</button>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => { setIsSidebarCollapsed(false); setIsSystemMenuOpen(true); }} title="ศูนย์ควบคุม" className="w-full flex justify-center p-3 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                                    <Settings className="w-5 h-5 shrink-0" />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Primary Actions (Add Data) */}
                {user && canAdd && !['superadmin', 'executive'].includes(user.role) && (
                    <div className={`px-4 pt-3 pb-3 shrink-0 bg-white space-y-2 border-t border-slate-100 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                        <button onClick={() => handleAction(onOpenAddOutbreak)} title="แจ้งโรคระบาด" 
                            className={`group flex items-center justify-center gap-2 ${isCollapsed ? 'w-11 h-11 p-0 rounded-[14px]' : 'w-full px-4 py-2.5 rounded-xl'} font-semibold text-xs bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all duration-300 border border-rose-200/60 hover:border-transparent shadow-sm hover:shadow-md hover:shadow-rose-500/30`}>
                            <AlertTriangle className="w-[18px] h-[18px] shrink-0" />
                            {!isCollapsed && <span>แจ้งโรคระบาด</span>}
                        </button>
                        <button onClick={() => handleAction(onOpenAddData)} title="บันทึกผลปฏิบัติงานใหม่" 
                            className={`group flex items-center justify-center gap-2 ${isCollapsed ? 'w-11 h-11 p-0 rounded-[14px]' : 'w-full px-4 py-2.5 rounded-xl'} font-semibold text-xs bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-600/30 transition-all duration-300 shadow-sm`}>
                            <Plus className="w-[18px] h-[18px] shrink-0" />
                            {!isCollapsed && <span>บันทึกผลปฏิบัติงานใหม่</span>}
                        </button>
                        <button onClick={() => handleAction(onOpenClinicData)} title="บันทึกผลให้บริการประจำคลินิก" 
                            className={`group flex items-center justify-center gap-2 ${isCollapsed ? 'w-11 h-11 p-0 rounded-[14px]' : 'w-full px-4 py-2.5 rounded-xl'} font-semibold text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all duration-300 border border-emerald-200/70 hover:border-transparent shadow-sm hover:shadow-md hover:shadow-emerald-500/30`}>
                            <Building2 className="w-[18px] h-[18px] shrink-0" />
                            {!isCollapsed && <span>บันทึกผลให้บริการประจำคลินิก</span>}
                        </button>
                    </div>
                )}

                {/* User Profile & Footer Area */}
                <div className={`p-4 shrink-0 bg-slate-50/50 border-t border-slate-200/60 ${isCollapsed ? 'items-center' : ''}`}>
                    {!user ? (
                        <button onClick={() => handleAction(onLogin)} title="เข้าสู่ระบบ" className={`group w-full flex items-center justify-center gap-2 ${isCollapsed ? 'p-3 rounded-2xl' : 'px-4 py-3 rounded-xl'} bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-all shadow-md hover:shadow-lg`}>
                            <Unlock className="w-[18px] h-[18px] shrink-0" />
                            {!isCollapsed && <span>เข้าสู่ระบบ</span>}
                        </button>
                    ) : (
                        <div className={`flex items-center justify-between gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
                            {!isCollapsed && (
                                <div className="flex items-center gap-3 w-full overflow-hidden bg-white p-2 rounded-xl border border-slate-200/80 shadow-sm">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-xs font-bold text-slate-800 truncate">{user.username}</span>
                                        <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider truncate">
                                            {user.role === 'Developer' ? 'ผู้พัฒนาระบบ' : user.role}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            <div className={`flex ${isCollapsed ? 'flex-col gap-2 w-full' : 'gap-1 shrink-0 bg-white p-1 rounded-xl border border-slate-200/80 shadow-sm'} relative`}>
                                
                                {/* Notification Button */}
                                <button 
                                    onClick={() => { 
                                        if (setIsNotifOpen) setIsNotifOpen(!isNotifOpen); 
                                        if ((unreadCount ?? 0) > 0 && markAllAsRead) markAllAsRead(); 
                                    }} 
                                    className={`p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all shrink-0 relative ${isCollapsed ? 'flex justify-center w-full bg-white border border-slate-200 shadow-sm' : ''}`} 
                                    title="การแจ้งเตือน"
                                >
                                    <Bell className="w-4 h-4" />
                                    {(unreadCount ?? 0) > 0 && (
                                        <span className={`absolute ${isCollapsed ? 'top-1.5 right-2' : 'top-1.5 right-1.5'} w-2 h-2 bg-rose-500 rounded-full animate-pulse border-2 border-white`}></span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {isNotifOpen && (
                                    <div className={`absolute bottom-full mb-3 ${isCollapsed ? 'left-14' : 'right-0'} w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[9999] transition-all transform origin-bottom-right`}>
                                        <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex justify-between items-center text-left">
                                            <span className="font-bold text-xs text-slate-700 flex items-center gap-2"><Bell className="w-3.5 h-3.5 text-indigo-500"/> การแจ้งเตือนล่าสุด</span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1.5 text-left">
                                            {(!notifications || notifications.length === 0) ? (
                                                <div className="text-center py-6 text-xs text-slate-400 flex flex-col items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center"><Bell className="w-4 h-4 text-slate-300"/></div>
                                                    ไม่มีการแจ้งเตือน
                                                </div>
                                            ) : (
                                                notifications.map((n, i) => (
                                                    <div key={i} className={`p-3 rounded-xl text-xs transition-colors hover:bg-slate-50 ${!n.isRead ? 'bg-indigo-50/40 border border-indigo-100/50' : 'border border-transparent'}`}>
                                                        <div className="font-bold text-slate-800 mb-1">{n.title}</div>
                                                        <div className="text-slate-500 leading-relaxed">{n.message}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                <button onClick={() => handleAction(onChangePassword)} className={`p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all shrink-0 ${isCollapsed ? 'flex justify-center w-full bg-white border border-slate-200 shadow-sm' : ''}`} title="เปลี่ยนรหัสผ่าน">
                                    <Key className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleAction(onLogout)} className={`p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0 ${isCollapsed ? 'flex justify-center w-full bg-white border border-slate-200 shadow-sm' : ''}`} title="ออกจากระบบ">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
            
            {/* Optional: Simple CSS to hide scrollbars globally for this component if needed, though Tailwind 'scrollbar-hide' plugin is recommended */}
            <style dangerouslySetInnerHTML={{__html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </>
    );
};

export default Sidebar;