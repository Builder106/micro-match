"""Record a user-like session on the prototype: wheel scroll, pauses, reverse, keyboard, hover.

Usage: python record_interaction.py PAGE OUT_DIR --executable CHROMIUM
"""

import argparse
import pathlib
import shutil

from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("page", type=pathlib.Path)
    parser.add_argument("out", type=pathlib.Path)
    parser.add_argument("--executable")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.executable)
        context = browser.new_context(viewport={"width": 1440, "height": 900},
                                      record_video_dir=str(args.out / ".tmp"), record_video_size={"width": 1440, "height": 900})
        page = context.new_page()
        page.goto(args.page.resolve().as_uri(), wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.mouse.move(720, 450)
        for burst in range(6):
            for _ in range(8):
                page.mouse.wheel(0, 110)
                page.wait_for_timeout(90)
            page.wait_for_timeout(900)
        for _ in range(20):
            page.mouse.wheel(0, 110)
            page.wait_for_timeout(90)
        page.wait_for_timeout(1000)
        for selector in (".pile li:nth-child(2) a", ".door.find", ".door.post"):
            page.hover(selector)
            page.wait_for_timeout(700)
        for _ in range(30):
            page.mouse.wheel(0, -160)
            page.wait_for_timeout(70)
        page.wait_for_timeout(800)
        page.keyboard.press("Tab")
        page.wait_for_timeout(700)
        page.keyboard.press("Enter")
        page.wait_for_timeout(1200)
        for _ in range(4):
            page.keyboard.press("Tab")
            page.wait_for_timeout(600)
        page.keyboard.press("Home")
        page.wait_for_timeout(1200)
        video = page.video.path()
        context.close()
        browser.close()
        shutil.move(video, args.out / "interaction-desktop.webm")
        shutil.rmtree(args.out / ".tmp", ignore_errors=True)


if __name__ == "__main__":
    main()
