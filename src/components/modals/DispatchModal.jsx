import React, { useState, useEffect } from 'react';
import { 
  Activity, X, Bell, MapPin, Link as LinkIcon, Users, 
  Share2, Trash2, Clock, Plus, UserPlus, FileText, ChevronDown, Copy
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
    return new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  };

  const UNIT_OPTIONS = [
    { value: 'sterilization', label: 'หน่วยสัตว์แพทย์ (Veterinary Unit)', color: 'text-blue-600', icon: '🏥' },
    { value: 'spay_neuter', label: 'หน่วยทำหมัน (Spay/Neuter Unit)', color: 'text-pink-600', icon: '✂️' },
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

  const [isSplitTeam, setIsSplitTeam] = useState(false);
  const [activeDistrictField, setActiveDistrictField] = useState(null);

  const [generalInfo, setGeneralInfo] = useState({
    date: new Date().toISOString().split('T')[0],
    locationName: '', district: '', mapLink: '',
    locationNameB: '', districtB: '', mapLinkB: '',
    departureTime: '07:30', closingTime: '12:00', note: '',
    controllerName: '', 
    controllerPhone: '',
    status: 'auto' // ค่าเริ่มต้นให้คำนวณอัตโนมัติ
  });

  const [staff, setStaff] = useState({
    controllers: [''], // ✨ เพิ่มผู้ควบคุมออกหน่วย
    vets: ['', ''], registration: [''], prep_catch: [''], prep_shave: [''], prep_lift: [''], 
    vaccine_staff: [''], tattoo: [''], surgery_assist: [''], drivers: [''], assistants: [''] 
  });

  const [isCopyMode, setIsCopyMode] = useState(false);

  const [savedControllers, setSavedControllers] = useState([]);

  useEffect(() => {
    if (isOpen) {
        // เปลี่ยนจาก localStorage มาเป็น fetch
        fetch(`${BASE_URL}/api/controllers`)
            .then(res => res.json())
            .then(data => setSavedControllers(data))
            .catch(err => console.error(err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialData) {
      setIsCopyMode(false);
      setIsSplitTeam(false);
      setUnitType(initialData.unitType || 'sterilization');
      setCustomUnitName(initialData.customUnitName || '');
      setUnitLetter(initialData.unitLetter || ''); 
      setUnitColor(initialData.unitColor || 'bg-blue-500'); 
      
      setGeneralInfo({
        date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0], 
        locationName: initialData.location || '',
        district: initialData.district || '',
        mapLink: initialData.mapLink || '',
        locationNameB: '', districtB: '', mapLinkB: '',
        departureTime: initialData.time || '07:30',
        closingTime: initialData.closingTime || '12:00',
        note: initialData.note || '',
        controllerName: initialData.controllerName || (initialData.staff?.controllers ? initialData.staff.controllers[0]?.split(' โทร. ')[0] : ''),
        controllerPhone: initialData.controllerPhone || (initialData.staff?.controllers ? initialData.staff.controllers[0]?.split(' โทร. ')[1] : ''),
        status: initialData.status || 'auto'
      });

      if (initialData.staff) {
        setStaff({ 
          controllers: initialData.staff.controllers?.length ? initialData.staff.controllers : [''], // ✨ เพิ่มบรรทัดนี้
          vets: initialData.staff.vets?.length ? initialData.staff.vets : ['', ''], 
          registration: initialData.staff.registration?.length ? initialData.staff.registration : [''], 
          prep_catch: initialData.staff.prep_catch?.length ? initialData.staff.prep_catch : [''], 
          prep_shave: initialData.staff.prep_shave?.length ? initialData.staff.prep_shave : [''], 
          prep_lift: initialData.staff.prep_lift?.length ? initialData.staff.prep_lift : [''], 
          vaccine_staff: initialData.staff.vaccine_staff?.length ? initialData.staff.vaccine_staff : [''], 
          tattoo: initialData.staff.tattoo?.length ? initialData.staff.tattoo : [''], 
          surgery_assist: initialData.staff.surgery_assist?.length ? initialData.staff.surgery_assist : [''], 
          drivers: initialData.staff.drivers?.length ? initialData.staff.drivers : [''], 
          assistants: initialData.staff.assistants?.length ? initialData.staff.assistants : [''] 
        });
      }
    } else if (isOpen && !initialData) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setIsSplitTeam(false);
      setUnitType('sterilization');
      setCustomUnitName('');
      setUnitLetter(''); 
      setUnitColor('bg-blue-500'); 
      setGeneralInfo({
        date: formatDateLocal(tomorrow), 
        locationName: '', district: '', mapLink: '',
        locationNameB: '', districtB: '', mapLinkB: '',
        departureTime: '07:30', closingTime: '12:00', note: '',
        status: 'auto'
      });
      setStaff({ controllers: [''], vets: ['', ''], registration: [''], prep_catch: [''], prep_shave: [''], prep_lift: [''], vaccine_staff: [''], tattoo: [''], surgery_assist: [''], drivers: [''], assistants: [''] });
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
    if (isSplitTeam && (!generalInfo.locationName || !generalInfo.locationNameB)) {
      if(onToast) onToast('error', 'กรุณาระบุสถานที่ให้ครบทั้ง 2 ทีม');
      else alert('กรุณาระบุสถานที่ให้ครบทั้ง 2 ทีม');
      return;
    } else if (!isSplitTeam && !generalInfo.locationName) {
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

    const unitNameDisplay = isSplitTeam 
      ? `${displayUnitName} (ทีม A และ B)` 
      : `${displayUnitName} ${unitLetter}`.trim();
    
    let locationText = '';
    if (isSplitTeam) {
      locationText = `📍 ทีม A: ${generalInfo.locationName} (เขต ${generalInfo.district || '-'})
      🗺️ แผนที่ A: ${generalInfo.mapLink || '-'}
      📍 ทีม B: ${generalInfo.locationNameB} (เขต ${generalInfo.districtB || '-'})
      🗺️ แผนที่ B: ${generalInfo.mapLinkB || '-'}`;
    }
    
    let staffDetails = "";
    const controllerDisplay = [generalInfo.controllerName, generalInfo.controllerPhone].filter(Boolean).join(' โทร. ') || '-';
    
    const commonStaff = `👮‍♂️ ผู้ควบคุมออกหน่วย: ${controllerDisplay}\n👨‍⚕️ สัตวแพทย์: ${formatStaffList(staff.vets)}\n🚐 พนักงานขับรถ: ${formatStaffList(staff.drivers)}`;

    if (unitType === 'sterilization'|| unitType === 'spay_neuter') {
      staffDetails = `${commonStaff}
📝 ลงทะเบียน: ${formatStaffList(staff.registration)}
🐕 จับ/วางยา: ${formatStaffList(staff.prep_catch)}
✂️ โกนขน: ${formatStaffList(staff.prep_shave)}
💪 ยกสัตว์: ${formatStaffList(staff.prep_lift)}
💉 วัคซีน: ${formatStaffList(staff.vaccine_staff)}
🔪 ผู้ช่วยผ่าตัด: ${formatStaffList(staff.surgery_assist)}`;
    } else if (unitType === 'cat_cage') {
      staffDetails = `${commonStaff}
🐕 จับ/วางยา: ${formatStaffList(staff.prep_catch)}
✂️ โกนขน: ${formatStaffList(staff.prep_shave)}
💪 ยกสัตว์: ${formatStaffList(staff.prep_lift)}
💉 วัคซีน: ${formatStaffList(staff.vaccine_staff)}
✒️ สักตัว: ${formatStaffList(staff.tattoo)}
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
${locationText}
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
    const isCreatingNew = !initialData || isCopyMode;

    const currentUnitLabel = UNIT_OPTIONS.find(u => u.value === unitType)?.label;
    const displayTitle = unitType === 'other' && customUnitName.trim() !== ''
      ? customUnitName
      : currentUnitLabel;

    if (isSplitTeam) {
      const payloadA = {
        _id: isCreatingNew ? undefined : initialData?._id, // ✨ ปรับตรงนี้
        ...generalInfo,
        status: isCreatingNew ? 'auto' : generalInfo.status, // ✨ ถ้ารายการใหม่ให้กลับเป็น auto
        unitType, customUnitName,
        unitLetter: 'A', unitColor, staff: staff, 
        title: `${displayTitle} A`.trim(),
        location: generalInfo.locationName,
        district: generalInfo.district,
        mapLink: generalInfo.mapLink,
        time: generalInfo.departureTime,
        team: staff.vets.filter(v => v).join(', ')
      };
      const payloadB = {
        _id: undefined, // ทีม B จะถูกสร้างใหม่เสมอเวลาแยกทีม
        ...generalInfo,
        status: isCreatingNew ? 'auto' : generalInfo.status,
        unitType, customUnitName,
        unitLetter: 'B', unitColor, staff: staff, 
        title: `${displayTitle} B`.trim(),
        location: generalInfo.locationNameB,
        district: generalInfo.districtB,
        mapLink: generalInfo.mapLinkB,
        time: generalInfo.departureTime,
        team: staff.vets.filter(v => v).join(', ')
      };

      if (onSave) {
        onSave(payloadA);
        setTimeout(() => onSave(payloadB), 300);
      }
    } else {
      const payload = {
        _id: isCreatingNew ? undefined : initialData?._id, // ✨ ปรับตรงนี้
        ...generalInfo,
        status: isCreatingNew ? 'auto' : generalInfo.status, // ✨ ปรับตรงนี้
        unitType, customUnitName, unitLetter, unitColor, staff: staff, 
        title: `${displayTitle} ${unitLetter}`.trim(),
        location: generalInfo.locationName,
        district: generalInfo.district,
        mapLink: generalInfo.mapLink,
        time: generalInfo.departureTime,
        team: staff.vets.filter(v => v).join(', ')
      };
      if (onSave) onSave(payload);
    }
  };

  const commonProps = { onAdd: addStaffField, onRemove: removeStaffField, onChange: handleStaffChange };

  return (
    // 🔴 1. ปรับ Wrapper (p-0 บนมือถือ เพื่อให้ชิดขอบจอ) และปรับ z-index ให้สูงเท่ากัน
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200">
      
      {/* 🔴 2. ปรับตัวกล่อง Modal (h-[100dvh] และ rounded-none บนมือถือ เพื่อให้เต็มจอและไม่มีขอบโค้ง) */}
      <div className="bg-white w-full max-w-5xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-2xl shadow-2xl overflow-hidden border-0 sm:border border-slate-200">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 mt-safe sm:mt-0 bg-white border-b border-slate-100 flex justify-between items-center shrink-0 z-10">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isCopyMode ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {isCopyMode ? <Copy className="w-5 h-5 sm:w-6 sm:h-6" /> : <Bell className="w-5 h-5 sm:w-6 sm:h-6" />}
              </div>
              {isCopyMode ? 'คัดลอกแผนออกหน่วย (สร้างใหม่)' : 'บันทึกและแจ้งเตือนออกหน่วย'}
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 ml-11 hidden sm:block">
               {isCopyMode ? 'กรุณาแก้ไขวันที่ สถานที่ หรือข้อมูลอื่นๆ แล้วกดบันทึกข้อมูล' : 'จัดการข้อมูลการออกหน่วยและส่งเข้า Line กลุ่ม'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 sm:p-2.5 rounded-full transition-all">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Scrollable Content (เพิ่ม pb-24 บนมือถือเพื่อเว้นที่ให้ Navigation Bar ล่างสุด) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-50/30 custom-scrollbar pb-24 sm:pb-6">
          <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
            
            {isCopyMode && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm">
                 <Copy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                 <div className="text-sm">
                   <p className="font-bold">โหมดคัดลอกแผนงาน</p>
                   <p className="mt-0.5">คุณกำลังสร้างแผนออกหน่วยใหม่โดยใช้ข้อมูลจากเคสนี้เป็นตั้งต้น <span className="font-bold underline">อย่าลืมแก้ไขวันที่ และสถานที่</span> ก่อนกดบันทึกข้อมูล</p>
                 </div>
              </div>
            )}
            
            {/* Section 1: ข้อมูลหลัก */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              <div className="lg:col-span-4 space-y-6">
                
                {/* Top Controls: Unit, Team, Color */}
                <div className="space-y-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-full">
                    <label className="block text-xs font-bold text-slate-500 mb-2">ประเภทหน่วยงาน</label>
                    <div className="relative">
                      <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                      <select 
                        value={unitType} 
                        onChange={(e) => {
                          setUnitType(e.target.value);
                          if(e.target.value !== 'cat_cage') setIsSplitTeam(false);
                        }}
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
                      <div className="mt-3"> 
                        <input 
                          type="text" 
                          placeholder="ระบุชื่อหน่วยงานที่ต้องการ..."
                          className="w-full pl-4 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 outline-none shadow-sm transition-all"
                          value={customUnitName}
                          onChange={(e) => setCustomUnitName(e.target.value)}
                        />
                      </div>
                    )}

                    {(!initialData && unitType === 'cat_cage') && (
                        <div className="mt-3 flex items-start gap-2 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                            <input 
                                type="checkbox" 
                                id="splitTeamToggle" 
                                checked={isSplitTeam} 
                                onChange={(e) => setIsSplitTeam(e.target.checked)}
                                className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                            />
                            <label htmlFor="splitTeamToggle" className="text-xs font-bold text-indigo-800 cursor-pointer leading-tight">
                                ออกหน่วย 2 สถานที่ (ทีม A และ B) <br/> <span className="text-indigo-600/80">โดยใช้คนชุดเดียวกัน</span>
                            </label>
                        </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    {!isSplitTeam && (
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
                    )}

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
                {/* Status Box ✨ */}
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                  <h5 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-500" /> สถานะการออกหน่วย
                  </h5>
                  <div className="relative">
                    <select
                      value={generalInfo.status}
                      onChange={(e) => setGeneralInfo({ ...generalInfo, status: e.target.value })}
                      className={`w-full pl-3 pr-8 py-2.5 border rounded-xl text-sm font-bold focus:ring-2 focus:outline-none appearance-none transition-colors cursor-pointer
                        ${generalInfo.status === 'cancelled' ? 'bg-rose-50 border-rose-200 text-rose-700 focus:ring-rose-500' : 
                          generalInfo.status === 'postponed' ? 'bg-orange-50 border-orange-200 text-orange-700 focus:ring-orange-500' :
                          generalInfo.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500' :
                          'bg-slate-50 border-slate-200 text-slate-700 focus:ring-indigo-500 focus:bg-white'
                        }`}
                    >
                      <option value="auto">⏱️ คำนวณอัตโนมัติ (ตามเวลา)</option>
                      <option value="completed">✅ เสร็จสิ้นแล้ว (Manual)</option>
                      <option value="postponed">⚠️ เลื่อนการออกหน่วย</option>
                      <option value="cancelled">❌ ยกเลิกการออกหน่วย</option>
                    </select>
                    <div className={`absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none 
                        ${generalInfo.status === 'auto' ? 'text-slate-500' : 'text-current opacity-60'}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (Location Form) */}
              <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-rose-500" /> ข้อมูลสถานที่ (Location)
                </h4>
                
                <div className="space-y-5">
                  {isSplitTeam && <h5 className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block">📍 สถานที่ ทีม A</h5>}
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
                    
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">เขต (District)</label>
                      <input 
                        type="text" 
                        placeholder="พิมพ์ค้นหาเขต..." 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                        value={generalInfo.district} 
                        onChange={e => {
                          setGeneralInfo({ ...generalInfo, district: e.target.value });
                          setActiveDistrictField('A');
                        }}
                        onFocus={() => setActiveDistrictField('A')}
                        onBlur={() => setTimeout(() => setActiveDistrictField(null), 200)}
                      />
                      {activeDistrictField === 'A' && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar overflow-hidden">
                          {BANGKOK_DISTRICTS.filter(d => d.includes(generalInfo.district)).length > 0 ? (
                            BANGKOK_DISTRICTS.filter(d => d.includes(generalInfo.district)).map(d => (
                              <div key={d} className="px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                                onClick={() => { setGeneralInfo({ ...generalInfo, district: d }); setActiveDistrictField(null); }}
                              >
                                {d}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center bg-slate-50">ไม่พบชื่อเขตที่ค้นหา</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">ลิงก์แผนที่</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" placeholder="http://googleusercontent.com/..." 
                          className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                          value={generalInfo.mapLink} 
                          onChange={e => setGeneralInfo({ ...generalInfo, mapLink: e.target.value })} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {isSplitTeam && (
                  <div className="space-y-5 border-t border-slate-100 pt-6 mt-6">
                    <h5 className="text-sm font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg inline-block">📍 สถานที่ ทีม B</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">ชื่อสถานที่</label>
                        <input 
                          type="text" 
                          placeholder="ระบุชื่อวัด, ชุมชน, หรือสถานที่..." 
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                          value={generalInfo.locationNameB} 
                          onChange={e => setGeneralInfo({ ...generalInfo, locationNameB: e.target.value })} 
                        />
                      </div>
                      
                      <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">เขต (District)</label>
                        <input 
                          type="text" placeholder="พิมพ์ค้นหาเขต..." 
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                          value={generalInfo.districtB} 
                          onChange={e => {
                            setGeneralInfo({ ...generalInfo, districtB: e.target.value });
                            setActiveDistrictField('B');
                          }}
                          onFocus={() => setActiveDistrictField('B')}
                          onBlur={() => setTimeout(() => setActiveDistrictField(null), 200)}
                        />
                        {activeDistrictField === 'B' && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar overflow-hidden">
                            {BANGKOK_DISTRICTS.filter(d => d.includes(generalInfo.districtB)).length > 0 ? (
                              BANGKOK_DISTRICTS.filter(d => d.includes(generalInfo.districtB)).map(d => (
                                <div key={d} className="px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                                  onClick={() => { setGeneralInfo({ ...generalInfo, districtB: d }); setActiveDistrictField(null); }}
                                >
                                  {d}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-slate-400 text-center bg-slate-50">ไม่พบชื่อเขตที่ค้นหา</div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">ลิงก์แผนที่</label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" placeholder="http://googleusercontent.com/..." 
                            className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                            value={generalInfo.mapLinkB} 
                            onChange={e => setGeneralInfo({ ...generalInfo, mapLinkB: e.target.value })} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">หมายเหตุ</label>
                  <textarea 
                    rows="3" 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-sm"
                    placeholder="รายละเอียดเพิ่มเติม..."
                    value={generalInfo.note} 
                    onChange={e => setGeneralInfo({ ...generalInfo, note: e.target.value })}
                  />
                </div>

                {/* ✨ เพิ่มส่วนผู้ควบคุมออกหน่วย (แยกช่อง) ไว้ใต้หมายเหตุ */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h5 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-indigo-500" /> ผู้ควบคุมออกหน่วย
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">ชื่อ-นามสกุล (เลือกหรือพิมพ์ใหม่)</label>
                      <input 
                        list="controllers-list"
                        type="text" 
                        placeholder="ระบุหรือเลือกชื่อผู้ควบคุม..." 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                        value={generalInfo.controllerName} 
                        onChange={e => {
                          const val = e.target.value;
                          const selected = savedControllers.find(c => c.name === val);
                          setGeneralInfo({ 
                            ...generalInfo, 
                            controllerName: val,
                            // หากเลือกจากลิสต์จะดึงเบอร์โทรมาใส่อัตโนมัติ หากพิมพ์เองจะไม่ทับเบอร์เดิม
                            controllerPhone: selected ? selected.phone : generalInfo.controllerPhone 
                          });
                        }} 
                      />
                      <datalist id="controllers-list">
                        {savedControllers.map((c, idx) => (
                          <option key={idx} value={c.name} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">เบอร์ติดต่อ</label>
                      <input 
                        type="text" 
                        placeholder="08X-XXX-XXXX" 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                        value={generalInfo.controllerPhone} 
                        onChange={e => setGeneralInfo({ ...generalInfo, controllerPhone: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>
              </div>

            </section>

            {/* Section 2: รายชื่อผู้ปฏิบัติงาน */}
            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-px flex-1 bg-slate-200"></div>
                <h4 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <Users className="w-4 h-4" /> ทีมงาน (Staff)
                </h4>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StaffInputGroup roleKey="vets" label="สัตวแพทย์ (Vets)" icon={UserPlus} staffList={staff.vets} {...commonProps} />
                <StaffInputGroup roleKey="drivers" label="คนขับรถ (Drivers)" icon={Activity} staffList={staff.drivers} {...commonProps} />
                
                {(unitType === 'sterilization' || unitType === 'cat_cage' || unitType === 'spay_neuter') && ( 
                  <>
                    {(unitType === 'sterilization' || unitType === 'spay_neuter') && ( 
                      <StaffInputGroup roleKey="registration" label="ลงทะเบียน" icon={FileText} staffList={staff.registration} {...commonProps} />
                    )}
                    <StaffInputGroup roleKey="prep_catch" label="จับ/วางยา" staffList={staff.prep_catch} {...commonProps} />
                    <StaffInputGroup roleKey="prep_shave" label="โกนขน" staffList={staff.prep_shave} {...commonProps} />
                    <StaffInputGroup roleKey="prep_lift" label="ยกสัตว์" staffList={staff.prep_lift} {...commonProps} />
                    <StaffInputGroup roleKey="vaccine_staff" label="ฉีดวัคซีน" staffList={staff.vaccine_staff} {...commonProps} />
                    
                    {unitType === 'cat_cage' && (
                      <StaffInputGroup roleKey="tattoo" label="สักตัว" staffList={staff.tattoo} {...commonProps} />
                    )}
                    
                    <StaffInputGroup roleKey="surgery_assist" label="ผู้ช่วยผ่าตัด" staffList={staff.surgery_assist} {...commonProps} />
                  </>
                )}

                {(unitType !== 'sterilization' && unitType !== 'cat_cage' && unitType !== 'spay_neuter') && (
                  <StaffInputGroup roleKey="assistants" label="ผู้ช่วย/จนท." icon={Users} staffList={staff.assistants} {...commonProps} />
                )}
              </div>
            </section>

          </div>
        </div>

        {/* 🔴 3. ปรับปุ่ม Footer ให้รองรับ Safe Area บนมือถือ และจัดให้อยู่ตำแหน่งล่างสุดสวยงาม */}
        <div className="bg-white border-t border-slate-100 p-4 sm:p-5 pb-8 sm:pb-5 flex items-center justify-between shrink-0 z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.03)]">
          
          {/* ซ้าย: ปุ่มลบ และ ปุ่มคัดลอก */}
          <div className="flex-1 flex gap-3">
            {initialData && onDelete && !isCopyMode && (
              <button 
                onClick={() => onDelete(initialData._id)} 
                className="text-slate-400 hover:text-red-500 text-sm font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">ลบรายการ</span>
              </button>
            )}
            
            {/* ✨ ปุ่มคัดลอก จะแสดงเมื่อมีการกดดูรายละเอียดงานเดิม และยังไม่ได้เข้าสู่โหมดคัดลอก */}
            {initialData && !isCopyMode && (
              <button 
                onClick={() => {
                  setIsCopyMode(true);
                  if (onToast) onToast('info', 'อยู่ในโหมดคัดลอก กรุณาเปลี่ยนวันที่ก่อนบันทึก');
                }} 
                className="text-slate-400 hover:text-amber-500 text-sm font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">คัดลอกงานนี้</span>
              </button>
            )}
          </div>

          {/* ขวา: กลุ่มปุ่มทำงาน */}
          <div className="flex gap-2 sm:gap-3 items-center">
            <button 
              onClick={onClose} 
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors text-sm sm:text-base"
            >
              ยกเลิก
            </button>
            <div className="flex gap-2">
               <button 
                onClick={handleSaveLocal} 
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" /> 
                <span className="hidden sm:inline">บันทึกข้อมูล</span>
                <span className="inline sm:hidden">บันทึก</span>
              </button>
              
              <button 
                onClick={handleSendLine} 
                className="px-4 py-2.5 sm:py-3 bg-[#06C755] hover:bg-[#05b64d] text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                title="แชร์ไปที่ Line"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DispatchModal;