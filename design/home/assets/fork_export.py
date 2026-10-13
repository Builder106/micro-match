"""Export each scroll asset's Lottie through the Glaxnimate fork.

Writes <slug>.rawr (editable project) and <slug>.interactive.svg, a seekable
SVG whose player starts only from JavaScript. The page drives it with
glaxnimatePlayer.seek().

Run inside the fork's build image:
    PYTHONPATH=/build/bin/plugin/python/build/lib python3 fork_export.py OUT_DIR
"""

import pathlib
import sys

import glaxnimate


def main():
    out = pathlib.Path(sys.argv[1])
    with glaxnimate.environment.Headless():
        registry = glaxnimate.io.registry
        export = glaxnimate.io.Direction.Export
        lottie = registry.from_slug("lottie", glaxnimate.io.Direction.Import)
        for folder in sorted(path for path in out.iterdir() if path.is_dir()):
            slug = folder.name
            document = glaxnimate.model.Document()
            if not lottie.load(document, (folder / "animation.json").read_bytes()):
                raise SystemExit(f"{slug}: Lottie import failed")
            composition = document.assets.compositions.values[0]
            outputs = {
                f"{slug}.rawr": ("glaxnimate", {}),
                f"{slug}.interactive.svg": ("svg_interactive", {
                    "trigger": "programmatic", "iterations": 1, "root_id": f"mm-{slug}",
                }),
            }
            for name, (fmt, settings) in outputs.items():
                data = registry.from_slug(fmt, export).save(composition, settings, name)
                if not data:
                    raise SystemExit(f"{slug}: {fmt} export failed")
                (folder / name).write_bytes(bytes(data))
            print(f"{slug}: exported")


if __name__ == "__main__":
    main()
