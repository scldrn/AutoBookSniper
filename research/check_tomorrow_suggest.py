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
    "Accept-Language": "en-US,en;q=0.9",
    "Content-Type": "application/json",
    "Cookie": cookies,
    "Origin": "https://usuarios.lcnidiomas.edu.co",
    "Referer": "https://usuarios.lcnidiomas.edu.co/",
    "X-XSRF-TOKEN": unquote("eyJpdiI6Ik9OSi9XWTdZSitBU0ZvR0IzSnZkYUE9PSIsInZhbHVlIjoiZGdQMjBZU0UyMWhkRzhuYjkzZ3ZiaDIzQnZaVVNHVHNYbW9ya3RPSjVsZ3BjY0gxMnkxbjkvUnNaNU5OVXRTVWZwL0NCWU82ejdVYUo5RmFLOVRmaUhZd3RuVGFDN21yVmlGSXJDeityY3cxYnZkZVl1UkZkQkNaMXNpN1dQaWQiLCJtYWMiOiI1NDY2ZDU5M2MyNzJiNGY5NGEwMTMwOWJiY2MzODkzMWU4Y2I1ZWQ2MWE2OGY5YzIwZjkxZTdlMTUzOTVjZmRhIiwidGFnIjoiIn0%3D")
}

context = ssl._create_unverified_context()

payload = {
    "hoursRange": 48,
    "data": {
        "creator_user_id": 22639,
        "third_party_id": 25083,
        "headquarter_id": 2,
        "enrollment_id": 21960,
        "class_type_id": 1,
        "course_group_id": 1,
        "start_date": "2026-06-17 19:30:00",
        "end_date": "2026-06-17 21:00:00",
        "start_hour": 1170,
        "end_hour": 1260,
        "duration": 90
    }
}

url_suggest = "https://api.lcnidiomas.edu.co/api/schedules/suggest-class-schedule"
req_suggest = urllib.request.Request(url_suggest, data=json.dumps(payload).encode('utf-8'), headers=headers)

try:
    with urllib.request.urlopen(req_suggest, context=context) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        suggestions = res_data.get("data", [])
        print("Suggestions returned:", len(suggestions))
        for idx, s in enumerate(suggestions):
            if s.get("headquarter_id") == 2:
                print(f"{idx+1}. ID: {s.get('id')} | Sede: {s.get('headquarter_name')} | Date: {s.get('start_date')} | Reserved: {s.get('reserved')}/{s.get('max_student')}")
except Exception as e:
    print("Error:", e)
