# Hemoglobin 3D Visualization Demo — Build Specification

## Purpose

Build a single-page interactive 3D demo that walks a viewer through sickle cell hemoglobin across five layers. The demo is for showing to a funder and a charter school founder next week. It needs to be compelling, not comprehensive. One HTML file. No build step. Opens in a browser.

The core thesis this demo proves: **understanding arrives before the words do.** Every layer should show something visually before explaining it textually.

---

## Source Documents

The building team must read these before starting:

1. **`esp32-omega/OMEGA_SCHOOL_FRAMEWORK.md`** — The full school framework. The sickle cell example starts at the section titled **"What This Looks Like: Sickle Cell Disease as Perceptual Literacy"** (around line 208). This is the narrative backbone. The five layers described there are the five stages of the demo. Read the entire section carefully — the demo must follow this story structure exactly.

2. **`esp32-omega/CURRICULUM_TEAM_ONBOARDING.md`** — Context on the broader school vision, the Situation Room concept, and what "perceptual literacy" means. Not required for building the demo, but useful for understanding tone and intent.

3. **`esp32-omega/OMEGA_SCHOOL_FRAMEWORK.md` lines 165-205** — The misinformation/propaganda section. Layer 5 of the demo connects to this argument. The demo's final stage should feel like a punchline to this setup.

---

## What to Build

A single `hemoglobin.html` file in `esp32-omega/demo/`. No external dependencies beyond CDN-loaded libraries. Must work by opening the file in Chrome/Safari. No server required.

### Tech Stack

- **Three.js** (via CDN importmap or script tag) for 3D rendering
- **OrbitControls** for mouse interaction
- Vanilla JS. No React, no bundler, no framework.
- All styles inline or in a `<style>` block
- All code in the single HTML file

### Design Tone

