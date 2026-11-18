# Kayal Expenses — Design Direction

## Three stylistic approaches

### Theme Name: Ledger Garden
Very light, editorial finance dashboard with warm paper tones, sage accents, and a calm “money in motion” feeling.
**Probability:** 0.06

### Theme Name: Copper Ledger
A tactile, premium personal-finance workspace inspired by copper accounting books, amber highlights, and quiet charcoal ink.
**Probability:** 0.03

### Theme Name: Sundial Console
A warm, daylight-first dashboard with terracotta status accents, cream surfaces, and a structured observatory-like layout.
**Probability:** 0.08

## Selected approach: Copper Ledger

### Design Movement
Contemporary editorial skeuomorphism: the clarity of a modern operations console expressed through the tactility of a well-kept paper ledger.

### Core Principles
1. **Calm control:** Every total, alert, and action has a clear visual home without turning the interface into a wall of widgets.
2. **Warm precision:** Use cream, espresso, copper, and olive tones to make financial maintenance feel grounded rather than clinical.
3. **Visible continuity:** The active salary cycle and month-to-month history should read like connected pages in one ledger.
4. **Progress over panic:** Alerts are unmistakable, but the overall tone remains constructive and action-oriented.

### Color Philosophy
A warm parchment background reduces visual fatigue and creates a sense of ownership. Espresso ink supplies contrast without using pure black; copper is the signature action color and makes important actions feel tangible; olive signals healthy control; terracotta is reserved for warnings so it carries real meaning.

### Layout Paradigm
Use a persistent left rail for navigation and a broad asymmetric workspace: a strong “current cycle” column on the left, with a more modular right-hand column for alerts and summaries. Tables and history remain full-width beneath the primary dashboard rather than forcing everything into equal cards.

### Signature Elements
- Copper rule lines and small ledger ticks beside section headings.
- A “cycle pulse” panel showing available, spent, and remaining balance as a single narrative.
- Status chips styled like stamped ledger annotations, with restrained borders and paper-like depth.

### Interaction Philosophy
Interactions should feel like editing a trusted record: clear focus states, immediate calculations, deliberate confirmation before deletion, and short toast feedback after successful saves. Nothing should move unexpectedly; motion should reinforce cause and effect.

### Animation
Use 180–240ms ease-out transitions for hover and focus. Cards enter with a subtle upward 6px translate and fade, staggered by 45ms. Modals use a soft scale from 0.97 with opacity rather than a dramatic zoom. Progress bars animate width only on value changes. Respect reduced-motion preferences.

### Typography System
Use **DM Serif Display** for the wordmark and major numeric emphasis, paired with **Plus Jakarta Sans** for interface copy, labels, and table content. Headings use 600–700 weight with tight tracking; metadata uses 11–12px uppercase labels with expanded letter spacing; numbers should feel editorial and legible, never overly ornamental.

### Brand Essence
**Kayal Expenses is a calm, tactile personal finance ledger for people who want a truthful view of their salary cycle, without backend complexity or financial-app noise.**
Personality: grounded, meticulous, encouraging.

### Brand Voice
Headlines are concise and confident. CTAs are specific and physical (“Record expense”, “Open August”). Microcopy explains the why without judgment.

Example lines:
- “Keep the month visible.”
- “Your balance is a story; make today’s entry part of it.”

### Wordmark & Logo
A compact copper monogram built from two offset ledger brackets forming a subtle K, paired with a serif wordmark. The mark should work independently as the app icon and remain recognizable at small sizes.

### Signature Brand Color
**Burnished Copper — #B86A3C.** It is warm, ownable, and distinct from standard fintech blue or green while remaining legible against parchment surfaces.

## Implementation notes

The interface is frontend-only and stores all monthly records, settings, and validated expenses in LocalStorage. The first-run state is intentionally empty and asks the user to create a salary cycle; no fake transactions, reviews, or demo expenses will be seeded. All expense calculations ignore records marked invalid during LocalStorage migration validation.

## Style Decisions

The accepted review amendments are now part of the build: the copper monogram appears in the sidebar and blank first-page state; empty states use a ruled ledger-page composition rather than a generic centered illustration; the history view adds archival rule cues and preserved-page metadata; and recurring copper lines, stamps, and paper structure reinforce the product identity.
