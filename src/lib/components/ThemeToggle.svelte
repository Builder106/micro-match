<script lang="ts">
  import Icon from '@iconify/svelte';
  import { onMount } from 'svelte';
  export let compact: boolean = false;

  let theme: 'light' | 'dark' = 'light';

  function applyTheme(next: 'light' | 'dark') {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(next);
    localStorage.setItem('theme', next);
    theme = next;
  }

  function toggleTheme() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }

  onMount(() => {
    const saved = (localStorage.getItem('theme') as 'light' | 'dark' | null);
    if (saved === 'light' || saved === 'dark') {
      applyTheme(saved);
    } else {
      const isDarkActive = document.documentElement.classList.contains('dark') ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      applyTheme(isDarkActive ? 'dark' : 'light');
    }
  });
</script>

<button
  type="button"
  class="theme-toggle"
  class:compact={compact}
  aria-label="Toggle color theme"
  onclick={toggleTheme}
  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
>
  {#if compact}
    <Icon icon={theme === 'dark' ? 'mdi:weather-sunny' : 'mdi:weather-night'} width="20" height="20" />
  {:else}
    <Icon icon={theme === 'dark' ? 'mdi:weather-sunny' : 'mdi:weather-night'} width="20" height="20" />
    <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
  {/if}
</button>

<style>
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-lg);
    border: 1px solid var(--card-border-strong);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    text-decoration: none;
  }

  .theme-toggle.compact {
    width: 40px;
    height: 40px;
    padding: 0;
    justify-content: center;
    border-radius: 9999px;
  }

  .theme-toggle:hover {
    box-shadow: var(--elev-1);
    border-color: var(--color-primary-readable);
    transform: translateY(-1px);
  }
</style>
