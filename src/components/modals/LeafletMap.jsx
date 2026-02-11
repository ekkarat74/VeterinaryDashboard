import React, { useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { 
    Filter, AlertTriangle, ChevronDown, Map as MapIcon, 
    PawPrint, MapPin, Trash2 
} from 'lucide-react';

import { UNIT_TYPES } from '../../constants/locations'; 

const LeafletMap = ({ data, outbreaks = [], onDeleteOutbreak }) => {
    const centerPosition = [13.7563, 100.5018];
    const [activeLayers, setActiveLayers] = useState(UNIT_TYPES);
    const [activeRadii, setActiveRadii] = useState([1000, 3000]); 
    const [expandedUnit, setExpandedUnit] = useState(null);

    const toggleLayer = (unit) => {
        setActiveLayers(prev => prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]);
    };

    const toggleRadius = (radius) => {
        setActiveRadii(prev => prev.includes(radius) ? prev.filter(r => r !== radius) : [...prev, radius]);
    };

    // --- Logic: Calculate Stats per Unit ---
    const getUnitStats = (unitName) => {
        // กรองข้อมูลเฉพาะหน่วยงานนั้น
        const unitData = data.filter(d => d.unit === unitName);
        const totalTimes = unitData.length;
        const totalAnimals = unitData.reduce((sum, item) => {
            const s = item.stats || {};
            return sum + (s.vaccine||0) + (s.sterilize||0) + (s.register||0) + (s.microchip||0) + (s.medical||0);
        }, 0);

        return { totalTimes, totalAnimals };
    };

    // --- Logic: Custom Icons ---
    const createDangerIcon = useCallback(() => {
        return L.divIcon({
            className: 'custom-danger-marker',
            html: `
                <div class="relative w-10 h-10 flex items-center justify-center">
                    <div class="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
                    <div class="relative z-10 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                </div>
            `,
            iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20]
        });
    }, []);

    const getMarkerColor = (unit) => {
        switch (unit) {
            case 'หน่วยผู้ว่า': return '#a855f7';
            case 'หน่วยสัตวแพทย์': return '#3b82f6';
            case 'หน่วยวัคซีน + ไมโครชิป': return '#22c55e';
            case 'หน่วยกรงแมว': return '#f97316';
            case 'หน่วยทำหมัน': return '#db2777';
            case 'หน่วยอื่น ๆ': return '#0d9488';
            default: return '#64748b';
        }
    };

    const displayData = useMemo(() => {
        return data.filter(item => activeLayers.includes(item.unit));
    }, [data, activeLayers]);

    const createNumberIcon = (total, color) => {
        // ใช้สี Gradient ตามประเภท
        const getGradient = (c) => {
            if(c === '#a855f7') return 'from-purple-500 to-indigo-600'; // ผู้ว่า
            if(c === '#3b82f6') return 'from-blue-500 to-blue-600';      // สัตวแพทย์
            if(c === '#22c55e') return 'from-green-500 to-emerald-600'; // วัคซีน
            if(c === '#f97316') return 'from-orange-400 to-orange-600'; // กรงแมว
            if(c === '#db2777') return 'from-pink-500 to-rose-600';      // ทำหมัน
            if(c === '#0d9488') return 'from-teal-500 to-cyan-600';      // อื่นๆ
            return 'from-slate-500 to-slate-600';
        };

        const bgGradient = getGradient(color);
        const size = total > 999 ? 42 : (total > 99 ? 36 : 30);
        
        return L.divIcon({
            className: 'custom-marker-wrapper', 
            html: `
                <div class="relative transition-transform hover:scale-110 duration-200 ease-out" style="width: ${size}px; height: ${size}px;">
                    <div class="absolute inset-0 rounded-full bg-gradient-to-br ${bgGradient} shadow-md border-2 border-white flex items-center justify-center">
                        <span class="text-white font-extrabold font-sans text-[${size > 36 ? '11px' : '10px'}] drop-shadow-sm">${total.toLocaleString()}</span>
                    </div>
                    <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-slate-200"></div>
                </div>`,
            iconSize: [size, size], iconAnchor: [size / 2, size + 5], popupAnchor: [0, -(size + 5)]
        });
    };

    return (
        <div className="w-full h-full flex flex-col relative z-0 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
            
            {/* --- UI Control Panel (ขวาบน) --- */}
            <div className="absolute top-4 right-4 z-[500] flex flex-col gap-3 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/50 w-[240px] animate-in slide-in-from-right-4 duration-500">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-indigo-500" /> Layers & Stats
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{UNIT_TYPES.length} หน่วย</span>
                </div>
                
                {/* Unit List & Stats Dropdown */}
                <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto custom-scrollbar pr-1">
                    {UNIT_TYPES.map((unit) => {
                        const color = getMarkerColor(unit);
                        const isActive = activeLayers.includes(unit);
                        const isExpanded = expandedUnit === unit;
                        const stats = getUnitStats(unit);

                        return (
                            <div key={unit} className={`rounded-xl transition-all duration-300 border ${isExpanded ? 'bg-white shadow-lg border-slate-100 ring-1 ring-slate-100' : 'bg-slate-50/50 border-transparent hover:bg-white hover:shadow-sm'}`}>
                                {/* Top Row: Toggle & Dropdown Trigger */}
                                <div className="flex items-center p-1.5">
                                    {/* Left: Checkbox Toggle */}
                                    <button onClick={() => toggleLayer(unit)} className="flex-1 flex items-center gap-2.5 text-left group">
                                        <div className={`w-8 h-5 rounded-full p-0.5 transition-colors duration-300 flex items-center ${isActive ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${isActive ? 'translate-x-3' : 'translate-x-0'}`} />
                                        </div>
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color }}></span>
                                            <span className={`text-[11px] font-bold truncate transition-colors ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>{unit}</span>
                                        </div>
                                    </button>

                                    {/* Right: Dropdown Arrow */}
                                    <button onClick={() => setExpandedUnit(isExpanded ? null : unit)} className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${isExpanded ? 'bg-slate-100 text-slate-600 rotate-180' : 'text-slate-400 hover:bg-white hover:shadow-sm'}`}>
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Dropdown Content (Stats) */}
                                {isExpanded && (
                                    <div className="px-3 pb-3 pt-1 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Stat 1: จำนวนครั้ง */}
                                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-slate-200 transition-colors"
                                                style={{ backgroundColor: `${color}10` }}>
                                                <div className="text-[10px] text-slate-500 font-medium mb-0.5 flex items-center gap-1">
                                                    <MapIcon className="w-3 h-3 opacity-50" /> ออกหน่วย
                                                </div>
                                                <div className="text-sm font-black text-slate-700 group-hover:scale-110 transition-transform">
                                                    {stats.totalTimes.toLocaleString()}
                                                </div>
                                            </div>

                                            {/* Stat 2: จำนวนสัตว์ */}
                                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-slate-200 transition-colors"
                                                style={{ backgroundColor: `${color}15` }}>
                                                <div className="text-[10px] text-slate-500 font-medium mb-0.5 flex items-center gap-1">
                                                    <PawPrint className="w-3 h-3 opacity-50" /> สัตว์รวม
                                                </div>
                                                <div className="text-sm font-black group-hover:scale-110 transition-transform" style={{ color: color }}>
                                                    {stats.totalAnimals.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Radius Control */}
                <div className="pt-3 border-t border-slate-100">
                    <div className="text-xs font-extrabold text-slate-600 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500" /> รัศมี (Radius)
                    </div>
                    <div className="flex gap-1">
                        {[
                            { val: 1000, label: '1km', color: 'bg-red-600' },
                            { val: 3000, label: '3km', color: 'bg-red-400' },
                            { val: 5000, label: '5km', color: 'bg-orange-400' }
                        ].map((r) => {
                            const isActive = activeRadii.includes(r.val);
                            return (
                                <button key={r.val} onClick={() => toggleRadius(r.val)}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm border ${isActive ? `${r.color} text-white border-transparent shadow-md transform scale-105` : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}>
                                    {r.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* CSS Injection for Custom Marker */}
            <style>{`
                .custom-marker-wrapper { background: transparent; border: none; }
            `}</style>

            {/* --- MAP CONTAINER --- */}
            <div className="flex-1 w-full h-full">
                <MapContainer center={centerPosition} zoom={10} scrollWheelZoom={true} style={{ height: "100%", width: "100%", background: "#f1f5f9", zIndex: 0 }}>
                    <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    {/* 1. General Reports with Clustering */}
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
                                        <div className="font-sans flex flex-col">
                                            {item.imageUrl && (
                                                <div className="w-full h-32 overflow-hidden relative">
                                                    <img src={item.imageUrl} alt="site" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                                    <span className="absolute bottom-2 left-2 text-white text-xs font-bold drop-shadow-md">{item.unit}</span>
                                                </div>
                                            )}
                                            <div className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 text-sm leading-tight">{item.location}</h3>
                                                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3"/> {item.district}</p>
                                                    </div>
                                                    <div className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-600 border border-slate-200">
                                                        รวม {totalActivity}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                                                    {stats.vaccine > 0 && <div className="text-[10px] text-slate-600 flex justify-between"><span>💉 วัคซีน</span> <span className="font-bold">{stats.vaccine}</span></div>}
                                                    {stats.sterilize > 0 && <div className="text-[10px] text-slate-600 flex justify-between"><span>✂️ ทำหมัน</span> <span className="font-bold">{stats.sterilize}</span></div>}
                                                    {stats.microchip > 0 && <div className="text-[10px] text-slate-600 flex justify-between"><span>🎫 ไมโครชิป</span> <span className="font-bold">{stats.microchip}</span></div>}
                                                    {stats.medical > 0 && <div className="text-[10px] text-slate-600 flex justify-between"><span>💊 รักษา</span> <span className="font-bold">{stats.medical}</span></div>}
                                                </div>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MarkerClusterGroup>

                    {/* 2. Outbreaks Layer (Radius & Markers) */}
                    {outbreaks.map((item, index) => {
                        const lat = parseFloat(item.lat);
                        const long = parseFloat(item.long);
                        if (isNaN(lat) || isNaN(long)) return null;

                        return (
                            <React.Fragment key={item._id || `outbreak-${index}`}>
                                {activeRadii.includes(1000) && ( <Circle center={[lat, long]} radius={1000} pathOptions={{ color: '#7f1d1d', fillColor: '#991b1b', fillOpacity: 0.2, weight: 3, opacity: 1, dashArray: null }} /> )}
                                {activeRadii.includes(3000) && ( <Circle center={[lat, long]} radius={3000} pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.08, weight: 2, opacity: 0.8, dashArray: null }} /> )}
                                {activeRadii.includes(5000) && ( <Circle center={[lat, long]} radius={5000} pathOptions={{ color: '#ea580c', fillColor: '#f97316', fillOpacity: 0.05, weight: 2, opacity: 0.7, dashArray: null }} /> )}
                                
                                <Marker position={[lat, long]} icon={createDangerIcon()}>
                                    <Popup>
                                        <div className="font-sans min-w-[200px] p-2 text-center">
                                            <div className="bg-red-50 text-red-600 font-extrabold px-3 py-1 rounded-full text-[10px] inline-flex items-center gap-1 mb-2 border border-red-100 shadow-sm">
                                                <AlertTriangle className="w-3 h-3" /> พบเชื้อพิษสุนัขบ้า
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-sm mb-1">{item.location}</h3>
                                            <p className="text-xs text-slate-500 mb-2 border-b border-slate-100 pb-2">เขต{item.district}</p>
                                            
                                            {(item.stats) && (
                                                <div className="mb-3 bg-red-50 p-2 rounded border border-red-100">
                                                    <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-bold text-slate-600 mb-1 border-b border-red-200 pb-1"><span>ชนิด</span><span>ผู้</span><span>เมีย</span></div>
                                                    <div className="grid grid-cols-3 gap-1 text-[10px] text-center mb-1"><span className="text-slate-500">สุนัข</span><span className="text-slate-800">{item.stats.dog?.male || 0}</span><span className="text-slate-800">{item.stats.dog?.female || 0}</span></div>
                                                    <div className="grid grid-cols-3 gap-1 text-[10px] text-center"><span className="text-slate-500">แมว</span><span className="text-slate-800">{item.stats.cat?.male || 0}</span><span className="text-slate-800">{item.stats.cat?.female || 0}</span></div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-3 gap-1 text-[9px]">
                                                <div className={`rounded p-1 font-bold ${activeRadii.includes(1000) ? 'text-red-900 bg-red-100/50' : 'text-slate-300 bg-slate-50'}`}>1 กม.<br/>ควบคุม</div>
                                                <div className={`rounded p-1 font-bold ${activeRadii.includes(3000) ? 'text-red-600 bg-red-50/50' : 'text-slate-300 bg-slate-50'}`}>3 กม.<br/>เฝ้าระวัง</div>
                                                <div className={`rounded p-1 font-bold ${activeRadii.includes(5000) ? 'text-orange-500 bg-orange-50/50' : 'text-slate-300 bg-slate-50'}`}>5 กม.<br/>แจ้งเตือน</div>
                                            </div>
                                            {onDeleteOutbreak && (
                                                <button onClick={() => onDeleteOutbreak(item._id)} className="mt-3 w-full flex items-center justify-center gap-1 bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold py-1.5 rounded transition-all shadow-sm hover:shadow"><Trash2 className="w-3 h-3" /> ลบแจ้งเหตุนี้</button>
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

export default LeafletMap;