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

dates = ["2026-06-17", "2026-06-18"]
times_str = ["6:00 AM", "7:30 AM", "9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", "3:00 PM", "4:30 PM", "6:00 PM", "7:30 PM"]

def time_to_minutes(t_str):
    parts = t_str.split(" ")
    time_part = parts[0]
    ampm = parts[1]
    h, m = map(int, time_part.split(":"))
    if ampm == "PM" and h != 12:
        h += 12
    if ampm == "AM" and h == 12:
        h = 0
    return h * 60 + m

def minutes_to_time(minutes):
    h = minutes // 60
    m = minutes % 60
    return f"{h:02d}:{m:02d}:00"

def try_book(sched_item, day_label):
    print(f"\n---> Attempting to book schedule ID: {sched_item['id']} for {day_label}...")
    sched_item["third_party_id"] = 25083
    sched_item["enrollment_id"] = 21960
    
    url = "https://api.lcnidiomas.edu.co/api/schedules/store-class-schedule/48"
    req = urllib.request.Request(url, data=json.dumps(sched_item).encode('utf-8'), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, context=context) as response:
            res_body = json.loads(response.read().decode('utf-8'))
            print("Status:", response.status)
            print("Response:", json.dumps(res_body, indent=2))
            return True, res_body
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code)
        try:
            err_body = e.read().decode('utf-8')
            print("Error Response Body:", err_body)
            return False, err_body
        except Exception as read_err:
            return False, str(read_err)
    except Exception as e:
        print("General Error booking:", e)
        return False, str(e)

found_classes = []

for day in dates:
    print(f"\n================= Scanning all slots for {day} =================")
    for t_str in times_str:
        start_min = time_to_minutes(t_str)
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
                "start_date": f"{day} {start_time_str}",
                "end_date": f"{day} {end_time_str}",
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
                unicentro_suggestions = [s for s in suggestions if s.get("headquarter_id") == 2 and s.get("class_type_id") == 1]
                
                for s in unicentro_suggestions:
                    # Deduplicate suggestions by schedule ID
                    if s["id"] not in [x["id"] for x in found_classes]:
                        found_classes.append(s)
                        print(f"[{day} {t_str}] Found Class ID {s['id']} | Date: {s.get('start_date')} | Room: {s.get('classroom_name')} | Reserved: {s['reserved']}/{s['max_student']}")
                        success, res = try_book(s, day)
                        if success:
                            print(f"SUCCESS: Class {s['id']} booked successfully!")
        except Exception as e:
            pass

print(f"\nDone! Found and processed {len(found_classes)} unique classes.")
