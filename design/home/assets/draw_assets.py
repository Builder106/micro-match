"""Draw and animate the Handoff Table assets with the Glaxnimate MCP library.

Run with the glaxnimate-mcp-server package on PYTHONPATH:
    python draw_assets.py OUT_DIR

Each asset is drawn with create_svg (stable semantic IDs, no text), animated
over a 1000 ms timeline that the page scrubs with scroll, and exported to
source.svg, motion.json, animation.json (Lottie), fallback.svg (final frame),
and smil.svg in OUT_DIR/<slug>/.
"""

import json
import math
import sys
from pathlib import Path

from glaxnimate_mcp.authoring import create_svg
from glaxnimate_mcp.lottie import export_lottie
from glaxnimate_mcp.static import export_static
from glaxnimate_mcp.svg import animate_svg

NAVY = "#0F172A"
PAPER = "#FFFFFF"
CREAM = "#FFF5F0"
SAND = "#E9DFD0"
CORAL = "#FF6B6B"
CORAL_DEEP = "#E85555"
CORAL_SOFT = "#FFE5DC"
PEACH = "#FDBA74"
PEACH_DEEP = "#FB923C"
PEACH_SOFT = "#FED7AA"
GREEN = "#059669"
GREEN_SOFT = "#D1FAE5"
GREEN_MID = "#34D399"
SLATE = "#64748B"

LINE = 4
DURATION = 1000
FPS = 60

OUT = [0.22, 1, 0.36, 1]
IN = [0.55, 0, 1, 0.45]
IN_OUT = [0.65, 0, 0.35, 1]
LINEAR = [0, 0, 1, 1]


# ---------------------------------------------------------------- drawing helpers

def E(kind, eid, attrs=None, children=None):
    spec = {"type": kind, "id": eid, "attributes": {k: v for k, v in (attrs or {}).items()}}
    if children:
        spec["children"] = children
    return spec


def outlined(attrs, fill, width=LINE):
    return {**attrs, "fill": fill, "stroke": NAVY, "stroke-width": width, "stroke-linejoin": "round"}


def paper(kind, eid, attrs, fill):
    """A cut-paper shape: an offset navy shadow shape under an outlined shape."""
    shadow = {k: v for k, v in attrs.items()}
    shadow.update({"fill": NAVY, "fill-opacity": 0.14, "transform": "translate(4 4)"})
    return [E(kind, f"{eid}-shadow", shadow), E(kind, eid, outlined(attrs, fill))]


def pivot(eid, x, y, children, inner_attrs=None, wrap=None):
    """A group placed at (x, y) whose inner group transforms around that point.

    wrap adds a nested group, so a second transform channel can animate it.
    """
    if wrap:
        children = [E("g", wrap, {}, children)]
    return E("g", f"{eid}-at", {"transform": f"translate({x} {y})"}, [E("g", eid, inner_attrs or {}, children)])


def stroke_path(eid, d, color, width, extra=None):
    return E("path", eid, {"d": d, "fill": "none", "stroke": color, "stroke-width": width,
                           "stroke-linecap": "round", "stroke-linejoin": "round", **(extra or {})})


def star_points(points, outer, inner, rotation=-90):
    coords = []
    for i in range(points * 2):
        r = outer if i % 2 == 0 else inner
        a = math.radians(rotation + i * 180 / points)
        coords.append(f"{r * math.cos(a):.2f},{r * math.sin(a):.2f}")
    return " ".join(coords)


def wedge(r, a0, a1):
    p = lambda a: (r * math.cos(math.radians(a)), r * math.sin(math.radians(a)))
    (x0, y0), (x1, y1) = p(a0), p(a1)
    return f"M0 0 L{x0:.2f} {y0:.2f} A{r} {r} 0 0 1 {x1:.2f} {y1:.2f} Z"


def arc(r, a0, a1):
    p = lambda a: (r * math.cos(math.radians(a)), r * math.sin(math.radians(a)))
    (x0, y0), (x1, y1) = p(a0), p(a1)
    return f"M{x0:.2f} {y0:.2f} A{r} {r} 0 0 1 {x1:.2f} {y1:.2f}"


# ---------------------------------------------------------------- animation helpers

