import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
    Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, Area, ComposedChart, Brush
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Circle} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { 
    Activity, Syringe, Scissors, FileText, MapPin, 
    Filter, Calendar, Database, Download, Users, 
    Map as MapIcon, ChevronDown, CheckCircle, Plus, X, Save,
    Calculator, Navigation, LocateFixed, Upload, Search, Pencil, 
    Edit, Trash2, Zap, Eye, Lock, Unlock, Image as ImageIcon, Skull, AlertTriangle, 
    Siren, Stethoscope, Key, ChevronRight, RotateCw, Info, Check, AlertCircle, EyeOff
} from 'lucide-react';
import L from 'leaflet';
import { io } from "socket.io-client";

//Compunent
import KPISection from './components/KPICards';
import UserManagementModal from './components/UserManagementModal';

// --- CONSTANTS ---
const UNIT_TYPES = ['หน่วยวัคซีน + ไมโครชิป', 'หน่วยกรงแมว', 'หน่วยสัตวแพทย์', 'หน่วยผู้ว่า'];

// Updated District List as requested (50 Districts)
const BANGKOK_DISTRICTS = [
    // ฝั่งธนบุรี (15 เขต)
    "เขตธนบุรี", "เขตบางกอกใหญ่", "เขตคลองสาน", "เขตตลิ่งชัน", "เขตบางกอกน้อย", 
    "เขตบางขุนเทียน", "เขตภาษีเจริญ", "เขตหนองแขม", "เขตราษฎร์บูรณะ", "เขตบางพลัด", 
    "เขตจอมทอง", "เขตบางแค", "เขตทวีวัฒนา", "เขตทุ่งครุ", "เขตบางบอน",
    // ฝั่งพระนคร (35 เขต)
    "เขตพระนคร", "เขตดุสิต", "เขตหนองจอก", "เขตบางรัก", "เขตบางเขน", 
    "เขตบางกะปิ", "เขตปทุมวัน", "เขตป้อมปราบศัตรูพ่าย", "เขตพระโขนง", "เขตมีนบุรี", 
    "เขตลาดกระบัง", "เขตยานนาวา", "เขตสัมพันธวงศ์", "เขตพญาไท", "เขตห้วยขวาง", 
    "เขตดินแดง", "เขตบึงกุ่ม", "เขตสาทร", "เขตบางซื่อ", "เขตจตุจักร", 
    "เขตบางคอแหลม", "เขตประเวศ", "เขตคลองเตย", "เขตสวนหลวง", "เขตดอนเมือง", 
    "เขตราชเทวี", "เขตลาดพร้าว", "เขตวัฒนา", "เขตหลักสี่", "เขตสายไหม", 
    "เขตคันนายาว", "เขตสะพานสูง", "เขตวังทองหลาง", "เขตคลองสามวา", "เขตบางนา"
];

// [NEW] ข้อมูลแขวง ของแต่ละเขต (Key ต้องตรงกับ BANGKOK_DISTRICTS)
const BANGKOK_SUBDISTRICTS = {
    "เขตคลองเตย": ["คลองเตย", "คลองตัน", "พระโขนง"],
    "เขตคลองสาน": ["สมเด็จเจ้าพระยา", "คลองสาน", "บางลำภูล่าง", "คลองต้นไทร"],
    "เขตคลองสามวา": ["สามวาตะวันตก", "สามวาตะวันออก", "บางชัน", "ทรายกองดิน", "ทรายกองดินใต้"],
    "เขตคันนายาว": ["คันนายาว", "รามอินทรา"],
    "เขตจตุจักร": ["ลาดยาว", "เสนานิคม", "จันทรเกษม", "จอมพล", "จตุจักร"],
    "เขตจอมทอง": ["บางขุนเทียน", "บางค้อ", "บางมด", "จอมทอง"],
    "เขตดอนเมือง": ["สีกัน", "ดอนเมือง", "สนามบิน"],
    "เขตดินแดง": ["ดินแดง", "รัชดาภิเษก"],
    "เขตดุสิต": ["ดุสิต", "วชิรพยาบาล", "สวนจิตรลดา", "สี่แยกมหานาค", "ถนนนครไชยศรี"],
    "เขตตลิ่งชัน": ["คลองชักพระ", "ตลิ่งชัน", "ฉิมพลี", "บางพรม", "บางระมาด", "บางเชือกหนัง"],
    "เขตทวีวัฒนา": ["ทวีวัฒนา", "ศาลาธรรมสพน์"],
    "เขตทุ่งครุ": ["บางมด", "ทุ่งครุ"],
    "เขตธนบุรี": ["วัดกัลยาณ์", "หิรัญรูจี", "บางยี่เรือ", "บุคคโล", "ตลาดพลู", "ดาวคะนอง", "สำเหร่"],
    "เขตบางกอกน้อย": ["ศิริราช", "บ้านช่างหล่อ", "บางขุนนนท์", "บางขุนศรี", "อรุณอมรินทร์"],
    "เขตบางกอกใหญ่": ["วัดอรุณ", "วัดท่าพระ"],
    "เขตบางกะปิ": ["คลองจั่น", "หัวหมาก"],
    "เขตบางขุนเทียน": ["ท่าข้าม", "แสมดำ"],
    "เขตบางเขน": ["อนุสาวรีย์", "ท่าแร้ง"],
    "เขตบางคอแหลม": ["บางคอแหลม", "วัดพระยาไกร", "บางโคล่"],
    "เขตบางแค": ["บางแค", "บางแคเหนือ", "บางไผ่", "หลักสอง"],
    "เขตบางซื่อ": ["บางซื่อ", "วงศ์สว่าง"],
    "เขตบางนา": ["บางนาเหนือ", "บางนาใต้"],
    "เขตบางบอน": ["บางบอนเหนือ", "บางบอนใต้", "คลองบางพราน", "คลองบางบอน"],
    "เขตบางพลัด": ["บางพลัด", "บางอ้อ", "บางบำหรุ", "บางยี่ขัน"],
    "เขตบางรัก": ["มหาพฤฒาราม", "สีลม", "สุริยวงศ์", "บางรัก", "สี่พระยา"],
    "เขตบึงกุ่ม": ["คลองกุ่ม", "นวมินทร์", "นวลจันทร์"],
    "เขตปทุมวัน": ["รองเมือง", "วังใหม่", "ปทุมวัน", "ลุมพินี"],
    "เขตประเวศ": ["ประเวศ", "หนองบอน", "ดอกไม้"],
    "เขตป้อมปราบศัตรูพ่าย": ["ป้อมปราบ", "วัดเทพศิรินทร์", "คลองมหานาค", "บ้านบาตร", "วัดโสมนัส"],
    "เขตพญาไท": ["สามเสนใน", "พญาไท"],
    "เขตพระโขนง": ["บางจาก", "พระโขนงใต้"],
    "เขตพระนคร": ["พระบรมมหาราชวัง", "วังบูรพาภิรมย์", "วัดราชบพิธ", "สำราญราษฎร์", "ศาลเจ้าพ่อเสือ", "เสาชิงช้า", "บวรนิเวศ", "ตลาดยอด", "ชนะสงคราม", "บ้านพานถม", "บางขุนพรหม", "วัดสามพระยา"],
    "เขตภาษีเจริญ": ["บางหว้า", "บางด้วน", "บางจาก", "บางแวก", "คลองขวาง", "ปากคลองภาษีเจริญ", "คูหาสวรรค์"],
    "เขตมีนบุรี": ["มีนบุรี", "แสนแสบ"],
    "เขตยานนาวา": ["ช่องนนทรี", "บางโพงพาง"],
    "เขตราชเทวี": ["ทุ่งพญาไท", "ถนนพญาไท", "ถนนเพชรบุรี", "มักกะสัน"],
    "เขตราษฎร์บูรณะ": ["ราษฎร์บูรณะ", "บางปะกอก"],
    "เขตลาดกระบัง": ["ลาดกระบัง", "คลองสองต้นนุ่น", "คลองสามประเวศ", "ลำปลาทิว", "ทับยาว", "ขุมทอง"],
    "เขตลาดพร้าว": ["ลาดพร้าว", "จรเข้บัว"],
    "เขตวังทองหลาง": ["วังทองหลาง", "สะพานสอง", "คลองเจ้าคุณสิงห์", "พลับพลา"],
    "เขตวัฒนา": ["คลองเตยเหนือ", "คลองตันเหนือ", "พระโขนงเหนือ"],
    "เขตสวนหลวง": ["สวนหลวง", "อ่อนนุช", "พัฒนาการ"],
    "เขตสะพานสูง": ["สะพานสูง", "ราษฎร์พัฒนา", "ทับช้าง"],
    "เขตสัมพันธวงศ์": ["จักรวรรดิ", "สัมพันธวงศ์", "ตลาดน้อย"],
    "เขตสาทร": ["ทุ่งวัดดอน", "ยานนาวา", "ทุ่งมหาเมฆ"],
    "เขตสายไหม": ["สายไหม", "ออเงิน", "คลองถนน"],
    "เขตหนองแขม": ["หนองแขม", "หนองค้างพลู"],
    "เขตหนองจอก": ["กระทุ่มราย", "หนองจอก", "คลองสิบ", "คลองสิบสอง", "โคกแฝด", "คู้ฝั่งเหนือ", "ลำผักชี", "ลำต้อยติ่ง"],
    "เขตหลักสี่": ["ทุ่งสองห้อง", "ตลาดบางเขน"],
    "เขตห้วยขวาง": ["ห้วยขวาง", "บางกะปิ", "สามเสนนอก"]
};

// --- COMPONENTS ---

// --- [NEW COMPONENT] Log Detail Modal (สำหรับดู JSON) ---
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
            {/* [เพิ่ม] เรียกใช้ Modal รายละเอียด */}
            <LogDetailModal 
                isOpen={!!selectedLogData} 
                onClose={() => setSelectedLogData(null)} 
                data={selectedLogData} 
            />

            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"> {/* ขยายความกว้างเป็น max-w-5xl */}
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
                                    <th className="p-4 w-16 text-center">Data</th> {/* [เพิ่ม] คอลัมน์ใหม่ */}
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
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
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

