<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
  import Icon from '@iconify/svelte';
</script>

<StaticArticle
  title="About MicroMatch"
  lede="MicroMatch connects volunteers with short, high-impact tasks from NGOs and community projects—transforming spare minutes into measurable civic progress."
  wide={true}
  showRelated={false}
>
  <div class="about-hero-badge">
    <span class="brand-pill">MicroMatch</span>
    <span class="hub-tag">Our Mission & Platform</span>
  </div>

  <!-- Mission Pillars Grid -->
  <div class="pillars-grid">
    <div class="pillar-card">
      <div class="pillar-icon-wrap coral-glow">
        <Icon icon="heroicons:clock-20-solid" width="22" height="22" />
      </div>
      <h3>15-Minute Micro-Missions</h3>
      <p>
        We built MicroMatch so people can contribute real work in minutes, not hours. Tasks are scoped to fit into a lunch break or commute—no long onboarding walls or rigid schedules.
      </p>
    </div>

    <div class="pillar-card">
      <div class="pillar-icon-wrap indigo-glow">
        <Icon icon="heroicons:building-office-20-solid" width="22" height="22" />
      </div>
      <h3>Direct NGO Empowerment</h3>
      <p>
        NGOs post needs as small, modular units—translation, tagging, light design, document proofreading, and accessibility checks—mobilizing global volunteer energy instantly.
      </p>
    </div>

    <div class="pillar-card">
      <div class="pillar-icon-wrap teal-glow">
        <Icon icon="heroicons:sparkles-20-solid" width="22" height="22" />
      </div>
      <h3>Verifiable Civic Impact</h3>
      <p>
        Volunteers earn digital badges, build active streaks, and compile a clear, verifiable record of completed work while helping non-profits drive real change.
      </p>
    </div>
  </div>

  <!-- Lifecycle Section -->
  <div class="lifecycle-section">
    <div class="section-head">
      <span class="subhead-pill">Platform Lifecycle</span>
      <h2>How Every Micro-Task Works</h2>
      <p>Every contribution follows a simple, transparent 4-step workflow from post to proof.</p>
    </div>

    <div class="steps-grid">
      <div class="step-card">
        <span class="step-num">01</span>
        <div class="step-content">
          <h4>NGO Posts Scoped Task</h4>
          <p>NGOs outline a 15–60 minute need with clear instructions and optional learning primer links.</p>
        </div>
      </div>

      <div class="step-card">
        <span class="step-num">02</span>
        <div class="step-content">
          <h4>Volunteer Claims & Completes</h4>
          <p>Volunteers pick tasks matching their skills and language, then submit proof of completion (PR, doc link, file).</p>
        </div>
      </div>

      <div class="step-card">
        <span class="step-num">03</span>
        <div class="step-content">
          <h4>Review & Verification</h4>
          <p>NGO admins review proof submissions, automatically granting XP and issuing achievement badges upon approval.</p>
        </div>
      </div>

      <div class="step-card">
        <span class="step-num">04</span>
        <div class="step-content">
          <h4>Open Civic Ledger</h4>
          <p>Completed tasks update the volunteer's streak and contribute to transparent platform telemetry.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Open Tech Foundation -->
  <div class="tech-foundation-card">
    <div class="tech-header">
      <div class="tech-badge">
        <Icon icon="heroicons:cpu-chip-20-solid" width="20" height="20" />
        <span>Open Architecture</span>
      </div>
      <h2>Flexible & Self-Hostable</h2>
    </div>
    <p>
      MicroMatch is designed to grow with your organization. Self-host Appwrite BaaS for total data control, or use managed hosting when you want zero operational overhead.
    </p>

    <div class="tech-chips">
      <span class="tech-chip"><Icon icon="logos:svelte-icon" width="14" height="14" /> SvelteKit SSR</span>
      <span class="tech-chip"><Icon icon="heroicons:circle-stack-20-solid" width="14" height="14" /> Appwrite BaaS</span>
      <span class="tech-chip"><Icon icon="heroicons:shield-check-20-solid" width="14" height="14" /> Content Safety AI</span>
      <span class="tech-chip"><Icon icon="heroicons:language-20-solid" width="14" height="14" /> Real-time Translation</span>
    </div>
  </div>

  <!-- Action CTA Section -->
  <div class="about-cta-banner">
    <div class="cta-text">
      <h3>Ready to take small actions for big impact?</h3>
      <p>Browse active micro-missions or explore our developer documentation.</p>
    </div>
    <div class="cta-actions">
      <a href="/tasks" class="btn-coral">
        Browse Micro-Tasks
        <Icon icon="heroicons:arrow-right-20-solid" width="18" height="18" />
      </a>
      <a href="/docs/api" class="btn-outline-action">
        Explore API Docs
        <Icon icon="heroicons:code-bracket-20-solid" width="18" height="18" />
      </a>
    </div>
  </div>
