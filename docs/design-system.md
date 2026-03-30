# Design System

**Style**: Botanical / Organic Serif
**Feel**: Peaceful, curated, artisanal, high-end wellness, botanical elegance

---

## Color Tokens

```css
/* globals.css or tailwind.config.ts */
--color-background:  #F9F8F4;  /* Warm Alabaster — never pure white */
--color-foreground:  #2D3A31;  /* Deep Forest Green — primary text */
--color-primary:     #8C9A84;  /* Sage Green — icons, accents, secondary buttons */
--color-secondary:   #DCCFC2;  /* Soft Clay / Mushroom — card backgrounds */
--color-border:      #E6E2DA;  /* Stone — subtle borders */
--color-interactive: #C27B66;  /* Terracotta — marketing hover states, alerts */
--color-surface:     #FFFFFF;  /* White — card surfaces */
--color-muted:       #F2F0EB;  /* Off-white — input backgrounds */
```

**Accessibility Rules**:
- `#2D3A31` on `#F9F8F4` → contrast ratio ~10:1 ✅ (WCAG AAA)
- `#8C9A84` on `#F9F8F4` → contrast ratio ~2.8:1 ❌ — **never use sage for body text**
- Sage is for icons, decorative lines, and secondary button borders only

---

## Typography

### Fonts
- **Headings**: `Playfair Display` (Google Fonts) — weight 600/700, italic for emphasis words
- **Body / UI**: `Source Sans 3` (Google Fonts) — weight 400/500

### Usage Rules
| Context | Font | Weight |
|---------|------|--------|
| Landing page H1/H2 | Playfair Display | 700, italic emphasis |
| Dashboard page titles (H1) | Playfair Display | 600 |
| Dashboard H2+ subheadings | Source Sans 3 | 600 |
| Body text | Source Sans 3 | 400 |
| Navigation, labels, buttons | Source Sans 3 | 500 |
| Data, tables, form inputs | Source Sans 3 | 400 |

**Rule**: Playfair Display is for page-level headings ONLY. Source Sans 3 for all UI chrome.

### Scale (Tailwind classes)
```
Landing hero:    text-6xl md:text-8xl  (Playfair)
Landing H2:      text-4xl md:text-5xl  (Playfair)
Dashboard H1:    text-3xl              (Playfair)
Section titles:  text-xl md:text-2xl   (Source Sans 3, semibold)
Body:            text-base (16px)      (Source Sans 3)
Small/caption:   text-sm (14px)        (Source Sans 3)
Button label:    text-sm uppercase tracking-widest
```

---

## Radius & Shape

| Component | Class |
|-----------|-------|
| Cards | `rounded-3xl` (24px) |
| Buttons | `rounded-full` (pill) |
| Inputs | `rounded-full` or `rounded-xl` |
| Images (hero) | `rounded-t-full` (arch) or `rounded-[40px]` |
| Badges/tags | `rounded-full` |
| Modals/dialogs | `rounded-3xl` |

---

## Shadows

Very soft and diffused — no harsh drops:

```css
shadow-sm:   0 4px 6px -1px rgba(45, 58, 49, 0.05)
shadow-md:   0 10px 15px -3px rgba(45, 58, 49, 0.05)
shadow-lg:   0 20px 40px -10px rgba(45, 58, 49, 0.05)
shadow-xl:   0 25px 50px -12px rgba(45, 58, 49, 0.15)
```

---

## Paper Grain Texture (CRITICAL)

This SVG noise overlay is **mandatory** on the root layout. It transforms flat digital pixels into warm, tactile paper. Without it, the design loses its defining character.

```tsx
// Place in root layout, above all content, pointer-events-none
<div
  className="pointer-events-none fixed inset-0 z-50 opacity-[0.015]"
  style={{
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'repeat',
  }}
/>
```

---

## Component Patterns

### Buttons

```tsx
// Primary
<button className="rounded-full bg-[#2D3A31] text-white px-8 py-3 text-sm uppercase tracking-widest
                   transition-colors duration-300 hover:bg-[#3d5245]">
  Get Started
</button>

// Secondary (outline)
<button className="rounded-full border border-[#8C9A84] text-[#8C9A84] px-8 py-3 text-sm uppercase tracking-widest
                   transition-colors duration-300 hover:bg-[#8C9A84] hover:text-white">
  Learn More
</button>
```