def track(target, prop, keys):
    """Keys are (fraction, value, curve into this key). Holds pad both ends."""
    keys = [(round(t * DURATION), v, c) for t, v, c in keys]
    if keys[0][0] > 0:
        keys.insert(0, (0, keys[0][1], LINEAR))
    if keys[-1][0] < DURATION:
        keys.append((DURATION, keys[-1][1], LINEAR))
    return {
        "target_id": target, "property": prop,
        "values": [str(v) for _, v, _ in keys],
        "key_times": [round(t / DURATION, 4) for t, _, _ in keys],
        "calc_mode": "spline", "key_splines": [c for _, _, c in keys[1:]],
        "duration_ms": DURATION, "fill_mode": "freeze", "repeat_count": 1,
    }


def appear(target, at, span=0.03):
    return track(target, "opacity", [(at, "0", LINEAR), (at + span, "1", OUT)])


def pop(target, at, peak=1.12, start=0.6, span=0.16):
    return track(target, "scale", [(at, f"{start}", LINEAR), (at + span * 0.6, f"{peak}", OUT), (at + span, "1", IN_OUT)])


# ---------------------------------------------------------------- assets

def ink_stamp(ink, knob, glyph):
    def draw():
        mark_glyph = (
            [stroke_path("mark-check", "M-22 0 L-7 14 L22 -14", ink, 9)] if glyph == "check" else
            [stroke_path("mark-line-top", "M-30 -8 L30 -8", ink, 7), stroke_path("mark-line-bottom", "M-30 9 L14 9", ink, 7)]
        )
        mark = pivot("mark", 120, 196, [
            E("rect", "mark-frame", {"x": -64, "y": -26, "width": 128, "height": 52, "rx": 10, "fill": "none",
                                     "stroke": ink, "stroke-width": 6}),
            *mark_glyph,
        ], {"opacity": 0})
        body = [
            *paper("rect", "stamp-block", {"x": -56, "y": -4, "width": 112, "height": 26, "rx": 6}, PEACH),
            E("rect", "stamp-rubber", outlined({"x": -64, "y": 20, "width": 128, "height": 22, "rx": 5}, ink)),
            E("rect", "stamp-neck", outlined({"x": -11, "y": -38, "width": 22, "height": 36, "rx": 6}, PEACH_DEEP)),
            *paper("circle", "stamp-knob", {"cx": 0, "cy": -52, "r": 22}, knob),
            E("ellipse", "stamp-knob-shine", {"cx": -8, "cy": -60, "rx": 7, "ry": 4, "fill": PAPER, "fill-opacity": 0.55}),
        ]
        stamp = E("g", "stamp-at", {"transform": "translate(120 116)"}, [
            E("g", "stamp", {}, [E("g", "stamp-tilt", {}, body)])])
        return [mark, stamp]

    def motion():
        return [
            track("stamp", "translate", [(0, "0 -22", LINEAR), (0.38, "0 60", IN), (0.46, "0 60", LINEAR), (0.8, "0 -24", OUT)]),
            track("stamp-tilt", "rotate", [(0, "-7", LINEAR), (0.36, "0", OUT), (0.46, "0", LINEAR), (0.8, "6", OUT)]),
            appear("mark", 0.44, 0.02),
            track("mark", "scale", [(0.44, "1.08", LINEAR), (0.62, "1", OUT)]),
        ]
    return draw, motion, (240, 240)


def verified_seal():
    def draw():
        return [pivot("seal", 80, 74, [
            E("polygon", "seal-tail-left", outlined({"points": "-22,18 -38,72 -23,63 -12,78 -2,26"}, CORAL_DEEP)),
            E("polygon", "seal-tail-right", outlined({"points": "22,18 38,72 23,63 12,78 2,26"}, CORAL)),
            *paper("polygon", "seal-rosette", {"points": star_points(18, 52, 45)}, GREEN_SOFT),
            pivot("seal-ring", 0, 0, [E("circle", "seal-ring-face", outlined({"cx": 0, "cy": 0, "r": 35}, PAPER, 3))]),
            stroke_path("seal-check", "M-16 1 L-15.4 1.6 L-14.8 2.2", GREEN, 9, {"opacity": 0}),
        ], {"opacity": 0}, wrap="seal-spin")]

    def motion():
        return [
            appear("seal", 0, 0.1),
            track("seal", "scale", [(0, "1.35", LINEAR), (0.32, "0.94", IN), (0.46, "1", OUT)]),
            track("seal-spin", "rotate", [(0, "-24", LINEAR), (0.4, "0", OUT)]),
            track("seal-ring", "scale", [(0.4, "0.84", LINEAR), (0.58, "1", OUT)]),
            appear("seal-check", 0.52, 0.03),
            track("seal-check", "path", [(0.52, "M-16 1 L-15.4 1.6 L-14.8 2.2", LINEAR),
                                         (0.66, "M-16 1 L-5 12 L-4.4 11.4", IN),
                                         (0.86, "M-16 1 L-5 12 L17 -12", OUT)]),
        ]
    return draw, motion, (160, 160)


