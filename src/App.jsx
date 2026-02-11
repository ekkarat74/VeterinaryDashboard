import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
    Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    Legend, ResponsiveContainer, Area, ComposedChart
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Circle} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { 
    Activity, FileText, MapPin, Filter, Calendar, Database, Download, Users, 
    CheckCircle, Plus, X, Navigation, Upload, Search, Edit, Trash2, Zap, Lock, 
    Unlock, Skull, AlertTriangle, Siren, Key, ChevronRight, Info, Check, AlertCircle, 
    Bell, CalendarDays, Share2,ChevronLeft, Clock, List, Grid, Link, Settings, ChevronDown
} from 'lucide-react';
import L from 'leaflet';
import { io } from "socket.io-client";

// --- Custom Components & Constants (Assumed imports) ---
import KPISection from './components/KPICards';
import UserManagementModal from './components/UserManagementModal';
import {UNIT_TYPES, BANGKOK_DISTRICTS, BANGKOK_SUBDISTRICTS } from './constants/locations';
import AddDataModal from './components/modals/AddDataModal';
import RabiesOutbreakSection from './components/dashboard/RabiesOutbreakSection';
import MainDataTable from './components/dashboard/MainDataTable';
import { exportToCSV, exportOutbreaksToCSV } from './utils/csvUtils';
import ChangePasswordModal from './components/modals/ChangePasswordModal'; // ปรับ path ตามจริง

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

// 6. LoginModal
const LoginModal = ({ isOpen, onClose, onLogin, apiBaseUrl, onToast }) => {
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
                        <input className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700" 
                            placeholder="ชื่อผู้ใช้งาน (Username)" value={username} onChange={e=>setUsername(e.target.value)} />
                    </div>
                    <div className="relative group">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700" 
                            type="password" placeholder="รหัสผ่าน (Password)" value={password} onChange={e=>setPassword(e.target.value)} />
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                            <span>เข้าสู่ระบบ</span><ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <button type="button" onClick={onClose} className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-medium">ยกเลิก</button>
                </form>
            </div>
        </div>
    );
};

