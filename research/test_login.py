import requests
import json

session = requests.Session()

# Step 1: Get CSRF token
response = session.get('https://usuarios.lcnidiomas.edu.co/')
print("Cookies after GET /:", session.cookies.get_dict())

# Let's try to post to /login
login_url = 'https://usuarios.lcnidiomas.edu.co/login'

# We might need the X-XSRF-TOKEN header. It is the unquoted XSRF-TOKEN cookie.
xsrf_token = session.cookies.get('XSRF-TOKEN')
if xsrf_token:
    xsrf_token = requests.utils.unquote(xsrf_token)

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
}

if xsrf_token:
    headers['X-XSRF-TOKEN'] = xsrf_token

payload = {
    "email": "YOUR_EMAIL@example.com",
    "password": "YOUR_PASSWORD"
}

response = session.post(login_url, json=payload, headers=headers)
print("Login Status Code:", response.status_code)
try:
    print("Login Response JSON:", response.json())
except:
    print("Login Response Text (Snippet):", response.text[:500])

print("Cookies after login:", session.cookies.get_dict())
