<script lang="ts">
  import Icon from "@iconify/svelte";
  import PublicShell from '$lib/components/PublicShell.svelte';
  import { page } from '$app/state';
  import { fly, fade, slide } from 'svelte/transition';
  import { resolve } from '$app/paths';
  import { type Locale } from '$lib/locale';
  import { reducedMotion } from '$lib/utils/reducedMotion';
  import * as m from '$lib/paraglide/messages.js';

  let activeStep = 0;

  const steps = [
    {
      num: '01',
      title: m.hiw_step_1_title,
      shortTag: m.hiw_step_1_short,
      icon: 'lucide:search',
      summary: m.hiw_step_1_summary,
      bullets: [
        m.hiw_step_1_bullet_1,
        m.hiw_step_1_bullet_2,
        m.hiw_step_1_bullet_3
      ],
      demoTitle: m.hiw_step_1_demo_title,
      demoNgo: m.hiw_step_1_demo_ngo,
      demoTime: m.hiw_step_1_demo_time,
      demoTags: [
        { label: m.hiw_step_1_tag_1, bg: '#F3E8FF', color: '#581C87' },
        { label: m.hiw_step_1_tag_2, bg: '#D1FAE5', color: '#064E3B' }
      ]
    },
    {
      num: '02',
      title: m.hiw_step_2_title,
      shortTag: m.hiw_step_2_short,
      icon: 'lucide:check-circle-2',
      summary: m.hiw_step_2_summary,
      bullets: [
        m.hiw_step_2_bullet_1,
        m.hiw_step_2_bullet_2,
        m.hiw_step_2_bullet_3
      ],
      demoTitle: m.hiw_step_2_demo_title,
      demoNgo: m.hiw_step_2_demo_ngo,
      demoTime: m.hiw_step_2_demo_time,
      demoTags: [
        { label: m.hiw_step_2_tag_1, bg: '#FEF3C7', color: '#D97706' }
      ]
    },
    {
      num: '03',
      title: m.hiw_step_3_title,
      shortTag: m.hiw_step_3_short,
      icon: 'lucide:book-open',
      summary: m.hiw_step_3_summary,
      bullets: [
        m.hiw_step_3_bullet_1,
        m.hiw_step_3_bullet_2,
        m.hiw_step_3_bullet_3
      ],
      demoTitle: m.hiw_step_3_demo_title,
      demoNgo: m.hiw_step_3_demo_ngo,
      demoTime: m.hiw_step_3_demo_time,
      demoTags: [
        { label: m.hiw_step_3_tag_1, bg: '#D1FAE5', color: '#064E3B' }
      ]
    },
    {
      num: '04',
      title: m.hiw_step_4_title,
      shortTag: m.hiw_step_4_short,
      icon: 'lucide:send',
      summary: m.hiw_step_4_summary,
      bullets: [
        m.hiw_step_4_bullet_1,
        m.hiw_step_4_bullet_2,
        m.hiw_step_4_bullet_3
      ],
      demoTitle: m.hiw_step_4_demo_title,
      demoNgo: m.hiw_step_4_demo_ngo,
      demoTime: m.hiw_step_4_demo_time,
      demoTags: [
        { label: m.hiw_step_4_tag_1, bg: '#FCE7F3', color: '#831843' }
      ]
    },
    {
      num: '05',
      title: m.hiw_step_5_title,
      shortTag: m.hiw_step_5_short,
      icon: 'lucide:award',
      summary: m.hiw_step_5_summary,
      bullets: [
        m.hiw_step_5_bullet_1,
        m.hiw_step_5_bullet_2,
        m.hiw_step_5_bullet_3
      ],
      demoTitle: m.hiw_step_5_demo_title,
      demoNgo: m.hiw_step_5_demo_ngo,
      demoTime: m.hiw_step_5_demo_time,
      demoTags: [
        { label: m.hiw_step_5_tag_1, bg: '#FFEDD5', color: '#7C2D12' }
      ]
    }
  ];

  const faqs = [
    {
      q: m.hiw_faq_1_question,
      a: m.hiw_faq_1_answer
    },
    {
      q: m.hiw_faq_2_question,
      a: m.hiw_faq_2_answer
    },
    {
      q: m.hiw_faq_3_question,
      a: m.hiw_faq_3_answer
    },
    {
      q: m.hiw_faq_4_question,
      a: m.hiw_faq_4_answer
    }
  ];

  let openFaq = 0;
  /* eslint-disable-next-line svelte/no-immutable-reactive-statements */
  $: currentLocale = (page.data?.locale as Locale | undefined) ?? 'en';
  type StaticMessage = (inputs?: Record<string, never>, options?: { locale?: Locale }) => string;
  function t(message: StaticMessage) { return message({}, { locale: currentLocale }); }
