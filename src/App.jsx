import React, { useState, useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
import { 
    Activity, FileText, MapPin, Database, Download, Users, Plus, X, Navigation, 
    Upload, Search, Edit, Trash2, Lock, Skull, Siren, Key, ChevronRight, 
    Info, Check, AlertCircle, Bell, CalendarDays, Share2,ChevronLeft, List, Link, ChevronUp, ChevronDown
} from 'lucide-react';
import { io } from "socket.io-client";

// --- Custom Components & Constants (Assumed imports) ---
import KPISection from './components/KPICards';
import UserManagementModal from './components/UserManagementModal';
import {UNIT_TYPES, BANGKOK_DISTRICTS} from './constants/locations';
const AddDataModal = lazy(() => import('./components/modals/AddDataModal'));
const RabiesOutbreakSection = lazy(() => import('./components/dashboard/RabiesOutbreakSection'));
const MainDataTable = lazy(() => import('./components/dashboard/MainDataTable'));
import { exportToCSV, exportOutbreaksToCSV } from './utils/csvUtils';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import Header from './components/layout/Sidebar';
const StatisticsCharts = React.lazy(() => import('./components/dashboard/StatisticsCharts.jsx'));
import RankingSection from './components/dashboard/RankingSection';
const LeafletMap = lazy(() => import('./components/modals/LeafletMap'));
import LoginModal from './components/modals/LoginModal';
const AddOutbreakModal = lazy(() => import('./components/modals/AddOutbreakModal'));
import { MeetingCalendarDashboard, DispatchCalendarDashboard } from './components/CalendarComponents.jsx';
import DispatchModal from './components/modals/DispatchModal';
import {MeetingModal, MeetingListModal} from './components/modals/MeetingModal';

// --- SUB-COMPONENTS DEFINITION ---

// 1. LogDetailModal
const LogDetailModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="bg-slate-900 px-5 py-3 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-400" /> รายละเอียดข้อมูล (Data Payload)
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 hover:text-red-400" /></button>
                </div>
                <div className="p-0 overflow-auto bg-slate-50 custom-scrollbar">
                    <pre className="text-xs font-mono text-slate-700 p-4 leading-relaxed">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
                <div className="p-3 border-t border-slate-200 bg-white flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold">
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>
    );
};

