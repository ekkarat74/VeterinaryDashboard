import React from 'react';
import { Search, Filter } from 'lucide-react';
import { UNIT_TYPES, BANGKOK_DISTRICTS } from '../../constants/locations'; // ตรวจสอบ path ให้ถูกต้อง

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
    return (
        <div className="space-y-4">
            {/* Row 1: Search & Date */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input 
                        type="text" 
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                        placeholder="ค้นหา..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
                <div className="relative w-full md:w-auto min-w-[200px]">
                    <input 
                        type="date" 
                        className="block w-full pl-3 pr-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-sm focus:outline-none focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        value={searchDate} 
                        onChange={(e) => setSearchDate(e.target.value)} 
                    />
                    {searchDate && (
                        <button onClick={() => setSearchDate('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-red-500 font-bold">
                            ล้างค่า
                        </button>
                    )}
                </div>
            </div>

            {/* Row 2: Detailed Filters */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <div className="bg-blue-50 p-2 rounded-lg">
                        <Filter className="w-5 h-5 text-blue-600" />
                    </div>
                    <span>ตัวกรองละเอียด :</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
                    {/* Year Select */}
                    <select 
                        disabled={!!searchDate} 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(e.target.value)} 
                        className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ทั้งหมด">ทุกปี</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    {/* Month Select */}
                    <select 
                        disabled={!!searchDate} 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)} 
                        className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ทั้งหมด">ทุกเดือน</option>
                        {thaiMonths.map((m, index) => <option key={index} value={index + 1}>{m}</option>)}
                    </select>

                    {/* Unit Select */}
                    <select 
                        value={selectedUnit} 
                        onChange={(e) => setSelectedUnit(e.target.value)} 
                        className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ทั้งหมด">ทุกหน่วยงาน</option>
                        {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>

                    {/* District Select */}
                    <select 
                        value={selectedDistrict} 
                        onChange={(e) => setSelectedDistrict(e.target.value)} 
                        className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ทั้งหมด">ทุกเขต</option>
                        {BANGKOK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;