def time_lanes():
    lanes = [("lane-15", 18, 168), ("lane-20", 50, 224), ("lane-30", 82, 336)]

    def draw():
        items = []
        for eid, y, width in lanes:
            ticks = [E("line", f"{eid}-tick-{i}", {"x1": 28 * i * 2, "y1": 6, "x2": 28 * i * 2, "y2": 16,
                                                   "stroke": NAVY, "stroke-width": 2, "stroke-opacity": 0.35})
                     for i in range(1, int(width / 56))]
            items.append(pivot(eid, 40, y, inner_attrs={"opacity": 0}, children=[
                E("rect", f"{eid}-shadow", {"x": 0, "y": 0, "width": width, "height": 22, "rx": 11, "fill": NAVY,
                                            "fill-opacity": 0.14, "transform": "translate(3 3)"}),
                E("rect", f"{eid}-rail", outlined({"x": 0, "y": 0, "width": width, "height": 22, "rx": 11},
                                                  PEACH_SOFT if eid == "lane-15" else PAPER, 3)),
                *ticks,
            ]))
        chip = pivot("chip", 150, 29, [
            *paper("rect", "chip-card", {"x": -26, "y": -15, "width": 52, "height": 30, "rx": 6}, PAPER),
            E("circle", "chip-notch", {"cx": -26, "cy": 0, "r": 5, "fill": NAVY}),
            stroke_path("chip-line", "M-12 0 L14 0", CORAL, 5),
        ], {"opacity": 0})
        return items + [chip]

    def motion():
        result = []
        for i, (eid, _, _) in enumerate(lanes):
            start = 0.06 * i
            result.append(appear(eid, start, 0.04))
            result.append(track(eid, "scale", [(start, "0.04 1", LINEAR), (start + 0.3, "1 1", OUT)]))
        result += [
            appear("chip", 0.38, 0.05),
            track("chip", "translate", [(0.38, "300 -6", LINEAR), (0.66, "-8 0", OUT), (0.74, "0 0", IN_OUT)]),
            track("lane-15-rail", "fill", [(0.68, PEACH_SOFT, LINEAR), (0.86, CORAL, OUT)]),
        ]
        return result
    return draw, motion, (480, 120)


def minute_dial():
    segments = 12

    def draw():
        wedges = [E("path", f"dial-wedge-{i:02d}", {"d": wedge(64, -90 + 30 * i, -60 + 30 * i), "fill": PEACH,
                                                     "opacity": 0}) for i in range(segments)]
        ticks = [E("line", f"dial-tick-{i:02d}", {"x1": 0, "y1": -78, "x2": 0, "y2": -70, "stroke": NAVY,
                                                   "stroke-width": 3, "stroke-linecap": "round",
                                                   "transform": f"rotate({30 * i})"}) for i in range(segments)]
        return [E("g", "dial-at", {"transform": "translate(100 104)"}, [
            *paper("rect", "dial-crown", {"x": -12, "y": -102, "width": 24, "height": 16, "rx": 4}, CORAL),
            *paper("circle", "dial-face", {"cx": 0, "cy": 0, "r": 84}, PAPER),
            *wedges, *ticks,
            E("g", "dial-hand", {}, [stroke_path("dial-hand-line", "M0 0 L0 -58", NAVY, 6)]),
            E("circle", "dial-hub", {"cx": 0, "cy": 0, "r": 8, "fill": NAVY}),
        ])]

    def motion():
        result = [track("dial-hand", "rotate", [(0, "0", LINEAR), (1, "360", LINEAR)])]
        for i in range(segments):
            at = i / segments
            result.append(track(f"dial-wedge-{i:02d}", "opacity", [(at, "0", LINEAR), (at + 0.02, "1", LINEAR)]))
        return result
    return draw, motion, (200, 210)