Dark background (#0a0a0f range). Minimal UI. Clean sans-serif type (Inter from Google Fonts). The aesthetic is "Situation Room," not "science museum." Think Bloomberg Terminal meets planetarium. No bright colors except for data. No playful elements. This is serious infrastructure.

---

## Structure: Landing → 5 Layers → Conclusion

### Landing Screen

Full-screen overlay. Dark background.

- Title: **"Hemoglobin"**
- Subtitle (smaller, above): "Omega School / Perceptual Literacy"
- One line of body text: "One mutation. One amino acid. A story that moves from atom to cell to body to population to justice — visible in three dimensions, understood before words."
- Single button: **"Start Demo"**
- Keyboard: Enter or Space also starts

When clicked, the landing fades out and the 3D scene + narration panel appear.

### Narration Panel

Fixed to the bottom of the screen over a gradient overlay (transparent → dark). Contains:

- **Layer indicator** — small caps, blue accent (e.g., "LAYER 1")
- **Title** — larger, white, bold
- **Body text** — smaller, grey, 2-4 sentences max per step
- **Navigation** — "Back" and "Next" buttons, plus step dots showing progress
- Keyboard: Arrow keys and Space for navigation

### Top Bar

Small, transparent. Left: "Omega School". Right: "Perceptual Literacy Demo — Sickle Cell Hemoglobin". Fades in when demo starts.

---

## The Five Layers (10 Steps Total)

Each step has: a narration card, a camera position, and a visual state. Some layers span multiple steps.

### Layer 1: The Molecule in Space (3 steps)

**Step 1 — The whole molecule**

- 3D scene: Hemoglobin tetramer — four protein subunits (2 alpha, 2 beta) arranged around a central cavity. Each subunit is a cluster of spheres or a stylized ribbon following a helical path. Each subunit contains a heme group (flat ring/torus with a glowing iron sphere at center).
- Camera: Pulled back, slowly auto-rotating. The viewer sees the whole molecule.
- The molecule should "breathe" — subtle scale oscillation to suggest the tense/relaxed conformational shift.
- Narration: Introduces hemoglobin. Four chains, heme groups, iron, oxygen binding. The structure breathes.

**Step 2 — Zoom to position 6**

- Camera animates smoothly to zoom into the beta-globin chain, specifically position 6 (the sixth amino acid sphere in the chain).
- A subtle glow ring or highlight appears around position 6.
- Narration: This is glutamic acid. Charged. Hydrophilic. Facing outward into water. This is why normal hemoglobin stays dissolved — the surface repels.

**Step 3 — The mutation**

- The highlighted amino acid visually changes: the sphere turns red, a "sticky patch" sphere (larger, red, emissive glow) appears overlapping it.
- The beta chain color shifts from blue to red.
- Narration: Valine replaces glutamic acid. Hydrophobic. Creates a sticky patch. In a textbook this is one sentence. Here, you watch it happen.

### Layer 2: The Cascade (2 steps)

**Step 4 — Polymerization**

- The hemoglobin tetramer is replaced (or hidden) by a visualization of polymerized fibers: long chains of locked-together hemoglobin molecules arranged in parallel rods inside a cell-shaped boundary.
- A side panel (fixed to upper-right) animates in a cascade diagram, step by step with ~400ms delays:
  - Valine mutation → Polymerization → Cell deformation → Vessel blockage → Pain crisis
  - Each step is an icon + short label, connected by vertical lines
- Narration: Under low oxygen, sticky patches interlock. Molecules form rigid fibers. The disease is unwanted architecture.

**Step 5 — From molecule to pain**

- Show two red blood cell shapes side by side or in sequence: a normal flexible disc (torus) and a sickle crescent (tube along a curved path).
- The sickle cell is rigid, darker red.
- Narration: One atom → surface flips → molecules polymerize → cell deforms → vessel blocks → pain. Every step visible. No step abstract.

### Layer 3: The Evolutionary Map (2 steps)

**Step 6 — The maps**

- Hide the 3D molecule. Show a 2D map overlay (canvas or SVG) on the right side of the screen.
- The map shows simplified continent outlines (doesn't need to be cartographic — stylized is fine).
- Two data layers rendered as soft radial gradients:
  - **Sickle cell trait distribution** (purple/blue glow): Sub-Saharan Africa (heavy), Mediterranean (moderate), Middle East (moderate), India (moderate)
  - **Malaria endemic regions** (yellow/amber glow): Same regions plus Southeast Asia
- The overlap between the two layers should be visually obvious and striking.
- Include a small legend at bottom of the map.
- Narration: Where do people carry the sickle cell trait? Overlay where malaria is endemic. The maps match. Students see it and ask "why?"

**Step 7 — Evolution's tradeoff**

- Same map stays visible.
- Narration: One copy protects against malaria. The parasite can't survive in sickle cells. Natural selection preserves the trait even though two copies cause disease. The student sees two maps and feels the tradeoff.

### Layer 4: The Civil Rights Layer (1 step)

**Step 8 — The timeline**

- Molecule returns to background, slowly rotating.
- A timeline panel animates in on the right side, items appearing one by one (~500ms apart):
  - **1910** — Sickle cell first described
  - **1938** — Cystic fibrosis first described
  - **1993** — CF treatment arrives — *55 years* (the years in red/emphasis)
  - **1998** — Sickle cell treatment — *88 years* (the years in red/emphasis)
  - **2020s** — Pain medication disparities *persist* (emphasis)
- Each item: year on left (blue accent), vertical line with dot, description on right.
- Narration: 88 years vs 55 years. Dramatically more NIH funding per patient for CF. Pain medication disparities into the 2020s. Biology and social failure in the same space.

### Layer 5: The Misinformation Test (1 step)

**Step 9 — Grey propaganda**

- Molecule in background.
- An overlay panel on the right animates in three parts with staggered timing:
  1. A "claim" card (red-tinted border): *"Sickle cell disease is a Black disease."*
  2. A "response" card (blue-tinted border): Explains that an Omega student has held the molecule, seen the global map, watched the evolutionary logic. They know this is grey propaganda — selectively true, strategically framed.
  3. A verdict line (green text): *"The propaganda cannot reach the perception. A flat lie cannot overwrite spatial understanding."*
- Narration: A textbook student hesitates. An Omega student doesn't need to fact-check. They've held the truth in three dimensions.

### Conclusion (1 step)

**Step 10 — The thesis**

- All overlays hidden. Molecule returns, full view, slowly rotating. Breathing.
- Narration: "One disease. One mutation. One molecule. Five layers from atom to justice. The same approach scales to any domain where complex systems are reduced to flat text. This is perceptual literacy. Understanding arrives before the words do."
- "Next" button label changes to "Restart"

---

## Technical Requirements

### 3D Molecule Construction

The hemoglobin doesn't need to be PDB-accurate. It needs to be recognizable and beautiful. Build it procedurally:

- **4 subunits**: Each is a series of spheres (amino acids) following a helical path, connected by thin cylinders (peptide bonds). Two alpha chains (upper), two beta chains (lower), arranged as a tetramer with slight offset/rotation.
- **4 heme groups**: One per subunit. Each is a flat torus (the porphyrin ring) with a sphere at center (iron atom). Iron should have emissive glow that pulses.
- **Position 6 marker**: The 6th sphere on each beta chain is the mutation site. Needs a ring or highlight that can be toggled on/off.
- **Sticky patch**: A slightly larger sphere overlapping position 6, red with emissive glow. Initially invisible (opacity 0, scale 0). Animates in during Step 3.
- **Breathing**: The entire hemoglobin group oscillates scale slightly (sin wave, ~0.97-1.03 range) to suggest conformational change.

### Camera System

- Use OrbitControls with damping. Auto-rotate is always on but speed varies per step.
- Camera transitions between steps should be smooth lerp over ~1.5 seconds using a smoothstep easing function.
- Each step defines a camera position and a look-at target.
- User can orbit/zoom freely at any time, but the "Next" button snaps to the prescribed camera angle for the next step.

### Overlays (Layers 3-5)

These are HTML/CSS overlays positioned over the 3D scene, not 3D objects. They appear on the right side of the screen. Only one overlay is visible at a time. Each has:
- Fade in on step enter
- Fade out on step exit
- Internal staggered animations for sub-elements

### Responsive Behavior

Should work on desktop screens (1280px+). Tablet is nice-to-have. Mobile is not required. If the window resizes, the 3D canvas and camera aspect ratio should update.

### Keyboard Navigation

- **Space / Right Arrow**: Next step
- **Left Arrow**: Previous step
- **Enter or Space on landing**: Start demo

---

## Visual Style Reference

- Background: near-black (#0a0a0f to #0f1029)
- Accent color: blue (#5a7aff)
- Danger/mutation: red (#cc4444)
- Normal protein: blue-teal (#4488cc)
- Heme: dark red (#aa2222)
- Iron: orange-red (#ff6633) with emissive glow
- Text: white for titles, grey (#a0aec0) for body
- Overlay cards: very subtle borders (rgba white or tinted), dark translucent backgrounds
- Everything should feel quiet and authoritative. No animations that feel playful or bouncy.

---

## File Output

Place the completed file at:
```
esp32-omega/demo/hemoglobin.html
```

The file must be fully self-contained. No other files needed. Open in browser, click Start Demo, walk through the story.

---

## What Success Looks Like

A non-technical person opens this file, clicks "Start Demo," and in 3 minutes understands:

1. Hemoglobin is a real 3D object, not a textbook diagram
2. One amino acid change creates a physical sticky patch they can see
3. That patch cascades into disease through visible physical steps
4. The evolutionary story is visible as overlapping maps
5. The medical justice story is visible as a timeline
6. A common piece of misinformation is visibly refuted by everything they just experienced

They close the laptop and say: "I get it. This is different."
