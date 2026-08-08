<script lang="ts">
   import '@smui/top-app-bar';
   import '@smui/button';
   import '../app.css';

   import TopAppBar from '@smui/top-app-bar';
   import Button from '@smui/button';
   import Icon from '@iconify/svelte';
   import ThemeToggle from '$lib/components/ThemeToggle.svelte';
   import Sidebar from '$lib/components/Sidebar.svelte';
   import { onMount } from 'svelte';
   import { page } from '$app/stores';
   import { get } from 'svelte/store';
   import { account, getJWT } from '$lib/appwrite.client';
   import { dev } from '$app/environment';
   import { inject } from '@vercel/analytics';
  const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const publicPaths = ['/about', '/contact', '/cookies', '/docs', '/help', '/privacy', '/terms', '/how-it-works', '/for-ngos', '/for-volunteers', '/tasks', '/impact'];

  const ogTitle = 'MicroMatch — Make a big impact in a few minutes';
  const ogDescription = 'Pair with NGOs on 5–30 minute volunteer tasks. Claim what fits your skills, submit your work, and earn badges that build a verified track record.';
  const ogImageAlt = 'MicroMatch — Make a big impact in a few minutes.';
  $: origin = (($page.data as any)?.origin as string | undefined) ?? $page.url.origin;
  $: ogUrl = origin + $page.url.pathname;
  $: ogImage = origin + '/social-preview.png';
  $: pathname = $page.url.pathname;
  $: isLanding = pathname === '/';
  $: isAuthPath = authPaths.includes(pathname);
  $: isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  $: userRole = (($page.data as any)?.userRole as string | undefined) ?? 'anonymous';
  $: isSignedIn = userRole !== 'anonymous';
  $: showAppChrome = !isLanding && !isAuthPath && (!isPublicPath || (pathname === '/tasks' && isSignedIn)) && isSignedIn;


 
  // Add Google Fonts
   
   onMount(() => {
     inject({ mode: dev ? 'development' : 'production' });

     const links = [
       'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
       'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap',
       'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap'
     ];
     links.forEach(href => {
       const link = document.createElement('link');
       link.href = href;
       link.rel = 'stylesheet';
       document.head.appendChild(link);
     });

         (async () => {
      // Skip the account/JWT round-trip on auth pages and when there's no session
      // hint at all — `account.get()` would 401 and pollute the console for users
      // who aren't logged in (which is, by definition, the case on /login).
      const onAuthPage = authPaths.includes(window.location.pathname);
      const hasRoleCookie = /(?:^|;\s*)mm_role=/.test(document.cookie || '');
      const hadSessionFlag = (() => { try { return localStorage.getItem('mm_has_session') === '1'; } catch { return false; } })();
      if (onAuthPage || (!hasRoleCookie && !hadSessionFlag)) return;

      try {
        const user = await account.get();
        try { localStorage.setItem('mm_has_session', '1'); } catch {}
        const jwt = await getJWT();
        if (jwt) {
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ jwt })
          });
          
          if (response.ok) {
            await response.json();
            
            // If user doesn't have a role set, redirect to profile
            const prefs = user?.prefs ?? {};
            if (!prefs.role && window.location.pathname !== '/profile' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
              window.location.href = '/profile';
            }

            // Ensure UI reflects role immediately after session creation.
            // If server-rendered role differs from cookie-hinted role, reload once.
            try {
              const cookie = document.cookie || '';
              const match = cookie.match(/(?:^|;\s*)mm_role=([^;]+)/);
              const hinted = match ? decodeURIComponent(match[1]) : '';
              const valid = hinted === 'ngo' || hinted === 'volunteer' || hinted === 'user';
              if (valid && hinted !== ((get(page).data as any).userRole || '')) {
                // Avoid loops: mark a one-time reload flag
                const reloaded = sessionStorage.getItem('mm_role_refreshed');
                if (!reloaded) {
                  sessionStorage.setItem('mm_role_refreshed', '1');
                  window.location.reload();
                }
              } else {
                try { sessionStorage.removeItem('mm_role_refreshed'); } catch {}
              }
            } catch {}
          }
        }
      } catch (err) {
        // Silent error handling for auth setup
      }
    })();
   });
 </script>
 
 <svelte:head>
 	<link rel="icon" href="/favicon.ico" sizes="any" />
 	<link rel="icon" href="/logo.png" type="image/png" />
 	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
 	<title>MicroMatch</title>
 	<meta name="description" content={ogDescription} />

 	<meta property="og:type" content="website" />
 	<meta property="og:site_name" content="MicroMatch" />
 	<meta property="og:title" content={ogTitle} />
 	<meta property="og:description" content={ogDescription} />
 	<meta property="og:url" content={ogUrl} />
 	<meta property="og:image" content={ogImage} />
 	<meta property="og:image:width" content="1280" />
 	<meta property="og:image:height" content="640" />
 	<meta property="og:image:alt" content={ogImageAlt} />

 	<meta name="twitter:card" content="summary_large_image" />
 	<meta name="twitter:title" content={ogTitle} />
 	<meta name="twitter:description" content={ogDescription} />
 	<meta name="twitter:image" content={ogImage} />
 	<meta name="twitter:image:alt" content={ogImageAlt} />
 </svelte:head>
 
