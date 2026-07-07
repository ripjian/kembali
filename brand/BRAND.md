# Kembali — Brand Guide (v1.0)

> Kembali (Malay: "return / come back") — the product's promise in one word.
> Companion to `ROADMAP.md` and `CLAUDE.md`. Tokens here feed `packages/ui` theming.

**Decisions (2026-07-07):** primary mark = **A (return loop)**, wordmark = **D**, palette = **Pandan**. Concepts B and C are archived (C may be reused as marketing illustration).

## 1. Logo

| File | Status | Use |
|---|---|---|
| `logo-a-return-loop.svg` | ✅ Primary mark | App icon, favicon, wallet pass icon (29/58/87px), avatar |
| `logo-d-wordmark.svg` | ✅ Wordmark | Headers, marketing; final **i** in coral = the last stamp |
| `logo-b-k-loop.svg` | Archived | — |
| `logo-c-last-stamp.svg` | Archived | Reuse as illustration (empty states, marketing hero) |

Lockup: mark A left of sans wordmark, gap = stamp-dot diameter. Clear space = stamp-dot height on all sides. Monochrome fallback: all deep-pandan `#0F3D32`, or all-sand `#F6F1E3` on dark. Never stretch; no gradients/shadows.

Logo colors: ink `#0F3D32` (deep pandan), stamp dot / final i `#E0684B` (coral).

## 2. Palette — Pandan (chosen)

Fresh, green, unmistakably SEA. Deep pandan ink + coral rewards + leaf progress on warm sand.

### Brand core
```css
--kembali-pandan: #0F3D32;  /* ink, headlines, logo, primary actions — the "act" color */
--kembali-coral:  #E0684B;  /* stamps, rewards, coupons — the "earn" color */
--kembali-leaf:   #7FB069;  /* progress fills, positive states, garnish */
--kembali-sand:   #F6F1E3;  /* page canvas */
```

### System / UI tokens (light)
```css
--color-bg:             #F6F1E3;
--color-surface:        #FFFFFF;   /* cards */
--color-surface-alt:    #EDE6D2;   /* subtle sections */
--color-text:           #16261E;
--color-text-secondary: #5C6B60;
--color-text-muted:     #8B9689;
--color-border:         #DCD5BF;
--color-primary:        #0F3D32;   /* buttons, links, scan CTA */
--color-primary-hover:  #0A2C24;
--color-on-primary:     #FFFFFF;
--color-accent:         #E0684B;   /* stamp fills, reward badges, progress dots */
--color-accent-deep:    #A93E24;   /* text on coral tints */
--color-leaf:           #7FB069;   /* progress bars, success tints */
--color-success:        #3B7D46;
--color-warning:        #B45309;
--color-error:          #C0392B;
--color-info:           #2D6CB5;
```

### Dark mode
```css
--color-bg:             #10201A;
--color-surface:        #182B23;
--color-surface-alt:    #20362C;
--color-text:           #EDEEE2;
--color-text-secondary: #AFBCA9;
--color-text-muted:     #7E8C80;
--color-border:         #2F443A;
--color-primary:        #3E8A72;   /* pandan lifted for contrast */
--color-on-primary:     #0B1712;
--color-accent:         #EC7F63;   /* coral lifted */
--color-accent-deep:    #F4A98F;
```
Coral stamps stay coral in both modes — the reward color is the brand constant.

### Usage rules
- **Pandan = things you *do*** (buttons, links, scan CTA). **Coral = things you *earn*** (stamps, coupons, progress). Never swap.
- Coral is decorative/status only — it fails contrast as body text on sand; use `--color-accent-deep` for coral-tinted text.
- Leaf is garnish: progress fills and success tints, never primary actions.
- Contrast (light): pandan on sand ≈ 10.9:1, white on pandan ≈ 12:1, text #16261E on sand ≈ 13:1 — AA/AAA pass. Coral on sand ≈ 3.2:1 → decorative only (per rule above).
- Merchant white-label: tenant brand colors override `--color-primary` / `--color-accent`; Pandan is the default theme and Kembali's own marketing/admin identity.

## 3. Alternates (reference only)

- **Kopi & kunyit:** #3A2A21 / #E8A33D / #14594A / #FAF4E8 — warmer, kopitiam feel.
- **Senja:** #2B2E5A / #E4645A / #D9A441 / #FAF6F0 — techier, premium SaaS tone.

## 4. Typography

- UI/system: **Plus Jakarta Sans** (warm, SEA-popular) or Inter — weights 400/500/600; tabular-nums for stamp counts and dashboards.
- Marketing display + serif wordmark cut: **Fraunces** or **Lora**.

## 5. Voice & language (added 2026-07-07, hard rules)

- **English only** in all UI and marketing copy. **"Kembali" is a name, not a word**: it appears only as the brand/product name (logo, wordmark, "Kembali API"), never as a verb or pun ("make them kembali" ❌ → "make them come back" ✅). No other Malay words in copy ("kopi" ❌ → "coffee" ✅). This is about brand voice — product *localization* (BM/CN message templates, Phase 2) is separate and unaffected.
- Style follows the `ux-writing` skill (`.claude/skills/ux-writing/SKILL.md`): purposeful, concise, conversational, clear. Sentence case everywhere (uppercase is a CSS treatment, not a writing style). Buttons are verb-first, 2–4 words. Front-load the benefit. 8–14 words per sentence where possible.
- No idioms, no cultural references, no internal jargon in public copy: "MVP" → "At launch", "backlog" → "Planned", "Phase 0" → "Preview". Merchants are not startup people.
- Demo/sample data uses English business names ("Corner Coffee", "Coffee Card"). Customer names in seed data reflect the real market (Aisyah, Ming Wei, Priya) — people's names are not copy.

## 6. Next steps

- [x] Pick logo direction (A + wordmark) and palette (Pandan)
- [ ] Refine mark geometry; export set: SVG, PNG @1x/2x/3x, ICO, wallet-pass logo 160×50 + icon 29/58/87px
- [ ] MyIPO/IPOS trademark search for "Kembali" (classes 9/35/42); register kembali .app/.my/.com + socials
- [ ] Apply tokens in `packages/ui` (Tailwind theme) during Phase 0
