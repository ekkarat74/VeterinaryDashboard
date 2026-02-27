import React, { useState, useEffect } from 'react';
import { 
    Users, X, Plus, CheckCircle, AlertTriangle, Database, 
    Search, RotateCw, Edit, Trash2, Key, ChevronDown, Save, Lock 
} from 'lucide-react';

// --- Sub-Component: Edit User Modal (ใช้ภายในไฟล์นี้) ---
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
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header Profile */}
                <div className="bg-slate-900 p-6 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500"></div>
                    <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold border-4 border-slate-800 shadow-xl">
                        {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <h3 className="text-lg font-bold">{user.username}</h3>
                    <p className="text-xs text-slate-400 opacity-80 uppercase tracking-wider">{user.role}</p>
                    
                    <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button 
                        onClick={() => setActiveTab('info')} 
                        className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'info' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        แก้ไขข้อมูล
                    </button>
                    <button 
                        onClick={() => setActiveTab('password')} 
                        className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'password' ? 'border-red-500 text-red-600 bg-red-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        รีเซ็ตรหัสผ่าน
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'info' ? (
                        <form onSubmit={handleInfoSubmit} className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">ชื่อผู้ใช้ (Username)</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input className="w-full pl-9 p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all" 
                                        value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">สิทธิ์ (Role)</label>
                                    <select className="w-full p-2.5 border border-slate-200 rounded-xl..." 
    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
    <option value="MagaAdmin">MagaAdmin</option> {/* เพิ่ม option นี้ */}
    <option value="superadmin">SuperAdmin</option>
    <option value="admin">Admin</option>
    <option value="user">User</option>
</select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">สถานะ (Status)</label>
                                    <select className={`w-full p-2.5 border border-slate-200 rounded-xl outline-none text-sm cursor-pointer font-bold ${formData.status === 'suspended' ? 'bg-red-50 text-red-600 focus:ring-red-500' : 'bg-green-50 text-green-600 focus:ring-green-500'}`}
                                        value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                        <option value="active">ใช้งานปกติ</option>
                                        <option value="suspended">ระงับการใช้งาน</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
                                <Save className="w-4 h-4" /> บันทึกการเปลี่ยนแปลง
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-3 items-start">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-bold text-red-700">คำเตือนสำหรับ Admin</h4>
                                    <p className="text-[10px] text-red-600 leading-tight mt-1">
                                        การเปลี่ยนรหัสผ่านที่นี่จะทำให้ User ไม่สามารถใช้รหัสเดิมได้ทันที กรุณาแจ้งรหัสใหม่ให้ User ทราบด้วย
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">ตั้งรหัสผ่านใหม่</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="text" className="w-full pl-9 p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-sm font-mono transition-all" 
                                        placeholder="ระบุรหัสผ่านใหม่..." 
                                        value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={4} />
                                </div>
                            </div>

                            <button type="submit" className="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2">
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
            const data = await res.json();
            if (res.ok) {
                fetchUsers();
                setEditingUser(null);
                if(onToast) onToast('success', 'แก้ไขข้อมูลสำเร็จ');
            } else {
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

    // Filtered Users
    const filteredUsers = userList.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper: Badge Style
    const getRoleBadgeStyle = (r) => {
    switch(r) {
        case 'MagaAdmin': return 'bg-rose-100 text-rose-700 border-rose-200'; // เพิ่มบรรทัดนี้
        case 'superadmin': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'admin': return 'bg-blue-100 text-blue-700 border-blue-200';
        default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
};

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <EditUserModal 
                isOpen={!!editingUser} 
                onClose={() => setEditingUser(null)} 
                user={editingUser}
                onUpdate={handleUpdateUser}
                onResetPassword={handleAdminResetPassword}
            />
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
                                        <select className="w-full p-2.5 border border-slate-200 rounded-lg bg-white..." 
    value={role} onChange={e=>setRole(e.target.value)}>
    <option value="MagaAdmin">MagaAdmin (สิทธิ์สูงสุด + จัดการแท็บ)</option> {/* เพิ่ม option นี้ */}
    <option value="superadmin">SuperAdmin (สิทธิ์สูงสุด)</option>
    <option value="admin">Admin (แก้ไขข้อมูลได้)</option>
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
                            <div className="relative w-full max-w-[200px]">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                                <input 
                                    type="text" 
                                    placeholder="ค้นหาชื่อ..." 
                                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
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
    className={`text-xs font-bold px-2 py-1 rounded-full border... ${getRoleBadgeStyle(u.role)}`}
    value={u.role}
    onChange={(e) => handleUpdateUser(u._id, { role: e.target.value })}
>
    <option value="MagaAdmin">MagaAdmin</option> {/* เพิ่ม option นี้ */}
    <option value="superadmin">SuperAdmin</option>
    <option value="admin">Admin</option>
    <option value="user">User</option>
</select>
                                                </td>
                                                <td className="p-3 text-right">
                                                   <div className="flex justify-end gap-1">
                                                        {/* ปุ่มแก้ไข */}
                                                        <button onClick={() => setEditingUser(u)}
                                                            className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-all"
                                                            title="แก้ไข / รีเซ็ตรหัสผ่าน"
                                                        >
                                                            <Edit className="w-4 h-4"/>
                                                        </button>
                                                        {/* ปุ่มลบ */}
                                                        <button onClick={() => handleDeleteUser(u._id)}
                                                            className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
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