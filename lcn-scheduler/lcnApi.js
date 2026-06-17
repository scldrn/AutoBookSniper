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
    const csrfRes = await fetch(`${this.baseUrl}/sanctum/csrf-cookie`, {
      method: 'GET',
      headers: this.headers
    });
    this._extractCookies(csrfRes);

    const loginRes = await fetch(`${this.baseUrl}/api/login`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify({ email: this.email, password: this.password })
    });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    }
    this._extractCookies(loginRes);
    return true;
  }

  _extractCookies(res) {
    const setCookieHeaders = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(header => {
        if (!header) return;
        const cookieVal = header.split(';')[0];
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
      const res2 = await fetch(`${this.baseUrl}/api/user`, { method: 'GET', headers: this._getHeaders() });
      return res2.json();
    }
    return res.json();
  }

  async getSchedulesBoard(startDate, endDate) {
    // We can fetch suggested schedules for the specific days we want
    // 630 = 10:30 AM, 900 = 3:00 PM (for example)
    // To scan multiple days, we can do multiple requests, but for simplicity we'll just expose the suggest endpoint
    return [];
  }

  async getSuggestedClasses(startDate, endDate, startHourMin, endHourMin, enrollmentId, thirdPartyId) {
    const payload = {
        "hoursRange": 48,
        "data": {
            "creator_user_id": thirdPartyId, // Actually creator is usually not checked tightly, but let's send thirdPartyId
            "third_party_id": thirdPartyId,
            "headquarter_id": 2, // Unicentro
            "enrollment_id": enrollmentId,
            "class_type_id": 1, // Clase
            "course_group_id": 1,
            "start_date": startDate,
            "end_date": endDate,
            "start_hour": startHourMin,
            "end_hour": endHourMin,
            "duration": 90
        }
    };
    
    const res = await fetch(`${this.baseUrl}/api/schedules/suggest-class-schedule`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify(payload)
    });
    
    if (res.status !== 200) {
        throw new Error(`Suggest failed: ${await res.text()}`);
    }
    return res.json();
  }

  async bookClass(scheduleItem, enrollmentId, thirdPartyId) {
    // Add IDs
    scheduleItem.third_party_id = thirdPartyId;
    scheduleItem.enrollment_id = enrollmentId;
    
    const res = await fetch(`${this.baseUrl}/api/schedules/store-class-schedule/48`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify(scheduleItem)
    });
    
    if (res.status !== 200 && res.status !== 201) {
        throw new Error(`Booking failed: ${res.status} - ${await res.text()}`);
    }
    return res.json();
  }
}

module.exports = LCNAPI;
