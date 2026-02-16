import React from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react'; // อย่าลืม import X และ Calendar
import { UNIT_TYPES, BANGKOK_DISTRICTS } from '../../constants/locations';

const FilterBar = ({
    searchTerm, setSearchTerm,
    searchDate, setSearchDate,
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    selectedUnit, setSelectedUnit,
    selectedDistrict, setSelectedDistrict,
    availableYears,
    thaiMonths
}) => {

    // ฟังก์ชันช่วย Reset ค่า
    const clearSearch = () => setSearchTerm('');
    const clearDate = () => setSearchDate('');

    return (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            {/* Row 1: Search & Date */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
                
                {/* Search Input */}
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                        placeholder="ค้นหาสถานที่, รายละเอียด..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                    {searchTerm && (
                        <button onClick={clearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Date Input */}
                <div className="relative w-full md:w-auto min-w-[200px] group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input 
                        type="date" 
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer" 
                        value={searchDate} 
                        onChange={(e) => setSearchDate(e.target.value)} 
                    />
                    {searchDate && (
                        <button onClick={clearDate} className="absolute inset-y-0 right-0 pr-3 flex items-center text-red-400 hover:text-red-600" title="ล้างวันที่">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Row 2: Dropdowns */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                    
                    {/* Label */}
                    <div className="flex items-center gap-2 text-slate-700 font-bold min-w-max pb-2 lg:pb-0 border-b lg:border-b-0 border-slate-100 w-full lg:w-auto">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <Filter className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm">ตัวกรองละเอียด</span>
                    </div>

                    {/* Selects Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                        
                        {/* Year */}
                        <div className="relative">
                            <select 
                                disabled={!!searchDate} 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(e.target.value)} 
                                className="w-full bg-slate-50 hover:bg-white border border-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="ทั้งหมด">📅 ทุกปี</option>
                                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        {/* Month */}
                        <div className="relative">
                            <select 
                                disabled={!!searchDate} 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(e.target.value)} 
                                className="w-full bg-slate-50 hover:bg-white border border-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="ทั้งหมด">🗓️ ทุกเดือน</option>
                                {thaiMonths.map((m, index) => <option key={index} value={index + 1}>{m}</option>)}
                            </select>
                        </div>

                        {/* Unit */}
                        <div className="relative">
                            <select 
                                value={selectedUnit} 
                                onChange={(e) => setSelectedUnit(e.target.value)} 
                                className="w-full bg-slate-50 hover:bg-white border border-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="ทั้งหมด">🏥 ทุกหน่วยงาน</option>
                                {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>

                        {/* District (ตัวปัญหาเดิม) */}
                        <div className="relative">
                            <select 
                                value={selectedDistrict} 
                                onChange={(e) => setSelectedDistrict(e.target.value)} 
                                className="w-full bg-slate-50 hover:bg-white border border-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="ทั้งหมด">📍 ทุกเขต</option>
                                {BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;