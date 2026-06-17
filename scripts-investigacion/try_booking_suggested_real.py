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

# We query for Sede Unicentro (ID: 2), June 17, 2026 at 10:30 AM (starts at 630 mins)
payload = {
    "hoursRange": 48,
    "data": {
        "creator_user_id": 22639,
        "third_party_id": 25083,
        "headquarter_id": 2,
        "enrollment_id": 21960,
        "class_type_id": 1,
        "course_group_id": 1,
        "start_date": "2026-06-17 10:30:00",
        "end_date": "2026-06-17 12:00:00",
        "start_hour": 630,
        "end_hour": 720,
        "duration": 90
    }
}

url_suggest = "https://api.lcnidiomas.edu.co/api/schedules/suggest-class-schedule"
req_suggest = urllib.request.Request(url_suggest, data=json.dumps(payload).encode('utf-8'), headers=headers)

try:
    with urllib.request.urlopen(req_suggest, context=context) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        suggestions = res_data.get("data", [])
        unicentro_suggestions = [s for s in suggestions if s.get("headquarter_id") == 2 and s.get("class_type_id") == 1]
        
        if not unicentro_suggestions:
            print("No suggestions found for Unicentro at 10:30 AM tomorrow.")
        else:
            print(f"Found {len(unicentro_suggestions)} suggestion(s):")
            target_item = unicentro_suggestions[0]
            print(json.dumps(target_item, indent=2))
            
            # Setup for booking
            target_item["third_party_id"] = 25083
            target_item["enrollment_id"] = 21960
            
            # Post to store-class-schedule
            url_book = "https://api.lcnidiomas.edu.co/api/schedules/store-class-schedule/48"
            req_book = urllib.request.Request(url_book, data=json.dumps(target_item).encode('utf-8'), headers=headers, method="POST")
            
            print("\nAttempting to book...")
            with urllib.request.urlopen(req_book, context=context) as response_book:
                res_book = json.loads(response_book.read().decode('utf-8'))
                print("Status:", response_book.status)
                print("Response:", json.dumps(res_book, indent=2))
                
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    try:
        print("Body:", e.read().decode('utf-8'))
    except Exception as re:
        print("Failed to read body:", re)
except Exception as e:
    print("Error:", e)
