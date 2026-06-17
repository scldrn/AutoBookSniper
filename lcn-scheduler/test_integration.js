async function runIntegrationTest() {
    console.log('=== Starting Integration Tests ===');
    const baseUrl = 'http://localhost:3000';

    try {
        // 1. Test Login
        console.log('\\n[1] Testing Login...');
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'YOUR_EMAIL@example.com', password: 'YOUR_PASSWORD' })
        });
        
        if (!loginRes.ok) throw new Error(`Login failed with status ${loginRes.status}`);
        const loginData = await loginRes.json();
        console.log('Login Success:', loginData.success);
        console.log('User Profile Full:', JSON.stringify(loginData.profile).substring(0, 500));

        // 2. Test Auth Status
        console.log('\\n[2] Testing Auth Status...');
        const statusRes = await fetch(`${baseUrl}/api/auth/status`);
        const statusData = await statusRes.json();
        console.log('Is Logged In:', statusData.loggedIn);

        // 3. Test Class Suggestion for Thursday, June 18, 2026
        console.log('\\n[3] Testing Class Search for June 18, 2026 (Thursday)...');
        // Let's search from 09:00 AM (540) to 01:30 PM (810)
        const suggestRes = await fetch(`${baseUrl}/api/classes/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: '2026-06-18', startTime: 540, endTime: 810 })
        });
        
        if (!suggestRes.ok) throw new Error(`Suggest failed with status ${suggestRes.status}`);
        const suggestData = await suggestRes.json();
        
        const classes = suggestData.data || [];
        // Filter by Headquarter 2 (Unicentro) as frontend does
        console.log(`Found ${classes.length} total classes.`);
        
        if (classes.length > 0) {
            classes.forEach((c, idx) => {
                const startH = Math.floor(c.start_hour / 60);
                const startM = c.start_hour % 60;
                console.log(`  -> Class ${idx + 1}: ID ${c.id} | Level ${c.course_level_group_name} | Time: ${startH}:${startM === 0 ? '00' : startM} | HQ: ${c.headquarter_id} | Room: ${c.classroom_name} | Reserved: ${c.reserved}/${c.max_student}`);
            });
            
            // Just simulate booking log
            console.log('\\n[4] Found a valid class. Skipping real booking to preserve quotas.');
        } else {
            console.log('No classes found to test booking.');
        }

    } catch (error) {
        console.error('Integration Test Error:', error.message);
    }
}

runIntegrationTest();
