// src/utils/helpers.js
export const getUnitKey = (unitName) => {
    if (!unitName) return 'other';
    const lower = String(unitName).toLowerCase();
    
    if (['sterilization', 'vaccine_microchip', 'governor', 'cat_cage', 'other'].includes(lower)) return lower;
    
    if (lower.includes('สัตวแพทย์') || lower.includes('vet') || lower.includes('steriliz')) return 'sterilization';
    if (lower.includes('วัคซีน') || lower.includes('vaccine') || lower.includes('ไมโครชิป') || lower.includes('microchip')) return 'vaccine_microchip';
    if (lower.includes('ผู้ว่า') || lower.includes('governor')) return 'governor';
    if (lower.includes('กรงแมว') || lower.includes('cat') || lower.includes('cage')) return 'cat_cage';

    return 'other';
};