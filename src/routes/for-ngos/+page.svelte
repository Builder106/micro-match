<script lang="ts">
  import Icon from "@iconify/svelte";
  import DecorativeLottie from '$lib/components/DecorativeLottie.svelte';
  import MissionPlanner from '$lib/components/MissionPlanner.svelte';
  import PublicShell from '$lib/components/PublicShell.svelte';
  import { resolve } from '$app/paths';

  const ngoPillars = [
    {
      icon: 'lucide:layers',
      bg: '#FFF5F0',
      color: '#881337',
      tag: 'Micro-Scoped Work',
      title: 'Post tasks, not job openings',
      desc: 'Break down your backlog into 5 to 30-minute units — translation, photo tagging, data audits — getting reviewable work done without recruitment drag.'
    },
    {
      icon: 'lucide:shield-check',
      bg: '#D1FAE5',
      color: '#064E3B',
      tag: 'IRS Trust Signal',
      title: 'ProPublica NGO verification',
      desc: 'Submit your tax/charity EIN to earn soft-gated NGO verification. Verified status back-fills a prominent trust badge across all your posted tasks.'
    },
    {
      icon: 'lucide:user-check',
      bg: '#FEF3C7',
      color: '#78350F',
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
  <meta name="description" content="Turn small pieces of your backlog into tasks and review volunteer submissions." />
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
          Turn a defined piece of backlog into a task volunteers can claim. Review each submission before approving it for your organization.
        </p>

        <div class="ngo-hero-btns">
          <a href={resolve('/signup', {})} class="btn-coral btn-lg">Create NGO Profile</a>
          <a href="#backlog-calculator" class="btn-outline-dark btn-lg">Calculate Capacity ↓</a>
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
          <span>Task brief</span>
          <Icon icon="lucide:arrow-right" width="16" height="16" aria-hidden="true" />
          <span>Volunteer submission</span>
          <Icon icon="lucide:arrow-right" width="16" height="16" aria-hidden="true" />
          <span>NGO review</span>
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
        <h2>Start clearing your non-profit backlog today.</h2>
        <p>Register your NGO, complete soft-gated verification, and post your first task in minutes.</p>
        <div class="cta-actions">
          <a href={resolve('/signup', {})} class="btn-coral btn-lg">Register Organization</a>
          <a href={resolve('/tasks', {})} class="btn-outline-dark btn-lg">Browse Platform Tasks</a>
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
  }
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

  .section-calc {
    padding: 96px 0;
    background: var(--color-background);
    width: 100%;
  }

  /* CTA */
  .ngo-cta-section { padding: 96px 0; background: var(--color-surface-variant); width: 100%; }
  .cta-box {
    background: var(--color-primary);
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
