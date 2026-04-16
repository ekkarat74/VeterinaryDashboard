// src/utils/dataProcessors.js
import { UNIT_TYPES, BANGKOK_DISTRICTS } from '../constants/locations.js';

export const parseCSVDate = (dateStr) => {
    const getLocalDateString = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    if (!dateStr) return getLocalDateString(new Date());
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    const parts = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (parts) {
        let day = parts[1].padStart(2, '0');
        let month = parts[2].padStart(2, '0');
        let year = parseInt(parts[3]);
        if (year > 2400) year -= 543;
        return `${year}-${month}-${day}`;
    }
    
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) ? getLocalDateString(d) : getLocalDateString(new Date());
};

export const generateMockDataRecords = (count) => {
    const newMockData = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);
    
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randCoord = () => ({ lat: 13.6 + Math.random() * 0.35, long: 100.35 + Math.random() * 0.4 });

    for (let i = 0; i < count; i++) {
        const date = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
        const dateStr = date.toISOString().split('T')[0];
        const district = BANGKOK_DISTRICTS[Math.floor(Math.random() * BANGKOK_DISTRICTS.length)];
        const unit = UNIT_TYPES[Math.floor(Math.random() * UNIT_TYPES.length)];
        const coords = randCoord();
        const stats = { vaccine: randInt(0, 50), sterilize: randInt(0, 20), register: randInt(0, 30), microchip: randInt(0, 15), medical: randInt(0, 10) };

        newMockData.push({
            _id: `mock-${Date.now()}-${i}`,
            date: dateStr, location: `จุดบริการจำลอง ${district} #${i+1}`, district: district, subdistrict: "แขวงจำลอง", unit: unit,
            lat: coords.lat, long: coords.long, stats: stats, imageUrl: "",
            details: {
                dog: { vaccine: Math.floor(stats.vaccine * 0.6), maleSterilize: Math.floor(stats.sterilize * 0.3), femaleSterilize: Math.floor(stats.sterilize * 0.3), microchip: Math.floor(stats.microchip * 0.7), register: Math.floor(stats.register * 0.6), medical: Math.floor(stats.medical * 0.7) },
                cat: { vaccine: Math.floor(stats.vaccine * 0.4), maleSterilize: Math.floor(stats.sterilize * 0.2), femaleSterilize: Math.floor(stats.sterilize * 0.2), microchip: Math.floor(stats.microchip * 0.3), register: Math.floor(stats.register * 0.4), medical: Math.floor(stats.medical * 0.3) },
                other: { vaccine: 0, medical: 0 }
            }
        });
    }
    return newMockData;
};

export const parseReportCSV = (csvText) => {
    const lines = csvText.split('\n');
    const bulkData = [];
    let failCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const cleanCols = cols.map(c => c.trim().replace(/^"|"$/g, ''));

        if (cleanCols.length < 6) { failCount++; continue; }

        let lat = 0; let long = 0;
        if (cleanCols[5]) {
            if(cleanCols[5].includes(',')){
                const coords = cleanCols[5].split(',');
                lat = parseFloat(coords[0].trim()) || 0;
                long = parseFloat(coords[1].trim()) || 0;
            } else {
                lat = parseFloat(cleanCols[5].trim()) || 0;
            }
        }

        const newRecord = {
            date: parseCSVDate(cleanCols[0]),
            location: cleanCols[1],
            district: cleanCols[2],
            subdistrict: cleanCols[3],
            unit: cleanCols[4],
            lat: lat,
            long: long,
            stats: { 
                vaccine: parseInt(cleanCols[9]) || 0,
                sterilize: parseInt(cleanCols[14]) || 0,
                microchip: parseInt(cleanCols[17]) || 0,
                register: parseInt(cleanCols[20]) || 0,
                medical: parseInt(cleanCols[24]) || 0
            },
            details: { 
                dog: { 
                    vaccine: parseInt(cleanCols[6]) || 0, 
                    maleSterilize: parseInt(cleanCols[10]) || 0, 
                    femaleSterilize: parseInt(cleanCols[11]) || 0, 
                    microchip: parseInt(cleanCols[15]) || 0,
                    register: parseInt(cleanCols[18]) || 0,
                    medical: parseInt(cleanCols[21]) || 0 
                },
                cat: { 
                    vaccine: parseInt(cleanCols[7]) || 0, 
                    maleSterilize: parseInt(cleanCols[12]) || 0, 
                    femaleSterilize: parseInt(cleanCols[13]) || 0, 
                    microchip: parseInt(cleanCols[16]) || 0,
                    register: parseInt(cleanCols[19]) || 0,
                    medical: parseInt(cleanCols[22]) || 0 
                },
                other: { 
                    vaccine: parseInt(cleanCols[8]) || 0, 
                    medical: parseInt(cleanCols[23]) || 0 
                }
            }
        };

        if (newRecord.date && newRecord.location) {
            bulkData.push(newRecord);
        } else {
            failCount++;
        }
    }
    return { bulkData, failCount, totalRows: lines.length > 1 ? lines.length - 1 : 0 };
};

export const parseOutbreakCSV = (csvText) => {
    const lines = csvText.split(/\r?\n/);
    const bulkData = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const cleanCols = cols.map(c => c.trim().replace(/^"|"$/g, ''));

        if (cleanCols.length < 5) continue;

        const parseNum = (val) => {
            const num = parseInt(val);
            return isNaN(num) ? 0 : num;
        };

        const newRecord = {
            date: parseCSVDate(cleanCols[0]),
            location: cleanCols[1],
            district: cleanCols[2],
            lat: parseFloat(cleanCols[3]) || 0,
            long: parseFloat(cleanCols[4]) || 0,
            stats: {
                dog: { male: parseNum(cleanCols[5]), female: parseNum(cleanCols[6]) },
                cat: { male: parseNum(cleanCols[7]), female: parseNum(cleanCols[8]) }
            }
        };

        if (newRecord.lat !== 0 && newRecord.long !== 0) {
            bulkData.push(newRecord);
        }
    }
    return { bulkData, totalRows: lines.length > 1 ? lines.length - 1 : 0 };
};