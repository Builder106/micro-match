# Tier 2 social cut storyboard

Built in HyperFrames. `MicroMatchUiDemo` is 35 seconds at 1080×1920, 30 fps.
The first twenty seconds are the volunteer's side, full screen on a phone. The
rest is the nonprofit's side, desktop footage laid on muslin with a line above
it saying whose turn it is.

| Time | Beat | Source |
| --- | --- | --- |
| 0.00-2.50 | The home block on a phone: "Got fifteen minutes?" | `phone-path` take, 0.00 s |
| 2.50-6.80 | Down the quilt past the community block, then into the task feed | `phone-path` take, 7.30 s |
| 6.80-8.15 | The feed: "Pick a real task from a real nonprofit." | `phone-claim` take, 0.00 s |
| 8.15-10.27 | The task: translate a volunteer welcome email into Spanish | `phone-claim` take, 2.03 s |
| 10.27-17.54 | Send your work: a link and a note for the reviewer, typed in. "Do it, then send a link to your work." | `phone-claim` take, 5.03 s |
| 17.54-20.21 | Your block: the work is pinned for review | `phone-claim` take, 13.03 s |
| 20.21-25.71 | The nonprofit's reviews, on the table: "A person at the nonprofit checks it." The claim is approved | `approve` take, 0.60 s, over `compositions/table.html` |
| 25.71-30.71 | The patch sewn into the quilt: "Then it's sewn into the quilt." | `sewn` take, 0.00 s, over `compositions/table.html` |
| 30.71-35.00 | End card: the title block stood upright, with trymicromatch.com | `compositions/end.html` |

Captions for the phone shots are in `compositions/captions.html`. They sit low
on the screen, clear of the corner tags. The one over the form moves up onto
the panel's header row, because the reviewer note is being typed at the bottom.

Sound: `audio.mp3` fades in over the first second and out over the last 1.6 s.
A pin at 17.44 s as the work is pinned, and a sew at 22.0 s as the nonprofit
approves it. Credit the music the way `public/CREDITS.md` says when you publish.
