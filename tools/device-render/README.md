# Device renders

Headless Blender product shots of a laptop or a handset with a MicroMatch
screenshot glowing on the screen. Remotion plays the resulting 60-frame
sequence back as a slow sway.

`device.py` holds everything that has to match across projects — render
settings, materials, lighting, camera, the sway loop. `laptop.py` and
`phone.py` add geometry and framing. All three files are kept byte-identical
with the copy in the STAIJA repo; only this README differs.

## Rendering

Nothing here runs on the Mac. Renders happen on `ampere-dev`, which is
CPU-only, so budget hours for a full sequence and check a still first.

```console
STILL=1 DEVICE_TEX=$PWD/../../ui-demo/public/mm_home.png blender -b -P laptop.py
```

That writes `test_still.png` next to the script. Once the framing looks right:

```console
DEVICE_TEX=$PWD/../../ui-demo/public/mm_home.png \
DEVICE_OUT=$PWD/../../ui-demo/public \
DEVICE_PREFIX=mm_laptop_ \
  blender -b -P laptop.py
```

The trailer reads the same frames from `trailer/public/`. Render again with
`DEVICE_OUT` pointed there, or copy them across — they are identical.

## Environment

| Variable | Meaning |
| --- | --- |
| `DEVICE_TEX` | Screen texture PNG. Required. |
| `DEVICE_OUT` | Directory for the frame sequence. Defaults to `../../public`. |
| `DEVICE_PREFIX` | Frame filename prefix. Required unless `STILL=1`. |
| `STILL=1` | One frame to `test_still.png` instead of the sequence. |

## Frames are not committed

`mm_laptop_*.png` is gitignored in both `ui-demo/` and `trailer/`. The output
is deterministic and runs to 119 MB, so we keep the script and re-render. A
clean checkout needs a render before the Remotion projects will build.

The screen textures *are* committed, because they come from the Playwright
demo suite rather than from Blender.
