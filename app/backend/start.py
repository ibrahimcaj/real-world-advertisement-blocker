#!/usr/bin/env python3
import hashlib, os, subprocess, sys

DIR = os.path.dirname(os.path.abspath(__file__))
REQ   = os.path.join(DIR, "requirements.txt")
STAMP = os.path.join(DIR, ".req_hash")

h = hashlib.md5(open(REQ, "rb").read()).hexdigest()
cached = open(STAMP).read().strip() if os.path.exists(STAMP) else ""

if h != cached:
    print("[backend] requirements changed, installing...")
    r = subprocess.run([sys.executable, "-m", "pip", "install", "-r", REQ])
    if r.returncode != 0:
        sys.exit("[backend] pip install failed")
    open(STAMP, "w").write(h)
    print("[backend] done")
else:
    print("[backend] requirements up to date, skipping install")

# replace this process with the server — equivalent to running server.py directly
os.chdir(DIR)
os.execv(sys.executable, [sys.executable, os.path.join(DIR, "server.py")])
