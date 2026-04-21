import { useState, useDeferredValue, useCallback } from 'react';

// --- Types & Interfaces ---

// TODO: นำ Interface เหล่านี้ไปปรับให้ตรงกับข้อมูลจริงของระบบ
export interface ReportItem {
    _id?: string;
    id?: string;
    [key: string]: any;
}

export interface OutbreakItem {
    _id?: string;
    id?: string;
    [key: string]: any;
}

export interface DispatchEvent {
    _id?: string;
    id?: string;
    [key: string]: any;
}

export interface MeetingItem {
    _id?: string;
    id?: string;
    [key: string]: any;
}

export interface User {
    id?: string;
    username?: string;
    role?: string;
    [key: string]: any;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info' | string;

export interface Toast {
    id: number;
    type: ToastType;
    message: string;
}

export interface TabsConfig {
    [key: string]: boolean;
}

export default function useDashboardState() {
    // --- Data States ---
    const [reportData, setReportData] = useState<ReportItem[]>([]);
    const [outbreakData, setOutbreakData] = useState<OutbreakItem[]>([]);
    const [dispatchEvents, setDispatchEvents] = useState<DispatchEvent[]>([]);
    const [meetings, setMeetings] = useState<MeetingItem[]>([]);

    // --- UI States ---
    const [viewImage, setViewImage] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<ReportItem | null>(null);
    const [editingOutbreak, setEditingOutbreak] = useState<OutbreakItem | null>(null);
    const [viewingDispatch, setViewingDispatch] = useState<DispatchEvent | null>(null);
    const [viewingMeeting, setViewingMeeting] = useState<MeetingItem | null>(null);
    const [hiddenOutbreakIds, setHiddenOutbreakIds] = useState<string[]>([]);
    
    // --- Filter States ---
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchDate, setSearchDate] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>('ทั้งหมด');
    const [selectedMonth, setSelectedMonth] = useState<string>('ทั้งหมด');
    const [selectedUnit, setSelectedUnit] = useState<string>('ทั้งหมด');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('ทั้งหมด');
    const [rankingYear, setRankingYear] = useState<string>('ทั้งหมด');
    const [rankingMonth, setRankingMonth] = useState<string>('ทั้งหมด');
    const [outbreakFilterYear, setOutbreakFilterYear] = useState<string>('ทั้งหมด');

    // --- Deferred Values (Performance) ---
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const deferredYear = useDeferredValue(selectedYear);
    const deferredMonth = useDeferredValue(selectedMonth);
    const deferredUnit = useDeferredValue(selectedUnit);
    const deferredDistrict = useDeferredValue(selectedDistrict);
    const deferredReportData = useDeferredValue(reportData);

    // --- Modal & Layout States ---
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
    const [isOutbreakModalOpen, setIsOutbreakModalOpen] = useState<boolean>(false);
    const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
    const [isUserMgmtOpen, setIsUserMgmtOpen] = useState<boolean>(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState<boolean>(false);
    const [isMeetingListOpen, setIsMeetingListOpen] = useState<boolean>(false);
    const [isMeetingCalendarOpen, setIsMeetingCalendarOpen] = useState<boolean>(false);
    const [isConfirmPasswordOpen, setIsConfirmPasswordOpen] = useState<boolean>(false);
    const [isClearDataModalOpen, setIsClearDataModalOpen] = useState<boolean>(false);

    // --- App Configuration States ---
    const [user, setUser] = useState<User | null>(null); 
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [tabsConfig, setTabsConfig] = useState<TabsConfig>({ overview: true, outbreak: true, database: true });
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [isSystemMenuOpen, setIsSystemMenuOpen] = useState<boolean>(false);
    const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(true);
    const [csvMode, setCsvMode] = useState<string>('report');
    const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

    // --- Chart States ---
    const [trendOffset, setTrendOffset] = useState<number>(0); 
    const [freqDailyOffset, setFreqDailyOffset] = useState<number>(0); 
    const [freqMonthlyOffset, setFreqMonthlyOffset] = useState<number>(0);
    const [chartBaseYear, setChartBaseYear] = useState<number>(new Date().getFullYear());
    const [chartBaseMonth, setChartBaseMonth] = useState<number>(new Date().getMonth() + 1);

    // --- Toast System ---
    const [toasts, setToasts] = useState<Toast[]>([]);
    
    const addToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 3000);
    }, []);

    const removeToast = useCallback((id: number) => { 
        setToasts(prev => prev.filter(t => t.id !== id)); 
    }, []);

    // Return everything as an object
    return {
        // Data
        reportData, setReportData, outbreakData, setOutbreakData,
        dispatchEvents, setDispatchEvents, meetings, setMeetings,
        
        // UI Items
        viewImage, setViewImage, editingItem, setEditingItem, 
        editingOutbreak, setEditingOutbreak, viewingDispatch, setViewingDispatch,
        viewingMeeting, setViewingMeeting, hiddenOutbreakIds, setHiddenOutbreakIds,
        
        // Filters
        searchTerm, setSearchTerm, searchDate, setSearchDate,
        selectedYear, setSelectedYear, selectedMonth, setSelectedMonth,
        selectedUnit, setSelectedUnit, selectedDistrict, setSelectedDistrict,
        rankingYear, setRankingYear, rankingMonth, setRankingMonth,
        outbreakFilterYear, setOutbreakFilterYear,
        
        // Deferred
        deferredSearchTerm, deferredYear, deferredMonth, 
        deferredUnit, deferredDistrict, deferredReportData,
        
        // Modals
        isModalOpen, setIsModalOpen, isCsvModalOpen, setIsCsvModalOpen,
        isOutbreakModalOpen, setIsOutbreakModalOpen, isBackupModalOpen, setIsBackupModalOpen,
        isLoginModalOpen, setIsLoginModalOpen, isUserMgmtOpen, setIsUserMgmtOpen,
        isChangePasswordOpen, setIsChangePasswordOpen, isLogModalOpen, setIsLogModalOpen,
        isDispatchModalOpen, setIsDispatchModalOpen, isCalendarOpen, setIsCalendarOpen,
        isMeetingModalOpen, setIsMeetingModalOpen, isMeetingListOpen, setIsMeetingListOpen,
        isMeetingCalendarOpen, setIsMeetingCalendarOpen, isConfirmPasswordOpen, setIsConfirmPasswordOpen,
        isClearDataModalOpen, setIsClearDataModalOpen,
        
        // App Config
        user, setUser, activeTab, setActiveTab, tabsConfig, setTabsConfig,
        isSidebarCollapsed, setIsSidebarCollapsed, isMobileMenuOpen, setIsMobileMenuOpen,
        isSystemMenuOpen, setIsSystemMenuOpen, isFilterExpanded, setIsFilterExpanded,
        csvMode, setCsvMode, isInitialLoading, setIsInitialLoading,
        
        // Charts
        trendOffset, setTrendOffset, freqDailyOffset, setFreqDailyOffset,
        freqMonthlyOffset, setFreqMonthlyOffset, chartBaseYear, setChartBaseYear,
        chartBaseMonth, setChartBaseMonth,
        
        // Toasts
        toasts, addToast, removeToast
    };
}