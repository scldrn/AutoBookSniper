const fs = require('fs');

async function testLogin() {
  try {
    // Maybe we just POST to /api/login?
    const loginRes = await fetch('https://usuarios.lcnidiomas.edu.co/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: 'YOUR_EMAIL@example.com',
        password: 'YOUR_PASSWORD'
      })
    });

    console.log('Login Status:', loginRes.status);
    const loginText = await loginRes.text();
    console.log('Login Response:', loginText);
    
    // Some headers might have multiple set-cookie values. 
    // fetch API sometimes combines them, or we can iterate through them
    for (const [key, value] of loginRes.headers.entries()) {
      if (key.toLowerCase() === 'set-cookie') {
        console.log('Set-Cookie:', value);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();
