# 3D Vector Space Visualization for Education

## Product Specification v1.0

**Purpose**: Interactive 3D visualization showing how student observations/learning materials cluster and connect over time. Used to demonstrate "pre-linguistic understanding" — where students SEE patterns emerge before anyone explains them.

**Primary Use Case**: Demo for funders, educators, and parents showing how RuVector/Omega School technology reveals hidden connections in student work.

---

## 1. Overview

### What This Is

A browser-based 3D visualization that shows text entries (journal observations, essay paragraphs, study notes) as points in a 3D space. The key insight: after graph neural network (GNN) processing, related entries drift toward each other, revealing patterns the student didn't consciously know they were learning.

### The "Aha Moment"

A student writes 8 nature journal entries over a year. In flat view, they're just 8 separate notes. After GNN enrichment, entries about "squirrel hiding acorn" and "squirrel looks fat" cluster together. The student didn't need a teacher to explain "animals prepare for winter" — they watched their own observations cluster.

### Two Demo Scenarios

1. **Elementary (Maya's Journal)**: 8 nature observations over one year → reveals seasonal cycles and animal behavior patterns
2. **High School (Cross-Curricular)**: History chapter + Physics chapter → reveals hidden connections between Industrial Revolution and Thermodynamics

---

## 2. User Stories

### Funder Demo
- As a funder watching a demo, I want to see scattered points animate into clusters so I understand what "pre-linguistic learning" means visually
- As a funder, I want to click on any point and see the original text so I can verify the connections make sense

### Teacher Demo
- As a teacher, I want to show parents how their child's work connects across time/subjects
- As a teacher, I want to toggle between "before" and "after" states to show the value of the technology

### Student Use (Future)
- As a student, I want to explore my own learning in 3D and discover connections I didn't know existed
- As a student, I want to search for a concept and see related work highlight

---

## 3. Functional Requirements

### 3.1 Core Views

| View | Description | Trigger |
|------|-------------|---------|
| **Flat View** | Points scattered (simulating raw embeddings before graph enrichment) | Default on load, "Before" button |
| **Clustered View** | Points clustered by semantic relationship (after GNN) | "After" button |
| **Animated Transition** | Smooth interpolation from flat → clustered | "Animate" button |
| **Live Mode** | Points update in real-time as new entries are added | Toggle (future) |

### 3.2 Interactions

| Interaction | Behavior |
|-------------|----------|
| **Rotate** | Click + drag rotates the 3D space |
| **Zoom** | Scroll wheel or pinch zooms in/out |
| **Pan** | Right-click + drag (or two-finger drag) pans |
| **Hover** | Show tooltip with entry date and preview text |
| **Click** | Select point, show full text in sidebar, highlight connected points |
| **Double-click** | Zoom to point and center |

### 3.3 Data Display

| Element | Visual |
|---------|--------|
| **Point** | Sphere, colored by category (season, subject, etc.) |
| **Selected Point** | Larger sphere with glow effect |
| **Edge (connection)** | Semi-transparent line between related points |
| **Cluster Label** | Floating text label near cluster center (optional, toggle) |

### 3.4 Controls

| Control | Type | Function |
|---------|------|----------|
| Before | Button | Show flat/scattered positions |
| After | Button | Show GNN-enriched clustered positions |
| Animate | Button | Smooth transition from before → after |
| Speed | Slider | Animation speed (1-5 seconds) |
| Show Edges | Toggle | Show/hide connection lines |
| Show Labels | Toggle | Show/hide cluster labels |
| Color By | Dropdown | Season / Subject / Date / Theme |
| Search | Text input | Highlight points matching query |
| Reset Camera | Button | Return to default camera position |

---

## 4. Visual Design Specification

### 4.1 Color Palette

```css
/* Background */
--bg-primary: #0a0a0a;
--bg-secondary: #1a1a1a;

/* Seasons (Elementary Demo) */
--color-fall: #ff6b35;
--color-winter: #4ecdc4;
--color-spring: #95d5b2;
--color-summer: #ffd166;

/* Subjects (High School Demo) */
--color-history: #6366f1;
--color-physics: #22c55e;
--color-shared: #f59e0b;

/* UI */
--text-primary: #ffffff;
--text-secondary: #888888;
--accent: #3b82f6;
--edge-color: rgba(255, 255, 255, 0.15);
--edge-highlight: rgba(255, 255, 255, 0.6);
```

### 4.2 Typography

```css
--font-primary: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

--text-title: 24px, weight 600;
--text-subtitle: 14px, weight 400, color: var(--text-secondary);
--text-label: 12px, weight 500;
--text-tooltip: 13px, weight 400;
```

### 4.3 Point Styling

| State | Size | Opacity | Effect |
|-------|------|---------|--------|
| Default | 8px | 0.9 | None |
| Hover | 10px | 1.0 | Subtle glow |
| Selected | 14px | 1.0 | Pulse animation + bright glow |
| Connected (to selected) | 10px | 1.0 | Glow matching edge |
| Dimmed (search non-match) | 6px | 0.3 | None |

### 4.4 Edge Styling

| State | Width | Opacity | Color |
|-------|-------|---------|-------|
| Default | 1px | 0.15 | White |
| Highlighted | 2px | 0.6 | White or gradient |
| Hidden | 0 | 0 | N/A |

### 4.5 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  Maya's Nature Journal - Vector Space        [?] [⚙]   │
├─────────────────────────────────────────────────────────────────┤
│                                                      │          │
│                                                      │  Entry   │
│                                                      │  Detail  │
│                    3D Viewport                       │  Panel   │
│                    (80% width)                       │  (20%)   │
│                                                      │          │
│                                                      │          │
│                                                      │          │
├─────────────────────────────────────────────────────────────────┤
│  [Before] [After] [▶ Animate]  |  ○ Edges  ○ Labels  |  🔍 Search │
└─────────────────────────────────────────────────────────────────┘
```

Mobile: Sidebar becomes bottom sheet, controls become floating buttons.

---

## 5. Animation Specification

### 5.1 Transition Animation (Flat → Clustered)

```javascript
// Easing function: ease-in-out cubic
const easeInOutCubic = t => t < 0.5
  ? 4 * t * t * t
  : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Duration: configurable, default 2500ms
// Frame rate: 60fps (requestAnimationFrame)

// For each point i:
position[i] = {
  x: flatPos[i].x + (gnnPos[i].x - flatPos[i].x) * easeInOutCubic(t),
  y: flatPos[i].y + (gnnPos[i].y - flatPos[i].y) * easeInOutCubic(t),
  z: flatPos[i].z + (gnnPos[i].z - flatPos[i].z) * easeInOutCubic(t)
}
```

### 5.2 Edge Appearance

Edges should fade in during the second half of the transition:

```javascript
// Edges start appearing at t = 0.5
const edgeOpacity = t > 0.5 ? (t - 0.5) * 2 * 0.15 : 0;
```

### 5.3 Point Pulse (Selected)

```css
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}
/* Duration: 1.5s, infinite, ease-in-out */
```

### 5.4 Camera Auto-Rotate (Idle)

After 10 seconds of no interaction, slowly rotate camera around Y-axis:

```javascript
// Rotation speed: 0.1 radians per second
// Stop on any user interaction
// Resume after 10 seconds idle
```

---

## 6. Data Structures

### 6.1 Entry Object

```typescript
interface Entry {
  id: number;
  text: string;                    // Full text content
  preview: string;                 // First 50 chars for tooltip
  date: string;                    // Display date (e.g., "Sep 15")
  timestamp: number;               // Unix timestamp for sorting
  category: string;                // e.g., "fall", "history", "squirrel"
  theme?: string;                  // e.g., "preparation", "change"

