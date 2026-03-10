import React from 'react';
import { 
    Activity, Unlock, Settings, ChevronDown, FileText, Users, 
    Database, Download, Zap, List, CalendarDays, AlertTriangle, 
    Plus, Key, LogOut, Siren, ChevronLeft, ChevronRight, X, LayoutDashboard
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
    
    // 💡 คีย์หลักที่แก้ปัญหา: ถ้าเปิดบนมือถือ (isMobileMenuOpen = true) ให้ถือว่าไม่ได้ย่อเมนู
    const isCollapsed = isSidebarCollapsed && !isMobileMenuOpen;

    return (
        <aside className={`
            ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'} 
            ${isMobileMenuOpen ? 'fixed inset-y-0 left-0 w-64 shadow-2xl z-50 flex' : 'hidden md:flex'} 
            bg-white border-r border-slate-200 flex-col h-screen sticky top-0 shrink-0 transition-all duration-300
        `}>
            
            {/* 1. Logo & Branding */}
            <div className={`h-16 flex items-center px-4 border-b border-slate-200 transition-all ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <img 
                            src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" 
                            alt="Logo" 
                            className="w-8 h-8 object-cover rounded-lg border border-slate-200 shrink-0" 
                        />
                        <div className="flex flex-col truncate">
                            <h1 className="text-sm font-bold text-slate-800 truncate">
                                ระบบสัตวแพทย์
                            </h1>
                            <p className="text-[10px] font-medium text-slate-500 uppercase truncate">
                                Animal Control
                            </p>
                        </div>
                    </div>
                )}
                
                <div className="flex items-center">
                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                        className="hidden md:flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>

                    <button 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className="md:hidden flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 2. Menu Items */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                
                {/* 🟢 หมวดหมู่ที่ 1: แดชบอร์ด & ข้อมูล */}
                <div className="space-y-1">
                    {!isCollapsed && (
                        <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            แดชบอร์ด
                        </p>
                    )}
                    
                    {(user || tabsConfig.overview) && (
                        <button onClick={() => setActiveTab('overview')} title="ภาพรวมสถิติ" 
                            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-start gap-3 px-3 py-2'} rounded-lg text-sm font-medium transition-colors
                            ${activeTab === 'overview' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                            <Activity className={`w-5 h-5 shrink-0 ${activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-400'}`} />
                            {!isCollapsed && <span>ภาพรวมสถิติ</span>}
                        </button>
                    )}
                    {(user || tabsConfig.outbreak) && (
                        <button onClick={() => setActiveTab('outbreak')} title="จัดการจุดเสี่ยง" 
                            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-start gap-3 px-3 py-2'} rounded-lg text-sm font-medium transition-colors
                            ${activeTab === 'outbreak' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                            <Siren className={`w-5 h-5 shrink-0 ${activeTab === 'outbreak' ? 'text-rose-600' : 'text-slate-400'}`} />
                            {!isCollapsed && <span>จัดการจุดเสี่ยง</span>}
                        </button>
                    )}
                    {(user || tabsConfig.database) && (
                        <button onClick={() => setActiveTab('database')} title="ฐานข้อมูลบริการ" 
                            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-start gap-3 px-3 py-2'} rounded-lg text-sm font-medium transition-colors
                            ${activeTab === 'database' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                            <Database className={`w-5 h-5 shrink-0 ${activeTab === 'database' ? 'text-emerald-600' : 'text-slate-400'}`} />
                            {!isCollapsed && <span>ฐานข้อมูลบริการ</span>}
                        </button>
                    )}
                </div>

                {/* 🟢 หมวดหมู่ที่ 2: ปฏิทิน & นัดหมาย */}
                {user && (
                    <div className="space-y-1">
                        {!isCollapsed && (
                            <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                ปฏิทิน & นัดหมาย
                            </p>
                        )}
                        <button onClick={onOpenMeetingList} title="ประวัติประชุม" className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-start gap-3 px-3 py-2'} rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors`}>
                            <List className="w-5 h-5 shrink-0 text-slate-400" />
                            {!isCollapsed && <span>ประวัติประชุม</span>}
                        </button>
                        <button onClick={onOpenCalendar} title="แผนออกหน่วย" className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-start gap-3 px-3 py-2'} rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors`}>
                            <CalendarDays className="w-5 h-5 shrink-0 text-slate-400" />
                            {!isCollapsed && <span>แผนออกหน่วย</span>}
                        </button>
                        <button onClick={onOpenMeetingCalendar} title="ปฏิทินประชุม" className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-start gap-3 px-3 py-2'} rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors`}>
                            <CalendarDays className="w-5 h-5 shrink-0 text-slate-400" />
                            {!isCollapsed && <span>ปฏิทินประชุม</span>}
                        </button>
                    </div>
                )}

                {/* 🟢 หมวดหมู่ที่ 3: ตั้งค่าระบบ */}
                {user && (isSuperAdmin || canEdit) && (
                    <div className="space-y-1">
                        {!isCollapsed ? (
                            <>
                                <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    การตั้งค่าระบบ
                                </p>
                                <button onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)} className="w-full flex items-center justify-between px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Settings className="w-5 h-5 text-slate-400" />
                                        <span className="text-sm font-medium">เครื่องมือผู้ดูแล</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isSystemMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isSystemMenuOpen && (
                                    <div className="pl-9 pr-3 py-2 space-y-1">
                                        {isMagaAdmin && (
                                            <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <p className="text-xs font-semibold text-slate-500 mb-2">จัดการแท็บ</p>
                                                {['overview', 'outbreak', 'database'].map(tab => (
                                                    <label key={tab} className="flex items-center justify-between py-1.5 cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900">
                                                        <span className="capitalize">{tab === 'overview' ? 'ภาพรวม' : tab === 'outbreak' ? 'จุดเสี่ยง' : 'ฐานข้อมูล'}</span>
                                                        <input type="checkbox" checked={tabsConfig[tab]} onChange={() => toggleTab(tab)} className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {isSuperAdmin && (
                                            <>
                                                <button onClick={onOpenLog} className="w-full text-left py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400"/> ประวัติใช้งาน</button>
                                                <button onClick={onOpenUserMgmt} className="w-full text-left py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-2"><Users className="w-4 h-4 text-slate-400"/> จัดการผู้ใช้</button>
                                            </>
                                        )}
                                        {canEdit && (
                                            <>
                                                <button onClick={onOpenBackup} className="w-full text-left py-1.5 text-sm font-medium text-slate-600 hover:text-emerald-600 flex items-center gap-2"><Database className="w-4 h-4 text-slate-400"/> สำรองข้อมูล</button>
                                                <button onClick={onOpenCsvOutbreak} className="w-full text-left py-1.5 text-sm font-medium text-slate-600 hover:text-rose-600 flex items-center gap-2"><Download className="w-4 h-4 text-slate-400"/> CSV ระบาด</button>
                                                <button onClick={onOpenCsvReport} className="w-full text-left py-1.5 text-sm font-medium text-slate-600 hover:text-emerald-600 flex items-center gap-2"><Download className="w-4 h-4 text-slate-400"/> CSV บริการ</button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <button onClick={() => setIsSidebarCollapsed(false)} title="เครื่องมือระบบ" className="w-full flex justify-center p-2.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                <Settings className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 🟢 หมวดหมู่ที่ 4: ดำเนินการด่วน (Action Buttons) */}
            {user && canEdit && (
                <div className="px-4 pb-4 space-y-2">
                    <button onClick={onOpenAddOutbreak} title="แจ้งโรคระบาด" 
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-center gap-2 px-4 py-2'} rounded-lg font-semibold text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-200`}>
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {!isCollapsed && <span>แจ้งโรคระบาด</span>}
                    </button>
                    <button onClick={onOpenAddData} title="เพิ่มข้อมูลบริการ" 
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-center gap-2 px-4 py-2'} rounded-lg font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors`}>
                        <Plus className="w-4 h-4 shrink-0" />
                        {!isCollapsed && <span>เพิ่มข้อมูลบริการ</span>}
                    </button>
                </div>
            )}

            {/* 3. Footer / Profile Section */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
                {!user ? (
                    <button onClick={onLogin} className={`w-full flex items-center justify-center gap-2 ${isCollapsed ? 'p-2' : 'px-4 py-2'} bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition-colors`}>
                        <Unlock className="w-4 h-4 shrink-0" />
                        {!isCollapsed && <span>เข้าสู่ระบบ</span>}
                    </button>
                ) : (
                    <div className={`flex items-center justify-between gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
                        {!isCollapsed && (
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col truncate">
                                    <span className="text-sm font-semibold text-slate-800 truncate">{user.username}</span>
                                    <span className="text-xs text-slate-500 truncate capitalize">{user.role}</span>
                                </div>
                            </div>
                        )}
                        <div className={`flex ${isCollapsed ? 'flex-col gap-2 w-full' : 'gap-1 shrink-0'}`}>
                            <button onClick={onChangePassword} className={`p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors ${isCollapsed ? 'flex justify-center w-full' : ''}`} title="เปลี่ยนรหัสผ่าน">
                                <Key className="w-4 h-4" />
                            </button>
                            <button onClick={onLogout} className={`p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors ${isCollapsed ? 'flex justify-center w-full' : ''}`} title="ออกจากระบบ">
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