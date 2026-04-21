import { useState, useDeferredValue, useCallback } from 'react';

export default function useDashboardState() {
    // --- Data States ---
    const [reportData, setReportData] = useState([]);
    const [outbreakData, setOutbreakData] = useState([]);
    const [dispatchEvents, setDispatchEvents] = useState([]);
    const [meetings, setMeetings] = useState([]);

    // --- UI States ---
    const [viewImage, setViewImage] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [editingOutbreak, setEditingOutbreak] = useState(null);
    const [viewingDispatch, setViewingDispatch] = useState(null);
    const [viewingMeeting, setViewingMeeting] = useState(null);
    const [hiddenOutbreakIds, setHiddenOutbreakIds] = useState([]);
    
    // --- Filter States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [selectedYear, setSelectedYear] = useState('ทั้งหมด');
    const [selectedMonth, setSelectedMonth] = useState('ทั้งหมด');
    const [selectedUnit, setSelectedUnit] = useState('ทั้งหมด');
    const [selectedDistrict, setSelectedDistrict] = useState('ทั้งหมด');
    const [rankingYear, setRankingYear] = useState('ทั้งหมด');
    const [rankingMonth, setRankingMonth] = useState('ทั้งหมด');
    const [outbreakFilterYear, setOutbreakFilterYear] = useState('ทั้งหมด');

    // --- Deferred Values (Performance) ---
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const deferredYear = useDeferredValue(selectedYear);
    const deferredMonth = useDeferredValue(selectedMonth);
    const deferredUnit = useDeferredValue(selectedUnit);
    const deferredDistrict = useDeferredValue(selectedDistrict);
    const deferredReportData = useDeferredValue(reportData);

    // --- Modal & Layout States ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
    const [isOutbreakModalOpen, setIsOutbreakModalOpen] = useState(false);
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [isMeetingListOpen, setIsMeetingListOpen] = useState(false);
    const [isMeetingCalendarOpen, setIsMeetingCalendarOpen] = useState(false);
    const [isConfirmPasswordOpen, setIsConfirmPasswordOpen] = useState(false);
    const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);

    // --- App Configuration States ---
    const [user, setUser] = useState(null); 
    const [activeTab, setActiveTab] = useState('overview');
    const [tabsConfig, setTabsConfig] = useState({ overview: true, outbreak: true, database: true });
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
    const [isFilterExpanded, setIsFilterExpanded] = useState(true);
    const [csvMode, setCsvMode] = useState('report');
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // --- Chart States ---
    const [trendOffset, setTrendOffset] = useState(0); 
    const [freqDailyOffset, setFreqDailyOffset] = useState(0); 
    const [freqMonthlyOffset, setFreqMonthlyOffset] = useState(0);
    const [chartBaseYear, setChartBaseYear] = useState(new Date().getFullYear());
    const [chartBaseMonth, setChartBaseMonth] = useState(new Date().getMonth() + 1);

    // --- Toast System ---
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 3000);
    }, []);

    const removeToast = useCallback((id) => { 
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