"""Inline the Glaxnimate assets into the Handoff Table prototype.

Usage: python assemble.py TEMPLATE.html ASSETS_OUT_DIR RESULT.html

Live slots get the fork's interactive SVGs, which the page seeks with scroll.
Storyboard slots, shown under reduced motion, get static final frames.
"""

import base64
import json
import re
import sys
from pathlib import Path

from glaxnimate_mcp.static import export_static

TASK_MINUTES = 15
DIAL_MINUTES = 30
LIVE = {
    "ink-stamp": ["ink-stamp-posted", "ink-stamp-approved"],
    "verified-seal": ["verified-seal"],
    "time-lanes": ["time-lanes"],
    "minute-dial": ["minute-dial"],
    "work-vignettes": ["vignette-translate"],
    "proof-clip": ["proof-clip"],
    "badge-press": ["badge-press"],
}
STORYBOARD = ["ink-stamp-posted", "time-lanes", "minute-dial", "proof-clip", "ink-stamp-approved", "badge-press"]


def inline_svg(path):
    text = path.read_text()
    text = re.sub(r"<\?xml[^>]*\?>", "", text)
    text = re.sub(r"<!DOCTYPE[^>]*>", "", text)
    text = re.sub(r"<metadata>.*?</metadata>", "", text, flags=re.S)
    text = re.sub(r"<sodipodi:namedview[^>]*/>", "", text)
    return text.strip()


def still(assets, slug):
    if slug == "minute-dial":
        motion = json.loads((assets / slug / "motion.json").read_text())
        frame = export_static((assets / slug / "source.svg").read_text(), animations=motion["tracks"],
                              time_ms=motion["duration_ms"] * TASK_MINUTES / DIAL_MINUTES, minify_ids=True)["svg"]
    else:
        frame = (assets / slug / "fallback.svg").read_text()
    data = base64.b64encode(frame.encode()).decode()
    return f'<img alt="" src="data:image/svg+xml;base64,{data}">'


def main():
    template, assets, result = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    html = template.read_text()
    for slot, slugs in LIVE.items():
        empty = f'<div class="slot" data-asset="{slot}" data-progress="0.00" aria-hidden="true"></div>'
        if empty not in html:
            raise SystemExit(f"slot {slot} not found")
        svgs = "".join(inline_svg(assets / slug / f"{slug}.interactive.svg") for slug in slugs)
        html = html.replace(empty, f'<div class="slot filled" data-asset="{slot}" data-progress="0.00" aria-hidden="true">{svgs}</div>')
    stills = iter(STORYBOARD)

    def fill_still(match):
        return f'<div class="slot still filled" data-asset="{match.group(1)}" data-progress="final" aria-hidden="true">{still(assets, next(stills))}</div>'

    html, count = re.subn(r'<div class="slot still" data-asset="([\w-]+)" data-progress="final" aria-hidden="true"></div>', fill_still, html)
    if count != len(STORYBOARD):
        raise SystemExit(f"expected {len(STORYBOARD)} storyboard slots, found {count}")
    result.write_text(html)
    print(f"{result}: {len(html) // 1024} KB")


if __name__ == "__main__":
    main()