</StaticArticle>

<style>
  .about-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px 4px 6px;
    background: var(--color-surface-variant, #f8fafc);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    border-radius: 24px;
    margin-bottom: 24px;
  }

  .brand-pill {
    font-size: 0.775rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 16px;
    background: var(--color-primary, #ff6b6b);
    color: #ffffff;
    letter-spacing: 0.02em;
  }

  .hub-tag {
    font-size: 0.775rem;
    font-weight: 600;
    padding: 3px 10px;
    color: var(--color-text-secondary, #475569);
  }

  /* Pillars Grid */
  .pillars-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 44px;
  }

  .pillar-card {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.1));
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .pillar-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 107, 107, 0.4);
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
  }

  .pillar-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  .coral-glow { background: #fff1f1; color: #ff6b6b; }
  .indigo-glow { background: #eff6ff; color: #3b82f6; }
  .teal-glow { background: #f0fdf4; color: #10b981; }

  .pillar-card h3 {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: var(--color-text, #0f172a);
    letter-spacing: -0.01em;
  }

  .pillar-card p {
    font-size: 0.925rem !important;
    line-height: 1.55 !important;
    color: var(--color-text-secondary, #475569) !important;
    margin: 0 !important;
  }

  /* Lifecycle Section */
  .lifecycle-section {
    background: var(--color-surface-variant, #f8fafc);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    border-radius: 20px;
    padding: 32px 28px;
    margin-bottom: 40px;
  }

  .section-head {
    text-align: center;
    max-width: 580px;
    margin: 0 auto 32px auto;
  }

  .subhead-pill {
    font-size: 0.775rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-primary, #ff6b6b);
    background: rgba(255, 107, 107, 0.1);
    padding: 4px 12px;
    border-radius: 20px;
    display: inline-block;
    margin-bottom: 10px;
  }

  .section-head h2 {
    font-size: 1.6rem;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: var(--color-text, #0f172a);
    letter-spacing: -0.02em;
  }

  .section-head p {
    font-size: 0.95rem !important;
    color: var(--color-text-secondary, #64748b) !important;
    margin: 0 !important;
  }

  .steps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }

  .step-card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    border-radius: 14px;
    padding: 18px 16px;
  }

  .step-num {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.9rem;
    font-weight: 800;
    color: var(--color-primary, #ff6b6b);
    background: #fff1f1;
    padding: 4px 8px;
    border-radius: 8px;
    flex-shrink: 0;
  }

  .step-content h4 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0 0 4px 0;
    color: var(--color-text, #0f172a);
  }

  .step-content p {
    font-size: 0.85rem !important;
    line-height: 1.45 !important;
    color: var(--color-text-secondary, #475569) !important;
    margin: 0 !important;
  }

  /* Tech Foundation Card */
  .tech-foundation-card {
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.1));
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 40px;
  }

  .tech-header {
    margin-bottom: 12px;
  }

  .tech-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.775rem;
    font-weight: 700;
    color: #10b981;
    background: #f0fdf4;
    padding: 4px 10px;
    border-radius: 20px;
    margin-bottom: 8px;
  }

  .tech-foundation-card h2 {
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-text, #0f172a);
  }

  .tech-foundation-card p {
    font-size: 0.95rem !important;
    line-height: 1.55 !important;
    color: var(--color-text-secondary, #475569) !important;
    margin: 0 0 20px 0 !important;
  }

  .tech-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tech-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 20px;
    background: var(--color-surface-variant, #f1f5f9);
    border: 1px solid var(--color-outline-variant, #e2e8f0);
    color: var(--color-text, #334155);
  }

  /* About CTA Banner */
  .about-cta-banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #ffffff;
    border-radius: 20px;
    padding: 28px 32px;
  }

  .cta-text h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 4px 0;
    color: #ffffff;
  }

  .cta-text p {
    font-size: 0.9rem !important;
    color: #94a3b8 !important;
    margin: 0 !important;
  }

  .cta-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .btn-coral {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 22px;
    border-radius: 9999px;
    background: #FF6B6B;
    color: #ffffff !important;
    font-weight: 700 !important;
    font-size: 0.9rem;
    text-decoration: none !important;
    transition: all 0.25s ease;
  }

  .btn-coral:hover {
    background: #ff5252;
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(255, 107, 107, 0.35);
  }

  .btn-outline-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 9999px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: #ffffff !important;
    font-weight: 700 !important;
    font-size: 0.9rem;
    text-decoration: none !important;
    transition: all 0.25s ease;
  }

  .btn-outline-action:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }

  @media (max-width: 640px) {
    .about-cta-banner {
      flex-direction: column;
      align-items: flex-start;
      padding: 24px 20px;
    }
  }
</style>
