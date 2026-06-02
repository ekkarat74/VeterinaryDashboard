import React, { useState, useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
import { 
    Activity, Database, X, Search, Trash2, Siren, List, ChevronUp, ChevronDown, Unlock, LogOut, CalendarDays,
    Megaphone, Edit3, Plus, GripVertical, Save, Bell, LayoutList, Columns,ChevronRight,
    Copy, AlertTriangle, MapPin, CheckCircle // <-- เพิ่มบรรทัดนี้
} from 'lucide-react';
import { io } from "socket.io-client";

import useDashboardState from './hooks/useDashboardState'; 

import KPISection from './components/dashboard/KPICards';
import UserManagementModal from './components/UserManagementModal';
import { UNIT_TYPES, BANGKOK_DISTRICTS } from './constants/locations';
const AddDataModal = lazy(() => import('./components/modals/AddDataModal'));
const RabiesOutbreakSection = lazy(() => import('./components/dashboard/RabiesOutbreakSection'));
const MainDataTable = lazy(() => import('./components/dashboard/MainDataTable'));
import { exportToCSV, exportOutbreaksToCSV, exportToExcel, exportOutbreaksToExcel } from './utils/csvUtils';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import Sidebar from './components/layout/Sidebar';
const StatisticsCharts = React.lazy(() => import('./components/dashboard/StatisticsCharts'));
import RankingSection from './components/dashboard/RankingSection';
const LeafletMap = lazy(() => import('./components/modals/LeafletMap'));
import LoginModal from './components/modals/LoginModal';
const AddOutbreakModal = lazy(() => import('./components/modals/AddOutbreakModal'));
import { MeetingCalendarDashboard} from './components/CalendarComponents';
import DispatchModal from './components/modals/DispatchModal';
import { MeetingModal, MeetingListModal } from './components/modals/MeetingModal';
import ActivityLogModal from './components/modals/ActivityLogModal';
import CsvActionModal from './components/modals/CsvActionModal';
import BackupSystemModal from './components/modals/BackupSystemModal';
import ToastContainer from './path/to/ToastContainer';
import ImagePreviewModal from './components/modals/ImagePreviewModal';
import PieChartsSection from './components/dashboard/PieChartsSection';
const UnitComparisonChart = React.lazy(() => import('./components/dashboard/UnitComparisonChart'));
import ClearDataModal from './components/modals/ClearDataModal';
const CustomUnitModal = lazy(() => import('./components/modals/CustomUnitModal'));
const BreedModal = lazy(() => import('./components/modals/BreedModal'));
const ColorModal = lazy(() => import('./components/modals/ColorModal'));
import { parseReportCSV, parseOutbreakCSV, generateMockDataRecords } from './utils/dataProcessors';
const DogCatComparisonChart = lazy(() => import('./components/dashboard/DogCatComparisonChart'));
const YearOverYearChart = lazy(() => import('./components/dashboard/YearOverYearChart'))
import ComprehensiveAllInOneChart from './components/dashboard/ComprehensiveAllInOneChart';
const GenderSterilizationChart = lazy(() => import('./components/dashboard/GenderSterilizationChart'));
import DashboardSkeleton from './components/dashboard/DashboardSkeleton';
import Footer from './components/layout/Footer';
import AnnouncementManager, { Announcement } from './components/dashboard/AnnouncementManager';

export interface User {
    username: string;
    role: string;
    token: string;
    [key: string]: any;
}

const BASE_URL = 'https://veterinarydashboard-hwho.onrender.com';
const API_URL = `${BASE_URL}/api/reports`;
const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

// ==========================================
// Component: DuplicateReportModal (อัปเดตใหม่: เพิ่มฟิลเตอร์ วันที่, สถานที่, หน่วย)
// ==========================================
interface DuplicateReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reports: any[];
    dispatchEvents: any[];
    onSelectRecord: (date: string, location: string) => void;
}

