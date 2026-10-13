"""Screenshot the Handoff Table prototype at stage progress points.

Usage: python shoot.py PAGE OUT_DIR --executable CHROMIUM
"""

import argparse
import pathlib

from playwright.sync_api import sync_playwright

POINTS = [0.05, 0.22, 0.42, 0.62, 0.78, 0.97]
VIEWPORTS = {"desktop": (1440, 900), "mobile": (390, 844)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("page", type=pathlib.Path)
    parser.add_argument("out", type=pathlib.Path)
    parser.add_argument("--executable")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.executable)
        for label, (width, height) in VIEWPORTS.items():
            page = browser.new_page(viewport={"width": width, "height": height})
            page.goto(args.page.resolve().as_uri(), wait_until="networkidle")
            for point in POINTS:
                page.evaluate(
                    """(p) => { const ex = document.querySelector('.exchange');
                    const top = ex.offsetTop, len = ex.offsetHeight - innerHeight;
                    window.scrollTo(0, top + len * p); }""",
                    point,
                )
                page.wait_for_timeout(500)
                page.screenshot(path=str(args.out / f"{label}-{int(point * 100):02d}.png"))
            page.close()
        for label, (width, height) in VIEWPORTS.items():
            page = browser.new_page(viewport={"width": width, "height": height}, reduced_motion="reduce")
            page.goto(args.page.resolve().as_uri(), wait_until="networkidle")
            page.screenshot(path=str(args.out / f"reduced-{label}.png"), full_page=True)
            page.close()
        browser.close()


if __name__ == "__main__":
    main()
