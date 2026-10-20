<script lang="ts">
  import '$styles/tokens.css';
  import '$styles/base.css';
  import '$styles/world.css';
  import { tick } from 'svelte';
  import { page } from '$app/state';
  import { afterNavigate, beforeNavigate, onNavigate } from '$app/navigation';
  import QuiltWorld from '$lib/components/world/QuiltWorld.svelte';
  import Panel from '$lib/components/world/Panel.svelte';
  import CornerTags from '$lib/components/world/CornerTags.svelte';
  import { block, blockForPath, panelKindForPath, type BlockId } from '$lib/quilt/world';
  import { canonicalPath } from '$lib/site';
  import { contentIn, contentOut, fold, unfold, resetPanelScroll, smoothPanel, stopSmoothPanel } from '$engine';
  import * as m from '$lib/paraglide/messages.js';

  let { children, data } = $props();

  const kind = $derived(panelKindForPath(page.url.pathname));
  const currentBlock = $derived(blockForPath(page.url.pathname));
  const signedIn = $derived(data.userRole !== 'anonymous');

  const names: Record<BlockId, () => string> = {
    title: m.block_title_name,
    community: m.block_community_title,
    tasks: m.block_tasks_title,
    how: m.block_how_title,
    volunteers: m.block_volunteers_title,
    nonprofits: m.block_nonprofits_title,
    account: m.block_account_title,
    about: m.block_about_title,
    contact: m.block_contact_title,
    help: m.block_help_title,
    docs: m.block_docs_title,
    api: m.block_api_title,
    label: m.block_label_name
  };
  const blockName = $derived(currentBlock ? names[currentBlock]() : page.status >= 400 ? m.missing_name() : m.tag_contents());
  const where = $derived(
    page.status >= 400
      ? m.where_missing()
      : currentBlock
        ? m.where_block({ name: names[currentBlock]() })
        : canonicalPath(page.url.pathname) === '/contents'
          ? m.where_contents()
          : m.tag_on_quilt()
  );

  // The block lifted out of the quilt. It changes after the flight, not before, so the panel
  // can unfold from the block's real place and fold back into its hole.
  let openId = $state<BlockId | null>(blockForPath(page.url.pathname));
  let world = $state<ReturnType<typeof QuiltWorld>>();
  let panel = $state<HTMLElement>();
  let scroller = $state<HTMLElement>();
  let content = $state<HTMLElement>();

  const desktop = () => matchMedia('(min-width: 900px)').matches;
  const samePage = (a?: URL | null, b?: URL | null) => !!a && !!b && a.pathname === b.pathname;
  let pending: Promise<unknown> | null = null;

  beforeNavigate((nav) => {
    if (!nav.to || nav.willUnload || samePage(nav.from?.url, nav.to.url) || !panel) return;
    const toPanel = panelKindForPath(nav.to.url.pathname);
    stopSmoothPanel();
    pending = toPanel ? contentOut(panel) : fold(panel, world?.rectOf(openId) ?? null);
  });

  onNavigate(async () => {
    if (pending) await pending;
    pending = null;
  });

  afterNavigate(async (nav) => {
    const path = page.url.pathname;
    const toKind = panelKindForPath(path);
    const id = blockForPath(path);
    const fresh = nav.type === 'enter';
    if (!fresh && samePage(nav.from?.url, nav.to?.url)) return;
    const fromKind = nav.from ? panelKindForPath(nav.from.url.pathname) : null;

    if (!toKind) {
      openId = null;
      world?.lookAt(path, 0);
      // The quilt stops being inert once the panel is gone; focus the block after that update.
      await tick();
      document.querySelector<HTMLElement>(`[data-block="${nav.from ? blockForPath(nav.from.url.pathname) : ''}"] a`)?.focus({ preventScroll: true });
      return;
    }

    await tick();
    const room = desktop() ? (panel?.offsetWidth ?? 0) + 16 : 0;
    world?.lookAt(path, room, fresh);
    if (!fresh && panel) {
      if (fromKind) {
        openId = id;
        if (scroller) resetPanelScroll(scroller);
        void contentIn(panel);
      } else {
        const from = world?.rectOf(id) ?? null;
        openId = id;
        void unfold(panel, from);
      }
      panel.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    } else {
      openId = id;
    }
    if (toKind === 'read' && desktop() && scroller && content) smoothPanel(scroller, content);
  });

  function onKey(e: KeyboardEvent) {
    if (e.key !== 'Escape' || !kind || e.defaultPrevented) return;
    if ((e.target as HTMLElement).closest('dialog, [role="dialog"]')) return;
    document.querySelector<HTMLAnchorElement>('[data-fold]')?.click();
  }
</script>

<svelte:window onkeydown={onKey} />

<a class="skip-link" href="#main">{m.skip_to_content()}</a>
<CornerTags {where} {signedIn} role={data.userRole} hasPanel={!!kind} />

<main id="main" tabindex="-1" class:has-panel={!!kind} data-kind={kind ?? undefined}>
  {#if kind}
    <Panel {kind} def={currentBlock ? block(currentBlock) : null} where={blockName} bind:panel bind:scroller bind:content>
      {@render children()}
    </Panel>
  {:else}
    {@render children()}
  {/if}

  <QuiltWorld
    bind:this={world}
    patches={data.quilt.patches}
    total={data.quilt.total}
    tasks={data.openTasks.preview}
    taskCount={data.openTasks.count}
    {signedIn}
    role={data.userRole}
    {openId}
    hasPanel={!!kind}
  />
</main>
