import React, { useState, useEffect } from 'react';
import { 
    Users, X, Plus, CheckCircle, AlertTriangle, Database, 
    Search, RotateCw, Edit, Trash2, Key, ChevronDown, Save, UserCog
} from 'lucide-react';

// --- Sub-Component: Edit User Modal ---
const EditUserModal = ({ isOpen, onClose, user, onUpdate, onResetPassword }) => {
    const [formData, setFormData] = useState({ username: '', role: 'user', status: 'active' });
    const [newPassword, setNewPassword] = useState('');
    const [activeTab, setActiveTab] = useState('info'); // 'info' | 'password'

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username,
                role: user.role,
                status: user.status || 'active'
            });
            setNewPassword('');
            setActiveTab('info');
        }
    }, [user, isOpen]);

    if (!isOpen || !user) return null;

    const handleInfoSubmit = (e) => {
        e.preventDefault();
        onUpdate(user._id, formData);
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        onResetPassword(user._id, newPassword);
        setNewPassword('');
    };

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all">
                
                {/* Header Profile */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold border-2 border-slate-600 shadow-lg text-blue-400">
                        {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <h3 className="text-lg font-bold tracking-wide">{user.username}</h3>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-1 rounded-full bg-slate-800/50 border border-slate-700">
                        <UserCog className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-xs text-slate-300 uppercase tracking-wider font-medium">{user.role}</span>
                    </div>
                    
                    <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 bg-slate-50/50">
                    <button 
                        onClick={() => setActiveTab('info')} 
                        className={`flex-1 py-3.5 text-sm font-semibold transition-all border-b-2 ${activeTab === 'info' ? 'border-blue-600 text-blue-700 bg-blue-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                        แก้ไขข้อมูล
                    </button>
                    <button 
                        onClick={() => setActiveTab('password')} 
                        className={`flex-1 py-3.5 text-sm font-semibold transition-all border-b-2 ${activeTab === 'password' ? 'border-red-500 text-red-600 bg-red-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                        รีเซ็ตรหัสผ่าน
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'info' ? (
                        <form onSubmit={handleInfoSubmit} className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">ชื่อผู้ใช้ (Username)</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input className="w-full pl-9 p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium transition-all" 
                                        value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">สิทธิ์ (Role)</label>
                                    <div className="relative">
                                        <select className="w-full p-2.5 pr-8 border border-slate-200 rounded-xl appearance-none outline-none text-sm cursor-pointer bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                                            value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                            <option value="MagaAdmin">MagaAdmin</option>
                                            <option value="superadmin">SuperAdmin</option>
                                            <option value="admin">Admin</option>
                                            <option value="user">User</option>
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">สถานะ (Status)</label>
                                    <div className="relative">
                                        <select className={`w-full p-2.5 pr-8 border rounded-xl appearance-none outline-none text-sm cursor-pointer font-bold transition-all ${formData.status === 'suspended' ? 'bg-red-50 text-red-600 border-red-200 focus:ring-red-500/20' : 'bg-green-50 text-green-700 border-green-200 focus:ring-green-500/20'}`}
                                            value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                            <option value="active">ใช้งานปกติ</option>
                                            <option value="suspended">ระงับการใช้งาน</option>
                                        </select>
                                        <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${formData.status === 'suspended' ? 'text-red-400' : 'text-green-500'}`}/>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                                <Save className="w-4 h-4" /> บันทึกการเปลี่ยนแปลง
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-3 items-start">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-bold text-red-800">คำเตือนสำหรับ Admin</h4>
                                    <p className="text-[11px] text-red-600/90 leading-relaxed mt-1">
                                        การเปลี่ยนรหัสผ่านที่นี่จะทำให้ User ไม่สามารถใช้รหัสเดิมได้ทันที กรุณาแจ้งรหัสใหม่ให้ User ทราบด้วย
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">ตั้งรหัสผ่านใหม่</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="text" className="w-full pl-9 p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none text-sm font-mono transition-all" 
                                        placeholder="ระบุรหัสผ่านใหม่..." 
                                        value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={4} />
                                </div>
                            </div>

                            <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2">
                                <RotateCw className="w-4 h-4" /> ยืนยันรีเซ็ตรหัสผ่าน
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Component: User Management Modal ---
const UserManagementModal = ({ isOpen, onClose, token, apiBaseUrl, onToast }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("admin");
    const [userList, setUserList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [editingUser, setEditingUser] = useState(null);

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
            if(onToast) onToast('error', "ไม่สามารถดึงข้อมูลผู้ใช้งานได้");
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
                if(onToast) onToast('success', 'สร้างบัญชีผู้ใช้สำเร็จ');
            } else {
                const data = await res.json();
                if(onToast) onToast('error', data.message || "สร้างไม่สำเร็จ");
            }
        } catch (error) { 
            if(onToast) onToast('error', "เชื่อมต่อ Server ไม่ได้"); 
        }
    };

    const handleUpdateUser = async (userId, updateData) => {
        try {
            const res = await fetch(`${apiBaseUrl}/api/users/${userId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(updateData)
            });
            if (res.ok) {
                fetchUsers();
                setEditingUser(null);
                if(onToast) onToast('success', 'แก้ไขข้อมูลสำเร็จ');
            } else {
                const data = await res.json();
                if(onToast) onToast('error', data.message);
            }
        } catch (error) { 
            if(onToast) onToast('error', "Update Error"); 
        }
    };

    const handleDeleteUser = async (userId) => {
        if(!window.confirm("ยืนยันการลบผู้ใช้งานนี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;
        
        try {
            const res = await fetch(`${apiBaseUrl}/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                fetchUsers();
                if(onToast) onToast('success', 'ลบผู้ใช้งานเรียบร้อย');
            } else {
                if(onToast) onToast('error', "ไม่สามารถลบได้ (อาจไม่มีสิทธิ์)");
            }
        } catch (error) { 
            if(onToast) onToast('error', "เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
    };

    const handleAdminResetPassword = async (userId, newPassword) => {
        if(!window.confirm("ยืนยันการเปลี่ยนรหัสผ่านให้ผู้ใช้นี้?")) return;
        try {
            const res = await fetch(`${apiBaseUrl}/api/users/${userId}/reset-password`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ newPassword })
            });
            if (res.ok) {
                setEditingUser(null);
                if(onToast) onToast('success', 'เปลี่ยนรหัสผ่านเรียบร้อย');
            } else {
                const data = await res.json();
                if(onToast) onToast('error', data.message);
            }
        } catch (error) { 
            if(onToast) onToast('error', "Reset Password Error"); 
        }
    };

    // Filtered Users (Bug Fix: Used to be just declaring it, now applied in table map)
    const filteredUsers = userList.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper: Badge Style
    const getRoleBadgeStyle = (r) => {
        switch(r) {
            case 'MagaAdmin': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'superadmin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'admin': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <EditUserModal 
                isOpen={!!editingUser} 
                onClose={() => setEditingUser(null)} 
                user={editingUser}
                onUpdate={handleUpdateUser}
                onResetPassword={handleAdminResetPassword}
            />
            <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30">
                            <Users className="w-5 h-5 text-blue-400"/>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">จัดการผู้ใช้งานระบบ</h2>
                            <p className="text-slate-400 text-xs">ระบบบริหารจัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-full transition-colors">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-full overflow-hidden bg-slate-50/50">
                    
                    {/* Left: Create Form (Sidebar) */}
                    <div className="w-full md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="bg-green-100 text-green-600 p-1.5 rounded-lg"><Plus className="w-4 h-4"/></span> 
                                เพิ่มผู้ใช้งานใหม่
                            </h3>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">ชื่อผู้ใช้ (Username)</label>
                                    <input className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all" 
                                        value={username} onChange={e=>setUsername(e.target.value)} required placeholder="ระบุชื่อผู้ใช้" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">รหัสผ่าน (Password)</label>
                                    <input className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all" 
                                        type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="ระบุรหัสผ่าน" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">ระดับสิทธิ์ (Role)</label>
                                    <div className="relative">
                                        <select className="w-full p-2.5 pr-8 border border-slate-200 rounded-xl bg-slate-50 appearance-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-slate-700 transition-all cursor-pointer" 
                                            value={role} onChange={e=>setRole(e.target.value)}>
                                            <option value="MagaAdmin">MagaAdmin (สูงสุด + จัดการแท็บ)</option>
                                            <option value="superadmin">SuperAdmin (สิทธิ์สูงสุด)</option>
                                            <option value="admin">Admin (แก้ไขข้อมูลได้)</option>
                                            <option value="user">User (ดูได้อย่างเดียว)</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 mt-4">
                                    <CheckCircle className="w-4 h-4"/> สร้างบัญชีผู้ใช้
                                </button>
                            </form>
                        </div>
                        
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 space-y-2 mt-auto">
                            <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> คำแนะนำระดับสิทธิ์:</p>
                            <ul className="list-disc pl-5 space-y-1.5 text-blue-700/80">
                                <li><b>SuperAdmin:</b> จัดการ Users และลบข้อมูลทั้งหมดได้</li>
                                <li><b>Admin:</b> เพิ่ม/แก้ไข/ลบ ข้อมูลทั่วไปได้</li>
                                <li><b>User:</b> ดู Dashboard ได้อย่างเดียว</li>
                            </ul>
                        </div>
                    </div>

                    {/* Right: User List Table */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-transparent p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                <Database className="w-5 h-5 text-blue-500"/> รายชื่อในระบบ 
                                <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold ml-1">{filteredUsers.length}</span>
                            </h3>
                            
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                                    <input 
                                        type="text" 
                                        placeholder="ค้นหาชื่อผู้ใช้..." 
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm transition-all"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button onClick={fetchUsers} className="text-slate-500 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-300 transition-all p-2 rounded-xl shadow-sm hover:bg-blue-50 group">
                                    <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Table Container */}
                        <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-50/80 text-slate-500 font-semibold text-xs uppercase sticky top-0 z-10 backdrop-blur-sm border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 w-20 text-center font-medium">รูปโปรไฟล์</th>
                                        <th className="p-4 font-medium">ชื่อผู้ใช้งาน (Username)</th>
                                        <th className="p-4 font-medium w-40 text-center">ระดับสิทธิ์ (Role)</th>
                                        <th className="p-4 text-right font-medium w-32">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="4" className="p-12 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                                                    <RotateCw className="w-6 h-6 animate-spin text-blue-500" />
                                                    <span className="text-sm font-medium">กำลังโหลดข้อมูล...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-12 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                                                    <Users className="w-8 h-8 opacity-20" />
                                                    <span className="text-sm">ไม่พบข้อมูลผู้ใช้งาน</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map(u => (
                                            <tr key={u._id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="p-3 text-center">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs mx-auto border border-slate-200 shadow-sm">
                                                        {u.username.substring(0,2).toUpperCase()}
                                                    </div>
                                                </td>
                                                <td className="p-3 font-semibold text-slate-700">{u.username}</td>
                                                <td className="p-3 text-center">
                                                    <div className="relative inline-block w-full">
                                                        <select 
                                                            className={`text-xs font-bold pl-3 pr-6 py-1.5 rounded-lg border outline-none cursor-pointer appearance-none text-center w-full transition-colors ${getRoleBadgeStyle(u.role)}`}
                                                            value={u.role}
                                                            onChange={(e) => handleUpdateUser(u._id, { role: e.target.value })}
                                                        >
                                                            <option value="MagaAdmin">MagaAdmin</option>
                                                            <option value="superadmin">SuperAdmin</option>
                                                            <option value="admin">Admin</option>
                                                            <option value="user">User</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 opacity-50 pointer-events-none"/>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button onClick={() => setEditingUser(u)}
                                                            className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-all"
                                                            title="แก้ไข / รีเซ็ตรหัสผ่าน"
                                                        >
                                                            <Edit className="w-4 h-4"/>
                                                        </button>
                                                        <button onClick={() => handleDeleteUser(u._id)}
                                                            className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-100 transition-all"
                                                            title="ลบถาวร"
                                                        >
                                                            <Trash2 className="w-4 h-4"/>
                                                        </button>
                                                    </div>
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

export default UserManagementModal;