**Dashboard buttons**: same shape, but hover uses `#3d5245` (darker forest green). **No terracotta hover in dashboard.**

### Cards

```tsx
<div className="rounded-3xl bg-white p-8 shadow-sm
                transition-all duration-500 hover:-translate-y-1 hover:shadow-lg">
  {/* content */}
</div>
```

### Inputs

```tsx
// Pill input (dashboard forms)
<input className="rounded-full bg-[#F2F0EB] border-0 px-6 py-3 text-[#2D3A31]
                  focus:outline-none focus:ring-2 focus:ring-[#8C9A84]
                  placeholder:text-[#8C9A84]/60" />

// Underline input (landing page / minimal)
<input className="border-b border-[#E6E2DA] bg-transparent px-2 py-3 text-[#2D3A31]
                  focus:outline-none focus:border-[#8C9A84] transition-colors duration-300" />
```

---

## Spacing & Layout

- **Container**: `max-w-7xl mx-auto px-4 md:px-8`
- **Section spacing (landing page)**: `py-24 md:py-32`
- **Section spacing (dashboard)**: `py-8 md:py-12`
- **Grid gaps**: `gap-8 md:gap-12` (cards), `gap-4 md:gap-6` (form fields)

### Staggered Cards (LANDING PAGE ONLY)

```tsx
{features.map((feature, i) => (
  <div
    key={feature.id}
    className={`transition-transform ${i % 2 === 1 ? 'md:translate-y-12' : ''}`}
  >
    <Card {...feature} />
  </div>
))}
```

**Never stagger in dashboard grids** — keep dashboard layouts aligned and structured.

---

## Animation Principles

- **Feel**: Slow, graceful, fluid — like leaves swaying, not snapping
- All transitions: `ease-out` curves

| Use case | Duration |
|----------|----------|
| Button hover, link color | `duration-300` |
| Card lift, transform | `duration-500` |
| Image scale, hero effects | `duration-700` |
| Page-level dramatic | `duration-1000` |

### Hover Behaviors
- Cards: `hover:-translate-y-1` + `hover:shadow-lg` (`duration-500`)
- Images: `hover:scale-105` (`duration-700`)
- Buttons: `hover:bg-[#3d5245]` (`duration-300`)

### Scroll Animations
Elements fade up into place:
```tsx
// Use with Intersection Observer or framer-motion
className="opacity-0 translate-y-4 → opacity-100 translate-y-0 transition-all duration-700"
```

---

## Icons

- Library: **Lucide React**
- Stroke width: `strokeWidth={1.5}` (always)
- Color: `#2D3A31` (forest green) or `#8C9A84` (sage)
- Don't box icons in heavy containers — let them float or use soft pale circles (`bg-[#F2F0EB] rounded-full p-3`)

---

## Responsive Strategy

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Single column, `py-16`, no stagger, hamburger menu |
| md (768px+) | 2–3 column grids, stagger activates, sidebar visible |
| lg (1024px+) | Full layout, `py-32` on landing sections |

### Dashboard Layout
- **Desktop**: Left sidebar (250px) + main content area
- **Mobile**: Bottom tab bar (4 main nav items) + full-screen content

### Typography Scaling
```
Landing H1:  text-5xl → md:text-8xl
Landing H2:  text-3xl → md:text-5xl
Dashboard H1: text-2xl → md:text-3xl (no giant headings in app)
```

---

## Context: Where Each Style Applies

| Area | Botanical Style Intensity |
|------|--------------------------|
| Marketing / Landing page | **Full** — all features, stagger, large type, arch images |
| Auth pages (login/signup) | **Moderate** — centered card, paper texture, botanical fonts |
| Dashboard | **Subtle** — tokens only (colors, fonts, radius), no stagger, no arch images |
| Chat widget (embedded) | **Minimal** — brand color bubble, clean white window, neutral design |
