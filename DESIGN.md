# MicroMatch Design System & Style Guide

Welcome to the **MicroMatch Design System**. This document defines the design architecture, visual language, component patterns, and token specs that govern the user interface for MicroMatch.

---

## 📄 Overview & Brand Identity

**MicroMatch** is a micro-volunteering marketplace pairing non-governmental organizations (NGOs) with volunteers for bite-sized, high-impact tasks (5 to 30 minutes).

### Core Aesthetic Principles

1. **Warm Cream & Coral Palette**: Approaching volunteering with optimism, warmth, and energy. We replace cold corporate blues with warm creams (`#FDFCF8`), coral primaries (`#FF6B6B`), and peach accents (`#FDBA74`).
2. **Clarity & Speed**: Volunteers engage in micro-moments. Interface elements must be high-contrast, scannable, and friction-free with immediate task filters (`≤15m`, `≤20m`, `≤30m`).
3. **Verified Trust & Recognition**: Verified badges, progress rings, and org-owned achievement tokens celebrate volunteer contributions.
4. **Adaptive Dark Mode**: Seamless support for light and dark color schemes (`.light` and `.dark` root classes), maintaining warm card borders and readable text hierarchy across environments.

---

## 🎨 Color Architecture

Color tokens are structured into primary brand colors, surface tones, typography scales, feedback states, and tag-specific palettes.

### Primary & Brand Colors

| Token Name | Hex / CSS Value | Description |
| --- | --- | --- |
| `--color-primary` | `#FF6B6B` | Brand warm coral, primary buttons, hero text gradients |
| `--color-primary-variant` | `#E85555` | Deeper coral for button hover states |
| `--color-primary-light` | `#FF9E5E` | Light coral for gradients and scrollbar hover states |
| `--color-on-primary` | `#FFFFFF` | Text/icon color on primary backgrounds |
| `--color-secondary` | `#FDBA74` | Warm peach accent |
| `--color-secondary-variant` | `#FB923C` | Deep peach accent variant |
| `--color-secondary-light` | `#FED7AA` | Soft peach surface highlight |

### Accent Ramp (Coral / Warm Red)

| Token Name | Hex | Usage |
| --- | --- | --- |
| `--color-accent-blue-50` | `#FFF5F0` | Canvas gradient stop, chip hover background |
| `--color-accent-blue-100` | `#FFE5DC` | Chip background tint |
| `--color-accent-blue-200` | `#FFD1C2` | Border highlight, scrollbar thumb |
| `--color-accent-blue-500` | `#FF6B6B` | Primary accent base |
| `--color-accent-blue-600` | `#E85555` | Darker accent state |
| `--color-accent-blue-700` | `#CF4444` | High-contrast accent |

### Surface & Background Tokens

#### Light Mode

| Token Name | Hex | Description |
| --- | --- | --- |
| `--color-background` | `#FDFCF8` | Primary page canvas |
| `--color-surface` | `#FFFFFF` | Base card and container background |
| `--color-surface-variant` | `#FAF7F0` | Muted surface (chips, secondary cards) |
| `--color-surface-container` | `#F5F0E8` | Elevated container surface |
| `--color-outline` | `#CBD5E1` | Standard divider and border color |
| `--color-outline-variant` | `#E2E8F0` | Subtle container outline |
| `--card-border` | `rgba(15, 23, 42, 0.06)` | Light mode card border |

#### Dark Mode

| Token Name | Hex | Description |
| --- | --- | --- |
| `--color-background` | `#0F172A` | Slate dark canvas |
| `--color-surface` | `#1E293B` | Base dark card background |
| `--color-surface-variant` | `#334155` | Dark muted surface |
| `--color-surface-container` | `#475569` | Elevated dark container surface |
| `--color-outline` | `#475569` | Dark divider and border color |
| `--color-outline-variant` | `#334155` | Dark subtle container outline |
| `--card-border` | `rgba(241, 245, 249, 0.10)` | Dark mode card border |

### Text & Feedback Colors

