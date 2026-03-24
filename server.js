const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3000;

// In-memory storage for career goals (simulating a database)
let careerGoals = [];

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve get-started page
app.get('/get-started.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'get-started.html'));
});

// Serve set-goals page
app.get('/set-goals.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'set-goals.html'));
});

// Serve job-search page
app.get('/job-search.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'job-search.html'));
});

// Get all career goals
app.get('/api/career-goals', (req, res) => {
    try {
        res.json({ careerGoals });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve career goals' });
    }
});

// Add a new career goal
app.post('/api/career-goals', (req, res) => {
    try {
        const { careerField, experienceLevel, notes } = req.body;
        if (!careerField || !experienceLevel) {
            return res.status(400).json({ error: 'Career field and experience level are required' });
        }
        careerGoals.push({ careerField, experienceLevel, notes });
        res.json({ careerGoals });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save career goal' });
    }
});

// Delete a career goal
app.delete('/api/career-goals/:index', (req, res) => {
    try {
        const index = parseInt(req.params.index);
        if (isNaN(index) || index < 0 || index >= careerGoals.length) {
            return res.status(400).json({ error: 'Invalid index' });
        }
        careerGoals.splice(index, 1);
        res.json({ careerGoals });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete career goal' });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Career Counseling Bot server running at http://localhost:${port}`);
    console.log('Press Ctrl+C to stop the server');
});