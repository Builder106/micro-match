<script lang="ts">
  import Icon from "@iconify/svelte";
  import DecorativeLottie from '$lib/components/DecorativeLottie.svelte';
  import PublicShell from '$lib/components/PublicShell.svelte';
  import { page } from '$app/state';
  import { fly, fade } from 'svelte/transition';
  import { resolve } from '$app/paths';
  import { type Locale } from '$lib/locale';
  import { reducedMotion } from '$lib/utils/reducedMotion';
  import * as m from '$lib/paraglide/messages.js';

  let selectedDuration: '5' | '15' | '30' = '15';

  const sampleMissions = [
    {
      id: 1,
      duration: '5',
      minutes: 5,
      title: m.vol_mission_1_title,
      ngo: 'National Historical Trust',
      xp: '+25 XP',
      tags: [{ name: m.vol_mission_1_tag_1, bg: '#DBEAFE', color: '#172554' }, { name: m.vol_mission_1_tag_2, bg: '#FEF3C7', color: '#78350F' }]
    },
    {
      id: 2,
      duration: '5',
      minutes: 5,
      title: m.vol_mission_2_title,
      ngo: 'Ocean Conservation Alliance',
      xp: '+25 XP',
      tags: [{ name: m.vol_mission_2_tag_1, bg: '#FCE7F3', color: '#831843' }, { name: m.vol_mission_2_tag_2, bg: '#D1FAE5', color: '#064E3B' }]
    },
    {
      id: 3,
      duration: '15',
      minutes: 15,
      title: m.vol_mission_3_title,
      ngo: 'Doctors Without Borders',
      xp: '+50 XP',
      tags: [{ name: m.vol_mission_3_tag_1, bg: '#F3E8FF', color: '#581C87' }, { name: m.vol_mission_3_tag_2, bg: '#D1FAE5', color: '#064E3B' }]
    },
    {
      id: 4,
      duration: '15',
      minutes: 15,
      title: m.vol_mission_4_title,
      ngo: 'Global Literacy Fund',
      xp: '+50 XP',
      tags: [{ name: m.vol_mission_4_tag_1, bg: '#D1FAE5', color: '#064E3B' }, { name: m.vol_mission_4_tag_2, bg: '#FEF3C7', color: '#78350F' }]
    },
    {
      id: 5,
      duration: '30',
      minutes: 30,
      title: m.vol_mission_5_title,
      ngo: 'Clean City Project',
      xp: '+100 XP',
      tags: [{ name: m.vol_mission_5_tag_1, bg: '#FCE7F3', color: '#831843' }, { name: m.vol_mission_5_tag_2, bg: '#DBEAFE', color: '#172554' }]
    },
    {
      id: 6,
      duration: '30',
      minutes: 30,
      title: m.vol_mission_6_title,
      ngo: 'Reading for All',
      xp: '+100 XP',
      tags: [{ name: m.vol_mission_6_tag_1, bg: '#FEF3C7', color: '#78350F' }, { name: m.vol_mission_6_tag_2, bg: '#F3E8FF', color: '#581C87' }]
    }
  ];

  $: activeMissions = sampleMissions.filter((mission) => mission.duration === selectedDuration);

  const volunteerPillars = [
    {
      icon: 'lucide:clock',
      bg: '#D1FAE5',
      color: '#064E3B',
      tag: m.vol_pillar_1_tag,
      title: m.vol_pillar_1_title,
      desc: m.vol_pillar_1_description
    },
    {
      icon: 'lucide:zap',
      bg: '#DBEAFE',
      color: '#172554',
      tag: m.vol_pillar_2_tag,
      title: m.vol_pillar_2_title,
      desc: m.vol_pillar_2_description
    },
    {
      icon: 'lucide:trophy',
      bg: '#FFEDD5',
      color: '#7C2D12',
      tag: m.vol_pillar_3_tag,
      title: m.vol_pillar_3_title,
      desc: m.vol_pillar_3_description
    }
  ];

  const comparison = [
    {
      feature: m.vol_comparison_1_feature,
      traditional: m.vol_comparison_1_traditional,
      micromatch: m.vol_comparison_1_micromatch
    },
    {
      feature: m.vol_comparison_2_feature,
      traditional: m.vol_comparison_2_traditional,
      micromatch: m.vol_comparison_2_micromatch
    },
    {
      feature: m.vol_comparison_3_feature,
      traditional: m.vol_comparison_3_traditional,
      micromatch: m.vol_comparison_3_micromatch
    },
    {
      feature: m.vol_comparison_4_feature,
      traditional: m.vol_comparison_4_traditional,
      micromatch: m.vol_comparison_4_micromatch
    }
  ];

  /* eslint-disable-next-line svelte/no-immutable-reactive-statements */
  $: currentLocale = (page.data?.locale as Locale | undefined) ?? 'en';
  type StaticMessage = (inputs?: Record<string, never>, options?: { locale?: Locale }) => string;
  function t(message: StaticMessage) { return message({}, { locale: currentLocale }); }
