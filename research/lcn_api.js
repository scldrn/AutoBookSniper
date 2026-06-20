const fs = require('fs');

class LCNAPI {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.cookies = '';
    this.xsrfToken = '';
    this.baseUrl = 'https://api.lcnidiomas.edu.co';
    this.headers = {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Origin': 'https://usuarios.lcnidiomas.edu.co',
      'Referer': 'https://usuarios.lcnidiomas.edu.co/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
  }

  async login() {
    console.log('Fetching CSRF cookie...');
    const csrfRes = await fetch(`${this.baseUrl}/sanctum/csrf-cookie`, {
      method: 'GET',
      headers: this.headers
    });

    this._extractCookies(csrfRes);

    console.log('Logging in...');
    const loginRes = await fetch(`${this.baseUrl}/api/login`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify({ email: this.email, password: this.password })
    });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    }

    this._extractCookies(loginRes);
    console.log('Login successful.');
  }

  _extractCookies(res) {
    const setCookieHeaders = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(header => {
        if (!header) return;
        const cookieVal = header.split(';')[0];
        // Replace existing cookie or add new one
        const cookieName = cookieVal.split('=')[0];
        const regex = new RegExp(`${cookieName}=[^;]+(?:;\\s*|$)`, 'g');
        if (this.cookies.match(regex)) {
           this.cookies = this.cookies.replace(regex, `${cookieVal}; `);
        } else {
           this.cookies += `${cookieVal}; `;
        }
        
        if (cookieVal.startsWith('XSRF-TOKEN=')) {
          this.xsrfToken = decodeURIComponent(cookieVal.replace('XSRF-TOKEN=', ''));
        }
      });
    }
  }

  _getHeaders() {
    return {
      ...this.headers,
      'Cookie': this.cookies,
      'X-XSRF-TOKEN': this.xsrfToken,
      'X-Requested-With': 'XMLHttpRequest'
    };
  }

  async getProfile() {
    const res = await fetch(`${this.baseUrl}/api/users/profile`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (res.status === 404) {
      // Sometimes it's just /api/user
      const res2 = await fetch(`${this.baseUrl}/api/user`, {
        method: 'GET',
        headers: this._getHeaders()
      });
      return res2.json();
    }
    return res.json();
  }
  
  async getEnrollments() {
     const res = await fetch(`${this.baseUrl}/api/enrollments/search`, {
         method: 'POST',
         headers: this._getHeaders(),
         body: JSON.stringify({}) // maybe empty or specific payload
     });
     if (res.status !== 200) {
       console.log('Error searching enrollments', await res.text());
       return null;
     }
     return res.json();
  }

  async getSchedulesBoard(headquarterId = 2, languageId = 70, startDate, endDate) {
    // Defaults to Unicentro (2) and English (70)
    const payload = {
        "headquarter_id": headquarterId,
        "language_id": languageId,
        "modality_id": null,
        "class_type_id": null,
        "student_level_id": null,
        "start_date": startDate,
        "end_date": endDate
    };
    const res = await fetch(`${this.baseUrl}/api/schedules/board`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async getMyClasses() {
    // There must be an endpoint to fetch upcoming classes
    const res = await fetch(`${this.baseUrl}/api/schedules/students/reservations`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (res.status !== 200) {
       console.log('Failed fetching reservations (GET)', await res.text());
       // fallback maybe POST?
       const res2 = await fetch(`${this.baseUrl}/api/schedules/students/reservations`, {
          method: 'POST',
          headers: this._getHeaders(),
          body: JSON.stringify({})
       });
       return res2.json();
    }
    return res.json();
  }
}

// Test script
(async () => {
  const api = new LCNAPI('YOUR_EMAIL@example.com', 'YOUR_PASSWORD');
  await api.login();
  
  console.log('\n--- Fetching User Profile ---');
  const profile = await api.getProfile();
  console.log(profile);

  console.log('\n--- Fetching My Classes ---');
  try {
     const classes = await api.getMyClasses();
     console.log('Classes length:', classes?.data?.length || classes?.length || 0);
  } catch(e) {
     console.log('Could not fetch classes', e);
  }

  console.log('\n--- Fetching Enrollments ---');
  try {
     const enrollments = await api.getEnrollments();
     console.log('Enrollments:', enrollments);
  } catch(e) {
     console.log('Could not fetch enrollments', e);
  }
})();
