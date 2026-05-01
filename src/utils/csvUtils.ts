import * as XLSX from 'xlsx';

export interface AnimalDetails {
    vaccine?: number;
    maleSterilize?: number;
    femaleSterilize?: number;
    microchip?: number;
    register?: number;
    medical?: number;
}

export interface OtherAnimalDetails {
    vaccine?: number;
    medical?: number;
}

export interface VetReportData {
    date: string | Date;
    location: string;
    district: string;
    subdistrict?: string;
    unit: string;
    lat: number | string;
    long: number | string;
    details?: {
        dog?: AnimalDetails;
        cat?: AnimalDetails;
        other?: OtherAnimalDetails;
    };
    stats: {
        vaccine?: number;
        sterilize?: number;
        microchip?: number;
        register?: number;
        medical?: number;
    };
}

// ==========================================
// Interfaces สำหรับ exportOutbreaksToCSV (อัปเดตใหม่)
// ==========================================
export interface InsightData {
    spcc?: string;
    testNo?: string;
    animalType?: string;
    ownership?: string;
    gender?: string;
    breed?: string;
    color?: string;
    age?: string;
    vaccineHistory?: string;
}

export interface GenderStats { 
    male: number; 
    female: number; 
}

export interface AnimalStats { 
    dog: GenderStats; 
    cat: GenderStats; 
}

export interface BaseStats { 
    owned?: AnimalStats; 
    unowned?: AnimalStats; 
    feeder?: AnimalStats; 
}

export interface OutbreakData {
    date: string | Date;
    location: string;
    district?: string;
    lat: number | string;
    long: number | string;
    stats?: BaseStats;
    insight?: InsightData;
}

// ==========================================
// Functions
// ==========================================

