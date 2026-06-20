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

print("=== Checking updated schedule info ===")
info = get_api("/getScheduleInfoStudent/25083/21960")
if "success" in info and info["success"]:
    print(f"Level Name: {info['data'].get('level')}")
    print(f"Current Level ID: {info['data'].get('current_level_id')}")
    print(f"Product Modality: {info['data'].get('product')}")
else:
    print("Error:", info)

print("\n=== Checking blocking status ===")
blocking = get_api("/blocking/21960")
print(json.dumps(blocking, indent=2))