// 2. ActivityLogModal
const ActivityLogModal = ({ isOpen, onClose, token, apiBaseUrl }) => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLogData, setSelectedLogData] = useState(null);

    useEffect(() => {
        if (isOpen) fetchLogs();
    }, [isOpen]);

    const fetchLogs = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${apiBaseUrl}/api/logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Fetch Logs Error", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const getActionColor = (action) => {
        if (action.includes('DELETE') || action.includes('CLEAR')) return 'text-red-600 bg-red-50';
        if (action.includes('CREATE') || action.includes('ADD')) return 'text-green-600 bg-green-50';
        if (action.includes('UPDATE') || action.includes('EDIT')) return 'text-blue-600 bg-blue-50';
        if (action.includes('LOGIN')) return 'text-purple-600 bg-purple-50';
        return 'text-slate-600 bg-slate-50';
    };

    return (
        <>
            <LogDetailModal 
                isOpen={!!selectedLogData} 
                onClose={() => setSelectedLogData(null)} 
                data={selectedLogData} 
            />
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                    <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white shrink-0">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-yellow-400" /> ประวัติการใช้งานระบบ (System Logs)
                        </h3>
                        <button onClick={onClose}><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 overflow-auto p-0 custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 shadow-sm">
                                <tr>
                                    <th className="p-4 w-16 text-center">Data</th>
                                    <th className="p-4 w-40">วัน-เวลา</th>
                                    <th className="p-4 w-32">ผู้ใช้งาน</th>
                                    <th className="p-4 w-24">การกระทำ</th>
                                    <th className="p-4">รายละเอียด</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr><td colSpan="5" className="p-8 text-center">กำลังโหลด...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-400">ไม่พบประวัติการใช้งาน</td></tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-3 text-center">
                                                {log.metadata && Object.keys(log.metadata).length > 0 ? (
                                                    <button 
                                                        onClick={() => setSelectedLogData(log.metadata)}
                                                        className="p-1.5 text-blue-500 hover:text-white hover:bg-blue-500 rounded-lg transition-all shadow-sm border border-blue-100"
                                                        title="ดูข้อมูลที่บันทึก"
                                                    >
                                                        <Search className="w-4 h-4" />
                                                    </button>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="p-3 text-slate-500 whitespace-nowrap text-xs">
                                                {new Date(log.createdAt).toLocaleString('th-TH')}
                                            </td>
                                            <td className="p-3">
                                                <div className="font-bold text-slate-700">{log.user}</div>
                                                <div className="text-[10px] text-slate-400 uppercase">{log.role}</div>
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold border border-transparent ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-600 truncate max-w-xs" title={log.details}>
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

// 3. ToastContainer
const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl min-w-[300px] max-w-md 
                        transform transition-all duration-500 ease-in-out animate-in slide-in-from-right fade-in
                        ${toast.type === 'success' ? 'bg-emerald-600 text-white' : ''}
                        ${toast.type === 'error' ? 'bg-red-600 text-white' : ''}
                        ${toast.type === 'info' ? 'bg-blue-600 text-white' : ''}
                    `}
                >
                    <div className="shrink-0">
                        {toast.type === 'success' && <Check className="w-5 h-5" />}
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                        {toast.type === 'info' && <Info className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 text-sm font-medium">{toast.message}</div>
                    <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};

// 4. PasswordConfirmModal
const PasswordConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;
     
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await onConfirm(password);
        setIsLoading(false);
        setPassword("");
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border-2 border-red-500">
                <div className="bg-red-600 px-6 py-4 flex justify-between items-center text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Lock className="w-5 h-5" /> ยืนยันตัวตน Superadmin
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-800">{title}</h4>
                        <p className="text-sm text-slate-500">{message}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ใส่รหัสผ่านของคุณเพื่อยืนยัน</label>
                        <input type="password" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                            placeholder="รหัสผ่าน Superadmin" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
                    </div>
                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold">ยกเลิก</button>
                        <button type="submit" disabled={isLoading} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                            {isLoading ? "กำลังตรวจสอบ..." : "ยืนยันการลบ"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// 5. ImagePreviewModal
const ImagePreviewModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;
    return (
    <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button onClick={onClose} className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md">
                <X className="w-6 h-6" />
            </button>
            <img src={imageUrl} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()} />
        </div>
    </div>
  );
};

// 6. CsvActionModal
const CsvActionModal = ({ isOpen, onClose, onFileChange, onExport }) => {
    if (!isOpen) return null;
    return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 relative animate-in zoom-in-95 duration-200">
            <button onClick={onClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3"><FileText className="w-6 h-6 text-blue-600" /></div>
                <h3 className="text-lg font-bold text-slate-800">จัดการข้อมูล CSV</h3>
                <p className="text-xs text-slate-500">เลือกดำเนินการกับไฟล์ข้อมูล</p>
            </div>
            <div className="space-y-3">
                <div className="relative w-full group">
                    <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-bold rounded-xl transition-all">
                        <Upload className="w-5 h-5" /><span>นำเข้าไฟล์ (Import)</span>
                    </button>
                    <input type="file" accept=".csv" onChange={(e) => { onFileChange(e); onClose(); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="คลิกเพื่อเลือกไฟล์ CSV" />
                </div>
                <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-xs text-slate-400">หรือ</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>
                <button onClick={() => {onExport(); onClose();}} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-100 hover:bg-green-500 hover:text-white text-slate-700 font-bold rounded-xl transition-all shadow-sm hover:shadow-md">
                    <Download className="w-5 h-5" /><span>ส่งออกไฟล์ (Export)</span>
                </button>
            </div>
        </div>
    </div>
    );
};

// 7. BackupSystemModal
const BackupSystemModal = ({ isOpen, onClose, onRestoreSuccess, token, apiBaseUrl }) => {
    if (!isOpen) return null;
    const TARGET_URL = apiBaseUrl || 'http://localhost:5000';

    const handleDownloadBackup = async () => {
        try {
            const response = await fetch(`${TARGET_URL}/api/system/backup`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Backup failed');
            const data = await response.json();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `VET_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            onClose();
        } catch (error) {
            alert("❌ เกิดข้อผิดพลาดในการสำรองข้อมูล (ตรวจสอบสิทธิ์ Admin)");
            console.error(error);
        }
    };

    const handleRestoreBackup = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (!window.confirm("⚠️ คำเตือน: การกู้คืนข้อมูลจะ 'ลบข้อมูลปัจจุบันทั้งหมด' และแทนที่ด้วยไฟล์ Backup\n\nคุณแน่ใจหรือไม่?")) return;
                const response = await fetch(`${TARGET_URL}/api/system/restore`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: event.target.result 
                });
                const result = await response.json();
                if (response.ok) {
                    alert(`✅ กู้คืนข้อมูลสำเร็จ!\n- รายงาน: ${result.reportCount} รายการ\n- จุดระบาด: ${result.outbreakCount} รายการ`);
                    onRestoreSuccess(); 
                    onClose();
                } else {
                    alert("❌ กู้คืนข้อมูลล้มเหลว: " + result.message);
                }
            } catch (error) {
                alert("❌ ไฟล์ Backup ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึง");
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Database className="w-5 h-5 text-green-400" /> สำรองและกู้คืนข้อมูล</h3>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <button onClick={handleDownloadBackup} className="w-full py-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-700 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group">
                        <Download className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        <span className="font-bold">ดาวน์โหลดไฟล์ Backup (.json)</span>
                        <span className="text-xs text-blue-400">เก็บข้อมูลทั้งหมดในระบบไว้ในไฟล์เดียว</span>
                    </button>
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-xs text-slate-400">หรือ กู้คืนข้อมูล</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>
                    <div className="relative w-full group">
                        <button className="w-full py-4 bg-red-50 hover:bg-red-100 border-2 border-dashed border-red-200 text-red-700 rounded-xl flex flex-col items-center justify-center gap-2 transition-all">
                            <Upload className="w-8 h-8" />
                            <span className="font-bold">อัปโหลดไฟล์ Restore</span>
                            <span className="text-xs text-red-400">ข้อมูลปัจจุบันจะถูกแทนที่ด้วยไฟล์นี้</span>
                        </button>
                        <input type="file" accept=".json" onChange={handleRestoreBackup} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Helper Function: getUnitKey (เพิ่มส่วนนี้) ---
const getUnitKey = (unitName) => {
        if (!unitName) return 'other';
        const lower = String(unitName).toLowerCase();
        
        if (['sterilization', 'vaccine_microchip', 'governor', 'cat_cage', 'other'].includes(lower)) return lower;
        
        if (lower.includes('สัตวแพทย์') || lower.includes('vet') || lower.includes('steriliz')) return 'sterilization';
        if (lower.includes('วัคซีน') || lower.includes('vaccine') || lower.includes('ไมโครชิป') || lower.includes('microchip')) return 'vaccine_microchip';
        if (lower.includes('ผู้ว่า') || lower.includes('governor')) return 'governor';
        if (lower.includes('กรงแมว') || lower.includes('cat') || lower.includes('cage')) return 'cat_cage';

        return 'other';
    };

// --- MAIN DASHBOARD COMPONENT ---

export default function VeterinaryDashboard() {
    // --- 1. STATE MANAGEMENT ---
    
    // Data States
    const [reportData, setReportData] = useState([]);
    const [outbreakData, setOutbreakData] = useState([]);
    
    // UI States
    const [viewImage, setViewImage] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    
    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [selectedYear, setSelectedYear] = useState('ทั้งหมด');
    const [selectedMonth, setSelectedMonth] = useState('ทั้งหมด');
    const [selectedUnit, setSelectedUnit] = useState('ทั้งหมด');
    const [selectedDistrict, setSelectedDistrict] = useState('ทั้งหมด');
    const [rankingYear, setRankingYear] = useState('ทั้งหมด');
    const [rankingMonth, setRankingMonth] = useState('ทั้งหมด');

    const [outbreakFilterYear, setOutbreakFilterYear] = useState('ทั้งหมด');

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
    const [isOutbreakModalOpen, setIsOutbreakModalOpen] = useState(false);
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
    
    // --- AUTHENTICATION STATES (NEW) ---
    const [user, setUser] = useState(null); // { username, role, token }
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);

    const [activeTab, setActiveTab] = useState('overview');

    // Legacy View Mode (optional)
    const isReadOnlyMode = new URLSearchParams(window.location.search).get('mode') === 'view';

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Constants
    const BASE_URL = 'https://veterinarydashboard-hwho.onrender.com';
    const API_URL = `${BASE_URL}/api/reports`;
    const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

    // Confirm Password
    const [isConfirmPasswordOpen, setIsConfirmPasswordOpen] = useState(false);
    const [isMeetingCalendarOpen, setIsMeetingCalendarOpen] = useState(false);

    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [trendOffset, setTrendOffset] = useState(0); 
const [freqDailyOffset, setFreqDailyOffset] = useState(0); 
const [freqMonthlyOffset, setFreqMonthlyOffset] = useState(0);

    // Toast
    const [toasts, setToasts] = useState([]);
    const addToast = (type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 3000);
    };
    const removeToast = (id) => { setToasts(prev => prev.filter(t => t.id !== id)); };

    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [editingOutbreak, setEditingOutbreak] = useState(null);
    const [hiddenOutbreakIds, setHiddenOutbreakIds] = useState([]);

    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [dispatchEvents, setDispatchEvents] = useState([]);
    const [viewingDispatch, setViewingDispatch] = useState(null);

    // --- เพิ่ม State สำหรับการประชุม ---
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [meetings, setMeetings] = useState([]);
    const [isMeetingListOpen, setIsMeetingListOpen] = useState(false); // เพิ่ม State เปิด/ปิด List
    const [viewingMeeting, setViewingMeeting] = useState(null);

    const [isFilterExpanded, setIsFilterExpanded] = useState(true);

