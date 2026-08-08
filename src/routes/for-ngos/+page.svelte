<script lang="ts">
  import Icon from "@iconify/svelte";
  import PublicShell from '$lib/components/PublicShell.svelte';

  // Backlog Calculator State
  let weeklyBacklogHours = 12;
  let avgTaskMinutes = 15;

  $: tasksCount = Math.round((weeklyBacklogHours * 60) / avgTaskMinutes);
  $: volunteersEngaged = Math.round(tasksCount * 0.85);
  $: estTurnaroundHours = avgTaskMinutes <= 15 ? 12 : 24;

  const ngoPillars = [
    {
      icon: 'lucide:layers',
      bg: '#FFF5F0',
      color: '#FF6B6B',
      tag: 'Micro-Scoped Work',
      title: 'Post tasks, not job openings',
      desc: 'Break down your backlog into 5 to 30-minute units — translation, photo tagging, data audits — getting reviewable work done without recruitment drag.'
    },
    {
      icon: 'lucide:shield-check',
      bg: '#D1FAE5',
      color: '#059669',
      tag: 'IRS Trust Signal',
      title: 'ProPublica NGO verification',
      desc: 'Submit your tax/charity EIN to earn soft-gated NGO verification. Verified status back-fills a prominent trust badge across all your posted tasks.'
    },
    {
      icon: 'lucide:user-check',
      bg: '#FEF3C7',
      color: '#D97706',
      tag: 'Quality Control',
      title: 'Human-in-the-loop review',
      desc: 'Maintain 100% control over quality. Every submission is routed to your moderation queue before approval, badge minting, or public recognition.'
    }
  ];

  const comparison = [
    {
      feature: 'Onboarding & Setup',
      traditional: '2–4 weeks of background checks & interviews',
      micromatch: 'Instant task posting with zero volunteer onboarding drag'
    },
    {
      feature: 'Task Scope',
      traditional: 'Ongoing weekly commitments (5–10 hrs/week)',
      micromatch: 'Bite-sized 5 to 30-minute self-contained missions'
    },
    {
      feature: 'Quality Control',
      traditional: 'Unstructured email attachments & manual tracking',
      micromatch: 'Moderation dashboard with single-click approve/reject'
    },
    {
      feature: 'Volunteer Retention',
      traditional: 'High drop-off rate after 1–2 months',
      micromatch: 'Gamified XP & custom badges keep volunteers returning'
    }
  ];
</script>

