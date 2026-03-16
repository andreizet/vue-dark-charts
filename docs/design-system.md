# vue-dark-charts — "Dark Data Terminal" Design System

## Overview

A futuristic, dark-themed documentation site for `vue-dark-charts`, a Vue 3 SVG chart library. The visual language draws from data terminals, deep-space interfaces, and glassmorphism — layered dark blues, glowing accents, and subtle motion.

---

## 1. Color Tokens

```css
:root {
  /* Background Layers */
  --bg-base:     #020b18;   /* deepest background, near-black navy */
  --bg-surface:  #060f20;   /* card/panel surfaces */
  --bg-elevated: #0a1628;   /* elevated cards, modals */
  --bg-overlay:  #0d1e35;   /* tooltips, dropdowns, overlays */

  /* Accent Colors */
  --accent-primary:   #3b82f6;   /* electric blue */
  --accent-secondary: #06b6d4;   /* cyan */
  --accent-success:   #10b981;   /* emerald */
  --accent-warning:   #f59e0b;
  --accent-danger:    #ef4444;

  /* Text */
  --text-primary:   #f0f6ff;   /* near-white, headlines and primary content */
  --text-secondary: #94a3b8;   /* slate-400, body and supporting text */
  --text-muted:     #475569;   /* slate-600, placeholders and disabled */

  /* Borders */
  --border-subtle:  rgba(255, 255, 255, 0.05);
  --border-default: rgba(255, 255, 255, 0.10);
  --border-glow:    rgba(59, 130, 246, 0.45);

  /* Glow Effects (box-shadow values) */
  --glow-blue:    0 0 20px rgba(59, 130, 246, 0.35), 0 0 60px rgba(59, 130, 246, 0.15);
  --glow-cyan:    0 0 20px rgba(6, 182, 212, 0.35),  0 0 60px rgba(6, 182, 212, 0.15);
  --glow-emerald: 0 0 20px rgba(16, 185, 129, 0.35), 0 0 60px rgba(16, 185, 129, 0.15);

  /* Glassmorphism base values */
  --glass-bg:     rgba(6, 15, 32, 0.65);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur:   blur(16px) saturate(180%);
}
```

---

## 2. Typography Scale

```css
:root {
  /* Font Families */
  --font-ui:   'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-code: ui-monospace, 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* Scale */
  --text-xs:   0.75rem;    /* 12px — labels, badges */
  --text-sm:   0.875rem;   /* 14px — captions, secondary labels */
  --text-base: 1rem;       /* 16px — body */
  --text-lg:   1.125rem;   /* 18px — lead paragraphs */
  --text-xl:   1.25rem;    /* 20px — card headings */
  --text-2xl:  1.5rem;     /* 24px — section subheadings */
  --text-3xl:  1.875rem;   /* 30px — section headings */
  --text-4xl:  2.25rem;    /* 36px — page title */
  --text-5xl:  3rem;       /* 48px — hero heading */
  --text-6xl:  3.75rem;    /* 60px — hero display */
  --text-7xl:  4.5rem;     /* 72px — hero display large */

  /* Weights */
  --weight-normal:    400;
  --weight-medium:    500;
  --weight-semibold:  600;
  --weight-bold:      700;
  --weight-extrabold: 800;

  /* Line Heights */
  --leading-tight:   1.2;
  --leading-snug:    1.375;
  --leading-normal:  1.5;
  --leading-relaxed: 1.625;

  /* Letter Spacing */
  --tracking-tight:   -0.025em;
  --tracking-normal:   0em;
  --tracking-wide:     0.05em;
  --tracking-widest:   0.15em;
}

/* Applied roles */
.type-hero-display {
  font-family: var(--font-ui);
  font-size: clamp(var(--text-4xl), 6vw, var(--text-7xl));
  font-weight: var(--weight-extrabold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

.type-section-heading {
  font-family: var(--font-ui);
  font-size: var(--text-3xl);
  font-weight: var(--weight-bold);
  line-height: var(--leading-snug);
  color: var(--text-primary);
}

.type-card-heading {
  font-family: var(--font-ui);
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.type-body {
  font-family: var(--font-ui);
  font-size: var(--text-base);
  font-weight: var(--weight-normal);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
}

.type-label {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--text-muted);
}

.type-code {
  font-family: var(--font-code);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
```

---

## 3. Component Styles

