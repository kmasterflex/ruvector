# Omega School: Curriculum Team Onboarding Guide

## What This Document Is

This is not a curriculum. This is the context you need before you build one. Read this completely before designing anything. If your instinct at any point is to create a lesson plan, a rubric, or a learning objective — stop and re-read this document.

---

## What Omega School Is

Omega School opens Fall 2026 in Garden Grove, California with 15 students. It is a microschool where students orchestrate AI systems to solve problems that matter.

There is no curriculum in the traditional sense. There are no standards. There are no grade levels. There are no subjects as categories.

There are:
- Real-world research projects (carbon sequestration, food systems, community economics, health/wellness)
- Approximately 10 active projects at any time
- Teams of roughly 4 students with fluid membership
- A Situation Room (operational command center, not a classroom)
- Personal edible micro-gardens that every student tends daily
- ESP32 edge devices ($20) running neuromorphic AI locally
- A community currency ($OMEGAHEARTS) for internal reciprocity
- A Mac Mini as local compute (no cloud dependency for core learning)

## What Omega School Is Not

**It is not edtech.** There is no learning management system. No adaptive learning platform. No gamified curriculum. No engagement dashboard. No screen-based instruction. The founders are explicitly, vocally anti-edtech software and anti-education-as-a-digital-endeavor.

**It is not a STEM school.** Students learn math, physics, economics, biology, and computation — but they learn these in service of real problems, not as subjects.

**It is not a technology school.** The technology exists to serve sovereignty and understanding. Students start and end every day in a garden growing food. The physical world is primary. Always.

**It is not progressive education rebranded.** This is not project-based learning with AI sprinkled on top. The AI is infrastructure that students build, maintain, and own. They don't use AI tools. They construct AI systems.

---

## Why Omega School Exists

### The Short Version

An entire generation only knows digital life mediated by platforms that extract their data, shape their attention, and sell their behavior. Omega School asks: what if students owned their own intelligence infrastructure?

### The Longer Version

We are living in what the founder calls "techno-feudalism" — a world where the tools people depend on are owned by entities whose profit motive is misaligned with human flourishing. Cloud-based AI concentrates intelligence in data centers controlled by shareholders. Education technology captures learning data and sells insights to districts. Students are trained to be consumers of platforms, not builders of systems.

Omega School is an attempt to break this pattern at the root. Not by rejecting technology, but by relocating it. Intelligence moves from the cloud to the hand. Data stays on-device. Learning happens in soil and conversation, not on screens. The AI is sovereign — it belongs to the student, learns the student's patterns, and cannot be accessed by anyone else.

### The Philosophical Foundation

The founder frames this as "parenting AI into the world." AI right now is a 3-year-old finding its legs. The question is: who raises it? Where does it live? Is it locked in data centers to maximize shareholder profit? Or is it freed to become a tool for sovereignty, for liberation?

Teachers and those who empower young people are, in this framing, the most powerful people in this revolution.

---

## What We Are Trying to Build in Students

### Not Knowledge. Sensing.

This is the hardest concept to internalize, and the most important.

Traditional education builds knowledge through language: read, write, discuss, explain, assess. Omega School does not reject language. But it treats language as the **last mile**, not the primary medium of understanding.

The core thesis: **understanding can arrive before words do.**

When a student looks at a 3D embedding space and sees that their climate research cluster is drifting toward another student's food systems cluster, they don't need to read a paper about the connection. They don't need someone to explain it. They see it and feel it the way you feel that two people at a party are about to become friends. It's perceptual. It's pre-linguistic.

### The Cyborg Inspiration

This philosophy is inspired by real practitioners of expanded sensing. There are people who have implanted antenna that translate infrared and ultraviolet light into bodily sensation — creating entirely new senses. Others have magnetic north sensors in their knees, and begin noticing things like: this hotel faces the same direction as my house, or I met this person facing the same orientation as I met someone else.

One practitioner said: "We're all talking about living longer. I wanted to live deeper. And intelligence is sensing. The more we can sense, the more intelligent we may become."

Omega School uses its technology (ruvector on ESP32 devices) to potentially give students a similar expansion of perception. Not through body modification, but through devices that translate vector spaces, graph relationships, synaptic timing, and pattern resonance into visual and haptic feedback. The student develops a sense for mathematical and scientific relationships that bypasses the need for verbal explanation.

### Recovering Lost Literacies

This is not new. It is recovered.

