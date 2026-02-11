export const exportToCSV = (data) => {
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

    const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));

    const csvRows = sortedData.map(item => {
        const safeLocation = item.location ? `"${item.location.replace(/"/g, '""')}"` : "";
        const combinedCoords = `"${item.lat}, ${item.long}"`; 
        const d = item.details || { dog: {}, cat: {}, other: {} };
        const dog = d.dog || {};
        const cat = d.cat || {};
        const other = d.other || {};

        return [
            item.date, safeLocation, item.district, item.subdistrict || "", item.unit, combinedCoords,
            dog.vaccine || 0, cat.vaccine || 0, other.vaccine || 0, item.stats.vaccine || 0,
            dog.maleSterilize || 0, dog.femaleSterilize || 0, cat.maleSterilize || 0, cat.femaleSterilize || 0, item.stats.sterilize || 0,
            dog.microchip || 0, cat.microchip || 0, item.stats.microchip || 0,
            dog.register || 0, cat.register || 0, item.stats.register || 0,
            dog.medical || 0, cat.medical || 0, other.medical || 0, item.stats.medical || 0
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
};

export const exportOutbreaksToCSV = (data) => {
    if (!data || data.length === 0) {
        alert("ไม่มีข้อมูลจุดแจ้งเหตุสำหรับส่งออก");
        return;
    }

    const headers = [
        "วันที่", "สถานที่", "เขต", "ละติจูด", "ลองจิจูด",
        "สุนัข(ผู้)", "สุนัข(เมีย)", "แมว(ผู้)", "แมว(เมีย)"
    ];

    const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));

    const csvRows = sortedData.map(item => {
        const safeLocation = item.location ? `"${item.location.replace(/"/g, '""')}"` : "";
        
        // ดึงข้อมูลสัตว์ (ถ้าไม่มีให้เป็น 0)
        const dogMale = item.stats?.dog?.male || 0;
        const dogFemale = item.stats?.dog?.female || 0;
        const catMale = item.stats?.cat?.male || 0;
        const catFemale = item.stats?.cat?.female || 0;

        return [
            item.date, 
            safeLocation, 
            item.district || "", 
            item.lat, 
            item.long,
            dogMale,
            dogFemale,
            catMale,
            catFemale
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
};