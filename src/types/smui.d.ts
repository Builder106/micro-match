declare module '@smui/top-app-bar' {
  import type { SvelteComponent } from 'svelte';

  export type TopAppBarProps = {
    variant?: 'fixed' | 'prominent' | 'dense' | 'short' | 'standard';
    color?: 'primary' | 'secondary' | 'default';
    class?: string;
    [key: string]: string | number | boolean | null | undefined;
  };
  export type TopAppBarEvents = { [eventName: string]: CustomEvent<Record<string, string | number | boolean | null> | null> };
  export type TopAppBarSlots = {
    default?: {};
    navigation?: {};
    title?: {};
    actions?: {};
  };

  export default class TopAppBar extends SvelteComponent<
    TopAppBarProps,
    TopAppBarEvents,
    TopAppBarSlots
  > {}
}

