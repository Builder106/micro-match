<script lang="ts">
  import Icon from '@iconify/svelte';
  import { onMount } from 'svelte';

  export let value: string;
  export let options: Array<{ value: string; label: string }> = [];
  export let ariaLabel = 'Select an option';
  export let disabled = false;
  export let onChange: (() => void) | undefined = undefined;

  let open = false;
  let trigger: HTMLButtonElement;
  let menu: HTMLDivElement;

  $: selected = options.find((option) => option.value === value) ?? options[0];

  function select(optionValue: string) {
    value = optionValue;
    open = false;
    onChange?.();
    trigger?.focus();
  }

  function onKeydown(event: KeyboardEvent) {
    if (disabled) return;
    if (event.key === 'Escape') {
      open = false;
      trigger?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const current = Math.max(0, options.findIndex((option) => option.value === value));
      const next = event.key === 'ArrowDown'
        ? Math.min(options.length - 1, current + 1)
        : Math.max(0, current - 1);
      select(options[next].value);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open = !open;
    }
  }

  onMount(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (open && !menu?.contains(event.target as Node) && !trigger?.contains(event.target as Node)) open = false;
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  });
</script>

<div class="custom-select" class:open class:disabled>
  <button
    class="custom-select-trigger"
    type="button"
    aria-label={ariaLabel}
    aria-haspopup="listbox"
    aria-expanded={open}
    {disabled}
    bind:this={trigger}
    onclick={() => (open = !open)}
    onkeydown={onKeydown}
  >
    <span>{selected?.label ?? 'Choose an option'}</span>
    <Icon icon="lucide:chevron-down" width="18" height="18" aria-hidden="true" />
  </button>

  {#if open}
    <div class="custom-select-menu" role="listbox" aria-label={ariaLabel} bind:this={menu}>
      {#each options as option (option.value)}
        <button
          class="custom-select-option"
          class:selected={option.value === value}
          type="button"
          role="option"
          aria-selected={option.value === value}
          onclick={() => select(option.value)}
        >
          <span class="custom-select-check" aria-hidden="true">
            {#if option.value === value}<Icon icon="lucide:check" width="20" height="20" />{/if}
          </span>
          <span>{option.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
