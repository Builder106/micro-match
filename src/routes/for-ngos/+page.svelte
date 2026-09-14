<script lang="ts">
  import Icon from "@iconify/svelte";
  import DecorativeLottie from '$lib/components/DecorativeLottie.svelte';
  import MissionPlanner from '$lib/components/MissionPlanner.svelte';
  import PublicShell from '$lib/components/PublicShell.svelte';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { type Locale } from '$lib/locale';
  import * as m from '$lib/paraglide/messages.js';

  const ngoPillars = [
    {
      icon: 'lucide:layers',
      bg: '#FFF5F0',
      color: '#881337',
      tag: m.ngo_pillar_1_tag,
      title: m.ngo_pillar_1_title,
      desc: m.ngo_pillar_1_description
    },
    {
      icon: 'lucide:shield-check',
      bg: '#D1FAE5',
      color: '#064E3B',
      tag: m.ngo_pillar_2_tag,
      title: m.ngo_pillar_2_title,
      desc: m.ngo_pillar_2_description
    },
    {
      icon: 'lucide:user-check',
      bg: '#FEF3C7',
      color: '#78350F',
      tag: m.ngo_pillar_3_tag,
      title: m.ngo_pillar_3_title,
      desc: m.ngo_pillar_3_description
    }
  ];

  const comparison = [
    {
      feature: m.ngo_comparison_1_feature,
      traditional: m.ngo_comparison_1_traditional,
      micromatch: m.ngo_comparison_1_micromatch
    },
    {
      feature: m.ngo_comparison_2_feature,
      traditional: m.ngo_comparison_2_traditional,
      micromatch: m.ngo_comparison_2_micromatch
    },
    {
      feature: m.ngo_comparison_3_feature,
      traditional: m.ngo_comparison_3_traditional,
      micromatch: m.ngo_comparison_3_micromatch
    },
    {
      feature: m.ngo_comparison_4_feature,
      traditional: m.ngo_comparison_4_traditional,
      micromatch: m.ngo_comparison_4_micromatch
    }
  ];

  /* eslint-disable-next-line svelte/no-immutable-reactive-statements */
  $: currentLocale = (page.data?.locale as Locale | undefined) ?? 'en';
  type StaticMessage = (inputs?: Record<string, never>, options?: { locale?: Locale }) => string;
  function t(message: StaticMessage) { return message({}, { locale: currentLocale }); }
</script>

