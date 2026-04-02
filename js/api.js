// CabinConnect Shared Data Layer
// Async API-backed methods — talks to the Express backend at /api/*
// Session (after login) is still kept in localStorage for simplicity.

const CabinConnect = {

    // Base URL – works whether opened from the dev server or via file:// fallback
    BASE_URL: window.location.origin.startsWith('http') ? '' : 'http://localhost:3000',

    // ── Faculty API ────────────────────────────────────────────────────────────

    // Get all faculty members from the backend
    async getFaculty() {
        try {
            const res = await fetch(`${this.BASE_URL}/api/faculty`);
            if (!res.ok) throw new Error('Network response was not ok');
            return await res.json();
        } catch (err) {
            console.error('Failed to fetch faculty:', err);
            return [];
        }
    },

    // Get a single faculty member by ID
    async getFacultyById(id) {
        try {
            const res = await fetch(`${this.BASE_URL}/api/faculty/${id}`);
            if (!res.ok) throw new Error('Network response was not ok');
            return await res.json();
        } catch (err) {
            console.error('Failed to fetch faculty member:', err);
            return null;
        }
    },

    // Update status, statusMessage, and onHoliday for a faculty member
    async updateFacultyStatus(facultyId, status, statusMessage, onHoliday) {
        try {
            const res = await fetch(`${this.BASE_URL}/api/faculty/${facultyId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, statusMessage, onHoliday })
            });
            if (!res.ok) throw new Error('Network response was not ok');
            return await res.json();
        } catch (err) {
            console.error('Failed to update faculty status:', err);
            return { success: false, error: err.message };
        }
    },

    // Update profile fields for a faculty member
    async updateFacultyProfile(facultyId, profileData) {
        try {
            const res = await fetch(`${this.BASE_URL}/api/faculty/${facultyId}/profile`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            if (!res.ok) throw new Error('Network response was not ok');
            return await res.json();
        } catch (err) {
            console.error('Failed to update faculty profile:', err);
            return { success: false, error: err.message };
        }
    },

    async uploadTimetable(facultyId, timetableData) {
        try {
            const res = await fetch(`${this.BASE_URL}/api/faculty/${facultyId}/timetable`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timetable: timetableData })
            });
            if (!res.ok) throw new Error('Network response was not ok');
            return await res.json();
        } catch (err) {
            console.error('Failed to upload timetable:', err);
            return { success: false, error: err.message };
        }
    },

    async deleteTimetable(facultyId) {
        try {
            const res = await fetch(`${this.BASE_URL}/api/faculty/${facultyId}/timetable`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Network response was not ok');
            return await res.json();
        } catch (err) {
            console.error('Failed to delete timetable:', err);
            return { success: false, error: err.message };
        }
    },

    // ── Authentication ─────────────────────────────────────────────────────────

    // Login — sends credentials to backend, stores session in localStorage
    async login(email, password, role) {
        try {
            const res = await fetch(`${this.BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('cabinconnect_session', JSON.stringify(data.user));
            }
            return data;
        } catch (err) {
            console.error('Login request failed:', err);
            return { success: false, error: 'Unable to connect to server. Make sure the backend is running.' };
        }
    },

    logout() {
        localStorage.removeItem('cabinconnect_session');
    },

    getSession() {
        const session = localStorage.getItem('cabinconnect_session');
        return session ? JSON.parse(session) : null;
    },

    isAuthenticated() {
        return this.getSession() !== null;
    },

    requireAuth(allowedRoles = ['student', 'faculty']) {
        const session = this.getSession();
        if (!session || !allowedRoles.includes(session.role)) {
            window.location.href = this._loginPath();
            return false;
        }
        return session;
    },

    // Figure out the correct relative path to the login page
    _loginPath() {
        if (window.location.origin.startsWith('http')) {
            return '/index.html';
        }
        // file:// protocol — use relative path
        const depth = window.location.pathname.split('/').length - 1;
        const prefix = depth > 2 ? '../' : '';
        return `${prefix}index.html`;
    },

    // ── Status UI helpers ──────────────────────────────────────────────────────

    getStatusInfo(status, onHoliday) {
        if (onHoliday) {
            return { label: 'On Leave', color: 'gray', icon: 'flight_takeoff', bgClass: 'bg-gray-500' };
        }
        switch (status) {
            case 'available':
                return { label: 'Available', color: 'green', icon: 'check_circle', bgClass: 'bg-emerald-500' };
            case 'busy':
                return { label: 'Busy', color: 'yellow', icon: 'schedule', bgClass: 'bg-yellow-400' };
            case 'unavailable':
                return { label: 'Not Available', color: 'red', icon: 'block', bgClass: 'bg-red-500' };
            default:
                return { label: 'Unknown', color: 'gray', icon: 'help', bgClass: 'bg-gray-400' };
        }
    }
};