| Token | Light Hex | Dark Hex | Role |
| --- | --- | --- | --- |
| `--color-text` | `#0F172A` | `#F1F5F9` | Primary headings and body text |
| `--color-text-secondary` | `#475569` | `#CBD5E1` | Secondary labels and supporting prose |
| `--color-text-tertiary` | `#64748B` | `#94A3B8` | Captions, metadata, and timestamps |
| `--color-success` | `#059669` | `#059669` | Approved claims, verified chips, success state |
| `--color-warning` | `#D97706` | `#D97706` | Pending verification, warning alerts |
| `--color-error` | `#DC2626` | `#DC2626` | Rejected claims, errors, destructive alerts |

### Dynamic Tag Palette

Tags adapt automatically based on category keywords (`getTagStyle`):

| Category Key | Background | Text Color |
| --- | --- | --- |
| `spanish`, `french` | `#F3E8FF` | `#7C3AED` |
| `health`, `environment`, `excel` | `#D1FAE5` | `#059669` |
| `translation`, `history` | `#DBEAFE` | `#2563EB` |
| `design`, `research` | `#FCE7F3` | `#DB2777` |
| `data`, `education` | `#FEF3C7` | `#D97706` |
| `default` | `#F1F5F9` | `#475569` |

---

## 🔤 Typography

