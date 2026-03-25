import React, { useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
import { 
    Activity, Database, X, Search, Trash2, Siren, List, ChevronUp, ChevronDown, Unlock, LogOut, CalendarDays
} from 'lucide-react';
import { io } from "socket.io-client";

// --- Custom Hook ---
import useDashboardState from './hooks/useDashboardState'; // <-- นำเข้า Custom Hook

// --- Custom Components & Constants ---
import KPISection from './components/dashboard/KPICards';
import UserManagementModal from './components/UserManagementModal';
import { UNIT_TYPES, BANGKOK_DISTRICTS } from './constants/locations';
const AddDataModal = lazy(() => import('./components/modals/AddDataModal'));
const RabiesOutbreakSection = lazy(() => import('./components/dashboard/RabiesOutbreakSection'));
const MainDataTable = lazy(() => import('./components/dashboard/MainDataTable'));
import { exportToCSV, exportOutbreaksToCSV } from './utils/csvUtils';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import Sidebar from './components/layout/Sidebar';
const StatisticsCharts = React.lazy(() => import('./components/dashboard/StatisticsCharts.jsx'));
import RankingSection from './components/dashboard/RankingSection';
const LeafletMap = lazy(() => import('./components/modals/LeafletMap'));
import LoginModal from './components/modals/LoginModal';
const AddOutbreakModal = lazy(() => import('./components/modals/AddOutbreakModal'));
import { MeetingCalendarDashboard, DispatchCalendarDashboard } from './components/CalendarComponents.jsx';
import DispatchModal from './components/modals/DispatchModal';
import { MeetingModal, MeetingListModal } from './components/modals/MeetingModal';
import ActivityLogModal from './components/modals/ActivityLogModal';
import CsvActionModal from './components/modals/CsvActionModal';
import BackupSystemModal from './components/modals/BackupSystemModal';
import ToastContainer from './path/to/ToastContainer';
import PasswordConfirmModal from './components/modals/PasswordConfirmModal';
import ImagePreviewModal from './components/modals/ImagePreviewModal';
import { getUnitKey } from './utils/helpers';
import PieChartsSection from './components/dashboard/PieChartsSection';
const UnitComparisonChart = React.lazy(() => import('./components/dashboard/UnitComparisonChart.jsx'));
import ClearDataModal from './components/modals/ClearDataModal';

// --- MAIN DASHBOARD COMPONENT ---

export default function VeterinaryDashboard() {
    // --- 1. STATE MANAGEMENT (เรียกใช้จาก Custom Hook) ---
    const {
        reportData, setReportData, outbreakData, setOutbreakData,
        dispatchEvents, setDispatchEvents, meetings, setMeetings,
        viewImage, setViewImage, editingItem, setEditingItem, 
        editingOutbreak, setEditingOutbreak, viewingDispatch, setViewingDispatch,
        viewingMeeting, setViewingMeeting, hiddenOutbreakIds, setHiddenOutbreakIds,
        searchTerm, setSearchTerm, searchDate, setSearchDate,
        selectedYear, setSelectedYear, selectedMonth, setSelectedMonth,
        selectedUnit, setSelectedUnit, selectedDistrict, setSelectedDistrict,
        rankingYear, setRankingYear, rankingMonth, setRankingMonth,
        outbreakFilterYear, setOutbreakFilterYear,
        deferredSearchTerm, deferredYear, deferredMonth, 
        deferredUnit, deferredDistrict, deferredReportData,
        isModalOpen, setIsModalOpen, isCsvModalOpen, setIsCsvModalOpen,
        isOutbreakModalOpen, setIsOutbreakModalOpen, isBackupModalOpen, setIsBackupModalOpen,
        isLoginModalOpen, setIsLoginModalOpen, isUserMgmtOpen, setIsUserMgmtOpen,
        isChangePasswordOpen, setIsChangePasswordOpen, isLogModalOpen, setIsLogModalOpen,
        isDispatchModalOpen, setIsDispatchModalOpen, isCalendarOpen, setIsCalendarOpen,
        isMeetingModalOpen, setIsMeetingModalOpen, isMeetingListOpen, setIsMeetingListOpen,
        isMeetingCalendarOpen, setIsMeetingCalendarOpen, isConfirmPasswordOpen, setIsConfirmPasswordOpen,
        isClearDataModalOpen, setIsClearDataModalOpen,
        user, setUser, activeTab, setActiveTab, tabsConfig, setTabsConfig,
        isSidebarCollapsed, setIsSidebarCollapsed, isMobileMenuOpen, setIsMobileMenuOpen,
        isSystemMenuOpen, setIsSystemMenuOpen, isFilterExpanded, setIsFilterExpanded,
        csvMode, setCsvMode, isInitialLoading, setIsInitialLoading,
        trendOffset, setTrendOffset, freqDailyOffset, setFreqDailyOffset,
        freqMonthlyOffset, setFreqMonthlyOffset, chartBaseYear, setChartBaseYear,
        chartBaseMonth, setChartBaseMonth,
        toasts, addToast, removeToast
    } = useDashboardState();

    const handleNotifySystemUpdate = async () => {
        if (!window.confirm("⚠️ ยืนยันการสั่งแจ้งเตือนอัปเดตระบบ?\nหน้าเว็บของผู้ใช้งานทุกคนในขณะนี้จะถูกบังคับรีเฟรชทันที!")) return;
        
        try {
            const response = await fetch(`${BASE_URL}/api/system/notify-update`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                }
            });
            if (response.ok) {
                addToast('success', "✅ ส่งคำสั่งอัปเดตระบบไปยังผู้ใช้ทั้งหมดแล้ว");
            } else {
                addToast('error', "❌ ไม่สามารถส่งคำสั่งได้ (อาจไม่มีสิทธิ์)");
            }
        } catch (error) {
            addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
        }
    };

    const isReadOnlyMode = new URLSearchParams(window.location.search).get('mode') === 'view';

    // Constants
    const BASE_URL = 'https://veterinarydashboard-hwho.onrender.com';
    const API_URL = `${BASE_URL}/api/reports`;
    const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

    const dispatchEventsOnly = useMemo(() => dispatchEvents.map(d => ({
        ...d, type: 'dispatch', originalData: d
    })), [dispatchEvents]);

    const meetingEventsOnly = useMemo(() => meetings.map(m => ({
        date: m.date, time: m.startTime, location: m.title, team: 'Online/Room', note: m.link, type: 'meeting', _id: m._id, originalData: m
    })), [meetings]);

    const handleSaveDispatchEvent = async (payload) => {
        try {
            const method = payload._id ? 'PUT' : 'POST';
            const url = payload._id ? `${BASE_URL}/api/dispatches/${payload._id}` : `${BASE_URL}/api/dispatches`;
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                addToast('success', payload._id ? 'แก้ไขแผนงานเรียบร้อย' : 'บันทึกแผนงานเรียบร้อย');
                setIsDispatchModalOpen(false);
            } else {
                const err = await res.json();
                addToast('error', `บันทึกไม่สำเร็จ: ${err.message}`);
            }
        } catch (error) {
            addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const handleDeleteDispatch = async (id) => {
        if (!window.confirm('ยืนยันลบแผนงานนี้?')) return;
        try {
            const res = await fetch(`${BASE_URL}/api/dispatches/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                addToast('success', 'ลบแผนงานเรียบร้อย');
                setIsDispatchModalOpen(false);
            }
        } catch (error) {
            addToast('error', 'ลบไม่สำเร็จ');
        }
    };

    // --- 2. AUTHENTICATION LOGIC ---

    useEffect(() => {
        const fetchDispatches = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/dispatches`);
                const data = await res.json();
                setDispatchEvents(data);
            } catch (error) {
                console.error("Fetch Dispatches Error", error);
            }
        };
        fetchDispatches();
    }, [BASE_URL, setDispatchEvents]);

    const handleOutbreakFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const lines = text.split(/\r?\n/);
                
                if (lines.length < 2) { alert("ไฟล์ไม่มีข้อมูล"); return; }

                const confirmImport = window.confirm(`ต้องการนำเข้าข้อมูลจุดระบาด ${lines.length - 1} รายการใช่หรือไม่?`);
                if (!confirmImport) return;

                const bulkData = [];
                
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                    const cleanCols = cols.map(c => c.trim().replace(/^"|"$/g, ''));

                    if (cleanCols.length < 5) continue;

                    const parseNum = (val) => {
                        const num = parseInt(val);
                        return isNaN(num) ? 0 : num;
                    };

                    const newRecord = {
                        date: parseCSVDate(cleanCols[0]),
                        location: cleanCols[1],
                        district: cleanCols[2],
                        lat: parseFloat(cleanCols[3]) || 0,
                        long: parseFloat(cleanCols[4]) || 0,
                        stats: {
                            dog: { male: parseNum(cleanCols[5]), female: parseNum(cleanCols[6]) },
                            cat: { male: parseNum(cleanCols[7]), female: parseNum(cleanCols[8]) }
                        }
                    };

                    if (newRecord.lat !== 0 && newRecord.long !== 0) {
                        bulkData.push(newRecord);
                    }
                }

                if (bulkData.length === 0) {
                    alert("ไม่พบข้อมูลที่ถูกต้อง (กรุณาตรวจสอบ Lat/Long ในไฟล์ CSV)");
                    return;
                }

                const response = await fetch(`${BASE_URL}/api/outbreaks/bulk`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                    body: JSON.stringify(bulkData)
                });

                if (response.ok) {
                    const result = await response.json();
                    addToast('success', `✅ นำเข้าจุดระบาดสำเร็จ ${result.count} รายการ`);
                    const res = await fetch(`${BASE_URL}/api/outbreaks`);
                    const data = await res.json();
                    setOutbreakData(Array.isArray(data) ? data : (data.data || []));
                } else {
                    addToast('error', "❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล");
                }

            } catch (error) {
                console.error(error);
                alert("รูปแบบไฟล์ CSV ไม่ถูกต้อง");
            }
        };
        reader.readAsText(file);
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('vet_user');
        if (storedUser) { setUser(JSON.parse(storedUser)); }
    }, [setUser]);

    const handleLogin = useCallback((userData) => {
        setUser(userData);
        localStorage.setItem('vet_user', JSON.stringify(userData));
        setIsLoginModalOpen(false);
    }, [setUser, setIsLoginModalOpen]);

    const handleLogout = useCallback(() => {
        if(window.confirm("ยืนยันการออกจากระบบ?")) {
            setUser(null);
            localStorage.removeItem('vet_user');
        }
    }, [setUser]);

    const isSystemDeveloper = user && user.role === 'Developer';
    
    // ✅ นำ Developer เข้าไปรวมกับสิทธิ์ระดับสูงอื่นๆ เพื่อให้ใช้งานฟังก์ชันทั่วไปได้
    const canEdit = user && (user.role === 'Developer' || user.role === 'admin' || user.role === 'superadmin' || user.role === 'MagaAdmin') && !isReadOnlyMode;
    const isSuperAdmin = user && (user.role === 'Developer' || user.role === 'superadmin' || user.role === 'MagaAdmin');
    const isMagaAdmin = user && (user.role === 'Developer' || user.role === 'MagaAdmin');

    useEffect(() => {
        const fetchTabsConfig = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/settings/tabs`);
                if (res.ok) {
                    const data = await res.json();
                    setTabsConfig(data);
                }
            } catch (error) {
                console.error("Fetch Tabs Config Error", error);
            }
        };
        fetchTabsConfig();
    }, [BASE_URL, setTabsConfig]);

    const toggleTab = async (tabName) => {
        const previousConfig = { ...tabsConfig };
        const newConfig = { ...tabsConfig, [tabName]: !tabsConfig[tabName] };
        
        setTabsConfig(newConfig); 

        try {
            const res = await fetch(`${BASE_URL}/api/settings/tabs`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify({ tabsConfig: newConfig })
            });
            if (!res.ok) throw new Error('Failed to update');
        } catch (error) {
            console.error("Update Tabs Config Error", error);
            addToast('error', 'ไม่สามารถบันทึกการตั้งค่าแท็บได้');
            setTabsConfig(previousConfig); 
        }
    };

    useEffect(() => {
        if (!user && !tabsConfig[activeTab]) {
            if (tabsConfig.overview) setActiveTab('overview');
            else if (tabsConfig.outbreak) setActiveTab('outbreak');
            else if (tabsConfig.database) setActiveTab('database');
        }
    }, [user, tabsConfig, activeTab, setActiveTab]);

    // --- 3. DATA FETCHING ---

    const fetchData = useCallback(async () => {
        try {
            setIsInitialLoading(true);
            const response = await fetch(`${API_URL}?limit=5000`);
            const result = await response.json();
            const dataArray = Array.isArray(result) ? result : (result.data || []);
            setReportData(dataArray);
        } catch (error) {
            console.error("Fetch Reports Error:", error);
            setReportData([]);
        } finally {
            setIsInitialLoading(false);
        }
    }, [API_URL, setReportData, setIsInitialLoading]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const socket = io(BASE_URL);
        socket.on('connect', () => { console.log("🟢 Connected to Real-time Server"); });
        socket.on('server_data_update', (payload) => {
            console.log("⚡ Realtime Update:", payload);
            switch (payload.type) {
                case 'REPORT_ADDED':
                    setReportData(prev => [payload.data, ...prev]);
                    addToast('info', `📝 มีข้อมูลใหม่เข้ามา: ${payload.data.location}`);
                    break;
                case 'REPORT_UPDATED':
                    setReportData(prev => prev.map(item => item._id === payload.data._id ? payload.data : item));
                    addToast('info', `✏️ มีการแก้ไขข้อมูล: ${payload.data.location}`);
                    break;
                case 'REPORT_DELETED':
                    setReportData(prev => prev.filter(item => item._id !== payload.id));
                    break;
                case 'REPORTS_CLEARED':
                    setReportData([]);
                    addToast('error', '⚠️ ข้อมูลทั้งหมดถูกล้างโดยผู้ดูแลระบบ');
                    break;
                case 'OUTBREAK_ADDED':
                    setOutbreakData(prev => [payload.data, ...prev]);
                    addToast('error', `🚨 แจ้งเตือน: พบจุดเสี่ยงโรคระบาดใหม่!`);
                    break;
                case 'OUTBREAK_DELETED':
                    setOutbreakData(prev => prev.filter(item => item._id !== payload.id));
                    break;
                case 'OUTBREAK_UPDATED':
                    setOutbreakData(prev => prev.map(item => item._id === payload.data._id ? payload.data : item));
                    addToast('info', `📝 แก้ไขจุดเสี่ยงระบาด: ${payload.data.location}`);
                    break;
                case 'SYSTEM_RESTORED':
                    fetchData();
                    break;
                case 'MEETING_ADDED':
                    setMeetings(prev => [...prev, payload.data]);
                    addToast('info', `📅 มีนัดหมายประชุมใหม่: ${payload.data.title}`);
                    break;
                case 'MEETING_DELETED':
                    setMeetings(prev => prev.filter(m => m._id !== payload.id));
                    break;
                case 'MEETING_UPDATED':
                    setMeetings(prev => prev.map(m => m._id === payload.data._id ? payload.data : m));
                    addToast('info', `📝 แก้ไขนัดหมายประชุม: ${payload.data.title}`);
                    break;
                case 'REPORTS_IMPORTED':
                    fetchData();
                    addToast('success', `📥 มีการนำเข้าข้อมูลชุดใหญ่จำนวน ${payload.count} รายการ`);
                    break;
                case 'DISPATCH_ADDED':
                    setDispatchEvents(prev => [...prev, payload.data]);
                    addToast('info', `🚐 แผนออกหน่วยใหม่: ${payload.data.location}`);
                    break;
                case 'DISPATCH_UPDATED':
                    setDispatchEvents(prev => prev.map(ev => ev._id === payload.data._id ? payload.data : ev));
                    addToast('info', `📝 แก้ไขแผนออกหน่วย: ${payload.data.location}`);
                    break;
                case 'DISPATCH_DELETED':
                    setDispatchEvents(prev => prev.filter(ev => ev._id !== payload.id));
                    break;
                case 'TABS_CONFIG_UPDATED':
                    setTabsConfig(payload.data);
                    break;
                default: break;
            }
        });
        socket.on('system_update_refresh', (payload) => {
            addToast('info', `🔄 ${payload.message}`);

            // หน่วงเวลา 3 วินาทีให้ผู้ใช้เห็นข้อความแจ้งเตือน ก่อนบังคับรีเฟรชหน้าต่างแบบข้าม Cache (true)
            setTimeout(() => {
                window.location.reload(true);
            }, 3000);
        });
        return () => { socket.disconnect(); };
    }, [BASE_URL, fetchData, setReportData, setOutbreakData, setMeetings, setDispatchEvents, setTabsConfig, addToast]);

    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/meetings`);
                const data = await res.json();
                setMeetings(data);
            } catch (error) {
                console.error("Fetch Meetings Error", error);
            }
        };
        fetchMeetings();
    }, [BASE_URL, setMeetings]);

    const handleSaveMeeting = async (meetingData) => {
        try {
            const method = meetingData._id ? 'PUT' : 'POST';
            const url = meetingData._id ? `${BASE_URL}/api/meetings/${meetingData._id}` : `${BASE_URL}/api/meetings`;
            
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify(meetingData)
            });
            if (res.ok) {
                addToast('success', meetingData._id ? 'แก้ไขข้อมูลเรียบร้อย' : 'บันทึกการประชุมเรียบร้อย');
                if(meetingData._id) {
                     const updated = await res.json();
                     setMeetings(prev => prev.map(m => m._id === updated._id ? updated : m));
                }
            } else {
                addToast('error', 'บันทึกไม่สำเร็จ');
            }
        } catch (error) {
            addToast('error', 'Error saving meeting');
        }
    };

    const handleDeleteMeeting = async (id) => {
        try {
            const res = await fetch(`${BASE_URL}/api/meetings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                addToast('success', 'ลบการประชุมเรียบร้อย');
                setMeetings(prev => prev.filter(m => m._id !== id));
            } else {
                addToast('error', 'ลบไม่สำเร็จ');
            }
        } catch (error) {
            addToast('error', 'Error deleting meeting');
        }
    };

    const handleCalendarEventClick = (evt) => {
        if (evt.type === 'meeting') {
            setViewingMeeting(evt.originalData);
            setIsMeetingModalOpen(true);
        } else {
            setViewingDispatch(evt.originalData);
            setIsDispatchModalOpen(true);
        }
    };

    useEffect(() => {
        const fetchOutbreaks = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/outbreaks`);
                const result = await response.json();
                const dataArray = Array.isArray(result) ? result : (result.data || []);
                setOutbreakData(dataArray);
            } catch (error) {
                console.error("Fetch Outbreaks Error:", error);
                setOutbreakData([]);
            }
        };
        fetchOutbreaks();
    }, [BASE_URL, setOutbreakData]);

    const toggleOutbreakVisibility = (id) => {
        setHiddenOutbreakIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleUpdateOutbreak = async (id, updatedData) => {
        try {
            const response = await fetch(`${BASE_URL}/api/outbreaks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify(updatedData)
            });
            if (response.ok) {
                addToast('success', "✅ แก้ไขข้อมูลจุดเสี่ยงสำเร็จ");
                setEditingOutbreak(null);
            } else {
                addToast('error', "❌ แก้ไขไม่สำเร็จ");
            }
        } catch (error) {
            addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
    };

    const openEditOutbreakModal = (item) => { setEditingOutbreak(item); setIsOutbreakModalOpen(true); };
    const openAddOutbreakModal = () => { setEditingOutbreak(null); setIsOutbreakModalOpen(true); };

    // --- 4. API HANDLERS ---

    const handleAddNewData = async (newRecord) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify({
                    date: newRecord.date, location: newRecord.location, lat: parseFloat(newRecord.lat), long: parseFloat(newRecord.long),
                    district: newRecord.district, subdistrict: newRecord.subdistrict, unit: newRecord.unit, team: newRecord.team, imageUrl: newRecord.imageUrl,
                    stats: {
                        vaccine: newRecord.stats ? newRecord.stats.vaccine : newRecord.vaccine,
                        sterilize: newRecord.stats ? newRecord.stats.sterilize : newRecord.sterilize,
                        register: newRecord.stats ? newRecord.stats.register : newRecord.register,
                        microchip: newRecord.stats ? newRecord.stats.microchip : newRecord.microchip,
                        medical: newRecord.stats ? newRecord.stats.medical : newRecord.medical
                    },
                    details: newRecord.details
                }),
            });
            if (response.ok) { addToast('success', "✅ บันทึกข้อมูลสำเร็จ!"); } 
            else { addToast('error', "❌ บันทึกไม่สำเร็จ (อาจไม่มีสิทธิ์)"); }
        } catch (error) { addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
    };

    const handleUpdateData = async (id, updatedRecord) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify(updatedRecord),
            });
            if (response.ok) {
                addToast('success', "✅ แก้ไขข้อมูลสำเร็จ!");
                setEditingItem(null);
            } else {
                addToast('error', "❌ แก้ไขไม่สำเร็จ (อาจไม่มีสิทธิ์)");
            }
        } catch (error) { addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
    };

    const handleDeleteData = async (id) => {
        if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?")) {
            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                if (response.ok) { addToast('success', "✅ ลบข้อมูลสำเร็จ"); } 
                else { addToast('error', "❌ ลบไม่สำเร็จ (อาจไม่มีสิทธิ์)"); }
            } catch (error) { addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
        }
    };

    const handleAddOutbreak = async (data) => {
        try {
            const response = await fetch(`${BASE_URL}/api/outbreaks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify(data)
            });
            if (response.ok) { addToast('success', "🚨 บันทึกจุดเสี่ยงเรียบร้อยแล้ว"); } 
            else { addToast('error', "❌ ไม่สามารถบันทึกข้อมูลได้"); }
        } catch (error) { addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
    };

    const handleDeleteOutbreak = async (id) => {
        if (window.confirm("⚠️ ยืนยันการลบจุดแจ้งเหตุโรคระบาดนี้?")) {
            try {
                const response = await fetch(`${BASE_URL}/api/outbreaks/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                if (response.ok) { addToast('success', "✅ ลบจุดแจ้งเหตุเรียบร้อยแล้ว"); } 
                else { addToast('error', "❌ ไม่สามารถลบข้อมูลได้"); }
            } catch (error) { addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
        }
    };

    const handleClearAllData = async () => {
        if (!isSuperAdmin) {
            alert("⛔️ ขออภัย เฉพาะ SuperAdmin เท่านั้นที่มีสิทธิ์ล้างข้อมูล");
            return;
        }
        setIsClearDataModalOpen(true);
    };

    const executeClearAllData = async (passwordInput, filters) => {
        try {
            const response = await fetch(API_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify({ 
                    password: passwordInput,
                    year: filters.year,
                    month: filters.month,
                    unit: filters.unit
                })
            });
            const result = await response.json();
            if (response.ok) {
                fetchData(); 
                setIsClearDataModalOpen(false);
                alert(`✅ ${result.message}`);
            } else {
                alert(`❌ เกิดข้อผิดพลาด: ${result.message}`);
            }
        } catch (error) { alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ Server"); }
    };

    const generateMockData = (count) => {
        if (!window.confirm(`⚠️ ยืนยันการจำลองข้อมูล ${count} เคส?\n(ข้อมูลนี้จะแสดงผลทันทีแต่ 'ยังไม่ถูกบันทึก' ลงฐานข้อมูลจริง)`)) return;
        const newMockData = [];
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const randCoord = () => ({ lat: 13.6 + Math.random() * 0.35, long: 100.35 + Math.random() * 0.4 });

        for (let i = 0; i < count; i++) {
            const date = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
            const dateStr = date.toISOString().split('T')[0];
            const district = BANGKOK_DISTRICTS[Math.floor(Math.random() * BANGKOK_DISTRICTS.length)];
            const unit = UNIT_TYPES[Math.floor(Math.random() * UNIT_TYPES.length)];
            const coords = randCoord();
            const stats = { vaccine: randInt(0, 50), sterilize: randInt(0, 20), register: randInt(0, 30), microchip: randInt(0, 15), medical: randInt(0, 10) };

            newMockData.push({
                _id: `mock-${Date.now()}-${i}`,
                date: dateStr, location: `จุดบริการจำลอง ${district} #${i+1}`, district: district, subdistrict: "แขวงจำลอง", unit: unit,
                lat: coords.lat, long: coords.long, stats: stats, imageUrl: "",
                details: {
                    dog: { vaccine: Math.floor(stats.vaccine * 0.6), maleSterilize: Math.floor(stats.sterilize * 0.3), femaleSterilize: Math.floor(stats.sterilize * 0.3), microchip: Math.floor(stats.microchip * 0.7), register: Math.floor(stats.register * 0.6), medical: Math.floor(stats.medical * 0.7) },
                    cat: { vaccine: Math.floor(stats.vaccine * 0.4), maleSterilize: Math.floor(stats.sterilize * 0.2), femaleSterilize: Math.floor(stats.sterilize * 0.2), microchip: Math.floor(stats.microchip * 0.3), register: Math.floor(stats.register * 0.4), medical: Math.floor(stats.medical * 0.3) },
                    other: { vaccine: 0, medical: 0 }
                }
            });
        }
        setReportData(prev => [...newMockData, ...prev]);
        alert(`✅ สร้างข้อมูลจำลอง ${count} เคสเรียบร้อยแล้ว!\n(ข้อมูลจะหายไปเมื่อรีเฟรชหน้าเว็บ)`);
    };

    const handleGenerateMockData = () => generateMockData(500);

    const parseCSVDate = (dateStr) => {
        const getLocalDateString = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        if (!dateStr) return getLocalDateString(new Date());
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        
        const parts = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (parts) {
            let day = parts[1].padStart(2, '0');
            let month = parts[2].padStart(2, '0');
            let year = parseInt(parts[3]);
            if (year > 2400) year -= 543;
            return `${year}-${month}-${day}`;
        }
        
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) ? getLocalDateString(d) : getLocalDateString(new Date());
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== "text/csv" && !file.name.endsWith('.csv')) { alert("กรุณาอัปโหลดไฟล์นามสกุล .csv เท่านั้น"); return; }
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\n');
                if (lines.length < 2) { alert("ไฟล์ไม่มีข้อมูล"); return; }
                
                const confirmImport = window.confirm(`พบข้อมูล ${lines.length - 1} แถว ต้องการนำเข้าทั้งหมดในครั้งเดียวหรือไม่?`);
                if (!confirmImport) return;

                const bulkData = [];
                let failCount = 0;
                
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                    const cleanCols = cols.map(c => c.trim().replace(/^"|"$/g, ''));

                    if (cleanCols.length < 6) { failCount++; continue; }

                    let lat = 0; let long = 0;
                    if (cleanCols[5]) {
                        if(cleanCols[5].includes(',')){
                            const coords = cleanCols[5].split(',');
                            lat = parseFloat(coords[0].trim()) || 0;
                            long = parseFloat(coords[1].trim()) || 0;
                        } else {
                            lat = parseFloat(cleanCols[5].trim()) || 0;
                        }
                    }

                    const newRecord = {
                        date: parseCSVDate(cleanCols[0]),
                        location: cleanCols[1],
                        district: cleanCols[2],
                        subdistrict: cleanCols[3],
                        unit: cleanCols[4],
                        lat: lat,
                        long: long,
                        stats: { 
                            vaccine: parseInt(cleanCols[9]) || 0,
                            sterilize: parseInt(cleanCols[14]) || 0,
                            microchip: parseInt(cleanCols[17]) || 0,
                            register: parseInt(cleanCols[20]) || 0,
                            medical: parseInt(cleanCols[24]) || 0
                        },
                        details: { 
                            dog: { 
                                vaccine: parseInt(cleanCols[6]) || 0, 
                                maleSterilize: parseInt(cleanCols[10]) || 0, 
                                femaleSterilize: parseInt(cleanCols[11]) || 0, 
                                microchip: parseInt(cleanCols[15]) || 0,
                                register: parseInt(cleanCols[18]) || 0,
                                medical: parseInt(cleanCols[21]) || 0 
                            },
                            cat: { 
                                vaccine: parseInt(cleanCols[7]) || 0, 
                                maleSterilize: parseInt(cleanCols[12]) || 0, 
                                femaleSterilize: parseInt(cleanCols[13]) || 0, 
                                microchip: parseInt(cleanCols[16]) || 0,
                                register: parseInt(cleanCols[19]) || 0,
                                medical: parseInt(cleanCols[22]) || 0 
                            },
                            other: { 
                                vaccine: parseInt(cleanCols[8]) || 0, 
                                medical: parseInt(cleanCols[23]) || 0 
                            }
                        }
                    };

                    if (newRecord.date && newRecord.location) {
                        bulkData.push(newRecord);
                    } else {
                        failCount++;
                    }
                }

                if (bulkData.length === 0) {
                    alert("ไม่พบข้อมูลที่ถูกต้องสำหรับนำเข้า");
                    return;
                }

                try {
                    const response = await fetch(`${BASE_URL}/api/reports/bulk`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                        body: JSON.stringify(bulkData)
                    });

                    if (response.ok) {
                        const result = await response.json();
                        alert(`✅ นำเข้าข้อมูลสำเร็จทั้งหมด ${result.count} รายการ\n(ข้อมูลที่ไม่สมบูรณ์และถูกข้าม: ${failCount})`);
                        window.location.reload();
                    } else {
                        alert("❌ เกิดข้อผิดพลาดจาก Server ในการบันทึกข้อมูล");
                    }
                } catch (err) {
                    console.error(err);
                    alert("❌ ไม่สามารถเชื่อมต่อกับ Server ได้");
                }

            } catch (error) { 
                console.error(error);
                alert("เกิดข้อผิดพลาดในการอ่านไฟล์ CSV"); 
            }
        };
        reader.readAsText(file);
    };

    // ---------------------------------------------------------
    // 🛠 3. ฟังก์ชัน useCallback สำหรับลดการ Render ซ้ำซ้อนของ UI
    // ---------------------------------------------------------
    const closeAddDataModal = useCallback(() => setIsModalOpen(false), [setIsModalOpen]);
    const closeOutbreakModal = useCallback(() => setIsOutbreakModalOpen(false), [setIsOutbreakModalOpen]);
    const closeCsvModal = useCallback(() => setIsCsvModalOpen(false), [setIsCsvModalOpen]);
    const closeBackupModal = useCallback(() => setIsBackupModalOpen(false), [setIsBackupModalOpen]);
    const closeImagePreview = useCallback(() => setViewImage(null), [setViewImage]);
    const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), [setIsLoginModalOpen]);
    const closeUserMgmtModal = useCallback(() => setIsUserMgmtOpen(false), [setIsUserMgmtOpen]);
    const closeClearDataModal = useCallback(() => setIsClearDataModalOpen(false), [setIsClearDataModalOpen]);
    const closeChangePasswordModal = useCallback(() => setIsChangePasswordOpen(false), [setIsChangePasswordOpen]);
    const closeLogModal = useCallback(() => setIsLogModalOpen(false), [setIsLogModalOpen]);
    const closeDispatchModal = useCallback(() => setIsDispatchModalOpen(false), [setIsDispatchModalOpen]);
    const closeCalendar = useCallback(() => setIsCalendarOpen(false), [setIsCalendarOpen]);
    const closeMeetingCalendar = useCallback(() => setIsMeetingCalendarOpen(false), [setIsMeetingCalendarOpen]);
    const closeMeetingModal = useCallback(() => setIsMeetingModalOpen(false), [setIsMeetingModalOpen]);
    const closeMeetingList = useCallback(() => setIsMeetingListOpen(false), [setIsMeetingListOpen]);

    const openAddModal = useCallback(() => { setEditingItem(null); setIsModalOpen(true); }, [setEditingItem, setIsModalOpen]);
    const openEditModal = useCallback((item) => { setEditingItem(item); setIsModalOpen(true); }, [setEditingItem, setIsModalOpen]);
    const handleOpenCsvOutbreak = useCallback(() => { setCsvMode('outbreak'); setIsCsvModalOpen(true); }, [setCsvMode, setIsCsvModalOpen]);
    const handleOpenCsvReport = useCallback(() => { setCsvMode('report'); setIsCsvModalOpen(true); }, [setCsvMode, setIsCsvModalOpen]);

    const openLoginModal = useCallback(() => setIsLoginModalOpen(true), [setIsLoginModalOpen]);
    const openChangePasswordModal = useCallback(() => setIsChangePasswordOpen(true), [setIsChangePasswordOpen]);
    const openLogModal = useCallback(() => setIsLogModalOpen(true), [setIsLogModalOpen]);
    const openUserMgmtModal = useCallback(() => setIsUserMgmtOpen(true), [setIsUserMgmtOpen]);
    const openBackupModal = useCallback(() => setIsBackupModalOpen(true), [setIsBackupModalOpen]);
    const openMeetingListModal = useCallback(() => setIsMeetingListOpen(true), [setIsMeetingListOpen]);
    const openCalendarModal = useCallback(() => setIsCalendarOpen(true), [setIsCalendarOpen]);
    const openMeetingCalendarModal = useCallback(() => setIsMeetingCalendarOpen(true), [setIsMeetingCalendarOpen]);
    const openMeetingModalDialog = useCallback(() => setIsMeetingModalOpen(true), [setIsMeetingModalOpen]);
    const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), [setIsMobileMenuOpen]);
    const openMobileMenu = useCallback(() => setIsMobileMenuOpen(true), [setIsMobileMenuOpen]);

    const openDispatchForm = useCallback(() => { setViewingDispatch(null); setIsDispatchModalOpen(true); }, [setViewingDispatch, setIsDispatchModalOpen]);
    const openDispatchEvent = useCallback((evt) => { setViewingDispatch(evt.originalData); setIsDispatchModalOpen(true); }, [setViewingDispatch, setIsDispatchModalOpen]);
    const openMeetingForm = useCallback(() => { setViewingMeeting(null); setIsMeetingModalOpen(true); }, [setViewingMeeting, setIsMeetingModalOpen]);
    const editMeetingFromList = useCallback((m) => { setViewingMeeting(m); setIsMeetingListOpen(false); setIsMeetingModalOpen(true); }, [setViewingMeeting, setIsMeetingListOpen, setIsMeetingModalOpen]);

    const handleClearFilters = useCallback(() => {
        setSearchTerm(''); setSelectedYear('ทั้งหมด'); setSelectedMonth('ทั้งหมด'); setSelectedUnit('ทั้งหมด'); setSelectedDistrict('ทั้งหมด'); setSearchDate('');
    }, [setSearchTerm, setSelectedYear, setSelectedMonth, setSelectedUnit, setSelectedDistrict, setSearchDate]);

    const handleRestoreSuccess = useCallback(() => { window.location.reload(); }, []);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);


    // --- 5. CALCULATIONS ---

    const availableYears = useMemo(() => {
        if (!Array.isArray(reportData)) return [];
        return [...new Set(reportData.map(item => item.date ? item.date.split('-')[0] : null).filter(y => y))].sort().reverse();
    }, [reportData]);

    const filteredData = useMemo(() => {
        if (!Array.isArray(deferredReportData)) return [];

        const lowerSearch = deferredSearchTerm ? String(deferredSearchTerm).toLowerCase().trim() : '';
        const isYearAll = deferredYear === 'ทั้งหมด';
        const isMonthAll = deferredMonth === 'ทั้งหมด';
        const isUnitAll = deferredUnit === 'ทั้งหมด';
        const isDistrictAll = deferredDistrict === 'ทั้งหมด';

        return deferredReportData.filter(item => {
            try {
                if (!item) return false;

                if (searchDate) { 
                    if (item.date !== searchDate) return false; 
                } else if (!isYearAll || !isMonthAll) {
                    if (!item.date) return false;
                    const dateParts = String(item.date).split('-');
                    if (dateParts.length < 2) return false;
                    
                    if (!isYearAll && dateParts[0] !== String(deferredYear)) return false;
                    if (!isMonthAll && parseInt(dateParts[1], 10) !== parseInt(deferredMonth, 10)) return false;
                }

                if (!isUnitAll && item.unit !== deferredUnit) return false;
                if (!isDistrictAll && (!item.district || item.district.trim() !== deferredDistrict)) return false;

                if (lowerSearch) {
                    const itemLocation = item.location ? String(item.location).toLowerCase() : '';
                    const itemDistrict = item.district ? String(item.district).toLowerCase() : '';
                    const itemSubdistrict = item.subdistrict ? String(item.subdistrict).toLowerCase() : '';
                    
                    if (!itemLocation.includes(lowerSearch) && 
                        !itemDistrict.includes(lowerSearch) && 
                        !itemSubdistrict.includes(lowerSearch)) {
                        return false;
                    }
                }
                return true;
            } catch (error) {
                return false; 
            }
        });
    }, [deferredReportData, deferredYear, deferredMonth, deferredUnit, deferredDistrict, deferredSearchTerm, searchDate]);

    const handleCsvFileChange = useCallback((e) => {
        if (csvMode === 'outbreak') handleOutbreakFileUpload(e);
        else handleFileUpload(e);
    }, [csvMode]);

