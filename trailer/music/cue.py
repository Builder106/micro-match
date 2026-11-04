"""MicroMatch trailer cue, composed from ORIGINAL-CUE.md.

Render with `lmms-cue render music/cue.py` (see SankofaForge/lmms-cue).
96 BPM in 4/4, so one bar is 2.5 s and the 45 s trailer is 18 bars.
"""

from lmms_cue import Song, reverb, sf2

song = Song(bpm=96, length=45.0, fade_out=(43.2, 45.0), master_fx=[reverb(size=0.82, color=7000, wet=0.35)])


def at(seconds: float, grid: float = 1.0) -> float:
    """Beat nearest a picture time, on a grid of `grid` beats."""
    return round(song.beat(seconds) / grid) * grid


piano = song.track("Felt piano", sf2(0, gain=3), volume=90)
pluck = song.track("Pluck", sf2(46, gain=3), volume=70)  # orchestral harp
bass = song.track("Low string", sf2(43, gain=2), volume=30)  # contrabass, bowed
wood = song.track("Wood", sf2(115, gain=2), volume=35)  # woodblock

# Voicings: left hand, then right hand. Bm7(add11) carries E as the 11th.
CHORDS = {
    "D6/9": (["D3", "A3"], ["E4", "F#4", "B4"]),
    "A/C#": (["C#3", "A3"], ["E4", "A4"]),
    "Bm7(add11)": (["B2", "F#3"], ["D4", "E4", "A4"]),
    "Gmaj7": (["G2", "D3"], ["F#4", "A4", "B4"]),
}
LOOP = ["D6/9", "A/C#", "Bm7(add11)", "Gmaj7"]
ROOTS = {"D6/9": "D2", "A/C#": "C#2", "Bm7(add11)": "B1", "Gmaj7": "G1"}
MOTIF = [("D4", 1), ("A4", 1), ("B4", 1), ("E5", 0.75), ("E5", 3.5)]


def motif(start: float, octave_up: bool = False, velocity: int = 72):
    beat = start
    for note, length in MOTIF:
        name = note[:-1] + str(int(note[-1]) + 1) if octave_up else note
        piano.note(beat, length, name, velocity)
        beat += 1


# The end card resolution, on the beat nearest 39.5 s.
end = at(39.5)

# Bars 1-16 (0-40 s): the chord loop, one chord a bar, with the layers
# arriving at the picture changes from the cue's picture map.
for bar in range(1, 17):
    chord = LOOP[(bar - 1) % 4]
    left, right = CHORDS[chord]
    start = song.bar(bar)
    length = min(start + 4, end) - start
    seconds = (bar - 1) * 2.5

    if seconds < 9.5:
        # Bare muslin: sparse chords with room around them.
        piano.chord(start, 2.5, left, 40).chord(start, 2.5, right, 34)
    elif seconds < 15.5:
        # The swatches gather: chords now hold through the bar.
        piano.chord(start, 4, left, 44).chord(start, 4, right, 38)
    elif seconds < 35:
        # The quilt opens: wider right hand and a gentle broken chord.
        piano.chord(start, length, left, 46).chord(start, length, right, 40)
        for i, note in enumerate([right[-1], left[-1], right[0], right[-1]]):
            beat = start + i
            # Keep 29.0-30.3 s clear for the sew sound at 29.5 s.
            if not 29.0 <= beat * 60 / song.bpm <= 30.3:
                piano.note(beat + 0.5, 0.5, note, 30)
    else:
        # Arabic and dark mode: same harmony, high notes thinned out.
        piano.chord(start, length, left, 44).chord(start, length, right[:2], 36)

    if seconds >= 15:
        root_start = max(start, at(15.5))
        bass.note(root_start, start + length - root_start, ROOTS[chord], 55)

    if 15 <= seconds < 35:
        for beat in (start + 1, start + 3):
            if not 28.8 <= beat * 60 / song.bpm <= 30.3:
                wood.note(beat, 0.25, "E5", 40)

# The motif: up front at the start, then again once the quilt has settled.
motif(song.bar(1))
motif(song.bar(3), velocity=62)
motif(song.bar(9), octave_up=True, velocity=60)
motif(song.bar(13), velocity=52)  # just after the sew; come back in gently

# Three soft pluck responses as the swatches drop in (10.50, 11.05, 11.60 s).
for seconds, note in [(10.5, "A4"), (11.05, "B4"), (11.6, "E5")]:
    pluck.note(at(seconds, 0.5), 2, note, 80)

# 24.5 s, the block unfolds: a higher answering note.
pluck.note(at(24.5, 0.5), 3, "E6", 70)
pluck.note(at(26.5, 0.5), 3, "F#6", 62)

# End card: resolve to A(add9) and hold to the fade (43.2-45 s).
piano.chord(end, 72 - end, ["A2", "E3"], 50).chord(end, 72 - end, ["B3", "C#4", "E4"], 44)
piano.note(end, 72 - end, "E5", 52)
bass.note(end, 72 - end, "A1", 50)
pluck.note(end + 1, 4, "B5", 52)