{#if showAppChrome}
<TopAppBar style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); box-shadow: var(--elev-1); z-index: 10; border-bottom: 1px solid var(--color-outline-variant);">
   <svelte:fragment slot="navigation">
     <Button variant="text" href="/tasks" aria-label="Home" style="color: var(--color-primary); font-weight: var(--font-medium);">
       <Icon icon="mdi:home" width="24" height="24"/>
     </Button>
   </svelte:fragment>
   <svelte:fragment slot="title">
     <div style="display: flex; align-items: center; gap: var(--space-2);">
       <img src="/logo.png" alt="MicroMatch Logo" width="32" height="32" style="display: block;" />
        <span style="font-weight: var(--font-bold); font-size: var(--text-xl); color: var(--color-primary);">MicroMatch</span>
     </div>
   </svelte:fragment>
   <svelte:fragment slot="actions">
    <ThemeToggle compact={true} />
    {#if $page.data.userRole === 'ngo'}
      <Button variant="text" href="/org" aria-label="Post task" class="btn-primary" style="padding: var(--space-2) var(--space-4); font-size: var(--text-sm);">
        <Icon icon="mdi:plus-circle-outline" width="24" height="24"/>
        <span style="margin-left: var(--space-1);">Post</span>
      </Button>
    {/if}
   </svelte:fragment>
 </TopAppBar>
{/if}
 
 <div class="page-shell">
   {#if showAppChrome}
      <Sidebar />
   {/if}
 {#if isLanding || isAuthPath || isPublicPath}
    <div style="flex: 1 1 auto; width: 100%;">
      <slot />
    </div>
  {:else}
    <div class="container" style="padding: var(--space-5) var(--space-4); flex: 1 1 auto; max-width: 1060px;">
      <slot />
    </div>
  {/if}
  {#if showAppChrome}
    <nav class="bottom-nav">
    <div style="display: flex; gap: var(--space-6); justify-content: space-around; padding: var(--space-4) 0;">
      <a href="/tasks" style="text-align:center;text-decoration:none;color:inherit">
        <div class:card-elevated={$page.url.pathname === '/tasks'} class:animate-scale-in={$page.url.pathname === '/tasks'} style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 40px; border-radius: var(--radius-xl); background: var(--color-primary); color: var(--color-on-primary); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);">
          <Icon icon="mdi:view-dashboard-outline" width="20" height="20"/>
        </div>
        <small style="display: block; color: var(--color-primary); margin-top: var(--space-2); font-weight: var(--font-medium); font-size: var(--text-xs);">Feed</small>
      </a>
      <a href="/dashboard" style="text-align:center;text-decoration:none;color:inherit">
        <div class="hover-lift" style="width: 56px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-xl); background: var(--color-surface-variant); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);">
          <Icon icon="mdi:seal-variant" width="20" height="20" style="color: var(--color-text-secondary);"/>
        </div>
        <small style="display: block; color: var(--color-text-secondary); margin-top: var(--space-2); font-weight: var(--font-medium); font-size: var(--text-xs);">Badges</small>
      </a>
      {#if $page.data.userRole === 'ngo'}
        <a href="/badges/manage" style="text-align:center;text-decoration:none;color:inherit">
          <div class="hover-lift" style="width: 56px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-xl); background: var(--color-surface-variant); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);">
            <Icon icon="mdi:shield-edit" width="20" height="20" style="color: var(--color-text-secondary);"/>
          </div>
          <small style="display: block; color: var(--color-text-secondary); margin-top: var(--space-2); font-weight: var(--font-medium); font-size: var(--text-xs);">Manage</small>
        </a>
        <a href="/badges/analytics" style="text-align:center;text-decoration:none;color:inherit">
          <div class="hover-lift" style="width: 56px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-xl); background: var(--color-surface-variant); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);">
            <Icon icon="mdi:chart-line" width="20" height="20" style="color: var(--color-text-secondary);"/>
          </div>
          <small style="display: block; color: var(--color-text-secondary); margin-top: var(--space-2); font-weight: var(--font-medium); font-size: var(--text-xs);">Stats</small>
        </a>
      {/if}
      {#if $page.data.userRole === 'ngo'}
        <a href="/org" style="text-align:center;text-decoration:none;color:inherit">
          <div class="hover-lift" style="width: 56px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-xl); background: var(--color-surface-variant); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);">
            <Icon icon="mdi:plus-circle-outline" width="20" height="20" style="color: var(--color-text-secondary);"/>
          </div>
          <small style="display: block; color: var(--color-text-secondary); margin-top: var(--space-2); font-weight: var(--font-medium); font-size: var(--text-xs);">Post</small>
        </a>
      {/if}
    </div>
    </nav>
  {/if}
</div>