</script>

<svelte:head>
  <title>{t(m.vol_meta_title)}</title>
  <meta name="description" content={t(m.vol_meta_description)} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<PublicShell activeTab="for-volunteers">
  <!-- ───── Warm Coral & Cream Hero ───── -->
  <section class="vol-hero">
    <div class="container vol-hero-grid">
      <div class="vol-hero-text">
        <div class="vol-pill">
          <Icon icon="lucide:heart-handshake" width="14" height="14" />
          <span>{t(m.vol_pill)}</span>
        </div>
        <h1>{t(m.vol_hero_title_lead)} <br /><span class="coral-gradient">{t(m.vol_hero_title_accent)}</span></h1>
        <p>{t(m.vol_hero_description)}</p>

        <div class="vol-hero-btns">
          <a href={resolve('/tasks', {})} class="btn-coral btn-lg">{t(m.vol_browse_missions)}</a>
          <a href="#interactive-feed" class="btn-outline-dark btn-lg">{t(m.vol_explore_caps)}</a>
        </div>
      </div>

      <div class="vol-hero-visual">
        <DecorativeLottie
          scene="volunteer-helping"
          src="/animations/volunteer-helping.json"
          aspectRatio="4 / 3"
        />
        <div class="hero-sample-task">
          <div class="hero-sample-task-head">
            <span>{t(m.vol_sample_task)}</span>
            <span class="hero-sample-task-time"><Icon icon="lucide:clock-3" width="14" height="14" />15 {t(m.minutes_short)}</span>
          </div>
          <p class="hero-sample-task-ngo">Doctors Without Borders</p>
          <h2>{t(m.vol_sample_task_title)}</h2>
          <p class="hero-sample-task-output">{t(m.vol_sample_task_output)}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ───── 3 Volunteer Pillar Cards ───── -->
  <section class="section-pillars">
    <div class="container">
      <div class="section-title">
        <h2>{t(m.vol_section_title)}</h2>
        <p>{t(m.vol_section_description)}</p>
      </div>

      <div class="pillars-grid">
        {#each volunteerPillars as p (p.title)}
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
        <h2>{t(m.vol_comparison_title)}</h2>
        <p>{t(m.vol_comparison_description)}</p>
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

  <!-- ───── Interactive Time-Cap Filter Tabs ───── -->
  <section class="section-missions-filter" id="interactive-feed">
    <div class="container">
      <div class="section-title">
        <h2>{t(m.vol_filter_title)}</h2>
        <p>{t(m.vol_filter_description)}</p>
      </div>

      <!-- Time Filter Selector Tabs -->
      <div class="filter-tabs">
        <button
          type="button"
          class="tab-btn"
          class:active={selectedDuration === '5'}
          on:click={() => (selectedDuration = '5')}
        >
          <Icon icon="lucide:clock" width="16" height="16" />
          <span>{t(m.vol_filter_5)}</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          class:active={selectedDuration === '15'}
          on:click={() => (selectedDuration = '15')}
        >
          <Icon icon="lucide:clock" width="16" height="16" />
          <span>{t(m.vol_filter_15)}</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          class:active={selectedDuration === '30'}
          on:click={() => (selectedDuration = '30')}
        >
          <Icon icon="lucide:clock" width="16" height="16" />
          <span>{t(m.vol_filter_30)}</span>
        </button>
      </div>

      <!-- Filtered Mission Cards Grid -->
      {#key selectedDuration}
        <div class="sample-grid" in:fly={{ y: 14, duration: $reducedMotion ? 0 : 300 }} out:fade={{ duration: $reducedMotion ? 0 : 150 }}>
          {#each activeMissions as task (task.id)}
            <div class="sample-task-card">
              <div class="st-top">
                <span class="st-ngo">{task.ngo}</span>
                <span class="st-time"><Icon icon="lucide:clock" width="14" height="14" /> {task.minutes} {t(m.minutes_short)}</span>
              </div>
              <h3>{t(task.title)}</h3>
              <div class="st-foot">
                <div class="st-tags">
                  {#each task.tags as tag (tag.name)}
                    <span style="background:{tag.bg};color:{tag.color}">{t(tag.name)}</span>
                  {/each}
                </div>
                <span class="st-xp">{task.xp}</span>
              </div>
              <a href={resolve('/tasks', {})} class="btn-dark-pill">{t(m.vol_claim_task)}</a>
            </div>
          {/each}
        </div>
      {/key}
    </div>
  </section>

  <!-- ───── CTA ───── -->
  <section class="vol-cta-section">
    <div class="container">
      <div class="cta-box">
        <h2>{t(m.vol_cta_title)}</h2>
        <p>{t(m.vol_cta_description)}</p>
        <div class="cta-actions">
          <a href={resolve('/signup', {})} class="btn-coral btn-lg">{t(m.vol_join)}</a>
          <a href={resolve('/tasks', {})} class="btn-outline-dark btn-lg">{t(m.browse_active_feed)}</a>
        </div>
      </div>
    </div>
  </section>
</PublicShell>

<style>
  /* Hero */
  .vol-hero {
    padding: 56px 0 64px;
    background: var(--color-background);
    width: 100%;
  }
  .vol-hero-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 40px;
    align-items: center;
  }
  @media (min-width: 1024px) {
    .vol-hero-grid { grid-template-columns: 1fr 1fr; gap: 40px; }
  }

  .vol-hero-text {
    max-width: 520px;
  }

  .vol-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    background: rgba(255, 107, 107, 0.12);
    border: 1px solid rgba(255, 107, 107, 0.2);
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 700;
    color: var(--color-primary-readable);
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(255,107,107,0.1);
  }
  .vol-hero-text h1 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(2.25rem, 4vw, 3.5rem);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: var(--color-text);
    margin: 0 0 16px;
  }
  .coral-gradient {
    color: var(--color-primary-readable);
  }
  .vol-hero-text p {
    font-size: 17px;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0 0 28px;
    max-width: 480px;
  }
  .vol-hero-btns {
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

  /* Hero illustration and sample task */
  .vol-hero-visual {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 20px;
    justify-content: flex-end;
  }
  .vol-hero-visual :global(.decorative-lottie) {
    max-width: 440px;
    width: 100%;
  }
  .hero-sample-task {
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--card-border-strong);
    border-radius: 20px;
    padding: 20px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
  }
  .hero-sample-task-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: var(--color-text-tertiary);
    font-size: 12px;
    font-weight: 700;
  }
  .hero-sample-task-time {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--color-primary-readable);
  }
  .hero-sample-task-ngo {
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 700;
    margin: 14px 0 6px;
  }
  .hero-sample-task h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; line-height: 1.35; margin: 0; }
  .hero-sample-task-output { color: var(--color-text-secondary); font-size: 13px; line-height: 1.5; margin: 10px 0 0; }
  @media (max-width: 1023px) {
    .vol-hero-visual { align-items: flex-start; }
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

  /* Filter Section */
  .section-missions-filter { padding: 96px 0; background: var(--color-background); width: 100%; }
  .filter-tabs { display: flex; justify-content: center; gap: 12px; margin-bottom: 48px; flex-wrap: wrap; }
  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 9999px;
    border: 1px solid var(--card-border-strong);
    background: var(--color-surface);
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .tab-btn:hover:not(.active) {
    border-color: var(--color-primary-readable);
    color: var(--color-primary-readable);
    transform: translateY(-2px);
  }
  .tab-btn.active {
    background: var(--color-primary);
    color: var(--color-brand-on-coral);
    border-color: var(--color-primary-readable);
    box-shadow: 0 4px 14px rgba(255, 107, 107, 0.25);
  }
  .tab-btn:active { transform: scale(0.96); }

  .sample-grid { display: grid; grid-template-columns: 1fr; gap: 28px; }
  @media (min-width: 768px) { .sample-grid { grid-template-columns: repeat(2, 1fr); } }

  .sample-task-card {
    background: var(--color-surface);
    border: 1px solid var(--card-border-strong);
    border-radius: 24px;
    padding: 28px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sample-task-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
    border-color: var(--color-primary-readable);
  }
  .st-top { display: flex; justify-content: space-between; align-items: center; }
  .st-ngo { font-size: 13px; font-weight: 700; color: var(--color-text-tertiary); }
  .st-time { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: var(--color-surface-variant); color: var(--color-primary-readable); border-radius: 9999px; font-size: 12px; font-weight: 700; }
  .st-time { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: var(--color-surface-variant); color: var(--color-text); border-radius: 9999px; font-size: 12px; font-weight: 700; }
  .sample-task-card h3 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; margin: 0; color: var(--color-text); }
  .st-foot { display: flex; justify-content: space-between; align-items: center; }
  .st-tags { display: flex; gap: 6px; }
  .st-tags span { padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
  .st-xp { font-size: 13px; font-weight: 800; color: #064E3B; }
  .st-xp { font-size: 13px; font-weight: 800; color: var(--color-success); }

  .btn-dark-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 12px 0;
    background: var(--color-text);
    color: var(--color-surface);
    font-weight: 700;
    font-size: 14px;
    border-radius: 9999px;
    text-decoration: none;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn-dark-pill:hover {
    background: var(--color-primary);
    color: #FFF;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(255, 107, 107, 0.3);
  }
  .btn-dark-pill:active { transform: scale(0.96); }

  /* CTA */
  .vol-cta-section { padding: 96px 0; background: var(--color-surface-variant); width: 100%; }
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
    color: var(--color-readable-coral-on-light);
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
