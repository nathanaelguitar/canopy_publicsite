---
name: CanopyChat Public Site
description: Private, on-device intelligence with a lighter infrastructure footprint.
colors:
  forest: "#0c2b1d"
  forest-soft: "#17452d"
  signal-lime: "#c4ee77"
  warm-cream: "#f4f0e4"
  ink: "#15251b"
  muted: "#59665b"
  legacy-oak: "#7a4a23"
  legacy-paper: "#f5ead4"
typography:
  display:
    fontFamily: "Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif"
    fontSize: "clamp(48px, 11vw, 112px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.06em"
  body:
    fontFamily: "Avenir Next, Gill Sans, Trebuchet MS, sans-serif"
    fontSize: "17px"
    lineHeight: 1.55
  label:
    fontFamily: "Avenir Next, Gill Sans, Trebuchet MS, sans-serif"
    fontSize: "12px"
    fontWeight: 850
    letterSpacing: "0.16em"
rounded:
  control: "999px"
  field: "14px"
  mark: "12px"
spacing:
  screen-x: "20px"
  screen-y: "clamp(64px, 10vw, 132px)"
components:
  button-primary:
    backgroundColor: "{colors.signal-lime}"
    textColor: "{colors.forest}"
    rounded: "{rounded.control}"
    padding: "0 22px 0 22px"
    height: "58px"
  amount-choice-selected:
    backgroundColor: "{colors.signal-lime}"
    textColor: "{colors.forest}"
    rounded: "{rounded.field}"
    height: "56px"
---

# Design System: CanopyChat Public Site

## Overview

**Creative North Star: "A signal through the canopy."**

CanopyChat's public site uses a grounded green field, warm device-light, and one bright lime signal to make the product's central choice legible: useful intelligence can start closer to the person using it. The founding surface is deliberately more direct than the legacy brochure layout because visitors arrive from short-form video and need the point, proof, and contribution decision in four thumb-sized beats.

The existing public pages retain a warm paper / oak / moss language. The Founding Members route introduces a scoped forest-and-lime campaign language while keeping the tree mark, plainspoken copy, and privacy-first meaning continuous with the rest of the site.

**Key Characteristics:**

- Deep forest surfaces carry the emotional argument and the contribution moment.
- Warm cream surfaces provide a reading pause for proof and terms.
- One signal-lime action per decision moment.
- Large editorial serif headlines with compact sans-serif explanation.
- Four-screen vertical rhythm for mobile traffic from short videos.

## Colors

The founding funnel uses a committed palette: forest does most of the structural work, warm cream creates contrast, and signal lime marks action and choice.

### Primary

- **Canopy Forest** (#0c2b1d): Hero and contribution backgrounds; the main brand field on the founding route.
- **Canopy Forest Soft** (#17452d): The membership / early-community section and secondary structural surface.
- **Signal Lime** (#c4ee77): Primary action, selected contribution, and small status signal.

### Neutral

- **Warm Device-Light** (#f4f0e4): Reading surface and inverse text on the dark route.
- **Canopy Ink** (#15251b): Text on the warm surface.
- **Moss Muted** (#59665b): Secondary copy and explanatory text.
- **Legacy Oak** (#7a4a23) and **Legacy Paper** (#f5ead4): Existing non-founding pages; do not replace casually.

### Named Rules

**The One Signal Rule.** Signal lime marks the action or selected state. It should not become a general decorative wash.

## Typography

**Display Font:** Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif

**Body Font:** Avenir Next, Gill Sans, Trebuchet MS, sans-serif

**Character:** The serif is compact, expressive, and slightly literary; the sans-serif keeps terms and actions familiar on a small phone screen.

### Hierarchy

- **Display** (800, `clamp(48px, 11vw, 112px)`, `.98): First-viewport thesis on the founding route.
- **Headline** (800, `clamp(42px, 12vw, 82px)`, `.98): Section-level decision and proof statements.
- **Body** (400, `17px` base, `1.55`): Explanatory copy and legal / enrollment terms.
- **Lead** (400, `clamp(18px, 2.8vw, 25px)`, `1.4`): The short argument under a headline.
- **Label** (850, `12px`, `.16em`, uppercase): Screen position, beta context, and small navigation cues.

### Named Rules

**The Headline Carries the Hook Rule.** Do not add an eyebrow or kicker above the main headline; the headline should make the claim without a prefatory label.

## Layout

Founding Members is a four-screen vertical funnel with `scroll-snap-type: y proximity` on larger screens and mobile-friendly anchor targets. Each screen is at least one viewport minus the 64–72px sticky top bar, with 20px horizontal padding on small screens and a 680–760px reading column. Proof is expressed as ruled rows rather than repeated cards. The contribution controls use a two-column grid on small screens and four contribution choices across on wider screens, with Custom as a full-width field.

## Elevation & Depth

Depth is primarily tonal: forest, forest-soft, warm cream, and lime create the hierarchy. The tree mark receives one soft ambient shadow, and primary actions receive a restrained lift on hover. No hard-offset shadows or decorative glass panels are used on the founding surface.

### Named Rules

**The Tonal Layer Rule.** Let a change in surface color carry hierarchy before adding a border, shadow, or container.

## Shapes

Primary actions are pill-shaped for thumb recognition. Amount choices and input fields use 14px corners with 1px translucent strokes. The tree mark uses its supplied rounded-square silhouette. Dividers are 1px rules with low-opacity ink or warm-cream color.

## Components

### Buttons

- **Shape:** Full pill for primary actions (`999px`); full-width on the contribution screen.
- **Primary:** Signal lime background, forest text, 58–60px minimum height, generous horizontal padding.
- **Hover / Focus:** Slight upward lift on hover; a visible lime focus ring with offset on keyboard focus; reduced motion removes transitions.
- **Text action:** Underlined forest text with an authored inline SVG arrow for secondary progression.

### Amount Choices

- **Style:** 56px minimum-height dark fields with a 1px translucent stroke and 14px radius.
- **State:** The selected amount uses signal lime and forest text; `aria-pressed` mirrors the visual state.
- **Custom:** Full-width on mobile with a visible dollar prefix and numeric input.

### Navigation

- **Style:** Sticky, translucent forest top bar with the tree mark, CanopyChat name, and a compact iPhone beta label.
- **Mobile treatment:** A bottom contribution bar appears after the hero and disappears while the contribution section is visible.

### Proof Rows

Three ruled rows pair a two-digit index with a short proof statement. They replace a grid of generic benefit cards and keep the reading path linear on a phone.

## Do's and Don'ts

### Do:

- **Do** make the product's on-device mechanism visible within the first viewport.
- **Do** use short, emotionally direct copy for visitors arriving from video.
- **Do** state one-time payment, minimum contribution, beta duration, geography, and no-subscription terms near the decision.
- **Do** keep a $10 option visible beside higher contribution choices.
- **Do** use the provided tree mark as the surface's signature asset.

### Don't:

- **Don't** return the founding route to a long brochure with multiple card grids.
- **Don't** hide the lower contribution option or subscription terms.
- **Don't** use guilt as a substitute for evidence about what the product actually does.
- **Don't** add gradient text, emoji / Unicode icons, hard side-tab borders, or decorative glass to this route.
- **Don't** make environmental claims about a specific dollar amount unless verified evidence is supplied.
