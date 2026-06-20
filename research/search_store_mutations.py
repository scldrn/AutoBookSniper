with open("js_0ac8a03.js", "r", encoding="utf-8") as f:
    content = f.read()

import re

# We look for something like: languagesStudentOptions or getLanguagesStudentOptions or similar in store definition
matches = list(re.finditer("languagesStudentOptions", content))
print(f"Total occurrences: {len(matches)}")

for m in matches:
    # Print occurrences in the range of the Vuex store definitions (usually near other getters/mutations)
    # Let's inspect context of each match
    start = max(0, m.start() - 150)
    end = min(len(content), m.end() + 150)
    snippet = content[start:end].replace('\n', ' ')
    # Check if the snippet contains store keywords like 'state', 'commit', 'dispatch', 'get', 'post', '/api/'
    if any(x in snippet for x in ["commit", "dispatch", "get(", "post(", "api"]):
        print(f"[{m.start()}]: {snippet}")