def vignette_translate():
    def bubble(eid, x, y, fill, lines, tail):
        tail_points = "-30,26 -44,46 -12,26" if tail == "left" else "30,26 44,46 12,26"
        return pivot(eid, x, y, [
            *paper("rect", f"{eid}-body", {"x": -70, "y": -36, "width": 140, "height": 64, "rx": 16}, fill),
            E("polygon", f"{eid}-tail", outlined({"points": tail_points}, fill)),
            E("rect", f"{eid}-tail-cover", {"x": -46 if tail == "left" else 6, "y": 22, "width": 40, "height": 5, "fill": fill}),
            *[pivot(f"{eid}-line-{i}", -52, -18 + 16 * i, [stroke_path(f"{eid}-line-{i}-stroke", f"M0 0 L{w} 0", NAVY, 6,
                                                                       {"stroke-opacity": 0.75})])
              for i, w in enumerate(lines)],
        ], {"opacity": 0})

    def draw():
        return [
            bubble("bubble-source", 100, 76, CORAL_SOFT, [96, 64], "left"),
            bubble("bubble-target", 218, 168, GREEN_SOFT, [80, 104], "right"),
            pivot("swap-arrow", 176, 104, [stroke_path("swap-arrow-shaft", "M-14 -10 C 2 -10 10 -2 10 12", PEACH_DEEP, 6),
                                            stroke_path("swap-arrow-head", "M2 6 L10 14 L18 6", PEACH_DEEP, 6)], {"opacity": 0}),
        ]

    def motion():
        result = [appear("bubble-source", 0, 0.08), pop("bubble-source", 0, 1.06, 0.85, 0.2)]
        for i in range(2):
            result.append(track(f"bubble-source-line-{i}", "scale", [(0.1 + 0.08 * i, "0.02 1", LINEAR), (0.26 + 0.08 * i, "1 1", OUT)]))
        result += [appear("swap-arrow", 0.4, 0.05), pop("swap-arrow", 0.4, 1.15, 0.6, 0.16),
                   appear("bubble-target", 0.5, 0.06), pop("bubble-target", 0.5, 1.06, 0.85, 0.2)]
        for i in range(2):
            result.append(track(f"bubble-target-line-{i}", "scale", [(0.62 + 0.1 * i, "0.02 1", LINEAR), (0.8 + 0.1 * i, "1 1", OUT)]))
        return result
    return draw, motion, (320, 240)


def vignette_data():
    rows = 4

    def draw():
        items = [*paper("rect", "sheet", {"x": 44, "y": 24, "width": 232, "height": 192, "rx": 12}, PAPER),
                 E("rect", "sheet-header", {"x": 46, "y": 26, "width": 228, "height": 30, "rx": 10, "fill": PEACH_SOFT})]
        for i in range(rows):
            y = 74 + 36 * i
            items += [
                stroke_path(f"row-{i}-value", f"M70 {y} L{180 - 18 * (i % 2)} {y}", NAVY, 6, {"stroke-opacity": 0.6}),
                E("rect", f"row-{i}-box", outlined({"x": 214, "y": y - 13, "width": 26, "height": 26, "rx": 6}, PAPER, 3)),
                pivot(f"row-{i}-check", 227, y, [stroke_path(f"row-{i}-check-stroke", "M-8 0 L-2 6 L9 -7", GREEN, 5)], {"opacity": 0}),
            ]
        return items

    def motion():
        result = []
        for i in range(rows):
            at = 0.12 + 0.2 * i
            result += [appear(f"row-{i}-check", at, 0.03), pop(f"row-{i}-check", at, 1.3, 0.4, 0.14)]
        return result
    return draw, motion, (320, 240)