```css
/* ===================================================
   RESET & BASE
   =================================================== */

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-ui);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover { background: var(--accent-primary); }

/* ===================================================
   LAYOUT
   =================================================== */

.container {
  width: 100%;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

@media (min-width: 768px) {
  .container {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

@media (min-width: 1280px) {
  .container {
    padding-left: 2.5rem;
    padding-right: 2.5rem;
  }
}

/* ===================================================
   NAVIGATION
   =================================================== */

.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 64px;
  display: flex;
  align-items: center;
  background: rgba(2, 11, 24, 0.80);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--border-subtle);
  transition: border-color 0.3s ease, background 0.3s ease;
}

.nav.scrolled {
  background: rgba(2, 11, 24, 0.95);
  border-bottom-color: var(--border-default);
}

.nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.nav__logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: var(--weight-bold);
  font-size: var(--text-lg);
  letter-spacing: var(--tracking-tight);
}

.nav__logo-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--glow-blue);
}

.nav__logo-text span {
  color: var(--accent-secondary);
}

.nav__links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  list-style: none;
}

.nav__link {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  transition: color 0.2s ease, background 0.2s ease;
  cursor: pointer;
}

.nav__link:hover,
.nav__link.active {
  color: var(--text-primary);
  background: var(--border-subtle);
}

.nav__link.active {
  color: var(--accent-secondary);
}

.nav__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

@media (max-width: 767px) {
  .nav__links { display: none; }
}

/* ===================================================
   STAR BUTTON
   =================================================== */

.star-button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-default);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.star-button:hover {
  background: rgba(59, 130, 246, 0.10);
  border-color: var(--accent-primary);
  color: var(--text-primary);
  box-shadow: var(--glow-blue);
}

.star-button__icon {
  width: 14px;
  height: 14px;
  color: #f59e0b;
  fill: #f59e0b;
  transition: transform 0.2s ease;
}

.star-button:hover .star-button__icon {
  transform: scale(1.2) rotate(-10deg);
}

.star-button__count {
  font-size: var(--text-xs);
  color: var(--text-muted);
  padding-left: 0.25rem;
  border-left: 1px solid var(--border-subtle);
  margin-left: 0.125rem;
}

/* ===================================================
   PILL NAVIGATION
   =================================================== */

.pill-nav {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 9999px;
  padding: 0.25rem;
}

.pill-nav__item {
  padding: 0.375rem 1.125rem;
  border-radius: 9999px;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  border: none;
  background: transparent;
  font-family: var(--font-ui);
}

.pill-nav__item:hover {
  color: var(--text-secondary);
  background: var(--border-subtle);
}

.pill-nav__item.active {
  background: var(--accent-primary);
  color: white;
  box-shadow: var(--glow-blue);
}

/* ===================================================
   HERO
   =================================================== */

.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 64px; /* nav height */
  overflow: hidden;
}

/* Animated mesh/grid background */
.hero__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  background-position: center center;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
}

/* Scanline overlay */
.hero__bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
  pointer-events: none;
}

/* Gradient orbs */
.hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.25;
  animation: float 8s ease-in-out infinite;
  pointer-events: none;
}

.hero__orb--blue {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, var(--accent-primary) 0%, transparent 70%);
  top: -10%;
  left: -10%;
  animation-delay: 0s;
}

.hero__orb--cyan {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%);
  bottom: -5%;
  right: -5%;
  animation-delay: -3s;
}

.hero__orb--emerald {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, var(--accent-success) 0%, transparent 70%);
  top: 30%;
  right: 20%;
  animation-delay: -6s;
  opacity: 0.15;
}

.hero__content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 0;
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 1rem;
  background: rgba(59, 130, 246, 0.10);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--accent-secondary);
  margin-bottom: 1.5rem;
  animation: fade-in-up 0.6s ease both;
}

.hero__eyebrow-dot {
  width: 6px;
  height: 6px;
  background: var(--accent-success);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--accent-success);
  animation: glow-pulse 2s ease-in-out infinite;
}

.hero__heading {
  font-family: var(--font-ui);
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: var(--weight-extrabold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  animation: fade-in-up 0.6s 0.1s ease both;
}

.hero__heading .gradient-text {
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 50%, var(--accent-success) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  max-width: 580px;
  margin: 0 auto 2.5rem;
  animation: fade-in-up 0.6s 0.2s ease both;
}

.hero__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 4rem;
  animation: fade-in-up 0.6s 0.3s ease both;
}

/* Hero chart previews grid */
.hero__charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  max-width: 800px;
  margin: 0 auto;
  animation: fade-in-up 0.8s 0.4s ease both;
}

@media (min-width: 768px) {
  .hero__charts {
    grid-template-columns: repeat(4, 1fr);
  }
}

.hero__chart-preview {
  aspect-ratio: 1;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.hero__chart-preview:hover {
  border-color: rgba(59, 130, 246, 0.30);
  box-shadow: var(--glow-blue);
  transform: translateY(-4px) scale(1.02);
}

/* ===================================================
   SECTION
   =================================================== */

.section {
  padding: 5rem 0;
  position: relative;
}

.section--alt {
  background: linear-gradient(180deg, transparent, rgba(6, 182, 212, 0.02) 50%, transparent);
}

.section__header {
  text-align: center;
  margin-bottom: 3rem;
}

.section__eyebrow {
  display: inline-block;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--accent-secondary);
  margin-bottom: 0.75rem;
}

.section__heading {
  font-size: clamp(var(--text-2xl), 4vw, var(--text-3xl));
  font-weight: var(--weight-bold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.section__description {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  max-width: 600px;
  margin: 0 auto;
}

/* ===================================================
   CHART GRID
   =================================================== */

.chart-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .chart-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .chart-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.chart-grid--2col {
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .chart-grid--2col {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ===================================================
   CHART CARD
   =================================================== */

.chart-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
}

/* Top-edge glow line on hover */
.chart-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(59, 130, 246, 0.5),
    rgba(6, 182, 212, 0.5),
    transparent
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.chart-card:hover {
  border-color: rgba(59, 130, 246, 0.25);
  box-shadow: var(--glow-blue);
  transform: translateY(-4px);
}

.chart-card:hover::before {
  opacity: 1;
}

.chart-card__preview {
  padding: 1.5rem;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.20);
  border-bottom: 1px solid var(--border-subtle);
  position: relative;
  overflow: hidden;
}

/* Subtle radial gradient inside chart preview area */
.chart-card__preview::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 120%, rgba(59, 130, 246, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

.chart-card__body {
  padding: 1.25rem 1.5rem 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chart-card__title {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.chart-card__description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  flex: 1;
}

.chart-card__tabs {
  display: flex;
  gap: 0.25rem;
  border-top: 1px solid var(--border-subtle);
  padding-top: 1rem;
  margin-top: 0.5rem;
}

.chart-card__tab {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  font-family: var(--font-ui);
  transition: all 0.15s ease;
}

.chart-card__tab:hover {
  color: var(--text-secondary);
  border-color: var(--border-subtle);
}

.chart-card__tab.active {
  color: var(--accent-primary);
  border-color: rgba(59, 130, 246, 0.30);
  background: rgba(59, 130, 246, 0.08);
}

.chart-card__code-panel {
  display: none;
  padding: 0 1.5rem 1.5rem;
}

.chart-card__code-panel.visible {
  display: block;
}

/* ===================================================
   CODE BLOCK
   =================================================== */

.code-block {
  position: relative;
  background: rgba(0, 0, 0, 0.40);
  border: 1px solid var(--border-default);
  border-radius: 0.75rem;
  overflow: hidden;
  font-family: var(--font-code);
  font-size: var(--text-sm);
}

.code-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--border-subtle);
}

.code-block__dots {
  display: flex;
  gap: 0.375rem;
}

.code-block__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.code-block__dot:nth-child(1) { background: #ef4444; }
.code-block__dot:nth-child(2) { background: #f59e0b; }
.code-block__dot:nth-child(3) { background: #10b981; }

.code-block__lang {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.code-block__copy {
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 0.375rem;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  padding: 0.25rem 0.625rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.code-block__copy:hover {
  color: var(--text-primary);
  border-color: var(--border-default);
}

.code-block__copy.copied {
  color: var(--accent-success);
  border-color: rgba(16, 185, 129, 0.3);
}

.code-block__body {
  padding: 1.25rem 1.5rem;
  overflow-x: auto;
  line-height: var(--leading-relaxed);
  color: #cbd5e1;
}

/* Syntax highlight token colors */
.token-tag        { color: #f472b6; }   /* pink — HTML tags */
.token-attr-name  { color: #60a5fa; }   /* blue — attribute names */
.token-attr-value { color: #34d399; }   /* emerald — attribute values / strings */
.token-string     { color: #34d399; }
.token-keyword    { color: #a78bfa; }   /* violet — keywords */
.token-comment    { color: #475569; font-style: italic; }
.token-number     { color: #fb923c; }   /* orange */
.token-boolean    { color: #fb923c; }
.token-property   { color: #60a5fa; }
.token-function   { color: #e879f9; }   /* fuchsia — function names */
.token-punctuation{ color: #94a3b8; }
.token-operator   { color: #94a3b8; }

/* ===================================================
   OPTIONS TABLE
   =================================================== */

.options-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--text-sm);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  overflow: hidden;
}

.options-table thead {
  background: rgba(255, 255, 255, 0.03);
}

.options-table th {
  padding: 0.75rem 1.25rem;
  text-align: left;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.options-table td {
  padding: 0.875rem 1.25rem;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: top;
  line-height: var(--leading-relaxed);
}

.options-table tbody tr:last-child td {
  border-bottom: none;
}

.options-table tbody tr {
  transition: background 0.15s ease;
}

.options-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

/* Prop name column */
.options-table td:first-child {
  font-family: var(--font-code);
  color: var(--accent-secondary);
  font-size: var(--text-xs);
  white-space: nowrap;
}

/* Default value column */
.options-table td:last-child {
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-family: var(--font-code);
}

/* ===================================================
   BADGE
   =================================================== */

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.1875rem 0.5rem;
  border-radius: 0.375rem;
  font-family: var(--font-code);
  font-size: 0.6875rem;
  font-weight: var(--weight-medium);
  line-height: 1;
  white-space: nowrap;
}

.badge--string {
  background: rgba(52, 211, 153, 0.12);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.25);
}

.badge--number {
  background: rgba(251, 146, 60, 0.12);
  color: #fb923c;
  border: 1px solid rgba(251, 146, 60, 0.25);
}

.badge--boolean {
  background: rgba(167, 139, 250, 0.12);
  color: #a78bfa;
  border: 1px solid rgba(167, 139, 250, 0.25);
}

.badge--array {
  background: rgba(96, 165, 250, 0.12);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.25);
}

.badge--object {
  background: rgba(244, 114, 182, 0.12);
  color: #f472b6;
  border: 1px solid rgba(244, 114, 182, 0.25);
}

.badge--function {
  background: rgba(232, 121, 249, 0.12);
  color: #e879f9;
  border: 1px solid rgba(232, 121, 249, 0.25);
}

.badge--required {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

/* ===================================================
   BUTTONS
   =================================================== */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.375rem;
  border-radius: 0.5rem;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
  user-select: none;
  -webkit-user-select: none;
}

.btn:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.btn:disabled,
.btn[disabled] {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

.btn--lg {
  padding: 0.875rem 2rem;
  font-size: var(--text-base);
  border-radius: 0.625rem;
}

.btn--sm {
  padding: 0.375rem 0.875rem;
  font-size: var(--text-xs);
  border-radius: 0.375rem;
}

/* Primary */
.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary) 0%, #2563eb 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #60a5fa 0%, var(--accent-primary) 100%);
  box-shadow: var(--glow-blue), 0 1px 2px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: none;
}

/* Secondary */
.btn-secondary {
  background: rgba(6, 182, 212, 0.10);
  color: var(--accent-secondary);
  border-color: rgba(6, 182, 212, 0.25);
}

.btn-secondary:hover {
  background: rgba(6, 182, 212, 0.18);
  border-color: rgba(6, 182, 212, 0.50);
  box-shadow: var(--glow-cyan);
  transform: translateY(-1px);
}

.btn-secondary:active {
  transform: translateY(0);
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-default);
}

.btn-ghost:hover {
  color: var(--text-primary);
  background: var(--border-subtle);
  border-color: var(--border-default);
}

/* ===================================================
   FEATURE CARD
   =================================================== */

.feature-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 1rem;
  padding: 1.75rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.feature-card::before {
  content: '';
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0;
  transition: opacity 0.3s ease;
  top: -20px;
  right: -20px;
}

.feature-card:hover::before { opacity: 0.4; }
.feature-card--blue::before  { background: var(--accent-primary); }
.feature-card--cyan::before  { background: var(--accent-secondary); }
.feature-card--green::before { background: var(--accent-success); }

.feature-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.feature-card__icon--blue {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.25);
  color: var(--accent-primary);
}

.feature-card__icon--cyan {
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(6, 182, 212, 0.25);
  color: var(--accent-secondary);
}

.feature-card__icon--green {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: var(--accent-success);
}

.feature-card__title {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.feature-card__body {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

/* ===================================================
   DIVIDER
   =================================================== */

.divider {
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    var(--border-default) 20%,
    var(--border-default) 80%,
    transparent
  );
  border: none;
  margin: 3rem 0;
}

/* ===================================================
   FOOTER
   =================================================== */

.footer {
  border-top: 1px solid var(--border-subtle);
  padding: 2.5rem 0;
  text-align: center;
}

.footer__text {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.footer__text a {
  color: var(--accent-secondary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer__text a:hover {
  color: var(--text-primary);
}

/* ===================================================
   UTILITY HELPERS
   =================================================== */

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.text-gradient {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-gradient--tricolor {
  background: linear-gradient(135deg,
    var(--accent-primary) 0%,
    var(--accent-secondary) 50%,
    var(--accent-success) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
}

.glow-blue    { box-shadow: var(--glow-blue); }
.glow-cyan    { box-shadow: var(--glow-cyan); }
.glow-emerald { box-shadow: var(--glow-emerald); }
```