  // Positions (3D coordinates, range -3 to 3)
  flatPosition: Vector3;           // Before GNN
  gnnPosition: Vector3;            // After GNN

  // Connections (populated after GNN)
  connections: number[];           // IDs of connected entries
  connectionStrengths: number[];   // 0-1 strength for each connection
}

interface Vector3 {
  x: number;
  y: number;
  z: number;
}
```

### 6.2 Demo Dataset: Maya's Journal

```typescript
const mayaJournal: Entry[] = [
  {
    id: 1,
    text: "I saw a squirrel hiding an acorn under the big oak tree. It was digging with its little paws.",
    preview: "I saw a squirrel hiding an acorn...",
    date: "Sep 15",
    timestamp: 1694764800,
    category: "fall",
    theme: "preparation",
    flatPosition: { x: -2.0, y: 1.0, z: 0.5 },
    gnnPosition: { x: -1.5, y: 1.2, z: 0.3 },
    connections: [4, 3],
    connectionStrengths: [0.9, 0.6]
  },
  {
    id: 2,
    text: "The leaves on the maple tree are turning orange and red. Some are falling down like confetti.",
    preview: "The leaves on the maple tree are...",
    date: "Oct 3",
    timestamp: 1696291200,
    category: "fall",
    theme: "change",
    flatPosition: { x: 1.0, y: -1.5, z: 2.0 },
    gnnPosition: { x: -1.2, y: 0.8, z: 0.5 },
    connections: [3, 5],
    connectionStrengths: [0.7, 0.5]
  },
  {
    id: 3,
    text: "It's getting cold outside. I don't see as many bugs anymore. Where did they go?",
    preview: "It's getting cold outside...",
    date: "Oct 20",
    timestamp: 1697760000,
    category: "fall",
    theme: "preparation",
    flatPosition: { x: -1.0, y: 2.0, z: -1.0 },
    gnnPosition: { x: -1.3, y: 1.0, z: 0.1 },
    connections: [1, 2, 8],
    connectionStrengths: [0.6, 0.7, 0.8]
  },
  {
    id: 4,
    text: "The squirrel looks really fat now! Its cheeks are so puffy. It must have eaten a lot of acorns.",
    preview: "The squirrel looks really fat now...",
    date: "Nov 8",
    timestamp: 1699401600,
    category: "fall",
    theme: "preparation",
    flatPosition: { x: 2.0, y: 0.5, z: 1.0 },
    gnnPosition: { x: -1.4, y: 1.1, z: 0.4 },
    connections: [1, 6],
    connectionStrengths: [0.9, 0.7]
  },
  {
    id: 5,
    text: "Snow! Everything is white. The tree has no leaves at all now. It looks like a skeleton.",
    preview: "Snow! Everything is white...",
    date: "Dec 5",
    timestamp: 1701734400,
    category: "winter",
    theme: "dormant",
    flatPosition: { x: 0.0, y: -2.0, z: -0.5 },
    gnnPosition: { x: 0.0, y: -1.5, z: -0.2 },
    connections: [2],
    connectionStrengths: [0.5]
  },
  {
    id: 6,
    text: "I heard birds singing this morning! The squirrel is skinny now. Spring must be coming.",
    preview: "I heard birds singing this morning...",
    date: "Mar 10",
    timestamp: 1710028800,
    category: "spring",
    theme: "awakening",
    flatPosition: { x: -1.5, y: 0.0, z: -2.0 },
    gnnPosition: { x: 1.2, y: 0.3, z: -0.5 },
    connections: [4, 7],
    connectionStrengths: [0.7, 0.85]
  },
  {
    id: 7,
    text: "Baby squirrels in the tree! So tiny and cute. There are tiny green leaves starting to grow.",
    preview: "Baby squirrels in the tree...",
    date: "Apr 2",
    timestamp: 1712016000,
    category: "spring",
    theme: "new life",
    flatPosition: { x: 1.5, y: 1.0, z: -1.0 },
    gnnPosition: { x: 1.4, y: 0.5, z: -0.3 },
    connections: [6, 8, 1],
    connectionStrengths: [0.85, 0.6, 0.5]
  },
  {
    id: 8,
    text: "The tree has ALL its leaves back! Big and green. And there are so many bugs everywhere now.",
    preview: "The tree has ALL its leaves back...",
    date: "May 15",
    timestamp: 1715731200,
    category: "summer",
    theme: "abundance",
    flatPosition: { x: 0.5, y: -1.0, z: 1.5 },
    gnnPosition: { x: 2.0, y: -0.2, z: 0.8 },
    connections: [3, 7],
    connectionStrengths: [0.8, 0.6]
  }
];
```

### 6.3 Demo Dataset: History + Physics (High School)

```typescript
const crossCurricular: Entry[] = [
  // History entries (blue)
  {
    id: 1,
    text: "The steam engine transformed manufacturing. Factories no longer needed to be near rivers for water power.",
    category: "history",
    theme: "industrial_revolution",
    flatPosition: { x: -2.5, y: 1.0, z: 0.0 },
    gnnPosition: { x: -0.5, y: 0.3, z: 0.0 },  // Moves toward shared concepts
    connections: [5, 6, 9],  // Connects to physics concepts
    // ...
  },
  {
    id: 2,
    text: "Child labor in factories was common. Children as young as 6 worked 12-hour days.",
    category: "history",
    theme: "social_impact",
    flatPosition: { x: -2.0, y: -1.0, z: 1.0 },
    gnnPosition: { x: -2.0, y: -0.8, z: 0.8 },  // Stays in history cluster
    connections: [3],
    // ...
  },
  // ... more history entries

  // Physics entries (green)
  {
    id: 5,
    text: "A heat engine converts thermal energy into mechanical work. The Carnot cycle describes the maximum possible efficiency.",
    category: "physics",
    theme: "thermodynamics",
    flatPosition: { x: 2.0, y: 0.5, z: -1.0 },
    gnnPosition: { x: 0.3, y: 0.5, z: -0.2 },  // Moves toward shared concepts
    connections: [1, 6, 7],
    // ...
  },

  // Shared concepts (gold) - these are the "bridge" nodes
  {
    id: 9,
    text: "SHARED: Steam engines operate at ~5-10% efficiency. Most energy is lost as waste heat.",
    category: "shared",
    theme: "efficiency",
    flatPosition: { x: 0.0, y: 2.0, z: 0.0 },
    gnnPosition: { x: 0.0, y: 0.0, z: 0.0 },  // Center of the visualization
    connections: [1, 5, 6],
    // ...
  }
];
```

---

## 7. Technical Requirements

### 7.1 Framework Options (Pick One)

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Three.js** | Full control, best performance, impressive visuals | More code, steeper learning curve | Best for keynote demo |
| **Plotly.js** | Easy 3D scatter, good interactivity | Less customizable, larger bundle | Best for quick prototype |
| **React Three Fiber** | React integration, declarative | Adds complexity | Best if already using React |
| **Babylon.js** | Full game engine, great docs | Overkill for this use case | Not recommended |

**Recommended**: Three.js for production, Plotly.js for rapid prototype.

### 7.2 Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 90+ | Primary target |
| Safari | 14+ | Test WebGL performance |
| Firefox | 88+ | Secondary |
| Edge | 90+ | Chromium-based |
| Mobile Safari | iOS 14+ | Touch interactions |
| Mobile Chrome | Android 10+ | Touch interactions |

### 7.3 Performance Targets

| Metric | Target |
|--------|--------|
| Initial load | < 2 seconds |
| Time to interactive | < 3 seconds |
| Animation frame rate | 60 fps |
| Max entries before degradation | 500 |
| Bundle size | < 500 KB gzipped |

### 7.4 Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | Arrow keys rotate, +/- zoom, Enter selects |
| Screen reader | Entry list in sidebar is accessible |
| Color contrast | All text meets WCAG AA |
| Reduced motion | Respect `prefers-reduced-motion`, skip animations |
| Focus indicators | Visible focus ring on all controls |

---

## 8. API Integration (Future)

### 8.1 RVF File Loading

```typescript
// Future: Load directly from .rvf file
interface RvfLoadResponse {
  entries: Entry[];
  metadata: {
    dimension: number;
    vectorCount: number;
    hasGnnEnrichment: boolean;
    witnessChainValid: boolean;
  };
}

