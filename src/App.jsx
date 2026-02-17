import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import AddDataModal from './components/modals/AddDataModal';
import RabiesOutbreakSection from './components/dashboard/RabiesOutbreakSection';
import MainDataTable from './components/dashboard/MainDataTable';
import { exportToCSV, exportOutbreaksToCSV } from './utils/csvUtils';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import Header from './components/layout/Header';
import StatisticsCharts from './components/dashboard/StatisticsCharts.jsx';
import RankingSection from './components/dashboard/RankingSection';
import LeafletMap from './components/modals/LeafletMap';
import LoginModal from './components/modals/LoginModal';
import AddOutbreakModal from './components/modals/AddOutbreakModal';
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

// 4. ToastContainer
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

// 5. PasswordConfirmModal
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

// 8. ImagePreviewModal
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

// 10. CsvActionModal
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

// 11. BackupSystemModal
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
        
        // เช็ค key หลัก
        if (['sterilization', 'microchip', 'governor', 'cat_cage', 'other'].includes(lower)) return lower;
        
        // เช็คคำใกล้เคียงภาษาไทย/อังกฤษ
        if (lower.includes('สัตวแพทย์') || lower.includes('vet') || lower.includes('steriliz')) return 'sterilization';
        if (lower.includes('วัคซีน') || lower.includes('ไมโครชิป') || lower.includes('microchip') || lower.includes('vaccine')) return 'microchip';
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

    // Legacy View Mode (optional)
    const isReadOnlyMode = new URLSearchParams(window.location.search).get('mode') === 'view';

    // Constants
    const BASE_URL = 'https://veterinarydashboard-hwho.onrender.com';
    const API_URL = `${BASE_URL}/api/reports`;
    const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

    // Confirm Password
    const [isConfirmPasswordOpen, setIsConfirmPasswordOpen] = useState(false);

    const [isMeetingCalendarOpen, setIsMeetingCalendarOpen] = useState(false);

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

    const dispatchEventsOnly = dispatchEvents.map(d => ({
        ...d,
        type: 'dispatch',
        originalData: d
    }));

    const meetingEventsOnly = meetings.map(m => ({
        date: m.date,
        time: m.startTime,
        location: m.title, // ใช้ Title เป็น Location ในปฏิทินเพื่อให้เห็นชื่อประชุมชัดๆ
        team: 'Online/Room',
        note: m.link,
        type: 'meeting',
        _id: m._id,
        originalData: m
    }));

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

    const canEdit = user && (user.role === 'admin' || user.role === 'superadmin') && !isReadOnlyMode;
    const isSuperAdmin = user && user.role === 'superadmin';

    // --- 3. DATA FETCHING ---

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            setReportData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Fetch Reports Error:", error);
            setReportData([]);
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
                case 'MEETING_UPDATED': // เพิ่ม case นี้
                    setMeetings(prev => prev.map(m => m._id === payload.data._id ? payload.data : m));
                    addToast('info', `📝 แก้ไขนัดหมายประชุม: ${payload.data.title}`);
                    break;
                case 'REPORTS_IMPORTED': // เพิ่ม case นี้
                    fetchData(); // โหลดข้อมูลใหม่ทั้งหมดทีเดียว
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

    // --- เพิ่มฟังก์ชัน Save Meeting ---
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
                // Socket จะ update state เอง หรือถ้าไม่มี socket ให้ reload
                if(meetingData._id) { // Manual update state for instant feedback
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

    // เพิ่ม Function ลบการประชุม
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

    const combinedEvents = [
        ...dispatchEvents.map(d => ({
        ...d,
        type: 'dispatch', // ระบุประเภท
        originalData: d
    })),
        ...meetings.map(m => ({
            date: m.date,
            time: m.startTime,
            location: `[ประชุม] ${m.title}`,
            team: 'Online/Room',
            note: m.link,
            type: 'meeting',
            _id: m._id,
            originalData: m // เก็บข้อมูลดิบไว้ส่งให้ Modal
        }))
    ];

    const handleCalendarEventClick = (evt) => {
        if (evt.type === 'meeting') {
            setViewingMeeting(evt.originalData);
            setIsMeetingModalOpen(true);
        } else {
            // กรณีเป็น Dispatch (แผนงานออกหน่วย)
            setViewingDispatch(evt.originalData); // ส่งข้อมูลเดิมไปที่ Modal
            setIsDispatchModalOpen(true);         // เปิด Modal
            
            // [ลบออก] alert(`รายละเอียดงาน: ${evt.location}\nทีม: ${evt.team}`); 
            // ลบ alert เพื่อให้ UI เปิดหน้าต่างแก้ไขทันที ดูเป็นธรรมชาติกว่า
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
                    district: newRecord.district, subdistrict: newRecord.subdistrict, unit: newRecord.unit, imageUrl: newRecord.imageUrl,
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

    // 1. ประกาศ availableYears
    const availableYears = useMemo(() => {
        if (!Array.isArray(reportData)) return [];
        return [...new Set(reportData.map(item => item.date ? item.date.split('-')[0] : null).filter(y => y))].sort().reverse();
    }, [reportData]);

    const filteredData = useMemo(() => {
        if (!Array.isArray(reportData)) return [];

        return reportData.filter(item => {
            try {
                // Safety Check 1: ข้ามถ้ารายการนี้เป็น null
                if (!item) return false;

                // --- เตรียมข้อมูล (Handle Null/Undefined ป้องกันจอขาว) ---
                const itemLocation = item.location ? String(item.location).toLowerCase() : '';
                
                // ✅ จุดสำคัญ: ถ้าไม่มีเขต ให้เป็นค่าว่างไว้ อย่าให้ undefined จนพัง
                const itemDistrict = item.district ? String(item.district).trim() : 'ไม่ระบุ'; 
                
                const itemSubdistrict = item.subdistrict ? String(item.subdistrict).toLowerCase() : '';
                const itemUnit = item.unit ? String(item.unit) : '';

                // --- 1. Text Search Logic ---
                const lowerSearch = searchTerm ? String(searchTerm).toLowerCase().trim() : '';
                const textMatch = !lowerSearch || 
                    itemLocation.includes(lowerSearch) || 
                    itemDistrict.toLowerCase().includes(lowerSearch) || 
                    itemSubdistrict.includes(lowerSearch);

                // --- 2. Date Logic ---
                let dateMatch = true;

                if (searchDate) { 
                    // ถ้ามีการระบุวันที่เป๊ะๆ
                    dateMatch = item.date === searchDate; 
                } else {
                    // ถ้าไม่มีวันที่ (item.date) ให้ถือว่าไม่ผ่านกรอง ยกเว้นว่าเป็นข้อมูลเก่าที่ยอมรับได้
                    // (แต่เพื่อความชัวร์ของกราฟ ควรมีวันที่)
                    if (!item.date) {
                        // ถ้าปีและเดือนเลือก "ทั้งหมด" เราอาจจะยอมให้ผ่านได้ถ้าต้องการ
                        // แต่ปกติกราฟต้องใช้วันที่ ขอ return false ถ้าไม่มีวันที่
                        return false; 
                    }

                    const dateParts = String(item.date).split('-');
                    if (dateParts.length >= 2) {
                        const [itemYear, itemMonth] = dateParts;
                        
                        // ✅ Logic อิสระ:
                        // ถ้าเลือก Year = 'ทั้งหมด' -> yearMatch เป็น true เสมอ
                        // ถ้าเลือก Month = 'ทั้งหมด' -> monthMatch เป็น true เสมอ
                        const yearMatch = selectedYear === 'ทั้งหมด' || itemYear === String(selectedYear);
                        const monthMatch = selectedMonth === 'ทั้งหมด' || parseInt(itemMonth) === parseInt(selectedMonth);
                        
                        dateMatch = yearMatch && monthMatch;
                    } else {
                        dateMatch = false; // รูปแบบวันที่ผิด
                    }
                }

                // --- 3. Unit Filter ---
                const unitMatch = selectedUnit === 'ทั้งหมด' || itemUnit === selectedUnit;
                
                // --- 4. District Filter (ตัวกรองเขต) ---
                // ✅ Logic: ถ้า selectedDistrict เป็น 'ทั้งหมด' ให้ผ่าน
                // ถ้าเลือกเขตเฉพาะเจาะจง ก็เช็คว่าตรงกันไหม (โดยไม่สนว่าปีไหน ถ้าปีเลือกทั้งหมดไว้)
                const districtMatch = selectedDistrict === 'ทั้งหมด' || itemDistrict === selectedDistrict;

                // นำผลลัพธ์ทั้งหมดมา AND กัน
                return textMatch && dateMatch && unitMatch && districtMatch;

            } catch (error) {
                // ✅ Catch Error: ถ้าข้อมูลแถวไหนพัง ให้ข้ามไปเลย ไม่ต้องทำหน้าจอขาว
                console.warn("Skipping invalid item causing filter error:", item, error);
                return false; 
            }
        });
    }, [reportData, selectedYear, selectedMonth, selectedUnit, selectedDistrict, searchTerm, searchDate]);

    const dispatchStats = useMemo(() => {
        // Helper สร้าง object เริ่มต้น
        const initStats = () => ({ count: 0, sterilization: 0, microchip: 0, governor: 0, cat_cage: 0, other: 0 });

        // 1. Monthly Data
        const monthMap = {};
        filteredData.forEach(item => {
            const m = item.date.substring(0, 7);
            if (!monthMap[m]) monthMap[m] = initStats();
            
            monthMap[m].count += 1; // นับจำนวนงานรวม
            
            const uKey = getUnitKey(item.unit); // เรียกฟังก์ชันที่เพิ่มเข้ามา
            if (monthMap[m][uKey] !== undefined) {
                monthMap[m][uKey] += 1;
            } else {
                monthMap[m]['other'] += 1;
            }
        });

        const monthlyData = [];
        for (let i = 9; i >= 0; i--) {
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
            }
        });

        const dailyData = [];
        for (let i = 13; i >= 0; i--) {
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
    }, [filteredData]);

    const mapDisplayData = useMemo(() => {
        if (!Array.isArray(filteredData)) return [];
        
        return filteredData.filter(d => 
            d.lat !== undefined && d.lat !== null && d.lat !== '' &&
            d.long !== undefined && d.long !== null && d.long !== '' &&
            !isNaN(parseFloat(d.lat)) && 
            !isNaN(parseFloat(d.long)) &&
            // เพิ่มการเช็คว่า lat/long ไม่อยู่ในจุดที่เป็น 0,0 (กลางทะเล) ถ้าไม่ต้องการแสดง
            (parseFloat(d.lat) !== 0 || parseFloat(d.long) !== 0)
        );
    }, [filteredData]);

const totals = useMemo(() => filteredData.reduce((acc, curr) => {
    // ใช้ ?. เพื่อเช็คว่ามี stats หรือไม่ ถ้าไม่มีให้ใช้ 0 แทน
    return {
        vaccine: acc.vaccine + (curr.stats?.vaccine || 0), 
        sterilize: acc.sterilize + (curr.stats?.sterilize || 0), 
        register: acc.register + (curr.stats?.register || 0),
        microchip: acc.microchip + (curr.stats?.microchip || 0), 
        medical: acc.medical + (curr.stats?.medical || 0),
    };
}, { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 }), [filteredData]);

    const unitStats = useMemo(() => {
        const grouped = filteredData.reduce((acc, curr) => {
            if (!acc[curr.unit]) {
                acc[curr.unit] = { 
                    name: curr.unit, 
                    count: 0, // [เพิ่ม] ตัวแปรเก็บจำนวนครั้งที่ออกหน่วย
                    vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 
                };
            }
            
            acc[curr.unit].count += 1; // [เพิ่ม] บวกจำนวนครั้งเพิ่มทีละ 1

            acc[curr.unit].vaccine += (curr.stats?.vaccine || 0); // ใส่ ?.
            acc[curr.unit].sterilize += (curr.stats.sterilize || 0); 
            acc[curr.unit].register += (curr.stats.register || 0);
            acc[curr.unit].microchip += (curr.stats.microchip || 0); 
            acc[curr.unit].medical += (curr.stats.medical || 0);
            acc[curr.unit].total += ((curr.stats.vaccine||0) + (curr.stats.sterilize||0) + (curr.stats.register||0) + (curr.stats.microchip||0) + (curr.stats.medical||0));
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => b.total - a.total);
    }, [filteredData]);

    const trendData = useMemo(() => {
        const dataMap = filteredData.reduce((acc, curr) => {
            const month = curr.date.substring(0, 7);
            
            // เพิ่ม count: 0 ในค่าเริ่มต้น
            if (!acc[month]) acc[month] = { name: month, count: 0, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 };
            
            acc[month].count += 1; // เพิ่มบรรทัดนี้เพื่อแก้ Error reading 'count'
            
            acc[month].vaccine += (curr.stats?.vaccine || 0);
            acc[month].sterilize += (curr.stats?.sterilize || 0);
            acc[month].register += (curr.stats?.register || 0);
            acc[month].microchip += (curr.stats?.microchip || 0);
            acc[month].medical += (curr.stats?.medical || 0);
            acc[month].total += ((curr.stats?.vaccine||0) + (curr.stats?.sterilize||0) + (curr.stats?.register||0) + (curr.stats?.microchip||0) + (curr.stats?.medical||0));
            return acc;
        }, {});

        const last10Months = [];
        for (let i = 9; i >= 0; i--) {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            const monthStr = d.toISOString().substring(0, 7);
            // ใส่ count: 0 ในค่า default ด้วย
            last10Months.push(dataMap[monthStr] || { name: monthStr, count: 0, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 });
        }
        return last10Months;
    }, [filteredData]);

    const availableOutbreakYears = useMemo(() => [...new Set(outbreakData.map(item => item.date ? item.date.split('-')[0] : null).filter(y => y !== null))].sort().reverse(), [outbreakData]);
    const filteredOutbreaks = useMemo(() => outbreakFilterYear === 'ทั้งหมด' ? outbreakData : outbreakData.filter(item => item.date && item.date.startsWith(outbreakFilterYear)), [outbreakData, outbreakFilterYear]);
    const outbreakStats = useMemo(() => {
        const total = filteredOutbreaks.length;
        const grouped = filteredOutbreaks.reduce((acc, curr) => { acc[curr.district] = (acc[curr.district] || 0) + 1; return acc; }, {});
        const topDistricts = Object.keys(grouped).map(key => ({ name: key, count: grouped[key] })).sort((a, b) => b.count - a.count).slice(0, 5);
        return { total, topDistricts };
    }, [filteredOutbreaks]);
    const outbreakYearlyTrend = useMemo(() => {
        const stats = outbreakData.reduce((acc, curr) => { if (!curr.date) return acc; const year = curr.date.split('-')[0]; acc[year] = (acc[year] || 0) + 1; return acc; }, {});
        return Object.keys(stats).sort().map(year => ({ name: year, count: stats[year] }));
    }, [outbreakData]);

    const rankingFilteredData = useMemo(() => {
        if (!Array.isArray(reportData)) return [];
        
        return reportData.filter(item => {
            // Safety Check: ถ้าไม่มี item หรือ ไม่มีวันที่ ห้าม split เด็ดขาด
            if (!item || !item.date) return false;

            try {
                const dateParts = item.date.split('-');
                if (dateParts.length < 2) return false; // Format ผิด

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
            
            // คำนวณยอดรวมของ Row นี้
            const vaccine = (curr.stats?.vaccine || 0);
            const sterilize = (curr.stats?.sterilize || 0);
            const register = (curr.stats?.register || 0);
            const microchip = (curr.stats?.microchip || 0);
            const medical = (curr.stats?.medical || 0);
            const workTotal = vaccine + sterilize + register + microchip + medical;

            if (!acc[unitName]) {
                acc[unitName] = { 
                    name: unitName, 
                    totalWork: 0, 
                    count: 0, 
                    districts: {},
                    // [เพิ่ม] เก็บยอดแยกประเภทบริการ
                    stats: {
                        vaccine: 0,
                        sterilize: 0,
                        register: 0,
                        microchip: 0,
                        medical: 0
                    }
                };
            }
            
            // บวกยอดรวม
            acc[unitName].totalWork += workTotal;
            acc[unitName].count += 1;

            // [เพิ่ม] บวกยอดแยกประเภทบริการ
            acc[unitName].stats.vaccine += vaccine;
            acc[unitName].stats.sterilize += sterilize;
            acc[unitName].stats.register += register;
            acc[unitName].stats.microchip += microchip;
            acc[unitName].stats.medical += medical;

            if (!acc[unitName].districts[districtName]) {
                acc[unitName].districts[districtName] = 0;
            }
            acc[unitName].districts[districtName] += workTotal;
            return acc;
        }, {});

        return Object.values(grouped)
            .sort((a, b) => b.totalWork - a.totalWork)
            .slice(0, 5)
            .map(unit => {
                const sortedDistricts = Object.entries(unit.districts)
                    .map(([dName, dTotal]) => ({ name: dName, total: dTotal }))
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5);
                return { ...unit, topDistricts: sortedDistricts };
            });
    }, [rankingFilteredData]);

    // ✅ [แก้ไข] Ranking Unit Stats: เพิ่มการเช็ค null ของชื่อหน่วยงาน
    const rankingUnitStats = useMemo(() => {
        const grouped = rankingFilteredData.reduce((acc, curr) => {
            // ถ้าไม่มีชื่อหน่วยงาน ให้ตั้งเป็น 'ไม่ระบุ' เพื่อป้องกัน Key เป็น undefined
            const unitName = curr.unit ? curr.unit : 'ไม่ระบุ';

            if (!acc[unitName]) {
                acc[unitName] = { 
                    name: unitName, 
                    count: 0, 
                    vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 
                };
            }
            
            acc[unitName].count += 1; 

            // ใช้ Optional chaining (?.) ป้องกัน crash กรณีไม่มี object stats
            acc[unitName].vaccine += (curr.stats?.vaccine || 0); 
            acc[unitName].sterilize += (curr.stats?.sterilize || 0); 
            acc[unitName].register += (curr.stats?.register || 0);
            acc[unitName].microchip += (curr.stats?.microchip || 0); 
            acc[unitName].medical += (curr.stats?.medical || 0);
            acc[unitName].total += ((curr.stats?.vaccine||0) + (curr.stats?.sterilize||0) + (curr.stats?.register||0) + (curr.stats?.microchip||0) + (curr.stats?.medical||0));
            
            return acc;
        }, {});

        return Object.values(grouped).sort((a, b) => b.count - a.count || b.total - a.total);
    }, [rankingFilteredData]);
    

    const rankingDistrictStats = useMemo(() => {
        const grouped = rankingFilteredData.reduce((acc, curr) => {
            // ถ้าไม่มีชื่อเขต ให้ตั้งเป็น 'ไม่ระบุ'
            const districtName = curr.district ? curr.district.trim() : 'ไม่ระบุ';

            if (!acc[districtName]) acc[districtName] = { name: districtName, total: 0 };
            
            acc[districtName].total += ((curr.stats?.vaccine||0) + (curr.stats?.sterilize||0) + (curr.stats?.register||0) + (curr.stats?.microchip||0) + (curr.stats?.medical||0));
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => b.total - a.total).slice(0, 5);
    }, [rankingFilteredData]);

const parseCSVDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0]; // ถ้าไม่มีค่า ใช้วันปัจจุบัน
    
    // ถ้า Format ถูกต้องแล้ว (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    // ถ้าเป็น Format ไทย (DD/MM/YYYY)
    const parts = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (parts) {
        let day = parts[1].padStart(2, '0');
        let month = parts[2].padStart(2, '0');
        let year = parseInt(parts[3]);
        if (year > 2400) year -= 543; // แปลง พ.ศ. เป็น ค.ศ.
        return `${year}-${month}-${day}`;
    }
    
    // Fallback สุดท้าย
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

                const bulkData = []; // สร้าง Array เพื่อรอรับข้อมูลทั้งหมด
                let failCount = 0;
                
                // เริ่มที่ i = 1 เพื่อข้าม Header
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // ใช้ Regex แยก CSV (รองรับข้อมูลที่มี , อยู่ในเครื่องหมายคำพูด และช่องว่าง)
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
                        bulkData.push(newRecord); // เก็บลง Array แทนการยิง API ทันที
                    } else {
                        failCount++;
                    }
                }

                if (bulkData.length === 0) {
                    alert("ไม่พบข้อมูลที่ถูกต้องสำหรับนำเข้า");
                    return;
                }

                // ส่งข้อมูลทั้งหมดไปที่ API ครั้งเดียว
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

    // --- 6. RENDER UI ---

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 selection:bg-blue-100">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700;800&display=swap');
            
                body { font-family: 'Sarabun', sans-serif; }
            
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

                /* Map Popup Styling Override */
                .leaflet-popup-content-wrapper { padding: 0; overflow: hidden; border-radius: 12px; border: none; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }
                .leaflet-popup-content { margin: 0; width: 260px !important; }
                .leaflet-popup-tip { background: white; }
            
            /* Animation Utility */
            @keyframes pulse-ring {
                0% { transform: scale(0.33); }
                80%, 100% { opacity: 0; }
            }
            .danger-pulse::before {
                content: '';
                position: absolute; left: 0; top: 0; height: 100%; width: 100%;
                border-radius: 50%; background-color: #ef4444;
                animation: pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
            }
            `}</style>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <AddDataModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddNewData} onUpdate={handleUpdateData} initialData={editingItem} onToast={addToast} />
            <CsvActionModal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} onFileChange={csvMode === 'outbreak' ? handleOutbreakFileUpload : handleFileUpload} onExport={() => {
            if (csvMode === 'outbreak') {
                exportOutbreaksToCSV(outbreakData); // เรียกฟังก์ชัน Export ใหม่
            } else {
                exportToCSV(filteredData); // เรียกฟังก์ชัน Export เดิม
                }
            }} 
            />
            <BackupSystemModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} onRestoreSuccess={handleRestoreSuccess} token={user?.token} apiBaseUrl={BASE_URL} />
            <ImagePreviewModal imageUrl={viewImage} onClose={() => setViewImage(null)} />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} apiBaseUrl={BASE_URL} onToast={addToast} />
            <UserManagementModal isOpen={isUserMgmtOpen} onClose={() => setIsUserMgmtOpen(false)} token={user?.token} apiBaseUrl={BASE_URL} onToast={addToast} />
            <PasswordConfirmModal isOpen={isConfirmPasswordOpen} onClose={() => setIsConfirmPasswordOpen(false)} onConfirm={executeClearAllData} title="ล้างข้อมูลทั้งหมด?" message="การกระทำนี้ไม่สามารถกู้คืนได้ กรุณายืนยันตัวตน" />
            <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} apiBaseUrl={BASE_URL} token={user?.token} onToast={addToast} />
            <ActivityLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} token={user?.token} apiBaseUrl={BASE_URL} />
            <AddOutbreakModal isOpen={isOutbreakModalOpen} onClose={() => setIsOutbreakModalOpen(false)} onSave={handleAddOutbreak} onUpdate={handleUpdateOutbreak} initialData={editingOutbreak} onToast={addToast} />

            <DispatchModal 
                isOpen={isDispatchModalOpen} 
                onClose={() => setIsDispatchModalOpen(false)} 
                onToast={addToast}
                onSave={handleSaveDispatchEvent}
                onDelete={handleDeleteDispatch} // ส่ง function ลบ
                initialData={viewingDispatch}   // ส่งข้อมูลเดิม
            />
            <DispatchCalendarDashboard 
                isOpen={isCalendarOpen} 
                onClose={() => setIsCalendarOpen(false)}
                events={dispatchEventsOnly} // ส่งเฉพาะงานออกหน่วย
                onOpenForm={() => {
                    setViewingDispatch(null);
                    setIsDispatchModalOpen(true);
                }}
                onEventClick={(evt) => {
                    setViewingDispatch(evt.originalData);
                    setIsDispatchModalOpen(true);
                }} 
            />
            <MeetingCalendarDashboard 
                isOpen={isMeetingCalendarOpen}
                onClose={() => setIsMeetingCalendarOpen(false)}
                events={meetingEventsOnly}  // แก้ไข: เปลี่ยนจาก meetingEvents เป็น meetingEventsOnly
                onOpenForm={() => {         // แก้ไข: ใส่ Logic เปิด Modal สร้างใหม่
                    setViewingMeeting(null);
                    setIsMeetingModalOpen(true);
                }}
                onEventClick={handleCalendarEventClick} // แก้ไข: ใช้ฟังก์ชัน handleCalendarEventClick ที่ประกาศไว้ด้านบน
            />
            <MeetingModal 
                isOpen={isMeetingModalOpen} 
                onClose={() => setIsMeetingModalOpen(false)} 
                onSave={handleSaveMeeting}
                onDelete={handleDeleteMeeting} // ส่ง function ลบไป
                initialData={viewingMeeting}   // ส่งข้อมูลไปแสดง
                onToast={addToast}
            />

            <MeetingListModal
                isOpen={isMeetingListOpen}
                onClose={() => setIsMeetingListOpen(false)}
                meetings={meetings}
                onEdit={(m) => {
                    setViewingMeeting(m);
                    setIsMeetingListOpen(false); // ปิด List
                    setIsMeetingModalOpen(true); // เปิด Modal รายละเอียด
                }}
            />

            <Header 
                user={user}
                isSuperAdmin={isSuperAdmin}
                canEdit={canEdit}
                isSystemMenuOpen={isSystemMenuOpen}
                setIsSystemMenuOpen={setIsSystemMenuOpen}
                onLogin={() => setIsLoginModalOpen(true)}
                onLogout={handleLogout}
                onChangePassword={() => setIsChangePasswordOpen(true)}
                // System Menu
                onOpenLog={() => setIsLogModalOpen(true)}
                onOpenUserMgmt={() => setIsUserMgmtOpen(true)}
                onOpenBackup={() => setIsBackupModalOpen(true)}
                onOpenCsvOutbreak={handleOpenCsvOutbreak}
                onOpenCsvReport={handleOpenCsvReport}
                onGenerateMock={handleGenerateMockData}
                // Views
                onOpenMeetingList={() => setIsMeetingListOpen(true)}
                onOpenCalendar={() => setIsCalendarOpen(true)}
                onOpenMeetingCalendar={() => setIsMeetingCalendarOpen(true)}
                // Actions
                onOpenMeetingModal={() => setIsMeetingModalOpen(true)}
                onOpenAddOutbreak={openAddOutbreakModal}
                onOpenAddData={openAddModal}
            />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                <KPISection totals={totals} unitStats={unitStats} />

                <StatisticsCharts trendData={trendData} unitStats={unitStats} dispatchStats={dispatchStats}/>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <RankingSection 
                        rankingYear={rankingYear}
                        setRankingYear={setRankingYear}
                        rankingMonth={rankingMonth}
                        setRankingMonth={setRankingMonth}
                        availableYears={availableYears}
                        thaiMonths={THAI_MONTHS}
                        rankingUnitStats={rankingUnitStats}
                        rankingNestedStats={rankingNestedStats} // <--- เพิ่ม Prop นี้
                    />
                    
                    <div className="lg:col-span-7 bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-[56rem] relative z-0">
                        <LeafletMap 
                            data={mapDisplayData} 
                            outbreaks={filteredOutbreaks.filter(item => !hiddenOutbreakIds.includes(item._id))} 
                            onDeleteOutbreak={canEdit ? handleDeleteOutbreak : undefined} 
                        />
                    </div>
                </div>

                <RabiesOutbreakSection 
                    outbreakData={outbreakData} filterYear={outbreakFilterYear} setFilterYear={setOutbreakFilterYear} years={availableOutbreakYears} 
                    stats={outbreakStats} filteredOutbreaks={filteredOutbreaks} yearlyTrend={outbreakYearlyTrend} hiddenIds={hiddenOutbreakIds} 
                    toggleVisibility={toggleOutbreakVisibility} onEdit={openEditOutbreakModal} onDelete={handleDeleteOutbreak} canEdit={canEdit} 
                />

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all duration-300">
    {/* ส่วนหัว Header + ปุ่มยุบ/ขยาย */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                <Search className="w-5 h-5 text-indigo-500" /> ค้นหาและกรองข้อมูล (Data Filters)
            </h3>
            
            {/* ปุ่มกดเพื่อยุบ/ขยาย */}
            <button 
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"
                title={isFilterExpanded ? "ยุบตัวกรอง" : "ขยายตัวกรอง"}
            >
                {isFilterExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
        </div>

        <button 
            onClick={() => {
                setSearchTerm('');
                setSelectedYear('ทั้งหมด');
                setSelectedMonth('ทั้งหมด');
                setSelectedUnit('ทั้งหมด');
                setSelectedDistrict('ทั้งหมด');
                setSearchDate('');
            }}
            className="text-xs text-slate-500 hover:text-red-500 underline flex items-center gap-1 transition-colors"
        >
            <Trash2 className="w-3 h-3" /> ล้างตัวกรองทั้งหมด
        </button>
    </div>

    {/* ส่วนเนื้อหา Filter (แสดงเมื่อ isFilterExpanded เป็น true) */}
    {isFilterExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 animate-in slide-in-from-top-2 fade-in duration-300">
            {/* 1. ค้นหาด้วยข้อความ */}
            <div className="relative">
                <label className="block text-xs font-bold text-slate-500 mb-1">ค้นหา (สถานที่/รายละเอียด)</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="พิมพ์คำค้นหา..." 
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* 2. ตัวกรองปี */}
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ปี (Year)</label>
                <select 
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                >
                    <option value="ทั้งหมด">ทุกปี</option>
                    {availableYears.map(y => <option key={y} value={y}>{parseInt(y) + 543}</option>)}
                </select>
            </div>

            {/* 3. ตัวกรองเดือน */}
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">เดือน (Month)</label>
                <select 
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                >
                    <option value="ทั้งหมด">ทุกเดือน</option>
                    {THAI_MONTHS.map((m, i) => (
                        <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
                    ))}
                </select>
            </div>

            {/* 4. ตัวกรองหน่วยงาน */}
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">หน่วยงาน (Unit)</label>
                <select 
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                >
                    <option value="ทั้งหมด">ทุกหน่วยงาน</option>
                    {UNIT_TYPES.map((u, i) => <option key={i} value={u}>{u}</option>)}
                </select>
            </div>

            {/* 5. ตัวกรองเขต */}
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">เขต (District)</label>
                <select 
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                    <option value="ทั้งหมด">ทุกเขตใน กทม.</option>
                    {BANGKOK_DISTRICTS.map((d, i) => <option key={i} value={d}>{d}</option>)}
                </select>
            </div>
        </div>
    )}
</div>

                <MainDataTable 
                    data={filteredData} canEdit={canEdit} isSuperAdmin={isSuperAdmin} 
                    onClearAll={handleClearAllData} onEdit={openEditModal} onDelete={handleDeleteData} onViewImage={setViewImage} 
                />
            </main>
        </div>
    );
}