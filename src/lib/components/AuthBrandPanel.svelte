<script lang="ts">
  import { onMount } from 'svelte';
  export let compact = false;
  export let showCopy = true;
  export let animation = '/animations/collaboration.lottie';

  let playerReady = false;
  onMount(() => {
    import('@dotlottie/player-component').then(() => {
      playerReady = true;
    });
  });
</script>

<section class:compact class="brand-stage">
  <div class="grain"></div>
  <div class="glow glow-coral"></div>
  <div class="glow glow-teal"></div>

  <div class="scene-wrap" aria-hidden="true">
    {#if playerReady}
      {#key animation}
        <dotlottie-player
          src={animation}
          autoplay
          loop="true"
          on:ready={(e: Event) => {
            try {
              interface DotLottieElement extends HTMLElement {
                setLooping?: (loop: boolean) => void;
                play?: () => void;
              }
              const el = e.currentTarget as DotLottieElement | null;
              // setLooping is the documented imperative API; the `loop` attribute
              // is parsed as a string and "true" is what the player expects.
              el?.setLooping?.(true);
              el?.play?.();
            } catch {}
          }}
          on:complete={(e: Event) => {
            try {
              interface DotLottieElement extends HTMLElement {
                play?: () => void;
              }
              (e.currentTarget as DotLottieElement | null)?.play?.();
            } catch {}
          }}
        ></dotlottie-player>
      {/key}
    {/if}
  </div>

  <div class="shade"></div>
  <div class="content">
    <a href="/" class="logo-lockup">
      <img src="/logo.png" alt="MicroMatch" class="logo-mark" />
      <span>MicroMatch</span>
    </a>

    {#if showCopy}
      <div class="copy">
        <h1>
          Small actions
          <br />
          create
          <br />
          <em>big impact.</em>
        </h1>
        <p>Step into a thriving civic world. Complete bite-sized tasks, build your streak, and help NGOs drive real change in minutes a day.</p>
      </div>
    {/if}
  </div>
</section>

<style>
  .brand-stage {
    position: relative;
    background: #0f172a;
    overflow: hidden;
    height: 100%;
    min-height: 0;
    color: #fff;
    isolation: isolate;
  }
  .compact {
    min-height: 300px;
    border-bottom-left-radius: 32px;
    border-bottom-right-radius: 32px;
  }
  .grain {
    position: absolute;
    inset: 0;
    opacity: 0.018;
    background-image: radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0);
    background-size: 4px 4px;
    pointer-events: none;
  }
  .glow {
    position: absolute;
    width: 520px;
    height: 520px;
    border-radius: 999px;
    filter: blur(100px);
    pointer-events: none;
  }
  .glow-coral {
    background: rgba(255, 107, 107, 0.16);
    top: -28%;
    left: -18%;
  }
  .glow-teal {
    background: rgba(72, 188, 174, 0.16);
    bottom: -30%;
    right: -20%;
  }
  .scene-wrap {
    position: absolute;
    top: 12%;
    left: 0;
    right: 0;
    height: 38%;
    display: grid;
    place-items: center;
    pointer-events: none;
  }
  .compact .scene-wrap {
    top: 12%;
    height: 42%;
  }
  .scene-wrap dotlottie-player {
    width: min(460px, 70%);
    height: 100%;
    display: block;
  }
  .compact .scene-wrap dotlottie-player {
    width: min(280px, 60%);
  }
  .shade {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 64%;
    background: linear-gradient(to top, rgba(15, 23, 42, 1) 0%, rgba(15, 23, 42, 0.9) 55%, rgba(15, 23, 42, 0) 100%);
    z-index: 2;
    pointer-events: none;
  }
  .content {
    position: relative;
    z-index: 3;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: 34px 28px 48px;
  }
  .compact .content {
    padding: 22px 24px;
  }
  .logo-lockup {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #fff;
    text-decoration: none;
    width: fit-content;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .logo-lockup span {
    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    transition: color 0.2s ease, text-shadow 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .logo-mark {
    width: 36px;
    height: 36px;
    display: block;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease;
  }

  .logo-lockup:hover .logo-mark {
    transform: scale(1.12) rotate(-8deg);
    filter: drop-shadow(0 0 10px rgba(255, 107, 107, 0.65));
  }

  .logo-lockup:hover span {
    color: #ffffff;
    transform: translateX(2px);
    text-shadow: 0 0 14px rgba(255, 255, 255, 0.45);
  }

  .logo-lockup:active .logo-mark {
    transform: scale(0.95) rotate(0deg);
  }

  .compact .logo-lockup { gap: 8px; }
  .compact .logo-lockup span { font-size: 1.05rem; }
  .compact .logo-mark { width: 28px; height: 28px; }
  .copy {
    position: absolute;
    left: 28px;
    right: 28px;
    top: 52%;
    max-width: 520px;
  }
  .copy h1 {
    margin: 0;
    color: #ffffff;
    font-size: clamp(2.25rem, 3.2vw, 3.25rem);
    line-height: 1.08;
    letter-spacing: -0.02em;
  }
  .copy em {
    font-style: italic;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1.05em;
    font-weight: 500;
    color: #ff8b8b;
  }
  .copy p {
    margin: 16px 0 0;
    color: #cbd5e1;
    font-size: 1.2rem;
    line-height: 1.6;
    font-weight: 500;
    max-width: 460px;
  }
  .compact .copy {
    position: static;
    margin-top: auto;
  }
  .compact .copy h1 {
    font-size: 1.5rem;
  }
  .compact .copy p {
    display: none;
  }
</style>
