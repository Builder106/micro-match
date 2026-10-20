#!/usr/bin/env bash
# Synthesizes the videos' two sound effects with ffmpeg, so there is no sample to license:
# a soft pin (a claim pinned for review) and a sew (a patch stitched into the quilt).
#
#   bash scripts/video/make-sfx.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
tmp="$(mktemp -d)"

# Pin: a short, bright tap with a quick decay.
ffmpeg -nostdin -y -loglevel error -f lavfi \
  -i "aevalsrc=exp(-t*90)*sin(2*PI*1760*t)*0.5+exp(-t*40)*sin(2*PI*330*t)*0.35:s=48000:d=0.4" \
  -af "alimiter=limit=0.8" "$tmp/pin.wav"

# Sew: three quick stitches, each a soft noise pull, then a low warm note under them.
ffmpeg -nostdin -y -loglevel error -f lavfi -i "anoisesrc=color=pink:amplitude=0.5:d=0.09:r=48000" \
  -af "highpass=f=1800,lowpass=f=6000,afade=t=in:d=0.01,afade=t=out:st=0.03:d=0.06" "$tmp/stitch.wav"
ffmpeg -nostdin -y -loglevel error -i "$tmp/stitch.wav" -i "$tmp/stitch.wav" -i "$tmp/stitch.wav" \
  -f lavfi -i "aevalsrc=exp(-t*6)*sin(2*PI*392*t)*0.25+exp(-t*6)*sin(2*PI*587.3*t)*0.15:s=48000:d=0.5" \
  -filter_complex "[1]adelay=110|110[b];[2]adelay=220|220[c];[0][b][c][3]amix=inputs=4:normalize=0,alimiter=limit=0.8" "$tmp/sew.wav"

for project in trailer ui-demo; do
  cp "$tmp/pin.wav" "$root/$project/public/sfx_pin.wav"
  cp "$tmp/sew.wav" "$root/$project/public/sfx_sew.wav"
done
rm -rf "$tmp"
echo "wrote sfx_pin.wav and sfx_sew.wav into trailer/public and ui-demo/public"
