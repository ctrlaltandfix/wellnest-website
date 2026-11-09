#!/usr/bin/env python3
"""Give every app script and stylesheet in assets/ a new name (one-time cache bust).

When wellnest.services ran on Netlify, browsers were told to keep /assets/* for
a year without checking for updates. Renaming the files makes every browser
fetch the current versions. Updates every reference in pages, scripts, styles
and the repo's tools.  Usage: python3 tools/bust-asset-cache.py SUFFIX
"""
import pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SUFFIX = sys.argv[1] if len(sys.argv) > 1 else "wn2"
SKIP = {".git", "node_modules", "netlify", "dist-cloudflare", ".wrangler"}
files = sorted(p for p in (ROOT / "assets").iterdir() if p.suffix in (".js", ".css") and not p.stem.endswith("-" + SUFFIX))
renames = {p.name: f"{p.stem}-{SUFFIX}{p.suffix}" for p in files}
pattern = re.compile(r"(?<=[/\"'`])(" + "|".join(map(re.escape, sorted(renames, key=len, reverse=True))) + r")(?=[\"'`?#)\s]|$)")
changed = 0
for p in ROOT.rglob("*"):
    if not p.is_file() or SKIP & set(p.relative_to(ROOT).parts) or p.suffix not in (".html", ".js", ".mjs", ".css", ".py", ".json", ".xml"):
        continue
    if p.name == "bust-asset-cache.py":
        continue
    t = p.read_text(encoding="utf-8", errors="surrogateescape")
    n = pattern.sub(lambda m: renames[m.group(1)], t)
    if n != t:
        p.write_text(n, encoding="utf-8", errors="surrogateescape")
        changed += 1
for old, new in renames.items():
    subprocess.run(["git", "mv", f"assets/{old}", f"assets/{new}"], cwd=ROOT, check=True)
print(f"renamed {len(renames)} files, updated references in {changed} files")
