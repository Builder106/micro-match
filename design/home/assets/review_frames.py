"""Render each asset's SMIL output at chosen fractions on light and dark tables.

Usage: python review_frames.py OUT_DIR SHEET.png --executable CHROMIUM [--at 0.25,0.5,1]
"""

import argparse
import pathlib

from playwright.sync_api import sync_playwright

TABLES = {"light": "#F5F0E8", "dark": "#1E293B"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("out", type=pathlib.Path)
    parser.add_argument("sheet", type=pathlib.Path)
    parser.add_argument("--executable")
    parser.add_argument("--at", default="1")
    args = parser.parse_args()
    fractions = [float(v) for v in args.at.split(",")]
    assets = sorted(p for p in args.out.resolve().iterdir() if (p / "smil.svg").exists())
    cells = []
    for asset in assets:
        for table, color in TABLES.items():
            for f in fractions:
                cells.append(
                    f'<figure style="background:{color}"><object data="{(asset / "smil.svg").as_uri()}" '
                    f'data-at="{f}" type="image/svg+xml"></object><figcaption>{asset.name} {table} {f}</figcaption></figure>'
                )
    columns = len(TABLES) * len(fractions)
    html = f"""<!doctype html><style>
      body {{ margin: 0; font: 11px Inter, sans-serif; display: grid; grid-template-columns: repeat({columns}, 220px); }}
      figure {{ margin: 0; height: 220px; display: grid; place-items: center; position: relative; }}
      object {{ width: 190px; height: 170px; }}
      figcaption {{ position: absolute; bottom: 4px; left: 6px; color: #888; }}
    </style>{''.join(cells)}"""
    page_path = args.out.resolve() / "review.html"
    page_path.write_text(html)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.executable, args=["--allow-file-access-from-files"])
        page = browser.new_page(viewport={"width": 220 * columns, "height": 800})
        page.goto(page_path.as_uri(), wait_until="load")
        page.wait_for_timeout(800)
        page.evaluate("""() => { for (const o of document.querySelectorAll('object')) {
            const svg = o.contentDocument && o.contentDocument.documentElement;
            if (!svg || !svg.pauseAnimations) continue;
            svg.pauseAnimations(); svg.setCurrentTime(Math.min(+o.dataset.at, 0.9999)); } }""")
        page.wait_for_timeout(300)
        page.screenshot(path=str(args.sheet), full_page=True)
        browser.close()


if __name__ == "__main__":
    main()
