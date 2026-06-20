import requests
import json
import datetime

import os

email = os.environ.get("LCN_EMAIL", "YOUR_EMAIL@example.com")
password = os.environ.get("LCN_PASSWORD", "YOUR_PASSWORD")

session = requests.Session()
headers = {
    'Accept': 'application/json',
    'Origin': 'https://usuarios.lcnidiomas.edu.co',
    'Referer': 'https://usuarios.lcnidiomas.edu.co/'
}

# 1. Get CSRF Cookie
csrf_url = "https://api.lcnidiomas.edu.co/sanctum/csrf-cookie"
session.get(csrf_url, headers=headers)

# Extract XSRF-TOKEN
xsrf_token = session.cookies.get("XSRF-TOKEN")
if xsrf_token:
    headers['X-XSRF-TOKEN'] = requests.utils.unquote(xsrf_token)

# 2. Login
login_url = "https://api.lcnidiomas.edu.co/api/login"
login_payload = {"email": email, "password": password}
res = session.post(login_url, json=login_payload, headers=headers)
if res.status_code != 200:
    print("Login failed:", res.text)
    exit(1)

# Extract new XSRF-TOKEN if changed
xsrf_token = session.cookies.get("XSRF-TOKEN")
if xsrf_token:
    headers['X-XSRF-TOKEN'] = requests.utils.unquote(xsrf_token)

# 3. Get Board
today = datetime.date.today()
end_date = today + datetime.timedelta(days=2)
board_url = f"https://api.lcnidiomas.edu.co/api/schedules/between-dates/2/70/{today}/{end_date}?teachers=[]"

board_res = session.get(board_url, headers=headers)
if board_res.status_code == 200:
    data = board_res.json().get('data', [])
    print(f"Encontradas {len(data)} clases en el tablero.")
    for c in data:
        start = c.get('start_date')
        hour = c.get('start_hour')
        level = c.get('course_level_group_name')
        reserved = c.get('reserved')
        max_stud = c.get('max_student')
        if 540 <= hour <= 720 and level in ['A1', 'A2', 'A1-A2'] and reserved < max_stud:
            print(f"DISPONIBLE: ID={c['id']}, Fecha={start}, Nivel={level}, Cupos={reserved}/{max_stud}")
        elif '2026-06-19' in start and 540 <= hour <= 720:
             print(f"FILTRADA (19): ID={c['id']}, Fecha={start}, Nivel={level}, Cupos={reserved}/{max_stud}")
else:
    print("Failed to get board:", board_res.text)