</script>

<svelte:head>
  <title>{t(m.hiw_meta_title)}</title>
  <meta name="description" content={t(m.hiw_meta_description)} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<PublicShell activeTab="how-it-works">
  <!-- ───── Unique Hero with 5-Step Process Bar ───── -->
  <section class="hiw-hero">
    <div class="container">
      <div class="hiw-hero-head">
        <h1>{t(m.hiw_hero_title_lead)} <br /><span class="coral-gradient">{t(m.hiw_hero_title_accent)}</span></h1>
        <p>{t(m.hiw_hero_description)}</p>
      </div>

      <!-- 5-Step Interactive Navigation Ribbon -->
      <div class="process-ribbon">
        {#each steps as s, i (s.num)}
          <button
            type="button"
            class="ribbon-step"
            class:active={activeStep === i}
            on:click={() => (activeStep = i)}
          >
            <div class="ribbon-num">{s.num}</div>
            <span class="ribbon-label">{t(s.shortTag)}</span>
          </button>
          {#if i < steps.length - 1}
            <div class="ribbon-line"></div>
          {/if}
        {/each}
      </div>
    </div>
  </section>

  <!-- ───── Interactive Step Inspector Split Screen ───── -->
  <section class="hiw-inspector">
    <div class="container">
      <div class="inspector-card">
        {#key activeStep}
          <div class="inspector-left" in:fly={{ y: 16, duration: $reducedMotion ? 0 : 350, delay: $reducedMotion ? 0 : 50 }} out:fade={{ duration: $reducedMotion ? 0 : 150 }}>
            <div class="ins-badge">{t(m.hiw_step)} {steps[activeStep].num} {t(m.hiw_of)} 05</div>
            <h2>{t(steps[activeStep].title)}</h2>
            <p class="ins-summary">{t(steps[activeStep].summary)}</p>

            <ul class="ins-bullets">
              {#each steps[activeStep].bullets as bullet (bullet)}
                <li>
                  <Icon icon="lucide:check-circle-2" width="18" height="18" class="ins-icon" />
                  <span>{t(bullet)}</span>
                </li>
              {/each}
            </ul>

            <div class="ins-nav-btns">
              <button
                type="button"
                class="btn-nav-prev"
                disabled={activeStep === 0}
                on:click={() => activeStep--}
              >
                ← {t(m.hiw_previous_step)}
              </button>
              <button
                type="button"
                class="btn-nav-next"
                disabled={activeStep === steps.length - 1}
                on:click={() => activeStep++}
              >
                {t(m.hiw_next_step)} →
              </button>
            </div>
          </div>

          <div class="inspector-right" in:fly={{ x: 20, duration: $reducedMotion ? 0 : 350, delay: $reducedMotion ? 0 : 100 }} out:fade={{ duration: $reducedMotion ? 0 : 150 }}>
            <div class="ins-mockup-frame">
              <div class="im-topbar">
                <span class="im-dot"></span>
                <span class="im-dot"></span>
                <span class="im-dot"></span>
                <span class="im-title">{t(m.hiw_simulator)} | {t(m.hiw_step)} {steps[activeStep].num}</span>
              </div>

              <div class="im-content">
                <div class="im-card">
                  <div class="im-card-top">
                    <span class="im-ngo">{t(steps[activeStep].demoNgo)}</span>
                    <span class="im-time"><Icon icon="lucide:clock" width="12" height="12" /> {t(steps[activeStep].demoTime)}</span>
                  </div>

                  <h3>{t(steps[activeStep].demoTitle)}</h3>

                  <div class="im-tags">
                    {#each steps[activeStep].demoTags as tag (tag.label)}
                      <span style="background:{tag.bg}; color:{tag.color}">{t(tag.label)}</span>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/key}
      </div>
    </div>
  </section>

  <!-- ───── Closed Loop Diagram ───── -->
  <section class="hiw-diagram-section">
    <div class="container">
      <div class="section-head">
        <h2>{t(m.hiw_loop_title)}</h2>
        <p>{t(m.hiw_loop_description)}</p>
      </div>

      <div class="diagram-grid">
        <div class="diag-box">
          <div class="diag-icon"><Icon icon="lucide:building-2" width="24" height="24" /></div>
          <h3>{t(m.hiw_loop_1_title)}</h3>
          <p>{t(m.hiw_loop_1_description)}</p>
        </div>
        <div class="diag-arrow" aria-hidden="true"><Icon icon="lucide:arrow-right" width="18" height="18" /></div>
        <div class="diag-box">
          <div class="diag-icon"><Icon icon="lucide:user-check" width="24" height="24" /></div>
          <h3>{t(m.hiw_loop_2_title)}</h3>
          <p>{t(m.hiw_loop_2_description)}</p>
        </div>
        <div class="diag-arrow" aria-hidden="true"><Icon icon="lucide:arrow-right" width="18" height="18" /></div>
        <div class="diag-box">
          <div class="diag-icon"><Icon icon="lucide:upload-cloud" width="24" height="24" /></div>
          <h3>{t(m.hiw_loop_3_title)}</h3>
          <p>{t(m.hiw_loop_3_description)}</p>
        </div>
        <div class="diag-arrow" aria-hidden="true"><Icon icon="lucide:arrow-right" width="18" height="18" /></div>
        <div class="diag-box highlight">
          <div class="diag-icon"><Icon icon="lucide:award" width="24" height="24" /></div>
          <h3>{t(m.hiw_loop_4_title)}</h3>
          <p>{t(m.hiw_loop_4_description)}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ───── FAQ Accordion ───── -->
  <section class="hiw-faq-section">
    <div class="container">
      <div class="section-head">
        <h2>{t(m.hiw_faq_title)}</h2>
        <p>{t(m.hiw_faq_description)}</p>
      </div>

      <div class="faq-list">
        {#each faqs as faq, i (faq.q)}
          <div class="faq-item" class:open={openFaq === i}>
            <button type="button" class="faq-question" on:click={() => (openFaq = openFaq === i ? -1 : i)}>
              <span>{t(faq.q)}</span>
              <Icon icon={openFaq === i ? "lucide:chevron-up" : "lucide:chevron-down"} width="20" height="20" class="faq-chevron" />
            </button>
            {#if openFaq === i}
              <div class="faq-answer" transition:slide={{ duration: $reducedMotion ? 0 : 250 }}>
                <p>{t(faq.a)}</p>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ───── CTA ───── -->
  <section class="hiw-cta-section">
    <div class="container">
      <div class="cta-banner">
        <h2>{t(m.hiw_cta_title)}</h2>
        <p>{t(m.hiw_cta_description)}</p>
        <div class="cta-btns">
          <a href={resolve('/signup', {})} class="btn-coral btn-lg">{t(m.hiw_get_started)}</a>
          <a href={resolve('/tasks', {})} class="btn-outline-dark btn-lg">{t(m.browse_active_feed)}</a>
        </div>
      </div>
    </div>
  </section>
</PublicShell>

<style>
  /* Base Background */
  .hiw-hero {
    padding: 56px 0 40px;
    background: var(--color-background);
    text-align: center;
    width: 100%;
  }
  .hiw-hero-head {
    max-width: 700px;
    margin: 0 auto 48px;
  }
  .hiw-hero-head h1 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(2.25rem, 4vw, 3.5rem);
    font-weight: 800;
    line-height: 1.15;
    color: var(--color-text);
    margin: 0 0 16px;
  }
  .coral-gradient {
    color: var(--color-primary-readable);
  }
  .hiw-hero-head p {
    font-size: 18px;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  /* Process Ribbon */
  .process-ribbon {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    max-width: 860px;
    margin: 0 auto;
    background: var(--color-surface);
    border: 1px solid var(--card-border-strong);
    border-radius: 9999px;
    padding: 12px 24px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  }
  .ribbon-step {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 9999px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ribbon-step:hover:not(.active) {
    background: rgba(255, 107, 107, 0.08);
    transform: translateY(-2px) scale(1.04);
  }
  .ribbon-step:hover:not(.active) .ribbon-num {
    background: var(--color-primary);
    color: var(--color-action-on-coral);
    transform: rotate(8deg);
  }
  .ribbon-step:hover:not(.active) .ribbon-label {
    color: var(--color-primary-readable);
  }
  .ribbon-step:active {
    transform: scale(0.96);
  }
  .ribbon-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-surface-variant);
    color: var(--color-text-tertiary);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ribbon-label {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text-secondary);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ribbon-step.active {
    background: var(--color-primary);
    box-shadow: 0 4px 14px rgba(255, 107, 107, 0.25);
  }
  .ribbon-step.active:hover {
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 8px 22px rgba(255, 107, 107, 0.35);
  }
  .ribbon-step.active:hover .ribbon-num {
    transform: rotate(-8deg) scale(1.05);
  }
  .ribbon-step.active .ribbon-num {
    background: #FFFFFF;
    color: var(--color-readable-coral-on-light);
  }
  .ribbon-step.active .ribbon-label {
    color: var(--color-action-on-coral);
  }
  .ribbon-line {
    flex: 1;
    height: 2px;
    background: var(--card-border);
    max-width: 32px;
  }

  @media (max-width: 768px) {
    .process-ribbon { flex-wrap: wrap; border-radius: 24px; }
    .ribbon-line { display: none; }
  }

  /* Inspector */
  .hiw-inspector {
    padding: 40px 0 96px;
    background: var(--color-background);
    width: 100%;
  }
  .inspector-card {
    background: var(--color-surface);
    border: 1px solid var(--card-border-strong);
    border-radius: 32px;
    padding: clamp(32px, 5vw, 56px);
    display: grid;
    grid-template-columns: 1fr;
    gap: 48px;
    align-items: center;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.04);
  }
  @media (min-width: 960px) {
    .inspector-card { grid-template-columns: 1.1fr 1fr; }
  }

  .ins-badge {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(255, 107, 107, 0.12);
    color: var(--color-text-secondary);
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 12px;
  }
  .inspector-left h2 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: var(--color-text);
    margin: 0 0 12px;
  }
  .ins-summary {
    font-size: 16px;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0 0 24px;
  }
  .ins-bullets {
    list-style: none;
    padding: 0;
    margin: 0 0 32px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .ins-bullets li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ins-bullets li:hover {
    transform: translateX(4px);
  }
  .ins-bullets li:hover :global(.ins-icon) {
    transform: scale(1.25) rotate(6deg);
    color: var(--color-primary-readable);
  }
  :global(.ins-icon) {
    color: var(--color-primary-readable);
    flex-shrink: 0;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .ins-nav-btns {
    display: flex;
    gap: 12px;
  }
  .btn-nav-prev, .btn-nav-next {
    padding: 10px 20px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid var(--card-border-strong);
    background: var(--color-surface);
    color: var(--color-text);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn-nav-prev:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
    border-color: var(--color-primary-readable);
  }
  .btn-nav-next {
    background: var(--color-primary);
    color: var(--color-action-on-coral);
    border-color: var(--color-primary-readable);
    box-shadow: 0 4px 14px rgba(255, 107, 107, 0.25);
  }
  .btn-nav-next:hover:not(:disabled) {
    background: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(255, 107, 107, 0.35);
  }
  .btn-nav-prev:active:not(:disabled), .btn-nav-next:active:not(:disabled) {
    transform: scale(0.96);
  }
  .btn-nav-prev:disabled, .btn-nav-next:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Mockup Frame */
  .ins-mockup-frame {
    background: var(--color-surface-variant);
    border: 1px solid var(--card-border);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ins-mockup-frame:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 44px rgba(15, 23, 42, 0.1);
    border-color: var(--card-border-strong);
  }
  .im-topbar {
    background: var(--color-surface);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px solid var(--card-border);
  }
  .im-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-outline);
    transition: background 0.2s ease;
  }
  .ins-mockup-frame:hover .im-dot:nth-child(1) { background: #FF6B6B; }
  .ins-mockup-frame:hover .im-dot:nth-child(2) { background: #F59E0B; }
  .ins-mockup-frame:hover .im-dot:nth-child(3) { background: #10B981; }

  .im-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-tertiary);
    margin-left: 8px;
  }

  .im-content {
    padding: 32px 24px;
  }
  .im-card {
    background: var(--color-surface);
    border: 1px solid var(--card-border-strong);
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ins-mockup-frame:hover .im-card {
    transform: scale(1.02);
  }
  .im-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .im-ngo {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-tertiary);
  }
  .im-time {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(255, 107, 107, 0.12);
    color: var(--color-text-secondary);
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 700;
  }
  .im-card h3 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 16px;
  }
  .im-tags {
    display: flex;
    gap: 6px;
  }
  .im-tags span {
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 700;
  }

  /* Closed Loop Diagram */
  .hiw-diagram-section {
    padding: 96px 0;
    background: var(--color-surface-variant);
    width: 100%;
  }
  .section-head {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 640px;
    margin: 0 auto 56px;
  }
  .section-head h2 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(2rem, 3vw, 2.5rem);
    font-weight: 800;
    color: var(--color-text);
    margin: 0 0 12px;
    text-align: center;
  }
  .section-head p {
    font-size: 18px;
    color: var(--color-text-secondary);
    margin: 0;
    text-align: center;
  }

  .diagram-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
    align-items: center;
    gap: 16px;
    max-width: 1160px;
    margin: 0 auto;
  }
  .diag-box {
    background: var(--color-surface);
    border: 1px solid var(--card-border-strong);
    border-radius: 20px;
    padding: 24px 18px;
    width: 100%;
    box-sizing: border-box;
    text-align: center;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .diag-box:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
    border-color: var(--color-primary-readable);
  }
  .diag-box.highlight {
    border-color: var(--color-primary-readable);
    background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
  }
  .diag-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: rgba(255, 107, 107, 0.12);
    color: var(--color-primary-readable);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .diag-box:hover .diag-icon {
    transform: scale(1.15) rotate(4deg);
    background: var(--color-primary);
    color: #FFF;
  }
  .diag-box.highlight .diag-icon {
    background: var(--color-primary);
    color: #FFF;
  }
  .diag-box h3 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px;
    font-weight: 700;
    margin: 0 0 6px;
    color: var(--color-text);
  }
  .diag-box p {
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.45;
    margin: 0;
  }
  .diag-arrow {
    font-size: 18px;
    font-weight: 800;
    color: var(--color-text-tertiary);
    transition: all 0.3s ease;
  }
  .diag-box:hover + .diag-arrow {
    color: var(--color-primary-readable);
    transform: translateX(4px);
  }

  @media (max-width: 900px) {
    .diagram-grid {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .diag-arrow {
      transform: rotate(90deg);
    }
    .diag-box {
      max-width: 320px;
    }
  }

  /* FAQ */
  .hiw-faq-section {
    padding: 96px 0;
    background: var(--color-background);
    width: 100%;
  }
  .faq-list {
    max-width: 760px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .faq-item {
    background: var(--color-surface);
    border: 1px solid var(--card-border-strong);
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .faq-item:hover {
    border-color: var(--color-primary-readable);
    box-shadow: 0 8px 24px rgba(255, 107, 107, 0.08);
  }
  .faq-question {
    width: 100%;
    padding: 20px 24px;
    background: transparent;
    border: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
    cursor: pointer;
    text-align: left;
    transition: background 0.2s ease, color 0.2s ease;
  }
  .faq-question:hover {
    background: rgba(255, 107, 107, 0.08);
    color: var(--color-primary-readable);
  }
  .faq-answer {
    padding: 0 24px 20px;
    font-size: 15px;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }
  .faq-answer p { margin: 0; }

  /* CTA */
  .hiw-cta-section {
    padding: 80px 0 96px;
    background: var(--color-surface-variant);
    width: 100%;
  }
  .cta-banner {
    background: var(--color-primary);
    color: var(--color-action-on-coral);
    border-radius: 36px;
    padding: clamp(40px, 6vw, 64px) 24px;
    text-align: center;
    box-shadow: 0 20px 50px rgba(255, 107, 107, 0.25);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .cta-banner:hover {
    transform: translateY(-4px);
    box-shadow: 0 28px 60px rgba(255, 107, 107, 0.35);
  }
  .cta-banner h2 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(1.8rem, 3vw, 2.75rem);
    font-weight: 800;
    color: var(--color-action-on-coral);
    margin: 0 0 12px;
  }
  .cta-banner p {
    font-size: 18px;
    color: var(--color-action-on-coral);
    margin: 0 0 32px;
  }
  .cta-btns {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .cta-btns .btn-coral {
    background: #FFFFFF;
    color: var(--color-readable-coral-on-light);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .cta-btns .btn-coral:hover {
    background: #FFF;
    color: var(--color-readable-coral-on-light);
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  }
  .cta-btns .btn-outline-dark {
    background: transparent;
    color: var(--color-action-on-coral);
    border-color: var(--color-action-on-coral);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .cta-btns .btn-outline-dark:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: var(--color-action-on-coral);
    transform: translateY(-2px) scale(1.03);
  }
</style>