<svelte:head>
  <title>{t(m.ngo_meta_title)}</title>
  <meta name="description" content={t(m.ngo_meta_description)} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<PublicShell activeTab="for-ngos">
  <!-- ───── Warm Coral & Cream Hero ───── -->
  <section class="ngo-hero">
    <div class="container ngo-hero-grid">
      <div class="ngo-hero-text">
        <div class="ngo-pill">
          <Icon icon="lucide:building-2" width="14" height="14" />
          <span>{t(m.ngo_pill)}</span>
        </div>
        <h1><span class="ngo-hero-title-lead">{t(m.ngo_hero_title_lead)}</span> <span class="coral-gradient ngo-hero-title-accent">{t(m.ngo_hero_title_accent)}</span></h1>
        <p>{t(m.ngo_hero_description)}</p>

        <div class="ngo-hero-btns">
          <a href={resolve('/signup', {})} class="btn-coral btn-lg">{t(m.ngo_create_profile)}</a>
          <a href="#backlog-calculator" class="btn-outline-dark btn-lg">{t(m.ngo_calculate_capacity)}</a>
        </div>
      </div>

      <div class="ngo-hero-visual">
        <DecorativeLottie
          scene="ngo-document-review"
          src="/animations/ngo-document-review.json"
          aspectRatio="4 / 3"
          loop={true}
        />
        <div class="hero-workflow">
          <span>{t(m.ngo_task_brief)}</span>
          <Icon icon="lucide:arrow-right" width="16" height="16" aria-hidden="true" />
          <span>{t(m.ngo_volunteer_submission)}</span>
          <Icon icon="lucide:arrow-right" width="16" height="16" aria-hidden="true" />
          <span>{t(m.ngo_review)}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ───── 3 NGO Pillar Cards ───── -->
  <section class="section-pillars">
    <div class="container">
      <div class="section-title">
        <h2>{t(m.ngo_section_title)}</h2>
        <p>{t(m.ngo_section_description)}</p>
      </div>

      <div class="pillars-grid">
        {#each ngoPillars as p (p.title)}
          <div class="pillar-card">
            <div class="pillar-icon" style="background: {p.bg}; color: {p.color};">
              <Icon icon={p.icon} width="28" height="28" />
            </div>
            <span class="pillar-tag" style="color: {p.color}; background: {p.bg};">{t(p.tag)}</span>
            <h3>{t(p.title)}</h3>
            <p>{t(p.desc)}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ───── Side-by-Side Comparison Matrix ───── -->
  <section class="section-comparison">
    <div class="container">
      <div class="section-title">
        <h2>{t(m.comparison_traditional)} vs. {t(m.comparison_micromatch)}</h2>
        <p>{t(m.ngo_comparison_description)}</p>
      </div>

      <div class="comp-table">
        <div class="comp-header">
          <div class="comp-cell feature">{t(m.comparison_feature)}</div>
          <div class="comp-cell old">{t(m.comparison_traditional)}</div>
          <div class="comp-cell new">
            <img src="/logo.png" alt={t(m.app_name)} class="comp-header-logo" width="22" height="22" />
            <span>{t(m.comparison_micromatch)}</span>
          </div>
        </div>

        {#each comparison as row (row.feature)}
          <div class="comp-row">
            <div class="comp-cell feature"><strong>{t(row.feature)}</strong></div>
            <div class="comp-cell old">
              <Icon icon="lucide:x-circle" width="16" height="16" class="icon-bad" />
              <span>{t(row.traditional)}</span>
            </div>
            <div class="comp-cell new">
              <Icon icon="lucide:check-circle-2" width="16" height="16" class="icon-good" />
              <span>{t(row.micromatch)}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ───── Backlog Mission Planner ───── -->
  <section class="section-calc" id="backlog-calculator">
    <div class="container">
      <MissionPlanner />
    </div>
  </section>

  <!-- ───── CTA ───── -->
  <section class="ngo-cta-section">
    <div class="container">
      <div class="cta-box">
        <h2>{t(m.ngo_cta_title)}</h2>
        <p>{t(m.ngo_cta_description)}</p>
        <div class="cta-actions">
          <a href={resolve('/signup', {})} class="btn-coral btn-lg">{t(m.ngo_register)}</a>
          <a href={resolve('/tasks', {})} class="btn-outline-dark btn-lg">{t(m.browse_platform_tasks)}</a>
        </div>
      </div>
    </div>
  </section>
</PublicShell>

<style>
  .ngo-hero {
    padding: 64px 0 80px;
    background: var(--color-background);
    width: 100%;
  }
  .ngo-hero-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 48px;
    align-items: center;
  }
  @media (min-width: 960px) {
    .ngo-hero-grid { grid-template-columns: 1.1fr 1fr; }
  }

  .ngo-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: rgba(255, 107, 107, 0.12);
    color: var(--color-primary-readable);
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 20px;
    border: 1px solid rgba(255, 107, 107, 0.2);
  }
  .ngo-hero-text h1 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(2.25rem, 4.5vw, 3.75rem);
    font-weight: 800;
    line-height: 1.1;
    color: var(--color-text);
    margin: 0 0 16px;
    text-wrap: balance;
    overflow-wrap: anywhere;
  }
  .ngo-hero-title-lead,
  .ngo-hero-title-accent { display: block; }
  .coral-gradient {
    color: var(--color-primary-readable);
  }
  .ngo-hero-text p {
    font-size: 17px;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0 0 28px;
    max-width: 480px;
  }
  .ngo-hero-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .btn-coral {
    display: inline-flex;
    align-items: center;
    padding: 14px 32px;
    background: var(--color-primary);
    color: var(--color-brand-on-coral);
    font-weight: 700;
    font-size: 15px;
    border-radius: 9999px;
    text-decoration: none;
    box-shadow: 0 4px 14px rgba(255, 107, 107, 0.25);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn-coral:hover {
    background: #ff5252;
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(255, 107, 107, 0.35);
  }
  .btn-coral:active { transform: scale(0.97); }

  .btn-outline-dark {
    display: inline-flex;
    align-items: center;
    padding: 14px 32px;
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--card-border-strong);
    font-weight: 700;
    font-size: 15px;
    border-radius: 9999px;
    text-decoration: none;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn-outline-dark:hover {
    transform: translateY(-2px);
    border-color: var(--color-primary-readable);
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  }
  .btn-outline-dark:active { transform: scale(0.97); }

  /* Hero illustration and review workflow */
  .ngo-hero-visual {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 20px;
    justify-content: flex-end;
  }
  .ngo-hero-visual :global(.decorative-lottie) {
    max-width: 440px;
    width: 100%;
  }
  .hero-workflow {
    background: var(--color-surface);
    border: 1px solid var(--card-border-strong);
    border-radius: 20px;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
    color: var(--color-text);
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    max-width: 440px;
    padding: 16px 20px;
    width: 100%;
    font-size: 13px;
    font-weight: 700;
  }
  .hero-workflow :global(svg) { color: var(--color-primary-readable); flex-shrink: 0; }
  @media (max-width: 959px) {
    .ngo-hero-visual { align-items: flex-start; }
    .hero-workflow { justify-content: flex-start; }
  }

  /* Pillars */
  .section-pillars {
    padding: 96px 0;
    background: var(--color-surface);
    width: 100%;
  }
  .section-title {
    text-align: center;
    max-width: 600px;
    margin: 0 auto 56px;
  }
  .section-title h2 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 32px;
    font-weight: 800;
    color: var(--color-text);
    margin: 0 0 12px;
  }
  .section-title p {
    font-size: 18px;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .pillars-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 28px;
  }
  @media (min-width: 768px) {
    .pillars-grid { grid-template-columns: repeat(3, 1fr); }
  }

  .pillar-card {
    background: var(--color-surface-variant);
    border: 1px solid var(--card-border-strong);
    border-radius: 28px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .pillar-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
    border-color: var(--color-primary-readable);
  }
  .pillar-icon {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .pillar-card:hover .pillar-icon {
    transform: scale(1.15) rotate(4deg);
  }
  .pillar-tag {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 12px;
    transition: transform 0.2s ease;
  }
  .pillar-card:hover .pillar-tag {
    transform: scale(1.05);
  }
  .pillar-card h3 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 10px;
  }
  .pillar-card p {
    font-size: 15px;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  /* Comparison */
  .section-comparison {
    padding: 96px 0;
    background: var(--color-surface-variant);
    width: 100%;
  }
  .comp-table {
    background: var(--color-surface);
    border: 1px solid var(--card-border-strong);
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.03);
  }
  .comp-header {
    display: grid;
    grid-template-columns: 1.2fr 1.4fr 1.4fr;
    background: var(--color-surface-variant);
    color: var(--color-text);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    font-size: 15px;
    padding: 20px 24px;
    border-bottom: 1px solid var(--card-border-strong);
  }
  .comp-row {
    display: grid;
    grid-template-columns: 1.2fr 1.4fr 1.4fr;
    padding: 20px 24px;
    border-bottom: 1px solid var(--card-border);
    align-items: center;
    font-size: 14px;
    transition: background 0.2s ease;
  }
  .comp-row:hover {
    background: rgba(255, 107, 107, 0.08);
  }
  .comp-row:last-child { border-bottom: none; }
  .comp-cell { display: flex; align-items: center; gap: 10px; }
  .comp-cell.old { color: var(--color-text-tertiary); }
  .comp-cell.new { color: var(--color-text); font-weight: 600; }
  .comp-header .comp-cell.new { color: var(--color-text); font-weight: 700; }
  .comp-header .comp-cell.old { color: var(--color-text-secondary); }
  .comp-header-logo { width: 22px; height: 22px; object-fit: contain; flex-shrink: 0; }
  :global(.icon-bad) { color: #DC2626; flex-shrink: 0; transition: transform 0.2s ease; }
  :global(.icon-good) { color: #059669; flex-shrink: 0; transition: transform 0.2s ease; }
  .comp-row:hover :global(.icon-good) { transform: scale(1.2); }
  .comp-row:hover :global(.icon-bad) { transform: scale(1.1); }

  @media (max-width: 768px) {
    .comp-header { display: none; }
    .comp-row { grid-template-columns: 1fr; gap: 12px; }
  }

  .section-calc {
    padding: 96px 0;
    background: var(--color-background);
    width: 100%;
  }

  /* CTA */
  .ngo-cta-section { padding: 96px 0; background: var(--color-surface-variant); width: 100%; }
  .cta-box {
    background: var(--color-primary);
    color: var(--color-action-on-coral);
    border-radius: 36px;
    padding: clamp(40px, 6vw, 64px);
    text-align: center;
    box-shadow: 0 20px 50px rgba(255, 107, 107, 0.25);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .cta-box:hover {
    transform: translateY(-4px);
    box-shadow: 0 28px 60px rgba(255, 107, 107, 0.35);
  }
  .cta-box h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: clamp(1.8rem, 3vw, 2.75rem); font-weight: 800; color: var(--color-action-on-coral); margin: 0 0 12px; }
  .cta-box p { font-size: 18px; color: var(--color-action-on-coral); margin: 0 0 32px; }
  .cta-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
  .cta-actions .btn-coral {
    background: #FFFFFF;
    color: #881337;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .cta-actions .btn-coral:hover {
    background: #FFF;
    color: #E85555;
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  }
  .cta-actions .btn-outline-dark {
    background: transparent;
    color: var(--color-action-on-coral);
    border-color: var(--color-action-on-coral);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .cta-actions .btn-outline-dark:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: var(--color-action-on-coral);
    transform: translateY(-2px) scale(1.03);
  }
</style>
