import os
import re

TARGET_DIR = "."
PATTERNS = [
    (r'=["\']\/([^"\']+)["\']', r'="./\1"'),  # src="/path" or href="/path"
    (r'\(\/([^\/][^)]+)\)', r'(./\1)'),       # url(/path)
    (r'url\(["\']?\/([^"\')]+)["\']?\)', r'url(./\1)'),  # CSS url("/path") or url('/path')
]

def patch_file(path):
    try:
        text = open(path, "r", encoding="utf-8", errors="ignore").read()
    except:
        return

    patched = text
    for pattern, repl in PATTERNS:
        patched = re.sub(pattern, repl, patched)

    if patched != text:
        with open(path, "w", encoding="utf-8") as f:
            f.write(patched)
        print("Patched:", path)
    else:
        print("Unchanged:", path)

def patch_all(dirpath):
    for root, _, files in os.walk(dirpath):
        for file in files:
            if file.lower().endswith((".html", ".css", ".js")):
                patch_file(os.path.join(root, file))

if __name__ == "__main__":
    print("Starting patch …")
    patch_all(TARGET_DIR)
    print("Done.")
