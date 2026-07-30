<script lang="ts">
  import Icon from "@iconify/svelte";
  import PublicShell from '$lib/components/PublicShell.svelte';
  import { fly, fade } from 'svelte/transition';

  let selectedDuration: '5' | '15' | '30' = '15';

  const sampleMissions = [
    {
      id: 1,
      duration: '5',
      timeLabel: '5 min',
      title: 'Tag 10 historical photos for digital archive',
      ngo: 'National Historical Trust',
      xp: '+25 XP',
      tags: [{ name: '#history', bg: '#DBEAFE', color: '#2563EB' }, { name: '#data', bg: '#FEF3C7', color: '#D97706' }]
    },
    {
      id: 2,
      duration: '5',
      timeLabel: '5 min',
      title: 'Proofread 3 social media announcement captions',
      ngo: 'Ocean Conservation Alliance',
      xp: '+25 XP',
      tags: [{ name: '#writing', bg: '#FCE7F3', color: '#DB2777' }, { name: '#environment', bg: '#D1FAE5', color: '#059669' }]
    },
    {
      id: 3,
      duration: '15',
      timeLabel: '15 min',
      title: 'Translate medical dosage flyer to Spanish',
      ngo: 'Doctors Without Borders',
      xp: '+50 XP',
      tags: [{ name: '#spanish', bg: '#F3E8FF', color: '#7C3AED' }, { name: '#health', bg: '#D1FAE5', color: '#059669' }]
    },
    {
      id: 4,
      duration: '15',
      timeLabel: '15 min',
      title: 'Audit Excel spreadsheet for missing donor ZIP codes',
      ngo: 'Global Literacy Fund',
      xp: '+50 XP',
      tags: [{ name: '#excel', bg: '#D1FAE5', color: '#059669' }, { name: '#data', bg: '#FEF3C7', color: '#D97706' }]
    },
    {
      id: 5,
      duration: '30',
      timeLabel: '30 min',
      title: 'Design 2 Canva Instagram graphics for cleanup drive',
      ngo: 'Clean City Project',
      xp: '+100 XP',
      tags: [{ name: '#design', bg: '#FCE7F3', color: '#DB2777' }, { name: '#media', bg: '#DBEAFE', color: '#2563EB' }]
    },
    {
      id: 6,
      duration: '30',
      timeLabel: '30 min',
      title: 'Research top 5 youth literacy non-profit statistics',
      ngo: 'Reading for All',
      xp: '+100 XP',
      tags: [{ name: '#research', bg: '#FEF3C7', color: '#D97706' }, { name: '#education', bg: '#F3E8FF', color: '#7C3AED' }]
    }
  ];

  $: activeMissions = sampleMissions.filter(m => m.duration === selectedDuration);

  const volunteerPillars = [
    {
      icon: 'lucide:clock',
      bg: '#D1FAE5',
      color: '#059669',
      tag: '5–30 Minute Caps',
      title: 'Bite-sized missions',
      desc: 'Every task is scoped to 5, 15, or 30 minutes with clear time estimates upfront. Fit impact into spare study gaps, commutes, or coffee breaks.'
    },
    {
      icon: 'lucide:zap',
      bg: '#DBEAFE',
      color: '#2563EB',
      tag: 'Zero Onboarding',
      title: 'Claim, learn, and submit',
      desc: 'No interviews or background checks required. Claim a task, read embedded contextual guides, and submit link or document proof straight from your device.'
    },
    {
      icon: 'lucide:trophy',
      bg: '#FFEDD5',
      color: '#EA580C',
      tag: 'Gamified Growth',
      title: 'Badges and XP vault',
      desc: 'Approved work awards XP level-ups and mints custom NGO achievement badges into your public portfolio, proving your real-world contribution history.'
    }
  ];

  const comparison = [
    {
      feature: 'Commitment Level',
      traditional: 'Fixed weekly hours (5–10 hrs/week for months)',
      micromatch: 'Bite-sized 5 to 30-minute self-contained tasks'
    },
    {
      feature: 'Getting Started',
      traditional: 'Long background checks, interviews & orientation',
      micromatch: 'Instant access to task feed with zero onboarding drag'
    },
    {
      feature: 'Skill Prerequisites',
      traditional: 'Requires pre-existing specialized experience',
      micromatch: 'Embedded just-in-time reference guides & glossaries'
    },
    {
      feature: 'Proof of Impact',
      traditional: 'Unverified resume bullet points',
      micromatch: 'Public digital portfolio with verified badges & XP'
    }
  ];
