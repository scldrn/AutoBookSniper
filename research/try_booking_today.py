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

# Slots to check (future slots today, local time 09:35 AM onwards)
future_slots = [
    ("10:30 AM", 630),
    ("12:00 PM", 720),
    ("3:00 PM", 900),
    ("4:30 PM", 990),
    ("6:00 PM", 1080),
    ("7:30 PM", 1170)
]

def minutes_to_time(minutes):
    h = minutes // 60
    m = minutes % 60
    return f"{h:02d}:{m:02d}:00"

def try_book(sched_item):
    print(f"\n---> Attempting to book schedule ID: {sched_item['id']} at Unicentro...")
    
    # We update third_party_id and enrollment_id as done in the frontend
    sched_item["third_party_id"] = 25083
    sched_item["enrollment_id"] = 21960
    
    # Let's construct the store payload.
    # hoursRange = 48 (default for active students)
    # The payload is placed inside the body as 'data' key?
    # Wait, in chunk 276: l.a.post("/schedules/store-class-schedule/".concat(r), data)
    # where M.data = sched_item, so the body is just the data object!
    # Wait, yes! storeClassSchedule: storeClassSchedule(t, e) { var r = e.hoursRange, data = e.data; ... post("/schedules/store-class-schedule/" + r, data) }
    # So the payload we POST is just the data object (sched_item)!
    
    url = "https://api.lcnidiomas.edu.co/api/schedules/store-class-schedule/48"
    req = urllib.request.Request(url, data=json.dumps(sched_item).encode('utf-8'), headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(req, context=context) as response:
            res_body = json.loads(response.read().decode('utf-8'))
            print("Status:", response.status)
            print("Response:", json.dumps(res_body, indent=2))
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code)
        try:
            err_body = e.read().decode('utf-8')
            print("Error Response Body:", err_body)
        except Exception as read_err:
            print("Failed to read error body:", read_err)
    except Exception as e:
        print("General Error booking:", e)

for t_str, start_min in future_slots:
    print(f"\n================= Checking slot {t_str} =================")
    end_min = start_min + 90
    start_time_str = minutes_to_time(start_min)
    end_time_str = minutes_to_time(end_min)
    
    payload = {
        "hoursRange": 48,
        "data": {
            "creator_user_id": 22639,
            "third_party_id": 25083,
            "headquarter_id": 2,
            "enrollment_id": 21960,
            "class_type_id": 1,
            "course_group_id": 1,
            "start_date": f"2026-06-16 {start_time_str}",
            "end_date": f"2026-06-16 {end_time_str}",
            "start_hour": start_min,
            "end_hour": end_min,
            "duration": 90
        }
    }
    
    url = "https://api.lcnidiomas.edu.co/api/schedules/suggest-class-schedule"
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
    
    try:
        with urllib.request.urlopen(req, context=context) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            suggestions = res_data.get("data", [])
            unicentro_suggestions = [s for s in suggestions if s.get("headquarter_id") == 2]
            
            if not unicentro_suggestions:
                print(f"No classes found at Unicentro for {t_str}")
            else:
                print(f"Found {len(unicentro_suggestions)} classes at Unicentro for {t_str}:")
                for s in unicentro_suggestions:
                    print(f"  - Class ID {s['id']} | Level: {s['course_level_group_name']} | Room: {s.get('classroom_name')} | Reserved: {s['reserved']}/{s['max_student']}")
                    try_book(s)
    except Exception as e:
        print(f"Error checking {t_str}: {e}")
