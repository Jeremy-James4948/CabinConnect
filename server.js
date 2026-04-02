const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const FACULTY_FILE = path.join(__dirname, 'data', 'faculty.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(express.static(__dirname));

function readFaculty() {
    return JSON.parse(fs.readFileSync(FACULTY_FILE, 'utf8'));
}

function writeFaculty(data) {
    fs.writeFileSync(FACULTY_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function readUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}


app.get('/api/faculty', (req, res) => {
    try {
        const faculty = readFaculty();
        res.json(faculty);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read faculty data' });
    }
});

app.get('/api/faculty/:id', (req, res) => {
    try {
        const faculty = readFaculty();
        const member = faculty.find(f => f.id === parseInt(req.params.id));
        if (!member) return res.status(404).json({ error: 'Faculty member not found' });
        res.json(member);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read faculty data' });
    }
});

app.patch('/api/faculty/:id/timetable', (req, res) => {
    try {
        const { timetable } = req.body;
        const faculty = readFaculty();
        const index = faculty.findIndex(f => f.id === parseInt(req.params.id));
        if (index === -1) return res.status(404).json({ error: 'Faculty member not found' });

        faculty[index].timetable = timetable;
        writeFaculty(faculty);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to upload timetable' });
    }
});

app.delete('/api/faculty/:id/timetable', (req, res) => {
    try {
        const faculty = readFaculty();
        const index = faculty.findIndex(f => f.id === parseInt(req.params.id));
        if (index === -1) return res.status(404).json({ error: 'Faculty member not found' });

        delete faculty[index].timetable;
        writeFaculty(faculty);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete timetable' });
    }
});

app.patch('/api/faculty/:id/status', (req, res) => {
    try {
        const { status, statusMessage, onHoliday } = req.body;
        const faculty = readFaculty();
        const index = faculty.findIndex(f => f.id === parseInt(req.params.id));
        if (index === -1) return res.status(404).json({ error: 'Faculty member not found' });

        if (status !== undefined) faculty[index].status = status;
        if (statusMessage !== undefined) faculty[index].statusMessage = statusMessage;
        if (onHoliday !== undefined) faculty[index].onHoliday = onHoliday;

        writeFaculty(faculty);
        res.json({ success: true, faculty: faculty[index] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update faculty status' });
    }
});

app.patch('/api/faculty/:id/profile', (req, res) => {
    try {
        const { name, department, cabin, email, phone, image } = req.body;
        const faculty = readFaculty();
        const index = faculty.findIndex(f => f.id === parseInt(req.params.id));
        if (index === -1) return res.status(404).json({ error: 'Faculty member not found' });

        if (name !== undefined) faculty[index].name = name;
        if (department !== undefined) faculty[index].department = department;
        if (cabin !== undefined) faculty[index].cabin = cabin;
        if (email !== undefined) faculty[index].email = email;
        if (phone !== undefined) faculty[index].phone = phone;
        if (image !== undefined) faculty[index].image = image;

        writeFaculty(faculty);
        res.json({ success: true, faculty: faculty[index] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update faculty profile' });
    }
});

app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ success: false, error: 'Missing email, password, or role' });
        }

        const users = readUsers();
        const list = role === 'student' ? users.students : users.faculty;
        const user = list.find(u => u.email === email && u.password === password);

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const session = {
            email: user.email,
            name: user.name,
            role: role,
            facultyId: user.id || null,
            loggedInAt: new Date().toISOString()
        };

        res.json({ success: true, user: session });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error during login' });
    }
});

app.get('/api/users', (req, res) => {
    try {
        const users = readUsers();
        res.json({
            students: users.students.map(u => ({ email: u.email, name: u.name, password: u.password })),
            faculty: users.faculty.map(u => ({ email: u.email, name: u.name, password: u.password, id: u.id }))
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to read user data' });
    }
});

// Health check & test routes
app.get('/test', (req, res) => {
    res.send('Backend working 🔥');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Root redirect → login page
app.get('/', (req, res) => {
    res.redirect('/login/login.html');
});

app.listen(PORT, () => {
    console.log(`\n🏫  CabinConnect server running at http://localhost:${PORT}`);
    console.log(`   Login page  → http://localhost:${PORT}/login/login.html`);
    console.log(`   Faculty API → http://localhost:${PORT}/api/faculty\n`);
});