export const exportToCSV = (data: VetReportData[]): void => {
    if (!data || data.length === 0) {
        alert("ไม่มีข้อมูลสำหรับส่งออก (Export)");
        return;
    }

    const headers = [
        "วันที่", "สถานที่", "เขต", "แขวง", "หน่วยงาน", "พิกัด",
        "สุนัข_วัคซีน", "แมว_วัคซีน", "อื่นๆ_วัคซีน", "รวมวัคซีน",
        "สุนัข_ทำหมัน(ผู้)", "สุนัข_ทำหมัน(เมีย)", "แมว_ทำหมัน(ผู้)", "แมว_ทำหมัน(เมีย)", "รวมทำหมัน",
        "สุนัข_ฝังไมโครชิป", "แมว_ฝังไมโครชิป", "รวมฝังไมโครชิป",
        "สุนัข_ขึ้นทะเบียน", "แมว_ขึ้นทะเบียน", "รวมขึ้นทะเบียน",
        "สุนัข_รักษา", "แมว_รักษา", "อื่นๆ_รักษา", "รวมรักษา"
    ];

    const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const csvRows = sortedData.map(item => {
        const safeLocation = item.location ? `"${item.location.replace(/"/g, '""')}"` : "";
        const combinedCoords = `"${item.lat}, ${item.long}"`; 
        const d = item.details || {};
        const dog = d.dog || {};
        const cat = d.cat || {};
        const other = d.other || {};

        return [
            item.date, safeLocation, item.district, item.subdistrict || "", item.unit, combinedCoords,
            dog.vaccine || 0, cat.vaccine || 0, other.vaccine || 0, item.stats?.vaccine || 0,
            dog.maleSterilize || 0, dog.femaleSterilize || 0, cat.maleSterilize || 0, cat.femaleSterilize || 0, item.stats?.sterilize || 0,
            dog.microchip || 0, cat.microchip || 0, item.stats?.microchip || 0,
            dog.register || 0, cat.register || 0, item.stats?.register || 0,
            dog.medical || 0, cat.medical || 0, other.medical || 0, item.stats?.medical || 0
        ].join(",");
    });

    const csvString = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `VET_REPORT_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportOutbreaksToCSV = (data: OutbreakData[]): void => {
    if (!data || data.length === 0) {
        alert("ไม่มีข้อมูลจุดแจ้งเหตุสำหรับส่งออก");
        return;
    }

    const headers = [
        "วันที่", "สถานที่", "เขต", "ละติจูด", "ลองจิจูด",
        // ข้อมูลเชิงลึก (Insight)
        "ศบส.", "เลขที่ตรวจ", "ชนิดสัตว์", "สถานะเจ้าของ", "เพศ", "สายพันธุ์", "สี", "อายุ", "ประวัติวัคซีน",
        // สถิติ สัตว์มีเจ้าของ (Owned)
        "มีเจ้าของ_สุนัข(ผู้)", "มีเจ้าของ_สุนัข(เมีย)", "มีเจ้าของ_แมว(ผู้)", "มีเจ้าของ_แมว(เมีย)",
        // สถิติ สัตว์ไม่มีเจ้าของ (Unowned)
        "ไม่มีเจ้าของ_สุนัข(ผู้)", "ไม่มีเจ้าของ_สุนัข(เมีย)", "ไม่มีเจ้าของ_แมว(ผู้)", "ไม่มีเจ้าของ_แมว(เมีย)",
        // สถิติ สัตว์มีผู้ให้อาหาร (Feeder)
        "มีผู้ให้อาหาร_สุนัข(ผู้)", "มีผู้ให้อาหาร_สุนัข(เมีย)", "มีผู้ให้อาหาร_แมว(ผู้)", "มีผู้ให้อาหาร_แมว(เมีย)"
    ];

    const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const csvRows = sortedData.map(item => {
        const safeLocation = item.location ? `"${item.location.replace(/"/g, '""')}"` : "";
        
        const insight = item.insight || {};
        const stats = item.stats || {};
        const owned = stats.owned || { dog: { male: 0, female: 0 }, cat: { male: 0, female: 0 } };
        const unowned = stats.unowned || { dog: { male: 0, female: 0 }, cat: { male: 0, female: 0 } };
        const feeder = stats.feeder || { dog: { male: 0, female: 0 }, cat: { male: 0, female: 0 } };

        return [
            item.date, 
            safeLocation, 
            item.district || "", 
            item.lat, 
            item.long,
            // ข้อมูลเชิงลึก
            insight.spcc || "",
            insight.testNo || "",
            insight.animalType || "",
            insight.ownership || "",
            insight.gender || "",
            insight.breed || "",
            insight.color || "",
            insight.age || "",
            insight.vaccineHistory || "",
            // สถิติ มีเจ้าของ
            owned.dog.male || 0, owned.dog.female || 0,
            owned.cat.male || 0, owned.cat.female || 0,
            // สถิติ ไม่มีเจ้าของ
            unowned.dog.male || 0, unowned.dog.female || 0,
            unowned.cat.male || 0, unowned.cat.female || 0,
            // สถิติ มีผู้ให้อาหาร
            feeder.dog.male || 0, feeder.dog.female || 0,
            feeder.cat.male || 0, feeder.cat.female || 0
        ].join(",");
    });

    const csvString = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `OUTBREAK_REPORT_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportToExcel = (data: VetReportData[]): void => {
    if (!data || data.length === 0) {
        alert("ไม่มีข้อมูลสำหรับส่งออก (Export)");
        return;
    }

    const headers = [
        "วันที่", "สถานที่", "เขต", "แขวง", "หน่วยงาน", "ละติจูด", "ลองจิจูด",
        "สุนัข_วัคซีน", "แมว_วัคซีน", "อื่นๆ_วัคซีน", "รวมวัคซีน",
        "สุนัข_ทำหมัน(ผู้)", "สุนัข_ทำหมัน(เมีย)", "แมว_ทำหมัน(ผู้)", "แมว_ทำหมัน(เมีย)", "รวมทำหมัน",
        "สุนัข_ฝังไมโครชิป", "แมว_ฝังไมโครชิป", "รวมฝังไมโครชิป",
        "สุนัข_ขึ้นทะเบียน", "แมว_ขึ้นทะเบียน", "รวมขึ้นทะเบียน",
        "สุนัข_รักษา", "แมว_รักษา", "อื่นๆ_รักษา", "รวมรักษา"
    ];

    const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const excelRows = sortedData.map(item => {
        const d = item.details || {};
        const dog = d.dog || {};
        const cat = d.cat || {};
        const other = d.other || {};

        return [
            item.date, item.location || "", item.district || "", item.subdistrict || "", item.unit || "", item.lat || "", item.long || "",
            dog.vaccine || 0, cat.vaccine || 0, other.vaccine || 0, item.stats?.vaccine || 0,
            dog.maleSterilize || 0, dog.femaleSterilize || 0, cat.maleSterilize || 0, cat.femaleSterilize || 0, item.stats?.sterilize || 0,
            dog.microchip || 0, cat.microchip || 0, item.stats?.microchip || 0,
            dog.register || 0, cat.register || 0, item.stats?.register || 0,
            dog.medical || 0, cat.medical || 0, other.medical || 0, item.stats?.medical || 0
        ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...excelRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vet Reports");
    
    XLSX.writeFile(workbook, `VET_REPORT_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportOutbreaksToExcel = (data: OutbreakData[]): void => {
    if (!data || data.length === 0) {
        alert("ไม่มีข้อมูลจุดแจ้งเหตุสำหรับส่งออก");
        return;
    }

    const headers = [
        "วันที่", "สถานที่", "เขต", "ละติจูด", "ลองจิจูด",
        "ศบส.", "เลขที่ตรวจ", "ชนิดสัตว์", "สถานะเจ้าของ", "เพศ", "สายพันธุ์", "สี", "อายุ", "ประวัติวัคซีน",
        "มีเจ้าของ_สุนัข(ผู้)", "มีเจ้าของ_สุนัข(เมีย)", "มีเจ้าของ_แมว(ผู้)", "มีเจ้าของ_แมว(เมีย)",
        "ไม่มีเจ้าของ_สุนัข(ผู้)", "ไม่มีเจ้าของ_สุนัข(เมีย)", "ไม่มีเจ้าของ_แมว(ผู้)", "ไม่มีเจ้าของ_แมว(เมีย)",
        "มีผู้ให้อาหาร_สุนัข(ผู้)", "มีผู้ให้อาหาร_สุนัข(เมีย)", "มีผู้ให้อาหาร_แมว(ผู้)", "มีผู้ให้อาหาร_แมว(เมีย)"
    ];

    const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const excelRows = sortedData.map(item => {
        const insight = item.insight || {};
        const stats = item.stats || {};
        const owned = stats.owned || { dog: { male: 0, female: 0 }, cat: { male: 0, female: 0 } };
        const unowned = stats.unowned || { dog: { male: 0, female: 0 }, cat: { male: 0, female: 0 } };
        const feeder = stats.feeder || { dog: { male: 0, female: 0 }, cat: { male: 0, female: 0 } };

        return [
            item.date, item.location || "", item.district || "", item.lat || "", item.long || "",
            insight.spcc || "", insight.testNo || "", insight.animalType || "", insight.ownership || "",
            insight.gender || "", insight.breed || "", insight.color || "", insight.age || "", insight.vaccineHistory || "",
            owned.dog.male || 0, owned.dog.female || 0, owned.cat.male || 0, owned.cat.female || 0,
            unowned.dog.male || 0, unowned.dog.female || 0, unowned.cat.male || 0, unowned.cat.female || 0,
            feeder.dog.male || 0, feeder.dog.female || 0, feeder.cat.male || 0, feeder.cat.female || 0
        ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...excelRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Outbreak Reports");
    
    XLSX.writeFile(workbook, `OUTBREAK_REPORT_${new Date().toISOString().split('T')[0]}.xlsx`);
};