const dispatchEventsOnly = useMemo(() => dispatchEvents.map(d => ({
    ...d,
    type: 'dispatch',
    originalData: d
})), [dispatchEvents]);

const meetingEventsOnly = useMemo(() => meetings.map(m => ({
    date: m.date,
    time: m.startTime,
    location: m.title,
    team: 'Online/Room',
    note: m.link,
    type: 'meeting',
    _id: m._id,
    originalData: m
})), [meetings]);


    // --- [แก้ไข] ฟังก์ชันบันทึกลง Database ---
    const handleSaveDispatchEvent = async (payload) => {
        try {
            const method = payload._id ? 'PUT' : 'POST';
            const url = payload._id 
                ? `${BASE_URL}/api/dispatches/${payload._id}` 
                : `${BASE_URL}/api/dispatches`;

            const res = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${user?.token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                addToast('success', payload._id ? 'แก้ไขแผนงานเรียบร้อย' : 'บันทึกแผนงานเรียบร้อย');
                // ไม่ต้อง setDispatchEvents เอง เพราะรอ Socket อัปเดตให้
                setIsDispatchModalOpen(false);
            } else {
                const err = await res.json();
                addToast('error', `บันทึกไม่สำเร็จ: ${err.message}`);
            }
        } catch (error) {
            addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };


    // --- [เพิ่ม] ฟังก์ชันลบงาน (ส่งให้ Modal ใช้) ---
    const handleDeleteDispatch = async (id) => {
        if (!confirm('ยืนยันลบแผนงานนี้?')) return;
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

    const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);

    const [csvMode, setCsvMode] = useState('report');
    
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
    }, [BASE_URL]);

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

                    // Regex แยก CSV ป้องกันกรณีมี comma ใน quote
                    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                    const cleanCols = cols.map(c => c.trim().replace(/^"|"$/g, ''));

                    // ตรวจสอบจำนวนคอลัมน์ขั้นต่ำ (วันที่, สถานที่, เขต, lat, long)
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
                            dog: { 
                                male: parseNum(cleanCols[5]), 
                                female: parseNum(cleanCols[6]) 
                            },
                            cat: { 
                                male: parseNum(cleanCols[7]), 
                                female: parseNum(cleanCols[8]) 
                            }
                        }
                    };

                    // ต้องมีพิกัดเท่านั้นถึงจะนำเข้า
                    if (newRecord.lat !== 0 && newRecord.long !== 0) {
                        bulkData.push(newRecord);
                    }
                }

                if (bulkData.length === 0) {
                    alert("ไม่พบข้อมูลที่ถูกต้อง (กรุณาตรวจสอบ Lat/Long ในไฟล์ CSV)");
                    return;
                }

                // ส่ง API
                const response = await fetch(`${BASE_URL}/api/outbreaks/bulk`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                    body: JSON.stringify(bulkData)
                });

                if (response.ok) {
                    const result = await response.json();
                    addToast('success', `✅ นำเข้าจุดระบาดสำเร็จ ${result.count} รายการ`);
                    // รีโหลดข้อมูลใหม่
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
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('vet_user', JSON.stringify(userData));
        setIsLoginModalOpen(false);
    };

    const handleLogout = () => {
        if(window.confirm("ยืนยันการออกจากระบบ?")) {
            setUser(null);
            localStorage.removeItem('vet_user');
        }
    };

    const canEdit = user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'MagaAdmin') && !isReadOnlyMode;