MicroMatch utilizes a dual-font strategy:
- **Headings & Brand Titles**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (weights 500, 600, 700, 800) for geometric, modern clarity.
- **Body & UI Controls**: [Inter](https://fonts.google.com/specimen/Inter) / [Roboto](https://fonts.google.com/specimen/Roboto) (weights 300, 400, 500, 600, 700) for legibility at small sizes.

### Type Scale

| CSS Token | Size | Weight | Typical Usage |
| --- | --- | --- | --- |
| `--text-xs` | `12px` | `500` / `700` | Micro-labels, tag pills, timestamps |
| `--text-sm` | `14px` | `400` / `500` | Secondary buttons, body small, filter options |
| `--text-base` | `16px` | `400` | Standard body prose, form inputs |
| `--text-lg` | `18px` | `500` / `600` | Subheadings, card titles, section links |
| `--text-xl` | `20px` | `600` | Section headers (`h3`) |
| `--text-2xl` | `24px` | `600` | Page subheaders (`h2`) |
| `--text-3xl` | `30px` | `700` | Primary page headers (`h1`) |
| `--text-4xl` | `36px` | `800` | Hero banners and landing titles |

### Line Heights & Weights

- **Line Heights**: `--leading-tight` (`1.2`), `--leading-normal` (`1.5`), `--leading-relaxed` (`1.6`).
- **Font Weights**: `--font-light` (`300`), `--font-normal` (`400`), `--font-medium` (`500`), `--font-semibold` (`600`), `--font-bold` (`700`).

---

## 📐 Spacing, Elevation & Radii

MicroMatch implements an 8px spatial grid for layout consistency.

### Spatial Scale

| Token | Size | Typical Use |
| --- | --- | --- |
| `--space-1` | `4px` | Micro gaps between icons and labels |
| `--space-2` | `8px` | Small element padding, chip gap |
| `--space-3` | `12px` | Input internal padding, card gaps |
| `--space-4` | `16px` | Standard container margin / padding |
| `--space-5` | `20px` | Section margins, dashboard card padding |
| `--space-6` | `24px` | Large container padding |
| `--space-8` | `32px` | Grid column spacing |
| `--space-10` | `40px` | Hero section gaps |
| `--space-12` | `48px` | Major section vertical padding |
| `--space-16` | `64px` | Page section separation |

### Border Radii

- `--radius-xs`: `4px` (Focus rings, micro-badges)
- `--radius-sm`: `8px` (Inputs, skeletons)
- `--radius-md`: `12px` (Buttons, small cards)
- `--radius-lg`: `16px` (Standard task cards)
- `--radius-xl`: `24px` (Modals, hero cards)
- `--radius-2xl`: `32px` (Brand feature cards)
- `--radius-full`: `9999px` (Pill buttons, chips, avatars)

### Elevation & Shadows

We use neutral slate alpha shadows to prevent dark color pollution on warm surfaces:

- `--elev-0`: `none`
- `--elev-1`: `0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)`
- `--elev-2`: `0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.05)`
- `--elev-3`: `0 12px 24px rgba(15, 23, 42, 0.10), 0 6px 8px rgba(15, 23, 42, 0.06)`
- `--elev-4`: `0 20px 40px rgba(15, 23, 42, 0.14), 0 10px 12px rgba(15, 23, 42, 0.08)`
- `--elev-5`: `0 32px 64px rgba(15, 23, 42, 0.18), 0 16px 20px rgba(15, 23, 42, 0.10)`

---

## 🧩 Component Library & Patterns

### 1. Buttons

```html
<!-- Primary Gradient Button -->
<button class="btn-primary">Claim Task</button>

<!-- Secondary Outlined Button -->
<button class="btn-secondary">View Details</button>

<!-- Coral Pill Button (Landing/Marketing) -->
<button class="btn-coral">Get Started</button>

<!-- Dark Pill Button -->
<button class="btn-dark-pill">Sign In</button>
```

- **Primary**: Coral gradient (`linear-gradient(135deg, #FF6B6B, #E85555)`), white bold text, elevates on hover.
- **Secondary**: Outlined border in primary coral with clean surface fill, fills coral on hover.
- **Coral Pill**: Full rounded (`9999px`), glow shadow on hover (`0 16px 40px rgba(255, 107, 107, 0.35)`).

### 2. Cards & Containers

```html
<!-- Interactive Task Card -->
<div class="card hover-lift">
  <!-- Content -->
</div>

<!-- Brand Card -->
<div class="brand-card">
  <!-- Content -->
</div>

<!-- Glass Container -->
<div class="glass">
  <!-- Content -->
</div>
```

- `.card`: Surface background, `--radius-lg`, subtle 1px border, backdrop blur (`8px`), elevates `-2px` on hover.
- `.brand-card`: Surface background with `--radius-2xl` (`28px`), soft ambient drop shadow.
- `.glass`: Translucent surface (`rgba(255, 255, 255, 0.25)`), `backdrop-filter: blur(16px)`.

### 3. Chips & Tags

```html
<!-- Interactive Filter Chip -->
<button class="chip chip-primary" aria-pressed="true">≤15 min</button>

<!-- Dynamic Tag Pill -->
<span class="tag" style="background: {bg}; color: {color}">#spanish</span>
```

- `.chip`: Inline-flex pill, supports `aria-pressed="true"` active state with coral gradient.
- `.tag`: Category hashtag pill formatted dynamically via `getTagStyle`.

### 4. Forms & Inputs

- Rounded inputs with `--radius-sm` or `--radius-md`.
- Focus state: `border-color: var(--color-primary)` with subtle ring shadow (`3px color-mix(in srgb, var(--color-primary) 12%, transparent)`).

### 5. Navigation & Layout

- **Header (`.site-header`)**: Sticky top bar with logo mark, navigation links, and mobile hamburger drawer.
- **Desktop Sidebar (`.sidebar`)**: Sticky `256px` navigation panel visible on screens `≥1024px`.
- **Bottom Navigation (`.bottom-nav`)**: Touch-friendly bottom bar visible on screens `<1024px`.
- **Floating Action Button (`.fab`)**: Fixed compose action button offset by mobile safe area insets.

---

## ⚡ Motion & Transitions

Animations maintain a responsive feel using cubic-bezier easing `cubic-bezier(0.4, 0, 0.2, 1)`.

- `.animate-slide-up`: 400ms translate from `+20px` to `0px` with fade-in.
- `.animate-fade-in`: 300ms opacity transition (`0` to `1`).
- `.animate-scale-in`: 300ms scale transition (`0.9` to `1.0`).
- `.skeleton`: 1.5s infinite shimmer sweep over surface variant background.
- `.spin`: 1s linear infinite rotation for loading spinners.

---

## ♿ Accessibility & Theme Adaptivity

1. **Touch Targets**: Minimum `44px x 44px` interactive area on touch targets.
2. **Focus Visibility**: Custom focus ring `outline: 2px solid var(--color-primary); outline-offset: 2px;`.
3. **Safe Areas**: Top and bottom padding respond to mobile environment insets (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`).
4. **Color Contrast**: All text tokens exceed WCAG AA 4.5:1 contrast requirements against their respective surface tokens.

---

## ⚙️ Design Tokens JSON Reference

The design system is programmatically exported to [`design-tokens.json`](file:///Users/yinkavaughan/My%20Drive%20%28yvaughan@wesleyan.edu%29/CS/projects/swe/micro-match/design-tokens.json), formatted according to W3C Design Tokens Community Group specifications.