</script>

<svelte:head>
  <title>For Volunteers | MicroMatch</title>
  <meta name="description" content="Turn spare coffee breaks into real impact. Earn badges, level up your profile, and support global NGOs." />
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
          <span>For Volunteers</span>
        </div>
        <h1>Real impact in a <br /><span class="coral-gradient">coffee break.</span></h1>
        <p>
          Turn spare minutes into verified change. Learn new skills, support world-changing non-profits, and build your digital volunteer portfolio—one micro-mission at a time.
        </p>

        <div class="vol-hero-btns">
          <a href="/tasks" class="btn-coral btn-lg">Browse Micro-Missions</a>
          <a href="#interactive-feed" class="btn-outline-dark btn-lg">Explore Time Caps ↓</a>
        </div>
      </div>

      <!-- Floating Volunteer Vault Card Mockup -->
      <div class="vol-hero-visual">
        <div class="vault-card">
          <div class="vc-top">
            <div class="vc-user">
              <div class="vc-avatar">
                <Icon icon="lucide:smile" width="24" height="24" style="color:#FF6B6B" />
              </div>
              <div>
                <strong>Elena Vance</strong>
                <span class="vc-lvl">Level 12 Volunteer</span>
              </div>
            </div>
            <span class="vc-xp">1,450 XP</span>
          </div>

          <div class="vc-badges">
            <div class="badge-box gold">
              <Icon icon="lucide:trophy" width="22" height="22" />
              <span>Speed Demon</span>
            </div>
            <div class="badge-box blue">
              <Icon icon="lucide:globe" width="22" height="22" />
              <span>Global Citizen</span>
            </div>
            <div class="badge-box green">
              <Icon icon="lucide:sparkles" width="22" height="22" />
              <span>Perfect Week</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ───── 3 Volunteer Pillar Cards ───── -->
  <section class="section-pillars">
    <div class="container">
      <div class="section-title">
        <h2>Volunteering Designed for Busy Lives</h2>
        <p>Three pillars that make contributing friction-free and rewarding.</p>
      </div>

      <div class="pillars-grid">
        {#each volunteerPillars as p}
          <div class="pillar-card">
            <div class="pillar-icon" style="background: {p.bg}; color: {p.color};">
              <Icon icon={p.icon} width="28" height="28" />
            </div>
            <span class="pillar-tag" style="color: {p.color}; background: {p.bg};">{p.tag}</span>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ───── Side-by-Side Comparison Matrix ───── -->
  <section class="section-comparison">
    <div class="container">
      <div class="section-title">
        <h2>Traditional Volunteering vs. MicroMatch</h2>
        <p>Compare how micro-missions fit into your daily schedule.</p>
      </div>

      <div class="comp-table">
        <div class="comp-header">
          <div class="comp-cell feature">Feature</div>
          <div class="comp-cell old">Traditional Volunteering</div>
          <div class="comp-cell new">MicroMatch Platform</div>
        </div>

        {#each comparison as row}
          <div class="comp-row">
            <div class="comp-cell feature"><strong>{row.feature}</strong></div>
            <div class="comp-cell old">
              <Icon icon="lucide:x-circle" width="16" height="16" class="icon-bad" />
              <span>{row.traditional}</span>
            </div>
            <div class="comp-cell new">
              <Icon icon="lucide:check-circle-2" width="16" height="16" class="icon-good" />
              <span>{row.micromatch}</span>
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
        <h2>Pick Something That Fits Your Schedule</h2>
        <p>Filter active sample tasks by duration cap.</p>
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
          <span>5-Minute Quickies</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          class:active={selectedDuration === '15'}
          on:click={() => (selectedDuration = '15')}
        >
          <Icon icon="lucide:clock" width="16" height="16" />
          <span>15-Minute Missions</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          class:active={selectedDuration === '30'}
          on:click={() => (selectedDuration = '30')}
        >
          <Icon icon="lucide:clock" width="16" height="16" />
          <span>30-Minute Deep Impact</span>
        </button>
      </div>

      <!-- Filtered Mission Cards Grid -->
      {#key selectedDuration}
        <div class="sample-grid" in:fly={{ y: 14, duration: 300 }} out:fade={{ duration: 150 }}>
          {#each activeMissions as task (task.id)}
            <div class="sample-task-card">
              <div class="st-top">
                <span class="st-ngo">{task.ngo}</span>
                <span class="st-time"><Icon icon="lucide:clock" width="14" height="14" /> {task.timeLabel}</span>
              </div>
              <h3>{task.title}</h3>
              <div class="st-foot">
                <div class="st-tags">
                  {#each task.tags as tag}
                    <span style="background:{tag.bg};color:{tag.color}">{tag.name}</span>
                  {/each}
                </div>
                <span class="st-xp">{task.xp}</span>
              </div>
              <a href="/tasks" class="btn-dark-pill">Claim Task</a>
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
        <h2>Start your micro-volunteering streak today.</h2>
        <p>Create your volunteer profile and claim your first 5-minute task in minutes.</p>
        <div class="cta-actions">
          <a href="/signup" class="btn-coral btn-lg">Join as Volunteer</a>
          <a href="/tasks" class="btn-outline-dark btn-lg">Browse Active Feed</a>
        </div>
      </div>
    </div>
  </section>
</PublicShell>

<style>
  /* Hero */
  .vol-hero {
    padding: 56px 0 64px;
    background: #FDFCF8;
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
    background: #FFF;
    border: 1px solid #FFD1C2;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 700;
    color: #FF6B6B;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(255,107,107,0.1);
  }
  .vol-hero-text h1 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(2.25rem, 4vw, 3.5rem);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: #0F172A;
    margin: 0 0 16px;
  }
  .coral-gradient {
    background: linear-gradient(135deg, #FF6B6B, #FF9E5E);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .vol-hero-text p {
    font-size: 17px;
    color: #475569;
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
    background: #FF6B6B;
    color: #FFF;
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
    background: #FFF;
    color: #0F172A;
    border: 1px solid #CBD5E1;
    font-weight: 700;
    font-size: 15px;
    border-radius: 9999px;
    text-decoration: none;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn-outline-dark:hover {
    transform: translateY(-2px);
    border-color: #94A3B8;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  }
  .btn-outline-dark:active { transform: scale(0.97); }

  /* Vault Card Mockup */
  .vol-hero-visual {
    display: flex;
    justify-content: flex-end;
  }
  .vault-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 28px;
    padding: 28px;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .vault-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 28px 60px rgba(15, 23, 42, 0.12);
    border-color: #CBD5E1;
  }
  .vc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .vc-user { display: flex; align-items: center; gap: 12px; }
  .vc-avatar { width: 44px; height: 44px; border-radius: 50%; background: #FFF5F0; display: flex; align-items: center; justify-content: center; transition: transform 0.2s ease; }
  .vault-card:hover .vc-avatar { transform: scale(1.1) rotate(6deg); }
  .vc-user strong { display: block; font-size: 15px; color: #0F172A; }
  .vc-lvl { font-size: 12px; color: #64748B; font-weight: 600; }
  .vc-xp { background: #059669; color: #FFF; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; }

  .vc-badges { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .badge-box {
    padding: 16px 10px;
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 700;
    color: #FFF;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .badge-box:hover {
    transform: scale(1.08) rotate(3deg);
  }
  .badge-box.gold { background: linear-gradient(135deg, #FDE68A, #F59E0B); color: #78350F; }
  .badge-box.blue { background: linear-gradient(135deg, #93C5FD, #2563EB); }
  .badge-box.green { background: linear-gradient(135deg, #6EE7B7, #059669); }

  /* Pillars */
  .section-pillars {
    padding: 96px 0;
    background: #FFFFFF;
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
    color: #0F172A;
    margin: 0 0 12px;
  }
  .section-title p {
    font-size: 18px;
    color: #64748B;
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
    background: #FDFCF8;
    border: 1px solid #E2E8F0;
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
    border-color: #FF6B6B;
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
    color: #0F172A;
    margin: 0 0 10px;
  }
  .pillar-card p {
    font-size: 15px;
    color: #475569;
    line-height: 1.6;
    margin: 0;
  }

  /* Comparison */
  .section-comparison {
    padding: 96px 0;
    background: #FAF7F0;
    width: 100%;
  }
  .comp-table {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.03);
  }
  .comp-header {
    display: grid;
    grid-template-columns: 1.2fr 1.4fr 1.4fr;
    background: #0F172A;
    color: #FFFFFF;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    font-size: 15px;
    padding: 20px 24px;
  }
  .comp-row {
    display: grid;
    grid-template-columns: 1.2fr 1.4fr 1.4fr;
    padding: 20px 24px;
    border-bottom: 1px solid #E2E8F0;
    align-items: center;
    font-size: 14px;
    transition: background 0.2s ease;
  }
  .comp-row:hover {
    background: #FFF5F0;
  }
  .comp-row:last-child { border-bottom: none; }
  .comp-cell { display: flex; align-items: center; gap: 10px; }
  .comp-cell.old { color: #64748B; }
  .comp-cell.new { color: #0F172A; font-weight: 600; }
  :global(.icon-bad) { color: #DC2626; flex-shrink: 0; transition: transform 0.2s ease; }
  :global(.icon-good) { color: #059669; flex-shrink: 0; transition: transform 0.2s ease; }
  .comp-row:hover :global(.icon-good) { transform: scale(1.2); }
  .comp-row:hover :global(.icon-bad) { transform: scale(1.1); }

  @media (max-width: 768px) {
    .comp-header { display: none; }
    .comp-row { grid-template-columns: 1fr; gap: 12px; }
  }

  /* Filter Section */
  .section-missions-filter { padding: 96px 0; background: #FFFFFF; width: 100%; }
  .filter-tabs { display: flex; justify-content: center; gap: 12px; margin-bottom: 48px; flex-wrap: wrap; }
  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 9999px;
    border: 1px solid #CBD5E1;
    background: #FFF;
    font-size: 14px;
    font-weight: 700;
    color: #475569;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .tab-btn:hover:not(.active) {
    border-color: #FF6B6B;
    color: #FF6B6B;
    transform: translateY(-2px);
  }
  .tab-btn.active {
    background: #FF6B6B;
    color: #FFF;
    border-color: #FF6B6B;
    box-shadow: 0 4px 14px rgba(255, 107, 107, 0.25);
  }
  .tab-btn:active { transform: scale(0.96); }

  .sample-grid { display: grid; grid-template-columns: 1fr; gap: 28px; }
  @media (min-width: 768px) { .sample-grid { grid-template-columns: repeat(2, 1fr); } }

  .sample-task-card {
    background: #FDFCF8;
    border: 1px solid #E2E8F0;
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
    border-color: #FF6B6B;
  }
  .st-top { display: flex; justify-content: space-between; align-items: center; }
  .st-ngo { font-size: 13px; font-weight: 700; color: #64748B; }
  .st-time { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #FFF5F0; color: #FF6B6B; border-radius: 9999px; font-size: 12px; font-weight: 700; }
  .sample-task-card h3 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; margin: 0; color: #0F172A; }
  .st-foot { display: flex; justify-content: space-between; align-items: center; }
  .st-tags { display: flex; gap: 6px; }
  .st-tags span { padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
  .st-xp { font-size: 13px; font-weight: 800; color: #059669; }

  .btn-dark-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 12px 0;
    background: #0F172A;
    color: #FFF;
    font-weight: 700;
    font-size: 14px;
    border-radius: 9999px;
    text-decoration: none;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn-dark-pill:hover {
    background: #FF6B6B;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(255, 107, 107, 0.3);
  }
  .btn-dark-pill:active { transform: scale(0.96); }

  /* CTA */
  .vol-cta-section { padding: 96px 0; background: #FAF7F0; width: 100%; }
  .cta-box {
    background: linear-gradient(135deg, #FF6B6B, #E85555);
    color: #FFFFFF;
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
  .cta-box h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: clamp(1.8rem, 3vw, 2.75rem); font-weight: 800; color: #FFFFFF; margin: 0 0 12px; }
  .cta-box p { font-size: 18px; color: rgba(255, 255, 255, 0.9); margin: 0 0 32px; }
  .cta-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
  .cta-actions .btn-coral {
    background: #FFFFFF;
    color: #FF6B6B;
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
    color: #FFFFFF;
    border-color: rgba(255, 255, 255, 0.4);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .cta-actions .btn-outline-dark:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: #FFFFFF;
    transform: translateY(-2px) scale(1.03);
  }
</style>