// --- [UI UPGRADE] ChangePasswordModal ---
const ChangePasswordModal = ({ isOpen, onClose, apiBaseUrl, token, onToast }) => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            onToast('error', "รหัสผ่านใหม่ไม่ตรงกัน");
            return;
        }

        if (newPassword.length < 4) {
            onToast('error', "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${apiBaseUrl}/api/change-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await res.json();

            if (res.ok) {
                onToast('success', 'เปลี่ยนรหัสผ่านสำเร็จ');
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                onClose();
            } else {
                onToast('error', data.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
            }
        } catch (error) {
            onToast('error', "เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <Key className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h2>
                        <p className="text-xs text-slate-500">เพื่อความปลอดภัยของบัญชี</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">รหัสผ่านเดิม</label>
                        <input type="password" required className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                            placeholder="••••••"
                            value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">รหัสผ่านใหม่</label>
                        <input type="password" required className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                            placeholder="กำหนดรหัสผ่านใหม่"
                            value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
                        <input type="password" required className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                            placeholder="พิมพ์รหัสใหม่อีกครั้ง"
                            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-sm transition-colors">ยกเลิก</button>
                        <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                            {isLoading ? 'กำลังบันทึก...' : <><CheckCircle className="w-4 h-4"/> ยืนยัน</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- [NEW COMPONENT] Toast Notification System ---
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
                    <button 
                        onClick={() => removeToast(toast.id)} 
                        className="opacity-70 hover:opacity-100 transition-opacity"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};

// --- [NEW COMPONENT] Password Confirmation Modal ---
const PasswordConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await onConfirm(password);
        setIsLoading(false);
        setPassword(""); // Clear password after submit
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
                        <input 
                            type="password" 
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                            placeholder="รหัสผ่าน Superadmin"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold">ยกเลิก</button>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? "กำลังตรวจสอบ..." : "ยืนยันการลบ"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- [UI UPGRADE] LoginModal ---
const LoginModal = ({ isOpen, onClose, onLogin, apiBaseUrl }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiBaseUrl}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                onLogin(data);
                // เรียกใช้ onToast ได้อย่างถูกต้อง
                if(onToast) onToast('success', 'เข้าสู่ระบบสำเร็จ');
                onClose();
            } else {
                if(onToast) onToast('error', data.message || 'เข้าสู่ระบบไม่สำเร็จ');
            }
        } catch (error) {
            if(onToast) onToast('error', `Login Failed: ไม่สามารถเชื่อมต่อ Server ได้`);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl transform transition-all scale-100 border border-slate-100 relative overflow-hidden">
                {/* Decoration Circle */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                
                <div className="text-center mb-8 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">เข้าสู่ระบบ</h2>
                    <p className="text-sm text-slate-500 mt-1">สำหรับเจ้าหน้าที่สัตวแพทย์</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    <div className="relative group">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input 
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700" 
                            placeholder="ชื่อผู้ใช้งาน (Username)" 
                            value={username} 
                            onChange={e=>setUsername(e.target.value)} 
                        />
                    </div>
                    <div className="relative group">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input 
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700" 
                            type="password" 
                            placeholder="รหัสผ่าน (Password)" 
                            value={password} 
                            onChange={e=>setPassword(e.target.value)} 
                        />
                    </div>
                    
                    <div className="pt-2">
                        <button type="submit" className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                            <span>เข้าสู่ระบบ</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <button type="button" onClick={onClose} className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-medium">
                        ยกเลิก
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- [UI UPGRADE] KPICard แบบ Premium: มี Gradient, เงาฟุ้ง และ Animation ---
const KPICard = ({ title, value, subtext, icon: Icon, colorClass, shadowClass }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default group relative overflow-hidden">
        {/* Decoration: วงกลมจางๆ ด้านหลังเพื่อความสวยงาม */}
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 duration-500 ${colorClass}`}></div>
        
        <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{value.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full inline-block animate-pulse ${colorClass}`}></span>
                {subtext}
            </p>
        </div>
        
        {/* Icon Box: เพิ่ม Gradient และ Shadow */}
        <div className={`w-14 h-14 rounded-2xl ${colorClass} ${shadowClass} flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
            <Icon className="w-7 h-7 text-white drop-shadow-md" />
        </div>
    </div>
);

// ✅ [แก้ไข] ปรับปรุง LeafletMap เพิ่มตัวเลือกระยะวงรัศมี
const LeafletMap = ({ data, outbreaks = [], onDeleteOutbreak }) => {
  const centerPosition = [13.7563, 100.5018];
  const [activeLayers, setActiveLayers] = useState(UNIT_TYPES);
  
  // [เพิ่ม] State สำหรับเก็บระยะรัศมีที่เลือก (หน่วยเป็นเมตร)
  // Default ให้แสดง 1km และ 3km (ตาม Code เดิม) ส่วน 5km ให้ผู้ใช้กดเปิดเอง หรือจะใส่ 5000 ลงไปเลยถ้าอยากให้เปิดแต่แรก
  const [activeRadii, setActiveRadii] = useState([1000, 3000]); 

  // Toggle การแสดงผลตามประเภทหน่วย
  const toggleLayer = (unit) => {
    setActiveLayers(prev => 
      prev.includes(unit) 
        ? prev.filter(u => u !== unit) 
        : [...prev, unit]              
    );
  };

  // [เพิ่ม] ฟังก์ชัน Toggle ระยะรัศมี
  const toggleRadius = (radius) => {
    setActiveRadii(prev => 
      prev.includes(radius)
        ? prev.filter(r => r !== radius)
        : [...prev, radius]
    );
  };

  // ... (ส่วน createDangerIcon, getMarkerColor, displayData, createNumberIcon เหมือนเดิม) ...
  // เพื่อความกระชับ ขอละส่วนที่ไม่ได้แก้ไว้ ...

  // ไอคอนพื้นที่ระบาด (สีแดงกะพริบ)
  const createDangerIcon = useCallback(() => {
    return L.divIcon({
      className: 'custom-danger-marker',
      html: `
        <div class="danger-marker-container">
          <div class="danger-pulse"></div>
          <div class="danger-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  }, []);

  // เลือกสีตามหน่วยงาน
  const getMarkerColor = (unit) => {
    switch (unit) {
      case 'หน่วยผู้ว่า': return '#a855f7'; // Purple
      case 'หน่วยสัตวแพทย์': return '#3b82f6'; // Blue
      case 'หน่วยวัคซีน + ไมโครชิป': return '#22c55e'; // Green
      case 'หน่วยกรงแมว': return '#f97316'; // Orange
      default: return '#64748b'; // Slate
    }
  };

  // กรองข้อมูลตาม Layer ที่เลือก
  const displayData = useMemo(() => {
    return data.filter(item => activeLayers.includes(item.unit));
  }, [data, activeLayers]);

  // สร้างไอคอนตัวเลข
  const createNumberIcon = (total, color) => {
    const size = total > 999 ? 40 : (total > 99 ? 34 : 28); 
    return L.divIcon({
      className: 'custom-marker-wrapper', 
      html: `
        <div class="marker-container" style="--marker-color: ${color}; width: ${size}px; height: ${size}px;">
          <div class="marker-content">${total.toLocaleString()}</div>
          <div class="marker-arrow"></div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size + 5],
      popupAnchor: [0, -(size + 5)]
    });
  };

  return (
    <div className="w-full h-full flex flex-col relative z-0 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      
      {/* Filter Bar controls (Floating) */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100 max-w-[180px] animate-in slide-in-from-right-4">
          
          {/* ส่วน Filter หน่วยงาน (Code เดิม) */}
          <div className="text-xs font-extrabold text-slate-600 mb-1 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Filter className="w-3.5 h-3.5" /> แสดงข้อมูล
          </div>
          {UNIT_TYPES.map((unit) => {
              const color = getMarkerColor(unit);
              const isActive = activeLayers.includes(unit);
              return (
                  <button
                      key={unit}
                      onClick={() => toggleLayer(unit)}
                      className={`text-[10px] py-1.5 px-2 rounded-lg font-bold transition-all flex items-center gap-2 border w-full text-left
                          ${isActive ? 'bg-white shadow-sm ring-1 ring-slate-100' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}
                      `}
                      style={isActive ? { borderLeft: `3px solid ${color}`, color: '#334155' } : { opacity: 0.7 }}
                  >
                      <span className={`w-2 h-2 rounded-full transition-all ${isActive ? 'scale-110' : 'scale-0'}`} style={{ backgroundColor: color }}></span>
                      <span className="truncate">{unit}</span>
                  </button>
              )
          })}

          {/* [เพิ่ม] ส่วน Filter รัศมีควบคุมโรค */}
          <div className="text-xs font-extrabold text-slate-600 mt-2 mb-1 flex items-center gap-1.5 border-t border-slate-100 pt-3 border-b pb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> รัศมีควบคุมโรค
          </div>
          <div className="flex flex-col gap-1.5">
            {[
                { val: 1000, label: '1 กม. (ควบคุม)', color: '#991b1b' },
                { val: 3000, label: '3 กม. (เฝ้าระวัง)', color: '#ef4444' },
                { val: 5000, label: '5 กม. (แจ้งเตือน)', color: '#f97316' }
            ].map((r) => {
                const isActive = activeRadii.includes(r.val);
                return (
                    <button
                        key={r.val}
                        onClick={() => toggleRadius(r.val)}
                        className={`text-[10px] py-1.5 px-2 rounded-lg font-bold transition-all flex items-center gap-2 border w-full text-left
                            ${isActive ? 'bg-red-50 text-red-700 ring-1 ring-red-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}
                        `}
                    >
                        <div className={`w-3 h-3 rounded flex items-center justify-center border ${isActive ? 'border-red-500 bg-red-500' : 'border-slate-300 bg-white'}`}>
                            {isActive && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                        </div>
                        <span className={isActive ? 'opacity-100' : 'opacity-60'}>{r.label}</span>
                    </button>
                );
            })}
          </div>

      </div>

      <style>{`
          .custom-marker-wrapper { background: transparent; border: none; }
          .marker-container {
            position: relative; display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s ease-out; cursor: pointer;
          }
          .marker-container:hover { transform: scale(1.15) translateY(-5px); z-index: 1000; }
          .marker-content {
            width: 100%; height: 100%; border-radius: 50%;
            background: var(--marker-color);
            background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), var(--marker-color));
            border: 2px solid white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: 900; font-size: 11px; 
            font-family: 'Sarabun', sans-serif;
            text-shadow: 0 1px 2px rgba(0,0,0,0.4);
            z-index: 2;
          }
          .marker-arrow {
             position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg);
             width: 8px; height: 8px; background-color: var(--marker-color);
             border-right: 2px solid white; border-bottom: 2px solid white; z-index: 1;
          }
          .danger-marker-container {
            position: relative; width: 40px; height: 40px;
            display: flex; align-items: center; justify-content: center;
          }
          .danger-content {
            position: relative; z-index: 2;
            width: 32px; height: 32px; background: #ef4444; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: white; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.5); border: 2px solid white;
          }
          .danger-pulse {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(239, 68, 68, 0.6); border-radius: 50%;
            animation: pulse-red 1.5s infinite;
          }
          @keyframes pulse-red {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(2.0); opacity: 0; }
          }
      `}</style>

      <div className="flex-1 w-full h-full">
        <MapContainer 
            center={centerPosition} 
            zoom={10} 
            scrollWheelZoom={true} 
            style={{ height: "100%", width: "100%", background: "#f1f5f9", zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MarkerClusterGroup 
            key={activeLayers.join(',')} 
            chunkedLoading
            maxClusterRadius={40}
            spiderfyOnMaxZoom={true}
          >
            {displayData.map((item) => {
              const lat = parseFloat(item.lat);
              const long = parseFloat(item.long);
              if (isNaN(lat) || isNaN(long) || lat === 0 || long === 0) return null;

              const stats = item.stats || { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 };
              const totalActivity = stats.vaccine + stats.sterilize + stats.register + stats.microchip + (stats.medical || 0);
              const color = getMarkerColor(item.unit);

              return (
                <Marker
                  key={item._id}
                  position={[lat, long]}
                  icon={createNumberIcon(totalActivity, color)}
                >
                  <Tooltip direction="top" offset={[0, -35]} opacity={1} className="custom-tooltip">
                    <div className="text-center">
                      <span className="font-bold text-slate-800 text-xs block">{item.location}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full inline-block mt-1">
                        รวม: {totalActivity.toLocaleString()}
                      </span>
                    </div>
                  </Tooltip>
                  {/* ... (Popup Code เดิม) ... */}
                  <Popup>
                      <div className="font-sans min-w-[220px] p-0 overflow-hidden">
                        {item.imageUrl && (
                          <div className="w-full h-32 overflow-hidden relative group cursor-pointer">
                              <img src={item.imageUrl} alt="site" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                          </div>
                        )} 
                        <div className="p-3">
                            <h3 className="font-bold text-slate-800 text-sm mb-1 leading-tight">
                                {item.unit}
                            </h3>
                            <p className="text-[11px] text-slate-500 mb-3 flex items-start gap-1">
                                <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" /> 
                                {item.location} ({item.district})
                            </p>
                            
                            <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs shadow-inner">
                                {/* รายละเอียด Stats ใน Popup (Code เดิม) */}
                                <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-1">
                                    <div className="font-extrabold text-slate-900">รวมทั้งหมด</div>
                                    <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">
                                      {totalActivity.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                      </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>

          {/* ส่วนแสดงจุดระบาด (Outbreaks) */}
          {outbreaks.map((item, index) => {
              const lat = parseFloat(item.lat);
              const long = parseFloat(item.long);
              if (isNaN(lat) || isNaN(long)) return null;

              return (
                  <React.Fragment key={item._id || `outbreak-${index}`}>
                      
                      {/* [แก้ไข] แสดงวงกลมตามที่ติ๊กเลือก (activeRadii) */}
                      
                      {/* 1 กม. - สีแดงเข้ม เส้นประ */}
                      {activeRadii.includes(1000) && (
                        <Circle 
                            center={[lat, long]} 
                            radius={1000} 
                            pathOptions={{ color: '#991b1b', fillOpacity: 0.2, weight: 1, dashArray: '4, 4' }} 
                        />
                      )}

                      {/* 3 กม. - สีแดง จางลง */}
                      {activeRadii.includes(3000) && (
                        <Circle 
                            center={[lat, long]} 
                            radius={3000} 
                            pathOptions={{ color: '#ef4444', fillOpacity: 0.1, weight: 0 }} 
                        />
                      )}

                      {/* [เพิ่มใหม่] 5 กม. - สีส้ม เฝ้าระวัง */}
                      {activeRadii.includes(5000) && (
                        <Circle 
                            center={[lat, long]} 
                            radius={5000} 
                            pathOptions={{ color: '#f97316', fillOpacity: 0.05, weight: 1, dashArray: '2, 6' }} 
                        />
                      )}
                      
                      <Marker position={[lat, long]} icon={createDangerIcon()}>
                          <Popup>
                              {/* ... (Popup แจ้งโรค Code เดิม) ... */}
                              <div className="font-sans min-w-[200px] p-2 text-center">
                                  <div className="bg-red-50 text-red-600 font-extrabold px-3 py-1 rounded-full text-[10px] inline-flex items-center gap-1 mb-2 border border-red-100 shadow-sm">
                                      <AlertTriangle className="w-3 h-3" /> พบเชื้อพิษสุนัขบ้า
                                  </div>
                                  <h3 className="font-bold text-slate-800 text-sm mb-1">{item.location}</h3>
                                  <p className="text-xs text-slate-500 mb-2 border-b border-slate-100 pb-2">เขต{item.district}</p>
                                  
                                  {/* [แก้ไข] แสดงสถานะระยะใน Popup ให้สอดคล้อง */}
                                  <div className="grid grid-cols-3 gap-1 text-[9px]">
                                      <div className={`rounded p-1 font-bold ${activeRadii.includes(1000) ? 'text-red-900 bg-red-100/50' : 'text-slate-300 bg-slate-50'}`}>
                                          1 กม.<br/>ควบคุม
                                      </div>
                                      <div className={`rounded p-1 font-bold ${activeRadii.includes(3000) ? 'text-red-600 bg-red-50/50' : 'text-slate-300 bg-slate-50'}`}>
                                          3 กม.<br/>เฝ้าระวัง
                                      </div>
                                      <div className={`rounded p-1 font-bold ${activeRadii.includes(5000) ? 'text-orange-500 bg-orange-50/50' : 'text-slate-300 bg-slate-50'}`}>
                                          5 กม.<br/>แจ้งเตือน
                                      </div>
                                  </div>
                                  
                                  {onDeleteOutbreak && (
                                    <button 
                                      onClick={() => onDeleteOutbreak(item._id)} 
                                      className="mt-3 w-full flex items-center justify-center gap-1 bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold py-1.5 rounded transition-all shadow-sm hover:shadow"
                                    >
                                      <Trash2 className="w-3 h-3" /> ลบแจ้งเหตุนี้
                                    </button>
                                  )}
                                  
                              </div>
                          </Popup>
                      </Marker>
                  </React.Fragment>
              );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

// --- NEW COMPONENT: IMAGE PREVIEW MODAL ---
const ImagePreviewModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
    <div 
        className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={onClose} // คลิกพื้นที่ว่างเพื่อปิด
        >
        <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            {/* ปุ่มปิด */}
            <button 
                onClick={onClose}
                className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md"
            >
                <X className="w-6 h-6" />
            </button>
            {/* รูปภาพ */}
            <img 
                src={imageUrl} 
                alt="Full Preview" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()} // คลิกที่รูปจะไม่ปิด
            />
        </div>
    </div>
  );
};

// --- เปลี่ยน Component AddOutbreakModal ทั้งก้อนเป็นอันนี้ ---

const AddOutbreakModal = ({ isOpen, onClose, onSave, onUpdate, initialData }) => {
    // State สำหรับ Form
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        location: '',
        district: BANGKOK_DISTRICTS[0],
        lat: '',
        long: ''
    });

    // [เพิ่ม] useEffect เพื่อโหลดข้อมูลเดิมเมื่อเปิดในโหมดแก้ไข
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    date: initialData.date,
                    location: initialData.location,
                    district: initialData.district,
                    lat: initialData.lat,
                    long: initialData.long
                });
            } else {
                // Reset form ถ้าเป็นการเพิ่มใหม่
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    location: '',
                    district: BANGKOK_DISTRICTS[0],
                    lat: '',
                    long: ''
                });
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            lat: parseFloat(formData.lat),
            long: parseFloat(formData.long)
        };

        if (initialData) {
            onUpdate(initialData._id, payload); // เรียกฟังก์ชันแก้ไข
        } else {
            onSave(payload); // เรียกฟังก์ชันบันทึกใหม่
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-red-500">
                <div className="bg-red-600 px-6 py-4 flex justify-between items-center text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Skull className="w-6 h-6" /> 
                        {initialData ? 'แก้ไขข้อมูลจุดเสี่ยง' : 'บันทึกจุดเกิดเหตุโรคพิษสุนัขบ้า'}
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* ... (ส่วน Input Fields เหมือนเดิม) ... */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">วันที่พบเชื้อ</label>
                        <input required type="date" className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                            value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">สถานที่พบ (Location)</label>
                        <input required type="text" placeholder="ระบุสถานที่" className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                            value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">เขตพื้นที่ (District)</label>
                        <select className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                            value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })}>
                            {BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-red-500" />
                            พิกัดภูมิศาสตร์ (Latitude, Longitude)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="เช่น 13.xxxx, 100.xxxx"
                                className="w-full p-2.5 pl-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none font-mono"
                                value={formData.lat && formData.long ? `${formData.lat}, ${formData.long}` : (formData.lat || formData.long || "")}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.includes(',')) {
                                        const [lat, lng] = value.split(',').map(s => s.trim());
                                        setFormData({ ...formData, lat, long: lng });
                                    } else {
                                        setFormData({ ...formData, lat: value });
                                    }
                                }}
                            />
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-400">* จำเป็นต้องระบุพิกัดเพื่อแสดงบนแผนที่ (คั่นด้วยเครื่องหมายจุลภาค ,)</p>

                    <div className="pt-4 border-t border-slate-100 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors">ยกเลิก</button>
                        <button type="submit" className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all">
                            {initialData ? <><Edit className="w-4 h-4" /> บันทึกแก้ไข</> : <><Siren className="w-4 h-4" /> ยืนยันแจ้งเหตุ</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- UPDATED ADD/EDIT DATA MODAL ---
const AddDataModal = ({ isOpen, onClose, onSave, onUpdate, initialData, onToast }) => {
    // ค่าเริ่มต้นสำหรับฟอร์มข้อมูลทั่วไป
    const defaultFormData = {
        date: new Date().toISOString().split('T')[0],
        location: '',
        district: BANGKOK_DISTRICTS[0],
        subdistrict: '',
        unit: UNIT_TYPES[0],
        lat: '',
        long: ''
    };

    // ค่าเริ่มต้นสำหรับข้อมูลตัวเลข (Breakdown)
    const defaultBreakdown = {
        dog: { maleSterilize: '', femaleSterilize: '', vaccine: '', register: '', microchip: '', medical: '' },
        cat: { maleSterilize: '', femaleSterilize: '', vaccine: '', register: '', microchip: '', medical: '' },
        other: { vaccine: '', medical: '' }
    };

    const [formData, setFormData] = useState(defaultFormData);
    const [breakdown, setBreakdown] = useState(defaultBreakdown);

    // State สำหรับจัดการรูปภาพ
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Effect: โหลดข้อมูลเดิมเมื่อเปิด Modal ในโหมดแก้ไข หรือ รีเซ็ตเมื่อเพิ่มใหม่
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    date: initialData.date,
                    location: initialData.location,
                    district: initialData.district,
                    subdistrict: initialData.subdistrict || '',
                    unit: initialData.unit,
                    lat: initialData.lat,
                    long: initialData.long
                });

                // ✅ FIX: ใช้การ Merge Object เพื่อป้องกัน undefined กรณีข้อมูลเก่าไม่มีบาง field
                if (initialData.details) {
                    setBreakdown({
                        dog: { ...defaultBreakdown.dog, ...(initialData.details.dog || {}) },
                        cat: { ...defaultBreakdown.cat, ...(initialData.details.cat || {}) },
                        other: { ...defaultBreakdown.other, ...(initialData.details.other || {}) }
                    });
                } else {
                    setBreakdown(defaultBreakdown);
                }

                if (initialData.imageUrl) {
                    setImagePreview(initialData.imageUrl);
                } else {
                    setImagePreview(null);
                    setImageFile(null);
                }
            } else {
                setFormData(defaultFormData);
                setBreakdown(defaultBreakdown);
                setImageFile(null);
                setImagePreview(null);
            }
        }
    }, [isOpen, initialData]);

    // คำนวณยอดรวมอัตโนมัติ (Auto-calculation)
    const totals = useMemo(() => {
        const parse = (val) => parseInt(val) || 0;

        const dog = breakdown.dog;
        const cat = breakdown.cat;
        const other = breakdown.other;

        return {
            // ✅ แก้ไขสูตร: วัคซีนไม่ต้องแยกเพศ
            vaccine: parse(dog.vaccine) + parse(cat.vaccine) + parse(other.vaccine),
            sterilize: parse(dog.maleSterilize) + parse(dog.femaleSterilize) + parse(cat.maleSterilize) + parse(cat.femaleSterilize),
            register: parse(dog.register) + parse(cat.register),
            microchip: parse(dog.microchip) + parse(cat.microchip),
            // ✅ เพิ่มสูตร: รักษาสัตว์
            medical: parse(dog.medical) + parse(cat.medical) + parse(other.medical),
        };
    }, [breakdown]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    if (!isOpen) return null;

    const handleBreakdownChange = (type, field, value) => {
        setBreakdown(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value 
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let finalImageUrl = initialData?.imageUrl || ""; 

        if (imageFile) {
            try {
                finalImageUrl = await convertToBase64(imageFile);
            } catch (error) {
                console.error("Error converting image:", error);
                if(onToast) onToast('error', "ไม่สามารถประมวลผลรูปภาพได้");
                return;
            }
        } else if (imagePreview === null) {
            finalImageUrl = "";
        }

        // ✅ FIX: จัดโครงสร้างข้อมูลให้ตรงกับ Mongoose Schema (เอาตัวเลขไปใส่ใน stats)
        const dataPayload = {
            ...formData,
            lat: formData.lat ? parseFloat(formData.lat) : 0,
            long: formData.long ? parseFloat(formData.long) : 0,
            // ย้ายตัวเลขรวม เข้าไปอยู่ใน object 'stats'
            stats: {
                vaccine: totals.vaccine,
                sterilize: totals.sterilize,
                register: totals.register,
                microchip: totals.microchip,
                medical: totals.medical
            },
            details: breakdown,
            imageUrl: finalImageUrl 
        };

        if (initialData) {
            onUpdate(initialData._id, dataPayload);
        } else {
            onSave(dataPayload);
        }
        onClose();
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0 border-b border-slate-700">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {initialData ? <Edit className="w-5 h-5 text-yellow-400" /> : <Plus className="w-5 h-5 text-green-400" />}
                            {initialData ? 'แก้ไขข้อมูลการปฏิบัติงาน' : 'บันทึกผลการปฏิบัติงานใหม่'}
                        </h3>
                        <p className="text-slate-400 text-xs mt-0.5">
                            {initialData ? 'ปรับปรุงข้อมูลในระบบ' : 'กรอกข้อมูลพื้นฐานและรายละเอียดเชิงปริมาณ'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                        {/* Section 1: General Info (คงเดิม) */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" /> ข้อมูลทั่วไป (General Information)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">วันที่เริ่มกิจกรรม</label>
                                    <input required type="date" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">หน่วยกิจกรรม</label>
                                    <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                                        {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-6">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">สถานที่ (Location)</label>
                                    <input required type="text" placeholder="ระบุจุดสังเกต/สถานที่ตั้ง" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                                </div>

                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">เขต (District)</label>
                                    <select 
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.district} 
                                        // [EDIT] เมื่อเปลี่ยนเขต ให้รีเซ็ตแขวงเป็นค่าว่าง
                                        onChange={e => setFormData({...formData, district: e.target.value, subdistrict: ''})}
                                    >
                                        {BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">แขวง (Sub-district)</label>
                                    {/* [EDIT] เปลี่ยนจาก Input เป็น Select เพื่อเลือกแขวงตามเขต */}
                                    <select 
                                        required 
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.subdistrict} 
                                        onChange={e => setFormData({...formData, subdistrict: e.target.value})}
                                        disabled={!formData.district} // ปิดถ้ายังไม่เลือกเขต
                                    >
                                        <option value="">-- เลือกแขวง --</option>
                                        {formData.district && BANGKOK_SUBDISTRICTS[formData.district] ? (
                                            BANGKOK_SUBDISTRICTS[formData.district].map(sub => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))
                                        ) : (
                                            <option value="" disabled>ไม่มีข้อมูลแขวง</option>
                                        )}
                                    </select>
                                </div>

                                <div className="md:col-span-6">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                                        <Navigation className="w-3 h-3 text-blue-500" /> 
                                            พิกัดภูมิศาสตร์ (Latitude, Longitude)
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input type="text" placeholder="เช่น 13.6096, 100.4655" 
                                                className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                                value={formData.lat && formData.long ? `${formData.lat}, ${formData.long}` : (formData.lat || formData.long || "")}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value.includes(',')) {
                                                        const [lat, lng] = value.split(',').map(s => s.trim());
                                                        setFormData({ ...formData, lat, long: lng });
                                                    } else {
                                                        setFormData({ ...formData, lat: value });
                                                    }
                                                }} 
                                            />
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* อัปโหลดรูปภาพ */}
                                <div className="md:col-span-12 mt-2 pt-4 border-t border-slate-100">
                                    <label className="block text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                                        <ImageIcon className="w-3 h-3 text-blue-500" /> 
                                            รูปภาพประกอบ (Image Attachment)
                                    </label>
                                    {!imagePreview ? (
                                        <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors relative group h-32 flex flex-col items-center justify-center cursor-pointer">
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
                                            <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                                <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">คลิกเพื่ออัปโหลดรูปภาพ</p>
                                        </div>
                                    ) : (
                                        <div className="relative w-full h-48 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover"/>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button type="button" onClick={handleRemoveImage} className="bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1">
                                                    <Trash2 className="w-3 h-3" /> ลบรูปภาพ
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: Quantitative Data */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-orange-600" /> ข้อมูลเชิงปริมาณ (Quantitative Data)
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* 1. ฉีดวัคซีน (Vaccine) - ✅ แก้ไข: ไม่แยกเพศ */}
                                <div className="bg-blue-50/50 rounded-xl border border-blue-100 overflow-hidden">
                                    <div className="bg-blue-100/80 px-4 py-2 font-bold text-blue-800 flex items-center gap-2">
                                        <Syringe className="w-4 h-4" /> ฉีดวัคซีน (Vaccine)
                                    </div>
                                    <div className="p-4 grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">สุนัข (รวม)</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-blue-400"
                                                value={breakdown.dog.vaccine} onChange={(e) => handleBreakdownChange('dog', 'vaccine', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">แมว (รวม)</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-blue-400"
                                                value={breakdown.cat.vaccine} onChange={(e) => handleBreakdownChange('cat', 'vaccine', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">อื่น ๆ</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-blue-400"
                                                value={breakdown.other.vaccine} onChange={(e) => handleBreakdownChange('other', 'vaccine', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. ทำหมัน (Sterilization) - คงเดิม (แยกเพศ) */}
                                <div className="bg-orange-50/50 rounded-xl border border-orange-100 overflow-hidden">
                                    <div className="bg-orange-100/80 px-4 py-2 font-bold text-orange-800 flex items-center gap-2">
                                        <Scissors className="w-4 h-4" /> ทำหมัน (Sterilization)
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {/* สุนัข */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">สุนัข</div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 font-semibold">เพศผู้</label>
                                                <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-orange-400"
                                                    value={breakdown.dog.maleSterilize} onChange={(e) => handleBreakdownChange('dog', 'maleSterilize', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 font-semibold">เพศเมีย</label>
                                                <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-orange-400"
                                                    value={breakdown.dog.femaleSterilize} onChange={(e) => handleBreakdownChange('dog', 'femaleSterilize', e.target.value)} />
                                            </div>
                                        </div>
                                        {/* แมว */}
                                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-orange-100/50">
                                            <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">แมว</div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 font-semibold">เพศผู้</label>
                                                <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-orange-400"
                                                    value={breakdown.cat.maleSterilize} onChange={(e) => handleBreakdownChange('cat', 'maleSterilize', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 font-semibold">เพศเมีย</label>
                                                <input type="number" min="0" placeholder="0" className="w-full mt-1 p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-orange-400"
                                                    value={breakdown.cat.femaleSterilize} onChange={(e) => handleBreakdownChange('cat', 'femaleSterilize', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. ฝังไมโครชิป (Microchip) */}
                                <div className="bg-purple-50/50 rounded-xl border border-purple-100 overflow-hidden">
                                    <div className="bg-purple-100/80 px-4 py-2 font-bold text-purple-800 flex items-center gap-2">
                                        <Database className="w-4 h-4" /> ฝังไมโครชิป (Microchip)
                                    </div>
                                    <div className="p-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">สุนัข (มีเจ้าของ)</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-purple-400"
                                                value={breakdown.dog.microchip} onChange={(e) => handleBreakdownChange('dog', 'microchip', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">แมว (มีเจ้าของ)</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-purple-400"
                                                value={breakdown.cat.microchip} onChange={(e) => handleBreakdownChange('cat', 'microchip', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                {/* 4. ขึ้นทะเบียน (Registration) */}
                                <div className="bg-green-50/50 rounded-xl border border-green-100 overflow-hidden">
                                    <div className="bg-green-100/80 px-4 py-2 font-bold text-green-800 flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> ขึ้นทะเบียน (Register)
                                    </div>
                                    <div className="p-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">สุนัข</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-green-400"
                                                value={breakdown.dog.register} onChange={(e) => handleBreakdownChange('dog', 'register', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">แมว</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-green-400"
                                                value={breakdown.cat.register} onChange={(e) => handleBreakdownChange('cat', 'register', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                {/* ✅ 5. รักษาสัตว์ (Medical Treatment) - เพิ่มใหม่ */}
                                <div className="bg-rose-50/50 rounded-xl border border-rose-100 overflow-hidden lg:col-span-2">
                                    <div className="bg-rose-100/80 px-4 py-2 font-bold text-rose-800 flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4" /> รักษาสัตว์ (Medical Treatment)
                                    </div>
                                    <div className="p-4 grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">สุนัข</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-rose-400"
                                                value={breakdown.dog.medical} onChange={(e) => handleBreakdownChange('dog', 'medical', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">แมว</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-rose-400"
                                                value={breakdown.cat.medical} onChange={(e) => handleBreakdownChange('cat', 'medical', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">อื่น ๆ</label>
                                            <input type="number" min="0" placeholder="0" className="w-full p-2 bg-white border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-rose-400"
                                                value={breakdown.other.medical} onChange={(e) => handleBreakdownChange('other', 'medical', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Summary Block */}
                        <div className="bg-slate-800 rounded-xl overflow-hidden text-white shadow-lg mt-4">
                            <div className="bg-slate-900 px-4 py-2 font-bold text-green-400 flex items-center gap-2 border-b border-slate-700">
                                <Activity className="w-4 h-4" /> สรุปยอดรวมอัตโนมัติ (Auto-calculated)
                            </div>
                            {/* ปรับ Grid เป็น 5 คอลัมน์เพื่อรองรับรักษาสัตว์ */}
                            <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-blue-400">{totals.vaccine}</div>
                                    <div className="text-[10px] text-slate-400 uppercase">รวมวัคซีน</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-orange-400">{totals.sterilize}</div>
                                    <div className="text-[10px] text-slate-400 uppercase">รวมทำหมัน</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-400">{totals.register}</div>
                                    <div className="text-[10px] text-slate-400 uppercase">รวมขึ้นทะเบียน</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-purple-400">{totals.microchip}</div>
                                    <div className="text-[10px] text-slate-400 uppercase">รวมไมโครชิป</div>
                                </div>
                                {/* ✅ เพิ่มแสดงผลรวมรักษา */}
                                <div>
                                    <div className="text-2xl font-bold text-rose-400">{totals.medical}</div>
                                    <div className="text-[10px] text-slate-400 uppercase">รวมรักษา</div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Action Button */}
                    <div className="bg-white border-t border-slate-200 p-6 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-base">
                            <Save className="w-5 h-5" />
                            {initialData ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลเข้าระบบ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- NEW COMPONENT: CSV ACTION MODAL ---
const CsvActionModal = ({ isOpen, onClose, onFileChange, onExport }) => {
    if (!isOpen) return null;

    return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 relative animate-in zoom-in-95 duration-200">
        
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">จัดการข้อมูล CSV</h3>
                <p className="text-xs text-slate-500">เลือกดำเนินการกับไฟล์ข้อมูล</p>
            </div>

            <div className="space-y-3">
                {/* Import Button */}
                <div className="relative w-full group">
                    <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-bold rounded-xl transition-all">
                        <Upload className="w-5 h-5" />
                        <span>นำเข้าไฟล์ (Import)</span>
                    </button>
                    {/* Hidden Input Overlay */}
                    <input type="file" accept=".csv" onChange={(e) => { onFileChange(e); onClose(); // ปิด Modal เมื่อเลือกไฟล์เสร็จ
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="คลิกเพื่อเลือกไฟล์ CSV"
                    />
                </div>

                <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-xs text-slate-400">หรือ</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    {/* Export Button */}
                    <button onClick={() => {onExport(); onClose();}}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-100 hover:bg-green-500 hover:text-white text-slate-700 font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
                    >
                        <Download className="w-5 h-5" />
                        <span>ส่งออกไฟล์ (Export)</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- UPDATED COMPONENT: SYSTEM BACKUP MODAL ---
const BackupSystemModal = ({ isOpen, onClose, onRestoreSuccess, token, apiBaseUrl }) => {
    if (!isOpen) return null;

    // ใช้ URL จาก Prop หรือค่า Default
    const TARGET_URL = apiBaseUrl || 'http://localhost:5000';

    const handleDownloadBackup = async () => {
        try {
            // ✅ แก้ไข: เพิ่ม Header Authorization เพื่อส่ง Token
            const response = await fetch(`${TARGET_URL}/api/system/backup`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // สำคัญมาก: ต้องมี Token
                }
            });

            if (!response.ok) throw new Error('Backup failed');

            const data = await response.json();
            
            // สร้างไฟล์ JSON
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
                const backupData = JSON.parse(event.target.result);
                
                if (!window.confirm("⚠️ คำเตือน: การกู้คืนข้อมูลจะ 'ลบข้อมูลปัจจุบันทั้งหมด' และแทนที่ด้วยไฟล์ Backup\n\nคุณแน่ใจหรือไม่?")) {
                    return;
                }

                // ✅ แก้ไข: เพิ่ม Header Authorization
                const response = await fetch(`${TARGET_URL}/api/system/restore`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // ต้องส่ง Token
                },
                body: event.target.result // ส่งข้อมูล text/json ที่อ่านได้โดยตรง
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
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Database className="w-5 h-5 text-green-400" /> สำรองและกู้คืนข้อมูล
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    {/* ปุ่ม Backup */}
                    <button 
                        onClick={handleDownloadBackup}
                        className="w-full py-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-700 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group"
                    >
                        <Download className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        <span className="font-bold">ดาวน์โหลดไฟล์ Backup (.json)</span>
                        <span className="text-xs text-blue-400">เก็บข้อมูลทั้งหมดในระบบไว้ในไฟล์เดียว</span>
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-xs text-slate-400">หรือ กู้คืนข้อมูล</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    {/* ปุ่ม Restore */}
                    <div className="relative w-full group">
                        <button className="w-full py-4 bg-red-50 hover:bg-red-100 border-2 border-dashed border-red-200 text-red-700 rounded-xl flex flex-col items-center justify-center gap-2 transition-all">
                            <Upload className="w-8 h-8" />
                            <span className="font-bold">อัปโหลดไฟล์ Restore</span>
                            <span className="text-xs text-red-400">ข้อมูลปัจจุบันจะถูกแทนที่ด้วยไฟล์นี้</span>
                        </button>
                        <input 
                            type="file" 
                            accept=".json" 
                            onChange={handleRestoreBackup}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

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

    // Legacy View Mode (optional, kept for backward compatibility if needed)
    const isReadOnlyMode = new URLSearchParams(window.location.search).get('mode') === 'view';

    // Constants
    const BASE_URL = 'https://veterinarydashboard-hwho.onrender.com';
    const API_URL = `${BASE_URL}/api/reports`;
    const THAI_MONTHS = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    // Confirm Password
    const [isConfirmPasswordOpen, setIsConfirmPasswordOpen] = useState(false);

  // [เพิ่ม] State สำหรับ Toast
    const [toasts, setToasts] = useState([]);

    // [เพิ่ม] Function สำหรับเรียก Toast
    const addToast = (type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // [เพิ่ม] State สำหรับเปิด Modal Logs
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);

    // [เพิ่ม] State สำหรับเก็บข้อมูล Outbreak ที่กำลังแก้ไข
    const [editingOutbreak, setEditingOutbreak] = useState(null);

    // [เพิ่ม] State เก็บรายการ ID ของจุดระบาดที่ถูกสั่งปิด (ซ่อน)
    const [hiddenOutbreakIds, setHiddenOutbreakIds] = useState([]);

    // --- 2. AUTHENTICATION LOGIC ---

    // ตรวจสอบ Login เมื่อโหลดหน้าเว็บ
    useEffect(() => {
        const storedUser = localStorage.getItem('vet_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
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
            // Optional: window.location.reload(); 
        }
    };

    // Helper เช็คสิทธิ์
    // Admin หรือ SuperAdmin สามารถ แก้ไข/เพิ่ม/ลบ ข้อมูลรายตัวได้
    const canEdit = user && (user.role === 'admin' || user.role === 'superadmin') && !isReadOnlyMode;
    // เฉพาะ SuperAdmin เท่านั้นที่ทำได้ทุกอย่าง (รวมถึงลบทั้งหมด และจัดการ User)
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

    // useEffect ตัวเดิม เรียก fetchData ครั้งแรก
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- REAL-TIME SOCKET LISTENER (UPDATED) ---
    useEffect(() => {
        // เชื่อมต่อ Socket
        const socket = io(BASE_URL);

        socket.on('connect', () => {
            console.log("🟢 Connected to Real-time Server");
        });

        // ✅ Handle Real-Time Logic แยกตามประเภทการกระทำ
        socket.on('server_data_update', (payload) => {
            console.log("⚡ Realtime Update:", payload);

            switch (payload.type) {
                // --- กรณีจัดการ Reports ---
                case 'REPORT_ADDED':
                    setReportData(prev => [payload.data, ...prev]);
                    addToast('info', `📝 มีข้อมูลใหม่เข้ามา: ${payload.data.location}`);
                    break;

                case 'REPORT_UPDATED':
                    setReportData(prev => prev.map(item => 
                        item._id === payload.data._id ? payload.data : item
                    ));
                    addToast('info', `✏️ มีการแก้ไขข้อมูล: ${payload.data.location}`);
                    break;

                case 'REPORT_DELETED':
                    setReportData(prev => prev.filter(item => item._id !== payload.id));
                    // ไม่ต้อง Toast ก็ได้ถ้าลบแล้วหายไปเลย หรือจะแจ้งก็ได้
                    break;

                case 'REPORTS_CLEARED':
                    setReportData([]); // ล้าง Array ทันที
                    addToast('error', '⚠️ ข้อมูลทั้งหมดถูกล้างโดยผู้ดูแลระบบ');
                    break;

                // --- กรณีจัดการ Outbreaks ---
                case 'OUTBREAK_ADDED':
                    setOutbreakData(prev => [payload.data, ...prev]);
                    addToast('error', `🚨 แจ้งเตือน: พบจุดเสี่ยงโรคระบาดใหม่!`);
                    break;

                case 'OUTBREAK_DELETED':
                    setOutbreakData(prev => prev.filter(item => item._id !== payload.id));
                    break;

                // --- กรณี Restore ข้อมูล ---
                case 'SYSTEM_RESTORED': // ถ้ามีการทำ event นี้ในอนาคต
                    fetchData(); // กรณีนี้ให้โหลดใหม่ทั้งหมดปลอดภัยสุด
                    break;

                case 'OUTBREAK_UPDATED':
                    setOutbreakData(prev => prev.map(item => 
                        item._id === payload.data._id ? payload.data : item
                    ));
                    addToast('info', `📝 แก้ไขจุดเสี่ยงระบาด: ${payload.data.location}`);
                    break;

                default:
                    break;
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [BASE_URL]);

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
        setHiddenOutbreakIds(prev => 
            prev.includes(id) 
                ? prev.filter(i => i !== id) // ถ้ามีอยู่แล้วให้เอาออก (แสดงกลับมา)
                : [...prev, id]              // ถ้ายังไม่มีให้ใส่เข้าไป (ซ่อน)
        );
    };

    const handleUpdateOutbreak = async (id, updatedData) => {
        try {
            const response = await fetch(`${BASE_URL}/api/outbreaks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                addToast('success', "✅ แก้ไขข้อมูลจุดเสี่ยงสำเร็จ");
                setEditingOutbreak(null); // Clear editing state
            } else {
                addToast('error', "❌ แก้ไขไม่สำเร็จ");
            }
        } catch (error) {
            console.error("Update Outbreak Error:", error);
            addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
    };

    // [เพิ่ม] Helper สำหรับเปิด Modal แก้ไข Outbreak
    const openEditOutbreakModal = (item) => {
        setEditingOutbreak(item);
        setIsOutbreakModalOpen(true);
    };

    // [แก้ไข] Helper สำหรับเปิด Modal เพิ่มใหม่ (ต้อง Clear editing state)
    const openAddOutbreakModal = () => {
        setEditingOutbreak(null);
        setIsOutbreakModalOpen(true);
    };

    // --- 4. API HANDLERS (WITH AUTH HEADER) ---

    const handleAddNewData = async (newRecord, showSuccessAlert = true) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}` // แนบ Token
                },
                body: JSON.stringify({
                    date: newRecord.date,
                    location: newRecord.location,
                    lat: parseFloat(newRecord.lat),
                    long: parseFloat(newRecord.long),
                    district: newRecord.district,
                    subdistrict: newRecord.subdistrict,
                    unit: newRecord.unit,
                    imageUrl: newRecord.imageUrl,
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

            if (response.ok) {
                addToast('success', "✅ บันทึกข้อมูลสำเร็จ!");
            } else {
                addToast('error', "❌ บันทึกไม่สำเร็จ (อาจไม่มีสิทธิ์)");
            }
        } catch (error) {
            console.error("Save Error:", error);
            addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
    };

    const handleUpdateData = async (id, updatedRecord) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(updatedRecord),
            });

            if (response.ok) {
                addToast('success', "✅ แก้ไขข้อมูลสำเร็จ!");
                setEditingItem(null);
            } else {
                addToast('error', "❌ แก้ไขไม่สำเร็จ (อาจไม่มีสิทธิ์)");
            }
        } catch (error) {
            console.error("Update Error:", error);
            addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
    };

    const handleDeleteData = async (id) => {
        if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?")) {
            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });

                if (response.ok) {
                    addToast('success', "✅ ลบข้อมูลสำเร็จ");
                } else {
                    addToast('error', "❌ ลบไม่สำเร็จ (อาจไม่มีสิทธิ์)");
                }
            } catch (error) {
                console.error("Delete Error:", error);
                addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ");
            }
        }
    };

    const handleAddOutbreak = async (data) => {
        try {
            const response = await fetch(`${BASE_URL}/api/outbreaks`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                addToast('success', "🚨 บันทึกจุดเสี่ยงเรียบร้อยแล้ว");
            } else {
                addToast('error', "❌ ไม่สามารถบันทึกข้อมูลได้");
            }
        } catch (error) {
            console.error("Save Outbreak Error", error);
            addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
    };

    const handleDeleteOutbreak = async (id) => {
        if (window.confirm("⚠️ ยืนยันการลบจุดแจ้งเหตุโรคระบาดนี้?")) {
            try {
                const response = await fetch(`${BASE_URL}/api/outbreaks/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });

                if (response.ok) {
                    addToast('success', "✅ ลบจุดแจ้งเหตุเรียบร้อยแล้ว");
                } else {
                    addToast('error', "❌ ไม่สามารถบันทึกข้อมูลได้");
                }
            } catch (error) {
                console.error("Delete Outbreak Error:", error);
                addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ");
            }
        }
    };

    // [แก้ไข] ฟังก์ชันนี้จะแค่เปิด Modal เท่านั้น ไม่ลบเลยทันที
    const handleClearAllData = async () => {
        if (!isSuperAdmin) {
            alert("⛔️ ขออภัย เฉพาะ SuperAdmin เท่านั้นที่มีสิทธิ์ล้างข้อมูลทั้งหมด");
            return;
        }
        // เปิด Modal ถามรหัสผ่าน
        setIsConfirmPasswordOpen(true);
    };

    // [เพิ่ม] ฟังก์ชันลบจริง (รับ password จาก Modal)
    const executeClearAllData = async (passwordInput) => {
        try {
            const response = await fetch(API_URL, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}` 
                },
                body: JSON.stringify({ password: passwordInput }) // ส่งรหัสผ่านไปใน Body
            });

            const result = await response.json();

            if (response.ok) {
                setReportData([]);
                setIsConfirmPasswordOpen(false); // ปิด Modal
                alert(`✅ ${result.message}`);
            } else {
                // กรณีรหัสผิด หรือ Error อื่นๆ
                alert(`❌ เกิดข้อผิดพลาด: ${result.message}`);
            }
        } catch (error) {
            console.error("Clear All Error:", error);
            alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
        }
    };

// --- [ส่วนที่แก้ไข] ฟังก์ชันจำลองข้อมูล 500 เคส ---
    const handleGenerateMockData = () => {
        // เช็คสิทธิ์ก่อน (ถ้าต้องการ) หรือปล่อยให้กดได้เลยเพื่อ Test
        // if (!canEdit) return; 

        if (!window.confirm("⚠️ ยืนยันการจำลองข้อมูล 500 เคส?\n(ข้อมูลนี้จะแสดงผลทันทีแต่ 'ยังไม่ถูกบันทึก' ลงฐานข้อมูลจริง)")) return;

        const newMockData = [];
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1); // ย้อนหลัง 1 ปี

        // Helper สุ่มตัวเลข
        const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        
        // Helper สุ่มพิกัด (กรุงเทพฯ และปริมณฑล)
        // Lat: 13.6 - 13.9, Long: 100.3 - 100.7
        const randCoord = () => ({
            lat: 13.6 + Math.random() * 0.35,
            long: 100.35 + Math.random() * 0.4
        });

        for (let i = 0; i < 500; i++) {
            // สุ่มวันที่
            const date = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
            const dateStr = date.toISOString().split('T')[0];

            // สุ่มข้อมูลพื้นฐาน
            const district = BANGKOK_DISTRICTS[Math.floor(Math.random() * BANGKOK_DISTRICTS.length)];
            const unit = UNIT_TYPES[Math.floor(Math.random() * UNIT_TYPES.length)];
            const coords = randCoord();

            // สุ่มตัวเลขสถิติ (ให้มีความแปรปรวน)
            const stats = {
                vaccine: randInt(0, 50),
                sterilize: randInt(0, 20),
                register: randInt(0, 30),
                microchip: randInt(0, 15),
                medical: randInt(0, 10)
            };

            // สร้าง Mock Object
            newMockData.push({
                _id: `mock-${Date.now()}-${i}`, // ID ปลอมสำหรับ key
                date: dateStr,
                location: `จุดบริการจำลอง ${district} #${i+1}`,
                district: district,
                subdistrict: "แขวงจำลอง",
                unit: unit,
                lat: coords.lat,
                long: coords.long,
                stats: stats,
                imageUrl: "", // ไม่มีรูป
                // สร้าง details ปลอมกัน Error (คำนวณแบบคร่าวๆ)
                details: {
                    dog: { 
                        vaccine: Math.floor(stats.vaccine * 0.6), 
                        maleSterilize: Math.floor(stats.sterilize * 0.3), 
                        femaleSterilize: Math.floor(stats.sterilize * 0.3), 
                        microchip: Math.floor(stats.microchip * 0.7), 
                        register: Math.floor(stats.register * 0.6), 
                        medical: Math.floor(stats.medical * 0.7) 
                    },
                    cat: { 
                        vaccine: Math.floor(stats.vaccine * 0.4), 
                        maleSterilize: Math.floor(stats.sterilize * 0.2), 
                        femaleSterilize: Math.floor(stats.sterilize * 0.2), 
                        microchip: Math.floor(stats.microchip * 0.3), 
                        register: Math.floor(stats.register * 0.4), 
                        medical: Math.floor(stats.medical * 0.3) 
                    },
                    other: { vaccine: 0, medical: 0 }
                }
            });
        }

        // อัปเดต State เพื่อแสดงผลทันที
        setReportData(prev => [...newMockData, ...prev]);
        alert(`✅ สร้างข้อมูลจำลอง 500 เคสเรียบร้อยแล้ว!\n(ข้อมูลจะหายไปเมื่อรีเฟรชหน้าเว็บ)`);
    };

    const handleRestoreSuccess = () => {
        window.location.reload();
    };

    // --- 5. CALCULATIONS & HELPERS (useMemo) ---

    const availableYears = useMemo(() => {
        const years = reportData.map(item => item.date.split('-')[0]);
        return [...new Set(years)].sort().reverse();
    }, [reportData]);

    const filteredData = useMemo(() => {
        return reportData.filter(item => {
            const lowerSearch = searchTerm.toLowerCase();
            const textMatch = !searchTerm || 
                item.location.toLowerCase().includes(lowerSearch) ||
                item.district.includes(searchTerm) || 
                item.subdistrict?.includes(searchTerm);

            let dateMatch = true;
            if (searchDate) {
                dateMatch = item.date === searchDate;
            } else {
                const [itemYear, itemMonth] = item.date.split('-');
                const yearMatch = selectedYear === 'ทั้งหมด' || itemYear === selectedYear;
                const monthMatch = selectedMonth === 'ทั้งหมด' || parseInt(itemMonth) === parseInt(selectedMonth);
                dateMatch = yearMatch && monthMatch;
            }

            const unitMatch = selectedUnit === 'ทั้งหมด' || item.unit === selectedUnit;
            const districtMatch = selectedDistrict === 'ทั้งหมด' || item.district === selectedDistrict;

            return textMatch && dateMatch && unitMatch && districtMatch;
        });
    }, [reportData, selectedYear, selectedMonth, selectedUnit, selectedDistrict, searchTerm, searchDate]);

    const mapDisplayData = useMemo(() => filteredData, [filteredData]);

    const totals = useMemo(() => {
        return filteredData.reduce((acc, curr) => ({
            vaccine: acc.vaccine + (curr.stats.vaccine || 0),
            sterilize: acc.sterilize + (curr.stats.sterilize || 0),
            register: acc.register + (curr.stats.register || 0),
            microchip: acc.microchip + (curr.stats.microchip || 0),
            medical: acc.medical + (curr.stats.medical || 0),
        }), { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 });
    }, [filteredData]);

    const unitStats = useMemo(() => {
        const grouped = filteredData.reduce((acc, curr) => {
            if (!acc[curr.unit]) {
                acc[curr.unit] = { name: curr.unit, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 };
            }
            acc[curr.unit].vaccine += (curr.stats.vaccine || 0);
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
            if (!acc[month]) acc[month] = { name: month, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 };
            acc[month].vaccine += (curr.stats.vaccine || 0);
            acc[month].sterilize += (curr.stats.sterilize || 0);
            acc[month].register += (curr.stats.register || 0);
            acc[month].microchip += (curr.stats.microchip || 0);
            acc[month].medical += (curr.stats.medical || 0);
            acc[month].total += ((curr.stats.vaccine||0) + (curr.stats.sterilize||0) + (curr.stats.register||0) + (curr.stats.microchip||0) + (curr.stats.medical||0));
            return acc;
        }, {});
        
        const last10Months = [];
        for (let i = 9; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthStr = d.toISOString().substring(0, 7);
            last10Months.push(dataMap[monthStr] || { name: monthStr, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 });
        }
        return last10Months;
    }, [filteredData]);

    // [NEW] ดึงปีที่มีทั้งหมดจากข้อมูล Outbreak
    const availableOutbreakYears = useMemo(() => {
        const years = outbreakData.map(item => {
            // ถ้าไม่มีวันที่ ให้ใช้วันปัจจุบันหรือข้ามไป
            return item.date ? item.date.split('-')[0] : null;
        }).filter(y => y !== null);
        return [...new Set(years)].sort().reverse();
    }, [outbreakData]);

    // [NEW] กรองข้อมูล Outbreak ตามปีที่เลือก
    const filteredOutbreaks = useMemo(() => {
        if (outbreakFilterYear === 'ทั้งหมด') return outbreakData;
        return outbreakData.filter(item => item.date && item.date.startsWith(outbreakFilterYear));
    }, [outbreakData, outbreakFilterYear]);

    // [EDIT] แก้ไข outbreakStats ให้คำนวณจาก filteredOutbreaks แทน outbreakData เดิม
    const outbreakStats = useMemo(() => {
        const total = filteredOutbreaks.length; // <-- แก้ตรงนี้เป็น filteredOutbreaks
        const grouped = filteredOutbreaks.reduce((acc, curr) => { // <-- แก้ตรงนี้เป็น filteredOutbreaks
            acc[curr.district] = (acc[curr.district] || 0) + 1;
            return acc;
        }, {});
        const topDistricts = Object.keys(grouped)
            .map(key => ({ name: key, count: grouped[key] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        return { total, topDistricts };
    }, [filteredOutbreaks]); // <-- เปลี่ยน dependency

    const outbreakYearlyTrend = useMemo(() => {
        const stats = outbreakData.reduce((acc, curr) => {
            if (!curr.date) return acc;
            const year = curr.date.split('-')[0]; // ดึงปี YYYY
            acc[year] = (acc[year] || 0) + 1;
            return acc;
        }, {});

        // แปลงเป็น Array และเรียงจากปีเก่า -> ใหม่
        return Object.keys(stats)
            .sort() 
            .map(year => ({
                name: year,
                count: stats[year]
            }));
    }, [outbreakData]);

    // Ranking Logic
    const rankingFilteredData = useMemo(() => {
        return reportData.filter(item => {
            const [itemYear, itemMonth] = item.date.split('-');
            const yearMatch = rankingYear === 'ทั้งหมด' || itemYear === rankingYear;
            const monthMatch = rankingMonth === 'ทั้งหมด' || parseInt(itemMonth) === parseInt(rankingMonth);
            return yearMatch && monthMatch;
        });
    }, [reportData, rankingYear, rankingMonth]);

    const rankingUnitStats = useMemo(() => {
        const grouped = rankingFilteredData.reduce((acc, curr) => {
            if (!acc[curr.unit]) {
                acc[curr.unit] = { name: curr.unit, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 };
            }
            acc[curr.unit].vaccine += (curr.stats.vaccine || 0);
            acc[curr.unit].sterilize += (curr.stats.sterilize || 0);
            acc[curr.unit].register += (curr.stats.register || 0);
            acc[curr.unit].microchip += (curr.stats.microchip || 0);
            acc[curr.unit].medical += (curr.stats.medical || 0);
            acc[curr.unit].total += ((curr.stats.vaccine||0) + (curr.stats.sterilize||0) + (curr.stats.register||0) + (curr.stats.microchip||0) + (curr.stats.medical||0));
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => b.total - a.total);
    }, [rankingFilteredData]);

    const rankingDistrictStats = useMemo(() => {
        const grouped = rankingFilteredData.reduce((acc, curr) => {
            if (!acc[curr.district]) acc[curr.district] = { name: curr.district, total: 0 };
            // รวมทุก stat
            const sum = (curr.stats.vaccine||0) + (curr.stats.sterilize||0) + (curr.stats.register||0) + (curr.stats.microchip||0) + (curr.stats.medical||0);
            acc[curr.district].total += sum;
            return acc;
        }, {});
        // เรียงจากมากไปน้อย และตัดมาแค่ 5 อันดับแรก
        return Object.values(grouped).sort((a, b) => b.total - a.total).slice(0, 5);
    }, [rankingFilteredData]);

    // CSV Logic
// CSV Logic - Import
const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ตรวจสอบว่าเป็นไฟล์ CSV หรือไม่
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        alert("กรุณาอัปโหลดไฟล์นามสกุล .csv เท่านั้น");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const text = event.target.result;
            const lines = text.split('\n');

            // ถ้าไม่มีข้อมูล (มีแค่ Header หรือว่างเปล่า)
            if (lines.length < 2) {
                alert("ไฟล์ไม่มีข้อมูล");
                return;
            }

            let successCount = 0;
            let failCount = 0;

            // แสดง Loading หรือแจ้งเตือนว่ากำลังทำงาน
            const confirmImport = window.confirm(`พบข้อมูล ${lines.length - 1} แถว ต้องการนำเข้าหรือไม่? \n(ระบบจะอ่านข้อมูลรายละเอียดทั้งหมด)`);
            if (!confirmImport) return;

            // วนลูปอ่านข้อมูลทีละแถว (เริ่มที่ i=1 เพื่อข้าม Header)
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // แยกข้อมูลด้วย comma (แบบง่าย) - *หมายเหตุ: ถ้า location มี comma ซ้อนจะซับซ้อนกว่านี้ แต่นี่คือ logic เดิม
                // การใช้ regex เพื่อ split โดยไม่สนใจ comma ใน quote ทำได้ยากใน JS สั้นๆ ถ้าไฟล์ export จากระบบเราเองจะไม่มีปัญหาเพราะเรา replace quote แล้ว
                
                // วิธีแก้เบื้องต้นสำหรับการอ่าน CSV ที่มี Quote ครอบ
                const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
                // ล้างเครื่องหมายจุลภาคท้ายคำ (ถ้ามีจากการ regex) และ Quote
                const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').replace(/,$/, '').trim());

                // [แก้ไข Logic การอ่าน Index ใหม่ เพราะยุบ Lat/Long]
                // 0: Date
                // 1: Location
                // 2: District
                // 3: Subdistrict
                // 4: Unit
                // 5: Coords "Lat, Long"  <-- จุดที่เปลี่ยน
                // 6-10: Total Stats (ขยับขึ้นมา 1 ช่องจากเดิม 5-9 -> 6-10 เป็น 6-10 แทนไหม? ไม่ใช่ ขยับ index ถอยหลังเพราะคอลัมน์หายไป 1)
                
                // Index เดิม: 0-4 (Info), 5-9 (Stats), 10-11 (Lat/Long), 12+ (Details)
                // Index ใหม่: 0-4 (Info), 5 (Combined Coords), 6-10 (Stats), 11+ (Details)

                let lat = 0;
                let long = 0;
                
                // แยกพิกัดออกจากกัน
                if (cleanCols[5]) {
                    const coords = cleanCols[5].split(',');
                    if (coords.length === 2) {
                        lat = parseFloat(coords[0]) || 0;
                        long = parseFloat(coords[1]) || 0;
                    } else {
                        // fallback กรณีไฟล์เก่า (ถ้าเผลอ import ไฟล์เก่า โค้ดนี้อาจเพี้ยนได้ ต้องระวัง)
                        lat = parseFloat(cleanCols[5]) || 0; 
                    }
                }

                const newRecord = {
                    date: cleanCols[0],
                    location: cleanCols[1], // Quote ถูกลบออกแล้วใน cleanCols
                    district: cleanCols[2],
                    subdistrict: cleanCols[3],
                    unit: cleanCols[4],
                    
                    // Stats (Index ขยับจากเดิม 5 เป็น 6)
                    stats: {
                        vaccine: parseInt(cleanCols[6]) || 0,
                        sterilize: parseInt(cleanCols[7]) || 0,
                        register: parseInt(cleanCols[8]) || 0,
                        microchip: parseInt(cleanCols[9]) || 0,
                        medical: parseInt(cleanCols[10]) || 0
                    },
                    
                    lat: lat,
                    long: long,
                    
                    // Details: (Index เริ่มต้นขยับจาก 12 เป็น 11)
                    details: { 
                        dog: { 
                            vaccine: parseInt(cleanCols[11]) || 0,
                            maleSterilize: parseInt(cleanCols[12]) || 0,
                            femaleSterilize: parseInt(cleanCols[13]) || 0,
                            register: parseInt(cleanCols[14]) || 0,
                            microchip: parseInt(cleanCols[15]) || 0, 
                            medical: parseInt(cleanCols[16]) || 0
                        },
                        cat: { 
                            vaccine: parseInt(cleanCols[17]) || 0,
                            maleSterilize: parseInt(cleanCols[18]) || 0,
                            femaleSterilize: parseInt(cleanCols[19]) || 0, 
                            register: parseInt(cleanCols[20]) || 0,
                            microchip: parseInt(cleanCols[21]) || 0,
                            medical: parseInt(cleanCols[22]) || 0
                        },
                        other: { 
                            vaccine: parseInt(cleanCols[23]) || 0, 
                            medical: parseInt(cleanCols[24]) || 0 
                        }
                    }
                };

                // ตรวจสอบข้อมูลจำเป็นเบื้องต้น
                if (!newRecord.date || !newRecord.location) {
                    failCount++;
                    continue;
                }

                // เรียก API เพื่อบันทึกข้อมูล
                try {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${user?.token}` // ใช้ Token จาก State
                        },
                        body: JSON.stringify(newRecord)
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        failCount++;
                        console.error(`Row ${i} failed:`, await response.text());
                    }
                } catch (err) {
                    failCount++;
                    console.error(`Row ${i} error:`, err);
                }
            }

            // สรุปผล
            alert(`นำเข้าข้อมูลเสร็จสิ้น\n✅ สำเร็จ: ${successCount} รายการ\n❌ ล้มเหลว: ${failCount} รายการ`);
            
            // รีโหลดหน้าเว็บเพื่อให้ข้อมูลใหม่แสดงผล
            window.location.reload();

        } catch (error) {
            console.error("CSV Parse Error:", error);
            alert("เกิดข้อผิดพลาดในการอ่านไฟล์ CSV");
        }
    };

    reader.readAsText(file);
};
    
    // --- [UPDATED] Export to CSV Function ---
// --- [UPDATED] Export to CSV Function ---
const exportToCSV = () => {
    // ใช้ข้อมูลที่กรองอยู่ปัจจุบัน (filteredData)
    if (!filteredData || filteredData.length === 0) {
        alert("ไม่มีข้อมูลสำหรับส่งออก (Export)");
        return;
    }

    // 1. [แก้ไข] ปรับ Header ให้ตรงตามความต้องการ
    const headers = [
        "วันที่",
        "สถานที่",
        "เขต",
        "แขวง",
        "หน่วยงาน",
        "พิกัด",
        // --- ส่วนรายละเอียด (Details) ---
        "สุนัข_วัคซีน", "แมว_วัคซีน", "อื่นๆ_วัคซีน", "รวมวัคซีน",
        "สุนัข_ทำหมัน(ผู้)", "สุนัข_ทำหมัน(เมีย)", "แมว_ทำหมัน(ผู้)", "แมว_ทำหมัน(เมีย)", "รวมทำหมัน",
        "สุนัข_ขึ้นทะเบียน", "แมว_ขึ้นทะเบียน", "รวมขึ้นทะเบียน",
        "สุนัข_ฝังไมโครชิป", "แมว_ฝังไมโครชิป", "รวมฝังไมโครชิป",
        "สุนัข_รักษา", "แมว_รักษา", "อื่นๆ_รักษา", "รวมรักษา"
    ];

    // 2. เรียงข้อมูลตามวันที่ (ใหม่ -> เก่า)
    const sortedData = [...filteredData].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    // 3. แปลงข้อมูลเป็น Rows ให้ตรงกับ Header ด้านบน
    const csvRows = sortedData.map(item => {
        // จัดการกรณีที่มีเครื่องหมายคอมมา (,) ในข้อความ ให้ใส่เครื่องหมายคำพูดครอบ
        const safeLocation = item.location ? `"${item.location.replace(/"/g, '""')}"` : "";
        
        // รวมพิกัด และใส่เครื่องหมายคำพูดครอบ
        const combinedCoords = `"${item.lat}, ${item.long}"`; 

        // Helper เพื่อป้องกัน error กรณี details เป็น undefined
        const d = item.details || { dog: {}, cat: {}, other: {} };
        const dog = d.dog || {};
        const cat = d.cat || {};
        const other = d.other || {};

        return [
            // --- ข้อมูลทั่วไป ---
            item.date,
            safeLocation,
            item.district,
            item.subdistrict || "",
            item.unit,
            combinedCoords,

            // --- 1. วัคซีน (Vaccine) ---
            dog.vaccine || 0,
            cat.vaccine || 0,
            other.vaccine || 0,
            item.stats.vaccine || 0, // รวมวัคซีน

            // --- 2. ทำหมัน (Sterilize) ---
            dog.maleSterilize || 0,
            dog.femaleSterilize || 0,
            cat.maleSterilize || 0,
            cat.femaleSterilize || 0,
            item.stats.sterilize || 0, // รวมทำหมัน

            // --- 3. ขึ้นทะเบียน (Register) ---
            dog.register || 0,
            cat.register || 0,
            item.stats.register || 0, // รวมขึ้นทะเบียน

            // --- 4. ฝังไมโครชิป (Microchip) ---
            dog.microchip || 0,
            cat.microchip || 0,
            item.stats.microchip || 0, // รวมไมโครชิป

            // --- 5. รักษา (Medical) ---
            dog.medical || 0,
            cat.medical || 0,
            other.medical || 0,
            item.stats.medical || 0  // รวมรักษา
        ].join(",");
    });

    // 4. รวม Header และ Rows
    const csvString = [headers.join(","), ...csvRows].join("\n");

    // 5. สร้าง Blob พร้อม BOM (\uFEFF) เพื่อให้ Excel อ่านภาษาไทยได้ถูกต้อง
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    
    // 6. สร้างลิงก์ดาวน์โหลด
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `VET_REPORT_${new Date().toISOString().split('T')[0]}.csv`; // ตั้งชื่อไฟล์
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

    // Helpers
    const openAddModal = () => { setEditingItem(null); setIsModalOpen(true); };
    const openEditModal = (item) => { setEditingItem(item); setIsModalOpen(true); };
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        if (percent === 0) return null;
        return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold" fontSize={12}>{`${(percent * 100).toFixed(0)}%`}</text>;
    };

    // --- 6. RENDER UI ---

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 selection:bg-blue-100">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>

            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {/* Modals */}
            <AddDataModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleAddNewData} 
                onUpdate={handleUpdateData} 
                initialData={editingItem} 
                onToast={addToast}
            />
            <CsvActionModal 
                isOpen={isCsvModalOpen} 
                onClose={() => setIsCsvModalOpen(false)} 
                onFileChange={handleFileUpload} 
                onExport={exportToCSV} 
            />
            <AddOutbreakModal 
                isOpen={isOutbreakModalOpen} 
                onClose={() => setIsOutbreakModalOpen(false)} 
                onSave={handleAddOutbreak} 
                onToast={addToast}
            />
            <BackupSystemModal 
                isOpen={isBackupModalOpen} 
                onClose={() => setIsBackupModalOpen(false)} 
                onRestoreSuccess={handleRestoreSuccess}
                token={user?.token}
                apiBaseUrl={BASE_URL}
            />
            <ImagePreviewModal 
                imageUrl={viewImage} 
                onClose={() => setViewImage(null)} 
            />
            
            {/* New Auth Modals */}
            <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={() => setIsLoginModalOpen(false)} 
                onLogin={handleLogin} 
                apiBaseUrl={BASE_URL}  // ✅ เพิ่มบรรทัดนี้
                onToast={addToast}
            />
            <UserManagementModal 
                isOpen={isUserMgmtOpen}
                onClose={() => setIsUserMgmtOpen(false)}
                token={user?.token}
                apiBaseUrl={BASE_URL} // ✅ เพิ่มบรรทัดนี้
                onToast={addToast}
            />
            <PasswordConfirmModal 
                isOpen={isConfirmPasswordOpen}
                onClose={() => setIsConfirmPasswordOpen(false)}
                onConfirm={executeClearAllData}
                title="ล้างข้อมูลทั้งหมด?"
                message="การกระทำนี้ไม่สามารถกู้คืนได้ กรุณายืนยันตัวตน"
            />
            <ChangePasswordModal 
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
                apiBaseUrl={BASE_URL}
                token={user?.token}
                onToast={addToast}
            />
            <ActivityLogModal 
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                token={user?.token}
                apiBaseUrl={BASE_URL}
            />
            <AddOutbreakModal 
                isOpen={isOutbreakModalOpen} 
                onClose={() => setIsOutbreakModalOpen(false)} 
                onSave={handleAddOutbreak}
                onUpdate={handleUpdateOutbreak} // ส่ง function update ไป
                initialData={editingOutbreak}   // ส่งข้อมูลเดิมไป (ถ้ามี)
                onToast={addToast}
            />

            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/90">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
                            <Activity className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-800 leading-tight tracking-tight">ระบบรายงานผลการปฏิบัติงานสัตวแพทย์</h1>
                            <p className="text-xs font-medium text-slate-500">Veterinary & Animal Control Dashboard</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {/* User / Login Section */}
                        {user ? (
                            <div className="flex items-center gap-3 mr-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-bold text-slate-700">{user.username}</span>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide bg-slate-200 px-1.5 rounded">{user.role}</span>
                                </div>
                              <button onClick={() => setIsChangePasswordOpen(true)} className="p-1.5 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-colors" title="เปลี่ยนรหัสผ่าน">
            <Key className="w-3 h-3" />
        </button>
                                <button onClick={handleLogout} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors" title="ออกจากระบบ">
                                    <Lock className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-full shadow hover:bg-slate-900 transition-all">
                                <Unlock className="w-4 h-4" /> เจ้าหน้าที่ Login
                            </button>
                        )}

                        {/* [เพิ่ม] ปุ่มกดดู Logs (แสดงเฉพาะ SuperAdmin) */}
                        {isSuperAdmin && (
                            <button 
                                onClick={() => setIsLogModalOpen(true)} 
                                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all" 
                                title="ดูประวัติการใช้งาน (Logs)"
                            >
                                <FileText className="w-5 h-5" />
                            </button>
                        )}

                        {/* SuperAdmin: Manage Users */}
                        {isSuperAdmin && (
                            <button onClick={() => setIsUserMgmtOpen(true)} className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full" title="จัดการผู้ใช้งาน">
                                <Users className="w-5 h-5" />
                            </button>
                        )}

                        {/* Action Buttons (Visible only if canEdit) */}
                        {canEdit && (
                            <>
                                <button onClick={() => setIsBackupModalOpen(true)} className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full" title="Backup/Restore">
                                    <Database className="w-5 h-5" />
                                </button>
                                <button onClick={() => setIsCsvModalOpen(true)} className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full" title="CSV Import/Export">
                                    <Download className="w-5 h-5" />
                                </button>
                                <button onClick={openAddOutbreakModal} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-md hover:shadow-lg animate-pulse">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="hidden sm:inline">แจ้งโรค</span>
                                </button>
                                <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-full shadow-md hover:shadow-lg">
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline">เพิ่มข้อมูล</span>
                                </button>
                                <button onClick={handleGenerateMockData} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all" title="สร้างข้อมูลจำลองเพื่อทดสอบระบบ">
                                    <Zap className="w-4 h-4 text-yellow-300" />
                                    <span className="hidden sm:inline">จำลอง 500 เคส</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Filters */}
                <div className="space-y-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-slate-400" /></div>
                            <input type="text" className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="ค้นหา..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="relative w-full md:w-auto min-w-[200px]">
                            <input type="date" className="block w-full pl-3 pr-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} />
                            {searchDate && <button onClick={() => setSearchDate('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-red-500 font-bold">ล้างค่า</button>}
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                            <div className="bg-blue-50 p-2 rounded-lg"><Filter className="w-5 h-5 text-blue-600" /></div>
                            <span>ตัวกรองละเอียด :</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
                            <select disabled={!!searchDate} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="ทั้งหมด">ทุกปี</option>
                                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select disabled={!!searchDate} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="ทั้งหมด">ทุกเดือน</option>
                                {THAI_MONTHS.map((m, index) => <option key={index} value={index + 1}>{m}</option>)}
                            </select>
                            <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="ทั้งหมด">ทุกหน่วยงาน</option>
                                {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="ทั้งหมด">ทุกเขต</option>
                                {BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* KPI Cards Section */}
                <KPISection totals={totals} />
                
                {/* Charts: Trend & Units */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600" /> แนวโน้มรายเดือน (10 เดือนล่าสุด)</h2>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={trendData} margin={{top:10, right:10, left:0, bottom:0}}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" tick={{fontSize:12}} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" tick={{fontSize:12}} axisLine={false} tickLine={false} />
                                    <RechartsTooltip />
                                    <Legend />
                                    <Area yAxisId="left" type="monotone" dataKey="total" fill="#e0e7ff" stroke="#6366f1" name="ยอดรวมทั้งหมด" />
                                    <Bar yAxisId="left" dataKey="vaccine" fill="#3b82f6" barSize={10} radius={[4,4,0,0]} name="วัคซีน" />
                                    <Bar yAxisId="left" dataKey="sterilize" fill="#f97316" barSize={10} radius={[4,4,0,0]} name="ทำหมัน" />
                                    <Bar yAxisId="left" dataKey="medical" fill="#ec4899" barSize={10} radius={[4,4,0,0]} name="รักษาสัตว์" />
                                    <Line yAxisId="right" type="monotone" dataKey="register" stroke="#10b981" strokeWidth={2} name="ขึ้นทะเบียน" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-purple-600" /> เปรียบเทียบหน่วย</h2>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={unitStats} layout="vertical" margin={{top:5, right:30, left:20, bottom:5}}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize:10}} axisLine={false} tickLine={false} />
                                    <RechartsTooltip />
                                    <Bar dataKey="total" fill="#8b5cf6" radius={[0,4,4,0]} barSize={15} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Rankings & Map */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Ranking Lists (Updated) */}
                    <div className="lg:col-span-5 space-y-6 flex flex-col">
                        
                        {/* Filters */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2">
                            <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                <Filter className="w-4 h-4 text-yellow-600"/> ตัวกรองการจัดอันดับ
                            </div>
                            <div className="flex gap-2">
                                <select value={rankingYear} onChange={(e) => setRankingYear(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs rounded p-2 flex-1 outline-none focus:ring-1 focus:ring-yellow-400">
                                    <option value="ทั้งหมด">ทุกปี</option>
                                    {availableYears.map(y=><option key={y} value={y}>{y}</option>)}
                                </select>
                                <select value={rankingMonth} onChange={(e) => setRankingMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs rounded p-2 flex-1 outline-none focus:ring-1 focus:ring-yellow-400">
                                    <option value="ทั้งหมด">ทุกเดือน</option>
                                    {THAI_MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* ✅ ตารางอันดับหน่วยงานสูงสุด (แบบละเอียด) */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                            <h2 className="text-md font-bold mb-4 flex items-center gap-2 text-slate-800">
                                <Activity className="w-5 h-5 text-orange-500" /> อันดับหน่วยงานสูงสุด (รวมทุกกิจกรรม)
                            </h2>
                            <div className="overflow-x-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left text-xs min-w-[400px]">
                                    <thead className="bg-slate-50 font-bold text-slate-500 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 rounded-tl-lg rounded-bl-lg text-center w-10">#</th>
                                            <th className="p-3">หน่วยงาน</th>
                                            <th className="p-3 text-center text-blue-600">วัคซีน</th>
                                            <th className="p-3 text-center text-orange-500">ทำหมัน</th>
                                            <th className="p-3 text-center text-purple-600">ชิป</th>
                                            <th className="p-3 text-center text-green-600">ทะเบียน</th>
                                            <th className="p-3 text-center text-rose-600">รักษา</th>
                                            <th className="p-3 text-right rounded-tr-lg rounded-br-lg text-slate-800">รวม</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {rankingUnitStats.map((u, i) => (
                                            <tr key={u.name} className="hover:bg-yellow-50/50 transition-colors group">
                                                <td className="p-3 text-center font-bold">
                                                    <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[10px] ${
                                                        i === 0 ? 'bg-yellow-400 text-white shadow-md shadow-yellow-200' : 
                                                        i === 1 ? 'bg-slate-300 text-white' : 
                                                        i === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        {i + 1}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-bold text-slate-700">{u.name}</td>
                                                <td className="p-3 text-center text-slate-500 group-hover:text-blue-600 transition-colors">{u.vaccine.toLocaleString()}</td>
                                                <td className="p-3 text-center text-slate-500 group-hover:text-orange-500 transition-colors">{u.sterilize.toLocaleString()}</td>
                                                <td className="p-3 text-center text-slate-500 group-hover:text-purple-600 transition-colors">{u.microchip.toLocaleString()}</td>
                                                <td className="p-3 text-center text-slate-500 group-hover:text-green-600 transition-colors">{u.register.toLocaleString()}</td>
                                                <td className="p-3 text-center text-slate-500 group-hover:text-rose-600 transition-colors">{u.medical.toLocaleString()}</td>
                                                <td className="p-3 text-right font-extrabold text-slate-800">{u.total.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ✅ 5 อันดับเขตสูงสุด */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-md font-bold mb-4 flex items-center gap-2 text-slate-800">
                                <CheckCircle className="w-5 h-5 text-indigo-500" /> 5 อันดับเขตสูงสุด
                            </h2>
                            <div className="space-y-4">
                                {rankingDistrictStats.map((item, index) => (
                                    <div key={item.name} className="relative">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xs font-bold text-slate-600">
                                                {index + 1}. {item.name}
                                            </span>
                                            <span className="text-sm font-extrabold text-slate-800">{item.total.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" 
                                                style={{ width: `${(item.total / (rankingDistrictStats[0]?.total || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                                {rankingDistrictStats.length === 0 && (
                                    <p className="text-center text-xs text-slate-400 py-4">ไม่พบข้อมูลในช่วงเวลานี้</p>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Map Section */}
<div className="lg:col-span-7 bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-[56rem] relative z-0">
    <LeafletMap 
        data={mapDisplayData} 
        // [แก้ไข] กรองข้อมูล: ส่งเฉพาะจุดที่ ID ไม่อยู่ในรายการ hiddenOutbreakIds
        outbreaks={filteredOutbreaks.filter(item => !hiddenOutbreakIds.includes(item._id))} 
        onDeleteOutbreak={canEdit ? handleDeleteOutbreak : undefined} 
    />
</div>
                </div>

{/* --- [NEW UI] RABIES OUTBREAK DASHBOARD SECTION --- */}
{outbreakData.length > 0 && (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 mt-8 mb-12">
        
        {/* 1. Header & Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border-l-4 border-red-500">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                    <Siren className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                    <h3 className="text-xl font-extrabold text-slate-800">ศูนย์เฝ้าระวังโรคพิษสุนัขบ้า</h3>
                    <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                        <Activity className="w-3 h-3 text-red-500" /> Rabies Outbreak Monitoring Center
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">กรองข้อมูลปี:</span>
                <select 
                    value={outbreakFilterYear} 
                    onChange={(e) => setOutbreakFilterYear(e.target.value)} 
                    className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer hover:text-red-600 transition-colors"
                >
                    <option value="ทั้งหมด">ข้อมูลสะสมทั้งหมด ({outbreakData.length} เคส)</option>
                    {availableOutbreakYears.map(y => (
                        <option key={y} value={y}>พ.ศ. {y}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* 2. Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Key Stats (4 Columns) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Main Alert Card */}
                <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-6 text-white shadow-xl shadow-red-200 relative overflow-hidden group">
                    {/* Background Decoration */}
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12 duration-700">
                        <Skull className="w-40 h-40" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <p className="text-red-100 text-sm font-bold mb-1">จุดพบเชื้อรวม ({outbreakFilterYear === 'ทั้งหมด' ? 'สะสม' : `ปี ${outbreakFilterYear}`})</p>
                            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        
                        <h2 className="text-7xl font-black tracking-tighter mb-2 mt-2">{outbreakStats.total}</h2>
                        
                        <div className="flex items-center gap-2 mt-4">
                            <span className="text-xs bg-red-800/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 font-medium">
                                พื้นที่เฝ้าระวังพิเศษ (Red Zone)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sub Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Top District Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="text-slate-400 mb-3 flex justify-between">
                            <MapPin className="w-5 h-5" />
                            <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">Top 1</span>
                        </div>
                        <div>
                            <span className="text-xl font-extrabold text-slate-800 block truncate" title={outbreakStats.topDistricts[0]?.name || '-'}>
                                {outbreakStats.topDistricts.length > 0 ? outbreakStats.topDistricts[0].name : '-'}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1">เขตที่พบเชื้อมากที่สุด</p>
                        </div>
                    </div>

                    {/* Latest Date Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="text-slate-400 mb-3 flex justify-between">
                            <Calendar className="w-5 h-5" />
                            <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">Latest</span>
                        </div>
                        <div>
                            <span className="text-xl font-extrabold text-slate-800 block">
                                {filteredOutbreaks.length > 0 
                                    ? new Date(Math.max(...filteredOutbreaks.map(e => new Date(e.date)))).toLocaleDateString('th-TH', {day: 'numeric', month: 'short', year: '2-digit'})
                                    : '-'
                                }
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1">วันที่พบเชื้อล่าสุด</p>
                        </div>
                    </div>
                </div>

                {/* Recent Reports List */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                        <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div>
                            รายการแจ้งเหตุล่าสุด
                        </h4>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar p-2 h-48 lg:h-auto">
                        {/* ... ในส่วน loop รายการแจ้งเหตุ (Recent Reports List) ... */}

{filteredOutbreaks.slice(0, 5).map((item, idx) => {
    // [เพิ่ม] เช็คว่ารายการนี้ถูกซ่อนอยู่หรือไม่
    const isHidden = hiddenOutbreakIds.includes(item._id);

    return (
        <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl transition-all border-b border-slate-50 last:border-0 group cursor-default
            ${isHidden ? 'bg-slate-100 opacity-60 grayscale' : 'hover:bg-red-50/50'}`} // [เพิ่ม] ปรับ Style เมื่อถูกซ่อน
        >
            {/* [เพิ่ม] ปุ่มดวงตาสำหรับ เปิด-ปิด จุดนี้ */}
            <button 
                onClick={(e) => { e.stopPropagation(); toggleOutbreakVisibility(item._id); }}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${isHidden ? 'text-slate-400 hover:text-slate-600' : 'text-blue-400 hover:text-blue-600 hover:bg-blue-50'}`}
                title={isHidden ? "แสดงบนแผนที่" : "ซ่อนจากแผนที่"}
            >
                {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* เลขลำดับ (เหมือนเดิม) */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border font-bold text-xs group-hover:scale-110 transition-transform
                ${isHidden ? 'bg-slate-200 border-slate-300 text-slate-500' : 'bg-red-100 border-red-200 text-red-600'}`}>
                {idx + 1}
            </div>

            {/* ข้อมูล Text (เหมือนเดิม) */}
            <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${isHidden ? 'text-slate-500' : 'text-slate-800'}`}>
                    {item.location} {isHidden && "(ซ่อน)"}
                </p>
                <div className="flex justify-between items-center mt-0.5">
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 rounded">{item.district}</span>
                    <span className="text-[9px] text-slate-400">
                        {new Date(item.date).toLocaleDateString('th-TH', {day: 'numeric', month: 'short', year: '2-digit'})}
                    </span>
                </div>
            </div>

            {/* ปุ่มจัดการ (Edit/Delete) - เหมือนเดิม แต่เพิ่มการ check hidden */}
            {canEdit && !isHidden && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); openEditOutbreakModal(item); }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit className="w-3 h-3" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteOutbreak(item._id); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="ลบ"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
})}
                    </div>
                </div>
            </div>

            {/* Right Column: Analytics Charts (8 Columns) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Chart 1: Top 5 Districts */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                            <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                            5 อันดับเขตพื้นที่เสี่ยงสูงสุด
                        </h4>
                    </div>
                    
                    <div className="h-64 w-full">
                        {outbreakStats.total > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={outbreakStats.topDistricts} margin={{top:0, right:30, left:0, bottom:0}} barSize={28}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={110} tick={{fontSize:12, fontWeight: 600, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                                    <RechartsTooltip 
                                        cursor={{fill: '#fef2f2'}} 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                    />
                                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                        {outbreakStats.topDistricts.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#dc2626' : index === 1 ? '#ea580c' : '#f87171'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                ไม่พบข้อมูลในปีที่เลือก
                            </div>
                        )}
                    </div>
                </div>

                {/* Chart 2: Yearly Trend (Gradient Bar) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                            <div className="w-1 h-6 bg-slate-800 rounded-full"></div>
                            แนวโน้มการระบาดรายปี
                        </h4>
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                            Yearly Trend Analytics
                        </span>
                    </div>

                    <div className="flex-1 min-h-[250px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={outbreakYearlyTrend} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                                <defs>
                                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.6}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <RechartsTooltip 
                                    cursor={{fill: '#f1f5f9'}} 
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                                />
                                <Bar dataKey="count" name="จุดเสี่ยงที่พบ" fill="url(#trendGradient)" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-4 font-medium">เปรียบเทียบสถิติย้อนหลังตามปีที่บันทึกข้อมูล</p>
                </div>

            </div>
        </div>
    </div>
)}

                {/* Main Data Table */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Database className="w-5 h-5 text-slate-600" /> ข้อมูลทั้งหมด</h2>
                        {/* Only SuperAdmin can clear all */}
                        {isSuperAdmin && filteredData.length > 0 && (
                            <button onClick={handleClearAllData} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg border border-red-200">
                                <Trash2 className="w-4 h-4" /> ล้างข้อมูลทั้งหมด
                            </button>
                        )}
                    </div>
                    <div className="overflow-auto max-h-[600px] custom-scrollbar border border-slate-100 rounded-lg relative">
                        <table className="min-w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 whitespace-nowrap">วันที่</th>
                                    <th className="px-4 py-3 whitespace-nowrap">สถานที่</th>
                                    <th className="px-4 py-3 text-center">รูปภาพ</th>
                                    <th className="px-4 py-3 text-center">วัคซีน</th>
                                    <th className="px-4 py-3 text-center">ทำหมัน</th>
                                    <th className="px-4 py-3 text-center">ผู้บันทึก</th>
                                    {/* Action Column visible only if canEdit */}
                                    {canEdit && <th className="px-4 py-3 text-center w-28">จัดการ</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-slate-600">{item.date}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-800">{item.location}</div>
                                            <div className="text-xs text-slate-500">{item.district}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {item.imageUrl ? 
                                                <img src={item.imageUrl} alt="preview" className="w-10 h-10 object-cover rounded mx-auto cursor-pointer hover:scale-150 transition-transform" onClick={()=>setViewImage(item.imageUrl)}/> 
                                                : <span className="text-slate-300">-</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-blue-600">{item.stats.vaccine}</td>
                                        <td className="px-4 py-3 text-center font-bold text-orange-500">{item.stats.sterilize}</td>

                                        <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        <Users className="w-3 h-3 mr-1 text-slate-400"/>
                        {item.createdBy || '-'}
                    </div>
                    {/* (Optional) ถ้าอยากโชว์คนแก้ไขล่าสุดด้วย */}
                    {item.updatedBy && item.updatedBy !== item.createdBy && (
                        <div className="text-[10px] text-slate-400 mt-1">
                            แก้ไข: {item.updatedBy}
                        </div>
                    )}
                </td>

                                        {/* Action Buttons */}
                                        {canEdit && (
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => openEditModal(item)} className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg"><Pencil className="w-4 h-4"/></button>
                                                    <button onClick={() => handleDeleteData(item._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
            <ImagePreviewModal
                imageUrl={viewImage}
                onClose={() => setViewImage(null)}
            />
        </div>
    );
}
