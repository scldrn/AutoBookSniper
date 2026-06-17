

async function run() {
    const lcnEmail = "YOUR_EMAIL@example.com";
    const lcnPassword = "YOUR_PASSWORD";
    
    // Login
    let xsrfToken = '';
    let cookieString = '';
    const csrfRes = await fetch('https://api.lcnidiomas.edu.co/sanctum/csrf-cookie', {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Origin': 'https://usuarios.lcnidiomas.edu.co' }
    });
    
    const csrfCookies = csrfRes.headers.get('set-cookie');
    if (csrfCookies) {
      const cookies = csrfCookies.split(',').map(c => c.split(';')[0].trim());
      cookies.forEach(c => {
        cookieString += `${c}; `;
        if (c.startsWith('XSRF-TOKEN=')) { xsrfToken = decodeURIComponent(c.replace('XSRF-TOKEN=', '')); }
      });
    }

    const loginRes = await fetch('https://api.lcnidiomas.edu.co/api/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json', 'Content-Type': 'application/json',
        'Cookie': cookieString, 'X-XSRF-TOKEN': xsrfToken, 'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://usuarios.lcnidiomas.edu.co'
      },
      body: JSON.stringify({ email: lcnEmail, password: lcnPassword })
    });

    const loginCookies = loginRes.headers.get('set-cookie');
    if (loginCookies) {
      const cookies = loginCookies.split(',').map(c => c.split(';')[0].trim());
      cookies.forEach(c => {
        const cName = c.split('=')[0];
        const regex = new RegExp(`${cName}=[^;]+(?:;\\s*|$)`, 'g');
        if (cookieString.match(regex)) { cookieString = cookieString.replace(regex, `${c}; `); } else { cookieString += `${c}; `; }
        if (c.startsWith('XSRF-TOKEN=')) { xsrfToken = decodeURIComponent(c.replace('XSRF-TOKEN=', '')); }
      });
    }

    const headers = {
      'Accept': 'application/json', 'Cookie': cookieString, 'X-XSRF-TOKEN': xsrfToken, 'X-Requested-With': 'XMLHttpRequest'
    };

    const boardUrl = `https://api.lcnidiomas.edu.co/api/schedules/between-dates/2/70/2026-06-16/2026-06-18?teachers=[]`;
    const boardRes = await fetch(boardUrl, { method: "GET", headers });
    const boardData = await boardRes.json();
    const classes = boardData.data || [];
    
    if (classes.length === 0) {
        console.log("BOARD DATA:", boardData);
    }
    
    console.log(`\n=== ESTADO ACTUAL DEL TABLERO LCN (16 al 18 de Junio) ===`);
    console.log(`Se encontraron ${classes.length} clases en total en la sede.`);
    
    const valid = classes.filter(s => {
        if (s.headquarter_id !== 2 || s.class_type_id !== 1) return false;
        if (s.start_hour < 540 || s.start_hour > 720) return false;
        const cLvl = s.course_level_group_name || "";
        if (!cLvl.includes("A1") && !cLvl.includes("A2")) return false;
        if (s.reserved >= s.max_student) return false;
        return true;
    });
    
    console.log(`\nClases que cumplen tu nivel (A1-A2), rango (9:00 a 12:00) y que NO ESTÁN LLENAS:`);
    if (valid.length === 0) console.log("NINGUNA.");
    valid.forEach(v => {
        console.log(`- ID: ${v.id} | Fecha: ${v.start_date} | Profesor: ${v.teacher_id ? 'Asignado' : 'FANTASMA (Sin asignar)'} | Cupos: ${v.max_student - v.reserved}`);
    });
}
run();
