with open("js_0ac8a03.js", "r", encoding="utf-8") as f:
    content = f.read()

import re

matches = list(re.finditer("getBlockingEnrollment", content, re.IGNORECASE))
print(f"Found {len(matches)} matches for 'getBlockingEnrollment':")
for m in matches[:10]:
    start = max(0, m.start() - 150)
    end = min(len(content), m.end() + 150)
    snippet = content[start:end].strip().replace('\n', ' ')
    print(f"[{m.start()}]: {snippet}")
