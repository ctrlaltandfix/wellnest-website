#!/usr/bin/env python3
"""Put the design overrides (tools/features-polish.css for the homepage section under
the hero, tools/pricing-polish.css for the pricing page) into the stylesheet the
pages load. Re-runnable: each block replaces its earlier copy."""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOCKS = [("features-polish.css", "hb-features-polish"), ("pricing-polish.css", "wp-pricing-polish")]
index = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
for rel in sorted(set(re.findall(r'assets/index[^"/]*\.css', index))):
    p = os.path.join(ROOT, rel)
    s = open(p, encoding="utf-8").read()
    for name, marker in BLOCKS:
        block = open(os.path.join(ROOT, "tools", name), encoding="utf-8").read().strip()
        s = re.sub(r"\n?/\* %s:start[\s\S]*?%s:end \*/\n?" % (marker, marker), "\n", s)
        s = s.rstrip("\n") + "\n" + block + "\n"
    open(p, "w", encoding="utf-8").write(s)
    print("updated", rel)
