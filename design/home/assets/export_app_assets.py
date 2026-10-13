"""Export the Handoff Table assets for the SvelteKit homepage.

Usage: python export_app_assets.py ASSETS_OUT_DIR REPO_ROOT

Writes, for each asset drawn by draw_assets.py:
- src/lib/assets/handoff/<slug>.svg: the SMIL animation, inlined by the page
  and seeked with setCurrentTime(). IDs get a per-asset prefix so several
  assets can share one document.
- static/images/handoff/<slug>.svg: the final frame, for the storyboard
  shown under reduced motion or before JavaScript runs.
- static/images/handoff/minute-dial-<mm>.svg: dial stills for 5 to 30 minutes.

Run with the glaxnimate-mcp-server package on PYTHONPATH.
"""

import json
import re
import sys
from pathlib import Path

from glaxnimate_mcp.static import export_static

ASSETS = [
    "ink-stamp-posted", "ink-stamp-approved", "verified-seal", "time-lanes", "minute-dial",
    "vignette-translate", "vignette-data", "vignette-proofread", "vignette-photos", "proof-clip", "badge-press",
]
DIAL_STEPS = range(5, 31, 5)
DIAL_MINUTES = 30


def prefix_ids(svg, prefix):
    ids = set(re.findall(r'\sid="([^"]+)"', svg))
    for old in sorted(ids, key=len, reverse=True):
        new = f"{prefix}{old}"
        svg = re.sub(rf'(\sid=")({re.escape(old)})(")', rf"\g<1>{new}\g<3>", svg)
        svg = svg.replace(f"url(#{old})", f"url(#{new})").replace(f'href="#{old}"', f'href="#{new}"')
    return svg


def inline_ready(svg, slug):
    svg = re.sub(r"<\?xml[^>]*\?>", "", svg).strip()
    svg = prefix_ids(svg, f"hs-{slug}-")
    for attribute in ("width", "height"):
        svg = re.sub(rf'(<svg\b[^>]*?)\s{attribute}="[^"]*"', r"\1", svg, count=1)
    return svg.replace("<svg ", '<svg aria-hidden="true" focusable="false" ', 1)


def main():
    out, repo = Path(sys.argv[1]), Path(sys.argv[2])
    inline_dir = repo / "src/lib/assets/handoff"
    still_dir = repo / "static/images/handoff"
    inline_dir.mkdir(parents=True, exist_ok=True)
    still_dir.mkdir(parents=True, exist_ok=True)
    for slug in ASSETS:
        (inline_dir / f"{slug}.svg").write_text(inline_ready((out / slug / "smil.svg").read_text(), slug) + "\n")
        (still_dir / f"{slug}.svg").write_text((out / slug / "fallback.svg").read_text() + "\n")
    motion = json.loads((out / "minute-dial" / "motion.json").read_text())
    source = (out / "minute-dial" / "source.svg").read_text()
    for minutes in DIAL_STEPS:
        frame = export_static(source, animations=motion["tracks"], minify_ids=True,
                              time_ms=min(motion["duration_ms"] * minutes / DIAL_MINUTES, motion["duration_ms"]))["svg"]
        (still_dir / f"minute-dial-{minutes:02d}.svg").write_text(frame + "\n")
    print(f"wrote {len(ASSETS)} inline assets and {len(ASSETS) + len(DIAL_STEPS)} stills")


if __name__ == "__main__":
    main()