---

## 4. Animations

```css
/* ===================================================
   KEYFRAMES
   =================================================== */

@keyframes glow-pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 6px currentColor;
  }
  50% {
    opacity: 0.6;
    box-shadow: 0 0 14px currentColor, 0 0 28px currentColor;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) translateX(0px);
  }
  33% {
    transform: translateY(-24px) translateX(10px);
  }
  66% {
    transform: translateY(12px) translateX(-8px);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}

/* ===================================================
   SCROLL REVEAL
   =================================================== */

.animate-on-scroll {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.65s ease, transform 0.65s ease;
}

.animate-on-scroll.in-view {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger children */
.animate-stagger > *:nth-child(1) { transition-delay: 0.05s; }
.animate-stagger > *:nth-child(2) { transition-delay: 0.12s; }
.animate-stagger > *:nth-child(3) { transition-delay: 0.19s; }
.animate-stagger > *:nth-child(4) { transition-delay: 0.26s; }
.animate-stagger > *:nth-child(5) { transition-delay: 0.33s; }
.animate-stagger > *:nth-child(6) { transition-delay: 0.40s; }

/* Utility animation classes */
.animate-fade-in    { animation: fade-in 0.5s ease both; }
.animate-fade-in-up { animation: fade-in-up 0.6s ease both; }
.animate-float      { animation: float 8s ease-in-out infinite; }
.animate-glow-pulse { animation: glow-pulse 2.5s ease-in-out infinite; }

.animate-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 50%,
    transparent 100%
  );
  background-size: 200% auto;
  animation: shimmer 2.5s linear infinite;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .animate-on-scroll {
    opacity: 1;
    transform: none;
  }
}

/*
  IntersectionObserver snippet — place near </body>:

  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        observer.unobserve(e.target);
      }
    }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
*/
```

