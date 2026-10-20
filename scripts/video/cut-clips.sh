#!/usr/bin/env bash
# Cuts the shots the HyperFrames videos use out of the footage takes from
# e2e/capture/footage.mjs, into trailer/public/clips/ and ui-demo/public/clips/,
# and makes the README GIFs in docs/demos/. Each clip runs a little past the
# length its composition shows, so the renderer never reaches the end of a source.
#
#   bash scripts/video/cut-clips.sh [footage-dir]
#
# The footage directory defaults to e2e/recordings/footage.
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
footage="${1:-$root/e2e/recordings/footage}"
tail_pad=0.3

# The phone claim take skips the moments the panel is blank between pages (1.30-2.03,
# 4.15-5.03 and 12.27-13.03 s), so each tap cuts straight to the page it opens.
# project  clip       take         start  length
shots="
trailer  entrance   entrance     0.00   9.00
trailer  unfold     unfold       1.00   4.50
trailer  sewn       sewn         0.00   6.00
trailer  languages  languages    5.80   4.50
ui-demo  path       phone-path   0.00   2.50
ui-demo  open       phone-path   7.30   4.30
ui-demo  feed       phone-claim  0.00   1.35
ui-demo  task       phone-claim  2.03   2.12
ui-demo  form       phone-claim  5.03   7.27
ui-demo  pinned     phone-claim  13.03  2.67
ui-demo  approve    approve      0.60   5.50
ui-demo  sewn       sewn         0.00   5.00
"

while read -r project clip take start length; do
  [ -z "$project" ] && continue
  out="$root/$project/public/clips/$clip.mp4"
  mkdir -p "$(dirname "$out")"
  ffmpeg -nostdin -y -loglevel error -ss "$start" -i "$footage/$take.mp4" \
    -t "$(echo "$length + $tail_pad" | bc)" -an -r 30 \
    -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart "$out"
  echo "$project/public/clips/$clip.mp4"
done <<<"$shots"

# README GIFs: the same takes, smaller, at 10 fps. The skip column lists stretches of
# the take to leave out, in take time, such as the blank panel between two pages.
#   name       take         start  length  width  skip
gifs="
quilt      entrance     0.00   9.00    800
unfold     unfold       0.40   10.00   800
claim      claim        0.40   21.50   800    4.77-5.53,8.97-9.73,20.00-20.80
approve    approve      0.60   6.00    800
sewn       sewn         0.00   7.40    800
languages  languages    3.80   9.20    800
phone      phone-path   0.00   12.50   360
"
mkdir -p "$root/docs/demos"
while read -r name take start length width skip; do
  [ -z "$name" ] && continue
  out="$root/docs/demos/$name.gif"
  # Seeking resets the clock, so each skipped stretch moves back by the start time.
  drop=""
  for range in ${skip//,/ }; do
    drop="$drop+between(t,$(echo "${range%-*} - $start" | bc),$(echo "${range#*-} - $start" | bc))"
  done
  [ -n "$drop" ] && drop="select='not(${drop#+})',setpts=N/FRAME_RATE/TB,"
  ffmpeg -nostdin -y -loglevel error -ss "$start" -t "$length" -i "$footage/$take.mp4" \
    -vf "${drop}fps=10,scale=$width:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
    "$out"
  echo "docs/demos/$name.gif $(du -h "$out" | cut -f1)"
done <<<"$gifs"
