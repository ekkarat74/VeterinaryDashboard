// components/modals/OutbreakMap.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, GeoJSON } from 'react-leaflet';
import bangkokGeoJSON from '../../data/Bangkok-districts.json';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AlertTriangle, Trash2, ChevronDown, ChevronUp, Layers, MapPin, Eye, EyeOff } from 'lucide-react'; // <-- เพิ่ม Eye, EyeOff

const OutbreakMap = ({ outbreaks = [], onDeleteOutbreak }) => {
    const centerPosition = [13.7563, 100.5018];
    const [activeRadii, setActiveRadii] = useState([1000, 3000]); 
    const [isCollapsed, setIsCollapsed] = useState(false);

    const [hiddenMapIds, setHiddenMapIds] = useState([]);

    const toggleMapVisibility = (id) => {
        setHiddenMapIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // --- กรองและเรียงข้อมูลให้แสดงตัวล่าสุดขึ้นก่อน ---
    const recentOutbreaks = useMemo(() => {
        return [...outbreaks].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [outbreaks]);

    const toggleRadius = (radius) => {
        setActiveRadii(prev => prev.includes(radius) ? prev.filter(r => r !== radius) : [...prev, radius]);
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

    return (
        <div className="w-full h-full relative z-0 rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-50 font-sans">
            <style>{`
                .leaflet-popup-content-wrapper { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); border-radius: 16px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); border: 1px solid rgba(255,255,255,0.5); padding: 0; overflow: hidden; }
                .leaflet-popup-content { margin: 0; width: auto !important; }
                .leaflet-popup-tip { background: rgba(255, 255, 255, 0.95); }
                .leaflet-container a.leaflet-popup-close-button { top: 8px; right: 8px; padding: 4px; color: #94a3b8; font-size: 18px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #f1f5f9; }
                .leaflet-container a.leaflet-popup-close-button:hover { color: #ef4444; background: #fee2e2; }
            `}</style>

            {/* --- Control Panel --- */}
            <div className={`absolute top-4 right-4 z-[500] flex flex-col bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-12 h-12 p-0 items-center justify-center' : 'w-[280px] p-0'}`}> 
                <div 
                    className={`flex items-center justify-between cursor-pointer ${isCollapsed ? 'w-full h-full justify-center' : 'p-4'}`}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="bg-red-100 p-1.5 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 leading-none">ตั้งค่าการเฝ้าระวัง</h3>
                            </div>
                        </div>
                    )}
                    {!isCollapsed && (
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <ChevronUp className="w-4 h-4" />
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <div className="p-3 bg-slate-50/80 border-t border-slate-100 rounded-b-2xl backdrop-blur-sm flex flex-col gap-3">
                        
                        {/* --- ส่วนรัศมีแจ้งเตือน --- */}
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                แสดงรัศมีแจ้งเตือน
                            </div>
                            <div className="flex bg-slate-200/50 p-1 rounded-lg">
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
                        </div>

                        {/* --- ส่วนแจ้งเตือนล่าสุด --- */}
                        <div className="border-t border-slate-200/60 pt-3">
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                การแจ้งเตือนล่าสุด
                            </div>
                            
                            <div className="max-h-[150px] overflow-y-auto custom-scrollbar space-y-2 pr-1 pointer-events-auto">
                                {recentOutbreaks.length > 0 ? (
                                    recentOutbreaks.map((item, idx) => {
                                        const isHidden = hiddenMapIds.includes(item._id);
                                        
                                        return (
                                            <div 
                                                key={item._id || idx} 
                                                className={`p-2.5 rounded-xl border shadow-sm flex flex-col gap-1 transition-all duration-300 ${isHidden ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-rose-200'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <p className={`text-xs font-bold truncate pr-2 ${isHidden ? 'text-slate-500' : 'text-slate-800'}`}>
                                                        {item.location}
                                                    </p>
                                                    
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className="text-[9px] text-slate-400 whitespace-nowrap bg-slate-100 px-1 py-0.5 rounded font-medium">
                                                            {new Date(item.date).toLocaleDateString('th-TH', {day: 'numeric', month: 'short'})}
                                                        </span>
                                                        
                                                        {/* --- แก้ไขปุ่มตรงนี้ --- */}
                                                        <div 
                                                            onClick={(e) => { 
                                                                e.preventDefault(); 
                                                                e.stopPropagation(); 
                                                                toggleMapVisibility(item._id); 
                                                            }}
                                                            onPointerDown={(e) => { 
                                                                e.stopPropagation(); // สำคัญ! หยุด Event ไม่ให้ทะลุไป Map
                                                            }}
                                                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors bg-white rounded-md shadow-sm border border-slate-100 cursor-pointer z-50 relative"
                                                            title={isHidden ? "แสดงจุดนี้บนแผนที่" : "ซ่อนจุดนี้จากแผนที่"}
                                                        >
                                                            {isHidden ? <EyeOff className="w-3 h-3 pointer-events-none" /> : <Eye className="w-3 h-3 pointer-events-none" />}
                                                        </div>
                                                        {/* ------------------- */}

                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500">
                                                    <MapPin className="w-2.5 h-2.5" /> {item.district}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center text-xs text-slate-400 py-3 bg-white rounded-xl border border-dashed border-slate-200">
                                        ไม่มีข้อมูลแจ้งเตือน
                                    </div>
                                )}
                            </div>
                        </div>
                        
                    </div>
                )}
            </div>

            {/* --- MAP --- */}
            <MapContainer center={centerPosition} zoom={10} scrollWheelZoom={true} className="w-full h-full bg-slate-100">
                <TileLayer 
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {bangkokGeoJSON && (
                    <GeoJSON 
                        data={bangkokGeoJSON} 
                        style={{ fillColor: '#cbd5e1', fillOpacity: 0.4, color: '#334155', weight: 2, opacity: 1 }}
                    />
                )}
                
                {outbreaks.filter(item => !hiddenMapIds.includes(item._id)).map((item, index) => {
                    const lat = parseFloat(item.lat);
                    const long = parseFloat(item.long);
                    if (isNaN(lat) || isNaN(long)) return null;

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
                                        
                                        <div className="bg-red-50 rounded border border-red-100 p-2 mb-3">
                                            <span className="text-[10px] font-bold text-red-600 block mb-1">สถิติสัตว์ติดเชื้อ</span>
                                            <div className="flex justify-center gap-4 text-xs font-semibold text-slate-700">
                                                <div className="flex flex-col"><span>🐶 สุนัข</span><span>{ (item.stats?.dog?.male||0) + (item.stats?.dog?.female||0) }</span></div>
                                                <div className="w-px bg-red-200"></div>
                                                <div className="flex flex-col"><span>🐱 แมว</span><span>{ (item.stats?.cat?.male||0) + (item.stats?.cat?.female||0) }</span></div>
                                            </div>
                                        </div>

                                        {onDeleteOutbreak && (
                                            <button onClick={() => onDeleteOutbreak(item._id)} className="w-full py-1.5 rounded-md text-xs font-bold bg-white text-red-500 border border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                                                <Trash2 className="w-3 h-3" /> ลบข้อมูล
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
    );
};

export default OutbreakMap;