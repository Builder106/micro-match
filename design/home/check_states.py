"""Check each Glaxnimate player's state at exact stage positions, going down and back up.

Usage: python check_states.py PAGE OUT_DIR --executable CHROMIUM
"""

import argparse
import json
import pathlib

from playwright.sync_api import sync_playwright

PATH = [0, 0.1, 0.25, 0.45, 0.65, 0.8, 0.95, 1, 0.8, 0.5, 0.25, 0.1, 0]
VIEWPORTS = {"desktop": (1440, 900), "mobile": (390, 844)}
STATE = """() => Object.fromEntries([...document.querySelectorAll('svg[id^="mm-"]')].map(svg => {
  const player = svg.glaxnimatePlayer;
  const slot = svg.closest('.slot');
  const visible = getComputedStyle(svg).visibility !== 'hidden' && getComputedStyle(slot).opacity !== '0';
  return [svg.id, player ? Math.round(player.currentTime) + (visible ? '' : ' hidden') : 'no player'];
}))"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("page", type=pathlib.Path)
    parser.add_argument("out", type=pathlib.Path)
    parser.add_argument("--executable")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    report = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.executable)
        for label, (width, height) in VIEWPORTS.items():
            page = browser.new_page(viewport={"width": width, "height": height})
            page.goto(args.page.resolve().as_uri(), wait_until="networkidle")
            rows = []
            for i, point in enumerate(PATH):
                page.evaluate("""(p) => { const ex = document.querySelector('.exchange');
                    window.scrollTo(0, ex.offsetTop + (ex.offsetHeight - innerHeight) * p); }""", point)
                page.wait_for_timeout(350)
                rows.append({"p": point, **page.evaluate(STATE)})
                page.screenshot(path=str(args.out / f"{label}-{i:02d}-{int(point * 100):03d}.png"))
            report[label] = rows
            page.close()
        browser.close()
    for label, rows in report.items():
        print(label)
        keys = [k for k in rows[0] if k != "p"]
        print("p     " + " ".join(k.replace("mm-", "")[:13].ljust(13) for k in keys))
        for row in rows:
            print(f"{row['p']:<5} " + " ".join(str(row[k]).ljust(13) for k in keys))
    (args.out / "states.json").write_text(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
