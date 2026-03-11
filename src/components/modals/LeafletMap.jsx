import React, { useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Circle, GeoJSON } from 'react-leaflet';

import bangkokGeoJSON from '../../data/Bangkok-districts.json';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { 
    Filter, AlertTriangle, ChevronDown, ChevronUp, 
    Map as MapIcon, PawPrint, MapPin, Trash2, Layers, Activity, Eye, EyeOff
} from 'lucide-react';

import { UNIT_TYPES } from '../../constants/locations'; 

const LeafletMap = ({ data = [], outbreaks = [] }) => {
    const centerPosition = [13.7563, 100.5018];
    const [activeLayers, setActiveLayers] = useState(UNIT_TYPES);
    const [activeRadii, setActiveRadii] = useState([1000, 3000]); 
    const [expandedUnit, setExpandedUnit] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    // --- State สำหรับ Outbreak ---
    const [hiddenMapIds, setHiddenMapIds] = useState([]);

    const toggleLayer = (unit) => {
        setActiveLayers(prev => prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]);
    };

    const toggleRadius = (radius) => {
        setActiveRadii(prev => prev.includes(radius) ? prev.filter(r => r !== radius) : [...prev, radius]);
    };

    const toggleMapVisibility = (id) => {
        setHiddenMapIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // กรองและเรียงข้อมูลจุดระบาดให้แสดงตัวล่าสุดขึ้นก่อน
    const recentOutbreaks = useMemo(() => {
        return [...(outbreaks || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [outbreaks]);

    // --- Stats Logic ---
    const getUnitStats = (unitName) => {
        const unitData = (data || []).filter(d => d.unit === unitName);
        const totalTimes = unitData.length;
        const totalAnimals = unitData.reduce((sum, item) => {
            const s = item.stats || {};
            return sum + (s.vaccine||0) + (s.sterilize||0) + (s.register||0) + (s.microchip||0) + (s.medical||0);
        }, 0);
        return { totalTimes, totalAnimals };
    };

    // --- Styles & Colors ---
    const getMarkerColor = (unit) => {
        switch (unit) {
            case 'หน่วยผู้ว่า': return { bg: '#8b5cf6', ring: '#ddd6fe' };
            case 'หน่วยสัตวแพทย์': return { bg: '#3b82f6', ring: '#dbeafe' };
            case 'หน่วยวัคซีน + ไมโครชิป': return { bg: '#10b981', ring: '#d1fae5' };
            case 'หน่วยกรงแมว': return { bg: '#f97316', ring: '#ffedd5' };
            case 'หน่วยทำหมัน': return { bg: '#ec4899', ring: '#fce7f3' };
            case 'หน่วยอื่น ๆ': return { bg: '#06b6d4', ring: '#cffafe' };
            default: return { bg: '#64748b', ring: '#e2e8f0' };
        }
    };

    const createDangerIcon = useCallback(() => {
        return L.divIcon({
            className: 'custom-danger-marker',
            html: `
                <div class="relative w-12 h-12 flex items-center justify-center group">
                    <div class="absolute inset-0 bg-red-500 rounded-full opacity-30 animate-ping"></div>
                    <div class="absolute inset-0 bg-red-500/20 rounded-full animate-pulse"></div>
                    <div class="relative z-10 w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-full border-[3px] border-white shadow-xl flex items-center justify-center text-white transform transition-transform group-hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                </div>
            `,
            iconSize: [48, 48], iconAnchor: [24, 24], popupAnchor: [0, -24]
        });
    }, []);

    const createNumberIcon = (total, colorSet) => {
        const size = total > 999 ? 44 : (total > 99 ? 38 : 34);
        return L.divIcon({
            className: 'custom-marker-wrapper', 
            html: `
                <div class="relative transition-all hover:scale-110 duration-200 ease-out drop-shadow-lg" style="width: ${size}px; height: ${size}px;">
                    <div class="absolute inset-0 rounded-full border-[3px] border-white flex items-center justify-center" style="background-color: ${colorSet.bg};">
                        <span class="text-white font-black font-sans tracking-tight" style="font-size: ${size > 38 ? '11px' : '10px'}">${total.toLocaleString()}</span>
                    </div>
                    <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 rounded-sm shadow-sm"></div>
                    <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 rounded-sm" style="background-color: ${colorSet.bg}; clip-path: polygon(0 0, 100% 0, 0 100%);"></div>
                </div>`,
            iconSize: [size, size], iconAnchor: [size / 2, size + 8], popupAnchor: [0, -(size + 5)]
        });
    };

    const displayData = useMemo(() => {
        return (data || []).filter(item => activeLayers.includes(item.unit));
    }, [data, activeLayers]);

    return (
        <div className="w-full h-full relative z-0 rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-50 font-sans">
            
            <style>{`
                .leaflet-popup-content-wrapper { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); border-radius: 16px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); border: 1px solid rgba(255,255,255,0.5); padding: 0; overflow: hidden; }
                .leaflet-popup-content { margin: 0; width: auto !important; }
                .leaflet-popup-tip { background: rgba(255, 255, 255, 0.95); }
                .leaflet-container a.leaflet-popup-close-button { top: 8px; right: 8px; padding: 4px; color: #94a3b8; font-size: 18px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #f1f5f9; }
                .leaflet-container a.leaflet-popup-close-button:hover { color: #ef4444; background: #fee2e2; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>

            {/* --- Floating Control Panel --- */}
            <div className={`absolute top-4 right-4 z-[500] flex flex-col bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white transition-all duration-300 ease-in-out ${isCollapsed ? 'w-12 h-12 p-0 items-center justify-center' : 'w-[280px] p-0'}`}> 
                
                <div 
                    className={`flex items-center justify-between cursor-pointer ${isCollapsed ? 'w-full h-full justify-center' : 'p-4 border-b border-slate-100/80'}`}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? (
                        <Layers className="w-5 h-5 text-indigo-600" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-100 p-1.5 rounded-lg">
                                <Filter className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 leading-none">ตัวกรองแผนที่</h3>
                                <span className="text-[10px] text-slate-500 font-medium">จัดการการแสดงผลบนแผนที่</span>
                            </div>
                        </div>
                    )}
                    {!isCollapsed && (
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                            <ChevronUp className="w-4 h-4" />
                        </div>
                    )}
                </div>

                {/* Content Panel */}
                {!isCollapsed && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-top-2 duration-300 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        
                        {/* 1. Unit List (ข้อมูลผลการปฏิบัติงาน) */}
                        {data && data.length > 0 && (
                            <div className="p-3 space-y-1.5">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                                    ประเภทหน่วยออกงาน
                                </div>
                                {UNIT_TYPES.map((unit) => {
                                    const colorSet = getMarkerColor(unit);
                                    const isActive = activeLayers.includes(unit);
                                    const isExpanded = expandedUnit === unit;
                                    const stats = getUnitStats(unit);

                                    return (
                                        <div key={unit} className={`group rounded-xl transition-all duration-200 border ${isExpanded ? 'bg-white shadow-md border-slate-100' : 'bg-transparent border-transparent hover:bg-white/60'}`}>
                                            <div className="flex items-center p-2">
                                                <button onClick={() => toggleLayer(unit)} className="flex-1 flex items-center gap-3 text-left">
                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isActive ? 'bg-slate-800 border-slate-800' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                                                        {isActive && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                                    </div>
                                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm`} style={{ backgroundColor: colorSet.bg }}></span>
                                                        <span className={`text-xs font-semibold truncate transition-colors ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>{unit}</span>
                                                    </div>
                                                </button>

                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setExpandedUnit(isExpanded ? null : unit); }} 
                                                    className={`w-6 h-6 flex items-center justify-center rounded-md transition-all ${isExpanded ? 'bg-slate-100 text-slate-800' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-600'}`}
                                                >
                                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            </div>

                                            {isExpanded && (
                                                <div className="px-2 pb-2 mx-2 mb-1 border-t border-slate-100/80 pt-2 grid grid-cols-2 gap-2">
                                                    <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                                                        <div className="text-[10px] text-slate-500 mb-1 flex items-center justify-center gap-1"><Activity className="w-3 h-3"/> ครั้ง</div>
                                                        <div className="text-sm font-bold text-slate-700">{stats.totalTimes.toLocaleString()}</div>
                                                    </div>
                                                    <div className="rounded-lg p-2 text-center border" style={{ backgroundColor: colorSet.ring, borderColor: colorSet.bg + '30' }}>
                                                        <div className="text-[10px] opacity-80 mb-1 flex items-center justify-center gap-1" style={{ color: colorSet.bg }}><PawPrint className="w-3 h-3"/> สัตว์</div>
                                                        <div className="text-sm font-bold" style={{ color: colorSet.bg }}>{stats.totalAnimals.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* 2. รัศมีแจ้งเตือนและจุดเกิดเหตุล่าสุด (เพิ่มใหม่) */}
                        {(outbreaks && outbreaks.length > 0) && (
                            <div className="border-t border-slate-200/80 mt-1 pt-4 pb-3 px-3 bg-red-50/40">
                                
                                {/* รัศมีแจ้งเตือน */}
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1 ml-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> รัศมีแจ้งเตือนจุดเสี่ยง
                                </div>
                                <div className="flex bg-slate-200/50 p-1 rounded-lg mb-4">
                                    {[
                                        { val: 1000, label: '1 กม.', color: 'text-red-600 bg-white shadow-sm' },
                                        { val: 3000, label: '3 กม.', color: 'text-red-500 bg-white shadow-sm' },
                                        { val: 5000, label: '5 กม.', color: 'text-orange-500 bg-white shadow-sm' }
                                    ].map((r) => {
                                        const isActive = activeRadii.includes(r.val);
                                        return (
                                            <button 
                                                key={r.val} 
                                                onClick={() => toggleRadius(r.val)}
                                                className={`flex-1 py-1 rounded-[6px] text-[10px] font-bold transition-all duration-200 ${isActive ? r.color : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {r.label}
                                            </button>
                                        );
                                    })}
                                </div>

                               {/* การแจ้งเตือนล่าสุด */}
                                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5 ml-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                    จุดแจ้งเตือนล่าสุด
                                </div>
                                
                                {/* เพิ่ม max-h-[180px], overflow-y-auto และ custom-scrollbar ตรงนี้ */}
                                <div className="max-h-[180px] overflow-y-auto custom-scrollbar space-y-2 pr-1 pb-1">
                                    {recentOutbreaks.map((item, idx) => {
                                        const isHidden = hiddenMapIds.includes(item._id);
                                        return (
                                            <div 
                                                key={item._id || idx} 
                                                className={`p-2.5 rounded-xl border shadow-sm flex flex-col gap-1 transition-all duration-300 ${isHidden ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-rose-200'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <p className={`text-xs font-bold truncate pr-2 ${isHidden ? 'text-slate-500' : 'text-slate-800'}`} title={item.location}>
                                                        {item.location}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className="text-[9px] text-slate-400 whitespace-nowrap bg-slate-100 px-1 py-0.5 rounded font-medium">
                                                            {new Date(item.date).toLocaleDateString('th-TH', {day: 'numeric', month: 'short'})}
                                                        </span>
                                                        <div 
                                                            onClick={(e) => { 
                                                                e.preventDefault(); 
                                                                e.stopPropagation(); 
                                                                toggleMapVisibility(item._id); 
                                                            }}
                                                            onPointerDown={(e) => { e.stopPropagation(); }}
                                                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors bg-white rounded-md shadow-sm border border-slate-100 cursor-pointer z-50 relative"
                                                            title={isHidden ? "แสดงจุดนี้บนแผนที่" : "ซ่อนจุดนี้จากแผนที่"}
                                                        >
                                                            {isHidden ? <EyeOff className="w-3 h-3 pointer-events-none" /> : <Eye className="w-3 h-3 pointer-events-none" />}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500">
                                                    <MapPin className="w-2.5 h-2.5" /> {item.district}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- MAP CONTENT --- */}
            <MapContainer center={centerPosition} zoom={10} scrollWheelZoom={true} className="w-full h-full bg-slate-100">
                <TileLayer 
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* ขอบเขตกรุงเทพมหานคร */}
                {bangkokGeoJSON && (
                    <GeoJSON 
                        data={bangkokGeoJSON} 
                        style={{
                            fillColor: '#cbd5e1',
                            fillOpacity: 0.4, 
                            color: '#334155',
                            weight: 2,
                            opacity: 1
                        }}
                    />
                )}
                
                {/* 1. Unit Markers (ข้อมูลปกติ) */}
                <MarkerClusterGroup 
                    key={activeLayers.join(',')} 
                    chunkedLoading 
                    maxClusterRadius={45}
                    showCoverageOnHover={false}
                    polygonOptions={{ fillColor: '#94a3b8', color: '#64748b', weight: 1, opacity: 0.5, fillOpacity: 0.2 }}
                >
                    {displayData.map((item) => {
                        const lat = parseFloat(item.lat);
                        const long = parseFloat(item.long);
                        if (isNaN(lat) || isNaN(long) || lat === 0 || long === 0) return null;
                        
                        const stats = item.stats || { vaccine: 0, sterilize: 0, register: 0, microchip: 0, medical: 0 };
                        const totalActivity = stats.vaccine + stats.sterilize + stats.register + stats.microchip + (stats.medical || 0);
                        const colorSet = getMarkerColor(item.unit);

                        return (
                            <Marker key={item._id} position={[lat, long]} icon={createNumberIcon(totalActivity, colorSet)}>
                                <Tooltip direction="top" offset={[0, -38]} opacity={1} className="!bg-slate-800 !text-white !border-0 !rounded-md !px-2 !py-1 !font-bold !text-xs !shadow-lg">
                                    {item.location}
                                </Tooltip>
                                <Popup>
                                    <div className="font-sans flex flex-col w-[260px]">
                                        <div className="w-full h-32 bg-slate-100 relative group overflow-hidden">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt="site" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                                    <MapIcon className="w-12 h-12 opacity-50" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold text-white mb-1 shadow-sm" style={{ backgroundColor: colorSet.bg }}>
                                                    {item.unit}
                                                </span>
                                                <h3 className="font-bold text-white text-base leading-tight drop-shadow-md truncate">{item.location}</h3>
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{item.district || 'ไม่ระบุเขต'}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                {stats.vaccine > 0 && (
                                                    <div className="bg-emerald-50 rounded-lg p-2 flex flex-col items-center justify-center border border-emerald-100">
                                                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">วัคซีน</span>
                                                        <span className="text-lg font-black text-emerald-700">{stats.vaccine}</span>
                                                    </div>
                                                )}
                                                {stats.sterilize > 0 && (
                                                    <div className="bg-pink-50 rounded-lg p-2 flex flex-col items-center justify-center border border-pink-100">
                                                        <span className="text-[10px] text-pink-600 font-bold uppercase tracking-wider">ทำหมัน</span>
                                                        <span className="text-lg font-black text-pink-700">{stats.sterilize}</span>
                                                    </div>
                                                )}
                                                {stats.microchip > 0 && (
                                                    <div className="bg-blue-50 rounded-lg p-2 flex flex-col items-center justify-center border border-blue-100">
                                                        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">ไมโครชิป</span>
                                                        <span className="text-lg font-black text-blue-700">{stats.microchip}</span>
                                                    </div>
                                                )}
                                                {stats.medical > 0 && (
                                                    <div className="bg-orange-50 rounded-lg p-2 flex flex-col items-center justify-center border border-orange-100">
                                                        <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">รักษา</span>
                                                        <span className="text-lg font-black text-orange-700">{stats.medical}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                                                <span className="text-[10px] text-slate-400 font-medium">กิจกรรมรวมทั้งสิ้น</span>
                                                <div className="text-2xl font-black text-slate-800 leading-none mt-0.5">{totalActivity.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MarkerClusterGroup>

                {/* 2. Outbreak Markers & Circles (จุดระบาดและรัศมี แจ้งเตือน) */}
                {(outbreaks || []).filter(item => !hiddenMapIds.includes(item._id)).map((item, index) => {
                    const lat = parseFloat(item.lat);
                    const long = parseFloat(item.long);
                    if (isNaN(lat) || isNaN(long)) return null;

                    const getNum = (val) => parseInt(val, 10) || 0;
                    let dogCount = 0; let catCount = 0;

                    if (item.stats) {
                        ['owned', 'unowned', 'feeder'].forEach(type => {
                            if (item.stats[type]) {
                                dogCount += getNum(item.stats[type].dog?.male) + getNum(item.stats[type].dog?.female);
                                catCount += getNum(item.stats[type].cat?.male) + getNum(item.stats[type].cat?.female);
                            }
                        });
                    }

                    // รวมข้อมูลหากมีฟิลด์ตรงๆ
                    dogCount += getNum(item.stats?.dog?.male) + getNum(item.stats?.dog?.female) + 
                        getNum(item.dog?.male) + getNum(item.dog?.female) + 
                        getNum(item.dogMale) + getNum(item.dogFemale) +
                        getNum(item.stats?.dogs) + getNum(item.dogs);
                                     
                    catCount += getNum(item.stats?.cat?.male) + getNum(item.stats?.cat?.female) + 
                        getNum(item.cat?.male) + getNum(item.cat?.female) + 
                        getNum(item.catMale) + getNum(item.catFemale) +
                        getNum(item.stats?.cats) + getNum(item.cats);

                    return (
                        <React.Fragment key={item._id || `outbreak-${index}`}>
                            {activeRadii.includes(1000) && <Circle center={[lat, long]} radius={1000} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1, weight: 1, dashArray: '4 4' }} />}
                            {activeRadii.includes(3000) && <Circle center={[lat, long]} radius={3000} pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.05, weight: 1, dashArray: '2 6' }} />}
                            {activeRadii.includes(5000) && <Circle center={[lat, long]} radius={5000} pathOptions={{ color: '#eab308', fillColor: '#eab308', fillOpacity: 0.03, weight: 1 }} />}
                            
                            <Marker position={[lat, long]} icon={createDangerIcon()}>
                                <Popup>
                                    <div className="w-[220px] p-1 font-sans text-center">
                                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 text-red-600">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-base">{item.location}</h3>
                                        <p className="text-xs text-slate-500 mb-3">{item.district}</p>
                                        
                                        <div className="bg-red-50 rounded border border-red-100 p-2 mb-1">
                                            <span className="text-[10px] font-bold text-red-600 block mb-1">สถิติสัตว์ติดเชื้อ</span>
                                            <div className="flex justify-center gap-4 text-xs font-semibold text-slate-700">
                                                <div className="flex flex-col"><span>🐶 สุนัข</span><span>{ dogCount }</span></div>
                                                <div className="w-px bg-red-200"></div>
                                                <div className="flex flex-col"><span>🐱 แมว</span><span>{ catCount }</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        </React.Fragment>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default LeafletMap;