def vignette_proofread():
    widths = [176, 150, 188, 120, 164]

    def draw():
        items = [*paper("rect", "page", {"x": 56, "y": 18, "width": 208, "height": 204, "rx": 10}, PAPER),
                 E("polygon", "page-fold", outlined({"points": "232,18 264,18 264,50"}, PEACH_SOFT, 3))]
        for i, w in enumerate(widths):
            items.append(stroke_path(f"text-{i}", f"M78 {58 + 32 * i} L{78 + w} {58 + 32 * i}", NAVY, 6, {"stroke-opacity": 0.55}))
        items += [
            pivot("strike", 120, 90, [stroke_path("strike-line", "M0 0 L72 0", CORAL_DEEP, 6)]),
            pivot("caret", 170, 136, [stroke_path("caret-stroke", "M-9 9 L0 -3 L9 9", CORAL_DEEP, 5)], {"opacity": 0}),
            pivot("margin-mark", 34, 186, [E("circle", "margin-mark-ring", {"cx": 0, "cy": 0, "r": 13, "fill": "none",
                                                                            "stroke": CORAL_DEEP, "stroke-width": 5})], {"opacity": 0}),
        ]
        return items

    def motion():
        return [
            track("strike", "scale", [(0.12, "0.02 1", LINEAR), (0.4, "1 1", OUT)]),
            appear("caret", 0.46, 0.03), pop("caret", 0.46, 1.25, 0.5, 0.16),
            appear("margin-mark", 0.7, 0.03), pop("margin-mark", 0.7, 1.2, 0.5, 0.18),
        ]
    return draw, motion, (320, 240)


def vignette_photos():
    pins = [("pin-a", 116, 96, CORAL), ("pin-b", 196, 120, GREEN), ("pin-c", 156, 160, PEACH_DEEP)]

    def draw():
        items = [
            *paper("rect", "photo", {"x": 40, "y": 30, "width": 240, "height": 180, "rx": 8}, PAPER),
            E("rect", "photo-sky", {"x": 54, "y": 44, "width": 212, "height": 152, "rx": 4, "fill": PEACH_SOFT}),
            E("circle", "photo-sun", {"cx": 228, "cy": 78, "r": 16, "fill": PEACH}),
            E("polygon", "photo-hill-back", outlined({"points": "54,196 130,104 196,196"}, GREEN_SOFT, 3)),
            E("polygon", "photo-hill-front", outlined({"points": "120,196 204,124 266,196"}, GREEN_MID, 3)),
        ]
        for eid, x, y, color in pins:
            items.append(pivot(eid, x, y, [
                E("path", f"{eid}-head", outlined({"d": "M0 0 C -14 -16 -14 -36 0 -36 C 14 -36 14 -16 0 0 Z"}, color, 3)),
                E("circle", f"{eid}-dot", {"cx": 0, "cy": -24, "r": 5, "fill": PAPER}),
            ], {"opacity": 0}))
        return items

    def motion():
        result = []
        for i, (eid, *_rest) in enumerate(pins):
            at = 0.12 + 0.26 * i
            result += [appear(eid, at, 0.03),
                       track(eid, "translate", [(at, "0 -60", LINEAR), (at + 0.12, "0 4", IN), (at + 0.2, "0 0", OUT)])]
        return result
    return draw, motion, (320, 240)


def proof_clip():
    clip = "M50 108 L50 50 C 50 38 70 38 70 50 L70 116 C 70 132 38 132 38 116 L38 62"

    def draw():
        slip = pivot("slip", 0, 0, [
            *paper("rect", "slip-card", {"x": 18, "y": 72, "width": 84, "height": 116, "rx": 8}, PAPER),
            E("rect", "slip-link-a", {"x": 34, "y": 132, "width": 30, "height": 16, "rx": 8, "fill": "none", "stroke": CORAL_DEEP,
                                      "stroke-width": 5, "transform": "rotate(-35 49 140)"}),
            E("rect", "slip-link-b", {"x": 52, "y": 146, "width": 30, "height": 16, "rx": 8, "fill": "none", "stroke": CORAL_DEEP,
                                      "stroke-width": 5, "transform": "rotate(-35 67 154)"}),
            stroke_path("slip-line-a", "M34 104 L86 104", NAVY, 5, {"stroke-opacity": 0.55}),
            stroke_path("slip-line-b", "M34 118 L62 118", NAVY, 5, {"stroke-opacity": 0.55}),
        ], {"opacity": 0})
        clip_group = pivot("clip", 54, 50, [E("g", "clip-shape", {"transform": "translate(-54 -50)"}, [
            stroke_path("clip-wire", clip, SLATE, 7),
        ])], {"opacity": 0}, wrap="clip-swing")
        return [slip, clip_group]

    def motion():
        return [
            appear("slip", 0, 0.08),
            track("slip", "translate", [(0, "0 70", LINEAR), (0.4, "0 0", OUT)]),
            appear("clip", 0.34, 0.05),
            track("clip", "translate", [(0.34, "0 -36", LINEAR), (0.56, "0 0", OUT)]),
            track("clip-swing", "rotate", [(0.34, "-20", LINEAR), (0.6, "5", OUT), (0.72, "0", IN_OUT)]),
        ]
    return draw, motion, (120, 200)


