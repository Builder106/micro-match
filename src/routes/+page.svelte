<script lang="ts">
  import Icon from "@iconify/svelte";
  import { page } from '$app/state';
  import { onMount, onDestroy, tick } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  export let data;

  let visible = false;
  let impactSeen = false;
  let badgeSeen: boolean[] = [];
  let progressCardEl: HTMLElement | null = null;
  let badgeCardEls: Array<HTMLElement | null> = [];

  let mobileMenuOpen = false;
  let menuToggleEl: HTMLButtonElement | null = null;
  let firstMenuLinkEl: HTMLAnchorElement | null = null;

  async function toggleMenu() {
    mobileMenuOpen = !mobileMenuOpen;
    if (mobileMenuOpen) {
      await tick();
      firstMenuLinkEl?.focus();
    }
  }

  function closeMenu() {
    if (!mobileMenuOpen) return;
    mobileMenuOpen = false;
    menuToggleEl?.focus();
  }

  function handleWindowKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && mobileMenuOpen) closeMenu();
  }

  $: if (typeof document !== 'undefined') {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
  }

  onDestroy(() => {
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  });

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

<svelte:window on:keydown={handleWindowKeydown} />

<svelte:head>
  <title>MicroMatch — Micro-volunteering for maximum impact</title>
  <meta name="description" content="Join MicroMatch to find micro-volunteering tasks from NGOs. Learn new skills and make a difference in just a few minutes." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="landing">

  <!-- ───── Header ───── -->
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="header-brand">
        <img src="/logo.png" alt="MicroMatch" width="36" height="36" />
        <span>MicroMatch</span>
      </a>
      <nav class="header-nav">
        <a href="/how-it-works">How it Works</a>
        <a href="/tasks">Browse Tasks</a>
        <a href="/for-ngos">For NGOs</a>
        <a href="/for-volunteers">For Volunteers</a>
      </nav>
      <div class="header-actions">
        <button
          type="button"
          class="menu-toggle"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          bind:this={menuToggleEl}
          on:click={toggleMenu}
        >
          <Icon icon={mobileMenuOpen ? 'lucide:x' : 'lucide:menu'} width="22" height="22" />
        </button>
        <a
          href="https://github.com/Builder106/MicroMatch"
          class="header-github"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View MicroMatch on GitHub"
        >
          <Icon icon="mdi:github" width="18" height="18" />
          <span>GitHub</span>
        </a>
        {#if page.data.userRole && page.data.userRole !== 'anonymous'}
          <a href="/tasks" class="header-signin">Browse tasks</a>
          <a href="/dashboard" class="btn-coral btn-sm" data-sveltekit-preload-data="hover">Go to dashboard</a>
        {:else}
          <a href="/login" class="header-signin">Sign In</a>
          <a href="/signup" class="btn-coral btn-sm">Join Now</a>
        {/if}
      </div>
    </div>
  </header>

  {#if mobileMenuOpen}
    <div
      class="mobile-menu-backdrop"
      role="presentation"
      on:click={closeMenu}
      transition:fade={{ duration: 150 }}
    ></div>
    <nav
      id="mobile-menu"
      class="mobile-menu"
      aria-label="Mobile"
      transition:fly={{ y: -12, duration: 200 }}
    >
      <a href="/how-it-works" bind:this={firstMenuLinkEl} on:click={closeMenu}>How it Works</a>
      <a href="/tasks" on:click={closeMenu}>Browse Tasks</a>
      <a href="/for-ngos" on:click={closeMenu}>For NGOs</a>
      <a href="/for-volunteers" on:click={closeMenu}>For Volunteers</a>
      <div class="mobile-menu-divider"></div>
      {#if page.data.userRole && page.data.userRole !== 'anonymous'}
        <a href="/tasks" on:click={closeMenu}>Browse tasks</a>
        <a href="/dashboard" class="mobile-menu-cta" on:click={closeMenu}>Go to dashboard</a>
      {:else}
        <a href="/login" on:click={closeMenu}>Sign In</a>
        <a href="/signup" class="mobile-menu-cta" on:click={closeMenu}>Join Now</a>
      {/if}
      <a
        href="https://github.com/Builder106/MicroMatch"
        class="mobile-menu-github"
        target="_blank"
        rel="noopener noreferrer"
        on:click={closeMenu}
      >
        <Icon icon="mdi:github" width="18" height="18" /> View on GitHub
      </a>
    </nav>
  {/if}

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
        <div class="mock-card mock-card-front" in:fly={{ x: 50, duration: 900, delay: 400 }}>
          <div class="mc-top">
            <img src="https://images.unsplash.com/photo-1638897212550-b0f4c5d8eb3d?w=150&h=150&fit=crop" alt="" class="mc-avatar" />
            <span class="mc-time"><Icon icon="lucide:clock" width="14" height="14" /> 15 mins</span>
          </div>
          <h3>Translate a medical flyer</h3>
          <p class="mc-ngo">Doctors Without Borders</p>
          <div class="mc-tags">
            <span style="background:#F3E8FF;color:#7C3AED">#Spanish</span>
            <span style="background:#D1FAE5;color:#059669">#Health</span>
          </div>
        </div>
        <div class="mock-card mock-card-back" in:fly={{ x: 30, duration: 900, delay: 600 }}>
          <div class="mc-top">
            <img src="https://images.unsplash.com/photo-1614807536394-cd67bd4a634b?w=150&h=150&fit=crop" alt="" class="mc-avatar" />
            <span class="mc-time"><Icon icon="lucide:clock" width="14" height="14" /> 5 mins</span>
          </div>
          <h3>Tag historical photos</h3>
          <div class="mc-tags">
            <span style="background:#DBEAFE;color:#2563EB">#History</span>
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

  <!-- ───── Footer ───── -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <img src="/logo.png" alt="MicroMatch" width="36" height="36" />
            <span>MicroMatch</span>
          </div>
          <p>Connecting volunteers with bite-sized tasks for maximum impact. Small efforts, big changes.</p>
        </div>
        <div class="footer-links">
          <div class="link-col">
            <h4>Platform</h4>
            <a href="/tasks">Browse Tasks</a>
            <a href="/dashboard">Dashboard</a>
            {#if !page.data.userRole || page.data.userRole === 'anonymous'}
              <a href="/login">Sign In</a>
            {/if}
          </div>
          <div class="link-col">
            <h4>Resources</h4>
            <a href="/how-it-works">How It Works</a>
            <a href="/for-ngos">For NGOs</a>
            <a href="/for-volunteers">For Volunteers</a>
            <a href="/impact">Impact</a>
            <a href="/docs/api">API Docs</a>
            <a href="/about">About Us</a>
            <a href="/help">Help Center</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 MicroMatch. All rights reserved.</p>
        <div class="footer-legal">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>
</div>

<style>
  /* ──────────── Foundation ──────────── */
  .landing {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #1E293B;
    background: #FDFCF8;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }
  .landing *, .landing *::before, .landing *::after { box-sizing: border-box; }
  .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
  .section-warm { background: #FDFCF8; padding: 96px 0; }
  .section-white { background: #FFFFFF; padding: 96px 0; }
  .section-head { text-align: center; max-width: 640px; margin: 0 auto 64px; }
  .section-head h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: clamp(1.75rem, 3vw + 0.5rem, 2.75rem); font-weight: 800; margin: 0 0 12px; }
  .section-head p { color: #1E293B99; font-size: 18px; font-weight: 500; margin: 0; }
  h1, h2, h3, h4, h5, h6 { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; color: #1E293B; }

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
  .btn-sm { padding: 10px 24px; font-size: 14px; }
  .btn-lg { padding: 0 32px; height: 56px; font-size: 18px; }

  /* ──────────── Header ──────────── */
  .site-header { position: sticky; top: 0; z-index: 50; background: rgba(253,252,248,0.8); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(0,0,0,0.05); }
  .header-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 72px; display: flex; align-items: center; justify-content: space-between; }
  .header-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #1E293B; }
  .header-brand span { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
  .header-nav { display: none; gap: 32px; }
  .header-nav a { font-size: 14px; font-weight: 500; color: #1E293Bb3; text-decoration: none; transition: color .2s; }
  .header-nav a:hover { color: #FF6B6B; }
  .header-actions { display: flex; align-items: center; gap: 12px; }
  .header-signin { font-size: 14px; font-weight: 600; color: #1E293B; text-decoration: none; display: none; }
  .header-signin:hover { color: #FF6B6B; }
  .header-github { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 40px; height: 40px; padding: 0; background: rgba(255,255,255,0.6); border: 1px solid rgba(30,41,59,0.1); border-radius: 9999px; color: #1E293B; font-size: 14px; font-weight: 600; text-decoration: none; transition: all .2s; }
  .header-github:hover { background: #1E293B; color: #fff; border-color: #1E293B; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(30,41,59,0.15); }
  .header-github span { display: none; }
  .menu-toggle { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; padding: 0; background: rgba(255,255,255,0.6); border: 1px solid rgba(30,41,59,0.1); border-radius: 9999px; color: #1E293B; cursor: pointer; transition: all .2s; }
  .menu-toggle:hover { background: rgba(255,255,255,0.9); border-color: rgba(30,41,59,0.2); }
  @media (min-width: 768px) {
    .header-nav { display: flex; }
    .header-signin { display: block; }
    .header-actions { gap: 16px; }
    .header-github { width: auto; height: auto; padding: 8px 16px; }
    .header-github span { display: inline; }
    .menu-toggle { display: none; }
    .mobile-menu, .mobile-menu-backdrop { display: none; }
  }

  /* ──────────── Mobile menu ──────────── */
  /* Fixed (not absolute-inside-header) because .site-header's backdrop-filter would
     otherwise make it the containing block for position:fixed descendants. */
  .mobile-menu-backdrop { position: fixed; inset: 72px 0 0 0; background: rgba(15,23,42,0.35); z-index: 49; }
  .mobile-menu { position: fixed; top: 72px; left: 0; right: 0; z-index: 50; display: flex; flex-direction: column; gap: 4px; padding: 16px 24px 24px; background: #FDFCF8; border-bottom: 1px solid rgba(0,0,0,0.05); box-shadow: 0 16px 32px rgba(0,0,0,0.08); max-height: calc(100vh - 72px); overflow-y: auto; }
  .mobile-menu a { display: block; padding: 12px 4px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 600; color: #1E293B; text-decoration: none; border-radius: 8px; }
  .mobile-menu a:hover { color: #FF6B6B; }
  .mobile-menu-divider { height: 1px; background: rgba(30,41,59,0.08); margin: 8px 0; }
  .mobile-menu-cta { background: #FF6B6B; color: #fff !important; text-align: center; border-radius: 9999px; font-weight: 700; }
  .mobile-menu-cta:hover { background: #ff5252; color: #fff !important; }
  .mobile-menu-github { display: flex !important; align-items: center; gap: 8px; color: #1E293Bb3 !important; }

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

  /* Hero Mockup Cards */
  .hero-visual { position: relative; width: 100%; height: 480px; display: flex; align-items: center; justify-content: center; }
  @media (max-width: 1023px) { .hero-visual { height: 380px; } }
  .hero-glow { position: absolute; width: 80%; height: 80%; background: linear-gradient(135deg, rgba(255,107,107,0.15), rgba(253,224,71,0.15)); border-radius: 50%; filter: blur(60px); }
  .mock-card { position: absolute; background: #fff; border-radius: 24px; padding: 24px; border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 8px; }
  .mock-card-front { z-index: 2; width: min(320px, 80vw); box-shadow: 0 24px 60px rgba(0,0,0,0.08); transform: rotate(6deg); top: 50%; left: 50%; translate: -40% -55%; }
  .mock-card-back { z-index: 1; width: min(280px, 70vw); box-shadow: 0 16px 40px rgba(0,0,0,0.05); opacity: 0.92; transform: rotate(-8deg) scale(0.95); top: 50%; left: 50%; translate: -65% -35%; }
  .mc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .mc-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .mc-time { padding: 4px 12px; background: #FDFCF8; border-radius: 9999px; font-size: 13px; font-weight: 700; border: 1px solid rgba(0,0,0,0.05); }
  .mock-card h3 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; line-height: 1.3; margin: 0; }
  .mc-ngo { color: #1E293B99; font-size: 14px; font-weight: 600; margin: 0; }
  .mc-tags { display: flex; gap: 8px; margin-top: 8px; }
  .mc-tags span { padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; }

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
  .tc-desc { color: #1E293Bb3; font-size: 15px; line-height: 1.6; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
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

  /* ──────────── Footer ──────────── */
  .site-footer { background: #1E293B; color: #fff; padding: 80px 0 32px; }
  .footer-grid { display: grid; grid-template-columns: 1fr; gap: 48px; margin-bottom: 48px; }
  @media (min-width: 768px) { .footer-grid { grid-template-columns: 2fr 1fr; } }
  .footer-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .footer-logo span { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; }
  .footer-brand p { color: rgba(255,255,255,0.6); font-weight: 500; line-height: 1.7; margin: 0; max-width: 360px; }
  .footer-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; }
  .link-col h4 { font-size: 18px; font-weight: 700; margin: 0 0 16px; }
  .link-col a { display: block; color: rgba(255,255,255,0.6); text-decoration: none; margin-bottom: 12px; font-weight: 500; transition: color .2s; }
  .link-col a:hover { color: #fff; }
  .footer-bottom { padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 16px; align-items: center; text-align: center; color: rgba(255,255,255,0.4); font-size: 14px; font-weight: 500; }
  .footer-bottom p { margin: 0; color: #fff; }
  .footer-legal { display: flex; gap: 24px; }
  .footer-legal a { color: rgba(255,255,255,0.4); text-decoration: none; transition: color .2s; }
  .footer-legal a:hover { color: #fff; }
  @media (min-width: 768px) { .footer-bottom { flex-direction: row; justify-content: space-between; } }
</style>
