import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
    Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, ComposedChart, Brush
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Circle} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
//import 'leaflet.markercluster/dist/MarkerCluster.css';
//import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { 
    Activity, Syringe, Scissors, FileText, MapPin, 
    Filter, Calendar, Database, Download, Users, 
    Map as MapIcon, ChevronDown, CheckCircle, Plus, X, Save,
    Calculator, Navigation, LocateFixed, Upload, Search, Pencil, Edit, 
    Trash2, Zap, Eye, Lock, Unlock, Image as ImageIcon, Skull, AlertTriangle, 
    Siren, Stethoscope, Key, ChevronRight, RotateCw, Printer, ChevronLeft, 
    Bell
} from 'lucide-react';
import L from 'leaflet';

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

// --- COMPONENTS ---

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
                onClose();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert(`Login Failed: ไม่สามารถเชื่อมต่อ Server ได้ที่ ${apiBaseUrl}`);
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

// --- [UI UPGRADE] UserManagementModal ---
const UserManagementModal = ({ isOpen, onClose, token, apiBaseUrl }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("admin");
    const [userList, setUserList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) fetchUsers();
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${apiBaseUrl}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserList(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiBaseUrl}/api/users`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username, password, role })
            });
            if (res.ok) {
                setUsername(""); setPassword(""); fetchUsers();
            } else {
                const data = await res.json();
                alert(data.message || "สร้างไม่สำเร็จ");
            }
        } catch (error) { alert("เชื่อมต่อ Server ไม่ได้"); }
    };

    const handleUpdateRole = async (userId, newRole) => {
        if(!window.confirm(`เปลี่ยนสิทธิ์เป็น ${newRole}?`)) return;
        try {
            const res = await fetch(`${apiBaseUrl}/api/users/${userId}/role`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) fetchUsers();
        } catch (error) { alert("Error connecting"); }
    };

    const handleDeleteUser = async (userId) => {
        if(!window.confirm("ยืนยันการลบผู้ใช้งานนี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;
        
        try {
            const res = await fetch(`${apiBaseUrl}/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                // ลบสำเร็จ ให้โหลดข้อมูลใหม่
                fetchUsers();
            } else {
                alert("ไม่สามารถลบได้ (อาจไม่มีสิทธิ์)");
            }
        } catch (error) { 
            console.error(error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ"); 
        }
    };

    // Helper: Badge Style
    const getRoleBadgeStyle = (r) => {
        switch(r) {
            case 'superadmin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'admin': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg">
                            <Users className="w-5 h-5 text-blue-400"/>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">จัดการผู้ใช้งานระบบ</h2>
                            <p className="text-slate-400 text-xs">สำหรับผู้ดูแลระบบสูงสุด (SuperAdmin)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    
                    {/* Left: Create Form */}
                    <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4 text-green-600"/> เพิ่มผู้ใช้ใหม่
                            </h3>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">ชื่อผู้ใช้ (Username)</label>
                                    <input className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-shadow" 
                                        value={username} onChange={e=>setUsername(e.target.value)} required placeholder="ระบุชื่อผู้ใช้" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">รหัสผ่าน (Password)</label>
                                    <input className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-shadow" 
                                        type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="ระบุรหัสผ่าน" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">ระดับสิทธิ์ (Role)</label>
                                    <div className="relative">
                                        <select className="w-full p-2.5 border border-slate-200 rounded-lg bg-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-700" 
                                            value={role} onChange={e=>setRole(e.target.value)}>
                                            <option value="admin">Admin (แก้ไขข้อมูลได้)</option>
                                            <option value="superadmin">SuperAdmin (สิทธิ์สูงสุด)</option>
                                            <option value="user">User (ดูได้อย่างเดียว)</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2">
                                    <CheckCircle className="w-4 h-4"/> สร้างบัญชีผู้ใช้
                                </button>
                            </form>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 space-y-2">
                            <p className="font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> คำแนะนำ:</p>
                            <ul className="list-disc pl-4 space-y-1 opacity-80">
                                <li>SuperAdmin: จัดการ Users และลบข้อมูลทั้งหมดได้</li>
                                <li>Admin: เพิ่ม/แก้ไข/ลบ ข้อมูลทั่วไปได้</li>
                                <li>User: ดู Dashboard ได้อย่างเดียว</li>
                            </ul>
                        </div>
                    </div>

                    {/* Right: User List Table */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Database className="w-4 h-4 text-slate-400"/> รายชื่อในระบบ <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{userList.length}</span>
                            </h3>
                            <button onClick={fetchUsers} className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50">
                                <RotateCw className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 w-16 text-center">Avatar</th>
                                        <th className="p-4">Username</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoading ? (
                                        <tr><td colSpan="4" className="p-8 text-center text-slate-400">กำลังโหลดข้อมูล...</td></tr>
                                    ) : userList.length === 0 ? (
                                        <tr><td colSpan="4" className="p-8 text-center text-slate-400">ไม่พบข้อมูลผู้ใช้งาน</td></tr>
                                    ) : (
                                        userList.map(u => (
                                            <tr key={u._id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-3 text-center">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs mx-auto">
                                                        {u.username.substring(0,2).toUpperCase()}
                                                    </div>
                                                </td>
                                                <td className="p-3 font-semibold text-slate-700">{u.username}</td>
                                                <td className="p-3">
                                                    <select 
                                                        className={`text-xs font-bold px-2 py-1 rounded-full border outline-none cursor-pointer appearance-none text-center min-w-[100px] transition-colors ${getRoleBadgeStyle(u.role)}`}
                                                        value={u.role}
                                                        onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                                                    >
                                                        <option value="superadmin">SuperAdmin</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="user">User</option>
                                                    </select>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button onClick={() => handleDeleteUser(u._id)}
                                                        // หมายเหตุ: ลบ opacity-0 ออกเพื่อให้เห็นปุ่มตลอดเวลา
                                                        className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
                                                        title="ลบผู้ใช้"
                                                    >
                                                        <Trash2 className="w-4 h-4"/>
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

// ✅ เพิ่ม onDeleteOutbreak ลงในวงเล็บปีกกา
const LeafletMap = ({ data, outbreaks = [], onDeleteOutbreak }) => {
  const centerPosition = [13.7563, 100.5018];

  const [activeLayers, setActiveLayers] = useState(UNIT_TYPES);

  const toggleLayer = (unit) => {
    setActiveLayers(prev => 
      prev.includes(unit) 
        ? prev.filter(u => u !== unit) 
        : [...prev, unit]              
    );
  };

  // ใช้ useCallback เพื่อประสิทธิภาพ (ตามที่แนะนำก่อนหน้า)
  const createDangerIcon = useCallback(() => {
    return L.divIcon({
      className: 'custom-danger-marker',
      html: `
        <div class="danger-marker-container">
          <div class="danger-pulse"></div>
          <div class="danger-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
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

  const createNumberIcon = useCallback((total, color) => {
    const size = total > 999 ? 32 : 28;
    return L.divIcon({
      className: 'custom-marker-wrapper', 
      html: `
        <div class="marker-container" style="--marker-color: ${color}; width: ${size}px; height: ${size}px;">
          <div class="marker-content">
            ${total.toLocaleString()}
          </div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 5)]
    });
  }, []);

  return (
    <div className="w-full h-full flex flex-col relative z-0">
      
      {/* Filter Bar controls */}
        <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-100 max-w-[200px]">
            <div className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> กรองบนแผนที่
            </div>
            {UNIT_TYPES.map((unit) => {
                const color = getMarkerColor(unit);
                const isActive = activeLayers.includes(unit);
                return (
                    <button
                        key={unit}
                        onClick={() => toggleLayer(unit)}
                        className={`text-[10px] py-1.5 px-3 rounded-lg font-bold transition-all flex items-center gap-2 border w-full text-left
                            ${isActive 
                                ? 'bg-white shadow-sm' 
                                : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100 grayscale'
                            }
                        `}
                        style={isActive ? { borderColor: color, color: '#334155' } : {}}
                    >
                        <span 
                            className={`w-2.5 h-2.5 rounded-full shadow-sm transition-transform ${isActive ? 'scale-100' : 'scale-0'}`}
                            style={{ backgroundColor: color }}
                        ></span>
                        <span className="truncate">{unit}</span>
                    </button>
                )
            })}
        </div>

        <style>{`
            .custom-marker-wrapper { background: transparent; border: none; }
        
            .marker-container {
            position: relative; display: flex; align-items: center; justify-content: center;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
            cursor: pointer;
            }

            .marker-container:hover { transform: scale(1.2); z-index: 1000; }

            .marker-content {
            width: 100%; height: 100%; border-radius: 50%;
            background-color: var(--marker-color);
            background: radial-gradient(circle, var(--marker-color) 30%, rgba(255,255,255,0.8) 150%);
            border: none;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
            display: flex; align-items: center; justify-content: center;
            color: white; 
            font-weight: 800; 
            font-size: 11px; 
            font-family: 'Sarabun', sans-serif;
            position: relative; z-index: 2;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
            .danger-marker-container {
            position: relative; width: 40px; height: 40px;
            display: flex; align-items: center; justify-content: center;
            }
            .danger-content {
            position: relative; z-index: 2;
            width: 30px; height: 30px; background: #ef4444; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 2px solid white;
            }
            .danger-pulse {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(239, 68, 68, 0.5); border-radius: 50%;
            animation: pulse-red 1.5s infinite;
            }
            @keyframes pulse-red {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
            }
            @keyframes shimmer {
            100% {
                transform: translateX(100%);
                }
            }
        `}</style>

        <div className="flex-1 w-full h-full rounded-xl overflow-hidden">
            <MapContainer 
                center={centerPosition} 
                zoom={10} 
                scrollWheelZoom={true} 
                style={{ height: "100%", width: "100%", background: "#f8fafc", zIndex: 0 }}
            >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MarkerClusterGroup chunkedLoading>
                {displayData.map((item) => {
                if (!item.lat || !item.long) return null;

                const stats = item.stats || { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 };
                const totalActivity = stats.vaccine + stats.sterilize + stats.register + stats.microchip + (stats.medical || 0);
                const color = getMarkerColor(item.unit);

                return (
                    <Marker
                        key={item._id || item.id}
                        position={[parseFloat(item.lat), parseFloat(item.long)]}
                        icon={createNumberIcon(totalActivity, color)}
                    >
                    <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                        <div className="text-center font-sans">
                        <span className="font-bold text-slate-800">{item.location}</span>
                        <div className="text-xs text-slate-500">รวม: {totalActivity.toLocaleString()} ตัว</div>
                        </div>
                    </Tooltip>

                    <Popup>
                        <div className="font-sans min-w-[200px] p-1">
                        {item.imageUrl && (
                            <div className="mb-3 w-full h-32 rounded-lg overflow-hidden border border-slate-100 relative">
                                <img src={item.imageUrl} alt="site" className="w-full h-full object-cover" />
                            </div>
                        )} 
                        <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-2 text-sm">
                            {item.unit}
                        </h3>
                        <p className="text-[10px] text-slate-500 mb-3 flex items-start gap-1">
                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> 
                            {item.location} ({item.district})
                        </p>
                        
                        <div className="space-y-2 bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-blue-600 font-semibold">
                                    <Syringe className="w-3 h-3" /> วัคซีน
                                </div>
                                <span className="font-bold text-slate-700">{stats.vaccine.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-orange-500 font-semibold">
                                    <Scissors className="w-3 h-3" /> ทำหมัน
                                </div>
                                <span className="font-bold text-slate-700">{stats.sterilize.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-green-600 font-semibold">
                                    <FileText className="w-3 h-3" /> ลงทะเบียน
                                </div>
                                <span className="font-bold text-slate-700">{stats.register.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-purple-600 font-semibold">
                                    <Database className="w-3 h-3" /> ไมโครชิป
                                </div>
                                <span className="font-bold text-slate-700">{stats.microchip.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
                                    <Stethoscope className="w-3 h-3" /> รักษาสัตว์
                                </div>
                                <span className="font-bold text-slate-700">{(stats.medical || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-1">
                                <div className="font-bold text-slate-900">รวมทั้งหมด</div>
                                <span className="font-bold text-slate-900 text-sm">{totalActivity.toLocaleString()}</span>
                            </div>
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
        if (!lat || !long) return null;

        return (
            <React.Fragment key={item._id || `outbreak-${index}`}>
                <Circle center={[lat, long]} radius={1000} pathOptions={{ color: '#991b1b', fillOpacity: 0.3, weight: 2, dashArray: '2, 5' }} />
                <Circle center={[lat, long]} radius={3000} pathOptions={{ color: '#ef4444', fillOpacity: 0.15, weight: 2 }} />
                <Circle center={[lat, long]} radius={5000} pathOptions={{ color: '#f97316', fillOpacity: 0.05, weight: 1, dashArray: '5, 10' }} />
                
                <Marker position={[lat, long]} icon={createDangerIcon()}>
                    <Popup>
                        <div className="font-sans min-w-[200px] p-1 text-center">
                            <div className="bg-red-100 text-red-600 font-bold px-2 py-1 rounded text-xs inline-block mb-2 border border-red-200">
                                🚨 พบเชื้อพิษสุนัขบ้า
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">{item.location}</h3>
                            <p className="text-xs text-slate-500 mb-2">เขต{item.district}</p>
                        
                            {/* ✅ อัปเดตตารางระยะใน Popup */}
                            <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-[9px]">
                                <div className="text-red-900 font-bold bg-red-100 rounded px-1 py-0.5">1 กม.<br/>รัศมีเข้มงวด</div>
                                <div className="text-red-600 font-bold bg-red-50 rounded px-1 py-0.5">3 กม.<br/>ควบคุมโรค</div>
                                <div className="text-orange-500 font-bold bg-orange-50 rounded px-1 py-0.5">5 กม.<br/>เฝ้าระวัง</div>
                            </div>
                        
                            {onDeleteOutbreak && (
                        <button 
        onClick={() => onDeleteOutbreak(item._id)} 
        className="mt-3 w-full flex items-center justify-center gap-1 bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold py-1.5 rounded transition-colors"
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

// --- [เพิ่มใหม่] COMPONENT: RABIES OUTBREAK MODAL ---
const AddOutbreakModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        location: '',
        district: BANGKOK_DISTRICTS[0],
        lat: '',
        long: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
        ...formData,
        lat: parseFloat(formData.lat),
        long: parseFloat(formData.long)
    });
    onClose();
  };

    return (
    <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-red-500">
            <div className="bg-red-600 px-6 py-4 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Skull className="w-6 h-6" /> บันทึกจุดเกิดเหตุโรคพิษสุนัขบ้า
                </h3>
                <button onClick={onClose}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">วันที่พบเชื้อ</label>
                    <input required type="date" className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">สถานที่พบ (Location)</label>
                    <input required type="text" placeholder="ระบุสถานที่" className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">เขตพื้นที่ (District)</label>
                    <select className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})}>
                        {BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Latitude</label>
                        <input required type="number" step="any" placeholder="13.xxxx" className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Longitude</label>
                        <input required type="number" step="any" placeholder="100.xxxx" className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        value={formData.long} onChange={e => setFormData({...formData, long: e.target.value})} />
                    </div>
                </div>
                <p className="text-[10px] text-slate-400">* จำเป็นต้องระบุพิกัดเพื่อแสดงบนแผนที่</p>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm">ยกเลิก</button>
                    <button type="submit" className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm shadow-lg flex items-center justify-center gap-2">
                    <Siren className="w-4 h-4" /> ยืนยันแจ้งเหตุ
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

// --- UPDATED ADD/EDIT DATA MODAL ---
const AddDataModal = ({ isOpen, onClose, onSave, onUpdate, initialData }) => {
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
                    subdistrict: initialData.subdistrict,
                    unit: initialData.unit,
                    lat: initialData.lat,
                    long: initialData.long
                });
                if (initialData.details) {
                    setBreakdown(initialData.details);
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
                alert("ไม่สามารถประมวลผลรูปภาพได้");
                return;
            }
        } else if (imagePreview === null) {
            finalImageUrl = "";
        }

        const dataPayload = {
            ...formData,
            lat: formData.lat ? parseFloat(formData.lat) : 0,
            long: formData.long ? parseFloat(formData.long) : 0,
            vaccine: totals.vaccine,
            sterilize: totals.sterilize,
            register: totals.register,
            microchip: totals.microchip,
            medical: totals.medical, // ✅ เพิ่มยอดรวมรักษาลงใน Payload
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
                                    <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})}>
                                        {BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">แขวง (Sub-district)</label>
                                    <input required type="text" placeholder="ระบุแขวง" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.subdistrict} onChange={e => setFormData({...formData, subdistrict: e.target.value})} />
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
            <button onClick={onClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
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
                    <input type="file" accept=".csv" onChange={(e) => { onFileChange(e); onClose(); // ปิด Modal เมื่อเลือกไฟล์เสร็จ
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
                    <button onClick={() => {onExport(); onClose();}}
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
                        'Authorization': `Bearer ${token}` // สำคัญมาก
                    },
                    body: JSON.stringify(backupData)
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

// --- [NEW COMPONENT] Toast Notification ---
const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-5 right-5 z-[6000] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} 
                     className={`pointer-events-auto min-w-[300px] p-4 rounded-xl shadow-2xl border-l-4 flex items-start gap-3 transform transition-all duration-300 animate-in slide-in-from-right-full ${
                        toast.type === 'success' ? 'bg-white border-green-500 text-green-800' :
                        toast.type === 'error' ? 'bg-white border-red-500 text-red-800' :
                        'bg-white border-blue-500 text-blue-800'
                     }`}>
                    <div className={`mt-0.5 p-1 rounded-full ${
                        toast.type === 'success' ? 'bg-green-100' : toast.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                        {toast.type === 'success' ? <CheckCircle className="w-4 h-4"/> : 
                         toast.type === 'error' ? <AlertTriangle className="w-4 h-4"/> : <Bell className="w-4 h-4"/>}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-sm">{toast.title}</h4>
                        <p className="text-xs opacity-90">{toast.message}</p>
                    </div>
                    <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4"/></button>
                </div>
            ))}
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

    // Pagination States 
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // จำนวนรายการต่อหน้า

    // Toast States
    const [toasts, setToasts] = useState([]);

    // Helper: Add Toast
    const addToast = (title, message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, title, message, type }]);
        // Auto remove after 3 seconds
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };
    
    // Helper: Print Function
    const handlePrint = () => {
        window.print();
    };

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(API_URL);
                const data = await response.json();
                setReportData(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Fetch Reports Error:", error);
                setReportData([]);
            }
        };
        fetchData();
    }, [API_URL]);

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
                const savedRecord = await response.json();
                setReportData(prev => [savedRecord, ...prev]);
                if (showSuccessAlert) addToast("บันทึกสำเร็จ", "ข้อมูลถูกบันทึกเข้าระบบเรียบร้อยแล้ว", "success");
            } else {
                if (showSuccessAlert) addToast("บันทึกไม่สำเร็จ", "กรุณาตรวจสอบสิทธิ์หรือข้อมูล", "error");
            }
        } catch (error) {
            console.error("Save Error:", error);
            if (showSuccessAlert) alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ");
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
                const savedRecord = await response.json();
                setReportData(prev => prev.map(item => item._id === id ? savedRecord : item));
                addToast("แก้ไขสำเร็จ", "ข้อมูลถูกปรับปรุงเรียบร้อยแล้ว", "success");
                setEditingItem(null);
            } else {
                addToast("แก้ไขไม่สำเร็จ", "คุณอาจไม่มีสิทธิ์ในการแก้ไข", "error");
            }
        } catch (error) {
            console.error("Update Error:", error);
            addToast("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อ Server ได้", "error");
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
                    setReportData(prev => prev.filter(item => item._id !== id));
                    addToast("ลบข้อมูลสำเร็จ", "ลบรายการออกจากระบบแล้ว", "success");
                } else {
                    addToast("ลบไม่สำเร็จ", "เกิดข้อผิดพลาดในการลบ", "error");
                }
            } catch (error) {
                console.error("Delete Error:", error);
                addToast("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อ Server ได้", "error");
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
                const savedRecord = await response.json();
                setOutbreakData(prev => [savedRecord, ...prev]);
                alert("🚨 บันทึกจุดเสี่ยงเรียบร้อยแล้ว");
            } else {
                alert("❌ ไม่สามารถบันทึกข้อมูลได้");
            }
        } catch (error) {
            console.error("Save Outbreak Error", error);
            alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ");
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
                    setOutbreakData(prev => prev.filter(item => item._id !== id));
                    alert("✅ ลบจุดแจ้งเหตุเรียบร้อยแล้ว");
                } else {
                    alert("❌ ไม่สามารถลบข้อมูลได้");
                }
            } catch (error) {
                console.error("Delete Outbreak Error:", error);
                alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ");
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

    // --- [ADDED] Reset Page when filter changes ---
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, searchDate, selectedYear, selectedMonth, selectedUnit, selectedDistrict]);

    // --- [ADDED] Pagination Calculation ---
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage]);

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

    const outbreakStats = useMemo(() => {
        const total = outbreakData.length;
        const grouped = outbreakData.reduce((acc, curr) => {
            acc[curr.district] = (acc[curr.district] || 0) + 1;
            return acc;
        }, {});
        const topDistricts = Object.keys(grouped)
            .map(key => ({ name: key, count: grouped[key] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        return { total, topDistricts };
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
            const confirmImport = window.confirm(`พบข้อมูล ${lines.length - 1} แถว ต้องการนำเข้าหรือไม่? \n(การทำงานอาจใช้เวลาสักครู่)`);
            if (!confirmImport) return;

            // วนลูปอ่านข้อมูลทีละแถว (เริ่มที่ i=1 เพื่อข้าม Header)
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // แยกข้อมูลด้วย comma (แบบง่าย)
                // หมายเหตุ: หากใน CSV มี comma ในเนื้อหา (เช่น ชื่อสถานที่) วิธีนี้อาจตัดผิด 
                // ควรใช้ Library เช่น 'papaparse' หากต้องการความแม่นยำสูง แต่โค้ดนี้ใช้ได้พื้นฐาน
                const cols = line.split(',');

                // Map ข้อมูลตามลำดับ Header ที่เรา Export ออกไป
                // [Date, Loc, Dist, Sub, Unit, Vac, Ster, Reg, Chip, Med, Lat, Long]
                const newRecord = {
                    date: cols[0]?.trim(),
                    location: cols[1]?.replace(/"/g, '').trim(), // ลบ quote ออก
                    district: cols[2]?.trim(),
                    subdistrict: cols[3]?.trim(),
                    unit: cols[4]?.trim(),
                    stats: {
                        vaccine: parseInt(cols[5]) || 0,
                        sterilize: parseInt(cols[6]) || 0,
                        register: parseInt(cols[7]) || 0,
                        microchip: parseInt(cols[8]) || 0,
                        medical: parseInt(cols[9]) || 0
                    },
                    lat: parseFloat(cols[10]) || 0,
                    long: parseFloat(cols[11]) || 0,
                    // ใส่ค่า default ให้ details ป้องกัน error
                    details: { 
                        dog: { vaccine: 0, maleSterilize: 0, femaleSterilize: 0, microchip: 0, register: 0, medical: 0 },
                        cat: { vaccine: 0, maleSterilize: 0, femaleSterilize: 0, microchip: 0, register: 0, medical: 0 },
                        other: { vaccine: 0, medical: 0 }
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
    const exportToCSV = () => {
    // ใช้ข้อมูลที่กรองอยู่ปัจจุบัน (filteredData)
    if (!filteredData || filteredData.length === 0) {
        alert("ไม่มีข้อมูลสำหรับส่งออก (Export)");
        return;
    }

    // 1. กำหนดหัวตาราง (Header)
    const headers = [
        "Date", 
        "Location", 
        "District", 
        "Subdistrict", 
        "Unit", 
        "Vaccine", 
        "Sterilize", 
        "Register", 
        "Microchip", 
        "Medical", 
        "Latitude", 
        "Longitude"
    ];

    // 2. แปลงข้อมูลเป็น Rows
    const csvRows = filteredData.map(item => {
        // จัดการกรณีที่มีเครื่องหมายคอมมา (,) ในข้อความ ให้ใส่เครื่องหมายคำพูดครอบ
        const safeLocation = item.location ? `"${item.location.replace(/"/g, '""')}"` : "";
        
        return [
            item.date,
            safeLocation,
            item.district,
            item.subdistrict || "",
            item.unit,
            item.stats.vaccine || 0,
            item.stats.sterilize || 0,
            item.stats.register || 0,
            item.stats.microchip || 0,
            item.stats.medical || 0,
            item.lat,
            item.long
        ].join(",");
    });

    // 3. รวม Header และ Rows
    const csvString = [headers.join(","), ...csvRows].join("\n");

    // 4. สร้าง Blob พร้อม BOM (\uFEFF) เพื่อให้ Excel อ่านภาษาไทยได้
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    
    // 5. สร้างลิงก์ดาวน์โหลด
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `VET_REPORT_${new Date().toISOString().split('T')[0]}.csv`;
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

                @media print {
        @page { size: landscape; margin: 10mm; }
        .no-print, header button, .fixed { display: none !important; }
        .print-only { display: block !important; }
        body { background: white; font-size: 12px; }
        .shadow-sm, .shadow-lg { box-shadow: none !important; }
        .border { border-color: #000 !important; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd !important; padding: 4px !important; }
        /* ซ่อน Map และกราฟบางส่วนตอนพิมพ์เพื่อประหยัดหมึก หรือจะเปิดไว้ก็ได้ */
        .leaflet-container { border: 1px solid #ccc; }
    }
            `}</style>

            {/* Modals */}
            <AddDataModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleAddNewData} 
                onUpdate={handleUpdateData} 
                initialData={editingItem} 
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
                apiBaseUrl={BASE_URL}  // ✅ เพิ่มบรรทัดนี้
            />
            <UserManagementModal 
                isOpen={isUserMgmtOpen}
                onClose={() => setIsUserMgmtOpen(false)}
                token={user?.token}
                apiBaseUrl={BASE_URL} // ✅ เพิ่มบรรทัดนี้
            />
            <PasswordConfirmModal 
                isOpen={isConfirmPasswordOpen}
                onClose={() => setIsConfirmPasswordOpen(false)}
                onConfirm={executeClearAllData}
                title="ล้างข้อมูลทั้งหมด?"
                message="การกระทำนี้ไม่สามารถกู้คืนได้ กรุณายืนยันตัวตน"
            />

            <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

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
                                <button onClick={handleLogout} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors" title="ออกจากระบบ">
                                    <Lock className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-full shadow hover:bg-slate-900 transition-all">
                                <Unlock className="w-4 h-4" /> เจ้าหน้าที่ Login
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
                                <button onClick={() => setIsOutbreakModalOpen(true)} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-md hover:shadow-lg animate-pulse">
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
                                {/* [ADDED] Print Button */}
            <button onClick={handlePrint} className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full no-print" title="พิมพ์รายงาน">
                <Printer className="w-5 h-5" />
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

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <KPICard title="จำนวนวัคซีนทั้งหมด" value={totals.vaccine} subtext="สะสมรวมทุกหน่วย" icon={Syringe} 
                        // ใช้ Gradient สีฟ้า
                        colorClass="bg-gradient-to-br from-blue-500 to-blue-700" shadowClass="shadow-lg shadow-blue-500/30"
                    />
                    <KPICard title="จำนวนการทำหมัน" value={totals.sterilize} subtext="สุนัขและแมว" icon={Scissors} 
                        // ใช้ Gradient สีส้ม
                        colorClass="bg-gradient-to-br from-orange-400 to-orange-600" shadowClass="shadow-lg shadow-orange-500/30"
                    />
                    <KPICard title="ขึ้นทะเบียนสัตว์เลี้ยง" value={totals.register} subtext="ลงระบบฐานข้อมูล" icon={FileText} 
                        // ใช้ Gradient สีเขียว
                        colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600" shadowClass="shadow-lg shadow-emerald-500/30"
                    />
                    <KPICard title="ฝังไมโครชิป" value={totals.microchip} subtext="ระบุตัวตนสัตว์" icon={Database} 
                        // ใช้ Gradient สีม่วง
                        colorClass="bg-gradient-to-br from-purple-500 to-purple-700" shadowClass="shadow-lg shadow-purple-500/30"
                    />
                    <KPICard title="จำนวนการรักษาสัตว์" value={totals.medical} subtext="บริการรักษาพยาบาล" icon={Stethoscope} 
                        // ใช้ Gradient สีชมพูเข้ม/แดง (Rose)
                        colorClass="bg-gradient-to-br from-rose-400 to-rose-600" shadowClass="shadow-lg shadow-rose-500/30"
                    />
                </div>
                
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

                    {/* Map */}
                    <div className="lg:col-span-7 bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-[56rem] relative z-0">
                        <LeafletMap data={mapDisplayData} outbreaks={outbreakData} onDeleteOutbreak={canEdit ? handleDeleteOutbreak : undefined} />
                    </div>
                </div>

                {/* Rabies Section */}
                {outbreakStats.total > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-4 bg-red-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 opacity-90"><Siren className="w-5 h-5 animate-pulse"/> สถานการณ์ระบาด</div>
                                <h3 className="text-5xl font-extrabold">{outbreakStats.total}</h3>
                                <p className="text-sm opacity-90">จุดที่พบเชื้อ</p>
                            </div>
                        </div>
                        <div className="md:col-span-8 bg-white border border-red-100 rounded-xl p-6 shadow-sm">
                            <h4 className="font-bold text-slate-700 mb-4">พื้นที่เสี่ยงสูงสุด</h4>
                            <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={outbreakStats.topDistricts} margin={{top:0, right:30, left:0, bottom:0}} barSize={20}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                                        <Bar dataKey="count" fill="#ef4444" radius={[0,4,4,0]} />
                                    </BarChart>
                                </ResponsiveContainer>
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
                                    {/* Action Column visible only if canEdit */}
                                    {canEdit && <th className="px-4 py-3 text-center w-28">จัดการ</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.map((item) => (
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
                                {paginatedData.length === 0 && (
            <tr><td colSpan="6" className="p-8 text-center text-slate-400">ไม่พบข้อมูล</td></tr>
        )}
                            </tbody>
                        </table>
                    </div>
                    {/* [ADDED] Pagination Controls */}
<div className="flex items-center justify-between mt-4 px-2 no-print">
    <div className="text-xs text-slate-500">
        แสดง {paginatedData.length} จากทั้งหมด {filteredData.length} รายการ
    </div>
    <div className="flex items-center gap-2">
        <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <ChevronLeft className="w-4 h-4 text-slate-600"/>
        </button>
        
        <div className="flex gap-1">
            {/* Logic แสดงเลขหน้าแบบย่อ */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // คำนวณเลขหน้าที่จะแสดง (ให้ currentPage อยู่ตรงกลางถ้าเป็นไปได้)
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i;
                    if(pageNum > totalPages) pageNum = totalPages - 4 + i;
                }
                
                return (
                    <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                            currentPage === pageNum 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {pageNum}
                    </button>
                );
            })}
        </div>

        <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <ChevronRight className="w-4 h-4 text-slate-600"/>
        </button>
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
