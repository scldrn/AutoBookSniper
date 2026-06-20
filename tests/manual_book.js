const fs = require('fs');

async function run() {
    const lcnEmail = process.env.LCN_EMAIL || "YOUR_EMAIL@example.com";
    const lcnPassword = process.env.LCN_PASSWORD || "YOUR_PASSWORD";

    let xsrfToken = '';
    let cookieString = '';

    const csrfRes = await fetch('https://api.lcnidiomas.edu.co/sanctum/csrf-cookie', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://usuarios.lcnidiomas.edu.co',
        'Referer': 'https://usuarios.lcnidiomas.edu.co/'
      }
    });

    const csrfCookies = csrfRes.headers.get('set-cookie');
    if (csrfCookies) {
      const cookies = csrfCookies.split(',').map(c => c.split(';')[0].trim());
      cookies.forEach(c => {
        cookieString += `${c}; `;
        if (c.startsWith('XSRF-TOKEN=')) {
          xsrfToken = decodeURIComponent(c.replace('XSRF-TOKEN=', ''));
        }
      });
    }

    const loginRes = await fetch('https://api.lcnidiomas.edu.co/api/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cookie': cookieString,
        'X-XSRF-TOKEN': xsrfToken,
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://usuarios.lcnidiomas.edu.co',
        'Referer': 'https://usuarios.lcnidiomas.edu.co/'
      },
      body: JSON.stringify({ email: lcnEmail, password: lcnPassword })
    });

    if (!loginRes.ok) {
        console.log("LOGIN FAILED", loginRes.status);
        return;
    }

    const loginCookies = loginRes.headers.get('set-cookie');
    if (loginCookies) {
      const cookies = loginCookies.split(',').map(c => c.split(';')[0].trim());
      cookies.forEach(c => {
        const cName = c.split('=')[0];
        const regex = new RegExp(`${cName}=[^;]+(?:;\\s*|$)`, 'g');
        if (cookieString.match(regex)) {
          cookieString = cookieString.replace(regex, `${c}; `);
        } else {
          cookieString += `${c}; `;
        }
        if (c.startsWith('XSRF-TOKEN=')) {
          xsrfToken = decodeURIComponent(c.replace('XSRF-TOKEN=', ''));
        }
      });
    }

    const lcnHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cookie': cookieString,
      'X-XSRF-TOKEN': xsrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://usuarios.lcnidiomas.edu.co',
      'Referer': 'https://usuarios.lcnidiomas.edu.co/'
    };

    const targetClasses = [
        { id: 539886, desc: "JUEVES 9:00 AM (LLENA)" },
        { id: 539887, desc: "VIERNES 7:30 AM (FANTASMA)" },
        { id: 541111, desc: "SABADO 9:45 AM (BLOQUEADA POR 48H)" }
    ];

    console.log("=== INICIANDO INTENTOS DE RESERVA MANUAL ===");

    for (const c of targetClasses) {
        console.log(`\nIntentando agendar: ${c.desc} (ID: ${c.id})`);
        
        const res = await fetch('https://api.lcnidiomas.edu.co/api/student/reservations', {
            method: 'POST',
            headers: lcnHeaders,
            body: JSON.stringify({
                enrollment_id: 21960,
                schedule_id: c.id
            })
        });

        const data = await res.json();
        console.log(`Respuesta del servidor LCN:`);
        console.log(JSON.stringify(data, null, 2));
    }
}

run();