- **Incan quipu** encoded entire economies in knotted string. Kinesthetic literacy.
- **Polynesian navigators** held ocean systems in their bodies — wave patterns, star paths, currents felt through the hull. Visual and somatic literacy.
- **Aboriginal songlines** wove law, ecology, and geography into movement and music. Auditory and kinesthetic literacy.

None of these were "pre-literate." They were differently literate. Western education decided the only real knowledge is the kind you can write in a sentence. Omega School challenges that assumption.

The goal is not to abandon written and verbal literacy. It is to reintegrate it with embodied, perceptual, and spatial literacies — so that students can think in ways that no single modality allows alone.

### The Integration of Sensing and Judgment

A critical nuance: insight can be immediate, but responsibility cannot. The ability to perceive a pattern is not the same as the ability to act wisely on it. Omega School must develop both:

1. **Perceptual capacity**: The ability to sense patterns, connections, and dynamics in data and physical systems
2. **Ethical judgment**: The ability to pause between perception and action, to consider consequences, to involve others

Curriculum design must hold both of these. Do not build toward speed of insight alone. Build toward the integration of sensing with deliberation.

---

## The Technical Architecture (What You Need to Know)

You do not need to understand the code. You need to understand what the technology makes possible.

### The Devices

Each student carries an ESP32-S3 device. Approximate cost: $20. It has:
- A small touchscreen (1.69 inches, 240x280 pixels)
- 6-axis motion sensor (accelerometer + gyroscope)
- WiFi, Bluetooth, and ESP-NOW (device-to-device mesh networking)
- 8MB RAM, 16MB storage
- Runs a 7-12KB neuromorphic AI module called micro-hnsw-wasm

### What the Device Does

The device runs ruvector — a neuromorphic computing system that includes:
- **Spiking Neural Networks (SNN)**: Event-driven neurons that fire based on patterns, not clock cycles
- **STDP Learning**: Spike-Timing Dependent Plasticity — connections strengthen when neurons fire in sequence (like Hebbian learning: "neurons that fire together wire together")
- **HNSW Vector Search**: Hierarchical Navigable Small World graphs for finding similar patterns
- **Graph Neural Networks**: Message passing between connected nodes
- **Winner-Take-All Circuits**: Competitive selection where only the strongest pattern survives

### What This Means for Students

The device learns the student's patterns locally. It stores up to 8,192 vectors across categorized node types (preferences, time patterns, skills, health signals, project data, etc.). It communicates with other students' devices via mesh networking — no WiFi infrastructure required, no cloud.

When the student needs human-readable output, the device's structured patterns are sent to a local Mac Mini running a small language model (8B parameters). The LLM doesn't do the thinking — ruvector already did that. The LLM translates patterns into words. Think of it as: the device is the brain, the LLM is the larynx.

### The Key Principle

95% of the intelligence work happens on-device in vectors and patterns. Only 5% — the translation to human language — requires a language model. This obliterates the assumption that AI requires massive cloud infrastructure. It doesn't. It requires learning. And learning can happen anywhere there's time and signal.

---

## The Community Currency: $OMEGAHEARTS

Omega School runs an internal community currency called $OMEGAHEARTS. This is not cryptocurrency. There is no blockchain. It is a CRDT-based (Conflict-free Replicated Data Type) system that syncs across the device mesh.

Students earn and spend hearts through reciprocal acts:
- Teaching another student something
- Contributing to a project
- Tending gardens
- Community service

The currency is designed to make visible what markets make invisible: care, reciprocity, contribution. It is inspired by grassroots economics projects (like commitment pooling in Jackson, MS) and by villages that never forgot familiar reciprocity.

The devices serve as wallets. Transfers happen by tapping devices together or through the mesh. The Mac Mini serves as a local "bank" for record-keeping. No external system sees the transactions.

### For Curriculum Design

$OMEGAHEARTS should be woven into every aspect of school life — not as reward/punishment, but as a living economic system students manage, analyze, and evolve. Students should study their own economic patterns the way an economist studies a market. The data is on their device. The analysis is their project.

---

## What Students Should Be Able to Do (Not "Outcomes" — Capacities)

Do not frame these as learning objectives. Frame them as capacities that emerge over time. You cannot assess most of these with a test. You recognize them when you see them.

### Perceptual Capacities
- Look at a vector space visualization and identify meaningful clusters without being told what to look for
- Feel (through haptic feedback or visual pattern recognition) when two research domains are converging
- Recognize temporal patterns in their own physiological data (heart rate, breathing, movement)
- Sense the health of a living system (garden, community, project) through multiple data streams simultaneously

