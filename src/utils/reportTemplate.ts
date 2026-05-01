// reportTemplate.ts
import { DataItem } from '../types';

export const formatThaiDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; 
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ. ให้เลย
        
        return `${day}/${month}/${year}`;
    } catch {
        return dateString;
    }
};

export const getDocumentStyle = (): string => `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600&display=swap');
    .report-doc {
        font-family: 'Sarabun', sans-serif;
        color: #000;
        font-size: 14px;
        line-height: 1.4;
        margin: 0 auto;
        padding: 40px 50px;
        background: #fff;
        width: 794px;
        min-height: 1123px;
        box-sizing: border-box;
    }
    .report-doc .text-center { text-align: center; }
    .report-doc .font-bold { font-weight: 600; }
    .report-doc .underline { text-decoration: underline; }
    .report-doc .header-group { margin-bottom: 25px; }
    .report-doc .header-title { font-size: 16px; margin-bottom: 4px; }
    .report-doc .form-line { 
        display: flex; 
        align-items: flex-end; 
        margin-bottom: 12px;
        white-space: nowrap; 
    }
    .report-doc .dotted-text { 
        border-bottom: 1px dotted #000; 
        text-align: center; 
        color: #000000; 
        padding-bottom: 4px;
        line-height: 1.2; 
    }
    .report-doc .flex-1 { flex: 1; }
    .report-doc .data-grid { 
        width: 95%; 
        margin: 20px auto; 
        border-collapse: collapse; 
    }
    .report-doc .data-grid td { 
        padding: 6px 0;
        vertical-align: bottom; 
    }
    .report-doc .col-main { width: 45%; }
    .report-doc .col-sub { width: 25%; padding-left: 15px; }
    .report-doc .col-val { width: 20%; text-align: center; }
    .report-doc .col-unit { width: 10%; text-align: left; padding-left: 5px; }
    .report-doc .val-dots { 
        display: inline-block; 
        width: 80%; 
        border-bottom: 1px dotted #000; 
        text-align: center; 
        color: #000; 
        padding-bottom: 4px;
        line-height: 1.2; 
    }
    .report-doc .section-gap { padding-top: 15px; }
    @media print {
        @page { size: A4; margin: 10mm; }
        .report-doc { width: auto; min-height: auto; padding: 0; }
    }
`;

