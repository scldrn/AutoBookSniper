const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setRequestInterception(true);
  
  page.on('request', request => {
    if (request.method() === 'POST') {
      console.log('POST Request to:', request.url());
      console.log('Headers:', request.headers());
      console.log('Post Data:', request.postData());
    }
    request.continue();
  });

  page.on('response', async response => {
    if (response.request().method() === 'POST' && response.url().includes('login')) {
      console.log('Response Status:', response.status());
      try {
        console.log('Response Body:', await response.text());
      } catch (e) { }
    }
  });

  console.log('Navigating to login page...');
  await page.goto('https://usuarios.lcnidiomas.edu.co/login', { waitUntil: 'networkidle2' });
  
  console.log('Typing credentials...');
  await page.type('input[type="email"], input[name="email"], #email', 'YOUR_EMAIL@example.com');
  await page.type('input[type="password"], input[name="password"], #password', 'YOUR_PASSWORD');
  
  console.log('Clicking login button...');
  // Find a button that says login or submit
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find(b => b.innerText.toLowerCase().includes('iniciar') || b.innerText.toLowerCase().includes('login') || b.type === 'submit');
    if (loginBtn) loginBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Cookies after login:');
  const cookies = await page.cookies();
  console.log(cookies);
  
  await browser.close();
})();
