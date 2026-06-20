import urllib.request
import ssl
import json
from urllib.parse import unquote

cookies = (
    "XSRF-TOKEN=eyJpdiI6Ik9OSi9XWTdZSitBU0ZvR0IzSnZkYUE9PSIsInZhbHVlIjoiZGdQMjBZU0UyMWhkRzhuYjkzZ3ZiaDIzQnZaVVNHVHNYbW9ya3RPSjVsZ3BjY0gxMnkxbjkvUnNaNU5OVXRTVWZwL0NCWU82ejdVYUo5RmFLOVRmaUhZd3RuVGFDN21yVmlGSXJDeityY3cxYnZkZVl1UkZkQkNaMXNpN1dQaWQiLCJtYWMiOiI1NDY2ZDU5M2MyNzJiNGY5NGEwMTMwOWJiY2MzODkzMWU4Y2I1ZWQ2MWE2OGY5YzIwZjkxZTdlMTUzOTVjZmRhIiwidGFnIjoiIn0%3D; "
    "lcn_idiomas_session=eyJpdiI6Im9iUkVEVkZCOFF5T0J1bGxuTjh3SVE9PSIsInZhbHVlIjoicmNZdmNTU1JKZVhsS1plL1J3aXErUFltaFJIYU1XRWkyOENRblU4T0VtdG9lMnpoS1FtdTVXWStyVHh5ZkpyZFBJeVZwWUtlc1h0M1QrUG5tbGJwcFZ6V0xadWRiNnR3cFc5VjYwWkNrTjZrNG9SQnhmOS9FQTZvS0RVN3pkU2IiLCJtYWMiOiJlODczYWQxMWE1MzIxMDRlMjEyZDE2ZjU2NmI4OTE3Y2QwNWExYTNiNWI5YTJiYmNlOGY0NTEyNTE4NTM4NzNmIiwidGFnIjoiIn0%3D; "
    "auth._token.laravelSanctum=true; auth.strategy=laravelSanctum; auth.redirect=%2Fschedules%2Fschedule-class%2F; auth._token_expiration.laravelSanctum=false"
)

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "Cookie": cookies,
    "Origin": "https://usuarios.lcnidiomas.edu.co",
    "Referer": "https://usuarios.lcnidiomas.edu.co/",
    "X-XSRF-TOKEN": unquote("eyJpdiI6Ik9OSi9XWTdZSitBU0ZvR0IzSnZkYUE9PSIsInZhbHVlIjoiZGdQMjBZU0UyMWhkRzhuYjkzZ3ZiaDIzQnZaVVNHVHNYbW9ya3RPSjVsZ3BjY0gxMnkxbjkvUnNaNU5OVXRTVWZwL0NCWU82ejdVYUo5RmFLOVRmaUhZd3RuVGFDN21yVmlGSXJDeityY3cxYnZkZVl1UkZkQkNaMXNpN1dQaWQiLCJtYWMiOiI1NDY2ZDU5M2MyNzJiNGY5NGEwMTMwOWJiY2MzODkzMWU4Y2I1ZWQ2MWE2OGY5YzIwZjkxZTdlMTUzOTVjZmRhIiwidGFnIjoiIn0%3D")
}

context = ssl._create_unverified_context()

def get_api(path):
    url = f"https://api.lcnidiomas.edu.co/api{path}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=context) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return {"error": str(e)}

print("=== Checking validate-class-type-quiz ===")
quiz_val = get_api("/schedules/booking/validate-class-type-quiz/21960")
print(json.dumps(quiz_val, indent=2))

# Attempt booking for class ID 540535
payload = {
    "creator_user_id": 22639,
    "third_party_id": 25083,
    "headquarter_id": 2, # Unicentro
    "enrollment_id": 21960,
    "class_type_id": 1, # Clase
    "course_group_id": 1,
    "start_date": "2026-06-17 19:30:00",
    "end_date": "2026-06-17 21:00:00",
    "start_hour": 1170,
    "end_hour": 1260,
    "duration": 90
}

url_book = "https://api.lcnidiomas.edu.co/api/schedules/store-class-schedule/48"
req_book = urllib.request.Request(url_book, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")

try:
    print("\nAttempting to book tomorrow's class 540535...")
    with urllib.request.urlopen(req_book, context=context) as response:
        res = json.loads(response.read().decode('utf-8'))
        print("Status:", response.status)
        print("SUCCESS:", json.dumps(res, indent=2))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    try:
        err_res = json.loads(e.read().decode('utf-8'))
        print("Error Message:", err_res.get("message"))
        print("Full Error Response:", json.dumps(err_res, indent=2))
    except Exception as re:
        print("Failed to read error body:", re)
except Exception as e:
    print("Error:", e)