// 7. LeafletMap
const LeafletMap = ({ data, outbreaks = [], onDeleteOutbreak }) => {
  const centerPosition = [13.7563, 100.5018];
  const [activeLayers, setActiveLayers] = useState(UNIT_TYPES);
  const [activeRadii, setActiveRadii] = useState([1000, 3000]); 

  const toggleLayer = (unit) => {
    setActiveLayers(prev => prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]);
  };

  const toggleRadius = (radius) => {
    setActiveRadii(prev => prev.includes(radius) ? prev.filter(r => r !== radius) : [...prev, radius]);
  };

  const createDangerIcon = useCallback(() => {
    return L.divIcon({
      className: 'custom-danger-marker',
      html: `<div class="danger-marker-container"><div class="danger-pulse"></div><div class="danger-content"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div></div>`,
      iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20]
    });
  }, []);

  const getMarkerColor = (unit) => {
    switch (unit) {
      case 'หน่วยผู้ว่า': return '#a855f7';
      case 'หน่วยสัตวแพทย์': return '#3b82f6';
      case 'หน่วยวัคซีน + ไมโครชิป': return '#22c55e';
      case 'หน่วยกรงแมว': return '#f97316';
      default: return '#64748b';
    }
  };

  const displayData = useMemo(() => {
    return data.filter(item => activeLayers.includes(item.unit));
  }, [data, activeLayers]);

  const createNumberIcon = (total, color) => {
    const size = total > 999 ? 40 : (total > 99 ? 34 : 28); 
    return L.divIcon({
      className: 'custom-marker-wrapper', 
      html: `<div class="marker-container" style="--marker-color: ${color}; width: ${size}px; height: ${size}px;"><div class="marker-content">${total.toLocaleString()}</div><div class="marker-arrow"></div></div>`,
      iconSize: [size, size], iconAnchor: [size / 2, size + 5], popupAnchor: [0, -(size + 5)]
    });
  };

  return (
    <div className="w-full h-full flex flex-col relative z-0 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100 max-w-[180px] animate-in slide-in-from-right-4">
          <div className="text-xs font-extrabold text-slate-600 mb-1 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Filter className="w-3.5 h-3.5" /> แสดงข้อมูล
          </div>
          {UNIT_TYPES.map((unit) => {
              const color = getMarkerColor(unit);
              const isActive = activeLayers.includes(unit);
              return (
                  <button key={unit} onClick={() => toggleLayer(unit)}
                      className={`text-[10px] py-1.5 px-2 rounded-lg font-bold transition-all flex items-center gap-2 border w-full text-left ${isActive ? 'bg-white shadow-sm ring-1 ring-slate-100' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
                      style={isActive ? { borderLeft: `3px solid ${color}`, color: '#334155' } : { opacity: 0.7 }}>
                      <span className={`w-2 h-2 rounded-full transition-all ${isActive ? 'scale-110' : 'scale-0'}`} style={{ backgroundColor: color }}></span>
                      <span className="truncate">{unit}</span>
                  </button>
              )
          })}
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
                    <button key={r.val} onClick={() => toggleRadius(r.val)}
                        className={`text-[10px] py-1.5 px-2 rounded-lg font-bold transition-all flex items-center gap-2 border w-full text-left ${isActive ? 'bg-red-50 text-red-700 ring-1 ring-red-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
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
          .marker-container { position: relative; display: flex; align-items: center; justify-content: center; transition: transform 0.2s ease-out; cursor: pointer; }
          .marker-container:hover { transform: scale(1.15) translateY(-5px); z-index: 1000; }
          .marker-content { width: 100%; height: 100%; border-radius: 50%; background: var(--marker-color); background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), var(--marker-color)); border: 2px solid white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 11px; font-family: 'Sarabun', sans-serif; text-shadow: 0 1px 2px rgba(0,0,0,0.4); z-index: 2; }
          .marker-arrow { position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg); width: 8px; height: 8px; background-color: var(--marker-color); border-right: 2px solid white; border-bottom: 2px solid white; z-index: 1; }
          .danger-marker-container { position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
          .danger-content { position: relative; z-index: 2; width: 32px; height: 32px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.5); border: 2px solid white; }
          .danger-pulse { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(239, 68, 68, 0.6); border-radius: 50%; animation: pulse-red 1.5s infinite; }
          @keyframes pulse-red { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.0); opacity: 0; } }
      `}</style>

      <div className="flex-1 w-full h-full">
        <MapContainer center={centerPosition} zoom={10} scrollWheelZoom={true} style={{ height: "100%", width: "100%", background: "#f1f5f9", zIndex: 0 }}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <MarkerClusterGroup key={activeLayers.join(',')} chunkedLoading maxClusterRadius={40} spiderfyOnMaxZoom={true}>
            {displayData.map((item) => {
              const lat = parseFloat(item.lat);
              const long = parseFloat(item.long);
              if (isNaN(lat) || isNaN(long) || lat === 0 || long === 0) return null;
              const stats = item.stats || { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 };
              const totalActivity = stats.vaccine + stats.sterilize + stats.register + stats.microchip + (stats.medical || 0);
              const color = getMarkerColor(item.unit);

              return (
                <Marker key={item._id} position={[lat, long]} icon={createNumberIcon(totalActivity, color)}>
                  <Tooltip direction="top" offset={[0, -35]} opacity={1} className="custom-tooltip">
                    <div className="text-center">
                      <span className="font-bold text-slate-800 text-xs block">{item.location}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full inline-block mt-1">รวม: {totalActivity.toLocaleString()}</span>
                    </div>
                  </Tooltip>
                  <Popup>
  <div className="font-sans min-w-[220px] p-0 overflow-hidden">
    {item.imageUrl && (
      <div className="w-full h-32 overflow-hidden relative group cursor-pointer">
        <img src={item.imageUrl} alt="site" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
      </div>
    )}
    <div className="p-3">
      <h3 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{item.unit}</h3>
      <p className="text-[11px] text-slate-500 mb-3 flex items-start gap-1">
        <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" /> 
        {item.location} ({item.district})
      </p>

      {/* --- ส่วนที่เพิ่มและแก้ไข: แสดงรายละเอียดสถิติย่อย --- */}
      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs shadow-inner">
        
        {/* Loop แสดงค่าสถิติแต่ละประเภท ถ้ามีค่ามากกว่า 0 */}
        {[
            { label: 'วัคซีน', val: stats.vaccine, color: 'text-blue-600' },
            { label: 'ทำหมัน', val: stats.sterilize, color: 'text-orange-500' },
            { label: 'ฝังไมโครชิป', val: stats.microchip, color: 'text-green-600' },
            { label: 'ขึ้นทะเบียน', val: stats.register, color: 'text-purple-600' },
            { label: 'รักษาสัตว์', val: stats.medical, color: 'text-rose-600' }
        ].map((stat, idx) => (
            stat.val > 0 && (
                <div key={idx} className="flex justify-between items-center border-b border-slate-200/50 pb-1 last:border-0 last:pb-0">
                    <span className="text-slate-500 font-medium">{stat.label}</span>
                    <span className={`font-bold ${stat.color}`}>{stat.val.toLocaleString()}</span>
                </div>
            )
        ))}

        {/* ส่วนแสดงยอดรวม */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-1">
          <div className="font-extrabold text-slate-900">รวมทั้งหมด</div>
          <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">
            {totalActivity.toLocaleString()}
          </span>
        </div>
      </div>
      {/* ------------------------------------------------ */}

    </div>
  </div>
</Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>

{outbreaks.map((item, index) => {
    const lat = parseFloat(item.lat);
    const long = parseFloat(item.long);
    if (isNaN(lat) || isNaN(long)) return null;

    return (
        <React.Fragment key={item._id || `outbreak-${index}`}>
            {/* --- 1 กม. (ควบคุม): สีแดงเข้ม เส้นทึบหนา --- */}
            {activeRadii.includes(1000) && (
                <Circle 
                    center={[lat, long]} 
                    radius={1000} 
                    pathOptions={{ 
                        color: '#7f1d1d',       // สีเส้นขอบ: แดงเข้มมาก
                        fillColor: '#991b1b',   // สีพื้นที่ด้านใน
                        fillOpacity: 0.2,       
                        weight: 3,              // ความหนาเส้นขอบ
                        opacity: 1,             
                        dashArray: null         // เส้นทึบ
                    }} 
                />
            )}

            {/* --- 3 กม. (เฝ้าระวัง): สีแดงปกติ เส้นทึบ (ลบเส้นประออก) --- */}
            {activeRadii.includes(3000) && (
                <Circle 
                    center={[lat, long]} 
                    radius={3000} 
                    pathOptions={{ 
                        color: '#dc2626',       // สีเส้นขอบ: แดงสด
                        fillColor: '#ef4444',
                        fillOpacity: 0.08, 
                        weight: 2,              // ความหนาเส้นขอบ
                        opacity: 0.8,
                        dashArray: null         // ปรับเป็นเส้นทึบ
                    }} 
                />
            )}

            {/* --- 5 กม. (แจ้งเตือน): สีส้ม เส้นทึบ (ลบเส้นประออก) --- */}
            {activeRadii.includes(5000) && (
                <Circle 
                    center={[lat, long]} 
                    radius={5000} 
                    pathOptions={{ 
                        color: '#ea580c',       // สีเส้นขอบ: ส้มเข้ม
                        fillColor: '#f97316',
                        fillOpacity: 0.05, 
                        weight: 2,              // ความหนาเส้นขอบ
                        opacity: 0.7,
                        dashArray: null         // ปรับเป็นเส้นทึบ
                    }} 
                />
            )}
            <Marker position={[lat, long]} icon={createDangerIcon()}>
                <Popup>
                    <div className="font-sans min-w-[200px] p-2 text-center">
                        <div className="bg-red-50 text-red-600 font-extrabold px-3 py-1 rounded-full text-[10px] inline-flex items-center gap-1 mb-2 border border-red-100 shadow-sm">
                            <AlertTriangle className="w-3 h-3" /> พบเชื้อพิษสุนัขบ้า
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm mb-1">{item.location}</h3>
                        <p className="text-xs text-slate-500 mb-2 border-b border-slate-100 pb-2">เขต{item.district}</p>
                        
                        {/* --- [เพิ่ม] ส่วนแสดงยอดสัตว์ใน Popup --- */}
{(item.stats) && (
    <div className="mb-3 bg-red-50 p-2 rounded border border-red-100">
        <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-bold text-slate-600 mb-1 border-b border-red-200 pb-1">
            <span>ชนิด</span><span>ผู้</span><span>เมีย</span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-[10px] text-center mb-1">
            <span className="text-slate-500">สุนัข</span>
            <span className="text-slate-800">{item.stats.dog?.male || 0}</span>
            <span className="text-slate-800">{item.stats.dog?.female || 0}</span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
            <span className="text-slate-500">แมว</span>
            <span className="text-slate-800">{item.stats.cat?.male || 0}</span>
            <span className="text-slate-800">{item.stats.cat?.female || 0}</span>
        </div>
    </div>
)}

                        {/* Legend ใน Popup (ปรับสีให้ตรงกับวงกลม) */}
                        <div className="grid grid-cols-3 gap-1 text-[9px]">
                            <div className={`rounded p-1 font-bold ${activeRadii.includes(1000) ? 'text-red-900 bg-red-100/50' : 'text-slate-300 bg-slate-50'}`}>1 กม.<br/>ควบคุม</div>
                            <div className={`rounded p-1 font-bold ${activeRadii.includes(3000) ? 'text-red-600 bg-red-50/50' : 'text-slate-300 bg-slate-50'}`}>3 กม.<br/>เฝ้าระวัง</div>
                            <div className={`rounded p-1 font-bold ${activeRadii.includes(5000) ? 'text-orange-500 bg-orange-50/50' : 'text-slate-300 bg-slate-50'}`}>5 กม.<br/>แจ้งเตือน</div>
                        </div>

                        {onDeleteOutbreak && (
                            <button onClick={() => onDeleteOutbreak(item._id)} className="mt-3 w-full flex items-center justify-center gap-1 bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold py-1.5 rounded transition-all shadow-sm hover:shadow">
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

// 9. AddOutbreakModal
const AddOutbreakModal = ({ isOpen, onClose, onSave, onUpdate, initialData, onToast }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        location: '',
        district: BANGKOK_DISTRICTS[0],
        lat: '',
        long: '',
        stats: {
            dog: { male: 0, female: 0 },
            cat: { male: 0, female: 0 }
    }
    });

    // [เพิ่ม] State สำหรับควบคุม Input พิกัด เพื่อให้พิมพ์ลื่นไหล
    const [coordInput, setCoordInput] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    date: initialData.date,
                    location: initialData.location,
                    district: initialData.district,
                    lat: initialData.lat,
                    long: initialData.long,
                    // --- [แก้ไข] ใช้ Optional Chaining (?.) และค่า Default ป้องกัน Crash ---
                    stats: {
                        dog: { 
                            male: initialData.stats?.dog?.male || 0, 
                            female: initialData.stats?.dog?.female || 0 
                        },
                        cat: { 
                            male: initialData.stats?.cat?.male || 0, 
                            female: initialData.stats?.cat?.female || 0 
                        }
                    }
                // -------------------------------------------------------------
                });
            
                if (initialData.lat && initialData.long) {
                    setCoordInput(`${initialData.lat}, ${initialData.long}`);
                } else {
                    setCoordInput("");
                }
            } else {
                // กรณีเพิ่มใหม่
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    location: '',
                    district: BANGKOK_DISTRICTS[0],
                    lat: '',
                    long: '',
                    stats: { dog: { male: 0, female: 0 }, cat: { male: 0, female: 0 } }
                });
                setCoordInput("");
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // [แก้ไข] เพิ่มการตรวจสอบ isNaN เพื่อป้องกัน Database Error
        const payload = {
            ...formData,
            lat: (formData.lat && !isNaN(formData.lat)) ? parseFloat(formData.lat) : 0,
            long: (formData.long && !isNaN(formData.long)) ? parseFloat(formData.long) : 0
        };

        if (initialData) {
            onUpdate(initialData._id, payload);
        } else {
            onSave(payload);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-red-500">
                <div className="bg-red-600 px-6 py-4 flex justify-between items-center text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Skull className="w-6 h-6" /> {initialData ? 'แก้ไขข้อมูลจุดเสี่ยง' : 'บันทึกจุดเกิดเหตุโรคพิษสุนัขบ้า'}
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

                    {/* [แก้ไข] ส่วน Input พิกัดใหม่ */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-red-500" /> พิกัดภูมิศาสตร์ (Latitude, Longitude)
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="เช่น 13.xxxx, 100.xxxx" 
                                className="w-full p-2.5 pl-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none font-mono"
                                // ใช้ coordInput แทน formData โดยตรง
                                value={coordInput} 
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setCoordInput(value); // อัปเดต UI ทันที

                                    // Logic แยกค่า Lat/Long
                                    if (value.includes(',')) {
                                        const parts = value.split(',');
                                        const latVal = parts[0].trim();
                                        const longVal = parts[1] ? parts[1].trim() : '';
                                        setFormData({ ...formData, lat: latVal, long: longVal });
                                    } else {
                                        setFormData({ ...formData, lat: value.trim(), long: '' });
                                    }
                                }}
                            />
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                    </div>

                    {/* --- [เพิ่ม] ส่วนกรอกจำนวนสัตว์ --- */}
<div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
    <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
        <Activity className="w-3 h-3" /> จำนวนสัตว์ที่พบเชื้อ (ตัว)
    </label>
    
    {/* แถวสุนัข */}
    <div className="flex items-center gap-2">
        <span className="text-xs font-bold w-12 text-slate-700">🐶 สุนัข</span>
        <div className="flex-1 flex gap-2">
             <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">ผู้</span>
                <input type="number" min="0" className="w-full pl-6 p-1.5 border border-slate-300 rounded text-sm text-center" 
                    value={formData.stats.dog.male}
                    onChange={e => setFormData({
                        ...formData, 
                        stats: { ...formData.stats, dog: { ...formData.stats.dog, male: parseInt(e.target.value) || 0 } }
                    })}
                />
            </div>
            <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">เมีย</span>
                <input type="number" min="0" className="w-full pl-8 p-1.5 border border-slate-300 rounded text-sm text-center" 
                    value={formData.stats.dog.female}
                    onChange={e => setFormData({
                        ...formData, 
                        stats: { ...formData.stats, dog: { ...formData.stats.dog, female: parseInt(e.target.value) || 0 } }
                    })}
                />
            </div>
        </div>
    </div>

    {/* แถวแมว */}
    <div className="flex items-center gap-2">
        <span className="text-xs font-bold w-12 text-slate-700">🐱 แมว</span>
        <div className="flex-1 flex gap-2">
             <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">ผู้</span>
                <input type="number" min="0" className="w-full pl-6 p-1.5 border border-slate-300 rounded text-sm text-center" 
                    value={formData.stats.cat.male}
                    onChange={e => setFormData({
                        ...formData, 
                        stats: { ...formData.stats, cat: { ...formData.stats.cat, male: parseInt(e.target.value) || 0 } }
                    })}
                />
            </div>
            <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">เมีย</span>
                <input type="number" min="0" className="w-full pl-8 p-1.5 border border-slate-300 rounded text-sm text-center" 
                    value={formData.stats.cat.female}
                    onChange={e => setFormData({
                        ...formData, 
                        stats: { ...formData.stats, cat: { ...formData.stats.cat, female: parseInt(e.target.value) || 0 } }
                    })}
                />
            </div>
        </div>
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

// --- ส่วนที่เพิ่มใหม่: ย้าย StaffInputGroup ออกมาข้างนอก ---
const StaffInputGroup = ({ roleKey, label, staffList, onAdd, onRemove, onChange, color = "bg-slate-50" }) => (
    <div className={`p-3 rounded-lg border border-slate-200 ${color} space-y-2`}>
        <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700">{label}</label>
            <button type="button" onClick={() => onAdd(roleKey)} className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-200 transition">
                + เพิ่มคน
            </button>
        </div>
        {staffList.map((person, idx) => (
            <div key={idx} className="flex gap-2">
                <input 
                    type="text" 
                    placeholder={`ชื่อ-สกุล คนที่ ${idx + 1}`}
                    className="flex-1 p-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                    value={person}
                    onChange={(e) => onChange(roleKey, idx, e.target.value)}
                />
                {staffList.length > 1 && (
                    <button type="button" onClick={() => onRemove(roleKey, idx)} className="text-slate-400 hover:text-red-500">
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>
        ))}
    </div>
);

// 12. DispatchModal (แก้ไข: เรียกใช้ Component ภายนอก)
const DispatchModal = ({ isOpen, onClose, onToast, onSave }) => { 
    // คำนวณวันพรุ่งนี้เป็นค่าเริ่มต้น
    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const UNIT_OPTIONS = [
        { value: 'sterilization', label: 'หน่วยทำหมัน (Sterilization)' },
        { value: 'microchip', label: 'หน่วยวัคซีน + ไมโครชิป' }
    ];

    const [unitType, setUnitType] = useState('sterilization'); 

    const [generalInfo, setGeneralInfo] = useState({
        date: getTomorrowDate(),
        locationName: '',
        mapLink: '',
        departureTime: '07:30',
        closingTime: '12:00',
        note: ''
    });

    const [staff, setStaff] = useState({
        vets: ['', ''],
        registration: [''],
        prep_catch: [''],
        prep_shave: [''],
        prep_lift: [''],
        vaccine_staff: [''],
        surgery_assist: [''],
        drivers: [''],
        assistants: [''] 
    });

    useEffect(() => {
        if (isOpen) {
            setGeneralInfo(prev => ({ ...prev, date: getTomorrowDate() }));
        }
    }, [isOpen]);

    // Helper Functions
    const handleStaffChange = (role, index, value) => {
        const newRoleList = [...staff[role]];
        newRoleList[index] = value;
        setStaff({ ...staff, [role]: newRoleList });
    };

    const addStaffField = (role) => {
        setStaff({ ...staff, [role]: [...staff[role], ''] });
    };

    const removeStaffField = (role, index) => {
        const newRoleList = [...staff[role]];
        newRoleList.splice(index, 1);
        setStaff({ ...staff, [role]: newRoleList });
    };

    if (!isOpen) return null;

    const handleSendLine = () => {
        if (!generalInfo.locationName) {
            alert('กรุณาระบุสถานที่');
            return;
        }

        const formatStaffList = (list) => list.filter(s => s.trim()).join(', ') || '-';
        
        const currentUnitLabel = UNIT_OPTIONS.find(u => u.value === unitType)?.label;
        let staffDetails = "";

        const commonStaff = `👨‍⚕️ สัตวแพทย์: ${formatStaffList(staff.vets)}\n🚐 พนักงานขับรถ: ${formatStaffList(staff.drivers)}`;

        if (unitType === 'sterilization') {
            staffDetails = `
${commonStaff}
📝 ลงทะเบียน: ${formatStaffList(staff.registration)}
🐕 จับ/วางยา: ${formatStaffList(staff.prep_catch)}
✂️ โกนขน: ${formatStaffList(staff.prep_shave)}
💪 ยกสัตว์: ${formatStaffList(staff.prep_lift)}
💉 วัคซีน: ${formatStaffList(staff.vaccine_staff)}
🔪 ผู้ช่วยผ่าตัด: ${formatStaffList(staff.surgery_assist)}`;
        } else if (unitType === 'microchip') {
            staffDetails = `
${commonStaff}
🙋 ผู้ช่วย: ${formatStaffList(staff.assistants)}`;
        }

        const message = `📢 *แจ้งเตือนการออกหน่วย*
📌 *${currentUnitLabel}*
📅 วันที่: ${new Date(generalInfo.date).toLocaleDateString('th-TH')}
📍 สถานที่: ${generalInfo.locationName}
🗺️ แผนที่: ${generalInfo.mapLink || '-'}
⏰ เวลารถออก: ${generalInfo.departureTime} น.
🛑 เวลาปิดหน่วย: ${generalInfo.closingTime} น.
--------------------------------
${staffDetails}
--------------------------------
📝 หมายเหตุ: ${generalInfo.note || '-'}
`;

        const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
        window.open(lineUrl, '_blank');
        if (onToast) onToast('success', 'เปิด Line เรียบร้อยแล้ว');
        onClose();
    };

    const handleSaveLocal = () => {
        const currentUnitLabel = UNIT_OPTIONS.find(u => u.value === unitType)?.label;
        const payload = {
            ...generalInfo,
            unitType,
            staff: staff, 
            title: currentUnitLabel,
            location: generalInfo.locationName,
            time: generalInfo.departureTime,
            team: staff.vets.filter(v => v).join(', ')
        };

        if (onSave) onSave(payload);
        if (onToast) onToast('success', 'บันทึกแผนงานเรียบร้อย');
        onClose();
    };

    // Props ที่ต้องส่งให้ StaffInputGroup (เพื่อลดการเขียนซ้ำ)
    const commonProps = {
        onAdd: addStaffField,
        onRemove: removeStaffField,
        onChange: handleStaffChange
    };

    return (
        <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-2 border-indigo-500 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-indigo-600 px-6 py-3 flex justify-between items-center text-white shrink-0">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Bell className="w-5 h-5" /> บันทึกและแจ้งเตือนออกหน่วย
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="space-y-6">
                        
                        {/* --- Select Dropdown --- */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">ประเภทหน่วยงาน (Unit Type)</label>
                            <div className="relative">
                                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600" />
                                <select 
                                    value={unitType} 
                                    onChange={(e) => setUnitType(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:bg-white transition-colors shadow-sm"
                                >
                                    {UNIT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                            </div>
                        </div>

                        {/* ข้อมูลทั่วไป */}
                        <div className="space-y-4 border-b border-slate-100 pb-6">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Info className="w-4 h-4" /> ข้อมูลการออกหน่วย</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">วันที่ปฏิบัติงาน</label>
                                    <input type="date" className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                                        value={generalInfo.date} onChange={e => setGeneralInfo({ ...generalInfo, date: e.target.value })} />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">เวลารถออก</label>
                                        <input type="time" className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                            value={generalInfo.departureTime} onChange={e => setGeneralInfo({ ...generalInfo, departureTime: e.target.value })} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">เวลาปิดหน่วย</label>
                                        <input type="time" className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                            value={generalInfo.closingTime} onChange={e => setGeneralInfo({ ...generalInfo, closingTime: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">สถานที่ (พิมพ์เอง)</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="text" placeholder="ระบุชื่อสถานที่..." className="w-full pl-9 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={generalInfo.locationName} onChange={e => setGeneralInfo({ ...generalInfo, locationName: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ลิงก์แผนที่ (Google Maps)</label>
                                    <div className="relative">
                                        <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="text" placeholder="วางลิงก์ Google Maps..." className="w-full pl-9 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={generalInfo.mapLink} onChange={e => setGeneralInfo({ ...generalInfo, mapLink: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* รายชื่อผู้ปฏิบัติงาน */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Users className="w-4 h-4" /> รายชื่อผู้ปฏิบัติงาน</h4>
                            
                            {/* ส่วนที่แสดงตลอด */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <StaffInputGroup roleKey="vets" label="👨‍⚕️ ทีมสัตวแพทย์" staffList={staff.vets} color="bg-indigo-50 border-indigo-200" {...commonProps} />
                                <StaffInputGroup roleKey="drivers" label="🚐 พนักงานขับรถ" staffList={staff.drivers} {...commonProps} />
                            </div>

                            {/* แสดงตามประเภทที่เลือก */}
                            {unitType === 'sterilization' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in">
                                    <StaffInputGroup roleKey="registration" label="📝 ลงทะเบียน" staffList={staff.registration} {...commonProps} />
                                    <StaffInputGroup roleKey="prep_catch" label="🐕 เตรียมสัตว์ (จับ/วางยา)" staffList={staff.prep_catch} {...commonProps} />
                                    <StaffInputGroup roleKey="prep_shave" label="✂️ เตรียมสัตว์ (โกนขน)" staffList={staff.prep_shave} {...commonProps} />
                                    <StaffInputGroup roleKey="prep_lift" label="💪 เตรียมสัตว์ (ยกสัตว์)" staffList={staff.prep_lift} {...commonProps} />
                                    <StaffInputGroup roleKey="vaccine_staff" label="💉 ฉีดวัคซีน" staffList={staff.vaccine_staff} {...commonProps} />
                                    <StaffInputGroup roleKey="surgery_assist" label="🔪 ผู้ช่วยผ่าตัด" staffList={staff.surgery_assist} {...commonProps} />
                                </div>
                            )}

                            {unitType === 'microchip' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in">
                                    <StaffInputGroup roleKey="assistants" label="🙋 ผู้ช่วยงานทั่วไป" staffList={staff.assistants} {...commonProps} />
                                </div>
                            )}
                        </div>

                        {/* หมายเหตุ */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">หมายเหตุเพิ่มเติม</label>
                            <textarea rows="2" className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="เช่น เตรียมอุปกรณ์พิเศษ, นัดหมายผู้นำชุมชน..."
                                value={generalInfo.note} onChange={e => setGeneralInfo({ ...generalInfo, note: e.target.value })}></textarea>
                        </div>

                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-2 shrink-0">
                    <button onClick={handleSendLine} className="w-full py-2.5 bg-[#06C755] hover:bg-[#05b64d] text-white rounded-lg font-bold shadow-md flex items-center justify-center gap-2 transition-all">
                        <Share2 className="w-5 h-5" /> ส่งแจ้งเตือนเข้า Line กลุ่ม
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="flex-1 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-50">
                            ยกเลิก
                        </button>
                        <button onClick={handleSaveLocal} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow">
                            บันทึกแผนงาน
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 13. MeetingModal (แก้ไข: รองรับการดู/แก้ไขข้อมูล + ปุ่มลบ)
const MeetingModal = ({ isOpen, onClose, onSave, onDelete, initialData, onToast }) => {
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        link: '',
        details: ''
    });

    // Effect: โหลดข้อมูลเมื่อเปิดแบบแก้ไข
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    title: initialData.title || '',
                    date: initialData.date || '',
                    startTime: initialData.startTime || '',
                    endTime: initialData.endTime || '',
                    link: initialData.link || '',
                    details: initialData.details || ''
                });
            } else {
                setFormData({
                    title: '',
                    date: new Date().toISOString().split('T')[0],
                    startTime: '09:00',
                    endTime: '10:00',
                    link: '',
                    details: ''
                });
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const qrCodeUrl = formData.link 
        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(formData.link)}` 
        : null;

    const handleSendLine = () => {
        if (!formData.title || !formData.link) {
            alert('กรุณาระบุหัวข้อและลิงก์การประชุม');
            return;
        }
        const message = `📢 *นัดหมายการประชุม*
📌 หัวข้อ: ${formData.title}
📅 วันที่: ${new Date(formData.date).toLocaleDateString('th-TH')}
⏰ เวลา: ${formData.startTime} - ${formData.endTime} น.
📝 รายละเอียด: ${formData.details || '-'}
--------------------------------
🔗 ลิงก์เข้าร่วม: ${formData.link}
📱 QR Code (รูป): ${qrCodeUrl}
`;
        const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
        window.open(lineUrl, '_blank');
        if (onToast) onToast('success', 'เปิด Line เพื่อส่งข้อมูลแล้ว');
    };

    const handleSubmit = () => {
        if (!formData.title || !formData.date) {
            alert("กรุณากรอกข้อมูลสำคัญให้ครบ");
            return;
        }
        // ถ้ามี initialData ให้ส่ง ID ไปด้วยเพื่อทำการ Update
        onSave({ ...formData, _id: initialData?._id });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-blue-500 flex flex-col max-h-[90vh]">
                <div className="bg-blue-600 px-6 py-3 flex justify-between items-center text-white shrink-0">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Users className="w-5 h-5" /> {initialData ? 'แก้ไข/ดูรายละเอียดการประชุม' : 'บันทึกการประชุมใหม่'}
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                    {/* ... (Input Fields เดิม เหมือนโค้ดก่อนหน้า) ... */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">หัวข้อการประชุม</label>
                        <input type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="เช่น ประชุมวางแผนประจำเดือน..." />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">วันที่</label>
                            <input type="date" className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1">เริ่ม</label>
                                <input type="time" className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                    value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1">สิ้นสุด</label>
                                <input type="time" className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                    value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                            <Link className="w-3 h-3" /> ลิงก์การประชุม (URL)
                        </label>
                        <input type="url" className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono text-blue-600"
                            value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="https://meet.google.com/..." />
                    </div>

                    {formData.link && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-4">
                            <div className="bg-white p-1 border rounded shrink-0">
                                <img src={qrCodeUrl} alt="Meeting QR" className="w-20 h-20 object-contain" />
                            </div>
                            <div className="text-xs text-slate-500">
                                <p className="font-bold text-slate-700 mb-1">QR Code สำหรับเข้าร่วม</p>
                                <p>สแกนเพื่อเข้าสู่การประชุมได้ทันที</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">รายละเอียดเพิ่มเติม</label>
                        <textarea rows="2" className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}></textarea>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-2">
                    <button onClick={handleSendLine} className="w-full py-2.5 bg-[#06C755] hover:bg-[#05b64d] text-white rounded-lg font-bold shadow-md flex items-center justify-center gap-2 transition-all">
                        <Share2 className="w-5 h-5" /> ส่งข้อมูล + QR เข้า LINE
                    </button>
                    <div className="flex gap-2">
                        {/* ปุ่มลบ (แสดงเฉพาะโหมดแก้ไข) */}
                        {initialData && onDelete && (
                            <button onClick={() => { if(window.confirm('ยืนยันลบนัดหมายนี้?')) { onDelete(initialData._id); onClose(); } }} 
                                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg font-bold text-sm">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={onClose} className="flex-1 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-50">ยกเลิก</button>
                        <button onClick={handleSubmit} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow">
                            {initialData ? 'บันทึกแก้ไข' : 'บันทึกใหม่'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 14. MeetingListModal (เพิ่มใหม่: ตารางประวัติการประชุม)
const MeetingListModal = ({ isOpen, onClose, meetings, onEdit }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2950] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <List className="w-5 h-5 text-teal-400" /> ประวัติการประชุม (Meeting Records)
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-auto p-0 custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 shadow-sm">
                            <tr>
                                <th className="p-4 w-32">วันที่</th>
                                <th className="p-4 w-24">เวลา</th>
                                <th className="p-4">หัวข้อประชุม</th>
                                <th className="p-4 w-48">ลิงก์/QR</th>
                                <th className="p-4 w-24 text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {meetings.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400">ไม่พบข้อมูลการประชุม</td></tr>
                            ) : (
                                meetings.map((m) => (
                                    <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-slate-600">{new Date(m.date).toLocaleDateString('th-TH')}</td>
                                        <td className="p-4 font-medium text-slate-800">{m.startTime} - {m.endTime}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{m.title}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-xs">{m.details}</div>
                                        </td>
                                        <td className="p-4">
                                            {m.link ? (
                                                <a href={m.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-xs">
                                                    <Link className="w-3 h-3" /> เปิดลิงก์
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => { onEdit(m); }} className="text-blue-500 hover:text-blue-700 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:border-blue-300 transition-all">
                                                ดู/แก้ไข
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- NEW COMPONENT: Dispatch Calendar & Dashboard ---
const DispatchCalendarDashboard = ({ isOpen, onClose, onOpenForm, events = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    if (!isOpen) return null;

    // Helper: หาจำนวนวันในเดือน
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    // Helper: หาวันแรกของเดือนเริ่มที่วันอะไร (0=Sunday)
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
        setCurrentDate(new Date(newDate));
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const daysArray = [...Array(daysInMonth + firstDay).keys()];

    // Filter events for selected date
    const selectedDateEvents = events.filter(e => 
        e.date === selectedDate.toISOString().split('T')[0]
    );

    // Stats
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0)).length;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[2900] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <CalendarDays className="w-6 h-6" /> ตารางแผนงานออกหน่วย (Dispatch Dashboard)
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition"><X className="w-6 h-6" /></button>
                </div>

                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden overflow-y-auto lg:overflow-hidden bg-slate-100">
                    {/* Left Panel: Dashboard & Actions */}
                    <div className="w-full lg:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-visible lg:overflow-y-auto order-2 lg:order-1 h-auto lg:h-full">
                        
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <div className="text-slate-500 text-xs font-bold mb-1">งานทั้งหมด</div>
                                <div className="text-2xl font-extrabold text-indigo-600">{totalEvents}</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <div className="text-slate-500 text-xs font-bold mb-1">รอปฏิบัติงาน</div>
                                <div className="text-2xl font-extrabold text-orange-500">{upcomingEvents}</div>
                            </div>
                        </div>

                        {/* Main Action Button */}
                        <button 
                            onClick={onOpenForm}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1"
                        >
                            <Plus className="w-6 h-6" />
                            <span>เข้าบันทึกและแจ้งเตือนออกหน่วย</span>
                        </button>

                        <div className="border-t border-slate-200 pt-4 flex-1">
                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <List className="w-4 h-4" /> รายการวันที่ {selectedDate.toLocaleDateString('th-TH')}
                            </h4>
                            <div className="space-y-3">
                                {selectedDateEvents.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                                        ไม่มีนัดหมายในวันนี้
                                    </div>
                                ) : (
                                    selectedDateEvents.map((evt, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg border-l-4 border-indigo-500 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start">
                                                <div className="font-bold text-slate-800 text-sm">{evt.location}</div>
                                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">{evt.time}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <Users className="w-3 h-3" /> {evt.team}
                                            </div>
                                            {evt.note && <div className="text-[10px] text-slate-400 mt-2 bg-slate-50 p-1 rounded">Note: {evt.note}</div>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Calendar */}
                    <div className="w-full lg:w-2/3 p-4 md:p-6 bg-white flex flex-col order-1 lg:order-2 h-auto lg:h-full min-h-[500px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">
                                {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full border border-slate-200"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">วันนี้</button>
                                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full border border-slate-200"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-t-lg overflow-hidden">
                            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
                                <div key={d} className="bg-slate-50 p-3 text-center text-sm font-bold text-slate-500">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 grid-rows-6 gap-px bg-slate-200 border-x border-b border-slate-200 rounded-b-lg flex-1">
                            {daysArray.map((day, i) => {
                                if (i < firstDay) return <div key={i} className="bg-white/50" />;
                                
                                const dayNum = i - firstDay + 1;
                                const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum).toISOString().split('T')[0];
                                const isToday = dateStr === new Date().toISOString().split('T')[0];
                                const isSelected = dateStr === selectedDate.toISOString().split('T')[0];
                                const dayEvents = events.filter(e => e.date === dateStr);

                                return (
                                    <div 
                                        key={i} 
                                        onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum))}
                                        className={`bg-white p-2 min-h-[80px] cursor-pointer hover:bg-slate-50 transition-colors relative flex flex-col items-start gap-1
                                            ${isSelected ? 'ring-2 ring-inset ring-indigo-500 z-10' : ''}
                                        `}
                                    >
                                        <span className={`
                                            w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                                            ${isToday ? 'bg-red-500 text-white' : 'text-slate-700'}
                                        `}>{dayNum}</span>
                                        
                                        {dayEvents.map((evt, idx) => (
                                            <div key={idx} className="w-full text-[9px] truncate px-1 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium">
                                                {evt.time} {evt.location}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
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
    const [dispatchEvents, setDispatchEvents] = useState([
        // Mockup Data ตัวอย่าง (สามารถลบออกได้ถ้าต้องการเริ่มต้นว่างเปล่า)
        { date: new Date().toISOString().split('T')[0], time: '09:00', location: 'วัดดอนเมือง', team: 'ทีม 1', note: 'ฉีดวัคซีน' },
        { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '13:00', location: 'ชุมชนร่มไทร', team: 'ทีม 2', note: 'ทำหมัน' }
    ]);

    // --- เพิ่ม State สำหรับการประชุม ---
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [meetings, setMeetings] = useState([]);
    const [isMeetingListOpen, setIsMeetingListOpen] = useState(false); // เพิ่ม State เปิด/ปิด List
    const [viewingMeeting, setViewingMeeting] = useState(null);

    const handleSaveDispatchEvent = (newEvent) => {
        setDispatchEvents(prev => [...prev, newEvent]);
        // ถ้าต้องการเปิดหน้าปฏิทินทันทีหลังจากบันทึก ให้ uncomment บรรทัดล่าง
        // setIsCalendarOpen(true); 
    };

    const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);

    const [csvMode, setCsvMode] = useState('report');
    
    // --- 2. AUTHENTICATION LOGIC ---

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
        ...dispatchEvents, 
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
            // กรณีเป็น Dispatch Event (ถ้าต้องการให้ดูได้ด้วยก็เพิ่ม logic ตรงนี้)
            alert(`รายละเอียดงาน: ${evt.location}\nทีม: ${evt.team}`);
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

    const availableYears = useMemo(() => [...new Set(reportData.map(item => item.date.split('-')[0]))].sort().reverse(), [reportData]);

    const filteredData = useMemo(() => {
        return reportData.filter(item => {
            const lowerSearch = searchTerm.toLowerCase();
            const textMatch = !searchTerm || item.location.toLowerCase().includes(lowerSearch) || item.district.includes(searchTerm) || item.subdistrict?.includes(searchTerm);
            let dateMatch = true;
            if (searchDate) { dateMatch = item.date === searchDate; } 
            else {
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

    const totals = useMemo(() => filteredData.reduce((acc, curr) => ({
        vaccine: acc.vaccine + (curr.stats.vaccine || 0), sterilize: acc.sterilize + (curr.stats.sterilize || 0), register: acc.register + (curr.stats.register || 0),
        microchip: acc.microchip + (curr.stats.microchip || 0), medical: acc.medical + (curr.stats.medical || 0),
    }), { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 }), [filteredData]);

    const unitStats = useMemo(() => {
        const grouped = filteredData.reduce((acc, curr) => {
            if (!acc[curr.unit]) acc[curr.unit] = { name: curr.unit, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 };
            acc[curr.unit].vaccine += (curr.stats.vaccine || 0); acc[curr.unit].sterilize += (curr.stats.sterilize || 0); acc[curr.unit].register += (curr.stats.register || 0);
            acc[curr.unit].microchip += (curr.stats.microchip || 0); acc[curr.unit].medical += (curr.stats.medical || 0);
            acc[curr.unit].total += ((curr.stats.vaccine||0) + (curr.stats.sterilize||0) + (curr.stats.register||0) + (curr.stats.microchip||0) + (curr.stats.medical||0));
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => b.total - a.total);
    }, [filteredData]);

    const trendData = useMemo(() => {
        const dataMap = filteredData.reduce((acc, curr) => {
            const month = curr.date.substring(0, 7);
            if (!acc[month]) acc[month] = { name: month, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 };
            acc[month].vaccine += (curr.stats.vaccine || 0); acc[month].sterilize += (curr.stats.sterilize || 0); acc[month].register += (curr.stats.register || 0);
            acc[month].microchip += (curr.stats.microchip || 0); acc[month].medical += (curr.stats.medical || 0);
            acc[month].total += ((curr.stats.vaccine||0) + (curr.stats.sterilize||0) + (curr.stats.register||0) + (curr.stats.microchip||0) + (curr.stats.medical||0));
            return acc;
        }, {});
        const last10Months = [];
        for (let i = 9; i >= 0; i--) {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            const monthStr = d.toISOString().substring(0, 7);
            last10Months.push(dataMap[monthStr] || { name: monthStr, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 });
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

    const rankingFilteredData = useMemo(() => reportData.filter(item => {
        const [itemYear, itemMonth] = item.date.split('-');
        return (rankingYear === 'ทั้งหมด' || itemYear === rankingYear) && (rankingMonth === 'ทั้งหมด' || parseInt(itemMonth) === parseInt(rankingMonth));
    }), [reportData, rankingYear, rankingMonth]);

    const rankingUnitStats = useMemo(() => {
        const grouped = rankingFilteredData.reduce((acc, curr) => {
            if (!acc[curr.unit]) acc[curr.unit] = { name: curr.unit, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 };
            acc[curr.unit].vaccine += (curr.stats.vaccine || 0); acc[curr.unit].sterilize += (curr.stats.sterilize || 0); acc[curr.unit].register += (curr.stats.register || 0);
            acc[curr.unit].microchip += (curr.stats.microchip || 0); acc[curr.unit].medical += (curr.stats.medical || 0);
            acc[curr.unit].total += ((curr.stats.vaccine||0) + (curr.stats.sterilize||0) + (curr.stats.register||0) + (curr.stats.microchip||0) + (curr.stats.medical||0));
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => b.total - a.total);
    }, [rankingFilteredData]);

    const rankingDistrictStats = useMemo(() => {
        const grouped = rankingFilteredData.reduce((acc, curr) => {
            if (!acc[curr.district]) acc[curr.district] = { name: curr.district, total: 0 };
            acc[curr.district].total += ((curr.stats.vaccine||0) + (curr.stats.sterilize||0) + (curr.stats.register||0) + (curr.stats.microchip||0) + (curr.stats.medical||0));
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
        if (year > 2400) year -= 543; // แปลง พ.ศ. เป็น ค.ศ.
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
                onSave={handleSaveDispatchEvent} // เพิ่ม prop นี้
            />
            <DispatchCalendarDashboard 
                isOpen={isCalendarOpen} 
                onClose={() => setIsCalendarOpen(false)}
                events={combinedEvents} 
                onOpenForm={() => {
                   setViewingMeeting(null); // Reset เป็นเพิ่มใหม่
                   setIsDispatchModalOpen(true);
                }}
                onEventClick={handleCalendarEventClick} // ส่ง Handler ไป
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
            
{/* --- HEADER แบบ Dropdown System Tools --- */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between py-3 md:h-20 md:py-0 gap-3 md:gap-4">
                    
                    {/* 1. Logo & Brand */}
                    <div className="w-full md:w-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg shadow-lg shadow-blue-500/20 shrink-0">
                                <Activity className="text-white w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-base font-extrabold text-slate-800 leading-tight">
                                    ระบบรายงานสัตวแพทย์
                                </h1>
                                <p className="text-[10px] font-medium text-slate-500">
                                    Veterinary & Animal Control
                                </p>
                            </div>
                        </div>

                        {/* Mobile Profile (แสดงเฉพาะมือถือ) */}
                        <div className="flex md:hidden items-center gap-2">
                             {user && (
                                <button onClick={handleLogout} className="p-2 text-slate-400 bg-slate-50 border border-slate-100 rounded-full hover:bg-red-50 hover:text-red-600 transition">
                                    <Unlock className="w-4 h-4" />
                                </button>
                             )}
                        </div>
                    </div>

                    {/* 2. Controls & Actions */}
                    <div className="w-full md:w-auto flex flex-wrap items-center justify-center md:justify-end gap-2">
                        
                        {/* --- NEW: System Tools Dropdown (รวมปุ่มระบบไว้ที่นี่) --- */}
                        {user && (isSuperAdmin || canEdit) && (
                            <div className="relative">
                                <button 
                                    onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all font-bold text-xs shadow-sm
                                        ${isSystemMenuOpen 
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 ring-2 ring-indigo-100' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                                        }`}
                                >
                                    {/* ใช้ icon Settings (ฟันเฟือง) ถ้าไม่มีใช้ Database แทนได้ */}
                                    <Settings className="w-4 h-4" />
                                    <span>เครื่องมือ</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isSystemMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isSystemMenuOpen && (
                                    <>
                                        {/* Backdrop สำหรับปิดเมื่อกดข้างนอก */}
                                        <div className="fixed inset-0 z-[40]" onClick={() => setIsSystemMenuOpen(false)}></div>
                                        
                                        {/* ตัวเมนู */}
                                        <div className="absolute top-full left-0 md:left-auto md:right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-[50] p-1.5 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                                            <div className="px-3 py-2 bg-slate-50 rounded-lg mb-1 border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Management</p>
                                            </div>

                                            {isSuperAdmin && (
                                                <>
                                                    <button onClick={() => { setIsLogModalOpen(true); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-left">
                                                        <FileText className="w-4 h-4 text-slate-400" /> ประวัติการใช้งาน (Logs)
                                                    </button>
                                                    <button onClick={() => { setIsUserMgmtOpen(true); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-left">
                                                        <Users className="w-4 h-4 text-slate-400" /> จัดการผู้ใช้งาน
                                                    </button>
                                                    <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                                </>
                                            )}

                                            {canEdit && (
                                                <>
                                                    <button onClick={() => { setIsBackupModalOpen(true); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors text-left">
                                                        <Database className="w-4 h-4 text-emerald-500" /> สำรอง/กู้คืนข้อมูล
                                                    </button>
                                                    <button onClick={() => { 
                                                        setCsvMode('outbreak'); // ตั้งโหมดเป็น outbreak
                                                        setIsCsvModalOpen(true); 
                                                        setIsSystemMenuOpen(false); 
                                                    }} 
                                                    className="w-full flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-left">
                                                        <Download className="w-4 h-4 text-red-500" /> นำเข้า/ส่งออก จุดระบาด (CSV)
                                                    </button>
                                                    <button onClick={() => { 
                                                        setCsvMode('report'); // ตั้งโหมดเป็น report (ข้อมูลทั่วไป)
                                                        setIsCsvModalOpen(true); 
                                                        setIsSystemMenuOpen(false); 
                                                    }} 
                                                    className="w-full flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors text-left">
                                                        <Download className="w-4 h-4 text-emerald-500" /> นำเข้า/ส่งออก รายงาน (CSV)
                                                    </button>
                                                    <button onClick={() => { handleGenerateMockData(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors text-left">
                                                        <Zap className="w-4 h-4 text-purple-500" /> จำลองข้อมูล (Mock Data)
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        {/* -------------------------------------------------- */}

                        {/* View Tools Group */}
                        {user && (
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                                <button onClick={() => setIsMeetingListOpen(true)} className="p-2 hover:bg-slate-50 text-slate-600 rounded-md transition relative group" title="ประวัติการประชุม">
                                    <List className="w-4 h-4" />
                                    {/* Tooltip on hover */}
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">ประวัติประชุม</span>
                                </button>
                                <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
                                <button onClick={() => setIsCalendarOpen(true)} className="p-2 hover:bg-slate-50 text-slate-600 rounded-md transition relative group" title="ปฏิทิน">
                                    <CalendarDays className="w-4 h-4" />
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">ตารางงาน</span>
                                </button>
                            </div>
                        )}

                        {/* Main Actions */}
                        {user && canEdit && (
                            <>
                                <button onClick={() => setIsMeetingModalOpen(true)} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white p-2 md:px-3 md:py-2 rounded-lg shadow-sm transition-all active:scale-95">
                                    <Users className="w-4 h-4" />
                                    <span className="hidden sm:inline text-xs font-bold">นัดประชุม</span>
                                </button>

                                <button onClick={openAddOutbreakModal} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-2 md:px-3 md:py-2 rounded-lg shadow-sm transition-all active:scale-95">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="hidden sm:inline text-xs font-bold">แจ้งโรค</span>
                                </button>

                                <button onClick={openAddModal} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white p-2 md:px-3 md:py-2 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95">
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline text-xs font-bold">เพิ่มข้อมูล</span>
                                </button>
                            </>
                        )}
                        
                        {!user && (
                            <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-lg transition-all w-full justify-center md:w-auto">
                                <Unlock className="w-4 h-4" />
                                <span>เข้าสู่ระบบเจ้าหน้าที่</span>
                            </button>
                        )}

                         {/* Desktop Profile (ซ่อนบนมือถือ) */}
                         {user && (
                            <div className="hidden md:flex ml-2 pl-2 border-l border-slate-200 items-center gap-1">
                                <div className="flex flex-col items-end mr-2">
                                    <span className="text-[10px] font-bold text-slate-700 leading-none">{user.username}</span>
                                    <span className="text-[9px] text-slate-400 uppercase leading-none">{user.role}</span>
                                </div>
                                <button onClick={() => setIsChangePasswordOpen(true)} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors" title="เปลี่ยนรหัสผ่าน">
                                    <Key className="w-4 h-4" />
                                </button>
                                <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="ออกจากระบบ">
                                    <Unlock className="w-4 h-4" />
                                </button>
                            </div>
                         )}

                    </div>
                </div>
            </div>
        </header>
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                            <div className="bg-blue-50 p-2 rounded-lg"><Filter className="w-5 h-5 text-blue-600" /></div><span>ตัวกรองละเอียด :</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
                            <select disabled={!!searchDate} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="ทั้งหมด">ทุกปี</option>{availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select disabled={!!searchDate} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="ทั้งหมด">ทุกเดือน</option>{THAI_MONTHS.map((m, index) => <option key={index} value={index + 1}>{m}</option>)}
                            </select>
                            <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="ทั้งหมด">ทุกหน่วยงาน</option>{UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="ทั้งหมด">ทุกเขต</option>{BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <KPISection totals={totals} />

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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5 space-y-6 flex flex-col">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2">
                            <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                <Filter className="w-4 h-4 text-yellow-600"/> ตัวกรองการจัดอันดับ
                            </div>
                            <div className="flex gap-2">
                                <select value={rankingYear} onChange={(e) => setRankingYear(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs rounded p-2 flex-1 outline-none focus:ring-1 focus:ring-yellow-400">
                                    <option value="ทั้งหมด">ทุกปี</option>{availableYears.map(y=><option key={y} value={y}>{y}</option>)}
                                </select>
                                <select value={rankingMonth} onChange={(e) => setRankingMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs rounded p-2 flex-1 outline-none focus:ring-1 focus:ring-yellow-400">
                                    <option value="ทั้งหมด">ทุกเดือน</option>{THAI_MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                            <h2 className="text-md font-bold mb-4 flex items-center gap-2 text-slate-800"><Activity className="w-5 h-5 text-orange-500" /> อันดับหน่วยงานสูงสุด (รวมทุกกิจกรรม)</h2>
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
                                                    <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[10px] ${i === 0 ? 'bg-yellow-400 text-white shadow-md shadow-yellow-200' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</span>
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

                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-md font-bold mb-4 flex items-center gap-2 text-slate-800"><CheckCircle className="w-5 h-5 text-indigo-500" /> 5 อันดับเขตสูงสุด</h2>
                            <div className="space-y-4">
                                {rankingDistrictStats.map((item, index) => (
                                    <div key={item.name} className="relative">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xs font-bold text-slate-600">{index + 1}. {item.name}</span>
                                            <span className="text-sm font-extrabold text-slate-800">{item.total.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" style={{ width: `${(item.total / (rankingDistrictStats[0]?.total || 1)) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                                {rankingDistrictStats.length === 0 && <p className="text-center text-xs text-slate-400 py-4">ไม่พบข้อมูลในช่วงเวลานี้</p>}
                            </div>
                        </div>
                    </div>

                    
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
                
                <MainDataTable 
                    data={filteredData} canEdit={canEdit} isSuperAdmin={isSuperAdmin} 
                    onClearAll={handleClearAllData} onEdit={openEditModal} onDelete={handleDeleteData} onViewImage={setViewImage} 
                />
            </main>
        </div>
    );
}
