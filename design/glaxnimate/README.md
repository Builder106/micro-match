# Glaxnimate source art

Drawn with the Glaxnimate MCP server. Components inline this path data (they never load
these files at runtime), so redraw here first, then copy the paths into the component or
module listed.

| File | Contents | Used by |
|---|---|---|
| `patch-icons.svg` | Ten embroidered patch icons, 24 x 24, stroked | `src/lib/quilt/icons.ts` (patches, badge editor) |
| `sewing-kit.svg` | Needle and thread, pin, scissors, the empty frame with its chalked square, a pinked swatch, a loose thread, a running stitch, the weave pattern | `src/lib/components/art/Needle.svelte`, `Pin.svelte`, `Scissors.svelte`, the quilt's weave and chalk, the 404 thread |
| `sampler-blocks.svg` | The ten traditional block patterns of the sampler quilt (nine patch, rail fence, pinwheel, flying geese, churn dash, friendship star, Ohio star, courthouse steps, hourglass, half-square triangles) | `src/lib/quilt/blocks.ts`, which generates the same geometry for each block of the site |
| `brand.svg` | The MicroMatch mark in its three forms: patch, small (favicons) and bare (the corner tag) | `src/lib/components/art/Mark.svelte`, `static/logo.svg`, `static/favicon.svg`; the PNG and ICO icons are rendered from those |

Patches and blocks are composed at runtime from this geometry plus real data: a patch takes
the color and icon of the badge its nonprofit designed.
