<script lang="ts">
  import Icon from "@iconify/svelte";
  import PublicShell from '$lib/components/PublicShell.svelte';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  export let data;

  let visible = false;
  let impactSeen = false;
  let badgeSeen: boolean[] = [];
  let progressCardEl: HTMLElement | null = null;
  let badgeCardEls: Array<HTMLElement | null> = [];

  onMount(() => {
    let disposed = false;
    let observer: IntersectionObserver | null = null;
    import("@dotlottie/player-component").then(() => {
      if (disposed) return;
      visible = true;
      observer = new IntersectionObserver(
        (entries) => {
          if (!observer) return;
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            if (entry.target === progressCardEl) {
              impactSeen = true;
              observer.unobserve(entry.target);
              continue;
            }
            const badgeIndex = Number((entry.target as HTMLElement).dataset.badgeIndex);
            if (Number.isInteger(badgeIndex) && badgeIndex >= 0) {
              badgeSeen[badgeIndex] = true;
              badgeSeen = [...badgeSeen];
              observer.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.35 }
      );

      if (progressCardEl) observer.observe(progressCardEl);
      badgeCardEls.forEach((el) => {
        if (el) observer?.observe(el);
      });
    });

    return () => {
      disposed = true;
      observer?.disconnect();
    };
  });

  const steps = [
    { icon: 'lucide:search', title: 'Find a Task', description: 'Browse our feed of bite-sized tasks and find one that matches your skills and interests.', bg: '#DBEAFE', color: '#2563EB' },
    { icon: 'lucide:pen-tool', title: 'Learn & Complete', description: 'Access just-in-time learning resources and complete the task successfully in minutes.', bg: '#D1FAE5', color: '#059669' },
    { icon: 'lucide:award', title: 'Earn Recognition', description: 'Submit your work, get it approved by the NGO, and earn a badge for your contribution.', bg: '#FFEDD5', color: '#EA580C' },
  ];

  const demoBadges = [
    { title: 'First Translation', level: '3', gradient: 'linear-gradient(135deg, #FDE68A, #F59E0B)', icon: 'lucide:trophy', shadow: '0 8px 24px rgba(245,158,11,0.4)' },
    { title: 'Speed Demon', level: '10', gradient: 'linear-gradient(135deg, #FCA5A5, #E11D48)', icon: 'lucide:flame', shadow: '0 8px 24px rgba(225,29,72,0.4)' },
    { title: 'Global Citizen', level: '5', gradient: 'linear-gradient(135deg, #93C5FD, #4F46E5)', icon: 'lucide:globe', shadow: '0 8px 24px rgba(79,70,229,0.4)' },
    { title: 'Perfect Week', level: '1', gradient: 'linear-gradient(135deg, #6EE7B7, #059669)', icon: 'lucide:sparkles', shadow: '0 8px 24px rgba(5,150,105,0.4)' },
  ];
  badgeSeen = Array(demoBadges.length).fill(false);

  const tagColors: Record<string, { bg: string; color: string }> = {
    spanish: { bg: '#F3E8FF', color: '#7C3AED' },
    health: { bg: '#D1FAE5', color: '#059669' },
    translation: { bg: '#DBEAFE', color: '#2563EB' },
    design: { bg: '#FCE7F3', color: '#DB2777' },
    data: { bg: '#FEF3C7', color: '#D97706' },
    history: { bg: '#DBEAFE', color: '#2563EB' },
    environment: { bg: '#D1FAE5', color: '#059669' },
    excel: { bg: '#D1FAE5', color: '#059669' },
  };

  function getTagStyle(tag: string) {
    const key = tag.replace('#', '').toLowerCase();
    return tagColors[key] ?? { bg: '#F1F5F9', color: '#475569' };
  }
</script>

<svelte:head>
  <title>MicroMatch — Micro-volunteering for maximum impact</title>
  <meta name="description" content="Join MicroMatch to find micro-volunteering tasks from NGOs. Learn new skills and make a difference in just a few minutes." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<PublicShell activeTab="home">

  <!-- ───── Hero ───── -->
  <section class="hero">
    <div class="blob blob-yellow"></div>
    <div class="blob blob-coral"></div>
    <div class="blob blob-blue"></div>

    <div class="hero-inner">
      {#if visible}
      <div class="hero-copy" in:fly={{ y: 30, duration: 700 }}>
        <h1>Make a big impact in <br /><span class="coral-gradient">a few minutes.</span></h1>
        <p>MicroMatch connects you with bite-sized volunteer tasks from global NGOs. Complete them anytime, anywhere, and help drive change one small step at a time.</p>
        <div class="hero-buttons">
          <a href="/tasks" class="btn-coral btn-lg" data-sveltekit-preload-data="hover">Find a Task</a>
          {#if page.data.userRole === 'ngo'}
            <a href="/org" class="btn-outline btn-lg" data-sveltekit-preload-data="hover">Post a Task</a>
          {:else if page.data.userRole === 'volunteer' || page.data.userRole === 'user'}
            <a href="/dashboard" class="btn-outline btn-lg" data-sveltekit-preload-data="hover">View your impact</a>
          {:else}
            <a href="/signup" class="btn-outline btn-lg" data-sveltekit-preload-data="hover">Post a Task</a>
          {/if}
        </div>
      </div>
      {/if}

      <div class="hero-visual">
        {#if visible}
        <div class="hero-glow"></div>

        <!-- Card 1: Front Main -->
        <div class="mock-card mock-card-1">
          <div class="mc-sheen"></div>
          <div class="mc-top">
            <img src="https://images.unsplash.com/photo-1638897212550-b0f4c5d8eb3d?w=150&h=150&fit=crop" alt="Volunteer avatar" class="mc-avatar" />
            <span class="mc-time"><Icon icon="lucide:clock" width="14" height="14" /> 15 mins</span>
          </div>
          <h3>Translate a medical flyer</h3>
          <p class="mc-ngo">Doctors Without Borders <Icon icon="lucide:badge-check" width="14" height="14" class="mc-verified" /></p>
          <div class="mc-bottom">
            <div class="mc-tags">
              <span style="background:#F3E8FF;color:#7C3AED">#Spanish</span>
              <span style="background:#D1FAE5;color:#059669">#Health</span>
            </div>
            <a href="/tasks" class="mc-claim-btn">
              Claim <Icon icon="lucide:arrow-right" width="12" height="12" />
            </a>
          </div>
        </div>

        <!-- Card 2: Bottom Left Deck Card -->
        <div class="mock-card mock-card-2">
          <div class="mc-sheen"></div>
          <div class="mc-top">
            <img src="https://images.unsplash.com/photo-1614807536394-cd67bd4a634b?w=150&h=150&fit=crop" alt="Volunteer avatar" class="mc-avatar" />
            <span class="mc-time"><Icon icon="lucide:clock" width="14" height="14" /> 5 mins</span>
          </div>
          <h3>Tag historical photos</h3>
          <p class="mc-ngo">Smithsonian Archives <Icon icon="lucide:badge-check" width="14" height="14" class="mc-verified" /></p>
          <div class="mc-bottom">
            <div class="mc-tags">
              <span style="background:#DBEAFE;color:#2563EB">#History</span>
            </div>
            <a href="/tasks" class="mc-claim-btn">
              Claim <Icon icon="lucide:arrow-right" width="12" height="12" />
            </a>
          </div>
        </div>

        <!-- Card 3: Top Right Deck Card -->
        <div class="mock-card mock-card-3">
          <div class="mc-sheen"></div>
          <div class="mc-top">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop" alt="Volunteer avatar" class="mc-avatar" />
            <span class="mc-time"><Icon icon="lucide:clock" width="14" height="14" /> 10 mins</span>
          </div>
          <h3>Verify water pump data</h3>
          <p class="mc-ngo">Charity: Water <Icon icon="lucide:badge-check" width="14" height="14" class="mc-verified" /></p>
          <div class="mc-bottom">
            <div class="mc-tags">
              <span style="background:#FEF3C7;color:#D97706">#Data</span>
              <span style="background:#E0F2FE;color:#0284C7">#Water</span>
            </div>
            <a href="/tasks" class="mc-claim-btn">
              Claim <Icon icon="lucide:arrow-right" width="12" height="12" />
            </a>
          </div>
        </div>

        <!-- Card 4: Top Left Deck Card -->
        <div class="mock-card mock-card-4">
          <div class="mc-sheen"></div>
          <div class="mc-top">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" alt="Volunteer avatar" class="mc-avatar" />
            <span class="mc-time"><Icon icon="lucide:clock" width="14" height="14" /> 8 mins</span>
          </div>
          <h3>Proofread storybook</h3>
          <p class="mc-ngo">Room to Read <Icon icon="lucide:badge-check" width="14" height="14" class="mc-verified" /></p>
          <div class="mc-bottom">
            <div class="mc-tags">
              <span style="background:#FCE7F3;color:#DB2777">#Education</span>
            </div>
            <a href="/tasks" class="mc-claim-btn">
              Claim <Icon icon="lucide:arrow-right" width="12" height="12" />
            </a>
          </div>
        </div>
        {/if}
      </div>
    </div>
  </section>

  <!-- ───── How It Works ───── -->
  <section id="how-it-works" class="section-white">
    <div class="container">
      <div class="section-head">
        <h2>How It Works</h2>
        <p>A simple, effective way to make a difference.</p>
      </div>
      <div class="steps">
        {#each steps as step, i}
          <div class="step">
            <div class="step-icon" style="background:{step.bg};color:{step.color}">
              <Icon icon={step.icon} width="32" height="32" />
            </div>
            <h3>{i + 1}. {step.title}</h3>
            <p>{step.description}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ───── Featured Tasks ───── -->
  <section id="tasks" class="section-warm">
    <div class="container">
      <div class="tasks-header">
        <div>
          <h2>Featured Tasks</h2>
          <p>Start making a difference today. Pick a quick task and help an NGO right now.</p>
        </div>
        <a href="/tasks" class="btn-outline-dark" data-sveltekit-preload-data="hover">View All Tasks</a>
      </div>

      {#if data.tasks && data.tasks.length > 0}
        <div class="task-grid">
          {#each data.tasks as task}
            <article class="task-card">
              <div class="tc-top">
                <div class="tc-avatar-wrap">
                  <div class="tc-avatar">
                    <Icon icon="mdi:account-group" width="24" height="24" />
                  </div>
                </div>
                {#if typeof task.estimatedMinutes === 'number'}
                  <span class="tc-time"><Icon icon="lucide:clock" width="14" height="14" /> {task.estimatedMinutes} min</span>
                {/if}
              </div>
              <div class="tc-body">
                <p class="tc-ngo">{task.language ?? 'Community Task'}</p>
                <h3><a href="/task/{task.id}">{task.title}</a></h3>
                <p class="tc-desc">{task.shortDescription}</p>
              </div>
              <div class="tc-foot">
                <div class="tc-tags">
                  {#each task.tags as tag}
                    {@const s = getTagStyle(tag)}
                    <span style="background:{s.bg};color:{s.color}">#{tag}</span>
                  {/each}
                </div>
                <a href="/task/{task.id}" class="btn-dark-pill" data-sveltekit-preload-data="hover">View Task</a>
              </div>
            </article>
          {/each}
        </div>
      {:else}
        <!-- ───── Empty State ───── -->
        <div class="empty-card">
          <div class="empty-blob empty-blob-orange"></div>
          <div class="empty-blob empty-blob-yellow"></div>
          <div class="empty-inner">
            <div class="empty-mascot">
              <div class="empty-mascot-bg"></div>
              <div class="empty-mascot-icon">
                <dotlottie-player src="/animations/empty_state_mascot.lottie" autoplay loop="true"></dotlottie-player>
              </div>
              <div class="empty-sparkle">
                <Icon icon="lucide:sparkles" width="28" height="28" />
              </div>
            </div>
            <h2>You're too fast!</h2>
            <p>Our NGOs are busy preparing more bite-sized tasks. Check back soon, or browse the full task feed!</p>
            <a href="/tasks" class="btn-dark-pill btn-lg" data-sveltekit-preload-data="hover">Browse All Tasks</a>
          </div>
        </div>
      {/if}
    </div>
  </section>

  <!-- ───── Track Your Impact ───── -->
  <section id="impact" class="section-white">
    <div class="container">
      <div class="section-head">
        <h2>Track Your Impact</h2>
        <p>Earn experience, unlock tactile badges, and see your real-world contribution grow.</p>
      </div>
      <div class="impact-grid">
        <div class="progress-card" bind:this={progressCardEl}>
          <div class="progress-confetti">
            {#if impactSeen}
              <dotlottie-player src="/animations/confetti.lottie" autoplay></dotlottie-player>
            {/if}
          </div>
          <div class="progress-ring-wrap">
            <svg viewBox="0 0 100 100" class="progress-ring">
              <circle cx="50" cy="50" r="40" class="ring-bg" />
              <circle cx="50" cy="50" r="40" class="ring-fg" />
            </svg>
            <div class="ring-label">
              <span class="ring-pct">75%</span>
              <span class="ring-sub">To Next Level</span>
            </div>
          </div>
          <h3>Level 12 Volunteer</h3>
          <p>150 XP earned this week</p>
        </div>
        <div class="badges-section">
          <h4>Recent Awards</h4>
          <div class="badges-grid">
            {#each demoBadges as badge, i}
              <div class="badge-card" data-badge-index={i} bind:this={badgeCardEls[i]}>
                <div class="badge-sparkle">
                  {#if badgeSeen[i]}
                    <dotlottie-player src="/animations/badge_burst.lottie" autoplay></dotlottie-player>
                  {/if}
                </div>
                <div class="badge-icon" style="background:{badge.gradient};box-shadow:{badge.shadow}">
                  <Icon icon={badge.icon} width="36" height="36" />
                  <div class="badge-level">{badge.level}</div>
                </div>
                <span class="badge-title">{badge.title}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </section>

</PublicShell>

<style>
  /* ──────────── Foundation ──────────── */
  .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
  .section-warm { background: #FDFCF8; padding: 96px 0; }
  .section-white { background: #FFFFFF; padding: 96px 0; }
  .section-head { text-align: center; max-width: 640px; margin: 0 auto 64px; }
  .section-head h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: clamp(1.75rem, 3vw + 0.5rem, 2.75rem); font-weight: 800; margin: 0 0 12px; }
  .section-head p { color: #1E293B99; font-size: 18px; font-weight: 500; margin: 0; }
  h1, h2, h3, h4 { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; color: #1E293B; }

  /* ──────────── Buttons ──────────── */
  .btn-coral { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #FF6B6B; color: #fff; font-weight: 700; border: none; border-radius: 9999px; cursor: pointer; text-decoration: none; transition: all .3s; }
  .btn-coral:hover { background: #ff5252; transform: translateY(-2px); box-shadow: 0 16px 40px rgba(255,107,107,0.35); }
  .btn-coral:active { transform: scale(0.97); }
  .btn-outline { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: rgba(255,255,255,0.5); backdrop-filter: blur(12px); color: #1E293B; font-weight: 700; border: 2px solid rgba(30,41,59,0.1); border-radius: 9999px; cursor: pointer; text-decoration: none; transition: all .3s; }
  .btn-outline:hover { background: rgba(255,255,255,0.8); border-color: rgba(30,41,59,0.2); }
  .btn-outline-dark { display: inline-flex; align-items: center; justify-content: center; padding: 12px 32px; background: #fff; border: 1px solid rgba(30,41,59,0.1); border-radius: 9999px; color: #1E293B; font-weight: 700; font-size: 16px; text-decoration: none; transition: all .3s; white-space: nowrap; }
  .btn-outline-dark:hover { border-color: rgba(30,41,59,0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
  .btn-dark-pill { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 14px 0; background: #1E293B; color: #fff; font-weight: 700; font-size: 15px; border-radius: 9999px; text-decoration: none; transition: all .3s; }
  .btn-dark-pill:hover { background: #0F172A; }
  .btn-lg { padding: 0 32px; height: 56px; font-size: 18px; }

  /* ──────────── Hero ──────────── */
  .hero { position: relative; min-height: 90vh; display: flex; align-items: center; overflow: hidden; padding: 80px 0 0; }
  .blob { position: absolute; border-radius: 50%; pointer-events: none; mix-blend-mode: multiply; }
  .blob-yellow { top: -10%; left: -10%; width: 500px; height: 500px; background: rgba(253,224,71,0.4); filter: blur(100px); opacity: 0.7; }
  .blob-coral { top: 20%; right: -10%; width: 600px; height: 600px; background: rgba(255,107,107,0.2); filter: blur(120px); opacity: 0.6; }
  .blob-blue { bottom: -20%; left: 20%; width: 700px; height: 700px; background: rgba(147,197,253,0.3); filter: blur(140px); opacity: 0.5; }
  .hero-inner { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 0 24px; display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
  @media (min-width: 1024px) { .hero-inner { grid-template-columns: 1fr 1fr; gap: 32px; } .hero { padding: 0; } }
  .hero-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 28px; max-width: 560px; }
  .hero-copy h1 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: clamp(2.25rem, 5vw + 0.5rem, 4.25rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; margin: 0; color: #1E293B; }
  .coral-gradient { background: linear-gradient(135deg, #FF6B6B, #ff9e5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .hero-copy p { color: #1E293Bcc; font-size: clamp(1rem, 1.5vw + 0.25rem, 1.25rem); font-weight: 500; line-height: 1.7; margin: 0; max-width: 480px; }
  .hero-buttons { display: flex; flex-wrap: wrap; gap: 16px; width: 100%; }
  @media (max-width: 639px) { .hero-buttons { flex-direction: column; } .hero-buttons a { width: 100%; } }

  /* Hero Mockup Cards - Deck Unfold System */
  .hero-visual {
    position: relative;
    width: 100%;
    height: 520px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  @media (max-width: 1023px) { .hero-visual { height: 440px; } }

  .hero-glow {
    position: absolute;
    width: 85%;
    height: 85%;
    background: radial-gradient(circle, rgba(255,107,107,0.2) 0%, rgba(253,224,71,0.15) 45%, transparent 70%);
    border-radius: 50%;
    filter: blur(60px);
    transition: transform 0.6s ease, opacity 0.6s ease;
  }
  .hero-visual:hover .hero-glow {
    transform: scale(1.15);
    opacity: 0.95;
  }

  .mock-card-slot {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .mock-card {
    position: absolute;
    background: #fff;
    border-radius: 24px;
    padding: 20px;
    border: 1px solid rgba(0,0,0,0.06);
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow: hidden;
    pointer-events: auto;
    -webkit-font-smoothing: antialiased;
    backface-visibility: hidden;
    transition: 
      translate 0.45s cubic-bezier(0.16, 1, 0.3, 1),
      transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1),
      border-color 0.3s ease;
  }

  /* Glassmorphic Light Sheen */
  .mc-sheen {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 65%);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }
  .mock-card:hover .mc-sheen {
    opacity: 1;
  }

  /* --- Stacked Idle Positions & Pre-Slanted Entrance --- */
  .mock-card-1 {
    z-index: 4;
    width: min(340px, 82vw);
    box-shadow: 0 24px 50px rgba(0,0,0,0.08);
    top: 24%;
    left: 16%;
    transform: rotate(5deg);
    animation: 
      deal-in-1 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both,
      float-1 4.2s ease-in-out infinite 1s;
  }

  .mock-card-2 {
    z-index: 3;
    width: min(310px, 76vw);
    box-shadow: 0 16px 36px rgba(0,0,0,0.06);
    opacity: 0.94;
    top: 36%;
    left: 6%;
    transform: rotate(-7deg) scale(0.96);
    animation: 
      deal-in-2 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both,
      float-2 4.6s ease-in-out infinite 1.15s;
  }

  .mock-card-3 {
    z-index: 2;
    width: min(300px, 74vw);
    box-shadow: 0 14px 32px rgba(0,0,0,0.05);
    opacity: 0.88;
    top: 10%;
    left: 28%;
    transform: rotate(11deg) scale(0.92);
    animation: 
      deal-in-3 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both,
      float-3 4.4s ease-in-out infinite 1.3s;
  }

  .mock-card-4 {
    z-index: 1;
    width: min(290px, 72vw);
    box-shadow: 0 10px 24px rgba(0,0,0,0.04);
    opacity: 0.82;
    top: 12%;
    left: 8%;
    transform: rotate(-13deg) scale(0.88);
    animation: 
      deal-in-4 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.65s both,
      float-4 4.8s ease-in-out infinite 1.45s;
  }

  /* --- Pre-Slanted Entrance Keyframes --- */
  @keyframes deal-in-1 {
    0% {
      opacity: 0;
      transform: rotate(5deg) translate(60px, 20px) scale(0.92);
    }
    100% {
      opacity: 1;
      transform: rotate(5deg) translate(0, 0) scale(1);
    }
  }

  @keyframes deal-in-2 {
    0% {
      opacity: 0;
      transform: rotate(-7deg) scale(0.96) translate(-50px, 30px);
    }
    100% {
      opacity: 0.94;
      transform: rotate(-7deg) scale(0.96) translate(0, 0);
    }
  }

  @keyframes deal-in-3 {
    0% {
      opacity: 0;
      transform: rotate(11deg) scale(0.92) translate(40px, -40px);
    }
    100% {
      opacity: 0.88;
      transform: rotate(11deg) scale(0.92) translate(0, 0);
    }
  }

  @keyframes deal-in-4 {
    0% {
      opacity: 0;
      transform: rotate(-13deg) scale(0.88) translate(-40px, -40px);
    }
    100% {
      opacity: 0.82;
      transform: rotate(-13deg) scale(0.88) translate(0, 0);
    }
  }

  /* --- Idle Floating Keyframes --- */
  @keyframes float-1 {
    0%, 100% { transform: rotate(5deg) translate(0, 0); }
    50% { transform: rotate(1.5deg) translate(-6px, -18px); }
  }
  @keyframes float-2 {
    0%, 100% { transform: rotate(-7deg) scale(0.96) translate(0, 0); }
    50% { transform: rotate(-2.5deg) scale(0.97) translate(8px, 16px); }
  }
  @keyframes float-3 {
    0%, 100% { transform: rotate(11deg) scale(0.92) translate(0, 0); }
    50% { transform: rotate(5.5deg) scale(0.94) translate(6px, -15px); }
  }
  @keyframes float-4 {
    0%, 100% { transform: rotate(-13deg) scale(0.88) translate(0, 0); }
    50% { transform: rotate(-7.5deg) scale(0.9) translate(-8px, 18px); }
  }

  /* --- Concept 2: Deck Unfold / Fan Out on Container Hover --- */
  .hero-visual:hover .mock-card {
    animation-play-state: paused;
  }

  .hero-visual:hover .mock-card-1 {
    top: 48%;
    left: 44%;
    transform: rotate(3deg) scale(1.02);
    opacity: 0.95;
  }
  .hero-visual:hover .mock-card-2 {
    top: 48%;
    left: 4%;
    transform: rotate(-4deg) scale(1.02);
    opacity: 0.95;
  }
  .hero-visual:hover .mock-card-3 {
    top: 4%;
    left: 44%;
    transform: rotate(5deg) scale(1.02);
    opacity: 0.95;
  }
  .hero-visual:hover .mock-card-4 {
    top: 4%;
    left: 4%;
    transform: rotate(-5deg) scale(1.02);
    opacity: 0.95;
  }

  /* Mobile Unfold Offsets */
  @media (max-width: 639px) {
    .hero-visual:hover .mock-card-1 { top: 48%; left: 40%; }
    .hero-visual:hover .mock-card-2 { top: 48%; left: 2%; }
    .hero-visual:hover .mock-card-3 { top: 4%; left: 40%; }
    .hero-visual:hover .mock-card-4 { top: 4%; left: 2%; }
  }

  /* Smooth Sibling Recede when any card is directly hovered */
  .hero-visual:has(.mock-card:hover) .mock-card:not(:hover) {
    opacity: 0.65 !important;
    transform: scale(0.97) !important;
  }

  /* --- Direct Card Hover Pop --- */
  .mock-card:hover {
    z-index: 30 !important;
    opacity: 1 !important;
    transform: rotate(0deg) scale(1.06) !important;
    box-shadow: 0 32px 70px rgba(255, 107, 107, 0.25), 0 0 0 2px rgba(255, 107, 107, 0.3) !important;
    border-color: rgba(255, 107, 107, 0.35) !important;
  }

  .mc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .mc-avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.3s ease; }
  .mock-card:hover .mc-avatar { transform: scale(1.12); }
  .mc-time { padding: 4px 12px; background: #FDFCF8; border-radius: 9999px; font-size: 12px; font-weight: 700; border: 1px solid rgba(0,0,0,0.05); transition: all 0.3s ease; }
  .mock-card:hover .mc-time { background: rgba(255,107,107,0.12); color: #FF6B6B; border-color: rgba(255,107,107,0.2); }
  .mock-card h3 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; line-height: 1.3; margin: 0; }
  
  /* Verified NGO Badge */
  .mc-ngo { color: #1E293B99; font-size: 13px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 4px; }
  .mc-verified { color: #0284C7; flex-shrink: 0; }

  /* Bottom Row with Tag Stagger and Claim Button */
  .mc-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; gap: 8px; }
  .mc-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .mc-tags span { padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; transition: transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1); }
  .mock-card:hover .mc-tags span:nth-child(1) { transform: translateY(-2px) scale(1.04); }
  .mock-card:hover .mc-tags span:nth-child(2) { transform: translateY(-2px) scale(1.04); transition-delay: 0.05s; }

  /* Quick Claim Button */
  .mc-claim-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 9999px; background: #FF6B6B; color: #fff; font-size: 11px; font-weight: 700; text-decoration: none; opacity: 0; transform: scale(0.92) translateX(4px); transition: all 0.3s cubic-bezier(0.34, 1.4, 0.64, 1); white-space: nowrap; }
  .mock-card:hover .mc-claim-btn { opacity: 1; transform: scale(1) translateX(0); }
  .mc-claim-btn:hover { background: #ff5252; transform: scale(1.06) !important; box-shadow: 0 4px 12px rgba(255,107,107,0.35); }

  /* ──────────── How It Works ──────────── */
  .steps { display: grid; grid-template-columns: 1fr; gap: 48px; max-width: 1000px; margin: 0 auto; }
  @media (min-width: 768px) { .steps { grid-template-columns: repeat(3, 1fr); gap: 48px; } }
  .step { display: flex; flex-direction: column; align-items: center; text-align: center; }
  .step-icon { width: 96px; height: 96px; border-radius: 32px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; transition: transform .3s; }
  .step:hover .step-icon { transform: scale(1.1); }
  .step h3 { font-size: 22px; font-weight: 700; margin: 0 0 12px; }
  .step p { color: #1E293Bb3; font-weight: 500; line-height: 1.6; max-width: 280px; margin: 0; }

  /* ──────────── Task Cards ──────────── */
  .tasks-header { display: flex; flex-direction: column; gap: 16px; margin-bottom: 48px; }
  .tasks-header h2 { font-size: clamp(1.75rem, 3vw + 0.25rem, 2.75rem); font-weight: 800; margin: 0; }
  .tasks-header > div > p { color: #1E293B99; font-size: 18px; font-weight: 500; margin: 8px 0 0; max-width: 560px; }
  @media (min-width: 768px) { .tasks-header { flex-direction: row; align-items: center; justify-content: space-between; } }
  .task-grid { display: grid; grid-template-columns: 1fr; gap: 28px; }
  @media (min-width: 640px) { .task-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .task-grid { grid-template-columns: repeat(3, 1fr); } }
  .task-card { background: #fff; border-radius: 28px; padding: 32px; border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; transition: all .3s; box-shadow: 0 16px 40px rgba(0,0,0,0.04); }
  .task-card:hover { transform: translateY(-4px); box-shadow: 0 24px 60px rgba(0,0,0,0.08); }
  .tc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
  .tc-avatar-wrap { transition: transform .3s; }
  .task-card:hover .tc-avatar-wrap { transform: scale(1.1); }
  .tc-avatar { width: 56px; height: 56px; border-radius: 20px; background: linear-gradient(135deg, #DBEAFE, #93C5FD); display: flex; align-items: center; justify-content: center; color: #2563EB; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  .tc-time { padding: 6px 14px; border-radius: 9999px; font-size: 14px; font-weight: 700; background: rgba(255,107,107,0.1); color: #FF6B6B; }
  .tc-body { flex: 1; margin-bottom: 20px; }
  .tc-ngo { font-size: 13px; font-weight: 600; color: #1E293B99; margin: 0 0 8px; }
  .tc-body h3 { font-size: 22px; font-weight: 700; line-height: 1.3; margin: 0 0 8px; }
  .tc-body h3 a { color: inherit; text-decoration: none; }
  .tc-body h3 a:hover { color: #FF6B6B; }
  .tc-desc { color: #1E293Bb3; font-size: 15px; line-height: 1.6; margin: 0; display: -webkit-box; line-clamp: 2; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .tc-foot { display: flex; flex-direction: column; gap: 16px; }
  .tc-tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .tc-tags span { padding: 5px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; }

  /* ──────────── Empty State ──────────── */
  .empty-card { position: relative; overflow: hidden; background: #fff; border-radius: 40px; padding: 64px 48px; text-align: center; box-shadow: 0 24px 60px rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.1); margin-top: 16px; }
  .empty-blob { position: absolute; border-radius: 50%; pointer-events: none; }
  .empty-blob-orange { top: -20%; right: -10%; width: 300px; height: 300px; background: #FFEDD5; filter: blur(80px); opacity: 0.6; }
  .empty-blob-yellow { bottom: -20%; left: -10%; width: 300px; height: 300px; background: #FEF3C7; filter: blur(80px); opacity: 0.6; }
  .empty-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; }
  .empty-mascot { position: relative; width: 192px; height: 192px; margin-bottom: 32px; }
  .empty-mascot-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #FF6B6B, #FDBA74); border-radius: 32px; transform: rotate(6deg); box-shadow: 0 16px 40px rgba(255,107,107,0.3); }
  .empty-mascot-icon { position: absolute; inset: 0; background: #FDFCF8; border-radius: 32px; transform: rotate(-3deg); border: 4px solid #fff; display: flex; align-items: center; justify-content: center; color: #FF6B6B; transition: transform .3s; }
  .empty-mascot-icon:hover { transform: rotate(0deg); }
  .empty-mascot-icon dotlottie-player { width: 168px; height: 168px; display: block; }
  .empty-sparkle { position: absolute; top: -16px; right: -16px; color: #FF6B6B; animation: bounce 2s ease-in-out infinite; }
  @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .empty-card h2 { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 800; margin: 0 0 16px; }
  .empty-card p { color: #1E293Bb3; font-size: 18px; font-weight: 500; max-width: 480px; margin: 0 0 32px; line-height: 1.7; }

  /* ──────────── Impact / Gamification ──────────── */
  .impact-grid { display: grid; grid-template-columns: 1fr; gap: 32px; align-items: center; justify-items: center; max-width: 960px; margin: 0 auto; }
  @media (min-width: 768px) { .impact-grid { grid-template-columns: auto 1fr; gap: 48px; } }
  .progress-card { position: relative; overflow: hidden; background: #FDFCF8; border-radius: 32px; padding: 40px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 24px 60px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05); width: 100%; max-width: 360px; }
  .progress-confetti { position: absolute; inset: 0; pointer-events: none; opacity: 0.9; }
  .progress-confetti dotlottie-player { width: 100%; height: 100%; display: block; }
  .progress-ring-wrap { position: relative; width: 192px; height: 192px; margin-bottom: 24px; }
  .progress-ring { width: 100%; height: 100%; transform: rotate(-90deg); }
  .ring-bg { fill: transparent; stroke: #E2E8F0; stroke-width: 8; }
  .ring-fg { fill: transparent; stroke: #FF6B6B; stroke-width: 8; stroke-linecap: round; stroke-dasharray: 251; stroke-dashoffset: 63; transition: stroke-dashoffset 1.5s ease-out; }
  .ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .ring-pct { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 40px; font-weight: 800; }
  .ring-sub { font-size: 11px; font-weight: 700; color: #1E293B80; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }
  .progress-card h3 { font-size: 22px; font-weight: 700; margin: 0 0 8px; text-align: center; }
  .progress-card p { color: #1E293B99; font-weight: 500; margin: 0; text-align: center; }
  .badges-section { width: 100%; }
  .badges-section h4 { font-size: 22px; font-weight: 700; margin: 0 0 20px; padding: 0 8px; }
  .badges-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .badge-card { position: relative; overflow: hidden; background: #fff; border-radius: 24px; padding: 20px 16px; display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 2px 8px rgba(0,0,0,0.03); transition: transform .3s; }
  .badge-sparkle { position: absolute; inset: 0; pointer-events: none; }
  .badge-sparkle dotlottie-player { width: 100%; height: 100%; display: block; }
  .badge-card:hover { transform: translateY(-4px); }
  .badge-icon { position: relative; width: 80px; height: 80px; border-radius: 24px; display: flex; align-items: center; justify-content: center; color: #fff; margin-bottom: 12px; transition: transform .3s; overflow: visible; }
  .badge-card:hover .badge-icon { transform: scale(1.1); }
  .badge-level { position: absolute; bottom: -6px; right: -6px; width: 28px; height: 28px; border-radius: 50%; background: #1E293B; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
  .badge-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 700; line-height: 1.3; }
</style>
