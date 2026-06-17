with open("js_0ac8a03.js", "r", encoding="utf-8") as f:
    js_content = f.read()

import re

keywords = [
    "schedules-schedule-class"
]

print("Searching schedules-schedule-class in router...")

for kw in keywords:
    print(f"\n================= KEYWORD: {kw} =================")
    for match in re.finditer(re.escape(kw), js_content, re.IGNORECASE):
        start = max(0, match.start() - 300)
        end = min(len(js_content), match.end() + 300)
        snippet = js_content[start:end]
        snippet_clean = snippet.replace('\n', ' ').strip()
        print(f"[{match.start()}]: ... {snippet_clean} ...")
