<script lang="ts">
  import PublicShell from '$lib/components/PublicShell.svelte';
  import HandoffTable from '$lib/components/HandoffTable.svelte';
  import { page } from '$app/state';
  import { type Locale } from '$lib/locale';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  const locale = $derived((page.data?.locale as Locale | undefined) ?? 'en');
  type StaticMessage = (inputs?: Record<string, never>, options?: { locale?: Locale }) => string;
  const t = (message: StaticMessage) => message({}, { locale });
</script>

<svelte:head>
  <title>{t(m.home_meta_title)}</title>
  <meta name="description" content={t(m.home_meta_description)} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<PublicShell activeTab="home">
  <HandoffTable tasks={data.tasks ?? []} {locale} role={page.data.userRole ?? null} />
</PublicShell>