const DuplicateReportModal: React.FC<DuplicateReportModalProps> = ({ isOpen, onClose, reports, dispatchEvents, onSelectRecord }) => {
    const [activeTab, setActiveTab] = useState<'duplicates' | 'unscheduled' | 'unreported' | 'mismatch'>('duplicates');
    const [liveReports, setLiveReports] = useState<any[]>(reports);
    const [liveDispatches, setLiveDispatches] = useState<any[]>(dispatchEvents);

    useEffect(() => {
        setLiveReports(reports);
        setLiveDispatches(dispatchEvents);
    }, [reports, dispatchEvents]);

    useEffect(() => {
        if (!isOpen) return;
        const socket = io('https://veterinarydashboard-hwho.onrender.com');

        socket.on('server_data_update', (payload: any) => {
            if (payload.type === 'REPORT_ADDED') {
                setLiveReports(prev => [payload.data, ...prev]);
            } else if (payload.type === 'REPORT_UPDATED') {
                setLiveReports(prev => prev.map(r => r._id === payload.data._id ? payload.data : r));
            } else if (payload.type === 'REPORT_DELETED') {
                setLiveReports(prev => prev.filter(r => r._id !== payload.id));
            } else if (payload.type === 'DISPATCH_ADDED') {
                setLiveDispatches(prev => [...prev, payload.data]);
            } else if (payload.type === 'DISPATCH_UPDATED') {
                setLiveDispatches(prev => prev.map(d => d._id === payload.data._id ? payload.data : d));
            } else if (payload.type === 'DISPATCH_DELETED') {
                setLiveDispatches(prev => prev.filter(d => d._id !== payload.id));
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [isOpen]);

    const [filterDate, setFilterDate] = useState<string>('');
    const [filterLocation, setFilterLocation] = useState<string>('');
    const [filterUnit, setFilterUnit] = useState<string>('ทั้งหมด');
    const [filterDistrict, setFilterDistrict] = useState<string>('ทั้งหมด');


    const availableUnits = useMemo(() => {
    const units = new Set<string>();
    liveDispatches.forEach(e => { if(e.title) units.add(e.title); else if(e.unit) units.add(e.unit); else if(e.unitName) units.add(e.unitName); });
    liveReports.forEach(r => { if(r.unit) units.add(r.unit); });
    return ['ทั้งหมด', ...Array.from(units).filter(Boolean)];
}, [liveDispatches, liveReports]);

    const availableDistricts = useMemo(() => {
        const districts = new Set<string>();
        liveDispatches.forEach(e => { if(e.district) districts.add(e.district); });
        liveReports.forEach(r => { if(r.district) districts.add(r.district); });
        return ['ทั้งหมด', ...Array.from(districts).filter(Boolean)];
    }, [liveDispatches, liveReports]);

    const { duplicateData, unscheduledData, unreportedData, mismatchData } = useMemo(() => {
        const normalize = (str: any) => (str || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

        const exactMatchMap = new Map<string, any[]>();
        liveReports.forEach(rep => {
            const loc = rep.location?.trim();
            if (!loc) return;
            const key = `${rep.date}|${normalize(loc)}`;
            if (!exactMatchMap.has(key)) exactMatchMap.set(key, []);
            exactMatchMap.get(key)!.push(rep);
        });

        const dupByLocation = new Map<string, any[]>();
        exactMatchMap.forEach((reps) => {
            if (reps.length > 1) {
                const loc = reps[0].location || 'ไม่ระบุสถานที่';
                if (!dupByLocation.has(loc)) dupByLocation.set(loc, []);
                dupByLocation.get(loc)!.push(...reps);
            }
        });

        const duplicateResults = Array.from(dupByLocation.entries()).map(([loc, reps]) => ({
            location: loc, count: reps.length, reports: reps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        })).sort((a, b) => b.count - a.count);

        const unschByLocation = new Map<string, any[]>();
        const unrepByLocation = new Map<string, any[]>();
        const mismatches: any[] = [];

        liveReports.forEach(rep => {
            const loc = rep.location?.trim();
            if (!loc) return;
            const normLoc = normalize(loc);

            const matchedDispatch = liveDispatches.find(d => d.date === rep.date && normalize(d.location) === normLoc);

            if (!matchedDispatch) {
                if (!unschByLocation.has(loc)) unschByLocation.set(loc, []);
                unschByLocation.get(loc)!.push(rep);
            } else {
                const mismatchFields = [];
                const repUnit = normalize(rep.unit);
                const dispUnit = normalize(matchedDispatch.title || matchedDispatch.unit || matchedDispatch.unitName);
                const repTeam = (rep.team || '').toString().toLowerCase().replace(/\s+/g, '');
                const dispTeam = (matchedDispatch.team || '').toString().toLowerCase().replace(/\s+/g, '');

                const isVetDisp = dispUnit.includes('สัตวแพทย์') || dispUnit.includes('สัตว์แพทย์');
                const isVetRep = repUnit.includes('สัตวแพทย์') || repUnit.includes('สัตว์แพทย์');
                const isSpayDisp = dispUnit.includes('ทำหมัน');
                const isSpayRep = repUnit.includes('ทำหมัน');
                const isSpayVetMatch = (isSpayDisp && isVetRep) || (isVetDisp && isSpayRep);

                if (repUnit && dispUnit && !repUnit.includes(dispUnit) && !dispUnit.includes(repUnit) && !isSpayVetMatch) {
                    mismatchFields.push('หน่วยงาน');
                }
                if (repTeam && dispTeam && repTeam !== dispTeam) {
                    mismatchFields.push('ทีมปฏิบัติการ');
                }

                if (mismatchFields.length > 0) {
                    mismatches.push({ date: rep.date, location: rep.location, mismatchFields, report: rep, dispatch: matchedDispatch });
                }
            }
        });

        const today = new Date().toISOString().split('T')[0];
            liveDispatches.forEach(d => {
                if (d.date > today || d.status === 'cancelled') return;
                const loc = d.location?.trim();
                if (!loc) return;
                const normLoc = normalize(loc);

                const isReported = liveReports.some(rep => rep.date === d.date && normalize(rep.location) === normLoc);

                if (!isReported) {
                    if (!unrepByLocation.has(loc)) unrepByLocation.set(loc, []);
                    unrepByLocation.get(loc)!.push(d);
                }  
            });

            const unscheduledResults = Array.from(unschByLocation.entries()).map(([loc, reps]) => ({
                location: loc, count: reps.length, reports: reps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        })).sort((a, b) => b.count - a.count);

        const unreportedResults = Array.from(unrepByLocation.entries()).map(([loc, evts]) => ({
            location: loc, count: evts.length, events: evts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        })).sort((a, b) => b.count - a.count);

        return { duplicateData: duplicateResults, unscheduledData: unscheduledResults, unreportedData: unreportedResults, mismatchData: mismatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
    }, [liveReports, liveDispatches]);

    // --- Logic การกรองข้อมูลตามฟิลเตอร์ ---
    const { fDup, fUnsch, fUnrep, fMis } = useMemo(() => {
        const checkLoc = (loc: string) => !filterLocation || (loc || '').toLowerCase().includes(filterLocation.toLowerCase());
        const checkDate = (date: string) => !filterDate || date === filterDate;
        const checkUnit = (u1?: string, u2?: string) => {
            if (filterUnit === 'ทั้งหมด') return true;
            return (u1 === filterUnit) || (u2 === filterUnit);
        };
        const checkDistrict = (d1?: string, d2?: string) => {
            if (filterDistrict === 'ทั้งหมด') return true;
            return (d1 === filterDistrict) || (d2 === filterDistrict);
        };

        const fDup = duplicateData.map(d => {
            const rFiltered = d.reports ? d.reports.filter((r: any) => 
                checkDate(r.date) && checkUnit(r.unit, '') && checkDistrict(r.district, '') // <-- [เพิ่ม]
            ) : [];
            return { ...d, reports: rFiltered, count: rFiltered.length };
        }).filter(d => checkLoc(d.location) && d.count > 1);

        const fUnsch = unscheduledData.map(d => {
            const rFiltered = d.reports.filter((r: any) => 
                checkDate(r.date) && checkUnit(r.unit, '') && checkDistrict(r.district, '') // <-- [เพิ่ม]
            );
            return { ...d, reports: rFiltered, count: rFiltered.length };
        }).filter(d => checkLoc(d.location) && d.count > 0);

        const fUnrep = unreportedData.map(d => {
            const eFiltered = d.events.filter((e: any) =>
                checkDate(e.date) && checkUnit(e.title || e.unit || e.unitName, '') && checkDistrict(e.district, '') 
            );
            return { ...d, events: eFiltered, count: eFiltered.length };
        }).filter(d => checkLoc(d.location) && d.count > 0);

        const fMis = mismatchData.filter(m =>
            checkLoc(m.location) && checkDate(m.date) && 
            checkUnit(m.report?.unit, m.dispatch?.title || m.dispatch?.unit || m.dispatch?.unitName) && 
            checkDistrict(m.report?.district, m.dispatch?.district) 
        );
        
        return { fDup, fUnsch, fUnrep, fMis };
    }, [duplicateData, unscheduledData, unreportedData, mismatchData, filterDate, filterLocation, filterUnit, filterDistrict]); // <-- [เพิ่ม] filterDistrict ใน dependency arr

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[6000] flex justify-center items-center bg-slate-900/50 backdrop-blur-sm transition-opacity p-4">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
                            <Search className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-800">ตรวจสอบและเทียบข้อมูล (Cross-check)</h2>
                            <p className="text-[10px] text-slate-500">ตรวจสอบข้อมูลซ้ำ, งานที่ตกหล่น และข้อมูลขัดแย้งระหว่างระบบ</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-50/80 px-4 sm:px-6 py-4 border-b border-slate-200 shrink-0 z-10">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="ค้นหาสถานที่..." value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-sm transition-all" />
                    </div>
                    <div className="w-full sm:w-[150px]">
                        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-600 cursor-pointer shadow-sm transition-all" />
                    </div>
                    <div className="w-full sm:w-[150px]">
                        <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-600 cursor-pointer shadow-sm transition-all">
                            {availableUnits.map((u, i) => <option key={i} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="w-full sm:w-[150px]">
                        <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-600 cursor-pointer shadow-sm transition-all">
                            {availableDistricts.map((d, i) => <option key={i} value={d}>{d}</option>)}
                        </select>
                    </div>
                    {(filterLocation || filterDate || filterUnit !== 'ทั้งหมด' || filterDistrict !== 'ทั้งหมด') && (
                        <button onClick={() => { setFilterLocation(''); setFilterDate(''); setFilterUnit('ทั้งหมด'); setFilterDistrict('ทั้งหมด'); }} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-sm">
                            <X className="w-3.5 h-3.5" /> ล้าง
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-50 border-b border-slate-200 px-4 sm:px-6 pt-3 gap-2 shrink-0 overflow-x-auto custom-scrollbar">
                    <button onClick={() => setActiveTab('duplicates')} className={`px-4 py-2.5 text-[11px] font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'duplicates' ? 'bg-white text-rose-600 border border-slate-200 border-b-0 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)] relative top-[1px]' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
                        <Copy className="w-4 h-4 hidden sm:block" /> 1. ลงยอดซ้ำ <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'duplicates' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>{fDup.length} แห่ง</span>
                    </button>
                    <button onClick={() => setActiveTab('unscheduled')} className={`px-4 py-2.5 text-[11px] font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'unscheduled' ? 'bg-white text-amber-600 border border-slate-200 border-b-0 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)] relative top-[1px]' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
                        <CalendarDays className="w-4 h-4 hidden sm:block" /> 2. ไม่มีในปฏิทิน <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'unscheduled' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{fUnsch.length} แห่ง</span>
                    </button>
                    <button onClick={() => setActiveTab('unreported')} className={`px-4 py-2.5 text-[11px] font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'unreported' ? 'bg-white text-emerald-600 border border-slate-200 border-b-0 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)] relative top-[1px]' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
                        <Database className="w-4 h-4 hidden sm:block" /> 3. ยังไม่ลงยอด <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'unreported' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{fUnrep.length} แห่ง</span>
                    </button>
                    <button onClick={() => setActiveTab('mismatch')} className={`px-4 py-2.5 text-[11px] font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'mismatch' ? 'bg-white text-orange-600 border border-slate-200 border-b-0 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)] relative top-[1px]' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
                        <AlertTriangle className="w-4 h-4 hidden sm:block" /> 4. ข้อมูลขัดแย้ง <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'mismatch' ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'}`}>{fMis.length} แห่ง</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/50">
                    
                    {/* TAB 1: ข้อมูลที่ซ้ำกัน */}
                    {activeTab === 'duplicates' && (
                        fDup.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-emerald-500 animate-in fade-in duration-300">
                                <CheckCircle className="w-12 h-12 mb-3 text-emerald-300" />
                                <h3 className="font-bold text-sm">ยอดเยี่ยม! ไม่พบข้อมูลที่บันทึกซ้ำซ้อน</h3>
                            </div>
                        ) : (
                            <div className="space-y-5 animate-in fade-in duration-300">
                                <div className="flex items-center gap-2 bg-rose-50 text-rose-700 text-[10px] sm:text-xs p-3.5 rounded-xl border border-rose-200 shadow-sm">
                                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                    <span>พบรายงานยอดที่ <strong>สถานที่และวันที่ตรงกัน</strong> จำนวน <strong>{fDup.length}</strong> แห่ง</span>
                                </div>
                                {fDup.map((item, idx) => (
                                    <div key={idx} className="bg-white border border-rose-100 rounded-xl overflow-hidden shadow-sm">
                                        <div className="px-4 py-3 bg-rose-50/30 border-b border-rose-100 flex justify-between items-center">
                                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-500 shrink-0" /> {item.location}</h4>
                                            <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-[10px] font-bold">ซ้ำ {item.count} รายการ</span>
                                        </div>
                                        <div className="flex flex-col divide-y divide-slate-100">
                                            {item.reports.map((rep: any, eIdx: number) => (
                                                <div key={eIdx} onClick={() => onSelectRecord(rep.date, item.location)} className="p-3.5 flex justify-between gap-3 cursor-pointer hover:bg-rose-50">
                                                    <div className="flex gap-4">
                                                        <div className="text-rose-600 font-bold text-[11px]">{rep.date}</div>
                                                        <div className="text-[10px] text-slate-600">
                                                            เขต: {rep.district || '-'} | หน่วย: {rep.unit || '-'} | ทีม: {rep.team || '-'}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* TAB 2: ตกหล่นยังไม่ลงปฏิทิน */}
                    {activeTab === 'unscheduled' && (
                        fUnsch.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-emerald-500 animate-in fade-in duration-300"><CheckCircle className="w-12 h-12 mb-3 text-emerald-300" /><h3 className="font-bold text-sm">ยอดเยี่ยม! ข้อมูลรายงานทั้งหมดตรงกับปฏิทิน</h3></div>
                        ) : (
                            <div className="space-y-5 animate-in fade-in duration-300">
                                <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-[10px] sm:text-xs p-3.5 rounded-xl border border-amber-200 shadow-sm">
                                    <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                    <span>พบรายงานผลที่ <strong>ยังไม่มีในปฏิทินออกหน่วย</strong> จำนวน <strong>{fUnsch.length}</strong> แห่ง</span>
                                </div>
                                {fUnsch.map((item, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-500 shrink-0" /> {item.location}</h4>
                                            <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold">ตกหล่น {item.count} รายการ</span>
                                        </div>
                                        <div className="flex flex-col divide-y divide-slate-100">
                                            {item.reports.map((rep: any, eIdx: number) => (
                                                <div key={eIdx} onClick={() => onSelectRecord(rep.date, item.location)} className="p-3.5 flex justify-between gap-3 cursor-pointer hover:bg-amber-50">
                                                    <div className="flex gap-4">
                                                        <div className="text-amber-600 font-bold text-[11px]">{rep.date}</div>
                                                        <div className="text-[10px] text-slate-600">
                                                            เขต: {rep.district || '-'} | หน่วย: {rep.unit || '-'} | ทีม: {rep.team || '-'}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* TAB 3: ปฏิทินที่ยังไม่ลงยอด */}
                    {activeTab === 'unreported' && (
                        fUnrep.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-emerald-500 animate-in fade-in duration-300"><CheckCircle className="w-12 h-12 mb-3 text-emerald-300" /><h3 className="font-bold text-sm">ยอดเยี่ยม! ปฏิทินทั้งหมดมีการลงยอดครบถ้วน</h3></div>
                        ) : (
                            <div className="space-y-5 animate-in fade-in duration-300">
                                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs p-3.5 rounded-xl border border-emerald-200 shadow-sm">
                                    <Database className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                    <span>พบปฏิทินที่เลยกำหนดเวลา แต่ <strong>ยังไม่ได้บันทึกยอดรายงาน</strong> จำนวน <strong>{fUnrep.length}</strong> แห่ง</span>
                                </div>
                                {fUnrep.map((item, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500 shrink-0" /> {item.location}</h4>
                                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-bold">ยังไม่รายงาน {item.count} งาน</span>
                                        </div>
                                        <div className="flex flex-col divide-y divide-slate-100">
                                            {item.events.map((evt: any, eIdx: number) => (
                                                <div key={eIdx} onClick={() => onSelectRecord(evt.date, item.location)} className="p-3.5 flex justify-between gap-3 cursor-pointer hover:bg-emerald-50">
                                                    <div className="flex gap-4">
                                                        <div className="text-emerald-600 font-bold text-[11px]">{evt.date}</div>
                                                        {/* --- [แก้ไข] แทรก เขต ลงไปข้างหน้า หน่วย --- */}
                                                        <div className="text-[10px] text-slate-600">
                                                            เขต: {evt.district || '-'} | หน่วย: {evt.unit || evt.unitName || evt.title || '-'} | ทีม: {evt.team || '-'}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* TAB 4: ข้อมูลขัดแย้ง (Mismatch) */}
                    {activeTab === 'mismatch' && (
                        fMis.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-emerald-500 animate-in fade-in duration-300"><CheckCircle className="w-12 h-12 mb-3 text-emerald-300" /><h3 className="font-bold text-sm">ยอดเยี่ยม! ข้อมูลตรงกันทั้งหมด</h3></div>
                        ) : (
                            <div className="space-y-5 animate-in fade-in duration-300">
                                <div className="flex items-center gap-2 bg-orange-50 text-orange-700 text-[10px] sm:text-xs p-3.5 rounded-xl border border-orange-200 shadow-sm">
                                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                    <span>พบข้อมูลฝั่งปฏิทินและฝั่งยอดรายงาน <strong>ระบุรายละเอียดขัดแย้งกัน</strong> จำนวน <strong>{fMis.length}</strong> แห่ง</span>
                                </div>
                                {fMis.map((item, idx) => (
                                    <div key={idx} onClick={() => onSelectRecord(item.date, item.location)} className="bg-white border border-orange-200 rounded-xl overflow-hidden shadow-sm cursor-pointer hover:bg-orange-50 transition-colors">
                                        <div className="px-4 py-3 bg-orange-50/50 border-b border-orange-100 flex justify-between items-center">
                                            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500 shrink-0" /> {item.date} - {item.location}</h4>
                                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-[10px] font-bold">ขัดแย้ง: {item.mismatchFields.join(', ')}</span>
                                        </div>
                                        <div className="p-3.5 text-[11px] grid grid-cols-2 gap-4">
                                            <div className="border-r border-orange-100 pr-4">
                                                <div className="font-bold text-slate-500 mb-1">ฝั่งปฏิทิน (Dispatch)</div>
                                                <div className="truncate"><span className="font-medium text-slate-400">เขต:</span> {item.dispatch.district || '-'}</div>
                                                <div className="truncate"><span className="font-medium text-slate-400">หน่วย:</span> {item.dispatch.title || item.dispatch.unit || item.dispatch.unitName || '-'}</div>
                                                <div className="truncate"><span className="font-medium text-slate-400">ทีม:</span> {item.dispatch.team || '-'}</div>
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-500 mb-1">ฝั่งลงยอด (Report)</div>
                                                <div className="truncate"><span className="font-medium text-slate-400">เขต:</span> {item.report.district || '-'}</div>
                                                <div className="truncate"><span className="font-medium text-slate-400">หน่วย:</span> {item.report.unit || '-'}</div>
                                                <div className="truncate"><span className="font-medium text-slate-400">ทีม:</span> {item.report.team || '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---
export default function VeterinaryDashboard() {
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
        isMeetingCalendarOpen, setIsMeetingCalendarOpen,
        isClearDataModalOpen, setIsClearDataModalOpen,
        user: rawUser, setUser, activeTab, setActiveTab, tabsConfig, setTabsConfig,
        isSidebarCollapsed, setIsSidebarCollapsed, isMobileMenuOpen, setIsMobileMenuOpen,
        isSystemMenuOpen, setIsSystemMenuOpen, isFilterExpanded, setIsFilterExpanded,
        csvMode, setCsvMode, isInitialLoading, setIsInitialLoading,
        trendOffset, setTrendOffset, freqDailyOffset, setFreqDailyOffset,
        freqMonthlyOffset, setFreqMonthlyOffset, chartBaseYear, setChartBaseYear,
        chartBaseMonth, setChartBaseMonth,
        toasts, addToast, removeToast
    } = useDashboardState();

    const user = rawUser as User | null;
    const isReadOnlyMode = new URLSearchParams(window.location.search).get('mode') === 'view';
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState<boolean>(false);

    const handleNavigateFromDuplicate = (dateStr: string, locationStr: string) => {
        setSearchDate(dateStr);
        setSearchTerm(locationStr);
        setIsFilterExpanded(true); 
        setActiveTab('database');
        setIsDuplicateModalOpen(false);
    };

    // ==========================================
    // Responsive & View Mode Management
    // ==========================================
    const [isMobile, setIsMobile] = useState(false);
    const [displayMode, setDisplayMode] = useState<'table' | 'list'>('table');

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
           
            const isPublic = !user || isReadOnlyMode;
            if (isPublic && mobile) {
                setDisplayMode('list');
            } else {
                setDisplayMode('table');
            }
        };

        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [user, isReadOnlyMode]);

    const getCurrentToken = useCallback(() => {
        try {
            const storedUser = localStorage.getItem('vet_user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                return parsed?.token || user?.token || '';
            }
        } catch (e) {
        console.error('Error parsing token', e);
        }
        return user?.token || '';
    }, [user]);

    const [breeds, setBreeds] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [customUnits, setCustomUnits] = useState<any[]>([]);

    const [notifications, setNotifications] = useState<any[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    useEffect(() => {
        const fetchCustomUnits = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/custom-units`);
                if (res.ok) {
                    setCustomUnits(await res.json());
                }
            } catch (err) { 
                console.error("Error fetching custom units", err); 
            }
        };
        fetchCustomUnits();
    }, [BASE_URL]);

    const allUnits = useMemo(() => {
        const dynamicUnits = customUnits.map((u: any) => u.name);
        return Array.from(new Set([...UNIT_TYPES, ...dynamicUnits]));
    }, [customUnits]);

    useEffect(() => {
    if (user) {
        const fetchNotifs = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/notifications`, { 
                    headers: { 'Authorization': `Bearer ${getCurrentToken()}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Error fetching notifications", err);
            }
        };
        fetchNotifs();
    }
}, [user, BASE_URL, getCurrentToken]);

const unreadCount = notifications.filter(n => !n.isRead).length;
const markAllAsRead = async () => {
    try {
        await fetch(`${BASE_URL}/api/notifications/read`, { 
            method: 'PUT', 
            headers: { 'Authorization': `Bearer ${getCurrentToken()}` }
        });
        setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    } catch(e) {
        console.error("Error marking notifications as read", e);
    }
};

    useEffect(() => {
    const fetchBreedsAndColors = async () => {
      try {
        const resB = await fetch(`${BASE_URL}/api/breeds`);
        if (resB.ok) {
           setBreeds(await resB.json());
        }
        
        const resC = await fetch(`${BASE_URL}/api/colors`);
        if (resC.ok) {
           setColors(await resC.json());
        }
      } catch (err) { console.error("Error fetching breeds/colors", err); }
    };
    fetchBreedsAndColors();
  }, [BASE_URL]);

    const [isCustomUnitModalOpen, setIsCustomUnitModalOpen] = useState(false);
    const [isBreedModalOpen, setIsBreedModalOpen] = useState(false);
    const [isColorModalOpen, setIsColorModalOpen] = useState(false);

    // จัดการสิทธิ์การแสดงผลใหม่
    const isSystemDeveloper = user?.role === 'Developer';
    const isTopAdmin = !!(user && ['Developer', 'MagaAdmin'].includes(user.role));
    const isMagaAdmin = !!(user && ['Developer', 'MagaAdmin'].includes(user.role));

    // Admin, MagaAdmin, Developer แก้ไขข้อมูลได้ | (User, executive, superadmin ห้ามแก้)
    const canEdit = !!(user && ['Developer', 'MagaAdmin', 'admin'].includes(user.role) && !isReadOnlyMode);
    
    // User สามารถเพิ่มข้อมูลได้ แต่ Executive ไม่สามารถเพิ่มได้ (แต่ Executive มองเห็นข้อมูลที่ซ่อนอยู่ได้)
    const canAdd = !!(user && ['Developer', 'MagaAdmin', 'admin', 'user'].includes(user.role) && !isReadOnlyMode);

    // สิทธิ์การมองเห็นหน่วยที่ถูกซ่อน (Executive มองเห็นได้ แต่แก้ไม่ได้ถ้าไม่มี canEdit)
    const canViewHiddenDispatches = !!(user && ['Developer', 'MagaAdmin', 'admin', 'executive'].includes(user.role));

    const handleNotifySystemUpdate = async () => {
        if (!window.confirm("⚠️ ยืนยันการสั่งแจ้งเตือนอัปเดตระบบ?\nหน้าเว็บของผู้ใช้งานทุกคนในขณะนี้จะถูกบังคับรีเฟรชทันที!")) return;
        try {
            const response = await fetch(`${BASE_URL}/api/system/notify-update`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCurrentToken()}` // เปลี่ยนมาใช้ getCurrentToken()
                }
            });
            if (response.ok) {
                addToast('success', "✅ ส่งคำสั่งอัปเดตระบบไปยังผู้ใช้ทั้งหมดแล้ว");
            } else if (response.status === 401 || response.status === 403) {
                addToast('error', "❌ เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
                setUser(null);
                localStorage.removeItem('vet_user');
                setIsLoginModalOpen(true);
            } else {
                addToast('error', "❌ ไม่สามารถส่งคำสั่งได้ (อาจไม่มีสิทธิ์)");
            }
        } catch (error) {
            addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
        }
    };

    const handleSaveMeeting = async (meetingData: any) => {
        try {
            const method = meetingData._id ? 'PUT' : 'POST';
            const url = meetingData._id ? `${BASE_URL}/api/meetings/${meetingData._id}` : `${BASE_URL}/api/meetings`;
            
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getCurrentToken()}` }, // เปลี่ยนมาใช้ getCurrentToken()
                body: JSON.stringify(meetingData)
            });
            if (res.ok) {
                addToast('success', meetingData._id ? 'แก้ไขข้อมูลเรียบร้อย' : 'บันทึกการประชุมเรียบร้อย');
                if(meetingData._id) {
                    const updated = await res.json();
                        (setMeetings as any)((prev: any[]) => prev.map((m: any) => m._id === updated._id ? updated : m));
                }
                setIsMeetingModalOpen(false);
            } else if (res.status === 401 || res.status === 403) {
                addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
                setUser(null);
                localStorage.removeItem('vet_user');
                setIsLoginModalOpen(true);
            } else {
                addToast('error', 'บันทึกไม่สำเร็จ');
            }
        } catch (error) {
            addToast('error', 'Error saving meeting');
        }
    };

    const handleDeleteMeeting = async (id: string) => {
        try {
            const res = await fetch(`${BASE_URL}/api/meetings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getCurrentToken()}` }
            });
            if (res.ok) {
                addToast('success', 'ลบการประชุมเรียบร้อย');
                (setMeetings as any)((prev: any[]) => prev.filter((m: any) => m._id !== id));
            } else if (res.status === 401 || res.status === 403) {
                addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
                setUser(null);
                localStorage.removeItem('vet_user');
                setIsLoginModalOpen(true);
            } else {
                addToast('error', 'ลบไม่สำเร็จ');
            }
        } catch (error) {
            addToast('error', 'Error deleting meeting');
        }
    };

    const handleUpdateOutbreak = async (id: string, updatedData: any) => {
        try {
            const response = await fetch(`${BASE_URL}/api/outbreaks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getCurrentToken()}` }, // เปลี่ยนมาใช้ getCurrentToken()
                body: JSON.stringify(updatedData)
            });
            if (response.ok) {
                addToast('success', "✅ แก้ไขข้อมูลจุดเสี่ยงสำเร็จ");
                setEditingOutbreak(null);
                setIsOutbreakModalOpen(false);
            } else if (response.status === 401 || response.status === 403) {
                addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
                setUser(null);
                localStorage.removeItem('vet_user');
                setIsLoginModalOpen(true);
            } else {
                addToast('error', "❌ แก้ไขไม่สำเร็จ");
            }
        } catch (error) {
            addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
    };

    const handleAddOutbreak = async (data: any) => {
        try {
            const response = await fetch(`${BASE_URL}/api/outbreaks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getCurrentToken()}` }, // เปลี่ยนมาใช้ getCurrentToken()
                body: JSON.stringify(data)
            });
            if (response.ok) { 
                addToast('success', "🚨 บันทึกจุดเสี่ยงเรียบร้อยแล้ว"); 
                setIsOutbreakModalOpen(false);
            } else if (response.status === 401 || response.status === 403) {
                addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
                setUser(null);
                localStorage.removeItem('vet_user');
                setIsLoginModalOpen(true);
            } else { 
                addToast('error', "❌ ไม่สามารถบันทึกข้อมูลได้"); 
            }
        } catch (error) { addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
    };

    const handleDeleteOutbreak = async (id: string) => {
        if (window.confirm("⚠️ ยืนยันการลบจุดแจ้งเหตุโรคระบาดนี้?")) {
            try {
                const response = await fetch(`${BASE_URL}/api/outbreaks/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${getCurrentToken()}` }
                });
                if (response.ok) { 
                    addToast('success', "✅ ลบจุดแจ้งเหตุเรียบร้อยแล้ว"); 
                } else if (response.status === 401 || response.status === 403) {
                    addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
                    setUser(null);
                    localStorage.removeItem('vet_user');
                    setIsLoginModalOpen(true);
                } else { 
                    addToast('error', "❌ ไม่สามารถลบข้อมูลได้"); 
                }
            } catch (error) { addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
        }
    };

    const executeClearAllData = async (passwordInput: string, filters: any) => {
        try {
            const response = await fetch(API_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getCurrentToken()}` }, // เปลี่ยนมาใช้ getCurrentToken()
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
            } else if (response.status === 401 || response.status === 403) {
                addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
                setUser(null);
                localStorage.removeItem('vet_user');
                setIsLoginModalOpen(true);
            } else {
                alert(`❌ เกิดข้อผิดพลาด: ${result.message}`);
            }
        } catch (error) { alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ Server"); }
    };

    useEffect(() => {
        const fetchDispatches = async () => {
            try {
                const token = getCurrentToken();
                const headers: Record<string, string> = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch(`${BASE_URL}/api/dispatches`, { headers });
            
                if (res.ok) {
                    const data = await res.json();
                    setDispatchEvents(data);
                } else if (res.status === 401 || res.status === 403) {
                    addToast('error', "❌ เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
                    setUser(null);
                    localStorage.removeItem('vet_user');
                    setIsLoginModalOpen(true);
                } else {
                    console.error("Fetch Dispatches Error:", res.status);
                }
            } catch (error) {
                console.error("Fetch Dispatches Error", error);
            }
        };
        fetchDispatches();
    }, [BASE_URL, setDispatchEvents, setUser]);

    const meetingEventsOnly = useMemo(() => meetings.map((m: any) => ({
        date: m.date, time: m.startTime, location: m.title, team: 'Online/Room', note: m.link, type: 'meeting', _id: m._id, originalData: m
    })), [meetings]);

    const handleSaveDispatchEvent = async (payload: any) => {
    try {
        const method = payload._id ? 'PUT' : 'POST';
        const url = payload._id ? `${BASE_URL}/api/dispatches/${payload._id}` : `${BASE_URL}/api/dispatches`;
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getCurrentToken()}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            addToast('success', payload._id ? 'แก้ไขแผนงานเรียบร้อย' : 'บันทึกแผนงานเรียบร้อย');
            setIsDispatchModalOpen(false);
        } else if (res.status === 401 || res.status === 403) {
            addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
            setUser(null);
            localStorage.removeItem('vet_user');
            setIsLoginModalOpen(true);
        } else {
            const err = await res.json();
            addToast('error', `บันทึกไม่สำเร็จ: ${err.message}`);
        }
    } catch (error) {
        addToast('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
};

const handleDeleteDispatch = async (id: string) => {
    if (!window.confirm('ยืนยันลบแผนงานนี้?')) return;
    try {
        const res = await fetch(`${BASE_URL}/api/dispatches/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getCurrentToken()}` }
        });
        if (res.ok) {
            addToast('success', 'ลบแผนงานเรียบร้อย');
            setIsDispatchModalOpen(false);
        } else if (res.status === 401 || res.status === 403) {
            addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
            setUser(null);
            localStorage.removeItem('vet_user');
            setIsLoginModalOpen(true);
        } else {
            addToast('error', 'ลบไม่สำเร็จ');
        }
    } catch (error) {
        addToast('error', 'ลบไม่สำเร็จ');
    }
};

    useEffect(() => {
        const fetchDispatches = async () => {
            try {
                const token = getCurrentToken();
                const headers: Record<string, string> = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch(`${BASE_URL}/api/dispatches`, { headers });
                
                if (res.ok) {
                    const data = await res.json();
                    setDispatchEvents(data);
                } else {
                    console.error("Fetch Dispatches Error:", res.status);
                }
            } catch (error) {
                console.error("Fetch Dispatches Error", error);
            }
        };
        fetchDispatches();
    }, [BASE_URL, setDispatchEvents]);

    const handleOutbreakFileUpload = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event: any) => {
            try {
                const { bulkData, totalRows } = parseOutbreakCSV(event.target.result);
                
                if (totalRows === 0) { alert("ไฟล์ไม่มีข้อมูล"); return; }

                const confirmImport = window.confirm(`ต้องการนำเข้าข้อมูลจุดระบาด ${totalRows} รายการใช่หรือไม่?`);
                if (!confirmImport) return;

                if (bulkData.length === 0) {
                    alert("ไม่พบข้อมูลที่ถูกต้อง (กรุณาตรวจสอบ Lat/Long ในไฟล์ CSV)");
                    return;
                }

                const response = await fetch(`${BASE_URL}/api/outbreaks/bulk`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getCurrentToken()}` 
                    },
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

    const handleLogin = useCallback((userData: any) => {
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

    const toggleTab = async (tabName: string) => {
        const previousConfig = { ...tabsConfig };
        const config = tabsConfig as Record<string, any>;

        const currentValue = config[tabName] !== undefined ? config[tabName] : (tabName.startsWith('outbreak_year_') ? true : false);
        const newConfig = { ...tabsConfig, [tabName]: !currentValue };

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
        const checkTabVisibility = (tabName: string) => {
            const config = tabsConfig as Record<string, any>;

            if (!user) return config?.[`public_${tabName}`] ?? true;
            
            if (user.role === 'executive') return config?.[`sa_${tabName}`] ?? true;
            
            return true; 
        };

        if (!checkTabVisibility(activeTab)) {
            if (checkTabVisibility('overview')) setActiveTab('overview');
            else if (checkTabVisibility('outbreak')) setActiveTab('outbreak');
            else if (checkTabVisibility('database')) setActiveTab('database');
            else if (checkTabVisibility('calendar')) setActiveTab('calendar');
        }
    }, [user, tabsConfig, activeTab, setActiveTab]);

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
        socket.on('server_data_update', (payload: any) => {
            console.log("⚡ Realtime Update:", payload);
            
            const updateReport = setReportData as any;
            const updateOutbreak = setOutbreakData as any;
            const updateMeetings = setMeetings as any;
            const updateDispatch = setDispatchEvents as any;

            switch (payload.type) {
                case 'REPORT_ADDED':
                    updateReport((prev: any[]) => [payload.data, ...prev]);
                    addToast('info', `📝 มีข้อมูลใหม่เข้ามา: ${payload.data.location}`);
                    break;
                case 'REPORT_UPDATED':
                    updateReport((prev: any[]) => prev.map((item: any) => item._id === payload.data._id ? payload.data : item));
                    addToast('info', `✏️ มีการแก้ไขข้อมูล: ${payload.data.location}`);
                    break;
                case 'REPORT_DELETED':
                    updateReport((prev: any[]) => prev.filter((item: any) => item._id !== payload.id));
                    break;
                case 'REPORTS_CLEARED':
                    updateReport([]);
                    addToast('error', '⚠️ ข้อมูลทั้งหมดถูกล้างโดยผู้ดูแลระบบ');
                    break;
                case 'OUTBREAK_ADDED':
                    updateOutbreak((prev: any[]) => [payload.data, ...prev]);
                    addToast('error', `🚨 แจ้งเตือน: พบจุดเสี่ยงโรคระบาดใหม่!`);
                    break;
                case 'OUTBREAK_DELETED':
                    updateOutbreak((prev: any[]) => prev.filter((item: any) => item._id !== payload.id));
                    break;
                case 'OUTBREAK_UPDATED':
                    updateOutbreak((prev: any[]) => prev.map((item: any) => item._id === payload.data._id ? payload.data : item));
                    addToast('info', `📝 แก้ไขจุดเสี่ยงระบาด: ${payload.data.location}`);
                    break;
                case 'SYSTEM_RESTORED':
                    fetchData();
                    break;
                case 'MEETING_ADDED':
                    updateMeetings((prev: any[]) => [...prev, payload.data]);
                    addToast('info', `📅 มีนัดหมายประชุมใหม่: ${payload.data.title}`);
                    break;
                case 'MEETING_DELETED':
                    updateMeetings((prev: any[]) => prev.filter((m: any) => m._id !== payload.id));
                    break;
                case 'MEETING_UPDATED':
                    updateMeetings((prev: any[]) => prev.map((m: any) => m._id === payload.data._id ? payload.data : m));
                    addToast('info', `📝 แก้ไขนัดหมายประชุม: ${payload.data.title}`);
                    break;
                case 'REPORTS_IMPORTED':
                    fetchData();
                    addToast('success', `📥 มีการนำเข้าข้อมูลชุดใหญ่จำนวน ${payload.count} รายการ`);
                    break;
                case 'DISPATCH_ADDED':
                    updateDispatch((prev: any[]) => [...prev, payload.data]);
                    addToast('info', `🚐 แผนออกหน่วยใหม่: ${payload.data.location}`);
                    break;
                case 'DISPATCH_UPDATED':
                    updateDispatch((prev: any[]) => prev.map((ev: any) => ev._id === payload.data._id ? payload.data : ev));
                    addToast('info', `📝 แก้ไขแผนออกหน่วย: ${payload.data.location}`);
                    break;
                case 'DISPATCH_DELETED':
                    updateDispatch((prev: any[]) => prev.filter((ev: any) => ev._id !== payload.id));
                    break;
                case 'TABS_CONFIG_UPDATED':
                    setTabsConfig(payload.data);
                    break;
                case 'BREED_ADDED':
                    setBreeds((prev: any[]) => [...prev, payload.data]);
                    break;
                case 'BREED_DELETED':
                    setBreeds((prev: any[]) => prev.filter(b => b._id !== payload.id));
                    break;
                case 'COLOR_ADDED':
                    setColors((prev: any[]) => [...prev, payload.data]);
                    break;
                case 'COLOR_DELETED':
                    setColors((prev: any[]) => prev.filter(c => c._id !== payload.id));
                    break;
                case 'CUSTOM_UNIT_ADDED':
                    setCustomUnits((prev: any[]) => [...prev, payload.data]);
                    break;
                case 'CUSTOM_UNIT_UPDATED':
                    setCustomUnits((prev: any[]) => prev.map(u => u._id === payload.data._id ? payload.data : u));
                    break;
                case 'CUSTOM_UNIT_DELETED':
                    setCustomUnits((prev: any[]) => prev.filter(u => u._id !== payload.id));
                    break;
                default: break;
            }
        });
        socket.on('system_update_refresh', (payload: any) => {
            addToast('info', `🔄 ${payload.message}`);
            setTimeout(() => { window.location.reload(); }, 3000);
        });
        socket.on('server_notification', (notif: any) => {
            setNotifications(prev => [notif, ...prev]);
            addToast(notif.type || 'info', notif.title);
        });
        return () => { socket.disconnect(); };
    }, [BASE_URL]);

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

    const handleCalendarEventClick = (evt: any) => {
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

    const toggleOutbreakVisibility = (id: string) => {
        setHiddenOutbreakIds((prev: string[]) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const openEditOutbreakModal = (item: any) => { setEditingOutbreak(item); setIsOutbreakModalOpen(true); };
    const openAddOutbreakModal = () => { setEditingOutbreak(null); setIsOutbreakModalOpen(true); };

    const handleAddNewData = async (newRecord: any) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getCurrentToken()}` },
                body: JSON.stringify({
                    date: newRecord.date, location: newRecord.location, lat: parseFloat(newRecord.lat), long: parseFloat(newRecord.long), locationDistrict: newRecord.locationDistrict,
                    district: newRecord.district, subdistrict: newRecord.subdistrict, unit: newRecord.unit, team: newRecord.team, imageUrl: newRecord.imageUrl, mapLink: newRecord.mapLink,
                    note: newRecord.note,
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
                setIsModalOpen(false);
            } else if (response.status === 401 || response.status === 403) {
                addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
                setUser(null);
                localStorage.removeItem('vet_user');
                setIsLoginModalOpen(true);
            } else { 
                addToast('error', "❌ บันทึกไม่สำเร็จ (เกิดข้อผิดพลาดจากเซิร์ฟเวอร์)"); 
            }
        } catch (error) { addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
    };

    const handleUpdateData = async (id: string, updatedRecord: any) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getCurrentToken()}` },
                body: JSON.stringify(updatedRecord),
            });
            if (response.ok) {
                addToast('success', "✅ แก้ไขข้อมูลสำเร็จ!");
                setEditingItem(null);
                setIsModalOpen(false);
            } else if (response.status === 401 || response.status === 403) {
                addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
                setUser(null);
                localStorage.removeItem('vet_user');
                setIsLoginModalOpen(true);
            } else {
                addToast('error', "❌ แก้ไขไม่สำเร็จ (อาจเกิดข้อผิดพลาดจากเซิร์ฟเวอร์)");
            }
        } catch (error) { addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
    };

    const handleDeleteData = async (id: string) => {
        if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?")) {
            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${getCurrentToken()}` }
                });
                if (response.ok) { 
                    addToast('success', "✅ ลบข้อมูลสำเร็จ"); 
                } else if (response.status === 401 || response.status === 403) {
                    addToast('error', "❌ เซสชันหมดอายุ หรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่");
                    setUser(null);
                    localStorage.removeItem('vet_user');
                    setIsLoginModalOpen(true);
                } else { 
                    addToast('error', "❌ ลบไม่สำเร็จ (อาจเกิดข้อผิดพลาดจากเซิร์ฟเวอร์)"); 
                }
            } catch (error) { addToast('error', "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
        }
    };
    

    const handleClearAllData = async () => {
        if (!isTopAdmin) {
            alert("⛔️ ขออภัย เฉพาะระดับผู้บริหารเท่านั้นที่มีสิทธิ์ล้างข้อมูล");
            return;
        }
        setIsClearDataModalOpen(true);
    };


    const handleGenerateMockData = () => {
        const count = 500;
        if (!window.confirm(`⚠️ ยืนยันการจำลองข้อมูล ${count} เคส?\n(ข้อมูลนี้จะแสดงผลทันทีแต่ 'ยังไม่ถูกบันทึก' ลงฐานข้อมูลจริง)`)) return;
        
        const newMockData = generateMockDataRecords(count);
        setReportData((prev: any[]) => [...newMockData, ...prev]);
        alert(`✅ สร้างข้อมูลจำลอง ${count} เคสเรียบร้อยแล้ว!\n(ข้อมูลจะหายไปเมื่อรีเฟรชหน้าเว็บ)`);
    };

    const handleFileUpload = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== "text/csv" && !file.name.endsWith('.csv')) { 
            alert("กรุณาอัปโหลดไฟล์นามสกุล .csv เท่านั้น"); 
            return; 
        }
        
        const reader = new FileReader();
        reader.onload = async (event: any) => {
            try {
                const { bulkData, failCount, totalRows } = parseReportCSV(event.target.result);
                
                if (totalRows === 0) { alert("ไฟล์ไม่มีข้อมูล"); return; }
                
                const confirmImport = window.confirm(`พบข้อมูล ${totalRows} แถว ต้องการนำเข้าทั้งหมดในครั้งเดียวหรือไม่?`);
                if (!confirmImport) return;

                if (bulkData.length === 0) {
                    alert("ไม่พบข้อมูลที่ถูกต้องสำหรับนำเข้า");
                    return;
                }

                const response = await fetch(`${BASE_URL}/api/reports/bulk`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getCurrentToken()}` 
                    },
                    body: JSON.stringify(bulkData)
                });

                if (response.ok) {
                    const result = await response.json();
                    alert(`✅ นำเข้าข้อมูลสำเร็จทั้งหมด ${result.count} รายการ\n(ข้อมูลที่ไม่สมบูรณ์และถูกข้าม: ${failCount})`);
                    window.location.reload();
                } else {
                    alert("❌ เกิดข้อผิดพลาดจาก Server ในการบันทึกข้อมูล");
                }
            } catch (error) { 
                console.error(error);
                alert("เกิดข้อผิดพลาดในการอ่านไฟล์ CSV"); 
            }
        };
        reader.readAsText(file);
    };

    const openAddModal = useCallback(() => { setEditingItem(null); setIsModalOpen(true); }, [setEditingItem, setIsModalOpen]);
    const openEditModal = useCallback((item: any) => { setEditingItem(item); setIsModalOpen(true); }, [setEditingItem, setIsModalOpen]);
    const handleOpenCsvOutbreak = useCallback(() => { setCsvMode('outbreak'); setIsCsvModalOpen(true); }, [setCsvMode, setIsCsvModalOpen]);
    const handleOpenCsvReport = useCallback(() => { setCsvMode('report'); setIsCsvModalOpen(true); }, [setCsvMode, setIsCsvModalOpen]);

    const openMeetingForm = useCallback(() => { setViewingMeeting(null); setIsMeetingModalOpen(true); }, [setViewingMeeting, setIsMeetingModalOpen]);
    const editMeetingFromList = useCallback((m: any) => { setViewingMeeting(m); setIsMeetingListOpen(false); setIsMeetingModalOpen(true); }, [setViewingMeeting, setIsMeetingListOpen, setIsMeetingModalOpen]);

    const handleClearFilters = useCallback(() => {
        setSearchTerm(''); setSelectedYear('ทั้งหมด'); setSelectedMonth('ทั้งหมด'); setSelectedUnit('ทั้งหมด'); setSelectedDistrict('ทั้งหมด'); setSearchDate('');
    }, [setSearchTerm, setSelectedYear, setSelectedMonth, setSelectedUnit, setSelectedDistrict, setSearchDate]);

    const handleRestoreSuccess = useCallback(() => { window.location.reload(); }, []);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

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
                } 
                else if (!isYearAll || !isMonthAll) {
                    if (!item.date) return false;
                    const dateParts = String(item.date).split('-');
                    if (dateParts.length < 2) return false;
                    
                    if (!isYearAll && dateParts[0] !== String(deferredYear)) return false;
                    if (!isMonthAll && parseInt(dateParts[1], 10) !== parseInt(deferredMonth, 10)) return false;
                }

                const itemUnit = item.unit ? String(item.unit).trim() : '';
                const itemDistrict = item.district ? String(item.district).trim() : '';

                if (!isUnitAll && itemUnit !== String(deferredUnit).trim()) return false;
                if (!isDistrictAll && itemDistrict !== String(deferredDistrict).trim()) return false;

                if (lowerSearch) {
                    const itemLocation = item.location ? String(item.location).toLowerCase() : '';
                    const itemDistrictLower = itemDistrict.toLowerCase();
                    const itemSubdistrict = item.subdistrict ? String(item.subdistrict).toLowerCase() : '';
                    const itemUnitLower = itemUnit.toLowerCase();
                    const itemTeam = item.team ? String(item.team).toLowerCase() : '';
                    const itemDetails = item.details ? JSON.stringify(item.details).toLowerCase() : ''; 

                    if (!itemLocation.includes(lowerSearch) && 
                        !itemDistrictLower.includes(lowerSearch) && 
                        !itemSubdistrict.includes(lowerSearch) &&
                        !itemUnitLower.includes(lowerSearch) &&
                        !itemTeam.includes(lowerSearch) &&
                        !itemDetails.includes(lowerSearch)) {
                        return false;
                    }
                }
                return true;
            } catch (error) {
                console.error("Filter Error:", error);
                return false; 
            }
        });
    }, [deferredReportData, deferredYear, deferredMonth, deferredUnit, deferredDistrict, deferredSearchTerm, searchDate]);

    const handleCsvFileChange = useCallback((e: any) => {
        if (csvMode === 'outbreak') handleOutbreakFileUpload(e);
        else handleFileUpload(e);
    }, [csvMode]);

    const handleCsvExport = useCallback((filters: any) => {
        let dataToExport = csvMode === 'outbreak' ? outbreakData : reportData;

        if (filters) {
            dataToExport = dataToExport.filter((item: any) => {
                const isYearAll = filters.year === 'ทั้งหมด';
                const isMonthAll = filters.month === 'ทั้งหมด';
                const isUnitAll = filters.unit === 'ทั้งหมด';
                const isDistrictAll = filters.district === 'ทั้งหมด';

                if (!isYearAll || !isMonthAll) {
                    if (!item.date) return false;
                    const dateParts = String(item.date).split('-');
                    if (dateParts.length < 2) return false;
                    
                    if (!isYearAll && dateParts[0] !== String(filters.year)) return false;
                    if (!isMonthAll && parseInt(dateParts[1], 10) !== parseInt(filters.month, 10)) return false;
                }

                const itemUnit = item.unit ? String(item.unit).trim() : '';
                const itemDistrict = item.district ? String(item.district).trim() : '';

                if (csvMode !== 'outbreak' && !isUnitAll) {
                    if (itemUnit !== String(filters.unit).trim()) return false;
                }
                
                if (!isDistrictAll && itemDistrict !== String(filters.district).trim()) return false;

                return true;
            });
        }

        if (csvMode === 'outbreak') {
            if (filters?.format === 'excel') {
                exportOutbreaksToExcel(dataToExport as any[]);
            } else {
                exportOutbreaksToCSV(dataToExport as any[]);
            }
        } else {
            if (filters?.format === 'excel') {
                exportToExcel(dataToExport as any[]);
            } else {
                exportToCSV(dataToExport as any[]);
            }
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
        const newMapDisplayData: any[] = [];
        const newTotals = { 
            vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0,
            dog: { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 },
            cat: { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 }
        };
        const unitDict: any = {};
        const districtDict: any = {};

        if (!Array.isArray(filteredData)) {
            return { mapDisplayData: [], totals: newTotals, unitStats: [], unitByDistrictPieData: [], unitByUnitTypePieData: [], unitByWorkTypePieData: [] };
        }

        const toNum = (val: any) => parseInt(val, 10) || 0;

        for (let i = 0; i < filteredData.length; i++) {
            const curr = filteredData[i];

            const v = toNum(curr.stats?.vaccine);
            const s = toNum(curr.stats?.sterilize);
            const r = toNum(curr.stats?.register);
            const m = toNum(curr.stats?.microchip);
            const med = toNum(curr.stats?.medical);
            const workTotal = v + s + r + m + med;

            if (curr.lat && curr.long && !isNaN(parseFloat(curr.lat as string)) && !isNaN(parseFloat(curr.long as string)) && (parseFloat(curr.lat as string) !== 0 || parseFloat(curr.long as string) !== 0)) {
                newMapDisplayData.push(curr);
            }

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

            const unitName = curr.unit || 'ไม่ระบุ';
            if (!unitDict[unitName]) {
                unitDict[unitName] = { name: unitName, count: 0, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0, dog: 0, cat: 0 };
            }
            unitDict[unitName].count += 1;
            unitDict[unitName].vaccine += v; unitDict[unitName].sterilize += s; unitDict[unitName].register += r; unitDict[unitName].microchip += m; unitDict[unitName].medical += med;
            unitDict[unitName].total += workTotal;
            unitDict[unitName].dog += (toNum(d.vaccine) + toNum(d.maleSterilize) + toNum(d.femaleSterilize) + toNum(d.microchip) + toNum(d.register) + toNum(d.medical));
            unitDict[unitName].cat += (toNum(c.vaccine) + toNum(c.maleSterilize) + toNum(c.femaleSterilize) + toNum(c.microchip) + toNum(c.register) + toNum(c.medical));

            const distName = curr.district || 'ไม่ระบุ';
            if (!districtDict[distName]) districtDict[distName] = { name: distName, value: 0 };
            districtDict[distName].value += workTotal;
        }

        const newUnitStats = Object.values(unitDict).sort((a: any, b: any) => b.total - a.total);

        return {
            mapDisplayData: newMapDisplayData,
            totals: newTotals,
            unitStats: newUnitStats,
            unitByDistrictPieData: Object.values(districtDict).sort((a: any, b: any) => b.value - a.value).slice(0, 10),
            unitByUnitTypePieData: newUnitStats.map((u: any) => ({ name: u.name, value: u.total })).slice(0, 10),
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
        const unitDict: any = {};
        
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
            const toNum = (val: any) => parseInt(val, 10) || 0;
            
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
            .sort((a: any, b: any) => b.totalWork - a.totalWork)
            .slice(0, 5)
            .map((unit: any) => {
                const sortedDistricts = Object.entries(unit.districts)
                    .map(([dName, dData]: [string, any]) => ({ name: dName, total: dData.total, stats: dData.stats }))
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5);
                return { ...unit, topDistricts: sortedDistricts };
            });

        const newRankingUnitStats = values.sort((a: any, b: any) => b.count - a.count || b.total - a.total);

        return { rankingNestedStats: newRankingNestedStats, rankingUnitStats: newRankingUnitStats };
    }, [reportData, rankingYear, rankingMonth]);
    
    const dispatchStats = useMemo(() => {
        const initStats = () => {
            const stats: any = { count: 0, other: 0 };
            allUnits.forEach((u: string) => {
                stats[u] = 0;
            });
            return stats;
        };

        const baseYear = String(chartBaseYear) === 'ทั้งหมด' ? new Date().getFullYear() : Number(chartBaseYear);
        const baseMonth = String(chartBaseMonth) === 'ทั้งหมด' ? (new Date().getMonth() + 1) : Number(chartBaseMonth);

        const monthMap: any = {};
        const dayMap: any = {};

        filteredData.forEach(item => {
            const day = item.date;
            const m = item.date.substring(0, 7);
            
            const uKey = item.unit && allUnits.includes(item.unit) ? item.unit : 'other';
            
            if (!monthMap[m]) monthMap[m] = initStats();
            monthMap[m].count += 1;
            monthMap[m][uKey] += 1;

            if (!dayMap[day]) dayMap[day] = initStats();
            dayMap[day].count += 1;
            dayMap[day][uKey] += 1;
        });

        const monthlyData = [];
        for (let i = 9 + freqMonthlyOffset; i >= freqMonthlyOffset; i--) {
            const d = new Date(baseYear as number, (baseMonth as number) - 1, 1);
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

        const dailyData = [];
        for (let i = 13 + freqDailyOffset; i >= freqDailyOffset; i--) {
            const isCurrentMonth = baseYear === new Date().getFullYear() && baseMonth === (new Date().getMonth() + 1);
            const d = isCurrentMonth ? new Date() : new Date(baseYear as number, baseMonth as number, 0);
            
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
    }, [filteredData, freqMonthlyOffset, freqDailyOffset, chartBaseYear, chartBaseMonth, allUnits]); // อย่าลืมเพิ่ม allUnits ใน Dependency Array

    const trendData = useMemo(() => {
        const baseYear = String(chartBaseYear) === 'ทั้งหมด' ? new Date().getFullYear() : Number(chartBaseYear);
        const baseMonth = String(chartBaseMonth) === 'ทั้งหมด' ? (new Date().getMonth() + 1) : Number(chartBaseMonth);

        const dataMap = filteredData.reduce((acc: any, curr) => {
            const month = curr.date.substring(0, 7);
            const toNum = (val: any) => parseInt(val, 10) || 0;
            
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
            const d = new Date(baseYear as number, (baseMonth as number) - 1, 1); 
            d.setMonth(d.getMonth() - i);
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const monthStr = `${year}-${month}`; 
            
            last10Months.push(dataMap[monthStr] || { name: monthStr, count: 0, vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0, total: 0 });
        }
        return last10Months;
    }, [filteredData, trendOffset, chartBaseYear, chartBaseMonth]);

    const availableOutbreakYears = useMemo(() => [...new Set(outbreakData.map((item: any) => item.date ? item.date.split('-')[0] : null).filter((y: any) => y !== null))].sort().reverse(), [outbreakData]);

    const visibleOutbreakYears = useMemo(() => {
        return availableOutbreakYears.filter((year: any) => tabsConfig?.[`outbreak_year_${year}`] !== false);
    }, [availableOutbreakYears, tabsConfig]);

    const filteredOutbreaks = useMemo(() => {
        const allowedData = outbreakData.filter((item: any) => {
            const y = item.date ? item.date.split('-')[0] : null;
            return y && visibleOutbreakYears.includes(y);
        });

        return outbreakFilterYear === 'ทั้งหมด' ? allowedData : allowedData.filter((item: any) => item.date && item.date.startsWith(outbreakFilterYear));
    }, [outbreakData, outbreakFilterYear, visibleOutbreakYears]);
    const outbreakStats = useMemo(() => {
        const total = filteredOutbreaks.length;
        const grouped = filteredOutbreaks.reduce((acc: any, curr: any) => { acc[curr.district] = (acc[curr.district] || 0) + 1; return acc; }, {});
        const topDistricts = Object.keys(grouped).map(key => ({ name: key, count: grouped[key] })).sort((a, b) => b.count - a.count).slice(0, 5);
        const animalStats = {
            owned: { dogMale: 0, dogFemale: 0, catMale: 0, catFemale: 0 },
            unowned: { dogMale: 0, dogFemale: 0, catMale: 0, catFemale: 0 },
            feeder: { dogMale: 0, dogFemale: 0, catMale: 0, catFemale: 0 }
        };

        filteredOutbreaks.forEach((item: any) => {
            if (item.stats) {
                (['owned', 'unowned', 'feeder'] as const).forEach(type => {
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
                dogMale: animalStats.owned.dogMale, dogFemale: animalStats.owned.dogFemale,
                catMale: animalStats.owned.catMale, catFemale: animalStats.owned.catFemale
            },
            {
                name: 'ไม่มีเจ้าของ',
                dogMale: animalStats.unowned.dogMale, dogFemale: animalStats.unowned.dogFemale,
                catMale: animalStats.unowned.catMale, catFemale: animalStats.unowned.catFemale
            },
            {
                name: 'ผู้ให้อาหาร',
                dogMale: animalStats.feeder.dogMale, dogFemale: animalStats.feeder.dogFemale,
                catMale: animalStats.feeder.catMale, catFemale: animalStats.feeder.catFemale
            }
        ];

        return { total, topDistricts, animalChartData };
    }, [filteredOutbreaks]);
    
    const outbreakYearlyTrend = useMemo(() => {
        const stats = outbreakData.reduce((acc: any, curr: any) => { if (!curr.date) return acc; const year = curr.date.split('-')[0]; acc[year] = (acc[year] || 0) + 1; return acc; }, {});
        return Object.keys(stats).sort().map(year => ({ name: year, count: stats[year] }));
    }, [outbreakData]);

    const outbreakPieData = useMemo(() => {
        const grouped = filteredOutbreaks.reduce((acc: any, curr: any) => {
            const district = curr.district || 'ไม่ระบุ';
            if (!acc[district]) acc[district] = { name: district, value: 0 };
            acc[district].value += 1;
            return acc;
        }, {});
        return Object.values(grouped).sort((a: any, b: any) => b.value - a.value).slice(0, 10);
    }, [filteredOutbreaks]);

    const dogCatChartData = useMemo(() => {
        if (!totals) return [];
        return [
            { name: 'ฉีดวัคซีน', สุนัข: totals.dog.vaccine, แมว: totals.cat.vaccine },
            { name: 'ผ่าตัดทำหมัน', สุนัข: totals.dog.sterilize, แมว: totals.cat.sterilize },
            { name: 'จดทะเบียน', สุนัข: totals.dog.register, แมว: totals.cat.register },
            { name: 'ฝังไมโครชิป', สุนัข: totals.dog.microchip, แมว: totals.cat.microchip },
            { name: 'รักษาพยาบาล', สุนัข: totals.dog.medical, แมว: totals.cat.medical }
        ];
    }, [totals]);

    // ==========================================
    // DATA PREP: สำหรับกราฟ 5 (Year over Year Trend)
    // ==========================================
    const yoyTrendData = useMemo(() => {
        const currentYear = String(chartBaseYear) === 'ทั้งหมด' ? new Date().getFullYear() : Number(chartBaseYear);
        const prevYear = currentYear - 1;

        const monthlyStats: any = {};
        for (let i = 1; i <= 12; i++) {
            const m = String(i).padStart(2, '0');
            const shortMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
            monthlyStats[m] = { name: shortMonths[i - 1], current: 0, prev: 0 };
        }

        if (Array.isArray(filteredData)) {
            filteredData.forEach((item: any) => {
                if (!item.date) return;
                const [year, month] = item.date.split('-');
                const y = parseInt(year, 10);
                
                const toNum = (val: any) => parseInt(val, 10) || 0;
                const workTotal = toNum(item.stats?.vaccine) + toNum(item.stats?.sterilize) + 
                                  toNum(item.stats?.register) + toNum(item.stats?.microchip) + toNum(item.stats?.medical);

                if (y === currentYear && monthlyStats[month]) {
                    monthlyStats[month].current += workTotal;
                } else if (y === prevYear && monthlyStats[month]) {
                    monthlyStats[month].prev += workTotal;
                }
            });
        }

        return Object.values(monthlyStats);
    }, [filteredData, chartBaseYear]);

    const genderSterilizationData = useMemo(() => {
        let dogMale = 0, dogFemale = 0;
        let catMale = 0, catFemale = 0;

        if (Array.isArray(filteredData)) {
            filteredData.forEach(item => {
                const d = item.details?.dog || {};
                const c = item.details?.cat || {};

                dogMale += (parseInt(d.maleSterilize as any, 10) || 0);
                dogFemale += (parseInt(d.femaleSterilize as any, 10) || 0);
                catMale += (parseInt(c.maleSterilize as any, 10) || 0);
                catFemale += (parseInt(c.femaleSterilize as any, 10) || 0);
            });
        }

        return [
            { name: 'สุนัข', 'ตัวผู้': dogMale, 'ตัวเมีย': dogFemale },
            { name: 'แมว', 'ตัวผู้': catMale, 'ตัวเมีย': catFemale }
        ];
    }, [filteredData]);

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 overflow-hidden">
            <style>{`
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
                
                @keyframes slideLeft {
                    0% { transform: translateX(100%); opacity: 0; }
                    10% { transform: translateX(0); opacity: 1; }
                    90% { transform: translateX(0); opacity: 1; }
                    100% { transform: translateX(-100%); opacity: 0; }
                }
                .animate-slide-left {
                    animation: slideLeft 8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <Suspense fallback={<div className="hidden">Loading...</div>}>
                <AddDataModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddNewData} onUpdate={handleUpdateData} initialData={editingItem as any} onToast={addToast} />
                <AddOutbreakModal isOpen={isOutbreakModalOpen} onClose={() => setIsOutbreakModalOpen(false)} onSave={handleAddOutbreak} onUpdate={handleUpdateOutbreak} initialData={editingOutbreak as any} onToast={addToast} breeds={breeds} colors={colors}/>
                <CustomUnitModal isOpen={isCustomUnitModalOpen} onClose={() => setIsCustomUnitModalOpen(false)} apiBaseUrl={BASE_URL} token={user?.token as any} onToast={addToast} />

                <BreedModal isOpen={isBreedModalOpen} onClose={() => setIsBreedModalOpen(false)} apiBaseUrl={BASE_URL} token={user?.token as any} onToast={addToast} />
                <ColorModal isOpen={isColorModalOpen} onClose={() => setIsColorModalOpen(false)} apiBaseUrl={BASE_URL} token={user?.token as any} onToast={addToast} />
            </Suspense>

            <CsvActionModal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} onFileChange={handleCsvFileChange} onExport={handleCsvExport} availableYears={csvMode === 'outbreak' ? availableOutbreakYears : availableYears} thaiMonths={THAI_MONTHS} units={allUnits} districts={BANGKOK_DISTRICTS} csvMode={csvMode}/>
            <BackupSystemModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} onRestoreSuccess={handleRestoreSuccess} token={user?.token as any} apiBaseUrl={BASE_URL} />
            <ImagePreviewModal imageUrl={viewImage} onClose={() => setViewImage(null)} />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} apiBaseUrl={BASE_URL} onToast={addToast} />
            <UserManagementModal isOpen={isUserMgmtOpen} onClose={() => setIsUserMgmtOpen(false)} token={user?.token as any} apiBaseUrl={BASE_URL} onToast={addToast} currentUserRole={user?.role}/>
            <DuplicateReportModal 
                isOpen={isDuplicateModalOpen} 
                onClose={() => setIsDuplicateModalOpen(false)} 
                reports={reportData} 
                dispatchEvents={dispatchEvents} 
                onSelectRecord={handleNavigateFromDuplicate}
            />
            <ClearDataModal isOpen={isClearDataModalOpen} onClose={() => setIsClearDataModalOpen(false)} onConfirm={executeClearAllData} availableYears={availableYears as any} units={UNIT_TYPES} thaiMonths={THAI_MONTHS}/>
            <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} apiBaseUrl={BASE_URL} token={user?.token as any} onToast={addToast} />
            <ActivityLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} token={user?.token as any} apiBaseUrl={BASE_URL} currentUserRole={user?.role} />
            <DispatchModal isOpen={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} onToast={addToast} onSave={handleSaveDispatchEvent as any} onDelete={handleDeleteDispatch} initialData={viewingDispatch as any} />
            <MeetingCalendarDashboard isOpen={isMeetingCalendarOpen} onClose={() => setIsMeetingCalendarOpen(false)} events={meetingEventsOnly} onOpenForm={openMeetingForm} onEventClick={handleCalendarEventClick} />
            <MeetingModal isOpen={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)} onSave={handleSaveMeeting as any} onDelete={handleDeleteMeeting} initialData={viewingMeeting as any} onToast={addToast} />
            <MeetingListModal isOpen={isMeetingListOpen} onClose={() => setIsMeetingListOpen(false)} meetings={meetings as any} onEdit={editMeetingFromList as any} />
            
            <Sidebar 
                user={user} canEdit={canEdit} canAdd={canAdd} 
                isSystemDeveloper={isSystemDeveloper}
                isDevOrSuper={isTopAdmin}
                activeTab={activeTab} setActiveTab={setActiveTab}
                isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed}
                isSystemMenuOpen={isSystemMenuOpen} setIsSystemMenuOpen={setIsSystemMenuOpen}
                onLogin={() => setIsLoginModalOpen(true)} 
                onLogout={handleLogout} 
                onChangePassword={() => setIsChangePasswordOpen(true)}
                onOpenLog={() => setIsLogModalOpen(true)} 
                onOpenUserMgmt={() => setIsUserMgmtOpen(true)} 
                onOpenBackup={() => setIsBackupModalOpen(true)}
                onOpenCsvOutbreak={handleOpenCsvOutbreak} onOpenCsvReport={handleOpenCsvReport} onGenerateMock={handleGenerateMockData} onClearData={handleClearAllData} 
                onOpenCustomUnits={() => setIsCustomUnitModalOpen(true)}
                onOpenMeetingList={() => setIsMeetingListOpen(true)} 
                onOpenCalendar={() => setIsCalendarOpen(true)} 
                onOpenMeetingCalendar={() => setIsMeetingCalendarOpen(true)}
                onOpenAddOutbreak={openAddOutbreakModal} 
                onOpenAddData={openAddModal}
                onOpenBreedMgmt={() => setIsBreedModalOpen(true)}
                onOpenColorMgmt={() => setIsColorModalOpen(true)}
                isMagaAdmin={isMagaAdmin}
                tabsConfig={tabsConfig} toggleTab={toggleTab}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                onNotifyUpdate={handleNotifySystemUpdate}
                availableOutbreakYears={availableOutbreakYears as string[]}
                notifications={notifications}
                isNotifOpen={isNotifOpen}
                setIsNotifOpen={setIsNotifOpen}
                markAllAsRead={markAllAsRead}
                unreadCount={unreadCount}
                onOpenDuplicateCheck={() => setIsDuplicateModalOpen(true)}
            />

            {isMobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-slate-900/50 z-[4999] backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0">
                
                <AnnouncementManager canEdit={canEdit} addToast={addToast} />

                <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 z-30 shadow-sm shrink-0 relative">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <List className="w-6 h-6" />
                </button>
                <img src="https://github.com/ekkarat74/VeterinaryDashboard/blob/main/images.jpg?raw=true" className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-900/5" alt="Logo" />
                <h1 className="text-sm font-bold text-slate-800">ระบบสัตวแพทย์เคลื่อนที่</h1>
            </div>
            
            <div className="flex items-center gap-2">
                {user ? (
                    <>
                        <div className="relative">
                            <button 
                                onClick={() => { setIsNotifOpen(!isNotifOpen); if (unreadCount > 0) markAllAsRead(); }} 
                                className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors relative"
                            >
                                <Bell className="w-5 h-5"/>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse border border-white"></span>
                                )}
                            </button>
                            
                            {isNotifOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[9999] animate-in slide-in-from-top-2">
                                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                        <span className="font-bold text-xs text-slate-700">การแจ้งเตือนล่าสุด</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                        {notifications.length === 0 ? (
                                            <div className="text-center py-4 text-xs text-slate-400">ไม่มีการแจ้งเตือน</div>
                                        ) : (
                                            notifications.map((n, i) => (
                                                <div key={i} className={`p-2 rounded-lg text-xs ${!n.isRead ? 'bg-indigo-50/50' : ''}`}>
                                                    <div className="font-bold text-slate-800">{n.title}</div>
                                                    <div className="text-slate-500 mt-0.5">{n.message}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"><LogOut className="w-5 h-5"/></button>
                    </>
                ) : (
                    <button onClick={() => setIsLoginModalOpen(true)} className="p-2 text-indigo-600 hover:text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"><Unlock className="w-5 h-5"/></button>
                )}
            </div>
        </div>

                <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-y-auto pb-24 md:pb-8 custom-scrollbar">
                    <div className="bg-gradient-to-r from-[#6B4BFA] to-indigo-500 rounded-2xl p-6 mb-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-5 relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
    
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shrink-0 border border-white/20 shadow-inner">
                            <Activity className="w-8 h-8 text-white" />
                        </div>
                        <div className="relative z-10">
                            <h1 className="text-2xl font-bold mb-1">ระบบรายงานและจัดการข้อมูลสัตวแพทย์เคลื่อนที่</h1>
                            <p className="text-indigo-100 text-sm max-w-2xl leading-relaxed">
                                ระบบสำหรับเจ้าหน้าที่เพื่อบันทึก ติดตาม และประมวลผลข้อมูลการให้บริการสัตวแพทย์เคลื่อนที่ 
                                ครอบคลุมการฉีดวัคซีน ทำหมัน ฝังไมโครชิป และเฝ้าระวังจุดเสี่ยงโรคพิษสุนัขบ้าในพื้นที่กรุงเทพมหานคร
                            </p>
                        </div>
                    </div>

                    {activeTab !== 'outbreak' && (
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
                                            {searchDate && <span className="inline-flex items-center gap-1 bg-pink-50 text-pink-600 text-[10px] px-2.5 py-1 rounded-md font-bold border border-pink-100">วันที่: {searchDate}</span>}
                                            {selectedYear !== 'ทั้งหมด' && <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] px-2.5 py-1 rounded-md font-bold border border-blue-100">ปี {parseInt(selectedYear as string) + 543}</span>}
                                            {selectedMonth !== 'ทั้งหมด' && <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] px-2.5 py-1 rounded-md font-bold border border-blue-100">{THAI_MONTHS[parseInt(selectedMonth as string) - 1]}</span>}
                                            {selectedUnit !== 'ทั้งหมด' && <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] px-2.5 py-1 rounded-md font-bold border border-emerald-100">{selectedUnit}</span>}
                                            {selectedDistrict !== 'ทั้งหมด' && <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 text-[10px] px-2.5 py-1 rounded-md font-bold border border-orange-100">{selectedDistrict}</span>}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {/* เพิ่มปุ่มสลับมุมมอง */}
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        <button 
                                            onClick={() => setDisplayMode('list')} 
                                            className={`px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-bold rounded-md transition-all ${displayMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <LayoutList className="w-3.5 h-3.5" /> แบบรายการ
                                        </button>
                                        <button 
                                            onClick={() => setDisplayMode('table')} 
                                            className={`px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-bold rounded-md transition-all ${displayMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Columns className="w-3.5 h-3.5" /> แบบตาราง/ไทม์ไลน์
                                        </button>
                                    </div>

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
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">ค้นหา (สถานที่/รายละเอียด)</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input type="text" placeholder="พิมพ์คำค้นหา..." className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">วันที่ (Date)</label>
                                        <input type="date" className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer text-slate-600" value={searchDate} onChange={(e) => { setSearchDate(e.target.value); if (e.target.value) { setSelectedYear('ทั้งหมด'); setSelectedMonth('ทั้งหมด'); } }} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">ปี (Year)</label>
                                        <select className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                                            <option value="ทั้งหมด">-- เลือกปี --</option>
                                            {availableYears.map(y => <option key={y as string} value={y as string}>{parseInt(y as string) + 543}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">เดือน (Month)</label>
                                        <select className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                                            <option value="ทั้งหมด">-- เลือกเดือน --</option>
                                            {THAI_MONTHS.map((m, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">หน่วยงาน (Unit)</label>
                                        <select className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                                            <option value="ทั้งหมด">-- เลือกหน่วยงาน --</option>
                                            {allUnits.map((u, i) => <option key={i} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">เขต (District)</label>
                                        <select className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
                                            <option value="ทั้งหมด">-- เลือกเขต --</option>
                                            {BANGKOK_DISTRICTS.map((d, i) => <option key={i} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <Suspense fallback={<DashboardSkeleton />}>
                        {isInitialLoading ? (
                            <div className="py-6">
                                <DashboardSkeleton />
                            </div>
                        ) : (
                            <>
                                {activeTab === 'overview' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto">
                                        <KPISection totals={totals} unitStats={unitStats as any[]} />
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
                                            <div className="lg:col-span-5 flex flex-col gap-8">
                                                <RankingSection type="table" rankingYear={rankingYear} setRankingYear={setRankingYear} rankingMonth={rankingMonth} setRankingMonth={setRankingMonth} availableYears={availableYears  as any[]} thaiMonths={THAI_MONTHS} rankingUnitStats={rankingUnitStats as any[]} />
                                                <RankingSection type="deepdive" rankingNestedStats={rankingNestedStats} />
                                            </div>
            
                                            <div className="lg:col-span-7 flex flex-col gap-8">
                                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex-1 relative z-0">
                                                    <LeafletMap 
                                                        data={mapDisplayData}
                                                        outbreaks={filteredOutbreaks as any[]} 
                                                        onEdit={openEditModal} 
                                                        onEditOutbreak={openEditOutbreakModal} 
                                                        canEdit={canEdit}
                                                    />
                                                </div>
                
                                                <div className="h-full">
                                                    <UnitComparisonChart unitStats={unitStats as any[]} />
                                                </div>
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
                                            setChartBaseYear={setChartBaseYear as any}
                                            chartBaseMonth={chartBaseMonth}
                                            setChartBaseMonth={setChartBaseMonth as any}
                                            availableYears={availableYears as any[]}
                                            allUnits={allUnits}
                                        />

                                        <PieChartsSection 
                                            unitByDistrictPieData={unitByDistrictPieData as any[]}
                                            unitByUnitTypePieData={unitByUnitTypePieData as any[]}
                                            unitByWorkTypePieData={unitByWorkTypePieData as any[]}
                                            outbreakPieData={outbreakPieData as any[]}
                                        />

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            <DogCatComparisonChart data={dogCatChartData} />
                                            <GenderSterilizationChart data={genderSterilizationData} />
                                            <YearOverYearChart 
                                                data={yoyTrendData} 
                                                currentYear={String(chartBaseYear) === 'ทั้งหมด' ? new Date().getFullYear() : Number(chartBaseYear)} 
                                            />
                                        </div>

                                        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                                            <ComprehensiveAllInOneChart data={filteredData} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'database' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto">
                                        <MainDataTable 
                                            data={filteredData as any} 
                                            canEdit={canEdit} 
                                            onClearAll={handleClearAllData} 
                                            onEdit={openEditModal} 
                                            onDelete={handleDeleteData} 
                                            onViewImage={setViewImage} 
                                            displayMode={displayMode} // <--- ส่งค่า Prop ให้ Component รับไปสลับการแสดงผล
                                        />
                                    </div>
                                )}

                                {activeTab === 'outbreak' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto">
                                        <RabiesOutbreakSection 
                                            outbreakData={outbreakData as any} 
                                            filterYear={outbreakFilterYear} 
                                            setFilterYear={setOutbreakFilterYear} 
                                            years={visibleOutbreakYears as any[]} 
                                            stats={outbreakStats} 
                                            filteredOutbreaks={filteredOutbreaks as any} 
                                            yearlyTrend={outbreakYearlyTrend} 
                                            hiddenIds={hiddenOutbreakIds} 
                                            toggleVisibility={toggleOutbreakVisibility} 
                                            onEdit={openEditOutbreakModal} 
                                            onDelete={handleDeleteOutbreak} 
                                            canEdit={canEdit} 
                                            displayMode={displayMode} // <--- ส่งค่า Prop ให้ Component รับไปสลับการแสดงผล
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </Suspense>
                    {activeTab !== 'calendar' && (
                        <Footer />
                    )}
                </main>
            </div>

            {(() => {
                const checkMobileTabVisibility = (tabName: string) => {
                    if (!user) return tabsConfig?.[`public_${tabName}`];
                    if (user.role === 'executive') return tabsConfig?.[`sa_${tabName}`];
                    
                    return true; 
                };

                return (
                    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-[4000] px-2 py-2 flex justify-around items-center safe-area-pb">
                        {checkMobileTabVisibility('overview') && (
                            <button onClick={() => setActiveTab('overview')} 
                                className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all ${activeTab === 'overview' ? 'text-indigo-600 font-bold bg-indigo-50 scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Activity className="w-5 h-5 mb-1" />
                                <span className="text-[8px]">ภาพรวมออกหน่วยเคลื่อนที่</span>
                            </button>
                        )}
                        {checkMobileTabVisibility('database') && (
                            <button onClick={() => setActiveTab('database')} 
                                className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all ${activeTab === 'database' ? 'text-emerald-600 font-bold bg-emerald-50 scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Database className="w-5 h-5 mb-1" />
                                <span className="text-[8px]">ฐานข้อมูลออกหน่วยเคลื่อนที่</span>
                            </button>
                        )}
                        {checkMobileTabVisibility('outbreak') && (
                            <button onClick={() => setActiveTab('outbreak')} 
                                className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all ${activeTab === 'outbreak' ? 'text-red-600 font-bold bg-red-50 scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Siren className="w-5 h-5 mb-1" />
                                <span className="text-[8px]">จุดเสี่ยงโรคพิสุนัขบ้า</span>
                            </button>
                        )}
                        {checkMobileTabVisibility('calendar') && (
                            <button onClick={() => window.open('/DispatchCalendarDashboard', '_blank')} 
                                className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all text-slate-500 hover:bg-slate-50`}
                            >
                                <CalendarDays className="w-5 h-5 mb-1" />
                                <span className="text-[8px]">ปฏิทินออกหน่วยเคลื่อนที่</span>
                            </button>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}