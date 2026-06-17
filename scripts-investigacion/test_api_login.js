const fs = require('fs');

async function testLogin() {
  try {
    // Step 1: Get CSRF Cookie from the API domain
    const csrfRes = await fetch('https://api.lcnidiomas.edu.co/sanctum/csrf-cookie', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://usuarios.lcnidiomas.edu.co',
        'Referer': 'https://usuarios.lcnidiomas.edu.co/'
      }
    });
    
    // We get multiple Set-Cookie headers potentially
    const setCookieHeaders = csrfRes.headers.getSetCookie ? csrfRes.headers.getSetCookie() : [csrfRes.headers.get('set-cookie')];
    console.log('CSRF Status:', csrfRes.status);
    console.log('Set-Cookie Headers:', setCookieHeaders);
    
    let cookiesStr = '';
    let xsrfToken = '';
    
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(header => {
        if (!header) return;
        const cookieVal = header.split(';')[0];
        cookiesStr += cookieVal + '; ';
        if (cookieVal.startsWith('XSRF-TOKEN=')) {
          xsrfToken = decodeURIComponent(cookieVal.replace('XSRF-TOKEN=', ''));
        }
      });
    }

    console.log('Cookies after CSRF:', cookiesStr);
    console.log('XSRF-TOKEN extracted:', xsrfToken);

    // Step 2: Post to login
    const loginRes = await fetch('https://api.lcnidiomas.edu.co/api/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://usuarios.lcnidiomas.edu.co',
        'Referer': 'https://usuarios.lcnidiomas.edu.co/',
        'Cookie': cookiesStr,
        'X-XSRF-TOKEN': xsrfToken,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        email: 'YOUR_EMAIL@example.com',
        password: 'YOUR_PASSWORD'
      })
    });

    console.log('Login Status:', loginRes.status);
    console.log('Login Response:', await loginRes.text());
    
    const loginCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie')];
    console.log('Login Set-Cookies:', loginCookies);

  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();
