const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Allow large payloads for base64 images/descriptors

// Register a new user with face descriptor
app.post('/api/register', (req, res) => {
    const { name, descriptor } = req.body;
    if (!name || !descriptor) {
        return res.status(400).json({ error: 'Name and descriptor are required' });
    }

    try {
        const userId = db.registerUser(name, JSON.stringify(descriptor));
        res.json({ success: true, userId });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'User already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Load all users (for face matching on client)
app.get('/api/users', (req, res) => {
    try {
        const users = db.getAllUsers();
        // Parse descriptors back to arrays
        const usersWithDescriptors = users.map(u => ({
            ...u,
            descriptor: JSON.parse(u.descriptor)
        }));
        res.json(usersWithDescriptors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Log attendance
app.post('/api/attendance', (req, res) => {
    const { userId, type } = req.body; // type: 'in' or 'out' via calculation or user selection
    // In a real app, 'type' might be inferred from last status.
    // For this MVP, we'll just log an entry.

    if (!userId) {
        return res.status(400).json({ error: 'UserId is required' });
    }

    try {
        const entryId = db.logAttendance(userId);
        res.json({ success: true, entryId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get attendance logs
app.get('/api/attendance', (req, res) => {
    try {
        const logs = db.getAttendanceLogs();
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
