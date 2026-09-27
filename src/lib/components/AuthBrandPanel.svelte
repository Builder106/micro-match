<script lang="ts">
  import LottieAnimation from '$lib/components/LottieAnimation.svelte';
  import { resolve } from '$app/paths';
  export let animation = '/animations/collaboration.json';
</script>

<section class="brand-stage" aria-label="MicroMatch introduction">
  <div class="scene-wrap" aria-hidden="true">
    <div class="glow glow-coral"></div>
    <div class="glow glow-teal"></div>
    {#key animation}
      <LottieAnimation src={animation} loop={true} className="auth-brand-animation" />
    {/key}
  </div>

  <div class="content">
    <a href={resolve("/", {})} class="logo-lockup">
      <img src="/logo.png" alt="" class="logo-mark" />
      <span>MicroMatch</span>
    </a>

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
  .glow {
    position: absolute;
    width: min(26vw, 320px);
    aspect-ratio: 1;
    border-radius: 999px;
    filter: blur(clamp(24px, 5vh, 48px));
    pointer-events: none;
    z-index: 0;
  }
  .glow-coral {
    background: rgba(255, 107, 107, 0.16);
    top: 4%;
    left: -6%;
  }
  .glow-teal {
    background: rgba(72, 188, 174, 0.16);
    top: 0;
    right: -10%;
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
    overflow: hidden;
    z-index: 0;
  }
  .scene-wrap :global(.auth-brand-animation) {
    width: min(460px, 70%);
    height: 100%;
    display: block;
    overflow: hidden;
    position: relative;
    z-index: 1;
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
  .logo-lockup {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #fff;
    text-decoration: none;
    width: fit-content;
    position: relative;
    z-index: 1;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .logo-lockup:focus-visible {
    outline: 2px solid #ff8b8b;
    outline-offset: 5px;
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

  .copy {
    position: absolute;
    inset-inline: 28px;
    width: min(520px, calc(100% - 56px));
    top: 52%;
    z-index: 4;
    max-width: 520px;
    box-sizing: border-box;
  }
  .copy h1 {
    margin: 0;
    background: transparent;
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
    background: transparent;
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
  @media (max-width: 1023px) {
    .brand-stage {
      min-height: 300px;
      border-radius: 0 0 32px 32px;
    }
    .scene-wrap {
      top: 18%;
      height: 38%;
    }
    .scene-wrap :global(.auth-brand-animation) {
      width: min(280px, 60%);
    }
    .scene-wrap .glow {
      width: min(32vw, 140px);
      filter: blur(24px);
    }
    .content {
      padding: 22px 24px;
    }
    .logo-lockup {
      gap: 8px;
    }
    .logo-lockup span {
      font-size: 1.05rem;
    }
    .logo-mark {
      width: 28px;
      height: 28px;
    }
    .copy {
      position: relative;
      inset-inline: auto;
      top: auto;
      width: auto;
      max-width: none;
      margin-top: auto;
      z-index: 1;
    }
    .copy h1 {
      font-size: 1.5rem;
    }
    .copy p {
      display: none;
    }
  }
</style>
