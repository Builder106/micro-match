<script lang="ts">
  // Design a patch: the fabric (a swatch or any hex) and the embroidered icon, with a live
  // preview. Nonprofits use it for real in the badge editor; the public page uses it as a demo.
  import PatchPreview from './PatchPreview.svelte';
  import { SWATCHES, normalizeHex } from '$lib/quilt/fabrics';
  import { PATCH_ICON_NAMES, PATCH_ICON_LABELS, type PatchIcon } from '$lib/quilt/icons';
  import * as m from '$lib/paraglide/messages.js';

  type Props = { color?: string; icon?: PatchIcon; label?: string; idPrefix?: string };
  let { color = $bindable('#FF6B6B'), icon = $bindable<PatchIcon>('heart'), label = '', idPrefix = 'patch' }: Props = $props();

  let custom = $state(color);
  function pickCustom(value: string) {
    custom = value;
    const hex = normalizeHex(value);
    if (hex) color = hex;
  }
</script>

<div class="designer">
  <div class="designer__preview">
    <PatchPreview {color} {icon} size="min(11rem, 40vw)" label={label ? m.designer_preview_named({ name: label }) : m.designer_preview()} />
    {#if label}<p class="designer__name">{label}</p>{/if}
  </div>

  <div class="designer__controls">
    <fieldset>
      <legend>{m.designer_fabric()}</legend>
      <div class="swatches">
        {#each SWATCHES as s (s.hex)}
          <label class="swatch" style:--s={s.hex}>
            <input type="radio" name="{idPrefix}-fabric" value={s.hex} checked={color === s.hex} onchange={() => { color = s.hex; custom = s.hex; }} />
            <span class="sr-only">{s.name()}</span>
          </label>
        {/each}
      </div>
      <label class="custom">
        <span>{m.designer_any_color()}</span>
        <input type="color" value={normalizeHex(custom) ?? '#FF6B6B'} oninput={(e) => pickCustom(e.currentTarget.value)} />
        <code>{color}</code>
      </label>
    </fieldset>

    <fieldset>
      <legend>{m.designer_icon()}</legend>
      <div class="icons">
        {#each PATCH_ICON_NAMES as name (name)}
          <label class="icon-pick" title={PATCH_ICON_LABELS[name]()}>
            <input type="radio" name="{idPrefix}-icon" value={name} checked={icon === name} onchange={() => (icon = name)} />
            <PatchPreview color="#FFFDF8" icon={name} size="2.6rem" />
            <span class="sr-only">{PATCH_ICON_LABELS[name]()}</span>
          </label>
        {/each}
      </div>
    </fieldset>
  </div>
</div>

<style>
  .designer {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: clamp(1.25rem, 3vw, 2.5rem);
    align-items: start;
  }
  .designer__preview {
    display: grid;
    justify-items: center;
    gap: 0.75rem;
    padding: 1.25rem;
    background: var(--c-sash, #f6efe2);
    border-radius: var(--radius);
  }
  .designer__name {
    font-family: var(--f-display);
    font-weight: 700;
  }
  .designer__controls {
    display: grid;
    gap: 1.25rem;
  }
  fieldset {
    border: 0;
    padding: 0;
    display: grid;
    gap: 0.6rem;
  }
  legend {
    font-family: var(--f-display);
    font-weight: 650;
    margin-bottom: 0.4rem;
  }
  .swatches,
  .icons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }
  .swatch {
    width: 2.2rem;
    height: 2.2rem;
    border-radius: var(--radius);
    background: var(--s);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c-fg) 25%, transparent);
    cursor: pointer;
    transition: translate 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .swatch input,
  .icon-pick input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .swatch:has(input:checked) {
    box-shadow: 0 0 0 2px var(--c-paper), 0 0 0 4px var(--c-fg);
    translate: 0 -2px;
  }
  .swatch:has(input:focus-visible),
  .icon-pick:has(input:focus-visible) {
    outline: 2px solid var(--c-fg);
    outline-offset: 3px;
  }
  @media (hover: hover) {
    .swatch:hover,
    .icon-pick:hover {
      translate: 0 -2px;
    }
  }
  .icon-pick {
    position: relative;
    display: grid;
    place-items: center;
    padding: 0.2rem;
    border-radius: var(--radius);
    cursor: pointer;
    transition: translate 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .icon-pick:has(input:checked) {
    box-shadow: 0 0 0 2px var(--c-fg);
  }
  .custom {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-size: var(--t-s);
  }
  .custom input {
    width: 2.4rem;
    height: 2rem;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  @media (max-width: 599px) {
    .designer {
      grid-template-columns: 1fr;
    }
  }
</style>