export const getDocumentHTML = (item: DataItem): string => `
    <div class="report-doc">
        <div class="header-group text-center font-bold">
            <div class="header-title underline">สรุปผลการปฏิบัติงานสัตวแพทย์ กลุ่มควบคุมโรคพิษสุนัขบ้า</div>
            <div class="header-title underline">สำนักงานสัตวแพทย์สาธารณสุข สำนักอนามัย</div>
        </div>
        
        <div class="form-line">
            <span>ชื่อโครงการ</span>
            <span class="dotted-text flex-1" style="margin: 0 10px;">${item.unit || ''}</span>
            <span>สถานที่</span>
            <span class="dotted-text" style="width: 35%; margin-left: 10px;">${item.location || ''}</span>
        </div>
        
        <div class="form-line">
            <span>วันที่</span>
            <span class="dotted-text" style="width: 250px; margin: 0 10px;">${formatThaiDate(item.date)}</span>
            <span>เขต</span>
            <span class="dotted-text flex-1" style="margin-left: 10px;">${item.district || ''}</span>
        </div>
        
        <div class="form-line">
            <span>นสพ.ควบคุมหน่วย</span>
            <span class="dotted-text flex-1" style="margin: 0 10px;"></span>
            <span>สังกัด</span>
            <span class="dotted-text" style="width: 200px; margin-left: 10px;">สำนักอนามัย</span>
        </div>

        <table class="data-grid">
            <tr>
                <td class="col-main">จำนวนวัคซีนที่เบิก</td>
                <td class="col-sub"></td>
                <td class="col-val"><span class="val-dots">${item.details?.vaccineRequisitioned || ''}</span></td>
                <td class="col-unit">โด๊ส</td>
            </tr>
            <tr>
                <td class="col-main">จำนวนสัตว์ที่ฉีดวัคซีน</td>
                <td class="col-sub">สุนัข</td>
                <td class="col-val"><span class="val-dots">${item.details?.dog?.vaccine || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>
            <tr>
                <td class="col-main"></td>
                <td class="col-sub">แมว</td>
                <td class="col-val"><span class="val-dots">${item.details?.cat?.vaccine || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>
            <tr>
                <td class="col-main"></td>
                <td class="col-sub">อื่นๆ</td>
                <td class="col-val"><span class="val-dots">${item.details?.other?.vaccine || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>
            <tr>
                <td class="col-main"></td>
                <td class="col-sub">รวม</td>
                <td class="col-val"><span class="val-dots">${item.stats?.vaccine || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>
            <tr>
                <td class="col-main" style="padding-top: 6px;">คงเหลือวัคซีน</td>
                <td class="col-sub" style="padding-top: 6px;"></td>
                <td class="col-val" style="padding-top: 6px;"><span class="val-dots">${item.details?.vaccineRemaining || ''}</span></td>
                <td class="col-unit" style="padding-top: 6px;">โด๊ส</td>
            </tr>

            <tr>
                <td class="col-main section-gap">จำนวนสุนัข / แมวทำหมัน</td>
                <td class="col-sub section-gap">สุนัขเพศผู้</td>
                <td class="col-val section-gap"><span class="val-dots">${item.details?.dog?.maleSterilize || ''}</span></td>
                <td class="col-unit section-gap">ตัว</td>
            </tr>
            <tr>
                <td class="col-main"></td>
                <td class="col-sub">สุนัขเพศเมีย</td>
                <td class="col-val"><span class="val-dots">${item.details?.dog?.femaleSterilize || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>
            <tr>
                <td class="col-main"></td>
                <td class="col-sub">แมวเพศผู้</td>
                <td class="col-val"><span class="val-dots">${item.details?.cat?.maleSterilize || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>
            <tr>
                <td class="col-main"></td>
                <td class="col-sub">แมวเพศเมีย</td>
                <td class="col-val"><span class="val-dots">${item.details?.cat?.femaleSterilize || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>
            <tr>
                <td class="col-main"></td>
                <td class="col-sub">รวม</td>
                <td class="col-val"><span class="val-dots">${item.stats?.sterilize || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>

            <tr>
                <td class="col-main section-gap">จำนวนสุนัข / แมวที่ฉีดไมโครชิป</td>
                <td class="col-sub section-gap">สุนัขมีเจ้าของ</td>
                <td class="col-val section-gap"><span class="val-dots">${item.details?.dog?.microchip || ''}</span></td>
                <td class="col-unit section-gap">ตัว</td>
            </tr>
            <tr>
                <td class="col-main"></td>
                <td class="col-sub">แมวมีเจ้าของ</td>
                <td class="col-val"><span class="val-dots">${item.details?.cat?.microchip || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>
            <tr>
                <td class="col-main"></td>
                <td class="col-sub">รวม</td>
                <td class="col-val"><span class="val-dots">${item.stats?.microchip || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>

            <tr>
                <td class="col-main section-gap">จำนวนสุนัข / แมว ขึ้นทะเบียน</td>
                <td class="col-sub section-gap">ขึ้นทะเบียน สุนัข</td>
                <td class="col-val section-gap"><span class="val-dots">${item.details?.dog?.register || ''}</span></td>
                <td class="col-unit section-gap">ตัว</td>
            </tr>
            <tr>
                <td class="col-main"></td>
                <td class="col-sub">ขึ้นทะเบียน แมว</td>
                <td class="col-val"><span class="val-dots">${item.details?.cat?.register || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>
            <tr>
                <td class="col-main"></td>
                <td class="col-sub">รวม</td>
                <td class="col-val"><span class="val-dots">${item.stats?.register || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>

            <tr>
                <td class="col-main section-gap">รักษาสัตว์</td>
                <td class="col-sub section-gap">สุนัข</td>
                <td class="col-val section-gap"><span class="val-dots">${item.details?.dog?.medical || ''}</span></td>
                <td class="col-unit section-gap">ตัว</td>
            </tr>
            <tr>
                <td class="col-main"></td>
                <td class="col-sub">แมว</td>
                <td class="col-val"><span class="val-dots">${item.details?.cat?.medical || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>
            <tr>
                <td class="col-main"></td>
                <td class="col-sub">อื่นๆ</td>
                <td class="col-val"><span class="val-dots">${item.details?.other?.medical || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>
            <tr>
                <td class="col-main"></td>
                <td class="col-sub">รวม</td>
                <td class="col-val"><span class="val-dots">${item.stats?.medical || ''}</span></td>
                <td class="col-unit">ตัว</td>
            </tr>
        </table>

        <div class="form-line" style="margin-top: 30px; padding-left: 20px;">
            <span>ผู้รายงาน</span>
            <span class="dotted-text" style="width: 250px; margin: 0 15px;"></span>
            <span>สังกัด</span>
            <span class="dotted-text flex-1" style="margin-left: 15px;">สำนักอนามัย</span>
        </div>
    </div>
`;