const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const LCNAPI = require('./lcnApi');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store a single API instance in memory for simplicity 
// (For production, we'd use sessions or DB, but this is a personal local tool)
let apiInstance = null;
let userProfile = null;

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        apiInstance = new LCNAPI(email, password);
        await apiInstance.login();
        userProfile = await apiInstance.getProfile();
        res.json({ success: true, profile: userProfile });
    } catch (error) {
        console.error(error);
        res.status(401).json({ success: false, message: error.message });
    }
});

app.get('/api/auth/status', (req, res) => {
    if (apiInstance && userProfile) {
        res.json({ loggedIn: true, profile: userProfile });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/api/auth/logout', (req, res) => {
    apiInstance = null;
    userProfile = null;
    res.json({ success: true });
});

app.post('/api/classes/suggest', async (req, res) => {
    if (!apiInstance) return res.status(401).json({ error: 'Not logged in' });
    
    const { date, startTime, endTime } = req.body; 
    // startTime/endTime in minutes from midnight (e.g. 540 for 9:00 AM)
    
    // We need enrollment_id and third_party_id from the profile
    // Typically inside userProfile.enrollments[0].id and userProfile.third_party_id
    // But since the profile structure can vary, let's just use the known ones for Sam for safety, 
    // or try to extract from profile.
    
    // As per previous findings: 
    const thirdPartyId = userProfile.third_party_id || 25083; 
    let enrollmentId = 21960; // default fallback
    
    if (userProfile.enrollments && userProfile.enrollments.length > 0) {
        enrollmentId = userProfile.enrollments[0].id;
    }
    
    try {
        const result = await apiInstance.getSuggestedClasses(
            `${date} 00:00:00`, // Not strictly used for start_hour if hour is provided, but good for format
            `${date} 23:59:59`, 
            startTime, 
            endTime, 
            enrollmentId, 
            thirdPartyId
        );
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/classes/book', async (req, res) => {
    if (!apiInstance) return res.status(401).json({ error: 'Not logged in' });
    
    const { scheduleItem } = req.body;
    const thirdPartyId = userProfile.third_party_id || 25083; 
    let enrollmentId = 21960; 
    if (userProfile.enrollments && userProfile.enrollments.length > 0) {
        enrollmentId = userProfile.enrollments[0].id;
    }

    try {
        const result = await apiInstance.bookClass(scheduleItem, enrollmentId, thirdPartyId);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Fallback to index.html for SPA
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`LCN Scheduler running at http://localhost:${PORT}`);
});
