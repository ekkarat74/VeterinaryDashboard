# 🐾 Veterinary & Animal Control Dashboard

ระบบรายงานผลการปฏิบัติงานสัตวแพทย์และควบคุมโรคพิษสุนัขบ้า (Web Application) พัฒนาด้วย React และ Tailwind CSS เชื่อมต่อกับระบบแผนที่และฐานข้อมูลเพื่อการวิเคราะห์ข้อมูลเชิงลึก

## 🌟 ฟีเจอร์หลัก (Key Features)

### 📊 1. Dashboard & Visualization
- **KPI Cards:** แสดงยอดรวมวัคซีน, ทำหมัน, ขึ้นทะเบียน, ไมโครชิป และการรักษา พร้อม Animation สวยงาม
- **Interactive Charts:** กราฟเส้นและแท่งแสดงแนวโน้มรายเดือน (Recharts) และเปรียบเทียบผลงานแต่ละหน่วยงาน
- **Auto-calculation:** คำนวณยอดรวมจากข้อมูลดิบอัตโนมัติ

### 🗺️ 2. GIS & Mapping (ระบบแผนที่)
- **Interactive Map:** แผนที่แสดงจุดปฏิบัติงานพร้อมระบบ Clustering (รวมกลุ่มหมุดเมื่อซูมออก)
- **Rabies Outbreak Monitoring:** แสดงจุดเกิดโรคระบาดพร้อมวงรัศมีแจ้งเตือน:
  - 🔴 **1 กม.** (เข้มงวด)
  - 🛑 **3 กม.** (ควบคุมโรค)
  - 🟠 **5 กม.** (เฝ้าระวัง)
- **Filters:** กรองข้อมูลบนแผนที่ตามประเภทหน่วยงานได้

### 🔐 3. Authentication & Security
- **Role-based Access:**
  - **SuperAdmin:** สิทธิ์สูงสุด จัดการ Users, ลบข้อมูลทั้งหมด (ต้องยืนยันรหัสผ่าน), Backup/Restore
  - **Admin:** เพิ่ม/ลบ/แก้ไข ข้อมูลรายงานและจุดระบาด
  - **User:** ดูข้อมูลได้อย่างเดียว (View Only)
- **User Management:** ระบบเพิ่ม/ลบ/แก้ไขสิทธิ์ผู้ใช้งาน (เฉพาะ SuperAdmin)

### 🛠️ 4. Tools & Utilities
- **CSV Management:** รองรับการ Import และ Export ข้อมูลรายงานเป็นไฟล์ `.csv`
- **Backup & Restore:** สำรองข้อมูลทั้งระบบเป็นไฟล์ `.json` และกู้คืนได้
- **Print Mode:** ปุ่มสั่งพิมพ์รายงาน (ซ่อนเมนูและปุ่มต่างๆ อัตโนมัติเมื่อสั่งพิมพ์)
- **Toast Notifications:** แจ้งเตือนสถานะการทำงาน (Success/Error) ที่มุมจอ
- **Image Preview:** ดูรูปภาพประกอบการปฏิบัติงานแบบขยายใหญ่

---

## 🛠️ Tech Stack

- **Frontend Framework:** [React](https://react.dev/) (Vite)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Maps:** [Leaflet](https://leafletjs.com/) & [React Leaflet](https://react-leaflet.js.org/)
- **Charts:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Http Client:** Fetch API
