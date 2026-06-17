const lcnEmail = "YOUR_EMAIL@example.com";
const lcnPassword = "YOUR_PASSWORD";

async function run() {
  let xsrfToken = '';
  let cookieString = '';

  const csrfRes = await fetch('https://api.lcnidiomas.edu.co/sanctum/csrf-cookie', {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  const csrfCookies = csrfRes.headers.get('set-cookie');
  if (csrfCookies) {
    csrfCookies.split(',').map(c => c.split(';')[0].trim()).forEach(c => {
      cookieString += `${c}; `;
      if (c.startsWith('XSRF-TOKEN=')) xsrfToken = decodeURIComponent(c.replace('XSRF-TOKEN=', ''));
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
    },
    body: JSON.stringify({ email: lcnEmail, password: lcnPassword })
  });

  const loginCookies = loginRes.headers.get('set-cookie');
  if (loginCookies) {
    loginCookies.split(',').map(c => c.split(';')[0].trim()).forEach(c => {
      cookieString += `${c}; `;
      if (c.startsWith('XSRF-TOKEN=')) xsrfToken = decodeURIComponent(c.replace('XSRF-TOKEN=', ''));
    });
  }

  const lcnHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Cookie': cookieString,
    'X-XSRF-TOKEN': xsrfToken,
    'X-Requested-With': 'XMLHttpRequest',
  };

  const boardRes = await fetch(`https://api.lcnidiomas.edu.co/api/schedules/between-dates/2/70/2026-06-18/2026-06-18?teachers=%5B%5D`, {
    headers: lcnHeaders
  });

  const boardData = await boardRes.json();
  const classes = boardData.data || [];
  
  const myClasses = classes.slice(0, 2);
  console.log("Classes length:", classes.length);
  console.log("First 2 classes JSON:");
  console.log(JSON.stringify(myClasses, null, 2));
}

run();
