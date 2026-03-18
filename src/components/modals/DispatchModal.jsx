import React, { useState, useEffect } from 'react';
import { 
  Activity, X, Bell, MapPin, Link as LinkIcon, Users, 
  Share2, Trash2, ChevronRight, Info, Calendar, Clock, 
  Plus, UserPlus, FileText, ChevronDown 
} from 'lucide-react';

// ตรวจสอบ Path ของ constants ให้ถูกต้อง
import { UNIT_TYPES, BANGKOK_DISTRICTS } from '../../constants/locations';

// --- Sub-Component: StaffInputGroup ---
const StaffInputGroup = ({ roleKey, label, staffList, onAdd, onRemove, onChange, icon: Icon }) => (
  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-indigo-500" />}
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>
      </div>
      <span className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
        {staffList.length} คน
      </span>
    </div>
    
    <div className="p-3 space-y-2">
      {staffList.map((person, idx) => (
        <div key={idx} className="flex gap-2 group">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder={`ชื่อ-สกุล ลำดับที่ ${idx + 1}`}
              className="w-full pl-3 pr-3 py-1.5 text-sm bg-slate-50 border-0 rounded-md ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-300"
              value={person}
              onChange={(e) => onChange(roleKey, idx, e.target.value)}
            />
          </div>
          {staffList.length > 1 && (
            <button 
              type="button" 
              onClick={() => onRemove(roleKey, idx)} 
              className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      
      <button 
        type="button" 
        onClick={() => onAdd(roleKey)} 
        className="w-full py-1.5 mt-1 flex items-center justify-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-100 border-dashed transition-colors"
      >
        <Plus className="w-3 h-3" /> เพิ่มรายชื่อ
      </button>
    </div>
  </div>
);

// --- Main Component: DispatchModal ---
const DispatchModal = ({ isOpen, onClose, onToast, onSave, onDelete, initialData }) => {

  const formatDateLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const UNIT_OPTIONS = [
    { value: 'sterilization', label: 'หน่วยสัตว์แพทย์ (Veterinary Unit)', color: 'text-blue-600', icon: '🏥' },
    { value: 'microchip', label: 'หน่วยวัคซีน + ไมโครชิป', color: 'text-teal-600', icon: '💉' },
    { value: 'governor', label: 'หน่วยผู้ว่า (Governor Unit)', color: 'text-purple-600', icon: '👔' },
    { value: 'cat_cage', label: 'หน่วยกรงแมว (Cat Cage)', color: 'text-orange-600', icon: '🐱' },
    { value: 'other', label: 'หน่วยอื่น ๆ (Other)', color: 'text-gray-600', icon: '📋' }
  ];

  const LETTER_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  const COLOR_OPTIONS = [
    { value: 'bg-red-500', label: 'สีแดง', emoji: '🔴' },
    { value: 'bg-blue-500', label: 'สีน้ำเงิน', emoji: '🔵' },
    { value: 'bg-green-500', label: 'สีเขียว', emoji: '🟢' },
    { value: 'bg-yellow-400', label: 'สีเหลือง', emoji: '🟡' },
    { value: 'bg-purple-500', label: 'สีม่วง', emoji: '🟣' },
    { value: 'bg-orange-500', label: 'สีส้ม', emoji: '🟠' },
    { value: 'bg-pink-500', label: 'สีชมพู', emoji: '🩷' },
    { value: 'bg-slate-400', label: 'สีเทา', emoji: '⚫' }
  ];

  const [unitType, setUnitType] = useState('sterilization'); 
  const [customUnitName, setCustomUnitName] = useState('');
  const [unitLetter, setUnitLetter] = useState(''); 
  const [unitColor, setUnitColor] = useState('bg-blue-500'); 
  const [generalInfo, setGeneralInfo] = useState({
    date: new Date().toISOString().split('T')[0],
    locationName: '',
    district: '',
    mapLink: '',
    departureTime: '07:30',
    closingTime: '12:00',
    note: ''
  });

  const [staff, setStaff] = useState({
    vets: ['', ''], registration: [''], prep_catch: [''], prep_shave: [''], prep_lift: [''], 
    vaccine_staff: [''], surgery_assist: [''], drivers: [''], assistants: [''] 
  });

  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setUnitType(initialData.unitType || 'sterilization');
      setCustomUnitName(initialData.customUnitName || '');
      setUnitLetter(initialData.unitLetter || ''); 
      setUnitColor(initialData.unitColor || 'bg-blue-500'); 
      setGeneralInfo({
        date: initialData.date.split('T')[0], 
        locationName: initialData.location,
        district: initialData.district || '',
        mapLink: initialData.mapLink || '',
        departureTime: initialData.time || '07:30',
        closingTime: initialData.closingTime || '12:00',
        note: initialData.note || ''
      });
      if (initialData.staff) setStaff(initialData.staff);
    } else if (isOpen && !initialData) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setUnitType('sterilization');
      setCustomUnitName('');
      setUnitLetter(''); 
      setUnitColor('bg-blue-500'); 
      setGeneralInfo({
        date: formatDateLocal(tomorrow), 
        locationName: '', district: '', mapLink: '',
        departureTime: '07:30', closingTime: '12:00', note: ''
      });
      setStaff({ vets: ['', ''], registration: [''], prep_catch: [''], prep_shave: [''], prep_lift: [''], vaccine_staff: [''], surgery_assist: [''], drivers: [''], assistants: [''] });
    }
  }, [isOpen, initialData]);

  const handleStaffChange = (role, index, value) => {
    const newRoleList = [...staff[role]];
    newRoleList[index] = value;
    setStaff({ ...staff, [role]: newRoleList });
  };

  const addStaffField = (role) => {
    setStaff({ ...staff, [role]: [...staff[role], ''] });
  };

  const removeStaffField = (role, index) => {
    const newRoleList = [...staff[role]];
    newRoleList.splice(index, 1);
    setStaff({ ...staff, [role]: newRoleList });
  };

  if (!isOpen) return null;

  const handleSendLine = () => {
    if (!generalInfo.locationName) {
      if(onToast) onToast('error', 'กรุณาระบุสถานที่');
      else alert('กรุณาระบุสถานที่');
      return;
    }

    const formatStaffList = (list) => list.filter(s => s.trim()).join(', ') || '-';
    const currentUnit = UNIT_OPTIONS.find(u => u.value === unitType);
    const currentColor = COLOR_OPTIONS.find(c => c.value === unitColor);
    
    const displayUnitName = unitType === 'other' && customUnitName.trim() !== '' 
      ? customUnitName 
      : currentUnit?.label;

    const unitNameDisplay = `${currentUnit?.label} ${unitLetter}`.trim();
    
    let staffDetails = "";
    const commonStaff = `👨‍⚕️ สัตวแพทย์: ${formatStaffList(staff.vets)}\n🚐 พนักงานขับรถ: ${formatStaffList(staff.drivers)}`;

    if (unitType === 'sterilization') {
      staffDetails = `${commonStaff}
📝 ลงทะเบียน: ${formatStaffList(staff.registration)}
🐕 จับ/วางยา: ${formatStaffList(staff.prep_catch)}
✂️ โกนขน: ${formatStaffList(staff.prep_shave)}
💪 ยกสัตว์: ${formatStaffList(staff.prep_lift)}
💉 วัคซีน: ${formatStaffList(staff.vaccine_staff)}
🔪 ผู้ช่วยผ่าตัด: ${formatStaffList(staff.surgery_assist)}`;
    } else if (unitType === 'microchip') {
      staffDetails = `${commonStaff}
🙋 ผู้ช่วย: ${formatStaffList(staff.assistants)}`;
    } else {
       staffDetails = `${commonStaff}
🙋 เจ้าหน้าที่: ${formatStaffList(staff.assistants)}`;
    }

    const message = `📢 *แจ้งเตือนการออกหน่วย*
📌 *${unitNameDisplay}* ${currentColor?.emoji || ''}
📅 วันที่: ${new Date(generalInfo.date).toLocaleDateString('th-TH')}
📍 สถานที่: ${generalInfo.locationName}
bankok เขต: ${generalInfo.district || '-'}
🗺️ แผนที่: ${generalInfo.mapLink || '-'}
⏰ เวลารถออก: ${generalInfo.departureTime} น.
🛑 เวลาปิดหน่วย: ${generalInfo.closingTime} น.
--------------------------------
${staffDetails}
--------------------------------
📝 หมายเหตุ: ${generalInfo.note || '-'}
`;

    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
    window.open(lineUrl, '_blank');
    if (onToast) onToast('success', 'เปิด Line เรียบร้อยแล้ว');
    onClose();
  };

  const handleSaveLocal = () => {
    const currentUnitLabel = UNIT_OPTIONS.find(u => u.value === unitType)?.label;

    const displayTitle = unitType === 'other' && customUnitName.trim() !== ''
      ? customUnitName
      : currentUnitLabel;

    const payload = {
      _id: initialData?._id,
      ...generalInfo,
      unitType,
      customUnitName,
      unitLetter,
      unitColor,
      staff: staff, 
      title: `${displayTitle} ${unitLetter}`.trim(),
      location: generalInfo.locationName,
      district: generalInfo.district,
      time: generalInfo.departureTime,
      team: staff.vets.filter(v => v).join(', ')
    };

    if (onSave) onSave(payload);
  };

  const commonProps = { onAdd: addStaffField, onRemove: removeStaffField, onChange: handleStaffChange };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ring-1 ring-slate-900/5">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center shrink-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Bell className="w-5 h-5" />
              </div>
              บันทึกและแจ้งเตือนออกหน่วย
            </h3>
            <p className="text-sm text-slate-500 mt-1 ml-11 hidden sm:block">จัดการข้อมูลการออกหน่วยและส่งเข้า Line กลุ่ม</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Section 1: ข้อมูลหลัก (Main Info - Redesigned UI) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* --- Left Column (Controls & Time) --- */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Top Controls: Unit, Team, Color (ปรับดีไซน์ใหม่เรียง บน-ล่าง) */}
                <div className="space-y-5">
                  
                  {/* แถวที่ 1: ประเภทหน่วยงาน */}
                  <div className="w-full">
                    <label className="block text-xs font-bold text-slate-500 mb-2">ประเภทหน่วยงาน</label>
                    <div className="relative">
                      <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                      <select 
                        value={unitType} 
                        onChange={(e) => setUnitType(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm cursor-pointer appearance-none"
                      >
                        {UNIT_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                    {unitType === 'other' && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                        <input 
                          type="text" 
                          placeholder="ระบุชื่อหน่วยงานที่ต้องการ..."
                          className="w-full pl-4 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 outline-none shadow-sm transition-all"
                          value={customUnitName}
                          onChange={(e) => setCustomUnitName(e.target.value)}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  {/* แถวที่ 2: สาย/ทีม (A-G) และ สีประจำหน่วย */}
                  <div className="flex gap-4">
                    
                    {/* สาย/ทีม (A-G) */}
                    <div className="w-[85px] shrink-0">
                      <label className="block text-xs font-bold text-slate-500 mb-2 text-center">สาย/ทีม</label>
                      <div className="relative">
                        <select 
                          value={unitLetter} 
                          onChange={(e) => setUnitLetter(e.target.value)}
                          className="w-full pl-3 pr-6 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm cursor-pointer appearance-none text-center"
                        >
                          <option value="">-</option>
                          {LETTER_OPTIONS.map(letter => (
                            <option key={letter} value={letter}>{letter}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none text-slate-500">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* สีประจำหน่วย */}
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 mb-2 text-center">สีประจำหน่วย</label>
                      <div className="grid grid-cols-4 gap-2 justify-items-center">
                        {COLOR_OPTIONS.map(c => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setUnitColor(c.value)}
                            className={`w-6 h-6 rounded-full transition-all duration-200
                              ${c.value} 
                              ${unitColor === c.value ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 shadow-md' : 'hover:scale-105 opacity-80 shadow-sm border border-black/10'}`}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Time Box */}
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-5 shadow-sm">
                  <h5 className="text-sm font-bold text-indigo-800 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" /> เวลาปฏิบัติงาน
                  </h5>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-indigo-700 mb-1.5 block">วันปฏิบัติงาน</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          className="w-full p-2.5 bg-white border border-indigo-100 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                          value={generalInfo.date} 
                          onChange={e => setGeneralInfo({ ...generalInfo, date: e.target.value })} 
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-indigo-700 mb-1.5 block">รถออก</label>
                        <input 
                          type="time" 
                          className="w-full p-2.5 bg-white border border-indigo-100 rounded-xl text-sm text-center focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                          value={generalInfo.departureTime} 
                          onChange={e => setGeneralInfo({ ...generalInfo, departureTime: e.target.value })} 
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-indigo-700 mb-1.5 block">ปิดหน่วย</label>
                        <input 
                          type="time" 
                          className="w-full p-2.5 bg-white border border-indigo-100 rounded-xl text-sm text-center focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                          value={generalInfo.closingTime} 
                          onChange={e => setGeneralInfo({ ...generalInfo, closingTime: e.target.value })} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Right Column (Location Form) --- */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-rose-500" /> ข้อมูลสถานที่ (Location)
                </h4>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">ชื่อสถานที่</label>
                      <input 
                        type="text" 
                        placeholder="ระบุชื่อวัด, ชุมชน, หรือสถานที่..." 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                        value={generalInfo.locationName} 
                        onChange={e => setGeneralInfo({ ...generalInfo, locationName: e.target.value })} 
                      />
                    </div>
                    
                    {/* เขต (District) แบบแท็บเลื่อนค้นหาได้ (Custom Autocomplete) */}
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">เขต (District)</label>
                      <input 
                        type="text" 
                        placeholder="พิมพ์ค้นหาเขต..." 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                        value={generalInfo.district} 
                        onChange={e => {
                          setGeneralInfo({ ...generalInfo, district: e.target.value });
                          setShowDistrictDropdown(true);
                        }}
                        onFocus={() => setShowDistrictDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDistrictDropdown(false), 200)}
                      />

                      {/* Dropdown Menu */}
                      {showDistrictDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar overflow-hidden">
                          {BANGKOK_DISTRICTS.filter(d => d.includes(generalInfo.district)).length > 0 ? (
                            BANGKOK_DISTRICTS.filter(d => d.includes(generalInfo.district)).map(d => (
                              <div 
                                key={d} 
                                className="px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                                onClick={() => {
                                  setGeneralInfo({ ...generalInfo, district: d });
                                  setShowDistrictDropdown(false);
                                }}
                              >
                                {d}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center bg-slate-50">
                              ไม่พบชื่อเขตที่ค้นหา
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">ลิงก์แผนที่</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="https://maps.google.com/..." 
                          className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                          value={generalInfo.mapLink} 
                          onChange={e => setGeneralInfo({ ...generalInfo, mapLink: e.target.value })} 
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">หมายเหตุ</label>
                    <textarea 
                      rows="3" 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-sm"
                      placeholder="รายละเอียดเพิ่มเติม..."
                      value={generalInfo.note} 
                      onChange={e => setGeneralInfo({ ...generalInfo, note: e.target.value })}
                    />
                  </div>
                </div>
              </div>

            </section>

            {/* Section 2: รายชื่อผู้ปฏิบัติงาน (Staff) */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-slate-200"></div>
                <h4 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <Users className="w-4 h-4" /> ทีมงาน (Staff)
                </h4>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Core Team */}
                <StaffInputGroup roleKey="vets" label="สัตวแพทย์ (Vets)" icon={UserPlus} staffList={staff.vets} {...commonProps} />
                <StaffInputGroup roleKey="drivers" label="คนขับรถ (Drivers)" icon={Activity} staffList={staff.drivers} {...commonProps} />
                
                {/* Dynamic Team based on Unit Type */}
                {unitType === 'sterilization' && (
                  <>
                    <StaffInputGroup roleKey="registration" label="ลงทะเบียน" icon={FileText} staffList={staff.registration} {...commonProps} />
                    <StaffInputGroup roleKey="prep_catch" label="จับ/วางยา" staffList={staff.prep_catch} {...commonProps} />
                    <StaffInputGroup roleKey="prep_shave" label="โกนขน" staffList={staff.prep_shave} {...commonProps} />
                    <StaffInputGroup roleKey="prep_lift" label="ยกสัตว์" staffList={staff.prep_lift} {...commonProps} />
                    <StaffInputGroup roleKey="vaccine_staff" label="ฉีดวัคซีน" staffList={staff.vaccine_staff} {...commonProps} />
                    <StaffInputGroup roleKey="surgery_assist" label="ผู้ช่วยผ่าตัด" staffList={staff.surgery_assist} {...commonProps} />
                  </>
                )}

                {(unitType !== 'sterilization') && (
                  <StaffInputGroup roleKey="assistants" label="ผู้ช่วย/จนท." icon={Users} staffList={staff.assistants} {...commonProps} />
                )}
              </div>
            </section>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
          {initialData && onDelete ? (
            <button 
              onClick={() => onDelete(initialData._id)} 
              className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-1 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" /> ลบรายการ
            </button>
          ) : <div></div>}

          <div className="flex w-full sm:w-auto gap-3">
            <button 
              onClick={onClose} 
              className="flex-1 sm:flex-none px-6 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              onClick={handleSaveLocal} 
              className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
            >
              {initialData ? 'บันทึกแก้ไข' : 'บันทึกข้อมูล'}
            </button>
            <button 
              onClick={handleSendLine} 
              className="flex-1 sm:flex-none px-6 py-2.5 bg-[#06C755] hover:bg-[#05b64d] text-white font-bold rounded-xl shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Share2 className="w-5 h-5" /> Line
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DispatchModal;