const isSuperAdmin = user && (user.role === 'superadmin' || user.role === 'MagaAdmin');
const isMagaAdmin = user && user.role === 'MagaAdmin';

// --- เปลี่ยนการเก็บ tabsConfig จาก localStorage เป็นการใช้ State ธรรมดา ---
    const [tabsConfig, setTabsConfig] = useState({ overview: true, outbreak: true, database: true });

    // ดึงค่า Config แท็บจาก Server ตอนโหลดหน้าเว็บครั้งแรก
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
    }, [BASE_URL]);

// --- ฟังก์ชัน toggleTab ที่ถูกต้องสมบูรณ์ ---
    const toggleTab = async (tabName) => {
        const previousConfig = { ...tabsConfig }; // เก็บค่าเก่าไว้เผื่อพัง
        const newConfig = { ...tabsConfig, [tabName]: !tabsConfig[tabName] };
        
        setTabsConfig(newConfig); // อัปเดตหน้าจอทันทีให้ดูลื่นไหล

        try {
            const res = await fetch(`${BASE_URL}/api/settings/tabs`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${user?.token}` 
                },
                body: JSON.stringify({ tabsConfig: newConfig })
            });
            
            if (!res.ok) throw new Error('Failed to update');
        } catch (error) {
            console.error("Update Tabs Config Error", error);
            addToast('error', 'ไม่สามารถบันทึกการตั้งค่าแท็บได้');
            setTabsConfig(previousConfig); // Rollback กลับไปค่าเดิมหากบันทึกไม่สำเร็จ
        }
    };

    // จัดการการเปลี่ยนหน้าอัตโนมัติ สำหรับคนที่ไม่ได้ล็อคอิน
    useEffect(() => {
        if (!user && !tabsConfig[activeTab]) {
            if (tabsConfig.overview) setActiveTab('overview');
            else if (tabsConfig.outbreak) setActiveTab('outbreak');
            else if (tabsConfig.database) setActiveTab('database');
        }
    }, [user, tabsConfig, activeTab]);

    // --- 3. DATA FETCHING ---

    const fetchData = useCallback(async () => {
        try {
            setIsInitialLoading(true);
            const response = await fetch(API_URL);
            const data = await response.json();
            setReportData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Fetch Reports Error:", error);
            setReportData([]);
        } finally {
        setIsInitialLoading(false);
        }
    }, [API_URL]);

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
        return () => { socket.disconnect(); };
    }, [BASE_URL, fetchData]);

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
    }, [BASE_URL]);

    const handleSaveMeeting = async (meetingData) => {
        try {
            const method = meetingData._id ? 'PUT' : 'POST'; // เช็คว่ามี ID ไหม
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

const combinedEvents = useMemo(() => [
    ...dispatchEventsOnly,
    ...meetingEventsOnly
], [dispatchEventsOnly, meetingEventsOnly]);

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
    }, [BASE_URL]);

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
            alert("⛔️ ขออภัย เฉพาะ SuperAdmin เท่านั้นที่มีสิทธิ์ล้างข้อมูลทั้งหมด");
            return;
        }
        setIsConfirmPasswordOpen(true);
    };

    const executeClearAllData = async (passwordInput) => {
        try {
            const response = await fetch(API_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify({ password: passwordInput })
            });
            const result = await response.json();
            if (response.ok) {
                setReportData([]);
                setIsConfirmPasswordOpen(false);
                alert(`✅ ${result.message}`);
            } else {
                alert(`❌ เกิดข้อผิดพลาด: ${result.message}`);
            }
        } catch (error) { alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ Server"); }
    };

    const handleGenerateMockData = () => {
        if (!window.confirm("⚠️ ยืนยันการจำลองข้อมูล 500 เคส?\n(ข้อมูลนี้จะแสดงผลทันทีแต่ 'ยังไม่ถูกบันทึก' ลงฐานข้อมูลจริง)")) return;
        const newMockData = [];
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const randCoord = () => ({ lat: 13.6 + Math.random() * 0.35, long: 100.35 + Math.random() * 0.4 });

        for (let i = 0; i < 500; i++) {
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
        alert(`✅ สร้างข้อมูลจำลอง 500 เคสเรียบร้อยแล้ว!\n(ข้อมูลจะหายไปเมื่อรีเฟรชหน้าเว็บ)`);
    };

    const handleRestoreSuccess = () => { window.location.reload(); };

    // --- 5. CALCULATIONS ---

    const availableYears = useMemo(() => {
        if (!Array.isArray(reportData)) return [];
        return [...new Set(reportData.map(item => item.date ? item.date.split('-')[0] : null).filter(y => y))].sort().reverse();
    }, [reportData]);

    // แทนที่ const filteredData = useMemo(() => { ... }) เดิมทั้งหมดด้วยโค้ดนี้
const filteredData = useMemo(() => {
    if (!Array.isArray(reportData)) return [];

    // 1. นำการคำนวณคงที่ออกมานอก Loop 
    const lowerSearch = searchTerm ? String(searchTerm).toLowerCase().trim() : '';
    const isYearAll = selectedYear === 'ทั้งหมด';
    const isMonthAll = selectedMonth === 'ทั้งหมด';
    const isUnitAll = selectedUnit === 'ทั้งหมด';
    const isDistrictAll = selectedDistrict === 'ทั้งหมด';

    return reportData.filter(item => {
        try {
            if (!item) return false;

            // 2. Date Logic (เช็คเงื่อนไขที่ใช้เวลาประมวลผลน้อยที่สุดก่อน ถ้าตกหล่นให้ return false ทันที)
            if (searchDate) { 
                if (item.date !== searchDate) return false; 
            } else if (!isYearAll || !isMonthAll) {
                if (!item.date) return false;
                const dateParts = String(item.date).split('-');
                if (dateParts.length < 2) return false;
                
                if (!isYearAll && dateParts[0] !== String(selectedYear)) return false;
                if (!isMonthAll && parseInt(dateParts[1], 10) !== parseInt(selectedMonth, 10)) return false;
            }

            // 3. Unit & District Filter
            if (!isUnitAll && item.unit !== selectedUnit) return false;
            if (!isDistrictAll && (!item.district || item.district.trim() !== selectedDistrict)) return false;

            // 4. Text Search Logic (เช็คเป็นอันดับสุดท้าย เพราะ .toLowerCase() ใน Loop กินทรัพยากรมากที่สุด)
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
}, [reportData, selectedYear, selectedMonth, selectedUnit, selectedDistrict, searchTerm, searchDate]);

    const dispatchStats = useMemo(() => {
        // เพิ่ม vaccine_microchip และเอา microchip เดิมออก
        const initStats = () => ({ count: 0, sterilization: 0, vaccine_microchip: 0, governor: 0, cat_cage: 0, other: 0 });

        // 1. Monthly Data
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
        const d = new Date();
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

        // 2. Daily Data
        const dayMap = {};
        filteredData.forEach(item => {
            const day = item.date;
            if (!dayMap[day]) dayMap[day] = initStats();
            
            dayMap[day].count += 1;
            
            const uKey = getUnitKey(item.unit);
            if (dayMap[day][uKey] !== undefined) {
                 dayMap[day][uKey] += 1;
            } else {
                 dayMap[day]['other'] += 1; // เพิ่ม else ป้องกันข้อมูลอื่นๆ หายในกราฟรายวัน
            }
        });

        const dailyData = [];
        for (let i = 13 + freqDailyOffset; i >= freqDailyOffset; i--) {
        const d = new Date();
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
}, [filteredData, freqMonthlyOffset, freqDailyOffset]);

    const mapDisplayData = useMemo(() => {
        if (!Array.isArray(filteredData)) return [];
        
        return filteredData.filter(d => 
            d.lat !== undefined && d.lat !== null && d.lat !== '' &&
            d.long !== undefined && d.long !== null && d.long !== '' &&
            !isNaN(parseFloat(d.lat)) && 
            !isNaN(parseFloat(d.long)) &&
            (parseFloat(d.lat) !== 0 || parseFloat(d.long) !== 0)
        );
    }, [filteredData]);

const totals = useMemo(() => filteredData.reduce((acc, curr) => {
    const d = curr.details?.dog || {};
    const c = curr.details?.cat || {};
    const toNum = (val) => parseInt(val, 10) || 0;

    return {
        vaccine: acc.vaccine + toNum(curr.stats?.vaccine), 
        sterilize: acc.sterilize + toNum(curr.stats?.sterilize), 
        register: acc.register + toNum(curr.stats?.register),
        microchip: acc.microchip + toNum(curr.stats?.microchip), 
        medical: acc.medical + toNum(curr.stats?.medical),
        
        dog: {
            vaccine: acc.dog.vaccine + toNum(d.vaccine),
            sterilize: acc.dog.sterilize + toNum(d.maleSterilize) + toNum(d.femaleSterilize),
            register: acc.dog.register + toNum(d.register),
            microchip: acc.dog.microchip + toNum(d.microchip),
            medical: acc.dog.medical + toNum(d.medical),
        },
        cat: {
            vaccine: acc.cat.vaccine + toNum(c.vaccine),
            sterilize: acc.cat.sterilize + toNum(c.maleSterilize) + toNum(c.femaleSterilize),
            register: acc.cat.register + toNum(c.register),
            microchip: acc.cat.microchip + toNum(c.microchip),
            medical: acc.cat.medical + toNum(c.medical),
        }
    };
}, { 
    vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0,
    dog: { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 },
    cat: { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 }
}), [filteredData]);

    const unitStats = useMemo(() => {
        const grouped = filteredData.reduce((acc, curr) => {
            if (!acc[curr.unit]) {
                acc[curr.unit] = { 
                    name: curr.unit, 
                    count: 0, 
                    vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0,
                    dog: 0, 
                    cat: 0 
                };
            }
            const toNum = (val) => parseInt(val, 10) || 0; 

            acc[curr.unit].count += 1;

            acc[curr.unit].vaccine += toNum(curr.stats?.vaccine);
            acc[curr.unit].sterilize += toNum(curr.stats?.sterilize);
            acc[curr.unit].register += toNum(curr.stats?.register);
            acc[curr.unit].microchip += toNum(curr.stats?.microchip);
            acc[curr.unit].medical += toNum(curr.stats?.medical);
            
            acc[curr.unit].total += (
                toNum(curr.stats?.vaccine) + 
                toNum(curr.stats?.sterilize) + 
                toNum(curr.stats?.register) + 
                toNum(curr.stats?.microchip) + 
                toNum(curr.stats?.medical)
            );
            
            const d = curr.details?.dog || {};
            const c = curr.details?.cat || {};

            acc[curr.unit].dog += (
                toNum(d.vaccine) + 
                toNum(d.maleSterilize) + 
                toNum(d.femaleSterilize) + 
                toNum(d.microchip) + 
                toNum(d.register) + 
                toNum(d.medical)
            );
            
            acc[curr.unit].cat += (
                toNum(c.vaccine) + 
                toNum(c.maleSterilize) + 
                toNum(c.femaleSterilize) + 
                toNum(c.microchip) + 
                toNum(c.register) + 
                toNum(c.medical)
            );

            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => b.total - a.total);
    }, [filteredData]);

    const trendData = useMemo(() => {
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
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const monthStr = d.toISOString().substring(0, 7);
        last10Months.push(dataMap[monthStr] || { name: monthStr, count: 0, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 });
    }
    return last10Months;
}, [filteredData, trendOffset]);

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

    const rankingFilteredData = useMemo(() => {
        if (!Array.isArray(reportData)) return [];
        
        return reportData.filter(item => {
            if (!item || !item.date) return false;

            try {
                const dateParts = item.date.split('-');
                if (dateParts.length < 2) return false;

                const [itemYear, itemMonth] = dateParts;
                return (rankingYear === 'ทั้งหมด' || itemYear === rankingYear) && 
                       (rankingMonth === 'ทั้งหมด' || parseInt(itemMonth) === parseInt(rankingMonth));
            } catch (e) {
                return false;
            }
        });
    }, [reportData, rankingYear, rankingMonth]);

    const rankingNestedStats = useMemo(() => {
    const grouped = rankingFilteredData.reduce((acc, curr) => {
        const unitName = curr.unit ? curr.unit : 'ไม่ระบุ';
        const districtName = curr.district ? curr.district.trim() : 'ไม่ระบุ';
        const toNum = (val) => parseInt(val, 10) || 0;
        
        const vaccine = toNum(curr.stats?.vaccine);
        const sterilize = toNum(curr.stats?.sterilize);
        const register = toNum(curr.stats?.register);
        const microchip = toNum(curr.stats?.microchip);
        const medical = toNum(curr.stats?.medical);
        const workTotal = vaccine + sterilize + register + microchip + medical;

        if (!acc[unitName]) {
            acc[unitName] = { 
                name: unitName, totalWork: 0, count: 0, districts: {}, 
                stats: { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 }
            };
        }
        
        acc[unitName].totalWork += workTotal;
        acc[unitName].count += 1;
        acc[unitName].stats.vaccine += vaccine;
        acc[unitName].stats.sterilize += sterilize;
        acc[unitName].stats.register += register;
        acc[unitName].stats.microchip += microchip;
        acc[unitName].stats.medical += medical;

        if (!acc[unitName].districts[districtName]) {
            acc[unitName].districts[districtName] = {
                total: 0,
                stats: { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 }
            };
        }
        acc[unitName].districts[districtName].total += workTotal;
        acc[unitName].districts[districtName].stats.vaccine += vaccine;
        acc[unitName].districts[districtName].stats.sterilize += sterilize;
        acc[unitName].districts[districtName].stats.register += register;
        acc[unitName].districts[districtName].stats.microchip += microchip;
        acc[unitName].districts[districtName].stats.medical += medical;

        return acc;
    }, {});

    return Object.values(grouped)
        .sort((a, b) => b.totalWork - a.totalWork)
        .slice(0, 5)
        .map(unit => {
            const sortedDistricts = Object.entries(unit.districts)
                .map(([dName, dData]) => ({ name: dName, total: dData.total, stats: dData.stats }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);
            return { ...unit, topDistricts: sortedDistricts };
        });
}, [rankingFilteredData]);

const rankingUnitStats = useMemo(() => {
    const grouped = rankingFilteredData.reduce((acc, curr) => {
        const unitName = curr.unit ? curr.unit : 'ไม่ระบุ';
        const toNum = (val) => parseInt(val, 10) || 0;

        if (!acc[unitName]) {
            acc[unitName] = { 
                name: unitName, count: 0, 
                vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 
            };
        }
        
        acc[unitName].count += 1; 

        acc[unitName].vaccine += toNum(curr.stats?.vaccine); 
        acc[unitName].sterilize += toNum(curr.stats?.sterilize); 
        acc[unitName].register += toNum(curr.stats?.register);
        acc[unitName].microchip += toNum(curr.stats?.microchip); 
        acc[unitName].medical += toNum(curr.stats?.medical);
        acc[unitName].total += (toNum(curr.stats?.vaccine) + toNum(curr.stats?.sterilize) + toNum(curr.stats?.register) + toNum(curr.stats?.microchip) + toNum(curr.stats?.medical));
        
        return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.count - a.count || b.total - a.total);
}, [rankingFilteredData]);

const rankingDistrictStats = useMemo(() => {
    const grouped = rankingFilteredData.reduce((acc, curr) => {
        const districtName = curr.district ? curr.district.trim() : 'ไม่ระบุ';
        const toNum = (val) => parseInt(val, 10) || 0;

        if (!acc[districtName]) acc[districtName] = { name: districtName, total: 0 };
        
        acc[districtName].total += (toNum(curr.stats?.vaccine) + toNum(curr.stats?.sterilize) + toNum(curr.stats?.register) + toNum(curr.stats?.microchip) + toNum(curr.stats?.medical));
        return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.total - a.total).slice(0, 5);
}, [rankingFilteredData]);

const parseCSVDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
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
    return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
};

    // CSV Import Logic
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
                            lat = parseFloat(coords[0]) || 0;
                            long = parseFloat(coords[1]) || 0;
                        } else {
                            lat = parseFloat(cleanCols[5]) || 0;
                        }
                    }

                    // Mapping ข้อมูล
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
                    const response = await fetch(`${BASE_URL}/api/reports/bulk`, { // เรียก endpoint ใหม่
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

    const openAddModal = () => { setEditingItem(null); setIsModalOpen(true); };
    const openEditModal = (item) => { setEditingItem(item); setIsModalOpen(true); };

    const handleOpenCsvOutbreak = () => {
        setCsvMode('outbreak');
        setIsCsvModalOpen(true);
    };

    const handleOpenCsvReport = () => {
        setCsvMode('report');
        setIsCsvModalOpen(true);
    };

    // [เพิ่ม] Auto Scroll to top เมื่อเปลี่ยน Tab หรือเปิดหน้าใหม่
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    // --- 6. RENDER UI ---

return (
    // เปลี่ยน flex โครงสร้างหลักให้เป็นหน้าจอแบบ Full Height (h-screen)
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 overflow-hidden">
        <style>{`
            /* สไตล์ CSS ของเดิมคงไว้เหมือนเดิมครับ */
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

        {/* --- ส่วน Modal ต่างๆ (คงเดิม) --- */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <Suspense fallback={<div className="hidden">Loading...</div>}>
            <AddDataModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddNewData} onUpdate={handleUpdateData} initialData={editingItem} onToast={addToast} />
            <AddOutbreakModal isOpen={isOutbreakModalOpen} onClose={() => setIsOutbreakModalOpen(false)} onSave={handleAddOutbreak} onUpdate={handleUpdateOutbreak} initialData={editingOutbreak} onToast={addToast} />
        </Suspense>
        <CsvActionModal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} onFileChange={csvMode === 'outbreak' ? handleOutbreakFileUpload : handleFileUpload} onExport={() => { csvMode === 'outbreak' ? exportOutbreaksToCSV(outbreakData) : exportToCSV(filteredData); }} />
        <BackupSystemModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} onRestoreSuccess={handleRestoreSuccess} token={user?.token} apiBaseUrl={BASE_URL} />
        <ImagePreviewModal imageUrl={viewImage} onClose={() => setViewImage(null)} />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} apiBaseUrl={BASE_URL} onToast={addToast} />
        <UserManagementModal isOpen={isUserMgmtOpen} onClose={() => setIsUserMgmtOpen(false)} token={user?.token} apiBaseUrl={BASE_URL} onToast={addToast} />
        <PasswordConfirmModal isOpen={isConfirmPasswordOpen} onClose={() => setIsConfirmPasswordOpen(false)} onConfirm={executeClearAllData} title="ล้างข้อมูลทั้งหมด?" message="การกระทำนี้ไม่สามารถกู้คืนได้ กรุณายืนยันตัวตน" />
        <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} apiBaseUrl={BASE_URL} token={user?.token} onToast={addToast} />
        <ActivityLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} token={user?.token} apiBaseUrl={BASE_URL} />
        <DispatchModal isOpen={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} onToast={addToast} onSave={handleSaveDispatchEvent} onDelete={handleDeleteDispatch} initialData={viewingDispatch} />
        <DispatchCalendarDashboard isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} events={dispatchEventsOnly} onOpenForm={() => { setViewingDispatch(null); setIsDispatchModalOpen(true); }} onEventClick={(evt) => { setViewingDispatch(evt.originalData); setIsDispatchModalOpen(true); }} />
        <MeetingCalendarDashboard isOpen={isMeetingCalendarOpen} onClose={() => setIsMeetingCalendarOpen(false)} events={meetingEventsOnly} onOpenForm={() => { setViewingMeeting(null); setIsMeetingModalOpen(true); }} onEventClick={handleCalendarEventClick} />
        <MeetingModal isOpen={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)} onSave={handleSaveMeeting} onDelete={handleDeleteMeeting} initialData={viewingMeeting} onToast={addToast} />
        <MeetingListModal isOpen={isMeetingListOpen} onClose={() => setIsMeetingListOpen(false)} meetings={meetings} onEdit={(m) => { setViewingMeeting(m); setIsMeetingListOpen(false); setIsMeetingModalOpen(true); }} />

        {/* 1. แทนที่ Header + aside เดิมด้วยคอมโพเนนต์ Sidebar ใหม่ */}
        <Sidebar 
            user={user} isSuperAdmin={isSuperAdmin} canEdit={canEdit} 
            activeTab={activeTab} setActiveTab={setActiveTab}
            isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed}
            isSystemMenuOpen={isSystemMenuOpen} setIsSystemMenuOpen={setIsSystemMenuOpen}
            onLogin={() => setIsLoginModalOpen(true)} onLogout={handleLogout} onChangePassword={() => setIsChangePasswordOpen(true)}
            onOpenLog={() => setIsLogModalOpen(true)} onOpenUserMgmt={() => setIsUserMgmtOpen(true)} onOpenBackup={() => setIsBackupModalOpen(true)}
            onOpenCsvOutbreak={handleOpenCsvOutbreak} onOpenCsvReport={handleOpenCsvReport} onGenerateMock={handleGenerateMockData}
            onOpenMeetingList={() => setIsMeetingListOpen(true)} onOpenCalendar={() => setIsCalendarOpen(true)} onOpenMeetingCalendar={() => setIsMeetingCalendarOpen(true)}
            onOpenMeetingModal={() => setIsMeetingModalOpen(true)} onOpenAddOutbreak={openAddOutbreakModal} onOpenAddData={openAddModal}
            isMagaAdmin={isMagaAdmin}
            tabsConfig={tabsConfig} toggleTab={toggleTab}
        />

        {/* 2. Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0">
            
            {/* --- Mobile Topbar (แสดงเฉพาะมือถือ เพื่อเป็น Header ด้านบน) --- */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 z-30 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <img src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-900/5" alt="Logo" />
                    <h1 className="text-sm font-bold text-slate-800">ระบบรายงานสัตวแพทย์</h1>
                </div>
                {user ? (
                    <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"><LogOut className="w-5 h-5"/></button>
                ) : (
                    <button onClick={() => setIsLoginModalOpen(true)} className="p-2 text-indigo-600 hover:text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"><Unlock className="w-5 h-5"/></button>
                )}
            </div>

            {/* --- พื้นที่ Content หลัก (Scroll ได้เฉพาะส่วนนี้) --- */}
            <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-y-auto pb-24 md:pb-8 custom-scrollbar">
                
                {/* แถบกรองข้อมูล (Filters) */}
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

                        {(searchTerm || searchDate || selectedYear !== 'ทั้งหมด' || selectedMonth !== 'ทั้งหมด' || selectedUnit !== 'ทั้งหมด' || selectedDistrict !== 'ทั้งหมด') && (
                            <button 
                                onClick={() => { setSearchTerm(''); setSelectedYear('ทั้งหมด'); setSelectedMonth('ทั้งหมด'); setSelectedUnit('ทั้งหมด'); setSelectedDistrict('ทั้งหมด'); setSearchDate(''); }} 
                                className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-bold border border-transparent hover:border-rose-100"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> ล้างตัวกรองทั้งหมด
                            </button>
                        )}
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

                {/* --- เนื้อหา Tab กราฟและตาราง (คงเดิม) --- */}
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
                                    <StatisticsCharts 
                                        trendData={trendData} 
                                        unitStats={unitStats} 
                                        dispatchStats={dispatchStats}
                                        trendOffset={trendOffset}
                                        setTrendOffset={setTrendOffset}
                                        freqDailyOffset={freqDailyOffset}
                                        setFreqDailyOffset={setFreqDailyOffset}
                                        freqMonthlyOffset={freqMonthlyOffset}
                                        setFreqMonthlyOffset={setFreqMonthlyOffset}/>
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                            <RankingSection rankingYear={rankingYear} setRankingYear={setRankingYear} rankingMonth={rankingMonth} setRankingMonth={setRankingMonth} availableYears={availableYears} thaiMonths={THAI_MONTHS} rankingUnitStats={rankingUnitStats} rankingNestedStats={rankingNestedStats} />
                                                <div className="lg:col-span-7 bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-[56rem] relative z-0">
                                                    <LeafletMap data={mapDisplayData} />
                                                </div>
                                        </div>
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
                        </>
                    )}
                </Suspense>
            </main>
        </div>

        {/* 3. Mobile Bottom Nav (มือถือ) */}
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
        </div>
    </div>
);
}