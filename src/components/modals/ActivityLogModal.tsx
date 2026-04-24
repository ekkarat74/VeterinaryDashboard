import React, { useState, useEffect, useMemo } from 'react';
import { 
    Database, X, FileText, Search, RefreshCw, Terminal, Clock, 
    User, Info, Activity, Trash2
} from 'lucide-react';

// --- Types & Interfaces ---

// กำหนดโครงสร้างข้อมูลของ Log แต่ละรายการ
interface LogEntry {
    _id: string;
    user: string;
    action: string;
    details: string;
    role: string;
    createdAt: string; // รับมาเป็น ISO string จาก API
    metadata?: Record<string, any> | null;
}

// กำหนด Props สำหรับ LogDetailModal
interface LogDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: Record<string, any> | null;
}

// กำหนด Props สำหรับ ActivityLogModal
interface ActivityLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string;
    apiBaseUrl: string;
    currentUserRole?: string;
}

// --- Components ---

const LogDetailModal: React.FC<LogDetailModalProps> = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200">
                <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Terminal className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">รายละเอียดข้อมูล</h3>
                            <p className="text-xs text-slate-500">Data Payload (JSON)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-0 overflow-auto bg-[#1e1e1e] custom-scrollbar">
                    <pre className="text-[13px] font-mono text-emerald-400 p-6 leading-relaxed">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition-all">
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>
    );
};

const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ isOpen, onClose, token, apiBaseUrl, currentUserRole }) => {
    // กำหนด Type ให้กับ State
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedLogData, setSelectedLogData] = useState<Record<string, any> | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const handleClearLogs = async () => {
        if (!window.confirm("⚠️ ยืนยันการล้างประวัติการใช้งานระบบทั้งหมด?\nการกระทำนี้ไม่สามารถกู้คืนได้!")) return;
        
        try {
            setIsLoading(true);
            const res = await fetch(`${apiBaseUrl}/api/logs`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                alert("✅ ล้างประวัติการใช้งานระบบเรียบร้อยแล้ว");
                fetchLogs(); // โหลดข้อมูลใหม่ (จะเหลือแค่ log ของการ clear)
            } else {
                const err = await res.json();
                alert(`❌ ลบไม่สำเร็จ: ${err.message}`);
            }
        } catch (error) {
            console.error("Clear Logs Error", error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
            setSearchTerm('');
        }
    }, [isOpen]);

    const fetchLogs = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${apiBaseUrl}/api/logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data: LogEntry[] = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Fetch Logs Error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLogs = useMemo(() => {
        if (!searchTerm) return logs;
        const lowerSearch = searchTerm.toLowerCase();
        return logs.filter(log => 
            (log.user && log.user.toLowerCase().includes(lowerSearch)) ||
            (log.action && log.action.toLowerCase().includes(lowerSearch)) ||
            (log.details && log.details.toLowerCase().includes(lowerSearch)) ||
            (log.role && log.role.toLowerCase().includes(lowerSearch))
        );
    }, [logs, searchTerm]);

    if (!isOpen) return null;

    // กำหนด Type ให้กับ Parameter action 
    const getActionBadge = (action: string): React.ReactNode => {
        if (action.includes('DELETE') || action.includes('CLEAR')) 
            return <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[11px] font-bold uppercase tracking-wider">{action}</span>;
        if (action.includes('CREATE') || action.includes('ADD')) 
            return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[11px] font-bold uppercase tracking-wider">{action}</span>;
        if (action.includes('UPDATE') || action.includes('EDIT')) 
            return <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[11px] font-bold uppercase tracking-wider">{action}</span>;
        if (action.includes('LOGIN')) 
            return <span className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-full text-[11px] font-bold uppercase tracking-wider">{action}</span>;
        
        return <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[11px] font-bold uppercase tracking-wider">{action}</span>;
    };

    return (
        <>
            <LogDetailModal 
                isOpen={!!selectedLogData} 
                onClose={() => setSelectedLogData(null)} 
                data={selectedLogData} 
            />
            
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
                    
                    {/* Header */}
                    <div className="bg-white px-6 py-5 flex justify-between items-center border-b border-slate-100 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">ประวัติการใช้งานระบบ</h3>
                                <p className="text-sm text-slate-500">System Activity Logs</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Toolbar (Search & Refresh) */}
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่อผู้ใช้, การกระทำ, รายละเอียด..." 
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {(currentUserRole === 'Developer' || currentUserRole === 'MagaAdmin') && (
                                <button 
                                    onClick={handleClearLogs} 
                                    disabled={isLoading || logs.length === 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    ล้างประวัติทั้งหมด
                                </button>
                            )}
                            <button 
                                onClick={fetchLogs} 
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
                                รีเฟรชข้อมูล
                            </button>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="flex-1 overflow-auto p-0 bg-white custom-scrollbar">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-slate-50/90 backdrop-blur-sm text-slate-500 font-semibold sticky top-0 shadow-sm z-10 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 w-16 text-center">Data</th>
                                    <th className="px-6 py-4 w-48"><div className="flex items-center gap-2"><Clock className="w-4 h-4" /> วัน-เวลา</div></th>
                                    <th className="px-6 py-4 w-40"><div className="flex items-center gap-2"><User className="w-4 h-4" /> ผู้ใช้งาน</div></th>
                                    <th className="px-6 py-4 w-32"><div className="flex items-center gap-2"><Activity className="w-4 h-4" /> การกระทำ</div></th>
                                    <th className="px-6 py-4"><div className="flex items-center gap-2"><Info className="w-4 h-4" /> รายละเอียด</div></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                                                <span className="text-slate-500 font-medium">กำลังดึงข้อมูล...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-16 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="p-4 bg-slate-50 rounded-full">
                                                    <FileText className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <span className="text-slate-500 font-medium">ไม่พบประวัติการใช้งานระบบ</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-3 text-center">
                                                {log.metadata && Object.keys(log.metadata).length > 0 ? (
                                                    <button 
                                                        onClick={() => setSelectedLogData(log.metadata || null)}
                                                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg transition-all shadow-sm opacity-70 group-hover:opacity-100"
                                                        title="ดูข้อมูล Payload"
                                                    >
                                                        <Database className="w-4 h-4" />
                                                    </button>
                                                ) : <span className="text-slate-200 block text-center">-</span>}
                                            </td>
                                            <td className="px-6 py-3 text-slate-500 text-sm">
                                                {new Date(log.createdAt).toLocaleString('th-TH')}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="font-bold text-slate-800">{log.user}</div>
                                                    {/* ✅ เปลี่ยนให้แสดงคำว่า ผู้พัฒนาระบบ ถ้า role เป็น Developer */}
                                                    <div className="text-[10px] text-slate-400 font-semibold uppercase">
                                                        {log.role === 'Developer' ? 'ผู้พัฒนาระบบ' : log.role}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                {getActionBadge(log.action)}
                                            </td>
                                            <td className="px-6 py-3 text-slate-600 truncate max-w-sm xl:max-w-md" title={log.details}>
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-3 flex justify-between items-center border-t border-slate-100 shrink-0">
                        <span className="text-xs text-slate-400 font-medium">
                            แสดง {filteredLogs.length} รายการ
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ActivityLogModal;