const handleCsvExport = useCallback((filters) => {
    let dataToExport = csvMode === 'outbreak' ? outbreakData : reportData;

    if (filters) {
        dataToExport = dataToExport.filter(item => {
            const isYearAll = filters.year === 'ทั้งหมด';
            const isMonthAll = filters.month === 'ทั้งหมด';
            const isUnitAll = filters.unit === 'ทั้งหมด';
            const isDistrictAll = filters.district === 'ทั้งหมด';

            // กรอง ปี และ เดือน
            if (!isYearAll || !isMonthAll) {
                if (!item.date) return false;
                const dateParts = String(item.date).split('-');
                if (dateParts.length < 2) return false;
                
                if (!isYearAll && dateParts[0] !== String(filters.year)) return false;
                if (!isMonthAll && parseInt(dateParts[1], 10) !== parseInt(filters.month, 10)) return false;
            }

            // กรอง หน่วยงาน (ใช้เฉพาะโหมด Report)
            if (csvMode !== 'outbreak' && !isUnitAll) {
                if (item.unit !== filters.unit) return false;
            }
            
            // กรอง เขต
            if (!isDistrictAll && (!item.district || item.district.trim() !== filters.district)) return false;

            return true;
        });
    }

    // เรียกใช้ฟังก์ชัน Export
    if (csvMode === 'outbreak') {
        exportOutbreaksToCSV(dataToExport);
    } else {
        exportToCSV(dataToExport);
    }
}, [csvMode, outbreakData, reportData]);

    const { 
        mapDisplayData, 
        totals, 
        unitStats, 
        unitByDistrictPieData, 
        unitByUnitTypePieData, 
        unitByWorkTypePieData 
    } = useMemo(() => {
        const newMapDisplayData = [];
        const newTotals = { 
            vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0,
            dog: { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 },
            cat: { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 }
        };
        const unitDict = {};
        const districtDict = {};

        if (!Array.isArray(filteredData)) {
            return { mapDisplayData: [], totals: newTotals, unitStats: [], unitByDistrictPieData: [], unitByUnitTypePieData: [], unitByWorkTypePieData: [] };
        }

        for (let i = 0; i < filteredData.length; i++) {
            const curr = filteredData[i];
            const toNum = (val) => parseInt(val, 10) || 0;

            const v = toNum(curr.stats?.vaccine);
            const s = toNum(curr.stats?.sterilize);
            const r = toNum(curr.stats?.register);
            const m = toNum(curr.stats?.microchip);
            const med = toNum(curr.stats?.medical);
            const workTotal = v + s + r + m + med;

            // 1. Map Data
            if (curr.lat && curr.long && !isNaN(parseFloat(curr.lat)) && !isNaN(parseFloat(curr.long)) && (parseFloat(curr.lat) !== 0 || parseFloat(curr.long) !== 0)) {
                newMapDisplayData.push(curr);
            }

            // 2. Totals
            newTotals.vaccine += v; newTotals.sterilize += s; newTotals.register += r; newTotals.microchip += m; newTotals.medical += med;

            const d = curr.details?.dog || {};
            const c = curr.details?.cat || {};

            newTotals.dog.vaccine += toNum(d.vaccine);
            newTotals.dog.sterilize += toNum(d.maleSterilize) + toNum(d.femaleSterilize);
            newTotals.dog.register += toNum(d.register);
            newTotals.dog.microchip += toNum(d.microchip);
            newTotals.dog.medical += toNum(d.medical);

            newTotals.cat.vaccine += toNum(c.vaccine);
            newTotals.cat.sterilize += toNum(c.maleSterilize) + toNum(c.femaleSterilize);
            newTotals.cat.register += toNum(c.register);
            newTotals.cat.microchip += toNum(c.microchip);
            newTotals.cat.medical += toNum(c.medical);

            // 3. Unit Stats & Unit Pie
            const unitName = curr.unit || 'ไม่ระบุ';
            if (!unitDict[unitName]) {
                unitDict[unitName] = { name: unitName, count: 0, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0, dog: 0, cat: 0 };
            }
            unitDict[unitName].count += 1;
            unitDict[unitName].vaccine += v; unitDict[unitName].sterilize += s; unitDict[unitName].register += r; unitDict[unitName].microchip += m; unitDict[unitName].medical += med;
            unitDict[unitName].total += workTotal;
            unitDict[unitName].dog += (toNum(d.vaccine) + toNum(d.maleSterilize) + toNum(d.femaleSterilize) + toNum(d.microchip) + toNum(d.register) + toNum(d.medical));
            unitDict[unitName].cat += (toNum(c.vaccine) + toNum(c.maleSterilize) + toNum(c.femaleSterilize) + toNum(c.microchip) + toNum(c.register) + toNum(c.medical));

            // 4. District Pie
            const distName = curr.district || 'ไม่ระบุ';
            if (!districtDict[distName]) districtDict[distName] = { name: distName, value: 0 };
            districtDict[distName].value += workTotal;
        }

        const newUnitStats = Object.values(unitDict).sort((a, b) => b.total - a.total);

        return {
            mapDisplayData: newMapDisplayData,
            totals: newTotals,
            unitStats: newUnitStats,
            unitByDistrictPieData: Object.values(districtDict).sort((a, b) => b.value - a.value).slice(0, 10),
            unitByUnitTypePieData: newUnitStats.map(u => ({ name: u.name, value: u.total })).slice(0, 10),
            unitByWorkTypePieData: [
                { name: 'ฉีดวัคซีน', value: newTotals.vaccine },
                { name: 'ผ่าตัดทำหมัน', value: newTotals.sterilize },
                { name: 'จดทะเบียน', value: newTotals.register },
                { name: 'ฝังไมโครชิป', value: newTotals.microchip },
                { name: 'รักษาพยาบาล', value: newTotals.medical }
            ].filter(item => item.value > 0).sort((a, b) => b.value - a.value)
        };
    }, [filteredData]);

    const { rankingNestedStats, rankingUnitStats } = useMemo(() => {
        const unitDict = {};
        
        if (!Array.isArray(reportData)) return { rankingNestedStats: [], rankingUnitStats: [] };

        for (let i = 0; i < reportData.length; i++) {
            const item = reportData[i];
            if (!item || !item.date) continue;

            const dateParts = item.date.split('-');
            if (dateParts.length < 2) continue;
            const [itemYear, itemMonth] = dateParts;

            if (rankingYear !== 'ทั้งหมด' && itemYear !== rankingYear) continue;
            if (rankingMonth !== 'ทั้งหมด' && parseInt(itemMonth) !== parseInt(rankingMonth)) continue;

            const unitName = item.unit ? item.unit : 'ไม่ระบุ';
            const districtName = item.district ? item.district.trim() : 'ไม่ระบุ';
            const toNum = (val) => parseInt(val, 10) || 0;
            
            const v = toNum(item.stats?.vaccine);
            const s = toNum(item.stats?.sterilize);
            const r = toNum(item.stats?.register);
            const m = toNum(item.stats?.microchip);
            const med = toNum(item.stats?.medical);
            const workTotal = v + s + r + m + med;

            if (!unitDict[unitName]) {
                unitDict[unitName] = { 
                    name: unitName, totalWork: 0, count: 0, districts: {}, 
                    stats: { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 },
                    vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 
                };
            }
            
            const u = unitDict[unitName];
            u.totalWork += workTotal;
            u.count += 1;
            u.stats.vaccine += v; u.stats.sterilize += s; u.stats.register += r; u.stats.microchip += m; u.stats.medical += med;
            u.vaccine += v; u.sterilize += s; u.register += r; u.microchip += m; u.medical += med;
            u.total += workTotal;

            if (!u.districts[districtName]) {
                u.districts[districtName] = { total: 0, stats: { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 } };
            }
            
            const d = u.districts[districtName];
            d.total += workTotal;
            d.stats.vaccine += v; d.stats.sterilize += s; d.stats.register += r; d.stats.microchip += m; d.stats.medical += med;
        }

        const values = Object.values(unitDict);

        const newRankingNestedStats = values
            .sort((a, b) => b.totalWork - a.totalWork)
            .slice(0, 5)
            .map(unit => {
                const sortedDistricts = Object.entries(unit.districts)
                    .map(([dName, dData]) => ({ name: dName, total: dData.total, stats: dData.stats }))
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5);
                return { ...unit, topDistricts: sortedDistricts };
            });

        const newRankingUnitStats = values.sort((a, b) => b.count - a.count || b.total - a.total);

        return { rankingNestedStats: newRankingNestedStats, rankingUnitStats: newRankingUnitStats };
    }, [reportData, rankingYear, rankingMonth]);
    
    const dispatchStats = useMemo(() => {
        const initStats = () => ({ count: 0, sterilization: 0, vaccine_microchip: 0, governor: 0, cat_cage: 0, other: 0 });

        const baseYear = chartBaseYear === 'ทั้งหมด' ? new Date().getFullYear() : chartBaseYear;
        const baseMonth = chartBaseMonth === 'ทั้งหมด' ? (new Date().getMonth() + 1) : chartBaseMonth;

        const monthMap = {};
        filteredData.forEach(item => {
            const m = item.date.substring(0, 7);
            if (!monthMap[m]) monthMap[m] = initStats();
            
            monthMap[m].count += 1;
            
            const uKey = getUnitKey(item.unit);
            if (monthMap[m][uKey] !== undefined) {
                monthMap[m][uKey] += 1;
            } else {
                monthMap[m]['other'] += 1;
            }
        });

        const monthlyData = [];
        for (let i = 9 + freqMonthlyOffset; i >= freqMonthlyOffset; i--) {
            const d = new Date(baseYear, baseMonth - 1, 1);
            d.setMonth(d.getMonth() - i);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${month}`;
            
            monthlyData.push({
                name: key,
                ...initStats(),
                ...(monthMap[key] || {})
            });
        }

        const dayMap = {};
        filteredData.forEach(item => {
            const day = item.date;
            if (!dayMap[day]) dayMap[day] = initStats();
            
            dayMap[day].count += 1;
            
            const uKey = getUnitKey(item.unit);
            if (dayMap[day][uKey] !== undefined) {
                 dayMap[day][uKey] += 1;
            } else {
                 dayMap[day]['other'] += 1;
            }
        });

        const dailyData = [];
        for (let i = 13 + freqDailyOffset; i >= freqDailyOffset; i--) {
            const isCurrentMonth = baseYear === new Date().getFullYear() && baseMonth === (new Date().getMonth() + 1);
            const d = isCurrentMonth ? new Date() : new Date(baseYear, baseMonth, 0);
            
            d.setDate(d.getDate() - i);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const key = `${year}-${month}-${day}`;
            const displayDate = `${day}/${month}`;
            
            dailyData.push({
                name: displayDate,
                fullDate: key,
                ...initStats(),
                ...(dayMap[key] || {})
            });
        }

        return { monthly: monthlyData, daily: dailyData };
    }, [filteredData, freqMonthlyOffset, freqDailyOffset, chartBaseYear, chartBaseMonth]);

    const trendData = useMemo(() => {
        const baseYear = chartBaseYear === 'ทั้งหมด' ? new Date().getFullYear() : chartBaseYear;
        const baseMonth = chartBaseMonth === 'ทั้งหมด' ? (new Date().getMonth() + 1) : chartBaseMonth;

        const dataMap = filteredData.reduce((acc, curr) => {
            const month = curr.date.substring(0, 7);
            const toNum = (val) => parseInt(val, 10) || 0;
            
            if (!acc[month]) acc[month] = { name: month, count: 0, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 };
            
            acc[month].count += 1;
            acc[month].vaccine += toNum(curr.stats?.vaccine);
            acc[month].sterilize += toNum(curr.stats?.sterilize);
            acc[month].register += toNum(curr.stats?.register);
            acc[month].microchip += toNum(curr.stats?.microchip);
            acc[month].medical += toNum(curr.stats?.medical);
            acc[month].total += (toNum(curr.stats?.vaccine) + toNum(curr.stats?.sterilize) + toNum(curr.stats?.register) + toNum(curr.stats?.microchip) + toNum(curr.stats?.medical));
            
            return acc;
        }, {});

        const last10Months = [];
        for (let i = 9 + trendOffset; i >= trendOffset; i--) {
            const d = new Date(baseYear, baseMonth - 1, 1); 
            d.setMonth(d.getMonth() - i);
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const monthStr = `${year}-${month}`; 
            
            last10Months.push(dataMap[monthStr] || { name: monthStr, count: 0, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 });
        }
        return last10Months;
    }, [filteredData, trendOffset, chartBaseYear, chartBaseMonth]);

    const availableOutbreakYears = useMemo(() => [...new Set(outbreakData.map(item => item.date ? item.date.split('-')[0] : null).filter(y => y !== null))].sort().reverse(), [outbreakData]);
    const filteredOutbreaks = useMemo(() => outbreakFilterYear === 'ทั้งหมด' ? outbreakData : outbreakData.filter(item => item.date && item.date.startsWith(outbreakFilterYear)), [outbreakData, outbreakFilterYear]);
    const outbreakStats = useMemo(() => {
        const total = filteredOutbreaks.length;
        const grouped = filteredOutbreaks.reduce((acc, curr) => { acc[curr.district] = (acc[curr.district] || 0) + 1; return acc; }, {});
        const topDistricts = Object.keys(grouped).map(key => ({ name: key, count: grouped[key] })).sort((a, b) => b.count - a.count).slice(0, 5);
        const animalStats = {
            owned: { dogMale: 0, dogFemale: 0, catMale: 0, catFemale: 0 },
            unowned: { dogMale: 0, dogFemale: 0, catMale: 0, catFemale: 0 },
            feeder: { dogMale: 0, dogFemale: 0, catMale: 0, catFemale: 0 }
        };

        filteredOutbreaks.forEach(item => {
            if (item.stats) {
                ['owned', 'unowned', 'feeder'].forEach(type => {
                    if (item.stats[type]) {
                        animalStats[type].dogMale += parseInt(item.stats[type].dog?.male) || 0;
                        animalStats[type].dogFemale += parseInt(item.stats[type].dog?.female) || 0;
                        animalStats[type].catMale += parseInt(item.stats[type].cat?.male) || 0;
                        animalStats[type].catFemale += parseInt(item.stats[type].cat?.female) || 0;
                    }
                });
            }
        });

        const animalChartData = [
            {
                name: 'สัตว์มีเจ้าของ',
                dogMale: animalStats.owned.dogMale,
                dogFemale: animalStats.owned.dogFemale,
                catMale: animalStats.owned.catMale,
                catFemale: animalStats.owned.catFemale
            },
            {
                name: 'ไม่มีเจ้าของ',
                dogMale: animalStats.unowned.dogMale,
                dogFemale: animalStats.unowned.dogFemale,
                catMale: animalStats.unowned.catMale,
                catFemale: animalStats.unowned.catFemale
            },
            {
                name: 'ผู้ให้อาหาร',
                dogMale: animalStats.feeder.dogMale,
                dogFemale: animalStats.feeder.dogFemale,
                catMale: animalStats.feeder.catMale,
                catFemale: animalStats.feeder.catFemale
            }
        ];

        return { total, topDistricts, animalChartData };
    }, [filteredOutbreaks]);
    
    const outbreakYearlyTrend = useMemo(() => {
        const stats = outbreakData.reduce((acc, curr) => { if (!curr.date) return acc; const year = curr.date.split('-')[0]; acc[year] = (acc[year] || 0) + 1; return acc; }, {});
        return Object.keys(stats).sort().map(year => ({ name: year, count: stats[year] }));
    }, [outbreakData]);

    const outbreakPieData = useMemo(() => {
        const grouped = filteredOutbreaks.reduce((acc, curr) => {
            const district = curr.district || 'ไม่ระบุ';
            if (!acc[district]) acc[district] = { name: district, value: 0 };
            acc[district].value += 1;
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => b.value - a.value).slice(0, 10);
    }, [filteredOutbreaks]);

    // --- 6. RENDER UI ---

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 overflow-hidden">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700;800&display=swap');
                body { font-family: 'Sarabun', sans-serif; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                table th { white-space: nowrap !important; line-height: 1.5 !important; }
                table td { line-height: 1.5; }
                .leaflet-popup-content-wrapper { padding: 0; overflow: hidden; border-radius: 12px; border: none; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }
                .leaflet-popup-content { margin: 0; width: 260px !important; }
                .leaflet-popup-tip { background: white; }
                @keyframes pulse-ring { 0% { transform: scale(0.33); } 80%, 100% { opacity: 0; } }
                .danger-pulse::before { content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 100%; border-radius: 50%; background-color: #ef4444; animation: pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
            `}</style>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <Suspense fallback={<div className="hidden">Loading...</div>}>
                <AddDataModal isOpen={isModalOpen} onClose={closeAddDataModal} onSave={handleAddNewData} onUpdate={handleUpdateData} initialData={editingItem} onToast={addToast} />
                <AddOutbreakModal isOpen={isOutbreakModalOpen} onClose={closeOutbreakModal} onSave={handleAddOutbreak} onUpdate={handleUpdateOutbreak} initialData={editingOutbreak} onToast={addToast} />
            </Suspense>
            <CsvActionModal isOpen={isCsvModalOpen} onClose={closeCsvModal} onFileChange={handleCsvFileChange} onExport={handleCsvExport}availableYears={csvMode === 'outbreak' ? availableOutbreakYears : availableYears}thaiMonths={THAI_MONTHS}units={UNIT_TYPES}districts={BANGKOK_DISTRICTS}csvMode={csvMode}/>
            <BackupSystemModal isOpen={isBackupModalOpen} onClose={closeBackupModal} onRestoreSuccess={handleRestoreSuccess} token={user?.token} apiBaseUrl={BASE_URL} />
            <ImagePreviewModal imageUrl={viewImage} onClose={closeImagePreview} />
            <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} onLogin={handleLogin} apiBaseUrl={BASE_URL} onToast={addToast} />
            <UserManagementModal isOpen={isUserMgmtOpen} onClose={closeUserMgmtModal} token={user?.token} apiBaseUrl={BASE_URL} onToast={addToast} currentUserRole={user?.role}/>
            <ClearDataModal isOpen={isClearDataModalOpen} onClose={closeClearDataModal} onConfirm={executeClearAllData} availableYears={availableYears} units={UNIT_TYPES} thaiMonths={THAI_MONTHS}/>
            <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={closeChangePasswordModal} apiBaseUrl={BASE_URL} token={user?.token} onToast={addToast} />
            <ActivityLogModal isOpen={isLogModalOpen} onClose={closeLogModal} token={user?.token} apiBaseUrl={BASE_URL} />
            <DispatchModal isOpen={isDispatchModalOpen} onClose={closeDispatchModal} onToast={addToast} onSave={handleSaveDispatchEvent} onDelete={handleDeleteDispatch} initialData={viewingDispatch} />
            <DispatchCalendarDashboard isOpen={isCalendarOpen} onClose={closeCalendar} events={dispatchEventsOnly} onOpenForm={openDispatchForm} onEventClick={openDispatchEvent} />
            <MeetingCalendarDashboard isOpen={isMeetingCalendarOpen} onClose={closeMeetingCalendar} events={meetingEventsOnly} onOpenForm={openMeetingForm} onEventClick={handleCalendarEventClick} />
            <MeetingModal isOpen={isMeetingModalOpen} onClose={closeMeetingModal} onSave={handleSaveMeeting} onDelete={handleDeleteMeeting} initialData={viewingMeeting} onToast={addToast} />
            <MeetingListModal isOpen={isMeetingListOpen} onClose={closeMeetingList} meetings={meetings} onEdit={editMeetingFromList} />

            <Sidebar 
                user={user} isSuperAdmin={isSuperAdmin} canEdit={canEdit} 
                isSystemDeveloper={isSystemDeveloper}
                activeTab={activeTab} setActiveTab={setActiveTab}
                isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed}
                isSystemMenuOpen={isSystemMenuOpen} setIsSystemMenuOpen={setIsSystemMenuOpen}
                onLogin={openLoginModal} onLogout={handleLogout} onChangePassword={openChangePasswordModal}
                onOpenLog={openLogModal} onOpenUserMgmt={openUserMgmtModal} onOpenBackup={openBackupModal}
                onOpenCsvOutbreak={handleOpenCsvOutbreak} onOpenCsvReport={handleOpenCsvReport} onGenerateMock={handleGenerateMockData}
                onOpenMeetingList={openMeetingListModal} onOpenCalendar={openCalendarModal} onOpenMeetingCalendar={openMeetingCalendarModal}
                onOpenMeetingModal={openMeetingModalDialog} onOpenAddOutbreak={openAddOutbreakModal} onOpenAddData={openAddModal}
                isMagaAdmin={isMagaAdmin}
                tabsConfig={tabsConfig} toggleTab={toggleTab}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                onNotifyUpdate={handleNotifySystemUpdate}
            />

            {isMobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-slate-900/50 z-[4999] backdrop-blur-sm transition-opacity"
                    onClick={closeMobileMenu}
                />
            )}

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0">
                
                <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 z-30 shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={openMobileMenu} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <List className="w-6 h-6" />
                        </button>
                        <img src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-900/5" alt="Logo" />
                        <h1 className="text-sm font-bold text-slate-800">ระบบสัตวแพทย์</h1>
                    </div>
                    {user ? (
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"><LogOut className="w-5 h-5"/></button>
                    ) : (
                        <button onClick={openLoginModal} className="p-2 text-indigo-600 hover:text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"><Unlock className="w-5 h-5"/></button>
                    )}
                </div>

                <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-y-auto pb-24 md:pb-8 custom-scrollbar">
                    
                    <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-200 mb-6 transition-all duration-300">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                                        <Search className="w-5 h-5 text-indigo-500" /> ค้นหาและกรองข้อมูล
                                    </h3>
                                    <button onClick={() => setIsFilterExpanded(!isFilterExpanded)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors shadow-sm border border-transparent hover:border-slate-200" title={isFilterExpanded ? "ยุบตัวกรอง" : "ขยายตัวกรอง"}>
                                        {isFilterExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>
                                </div>
                                
                                {(!isFilterExpanded && (searchTerm || selectedYear !== 'ทั้งหมด' || selectedMonth !== 'ทั้งหมด' || selectedUnit !== 'ทั้งหมด' || selectedDistrict !== 'ทั้งหมด')) && (
                                    <div className="flex flex-wrap gap-2 items-center animate-in fade-in duration-300">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">กำลังกรอง:</span>
                                        {searchTerm && <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 text-[10px] px-2.5 py-1 rounded-md font-bold border border-indigo-100">{searchTerm}</span>}
                                        {selectedYear !== 'ทั้งหมด' && <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] px-2.5 py-1 rounded-md font-bold border border-blue-100">ปี {parseInt(selectedYear) + 543}</span>}
                                        {selectedMonth !== 'ทั้งหมด' && <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] px-2.5 py-1 rounded-md font-bold border border-blue-100">{THAI_MONTHS[parseInt(selectedMonth) - 1]}</span>}
                                        {selectedUnit !== 'ทั้งหมด' && <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] px-2.5 py-1 rounded-md font-bold border border-emerald-100">{selectedUnit}</span>}
                                        {selectedDistrict !== 'ทั้งหมด' && <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 text-[10px] px-2.5 py-1 rounded-md font-bold border border-orange-100">{selectedDistrict}</span>}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {canEdit && (
                                    <button 
                                        onClick={handleGenerateMockData} 
                                        className="text-xs bg-indigo-50 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-bold border border-indigo-200 shadow-sm"
                                    >
                                        <Database className="w-3.5 h-3.5" /> จำลอง 200 เคส
                                    </button>
                                )}

                                {(searchTerm || searchDate || selectedYear !== 'ทั้งหมด' || selectedMonth !== 'ทั้งหมด' || selectedUnit !== 'ทั้งหมด' || selectedDistrict !== 'ทั้งหมด') && (
                                    <button 
                                        onClick={handleClearFilters} 
                                        className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-bold border border-transparent hover:border-rose-100"
                                     >
                                        <Trash2 className="w-3.5 h-3.5" /> ล้างตัวกรองทั้งหมด
                                    </button>
                                )}
                            </div>
                        </div>

                        {isFilterExpanded && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ค้นหา (สถานที่/รายละเอียด)</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="text" placeholder="พิมพ์คำค้นหา..." className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ปี (Year)</label>
                                    <select className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                                        <option value="ทั้งหมด">ทุกปี</option>
                                        {availableYears.map(y => <option key={y} value={y}>{parseInt(y) + 543}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">เดือน (Month)</label>
                                    <select className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                                        <option value="ทั้งหมด">ทุกเดือน</option>
                                        {THAI_MONTHS.map((m, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">หน่วยงาน (Unit)</label>
                                    <select className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                                        <option value="ทั้งหมด">ทุกหน่วยงาน</option>
                                        {UNIT_TYPES.map((u, i) => <option key={i} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">เขต (District)</label>
                                    <select className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
                                        <option value="ทั้งหมด">ทุกเขตใน กทม.</option>
                                        {BANGKOK_DISTRICTS.map((d, i) => <option key={i} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <Suspense fallback={
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    }>
                        {isInitialLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-in fade-in duration-300">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 border-t-transparent"></div>
                                <p className="text-slate-500 font-bold">กำลังโหลดและจัดเตรียมข้อมูล...</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'overview' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto">
                                        <KPISection totals={totals} unitStats={unitStats} />

        {/* แถวที่ 1: ข้างบนฝั่งซ้าย (สถิติหน่วยงาน) | ฝั่งขวา (Map) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <RankingSection 
                type="table" 
                rankingYear={rankingYear} 
                setRankingYear={setRankingYear} 
                rankingMonth={rankingMonth} 
                setRankingMonth={setRankingMonth} 
                availableYears={availableYears} 
                thaiMonths={THAI_MONTHS} 
                rankingUnitStats={rankingUnitStats} 
            />
            
            <div className="lg:col-span-7 bg-white p-4 rounded-xl shadow-sm border border-slate-200 min-h-[500px] h-full relative z-0">
                <LeafletMap data={mapDisplayData} outbreaks={outbreakData} onEdit={openEditModal} onEditOutbreak={openEditOutbreakModal} canEdit={canEdit}/>
            </div>
        </div>

        {/* แถวที่ 2: ข้างล่างฝั่งซ้าย (เจาะลึก 5 อันดับแรก) | ฝั่งขวา (ประสิทธิภาพและจำนวนครั้ง) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <RankingSection 
                type="deepdive" 
                rankingNestedStats={rankingNestedStats} 
            />
            
            <div className="lg:col-span-7 h-full">
                <UnitComparisonChart unitStats={unitStats} />
            </div>
        </div>

                                        <StatisticsCharts 
                                            trendData={trendData}
                                            unitStats={unitStats} 
                                            dispatchStats={dispatchStats}
                                            trendOffset={trendOffset}
                                            setTrendOffset={setTrendOffset}
                                            freqDailyOffset={freqDailyOffset}
                                            setFreqDailyOffset={setFreqDailyOffset}
                                            freqMonthlyOffset={freqMonthlyOffset}
                                            setFreqMonthlyOffset={setFreqMonthlyOffset}
                                            chartBaseYear={chartBaseYear}
                                            setChartBaseYear={setChartBaseYear}
                                            chartBaseMonth={chartBaseMonth}
                                            setChartBaseMonth={setChartBaseMonth}
                                            availableYears={availableYears}
                                        />
                                        <PieChartsSection 
                                            unitByDistrictPieData={unitByDistrictPieData}
                                            unitByUnitTypePieData={unitByUnitTypePieData}
                                            unitByWorkTypePieData={unitByWorkTypePieData}
                                            outbreakPieData={outbreakPieData}
                                        />
                                    </div>
                                )}

                                {activeTab === 'outbreak' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto">
                                        <RabiesOutbreakSection 
                                            outbreakData={outbreakData} 
                                            filterYear={outbreakFilterYear} 
                                            setFilterYear={setOutbreakFilterYear} 
                                            years={availableOutbreakYears} 
                                            stats={outbreakStats} 
                                            filteredOutbreaks={filteredOutbreaks} 
                                            yearlyTrend={outbreakYearlyTrend} 
                                            hiddenIds={hiddenOutbreakIds} 
                                            toggleVisibility={toggleOutbreakVisibility} 
                                            onEdit={openEditOutbreakModal} 
                                            onDelete={handleDeleteOutbreak} 
                                            canEdit={canEdit} 
                                        />
                                    </div>
                                )}

                                {activeTab === 'database' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto">
                                        <MainDataTable data={filteredData} canEdit={canEdit} isSuperAdmin={isSuperAdmin} onClearAll={handleClearAllData} onEdit={openEditModal} onDelete={handleDeleteData} onViewImage={setViewImage} />
                                    </div>
                                )}

                                {activeTab === 'calendar' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto h-[calc(100vh-140px)]">
                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full relative">
                                            {/* เรนเดอร์ปฏิทินแบบ Inline (ส่งค่า isInline เป็น true) */}
                                            <DispatchCalendarDashboard 
                                                isOpen={true} 
                                                events={dispatchEventsOnly} 
                                                onOpenForm={openDispatchForm} 
                                                onEventClick={openDispatchEvent} 
                                                isInline={true} 
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </Suspense>
                    <footer className="mt-12 pb-4 pt-6 border-t border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                        <div>
                            <p className="text-sm text-slate-600 font-bold">
                                © {new Date().getFullYear()} ระบบฐานข้อมูลสัตวแพทย์
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                Veterinary Management Dashboard
                            </p>
                        </div>
                        <div className="text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1.5 rounded-full">
                            เวอร์ชัน 1.0.0
                        </div>
                    </footer>
                </main>
            </div>

            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-[4000] px-2 py-2 flex justify-around items-center safe-area-pb">
                {(user || tabsConfig.overview) && (
                    <button onClick={() => setActiveTab('overview')} 
                        className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all ${activeTab === 'overview' ? 'text-indigo-600 font-bold bg-indigo-50 scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Activity className="w-5 h-5 mb-1" />
                        <span className="text-[10px]">ภาพรวม</span>
                    </button>
                )}
                {(user || tabsConfig.outbreak) && (
                    <button onClick={() => setActiveTab('outbreak')} 
                        className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all ${activeTab === 'outbreak' ? 'text-red-600 font-bold bg-red-50 scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Siren className="w-5 h-5 mb-1" />
                        <span className="text-[10px]">จุดเสี่ยง</span>
                    </button>
                )}
                {(user || tabsConfig.database) && (
                    <button onClick={() => setActiveTab('database')} 
                        className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all ${activeTab === 'database' ? 'text-emerald-600 font-bold bg-emerald-50 scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Database className="w-5 h-5 mb-1" />
                        <span className="text-[10px]">ฐานข้อมูล</span>
                    </button>
                )}
                {(user || tabsConfig.calendar) && (
                    <button onClick={() => setActiveTab('calendar')} 
                        className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all ${activeTab === 'calendar' ? 'text-blue-600 font-bold bg-blue-50 scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <CalendarDays className="w-5 h-5 mb-1" />
                        <span className="text-[10px]">ปฏิทิน</span>
                    </button>
                )}
            </div>
        </div>
    );
}