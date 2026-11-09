#!/usr/bin/env python3
"""Smaller copies of the site's large PNG/JPEG images, for faster pages.

Writes x.webp next to each large image in imported/ and landing/ (originals are
kept). The Worker (cloudflare/worker.js) sends the .webp copy at the image's
normal address to browsers that accept WebP, so no page or app reference
changes. Re-run after adding images; existing up-to-date copies are skipped.

Usage: python3 tools/optimize-images.py [repo-root]
"""
import pathlib, sys
from PIL import Image

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
MIN_BYTES = 60_000          # smaller files aren't worth a second copy
MAX_WIDTH = 2048
# Images only ever shown small (px wide on screen ≤ ~180): keep them small.
SMALL = {"5b8791d9c9-560935dfd_ChatGPTImageFeb82026at07_05_31PM.png": 512}

saved = 0
for path in sorted(list(ROOT.glob("imported/*")) + list(ROOT.glob("landing/*"))):
    if path.suffix.lower() not in (".png", ".jpg", ".jpeg") or path.stat().st_size < MIN_BYTES:
        continue
    out = path.with_suffix(".webp")
    if out.exists() and out.stat().st_mtime >= path.stat().st_mtime:
        continue
    im = Image.open(path)
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
    width = min(SMALL.get(path.name, MAX_WIDTH), im.width)
    if width < im.width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(out, "WEBP", quality=82, method=6)
    # Keep the copy only if it's clearly smaller.
    if out.stat().st_size > path.stat().st_size * 0.8:
        out.unlink()
        continue
    saved += path.stat().st_size - out.stat().st_size
    print(f"{path.relative_to(ROOT)}: {path.stat().st_size // 1024} KB -> {out.stat().st_size // 1024} KB")
print(f"saved {saved // 1024} KB per full set of views")