async function loadRvfFile(file: File): Promise<RvfLoadResponse>;
```

### 8.2 Real-Time Updates (WebSocket)

```typescript
// Future: Live updates as student adds entries
interface RvfUpdateMessage {
  type: 'entry_added' | 'positions_updated' | 'connection_added';
  payload: Entry | { positions: Vector3[] } | { from: number, to: number };
}
```

### 8.3 Embedding Generation

```typescript
// Future: Generate embeddings for new text
interface EmbedRequest {
  text: string;
  model?: 'all-MiniLM-L6-v2' | 'text-embedding-3-small';
}

interface EmbedResponse {
  embedding: number[];  // 384 or 1536 dimensions
  flatPosition: Vector3;  // UMAP projection
  gnnPosition?: Vector3;  // After GNN enrichment
}
```

---

## 9. Deliverables

### Phase 1: Prototype (1 week)
- [ ] Static HTML + Plotly.js
- [ ] Maya's Journal demo data hardcoded
- [ ] Before/After/Animate buttons working
- [ ] Basic hover tooltips
- [ ] Works on desktop Chrome

### Phase 2: Production (2 weeks)
- [ ] Three.js implementation
- [ ] Both demo datasets (Elementary + High School)
- [ ] Sidebar with entry details
- [ ] All controls (edges, labels, search, color by)
- [ ] Mobile responsive
- [ ] Keyboard accessibility

### Phase 3: Integration (Future)
- [ ] Load from .rvf file
- [ ] Real embeddings via API
- [ ] Live mode with WebSocket
- [ ] Student-facing version with auth

---

## 10. Example Scenarios to Test

### Scenario 1: Funder Demo
1. Open page → shows Maya's Journal, flat view
2. Click "Animate Learning" → watch 8 points cluster over 2.5 seconds
3. Fall entries (orange) cluster in upper left
4. Spring entries (green) cluster in lower right
5. Lines appear connecting squirrel entries
6. Click on "Squirrel hiding acorn" → sidebar shows full text, connected entries highlight
7. Funder understands: "The student's observations formed a pattern without explicit instruction"

### Scenario 2: Teacher Presentation
1. Load High School demo
2. Show "Before" → History (blue) and Physics (green) completely separate
3. Click "Animate" → Watch "steam engine" nodes from both subjects drift toward center
4. Gold "shared concept" nodes become the bridge
5. Teacher explains: "Your history essay and physics lab are secretly about the same thing"

### Scenario 3: Student Exploration (Future)
1. Student logs in, sees their own journal entries
2. Types "winter" in search → Winter-related entries highlight
3. Notices their entry about "squirrel is fat" is connected to "cold weather" entry
4. Clicks edge → sees explanation: "These entries share themes of preparation and seasonal change"
5. Student has insight about their own learning pattern

---

## 11. Open Questions for Product Discussion

1. **Should edges show by default?** Too many edges might be overwhelming. Consider showing only on hover/select.

2. **What if entries don't cluster well?** Need fallback messaging: "Not enough data yet" or "Keep journaling!"

3. **Should we show the "learning" as an ongoing process?** Could add a timeline slider showing how clusters form over time as more entries are added.

4. **Multi-student view?** Future feature where teacher sees all students' spaces, can spot who's making connections vs. who needs help.

5. **Export/Share?** Allow saving a snapshot image or shareable link for portfolios.

---

## 12. References

- Three.js documentation: https://threejs.org/docs/
- Plotly.js 3D scatter: https://plotly.com/javascript/3d-scatter-plots/
- UMAP projection: https://umap-learn.readthedocs.io/
- RVF format spec: See `/crates/rvf/README.md`
- Omega School curriculum context: See `/esp32-omega/CURRICULUM_TEAM_ONBOARDING.md`

---

## Appendix A: Quick Start for Developers

```bash
# Clone and run prototype
git clone <repo>
cd vector-space-viz
npm install
npm run dev

# Open http://localhost:3000
# Edit src/data/maya.ts for demo data
# Edit src/components/Viewport.tsx for 3D logic
```

## Appendix B: Asset Requirements

| Asset | Format | Notes |
|-------|--------|-------|
| Logo | SVG | Omega School or RuVector branding |
| Font files | WOFF2 | Inter + JetBrains Mono |
| Loading spinner | CSS animation | No external GIF |
| Sound effects | None | Silent by default |

---

*Specification Version: 1.0*
*Last Updated: 2026-02-21*
*Author: Omega School Technical Team*
