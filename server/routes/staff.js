// เพิ่ม Schema สำหรับรายชื่อทีมงาน
const staffMemberSchema = new mongoose.Schema({
    name: { type: String, required: true }
}, { timestamps: true });

const StaffMember = mongoose.model('StaffMember', staffMemberSchema);

// เพิ่ม Routes สำหรับจัดการรายชื่อทีมงาน (เพิ่มโค้ดนี้ลงในส่วน API Routes)
router.get('/staffs', async (req, res) => {
    try {
        const staffs = await StaffMember.find().sort({ name: 1 }).lean();
        res.json(staffs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/staffs', async (req, res) => { // อย่าลืมใส่ middleware authenticateToken ถ้ามี
    try {
        const newStaff = new StaffMember({ name: req.body.name });
        const savedStaff = await newStaff.save();
        res.status(201).json(savedStaff);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/staffs/:id', async (req, res) => {
    try {
        const updatedStaff = await StaffMember.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
        res.json(updatedStaff);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/staffs/:id', async (req, res) => {
    try {
        await StaffMember.findByIdAndDelete(req.params.id);
        res.json({ message: "ลบรายชื่อเรียบร้อย" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});