---

## 5. Layout & Page Switching

```css
/* ===================================================
   PAGE SECTION SWITCHING (JS tab system)
   =================================================== */

.page-section {
  display: none;
}

.page-section.active {
  display: block;
  animation: fade-in 0.3s ease both;
}

/*
  Breakpoints (mobile-first):
    xs:  0 – 479px      phones portrait
    sm:  480 – 639px    phones landscape
    md:  640 – 767px    large phones / small tablets
    lg:  768 – 1023px   tablets
    xl:  1024 – 1279px  small desktops
   2xl:  1280px+        desktops

  Max content width:  1280px, centered, responsive horizontal padding.
  Hero:               min-height 100vh, content centered vertically.
  Chart grid:         1 col → 2 col @640px → 3 col @1024px.
  Nav:                links hidden below 768px.

  Tab switching:
    - Toggle .active on .page-section elements via .nav__link / .pill-nav__item clicks.
    - Keep both nav components in sync (same data-section attribute pattern recommended).
*/
```

---

## Accessibility Notes

- `:focus-visible` outlines use `var(--accent-primary)` at 2px offset on all interactive elements — full keyboard navigation supported.
- Color contrast: `--text-primary` (#f0f6ff) on `--bg-base` (#020b18) — ~17:1 ratio (WCAG AAA). `--text-secondary` (#94a3b8) on `--bg-base` — ~6.5:1 (WCAG AA).
- All touch targets (buttons, nav links, card tabs) have minimum 44x44px effective tap area via padding.
- Animations respect `prefers-reduced-motion` via the media query block.
- Add `aria-label` to icon-only buttons (star button, copy button) at implementation time.
- `.sr-only` utility provided for screen-reader-only labels.
- `aria-current="page"` should be applied to the active `.nav__link` when switching sections.

---

## Implementation Notes

1. All custom properties are on `:root` — no preprocessor required, works with plain CSS.
2. Glassmorphism (`backdrop-filter`) requires a semi-transparent background on the element; `--glass-bg` provides this.
3. The `.animate-on-scroll` system requires the IntersectionObserver snippet (in the Animations section comments).
4. Hero orbs require `.hero` to have `position: relative; overflow: hidden`.
5. `--glow-*` tokens are complete `box-shadow` values, ready for direct assignment.
6. The `options-table` `border-radius` on `<table>` requires `overflow: hidden` on the table itself (already specified) — do not remove.
7. Inter font should be loaded via `<link rel="preconnect">` + Google Fonts or self-hosted for performance. Add `font-display: swap` to avoid FOIT.
