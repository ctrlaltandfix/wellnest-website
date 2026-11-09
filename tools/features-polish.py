#!/usr/bin/env python3
"""Put tools/features-polish.css into the stylesheet the pages load (re-runnable)."""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
block = open(os.path.join(ROOT, "tools", "features-polish.css"), encoding="utf-8").read().strip()
index = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
for rel in sorted(set(re.findall(r'assets/index[^"/]*\.css', index))):
    p = os.path.join(ROOT, rel)
    s = open(p, encoding="utf-8").read()
    s = re.sub(r"\n?/\* hb-features-polish:start[\s\S]*?hb-features-polish:end \*/\n?", "\n", s)
    open(p, "w", encoding="utf-8").write(s.rstrip("\n") + "\n" + block + "\n")
    print("updated", rel)
