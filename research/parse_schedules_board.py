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
    "Cookie": cookies,
    "Origin": "https://usuarios.lcnidiomas.edu.co",
    "Referer": "https://usuarios.lcnidiomas.edu.co/",
    "X-XSRF-TOKEN": unquote("eyJpdiI6ImNOUzBzMGNnM2NjT2lpRGNSdWxOdEE9PSIsInZhbHVlIjoiSW1DNGhuUE81OHVmV2huczFiY3VZeVZxOHpidnJOWjBhQWFZTFNEQmRPd2R2QkFxVkE3NU9iNm16UHZXdmx0QUY2M0swa1dvZlRkcGhMRkVIaTBROFBZUlNZNWdIc01wYVBFZHF6VTU0MVgySzVqNmxrdi9NbGltQnhQa2FsenIiLCJtYWMiOiIyM2M1YmQwMzRmZWFkYjRiNGY4YzgxNWYwYTIwOWM1YTk5ZWMyNDI5YzE4MGZlNzBiNTdjYjY1NTc4ZmM1ODQ1IiwidGFnIjoiIn0%3D")
}

context = ssl._create_unverified_context()

def try_book(sched_item, date_label):
    print(f"\n---> Attempting to book schedule ID: {sched_item['id']} at Unicentro for {date_label}...")
    
    # Payload format expected by store-class-schedule
    # The fields should match the ones in our suggestions
    payload = {
        "creator_user_id": 22639,
        "third_party_id": 25083,
        "headquarter_id": 2, # Unicentro
        "enrollment_id": 21960,
        "class_type_id": 1, # Clase
        "course_group_id": 1,
        "start_date": sched_item["start_date"],
        "end_date": sched_item["end_date"],
        "start_hour": sched_item["start_hour"],
        "end_hour": sched_item["end_hour"],
        "duration": sched_item["duration"]
    }
    
    # Also attach other details if needed, let's look at the suggestion keys and keep them
    # For good measure, we can merge with sched_item
    for k, v in sched_item.items():
        if k not in payload:
            payload[k] = v
            
    payload["third_party_id"] = 25083
    payload["enrollment_id"] = 21960
    payload["class_type_id"] = 1
    
    url = "https://api.lcnidiomas.edu.co/api/schedules/store-class-schedule/48"
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, context=context) as response:
            res_body = json.loads(response.read().decode('utf-8'))
            print("Status:", response.status)
            print("Response:", json.dumps(res_body, indent=2))
            return True
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code)
        try:
            err_body = e.read().decode('utf-8')
            print("Error Response:", err_body)
        except Exception as read_err:
            print("Failed to read error body:", read_err)
        return False
    except Exception as e:
        print("General Error booking:", e)
        return False

# Fetch all schedules between June 16 and June 18
url = "https://api.lcnidiomas.edu.co/api/schedules/between-dates/2/70/2026-06-16/2026-06-18?teachers=%5B%5D"
req = urllib.request.Request(url, headers=headers)

try:
    with urllib.request.urlopen(req, context=context) as response:
        res = json.loads(response.read().decode('utf-8'))
        schedules = res.get("data", [])
        print(f"Total schedules found on board: {len(schedules)}")
        
        # Filter for A2 (the user's level) and Clase (class_type_id == 1)
        # Sede Unicentro is headquarter_id 2
        # Let's inspect the keys
        target_schedules = []
        for s in schedules:
            lvl = s.get("course_level_group_name", "")
            type_id = s.get("class_type_id")
            
            # Level matching: Level name A2, or level group containing A2.
            # Let's check:
            if lvl == "A2" and type_id == 1:
                target_schedules.append(s)
        
        print(f"Found {len(target_schedules)} English A2 Classes:")
        for ts in target_schedules:
            print(f"- ID: {ts['id']} | Date: {ts['start_date']} to {ts['end_date']} | Reserved: {ts['reserved']}/{ts['max_student']}")
            
        # Separate into today, tomorrow, and day after tomorrow
        # Current Bogota time: 2026-06-16 09:48:00
        # Only try to book if start_date is in the allowed range:
        # e.g., start_date > '2026-06-16 09:49:00'
        # Let's filter and sort target_schedules by start_date
        target_schedules.sort(key=lambda x: x["start_date"])
        
        for ts in target_schedules:
            start_dt = ts["start_date"]
            if start_dt >= "2026-06-16 09:49:00":
                # Let's attempt to book it!
                success = try_book(ts, start_dt)
                if success:
                    print(f"-> Successful booking for {start_dt}!")
            else:
                print(f"Skipping past class: {start_dt}")
                
except Exception as e:
    print("Error:", e)