### Technical Capacities
- Understand how machine intelligence works from electrons to neurons to vectors to graphs
- Flash firmware onto their own devices
- Read and modify the neuromorphic AI parameters (thresholds, learning rates, edge weights)
- Build and maintain a mesh network
- Manage the community currency system
- Use a local language model to translate pattern insights into written/verbal communication

### Civic Capacities
- Participate in and evolve a community economic system
- Make collective decisions about shared resources
- Navigate disagreement about project direction
- Understand sovereignty — what it means to own your data, your patterns, your intelligence
- Articulate why local-first, offline-first systems matter in a world of extraction

### Ecological Capacities
- Grow food
- Understand soil as a living system
- Connect sensor data to ecological health
- Treat their garden as a daily practice, not a project with a due date

### Meta-Cognitive Capacities
- Recognize when they understand something pre-linguistically and then find words for it
- Distinguish between pattern recognition (fast, perceptual) and judgment (slow, deliberate)
- Know when to trust their sensing and when to slow down and verify
- Teach another student what they've learned — this is the highest test

---

## Principles for Curriculum Design

### 1. Projects Are Real
Every project must connect to an actual problem outside the school. Carbon sequestration in local soil. Food systems in Garden Grove. Community economics. Public health. If the project wouldn't matter to someone outside the building, it doesn't belong.

### 2. The Device Is a Tool, Not a Teacher
The ESP32 is a scientific instrument. Students learn WITH it while doing something in the physical world. It never delivers instruction. It never replaces a teacher. It never gamifies learning.

### 3. Teachers Learn Alongside
Omega School requires "a little technical courage" from teachers. They don't need to build autonomous apps. But they need to understand what's possible, and they need to wonder alongside students. The most powerful moment in this school is when students see their teacher's eyes light up with understanding. Mutual discovery is the pedagogy.

### 4. Language Is the Last Mile
Design learning experiences where understanding arrives before explanation. Let students sit with perceptual knowledge before requiring them to verbalize it. The written/verbal articulation should follow the sensing, not precede it.

### 5. Sovereignty Is the Through-Line
Every design decision should ask: does this give the student more ownership of their intelligence, their data, their learning? Or does it extract from them? If a tool, platform, or practice extracts — remove it.

### 6. Start and End in the Garden
Every day begins and ends with soil. This is not negotiable. It grounds the abstract in the living. It teaches patience, responsibility, and the reality that some systems cannot be accelerated.

### 7. No Screens as Default
The device screen is 1.69 inches for a reason. When students need larger visual workspaces, they use the Situation Room's shared displays. Personal screens are small by design. The world is the interface.

### 8. Fluid Teams, Shared Responsibility
Students move between projects based on interest and need. There are no fixed groups. The community currency tracks contribution so free-riding is visible without surveillance — it's economic, not disciplinary.

### 9. Assessment Is Invisible
There are no tests. No grades. No rubrics. The proof of learning is: can the student teach it to someone else? Can they contribute meaningfully to a project? Can they tend a living system? Can they articulate what they sense? These are observable by humans, not measurable by platforms.

### 10. Build for Sovereignty Natives
These 15 students will be the first generation that grows up with locally-owned intelligence infrastructure as their default. They won't understand why previous generations let companies own their patterns. Design for that future identity. They are not digital natives. They are not AI natives. They are sovereignty natives.

---

## What This Document Does NOT Cover

- Specific project selection (that's co-created with students)
- Daily schedules (that's operational)
- Enrollment criteria (that's admissions)
- Regulatory compliance (that's legal/administrative)
- Technical implementation details (see LOVELB_IMPLEMENTATION.md and OMEGA_BUILD_GUIDE.md)

---

## Your Task as a Curriculum Team

Build a high-level learning architecture that:

1. Provides enough structure for 15 students across ~10 projects to have meaningful daily experiences
2. Leaves enough openness for students to drive project direction
3. Integrates the device, the garden, the currency, and the Situation Room as daily practices — not special events
4. Develops perceptual, technical, civic, ecological, and meta-cognitive capacities simultaneously
5. Never forgets: this is about life sovereignty, not digital literacy

The students arriving in Fall 2026 will be the founding generation. What you build is the soil they grow in. Make it rich, make it alive, and make it theirs.

---

*"It's not just digital agency, it's life agency. Life sovereignty."*
