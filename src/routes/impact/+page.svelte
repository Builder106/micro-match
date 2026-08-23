<script lang="ts">
  import PublicShell from '$lib/components/PublicShell.svelte';
  import Icon from '@iconify/svelte';
  import { resolve } from '$app/paths';

  export let data;
</script>

<svelte:head>
  <title>Our Impact | MicroMatch</title>
  <meta name="description" content="Real-time, audit-verifiable impact numbers from the MicroMatch micro-volunteering ecosystem." />
</svelte:head>

<PublicShell activeTab="impact">
  <div class="impact-page">
    <!-- Header Section -->
    <header class="impact-header">
      <div class="badge-pill">
        <Icon icon="lucide:shield-check" width="16" height="16" />
        <span>Real-Time Audit Data</span>
      </div>
      <h1>Our Community Impact</h1>
      <p class="lede">
        Real numbers from the MicroMatch ecosystem — updated continuously, never estimated or mock projected. Every single completed task, active volunteer, and awarded badge represents real-world change.
      </p>
    </header>

    <!-- Key Metrics Grid -->
    <section class="metrics-section" aria-label="Key Impact Metrics">
      <div class="metric-card primary-hero-card">
        <div class="icon-box coral">
          <Icon icon="lucide:check-circle-2" width="24" height="24" />
        </div>
        <div class="metric-content">
          <span class="metric-value">{data.stats.tasksCompleted}</span>
          <span class="metric-label">Tasks Completed</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="icon-box peach">
          <Icon icon="lucide:clock" width="24" height="24" />
        </div>
        <div class="metric-content">
          <span class="metric-value">{data.stats.hoursContributed}h</span>
          <span class="metric-label">Impact Hours Unlocked</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="icon-box emerald">
          <Icon icon="lucide:users" width="24" height="24" />
        </div>
        <div class="metric-content">
          <span class="metric-value">{data.stats.activeVolunteers}</span>
          <span class="metric-label">Active Volunteers</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="icon-box blue">
          <Icon icon="lucide:building-2" width="24" height="24" />
        </div>
        <div class="metric-content">
          <span class="metric-value">{data.stats.ngosOnboarded}</span>
          <span class="metric-label">NGOs Onboarded</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="icon-box purple">
          <Icon icon="lucide:award" width="24" height="24" />
        </div>
        <div class="metric-content">
          <span class="metric-value">{data.stats.badgesAwarded}</span>
          <span class="metric-label">Badges Awarded</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="icon-box amber">
          <Icon icon="lucide:zap" width="24" height="24" />
        </div>
        <div class="metric-content">
          <span class="metric-value">{data.stats.avgTaskMinutes}m</span>
          <span class="metric-label">Avg Task Time</span>
        </div>
      </div>
    </section>

    <!-- Micro-Task Velocity Breakdown -->
    <section class="velocity-section">
      <div class="section-heading">
        <h2>Bite-Sized Velocity</h2>
        <p>How 5-to-30 minute micro-contributions scale into organizational acceleration.</p>
      </div>

      <div class="velocity-grid">
        <div class="velocity-card">
          <div class="time-tag">≤ 15 mins</div>
          <span class="velocity-count">{data.stats.durationCounts['15m']}</span>
          <span class="velocity-desc">Quick proofreads, translation checks & mini data validations</span>
        </div>

        <div class="velocity-card">
          <div class="time-tag">15 - 20 mins</div>
          <span class="velocity-count">{data.stats.durationCounts['20m']}</span>
          <span class="velocity-desc">Social graphics, structured summaries & research lookups</span>
        </div>

        <div class="velocity-card">
          <div class="time-tag">20 - 30 mins</div>
          <span class="velocity-count">{data.stats.durationCounts['30m']}</span>
          <span class="velocity-desc">Deep document translations & complex data structuring</span>
        </div>
      </div>
    </section>

    <!-- Cause & Skill Distribution -->
    {#if data.stats.causeBreakdown && data.stats.causeBreakdown.length > 0}
      <section class="cause-section">
        <div class="section-heading">
          <h2>Impact Across Domains</h2>
          <p>Distribution of completed tasks by skill area and cause focus.</p>
        </div>

        <div class="cause-card-grid">
          {#each data.stats.causeBreakdown as cause (cause.name)}
            <div class="cause-item">
              <div class="cause-header">
                <span class="cause-badge" style="background: {cause.bg}; color: {cause.color}">
                  {cause.name}
                </span>
                <span class="cause-count">{cause.count} tasks</span>
              </div>
              <div class="progress-track">
                <div
                  class="progress-fill"
                  style="width: {Math.max(cause.percentage, 8)}%; background: {cause.color}"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Verification Callout -->
    <section class="trust-banner">
      <div class="trust-icon">
        <Icon icon="lucide:database" width="28" height="28" />
      </div>
      <div class="trust-body">
        <h3>100% Audit-Verifiable Data</h3>
        <p>
          Every metric displayed above comes directly from active tasks, completed claims, and awarded badge tokens in the MicroMatch Appwrite database. Nothing is estimated or projected.
        </p>
      </div>
    </section>

    <!-- Audience Dual Call to Action -->
    <section class="cta-section">
      <div class="cta-card volunteer-cta">
        <div class="cta-icon-header">
          <Icon icon="lucide:heart-handshake" width="32" height="32" />
        </div>
        <h3>Join as a Volunteer</h3>
        <p>Turn spare minutes into tangible support for global NGOs. Build your verified portfolio.</p>
        <ul class="cta-bullets">
          <li>
            <Icon icon="lucide:check" width="16" height="16" />
            <span>Flexible 5 to 30 minute micro-tasks</span>
          </li>
          <li>
            <Icon icon="lucide:check" width="16" height="16" />
            <span>Earn verified credentials & badges</span>
          </li>
        </ul>
        <a href={resolve('/signup', {})} class="btn-primary-coral">Start Volunteering</a>
      </div>

      <div class="cta-card ngo-cta">
        <div class="cta-icon-header">
          <Icon icon="lucide:building" width="32" height="32" />
        </div>
        <h3>Post Tasks as an NGO</h3>
        <p>Break large projects into bite-sized tasks and get rapid help from skilled volunteers worldwide.</p>
        <ul class="cta-bullets">
          <li>
            <Icon icon="lucide:check" width="16" height="16" />
            <span>Free onboarding & task scoping</span>
          </li>
          <li>
            <Icon icon="lucide:check" width="16" height="16" />
            <span>Automated claim reviews & proof checks</span>
          </li>
        </ul>
        <a href={resolve('/for-ngos', {})} class="btn-secondary-outlined">Onboard Your NGO</a>
      </div>
    </section>
  </div>
</PublicShell>

<style>
  .impact-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: var(--space-8, 32px) var(--space-4, 16px) var(--space-16, 64px);
    display: flex;
    flex-direction: column;
    gap: var(--space-10, 40px);
  }

  /* Header */
  .impact-header {
    text-align: center;
    max-width: 720px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3, 12px);
  }

  .badge-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: #FFF5F0;
    color: #FF6B6B;
    border-radius: 9999px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .impact-header h1 {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: clamp(2.25rem, 4vw, 3.25rem);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: var(--color-text, #0F172A);
    margin: 0;
  }

  .impact-header .lede {
    font-size: 1.125rem;
    line-height: 1.6;
    color: var(--color-text-secondary, #475569);
    margin: 0;
  }

  /* Metrics Section */
  .metrics-section {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: var(--space-4, 16px);
  }

  @media (min-width: 640px) {
    .metrics-section {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .metrics-section {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .metric-card {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-outline-variant, rgba(15, 23, 42, 0.06));
    border-radius: var(--radius-xl, 24px);
    padding: var(--space-6, 24px);
    display: flex;
    align-items: center;
    gap: var(--space-4, 16px);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }

  .metric-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  }

  .icon-box {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .icon-box.coral { background: #FFE5DC; color: #FF6B6B; }
  .icon-box.peach { background: #FED7AA; color: #FB923C; }
  .icon-box.emerald { background: #D1FAE5; color: #059669; }
  .icon-box.blue { background: #DBEAFE; color: #2563EB; }
  .icon-box.purple { background: #F3E8FF; color: #7C3AED; }
  .icon-box.amber { background: #FEF3C7; color: #D97706; }

  .metric-content {
    display: flex;
    flex-direction: column;
  }

  .metric-value {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    font-weight: 800;
    line-height: 1.1;
    color: var(--color-text, #0F172A);
  }

  .metric-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text-secondary, #475569);
    margin-top: 4px;
  }

  /* Section Headings */
  .section-heading {
    text-align: center;
    margin-bottom: var(--space-6, 24px);
  }

  .section-heading h2 {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-text, #0F172A);
    margin: 0 0 6px 0;
  }

  .section-heading p {
    font-size: 1rem;
    color: var(--color-text-secondary, #475569);
    margin: 0;
  }

  /* Velocity Breakdown */
  .velocity-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: var(--space-4, 16px);
  }

  @media (min-width: 768px) {
    .velocity-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .velocity-card {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-outline-variant, rgba(15, 23, 42, 0.06));
    border-radius: var(--radius-lg, 16px);
    padding: var(--space-5, 20px);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2, 8px);
  }

  .time-tag {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 4px 10px;
    border-radius: 9999px;
    background: #FFF5F0;
    color: #FF6B6B;
  }

  .velocity-count {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 2.25rem;
    font-weight: 800;
    color: var(--color-text, #0F172A);
    line-height: 1;
    margin-top: 4px;
  }

  .velocity-desc {
    font-size: 0.9rem;
    color: var(--color-text-secondary, #475569);
    line-height: 1.4;
  }

  /* Cause Distribution */
  .cause-card-grid {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-outline-variant, rgba(15, 23, 42, 0.06));
    border-radius: var(--radius-xl, 24px);
    padding: var(--space-6, 24px);
    display: flex;
    flex-direction: column;
    gap: var(--space-4, 16px);
  }

  .cause-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cause-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .cause-badge {
    font-size: 0.85rem;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 9999px;
  }

  .cause-count {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-secondary, #475569);
  }

  .progress-track {
    height: 8px;
    background: #F1F5F9;
    border-radius: 9999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 0.4s ease;
  }

  /* Trust Callout */
  .trust-banner {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 107, 107, 0.2);
    border-radius: var(--radius-xl, 24px);
    padding: var(--space-6, 24px);
    display: flex;
    align-items: flex-start;
    gap: var(--space-4, 16px);
    box-shadow: 0 4px 16px rgba(255, 107, 107, 0.06);
  }

  .trust-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #FFF5F0;
    color: #FF6B6B;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .trust-body h3 {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0 0 4px 0;
    color: var(--color-text, #0F172A);
  }

  .trust-body p {
    font-size: 0.95rem;
    color: var(--color-text-secondary, #475569);
    line-height: 1.5;
    margin: 0;
  }

  /* Dual CTA Cards */
  .cta-section {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: var(--space-6, 24px);
  }

  @media (min-width: 768px) {
    .cta-section {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .cta-card {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-outline-variant, rgba(15, 23, 42, 0.06));
    border-radius: var(--radius-xl, 24px);
    padding: var(--space-6, 32px);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3, 12px);
  }

  .volunteer-cta {
    background: linear-gradient(180deg, #FFFFFF 0%, #FFF5F0 100%);
    border-color: rgba(255, 107, 107, 0.2);
  }

  .ngo-cta {
    background: linear-gradient(180deg, #FFFFFF 0%, #FAF7F0 100%);
    border-color: rgba(251, 146, 60, 0.2);
  }

  .cta-icon-header {
    color: #FF6B6B;
    margin-bottom: 4px;
  }

  .ngo-cta .cta-icon-header {
    color: #FB923C;
  }

  .cta-card h3 {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-text, #0F172A);
  }

  .cta-card p {
    font-size: 0.95rem;
    color: var(--color-text-secondary, #475569);
    line-height: 1.5;
    margin: 0;
  }

  .cta-bullets {
    list-style: none;
    padding: 0;
    margin: 8px 0 16px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cta-bullets li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-text, #0F172A);
  }

  .cta-bullets li :global(svg) {
    color: #059669;
    flex-shrink: 0;
  }

  .btn-primary-coral {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    background: linear-gradient(135deg, #FF6B6B, #E85555);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.95rem;
    border-radius: 9999px;
    text-decoration: none;
    transition: all 0.25s ease;
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.25);
    margin-top: auto;
  }

  .btn-primary-coral:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(255, 107, 107, 0.35);
  }

  .btn-secondary-outlined {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    background: #ffffff;
    color: #1E293B;
    border: 1.5px solid #CBD5E1;
    font-weight: 700;
    font-size: 0.95rem;
    border-radius: 9999px;
    text-decoration: none;
    transition: all 0.25s ease;
    margin-top: auto;
  }

  .btn-secondary-outlined:hover {
    border-color: #FF6B6B;
    color: #FF6B6B;
    transform: translateY(-2px);
  }
</style>
