const staffMemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, enum: ['vet', 'general'], default: 'general' }
}, { timestamps: true });

const StaffMember = mongoose.model('StaffMember', staffMemberSchema);

router.get('/staffs', async (req, res) => {
    try {
        const staffs = await StaffMember.find().sort({ name: 1 }).lean();
        res.json(staffs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/staffs', async (req, res) => { 
    try {
        const newStaff = new StaffMember({ name: req.body.name, role: req.body.role });
        const savedStaff = await newStaff.save();
        res.status(201).json(savedStaff);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/staffs/:id', async (req, res) => {
    try {
        const updatedStaff = await StaffMember.findByIdAndUpdate(
            req.params.id, 
            { name: req.body.name, role: req.body.role }, 
            { new: true }
        );
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