def badge_press():
    segments, lit = 16, 12

    def draw():
        ring = [E("circle", "ring-track", {"cx": 0, "cy": 0, "r": 70, "fill": "none", "stroke": SAND, "stroke-width": 10, "opacity": 0})]
        ring += [E("path", f"ring-seg-{i:02d}", {"d": arc(70, -90 + i * 22.5 + 1.5, -90 + (i + 1) * 22.5 - 1.5), "fill": "none",
                                                 "stroke": GREEN, "stroke-width": 10, "stroke-linecap": "butt", "opacity": 0})
                 for i in range(segments)]
        return [
            E("g", "ring-at", {"transform": "translate(120 116)"}, ring),
            pivot("impression", 120, 116, [E("circle", "impression-disc", {"cx": 0, "cy": 0, "r": 50, "fill": SAND})],
                  {"opacity": 0}),
            pivot("badge", 120, 116, [
                E("polygon", "badge-tail-left", outlined({"points": "-20,30 -34,82 -20,74 -10,88 0,40"}, CORAL_DEEP)),
                E("polygon", "badge-tail-right", outlined({"points": "20,30 34,82 20,74 10,88 0,40"}, CORAL)),
                *paper("circle", "badge-medal", {"cx": 0, "cy": 0, "r": 50}, PEACH),
                E("circle", "badge-inner", outlined({"cx": 0, "cy": 0, "r": 37}, CREAM, 3)),
                E("polygon", "badge-star", outlined({"points": star_points(5, 24, 10)}, CORAL, 3)),
            ], {"opacity": 0}, wrap="badge-pop"),
        ]

    def motion():
        result = [
            appear("ring-track", 0.04, 0.1),
            appear("impression", 0, 0.1),
            track("impression", "scale", [(0, "0.8", LINEAR), (0.22, "1", OUT)]),
            appear("badge", 0.24, 0.04),
            track("badge-pop", "scale", [(0.24, "0.6", LINEAR), (0.42, "1.12", OUT), (0.54, "1", IN_OUT)]),
            track("badge", "translate", [(0.24, "0 0", LINEAR), (0.44, "0 -22", OUT), (0.62, "0 4", IN), (0.7, "0 0", OUT)]),
        ]
        for i in range(lit):
            at = 0.72 + 0.022 * i
            result.append(track(f"ring-seg-{i:02d}", "opacity", [(at, "0", LINEAR), (at + 0.02, "1", LINEAR)]))
        return result
    return draw, motion, (240, 240)


ASSETS = {
    "ink-stamp-posted": ink_stamp(CORAL_DEEP, CORAL, "lines"),
    "ink-stamp-approved": ink_stamp(GREEN, GREEN_MID, "check"),
    "verified-seal": verified_seal(),
    "time-lanes": time_lanes(),
    "minute-dial": minute_dial(),
    "vignette-translate": vignette_translate(),
    "vignette-data": vignette_data(),
    "vignette-proofread": vignette_proofread(),
    "vignette-photos": vignette_photos(),
    "proof-clip": proof_clip(),
    "badge-press": badge_press(),
}


def main():
    out = Path(sys.argv[1])
    only = set(sys.argv[2:])
    for slug, (draw, motion, (w, h)) in ASSETS.items():
        if only and slug not in only:
            continue
        art = create_svg(w, h, draw())["svg"]
        tracks = motion()
        target = out / slug
        target.mkdir(parents=True, exist_ok=True)
        (target / "source.svg").write_text(art)
        (target / "motion.json").write_text(json.dumps({"duration_ms": DURATION, "fps": FPS, "tracks": tracks}, indent=1))
        (target / "animation.json").write_text(json.dumps(export_lottie(art, tracks, fps=FPS, duration_ms=DURATION)["lottie"], separators=(",", ":")))
        (target / "fallback.svg").write_text(export_static(art, animations=tracks, time_ms=DURATION, minify_ids=True)["svg"])
        (target / "smil.svg").write_text(animate_svg(art, tracks)["animated_svg"])
        print(f"{slug}: ok")


if __name__ == "__main__":
    main()