<svelte:head>
  <title>For NGOs | MicroMatch</title>
  <meta name="description" content="Clear your non-profit backlog in minutes with verified volunteer submissions." />
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
          <span>For Non-Profits & NGOs</span>
        </div>
        <h1>Post tasks, <br /><span class="coral-gradient">not job openings.</span></h1>
        <p>
          Clear the small stuff that never gets done. MicroMatch lets NGOs break down backlogs into 5 to 30-minute micro-tasks completed by eager, skilled volunteers worldwide.
        </p>

        <div class="ngo-hero-btns">
          <a href="/signup" class="btn-coral btn-lg">Create NGO Profile</a>
          <a href="#backlog-calculator" class="btn-outline-dark btn-lg">Calculate Capacity ↓</a>
        </div>
      </div>

      <!-- Floating NGO Card Mockup -->
      <div class="ngo-hero-visual">
        <div class="ngo-card-mockup">
          <div class="ncm-top">
            <div class="ncm-verified-chip">
              <Icon icon="lucide:badge-check" width="16" height="16" style="color:#059669" />
              <span>IRS 501(c)(3) Verified NGO</span>
            </div>
            <span class="ncm-count">142 Tasks Completed</span>
          </div>

          <div class="ncm-body">
            <h3>Doctors Without Borders</h3>
            <p class="ncm-desc">Global medical humanitarian aid organization.</p>

            <div class="ncm-queue">
              <div class="nq-head">
                <Icon icon="lucide:inbox" width="14" height="14" />
                <span>Active Task Queue</span>
              </div>
              <div class="nq-item">
                <span>Medical Flyer Spanish Translation (15m)</span>
                <span class="nq-badge">Approved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ───── 3 NGO Pillar Cards ───── -->
  <section class="section-pillars">
    <div class="container">
      <div class="section-title">
        <h2>Built for Non-Profit Agility</h2>
        <p>Three pillars designed to clear your backlog with trust and human quality control.</p>
      </div>

      <div class="pillars-grid">
        {#each ngoPillars as p (p.title)}
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
        <p>See why micro-tasks yield faster turnaround and zero recruitment overhead.</p>
      </div>

      <div class="comp-table">
        <div class="comp-header">
          <div class="comp-cell feature">Feature</div>
          <div class="comp-cell old">Traditional Volunteering</div>
          <div class="comp-cell new">
            <img src="/logo.png" alt="MicroMatch" class="comp-header-logo" width="22" height="22" />
            <span>MicroMatch</span>
          </div>
        </div>

        {#each comparison as row (row.feature)}
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

  <!-- ───── Backlog Capacity Calculator ───── -->
  <section class="section-calc" id="backlog-calculator">
    <div class="container">
      <div class="calc-card">
        <div class="calc-head">
          <div class="calc-tag">
            <Icon icon="lucide:calculator" width="14" height="14" />
            <span>Capacity Calculator</span>
          </div>
          <h2>Estimate Your Backlog Acceleration</h2>
          <p>Adjust parameters to see how quickly volunteers can complete your workload.</p>
        </div>

        <div class="calc-grid">
          <div class="calc-controls">
            <div class="slider-group">
              <div class="slider-head">
                <span>Weekly Workload</span>
                <strong>{weeklyBacklogHours} Hours / Week</strong>
              </div>
              <input
                type="range"
                min="2"
                max="40"
                step="1"
                bind:value={weeklyBacklogHours}
                class="range-input"
              />
            </div>

            <div class="slider-group">
              <div class="slider-head">
                <span>Micro-Task Duration</span>
                <strong>{avgTaskMinutes} Minutes / Mission</strong>
              </div>
              <div class="duration-chips">
                <button
                  type="button"
                  class="dur-chip"
                  class:selected={avgTaskMinutes === 5}
                  on:click={() => (avgTaskMinutes = 5)}
                >
                  5 Min
                </button>
                <button
                  type="button"
                  class="dur-chip"
                  class:selected={avgTaskMinutes === 15}
                  on:click={() => (avgTaskMinutes = 15)}
                >
                  15 Min
                </button>
                <button
                  type="button"
                  class="dur-chip"
                  class:selected={avgTaskMinutes === 30}
                  on:click={() => (avgTaskMinutes = 30)}
                >
                  30 Min
                </button>
              </div>
            </div>
          </div>

          <div class="calc-outputs">
            <div class="out-box">
              <span class="out-num">{tasksCount}</span>
              <span class="out-lbl">Missions Created / Week</span>
            </div>
            <div class="out-box highlight">
              <span class="out-num">{volunteersEngaged}</span>
              <span class="out-lbl">Active Volunteers Engaged</span>
            </div>
            <div class="out-box">
              <span class="out-num">~{estTurnaroundHours} hrs</span>
              <span class="out-lbl">Est. Turnaround Time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ───── CTA ───── -->
  <section class="ngo-cta-section">
    <div class="container">
      <div class="cta-box">
        <h2>Start clearing your non-profit backlog today.</h2>
        <p>Register your NGO, complete soft-gated verification, and post your first task in minutes.</p>
        <div class="cta-actions">
          <a href="/signup" class="btn-coral btn-lg">Register Organization</a>
          <a href="/tasks" class="btn-outline-dark btn-lg">Browse Platform Tasks</a>
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
    color: var(--color-primary);
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
  }
  .coral-gradient {
    color: var(--color-primary);
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
    border-color: var(--color-primary);
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  }
  .btn-outline-dark:active { transform: scale(0.97); }

  /* NGO Card Mockup */
  .ngo-hero-visual {
    display: flex;
    justify-content: flex-end;
  }
  .ngo-card-mockup {
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--card-border-strong);
    border-radius: 28px;
    padding: 28px;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ngo-card-mockup:hover {
    transform: translateY(-4px);
    box-shadow: 0 28px 60px rgba(15, 23, 42, 0.12);
    border-color: var(--color-primary);
  }
  .ncm-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .ncm-verified-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: rgba(5, 150, 105, 0.12);
    color: #059669;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 700;
    transition: transform 0.2s ease;
  }
  .ngo-card-mockup:hover .ncm-verified-chip {
    transform: scale(1.05);
  }
  .ncm-count {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-tertiary);
  }

  .ncm-body h3 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: var(--color-text);
    margin: 0 0 4px;
  }
  .ncm-desc {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0 0 20px;
  }

  .ncm-queue {
    background: var(--color-surface-variant);
    border: 1px solid var(--card-border);
    border-radius: 18px;
    padding: 16px;
    transition: border-color 0.2s ease;
  }
  .ngo-card-mockup:hover .ncm-queue {
    border-color: var(--color-primary);
  }
  .nq-head {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 10px;
  }
  .nq-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  .nq-badge {
    background: #059669;
    color: #FFF;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 9999px;
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
    border-color: var(--color-primary);
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

  /* Calculator */
  .section-calc {
    padding: 96px 0;
    background: var(--color-background);
    width: 100%;
  }
  .calc-card {
    background: var(--color-surface);
    border: 1px solid var(--card-border-strong);
    border-radius: 32px;
    padding: clamp(32px, 5vw, 56px);
    transition: box-shadow 0.3s ease;
  }
  .calc-card:hover {
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
  }
  .calc-head { text-align: center; max-width: 600px; margin: 0 auto 40px; }
  .calc-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(255, 107, 107, 0.12); color: var(--color-primary); border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 12px; }
  .calc-head h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 28px; font-weight: 800; color: var(--color-text); margin: 0 0 8px; }
  .calc-head p { font-size: 15px; color: var(--color-text-secondary); margin: 0; }

  .calc-grid { display: grid; grid-template-columns: 1fr; gap: 36px; align-items: center; }
  @media (min-width: 960px) { .calc-grid { grid-template-columns: 1.1fr 1fr; } }

  .slider-group { margin-bottom: 24px; }
  .slider-head { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; color: var(--color-text); margin-bottom: 10px; }
  .range-input { width: 100%; accent-color: var(--color-primary); cursor: pointer; }

  .duration-chips { display: flex; gap: 10px; }
  .dur-chip {
    flex: 1;
    padding: 10px;
    border-radius: 12px;
    border: 1px solid var(--card-border-strong);
    background: var(--color-surface-variant);
    font-weight: 700;
    font-size: 14px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .dur-chip:hover:not(.selected) {
    border-color: var(--color-primary);
    color: var(--color-primary);
    transform: translateY(-2px);
  }
  .dur-chip.selected {
    background: var(--color-primary);
    color: #FFF;
    border-color: var(--color-primary);
    box-shadow: 0 4px 14px rgba(255, 107, 107, 0.25);
  }
  .dur-chip:active { transform: scale(0.96); }

  .calc-outputs { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .out-box {
    background: var(--color-surface);
    border: 1px solid var(--card-border-strong);
    border-radius: 20px;
    padding: 20px;
    text-align: center;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .out-box:hover {
    transform: scale(1.03);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  }
  .out-box.highlight { background: var(--color-primary); color: #FFF; border-color: var(--color-primary); }
  .out-box.highlight:hover {
    box-shadow: 0 10px 24px rgba(255, 107, 107, 0.3);
  }
  .out-num { display: block; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 32px; font-weight: 800; color: var(--color-primary); }
  .out-box.highlight .out-num { color: #FFFFFF; }
  .out-lbl { font-size: 13px; font-weight: 700; color: var(--color-text-tertiary); }
  .out-box.highlight .out-lbl { color: rgba(255, 255, 255, 0.9); }

  /* CTA */
  .ngo-cta-section { padding: 96px 0; background: var(--color-surface-variant); width: 100%; }
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
