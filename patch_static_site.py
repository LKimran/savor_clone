import os
import re

TARGET_DIR = "site_copy"

# patterns to convert:  /xxx  →  ./xxx
patterns = [
    r'="/([^"]+)"',          # HTML: src="/path"
    r"='/([^']+)'",          # HTML: src='/path'
    r'\((/[^)]+)\)',         # CSS background: url(/path)
    r'url\(/([^/][^)]+)\)',  # CSS url(/asset)
]

def convert_absolute_to_relative(content):
    # Replace /something → ./something
    content = re.sub(r'="/([^"]+)"', r'="./\1"', content)
    content = re.sub(r"='/([^']+)'", r"='./\1'", content)
    content = re.sub(r'\((/[^)]+)\)', r'(./\1)', content)
    content = re.sub(r'url\(/([^/][^)]+)\)', r'url(./\1)', content)
    return content

def patch_file(path):
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        patched = convert_absolute_to_relative(content)

        if patched != content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(patched)
            print("Patched:", path)
        else:
            print("OK:", path)
    except:
        pass

def patch_folder(folder):
    for root, _, files in os.walk(folder):
        for filename in files:
            if filename.lower().endswith((".html", ".css", ".js")):
                patch_file(os.path.join(root, filename))

if __name__ == "__main__":
    print("\n--- Starting Patch ---\n")
    patch_folder(TARGET_DIR)
    print("\n--- Finished Successfully ---")
