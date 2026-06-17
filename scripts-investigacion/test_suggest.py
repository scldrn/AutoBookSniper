import urllib.request
import ssl
import json
from urllib.parse import unquote

cookies = (
    "XSRF-TOKEN=eyJpdiI6ImNOUzBzMGNnM2NjT2lpRGNSdWxOdEE9PSIsInZhbHVlIjoiSW1DNGhuUE81OHVmV2huczFiY3VZeVZxOHpidnJOWjBhQWFZTFNEQmRPd2R2QkFxVkE3NU9iNm16UHZXdmx0QUY2M0swa1dvZlRkcGhMRkVIaTBROFBZUlNZNWdIc01wYVBFZHF6VTU0MVgySzVqNmxrdi9NbGltQnhQa2FsenIiLCJtYWMiOiIyM2M1YmQwMzRmZWFkYjRiNGY4YzgxNWYwYTIwOWM1YTk5ZWMyNDI5YzE4MGZlNzBiNTdjYjY1NTc4ZmM1ODQ1IiwidGFnIjoiIn0%3D; "
    "lcn_idiomas_session=eyJpdiI6IldiV1kxejg5UEtIeVlJaE5Ub0dYRFE9PSIsInZhbHVlIjoiVmx6cW9GL3d4NEVDWlRDOTRvNy80aFQ2bDVKNXpMcW1EQWYrYUV5THkvdUxSRVRjcWpIbXkyNWdZTjcvVzJ1SlA3WFh6SGJSMzVFWDM0WFRWZGlpcnkrQ2ZxT2hpYi81aGZSWHYwZnk3VEcxUXhqYWkrTkQ4bFVvWlZGQTZrTUwiLCJtYWMiOiJjN2Q5NmRjY2RmODY2YjYxOTQ1ZDllOTdjZmMyOWVhZDNiNzVkNTRhMjM5ODNhNWVhOWJhMDFlMGYxN2MxNjBjIiwidGFnIjoiIn0%3D; "
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
    "X-XSRF-TOKEN": unquote("eyJpdiI6ImNOUzBzMGNnM2NjT2lpRGNSdWxOdEE9PSIsInZhbHVlIjoiSW1DNGhuUE81OHVmV2huczFiY3VZeVZxOHpidnJOWjBhQWFZTFNEQmRPd2R2QkFxVkE3NU9iNm16UHZXdmx0QUY2M0swa1dvZlRkcGhMRkVIaTBROFBZUlNZNWdIc01wYVBFZHF6VTU0MVgySzVqNmxrdi9NbGltQnhQa2FsenIiLCJtYWMiOiIyM2M1YmQwMzRmZWFkYjRiNGY4YzgxNWYwYTIwOWM1YTk5ZWMyNDI5YzE4MGZlNzBiNTdjYjY1NTc4ZmM1ODQ1IiwidGFnIjoiIn0%3D")
}

context = ssl._create_unverified_context()

# We will query for Sede Unicentro (ID: 2), June 16, 2026
# Let's check times. We'll start with 6:00 AM as a base check
payload = {
    "hoursRange": 48,
    "data": {
        "creator_user_id": 22639,
        "third_party_id": 25083,
        "headquarter_id": 2,
        "enrollment_id": 21960,
        "class_type_id": 1,
        "course_group_id": 1,
        "start_date": "2026-06-16 06:00:00",
        "end_date": "2026-06-16 07:30:00",
        "start_hour": 360,
        "end_hour": 450,
        "duration": 90
    }
}

url = "https://api.lcnidiomas.edu.co/api/schedules/suggest-class-schedule"
req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)

try:
    with urllib.request.urlopen(req, context=context) as response:
        print("Status:", response.status)
        res_data = json.loads(response.read().decode('utf-8'))
        print("Response:")
        print(json.dumps(res_data, indent=2))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
