# LOVELB: ESP32 + RuVector Implementation Guide

## For Claude: Build This Firmware

This document contains everything needed to implement the $LOVELB community currency system on Waveshare ESP32-S3-Touch-LCD-1.69 devices with a Mac Mini as the central bank.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        MAC MINI                              │
│                       "The Bank"                             │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ Master       │ │ RuVector     │ │ Joy Engine           │ │
│  │ Ledger       │ │ Full Stack   │ │ (Pattern Detection   │ │
│  │ (SQLite)     │ │ (GNN, SNN,   │ │  + Suggestions)      │ │
│  │              │ │  HNSW, SONA) │ │                      │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ Sync Server  │ │ Conflict     │ │ Local LLM            │ │
│  │ (HTTP/WS)    │ │ Resolver     │ │ (Qwen 8B via Ollama) │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    WiFi (when available)
                           │
     ┌─────────────────────┼─────────────────────┐
     │                     │                     │
     ▼                     ▼                     ▼
┌─────────┐          ┌─────────┐          ┌─────────┐
│ ESP32 A │◄──────►│ ESP32 B │◄──────►│ ESP32 C │
│         │ ESP-NOW  │         │ ESP-NOW  │         │
│ Dorothy │ (direct) │  Maria  │ (direct) │   Tom   │
│ 47 $LB  │          │ -23 $LB │          │  31 $LB │
│         │          │         │          │         │
│ micro-  │          │ micro-  │          │ micro-  │
│ hnsw    │          │ hnsw    │          │ hnsw    │
│ (local  │          │ (local  │          │ (local  │
│  AI)    │          │  AI)    │          │  AI)    │
└─────────┘          └─────────┘          └─────────┘
```

---

## Hardware: Waveshare ESP32-S3-Touch-LCD-1.69

### Specs
- **MCU:** ESP32-S3R8, dual-core 240MHz, 512KB SRAM, 8MB PSRAM, 16MB Flash
- **Display:** 1.69" 240×280 IPS, 262K color, ST7789V2 driver (SPI)
- **Touch:** CST816T capacitive touch (I2C)
- **IMU:** QMI8658 6-axis: 3-axis accel + 3-axis gyro (I2C)
- **RTC:** PCF85063 (I2C)
- **Audio:** Buzzer (GPIO4)
- **Battery:** MX1.25 LiPo header, ETA6096 charge IC
- **Connectivity:** WiFi 802.11 b/g/n + Bluetooth 5 LE + ESP-NOW
- **Buttons:** PWM (GPIO0), BOOT, RST
- **USB:** Type-C (native USB on S3)

### Pin Map

| Function     | GPIO | Bus  |
|-------------|------|------|
| LCD_MOSI    | 11   | SPI  |
| LCD_SCLK    | 12   | SPI  |
| LCD_CS      | 10   | SPI  |
| LCD_DC      | 13   | SPI  |
| LCD_RST     | 9    | SPI  |
| LCD_BL      | 14   | GPIO |
| TOUCH_SDA   | 6    | I2C  |
| TOUCH_SCL   | 7    | I2C  |
| TOUCH_INT   | 5    | GPIO |
| TOUCH_RST   | 8    | GPIO |
| IMU_SDA     | 6    | I2C (shared) |
| IMU_SCL     | 7    | I2C (shared) |
| BUZZER      | 4    | PWM  |
| BUTTON      | 0    | GPIO |

---

## What Lives On Each ESP32

### 1. Wallet State

```c
typedef struct {
    char owner_name[32];         // "Dorothy"
    char device_id[16];          // Unique device identifier
    int32_t balance;             // Current $LOVELB balance (cents for precision)
    uint32_t tx_count;           // Total transactions
    uint32_t last_sync_time;     // RTC timestamp of last Mac Mini sync
    uint8_t mac_addr[6];         // This device's MAC address
} Wallet;
```

### 2. Transaction Log

```c
typedef struct {
    uint32_t id;                 // Sequential transaction ID
    uint32_t timestamp;          // RTC timestamp
    char from_name[32];          // Sender name
    char to_name[32];            // Receiver name
    uint8_t from_mac[6];        // Sender device MAC
    uint8_t to_mac[6];          // Receiver device MAC
    int32_t amount;              // Amount in $LOVELB (positive)
    char memo[64];               // "mole", "childcare 2hrs", "sourdough"
    uint8_t synced;              // 0=pending, 1=synced to bank
    uint8_t confirmed;           // 0=unconfirmed, 1=confirmed by both parties
} Transaction;

// Store up to 256 transactions locally (in PSRAM)
#define MAX_LOCAL_TX 256
Transaction tx_log[MAX_LOCAL_TX];
uint16_t tx_count = 0;
```

### 3. Sync Queue

```c
typedef struct {
    Transaction pending_tx[64];  // Transactions not yet synced
    uint8_t pending_count;
    uint32_t last_attempt;       // Last sync attempt timestamp
} SyncQueue;
```

### 4. RuVector micro-hnsw (Local AI)

The micro-hnsw-wasm module runs on each device via WASM runtime. It provides:

**What it stores (as vectors):**
- Transaction pattern embeddings (who, what, when, how much)
- Community member profiles (what they offer, what they need)
- Temporal patterns (when does this person usually transact)

**What it does:**
- Pattern matching: "This transaction looks similar to past ones"
- Anomaly detection: "This is unusual for this person"
- Suggestion generation: "Based on patterns, you might want..."

**WASM Integration:**

```c
// On ESP32, use wasm3 as the WASM runtime
// micro-hnsw-wasm compiles to ~7-12KB WASM binary

#include "wasm3.h"
#include "m3_env.h"

// Pre-compiled WASM binary (embedded in firmware)
extern const uint8_t micro_hnsw_wasm[];
extern const uint32_t micro_hnsw_wasm_len;

// WASM function pointers (resolved at init)
IM3Function fn_init;
IM3Function fn_insert;
IM3Function fn_search;
IM3Function fn_snn_tick;
IM3Function fn_snn_inject;
IM3Function fn_hnsw_to_snn;
IM3Function fn_snn_get_spikes;
IM3Function fn_homeostatic_update;
IM3Function fn_wta_compete;
IM3Function fn_encode_vector_to_spikes;
IM3Function fn_spike_timing_similarity;

void init_ruvector() {
    // Initialize wasm3 environment
    IM3Environment env = m3_NewEnvironment();
    IM3Runtime runtime = m3_NewRuntime(env, 8192, NULL);  // 8KB stack

    // Load module
    IM3Module module;
    m3_ParseModule(env, &module, micro_hnsw_wasm, micro_hnsw_wasm_len);
    m3_LoadModule(runtime, module);

    // Find functions
    m3_FindFunction(&fn_init, runtime, "init");
    m3_FindFunction(&fn_insert, runtime, "insert");
    m3_FindFunction(&fn_search, runtime, "search");
    m3_FindFunction(&fn_snn_tick, runtime, "snn_tick");
    m3_FindFunction(&fn_snn_inject, runtime, "snn_inject");
    m3_FindFunction(&fn_hnsw_to_snn, runtime, "hnsw_to_snn");
    m3_FindFunction(&fn_snn_get_spikes, runtime, "snn_get_spikes");
    m3_FindFunction(&fn_homeostatic_update, runtime, "homeostatic_update");
    m3_FindFunction(&fn_wta_compete, runtime, "wta_compete");
    m3_FindFunction(&fn_encode_vector_to_spikes, runtime, "encode_vector_to_spikes");
    m3_FindFunction(&fn_spike_timing_similarity, runtime, "spike_timing_similarity");

    // Initialize: 16 dimensions, cosine metric, core 0
    m3_CallV(fn_init, 16, 1, 0);
}
```

### 5. micro-hnsw-wasm API Reference

The WASM module exposes these C-compatible functions. All are `#[no_mangle] pub extern "C"`.

**Core Vector Operations:**
| Function | Signature | Purpose |
|----------|-----------|---------|
| `init` | `(dims: u8, metric: u8, core_id: u8)` | Initialize. metric: 0=L2, 1=Cosine, 2=Dot |
| `get_insert_ptr` | `() -> *mut f32` | Get pointer to write vector before insert |
| `insert` | `() -> u8` | Insert vector from buffer. Returns index or 255 |
| `get_query_ptr` | `() -> *mut f32` | Get pointer to write query vector |
| `search` | `(k: u8) -> u8` | Search k nearest. Returns count found |
| `get_result_ptr` | `() -> *const SearchResult` | Read results: {idx: u8, core_id: u8, distance: f32} |
| `count` | `() -> u8` | Number of stored vectors |

**Graph Neural Network:**
| Function | Signature | Purpose |
|----------|-----------|---------|
| `set_node_type` | `(idx: u8, type: u8)` | Assign type 0-15 to node |
| `get_node_type` | `(idx: u8) -> u8` | Get node type |
| `set_edge_weight` | `(node: u8, weight: u8)` | Set edge weight 0-255 |
| `aggregate_neighbors` | `(idx: u8)` | GNN message passing step |
| `update_vector` | `(idx: u8, alpha: f32)` | Update vector with aggregated neighbors |

**Spiking Neural Network:**
| Function | Signature | Purpose |
|----------|-----------|---------|
| `snn_reset` | `()` | Reset all neuron states |
| `snn_inject` | `(idx: u8, current: f32)` | Inject current into neuron |
| `snn_step` | `(dt: f32) -> u8` | Simulate one timestep, returns spike count |
| `snn_propagate` | `(gain: f32)` | Spread spikes to neighbors |
| `snn_stdp` | `()` | Apply learning from spike timing |
| `snn_tick` | `(dt: f32, gain: f32, learn: u8) -> u8` | Combined step+propagate+learn |
| `snn_get_spikes` | `() -> u32` | Get spike bitset (which neurons fired) |
| `snn_get_membrane` | `(idx: u8) -> f32` | Read neuron voltage |
| `hnsw_to_snn` | `(k: u8, gain: f32) -> u8` | Feed search results into SNN |

**Neuromorphic Features:**
| Function | Signature | Purpose |
|----------|-----------|---------|
| `homeostatic_update` | `(dt: f32)` | Self-stabilize network activity |
| `wta_compete` | `() -> u8` | Winner-take-all: returns winning neuron |
| `wta_soft` | `()` | Soft competition (proportional) |
| `encode_vector_to_spikes` | `(idx: u8) -> u32` | Convert vector to spike pattern |
| `spike_timing_similarity` | `(a: u32, b: u32) -> f32` | Compare two spike patterns |
| `spike_search` | `(pattern: u32, k: u8) -> u8` | Search by spike pattern |
| `oscillator_step` | `(dt: f32)` | Advance gamma oscillator |
| `compute_resonance` | `(idx: u8) -> f32` | Phase alignment score |
| `resonance_search` | `(k: u8, weight: f32) -> u8` | Phase-boosted search |
| `dendrite_inject` | `(neuron: u8, branch: u8, current: f32)` | Local dendritic input |
| `dendrite_integrate` | `(neuron: u8) -> f32` | Nonlinear dendritic computation |

---

## How RuVector Maps to LOVELB Features

### Transaction Pattern Memory

Each transaction is encoded as a 16-dimensional vector:

```c
// Encode a transaction as a vector for micro-hnsw
void encode_transaction(Transaction* tx, float vec[16]) {
    vec[0]  = (float)tx->amount / 100.0;          // Amount (normalized)
    vec[1]  = (float)(tx->timestamp % 86400) / 86400.0; // Time of day
    vec[2]  = (float)(tx->timestamp % 604800) / 604800.0; // Day of week
    vec[3]  = hash_name_to_float(tx->from_name);   // Sender identity
    vec[4]  = hash_name_to_float(tx->to_name);     // Receiver identity
    vec[5]  = category_to_float(tx->memo);          // Category (food/care/craft/knowledge)
    vec[6]  = (float)tx->confirmed;                 // Confirmation status
    // vec[7-15] reserved for learned features
}
```

**Node types (0-15) for typed graph queries:**
```
0 = Person
1 = Food transaction
2 = Childcare transaction
3 = Craft/repair transaction
4 = Knowledge transaction
5 = Gift (no reciprocity expected)
6-15 = Reserved for community-defined categories
```

### Local Learning via SNN

The spiking neural network learns which patterns matter to this person:

```c
// When a new transaction occurs:
void on_transaction(Transaction* tx) {
    float vec[16];
    encode_transaction(tx, vec);

    // 1. Insert into vector store
    // (copy vec to insert buffer, then call insert)
    uint8_t idx = wasm_insert(vec);

    // 2. Set node type based on category
    uint8_t type = categorize(tx->memo);
    wasm_set_node_type(idx, type);

    // 3. Inject current into SNN (this transaction is "interesting")
    wasm_snn_inject(idx, 1.0);

    // 4. Run SNN tick with learning enabled
    uint8_t spikes = wasm_snn_tick(1.0, 0.5, 1);  // dt=1ms, gain=0.5, learn=on

    // 5. STDP strengthens connections between
    //    frequently co-occurring transaction types
    //    e.g., "Dorothy buys mole" and "Maria buys childcare"
    //    become linked through spike timing

    // 6. Homeostatic plasticity keeps the network balanced
    wasm_homeostatic_update(1.0);
}
```

### Suggestion Generation (Local Joy Engine)

```c
// Periodically, the device generates suggestions:
void generate_suggestion() {
    // 1. Encode "what do I usually want right now?"
    float query[16];
    encode_current_context(query);  // Time, day, recent activity

    // 2. Search for similar past patterns
    uint8_t found = wasm_search(query, 3);  // Top 3 matches

    // 3. Feed results into SNN for neural competition
    wasm_hnsw_to_snn(3, 1.0);

    // 4. Winner-take-all: which suggestion wins?
    uint8_t winner = wasm_wta_compete();

    // 5. Display suggestion on screen
    if (winner != 255) {
        show_suggestion(winner);
        // "Maria's making mole tonight. Want some?"
    }
}
```

---

## Communication Protocols

### ESP-NOW: Device-to-Device (No WiFi Needed)

```c
// Message types
typedef enum {
    MSG_TRANSFER_REQUEST  = 0x01,  // "I want to send you X $LB"
    MSG_TRANSFER_CONFIRM  = 0x02,  // "I accept"
    MSG_TRANSFER_REJECT   = 0x03,  // "I reject"
    MSG_PING              = 0x04,  // "I'm nearby"
    MSG_PONG              = 0x05,  // "I see you"
    MSG_BALANCE_CHECK     = 0x06,  // "What's your balance?" (debug only)
} MessageType;

// ESP-NOW packet structure
typedef struct {
    uint8_t  type;               // MessageType
    uint8_t  from_mac[6];        // Sender MAC
    char     from_name[32];      // Sender name
    int32_t  amount;             // $LOVELB amount
    char     memo[64];           // What for
    uint32_t tx_id;              // Transaction ID
    uint32_t timestamp;          // RTC time
    uint8_t  checksum;           // Simple integrity check
} LOVELBPacket;
// Total: ~115 bytes (ESP-NOW max is 250 bytes, fits easily)
```

### Transfer Flow (Device to Device)

```
    Device A (Sender)                    Device B (Receiver)
    ─────────────────                    ─────────────────

1.  User taps "Send" on screen
    Enters amount + memo

2.  Shakes device (IMU trigger)
    ──── MSG_TRANSFER_REQUEST ─────►
                                    3.  Screen shows:
                                        "Dorothy wants to send
                                         4 $LB for 'mole'"
                                        [Accept] [Reject]

                                    4.  User taps Accept
    ◄── MSG_TRANSFER_CONFIRM ──────

5.  Balance: 47 → 43              5.  Balance: -23 → -19
    Log transaction locally            Log transaction locally
    Buzzer: happy chirp                Buzzer: happy chirp
    Screen: "Sent! ✓"                  Screen: "Received! ✓"

    Both devices queue tx for sync to Mac Mini
```

### WiFi Sync: Device to Mac Mini

```c
// When device detects known WiFi network:
void sync_to_bank() {
    // 1. Connect to WiFi
    WiFi.begin(SSID, PASSWORD);

    // 2. POST pending transactions
    // HTTP POST http://macmini.local:8080/api/sync
    // Body: JSON array of pending transactions

    // 3. Receive response:
    //    - Confirmed transactions
    //    - Updated balance (if conflicts resolved)
    //    - Joy engine messages for this person
    //    - Community announcements

    // 4. Mark synced transactions
    // 5. Disconnect WiFi (save power)
}

// Sync API (Mac Mini side)
// POST /api/sync
// Request:
{
    "device_id": "OMEGA_001",
    "owner": "Dorothy",
    "mac": "AA:BB:CC:DD:EE:FF",
    "pending_transactions": [
        {
            "id": 42,
            "timestamp": 1737900000,
            "from": "Dorothy",
            "to": "Maria",
            "amount": 4,
            "memo": "mole",
            "confirmed": true
        }
    ],
    "last_sync": 1737800000
}

// Response:
{
    "status": "ok",
    "balance": 43,
    "conflicts": [],
    "joy_messages": [
        "Maria is making mole again Thursday. Want some?"
    ],
    "community_news": [
        "New family joined: The Garcias. They fix bikes!"
    ]
}
```

---

## Display UI Specification

### Screen: 240×280 pixels, 1.69 inches

### Home Screen
```
┌──────────────────────┐
│                      │
│     D O R O T H Y    │
│                      │
│       ┌──────┐       │
│       │  43  │       │
│       │ $LB  │       │
│       └──────┘       │
│                      │
│    ☽ waning gibbous   │
│                      │
│  ┌────┐    ┌────┐    │
│  │Send│    │ Log│    │
│  └────┘    └────┘    │
│                      │
│ ● ● ○  2 nearby      │
└──────────────────────┘

- Balance: Large, centered, readable from 10 feet
- Moon phase: From RTC date calculation
- "2 nearby": ESP-NOW device count
- Dots at bottom: connected devices
- Touch "Send" to initiate transfer
- Touch "Log" to see recent transactions
```

### Send Screen
```
┌──────────────────────┐
│  ◄ Send $LOVELB      │
│                      │
│  To: [scanning...]   │
│   or tap a name:     │
│  ┌────────────────┐  │
│  │ Maria          │  │
│  │ Tom            │  │
│  │ Elena          │  │
│  └────────────────┘  │
│                      │
│  Amount:             │
│  ┌──┐┌──┐┌──┐┌──┐  │
│  │ 1││ 2││ 5││10│  │
│  └──┘└──┘└──┘└──┘  │
│                      │
│  Memo: [tap to type] │
│                      │
│  [Shake to Send]     │
└──────────────────────┘

- Shows nearby devices by name
- Quick amount buttons (1, 2, 5, 10)
- Memo: preset options (food/care/craft/knowledge)
- Shake gesture (IMU) confirms send
```

### Receive Screen (auto-appears on incoming request)
```
┌──────────────────────┐
│                      │
│  Dorothy wants to    │
│  send you            │
│                      │
│       ┌──────┐       │
│       │  4   │       │
│       │ $LB  │       │
│       └──────┘       │
│                      │
│  for: "mole"         │
│                      │
│  ┌────────────────┐  │
│  │    Accept ✓    │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │    Decline ✗   │  │
│  └────────────────┘  │
└──────────────────────┘
```

### Transaction Log Screen
```
┌──────────────────────┐
│  ◄ Recent            │
│                      │
│  → Maria   -4  mole  │
│  ← Tom     +2  bread │
│  → Elena   -1  seeds │
│  ← Marcus  +5  bike  │
│  → Maria   -3  mole  │
│                      │
│  swipe for more      │
│                      │
│  ─────────────────   │
│  This week: -1 $LB   │
│  Unsynced: 2 tx      │
└──────────────────────┘

- Scrollable via touch swipe
- Color: outgoing=warm, incoming=cool
- Shows sync status
```

### Idle Flourishes (When Not in Active Use)

When the device is idle for 30+ seconds, cycle through ambient displays:

```c
typedef enum {
    FLOURISH_MOON,          // Current moon phase
    FLOURISH_BREATHE,       // Expanding/contracting circle
    FLOURISH_TILT_FACE,     // Eyes that follow tilt (IMU)
    FLOURISH_NEARBY,        // Dots for nearby devices
    FLOURISH_GARDEN_GROW,   // Procedural plant growth over hours
    FLOURISH_STEPS,         // Pedometer count (IMU)
    FLOURISH_TIME_COLOR,    // Screen color shifts with time of day
} FlourishMode;

// Cycle every 30 seconds, or tap to skip
// Shake to wake back to home screen
```

**Pedometer** (from IMU):
```c
// QMI8658 accelerometer step counting
// Simple threshold-based step detection
uint32_t step_count = 0;
float last_magnitude = 0;
bool step_rising = false;

void detect_steps() {
    float ax, ay, az;
    read_imu(&ax, &ay, &az);
    float mag = sqrt(ax*ax + ay*ay + az*az);

    if (mag > 1.3 && !step_rising) {  // Threshold cross
        step_rising = true;
    }
    if (mag < 0.8 && step_rising) {
        step_count++;
        step_rising = false;
    }
    last_magnitude = mag;
}
```

**Tilt Face:**
```c
// Two dots (eyes) that follow device orientation
void draw_tilt_face() {
    float ax, ay, az;
    read_imu(&ax, &ay, &az);

    // Map tilt to eye position
    int eye_x_offset = (int)(ax * 15);  // ±15 pixels
    int eye_y_offset = (int)(ay * 15);

    // Left eye
    tft.fillCircle(90 + eye_x_offset, 130 + eye_y_offset, 8, TFT_WHITE);
    // Right eye
    tft.fillCircle(150 + eye_x_offset, 130 + eye_y_offset, 8, TFT_WHITE);
}
```

---

## IMU Gesture Detection

```c
#define SHAKE_THRESHOLD 25000.0
#define SHAKE_COUNT_REQUIRED 3
#define SHAKE_WINDOW_MS 1000

typedef enum {
    GESTURE_NONE,
    GESTURE_SHAKE,       // Vigorous shake: confirm transfer
    GESTURE_TAP,         // Single tap on table: wake
    GESTURE_FLIP,        // Flip upside down: dismiss
    GESTURE_TILT_LEFT,   // Tilt left: previous screen
    GESTURE_TILT_RIGHT,  // Tilt right: next screen
} Gesture;

// Shake detection state machine
int shake_count = 0;
uint32_t shake_window_start = 0;
float prev_magnitude = 0;

Gesture detect_gesture() {
    float ax, ay, az;
    read_imu(&ax, &ay, &az);
    float mag = sqrt(ax*ax + ay*ay + az*az);

    uint32_t now = millis();

    // Shake: rapid high-magnitude changes
    if (abs(mag - prev_magnitude) > SHAKE_THRESHOLD) {
        if (now - shake_window_start > SHAKE_WINDOW_MS) {
            shake_count = 0;
            shake_window_start = now;
        }
        shake_count++;
        if (shake_count >= SHAKE_COUNT_REQUIRED) {
            shake_count = 0;
            prev_magnitude = mag;
            return GESTURE_SHAKE;
        }
    }

    // Flip: z-axis inverted for >500ms
    if (az < -8000) {
        return GESTURE_FLIP;
    }

    // Tilt
    if (ax > 6000) return GESTURE_TILT_RIGHT;
    if (ax < -6000) return GESTURE_TILT_LEFT;

    prev_magnitude = mag;
    return GESTURE_NONE;
}
```

---

## Mac Mini: The Bank

### Components

1. **Sync Server** — HTTP API for device sync (Python Flask or Rust Axum)
2. **Master Ledger** — SQLite database of all transactions and balances
3. **RuVector Full Stack** — Full ruvector for deep pattern analysis
4. **Joy Engine** — Pattern detection + suggestion generation
5. **Local LLM** — Qwen 8B via Ollama for natural language generation

### Database Schema (SQLite)

```sql
CREATE TABLE members (
    id TEXT PRIMARY KEY,           -- device_id
    name TEXT NOT NULL,
    mac_address TEXT,
    balance INTEGER DEFAULT 0,     -- in $LOVELB cents
    joined_at INTEGER,
    last_seen INTEGER,
    honor_status TEXT DEFAULT 'member'  -- member, honored (negative balance)
);

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_id TEXT UNIQUE,             -- device_id + local_tx_id
    timestamp INTEGER NOT NULL,
    from_id TEXT REFERENCES members(id),
    to_id TEXT REFERENCES members(id),
    amount INTEGER NOT NULL,
    memo TEXT,
    category TEXT,                  -- food, care, craft, knowledge, gift
    from_confirmed INTEGER DEFAULT 1,
    to_confirmed INTEGER DEFAULT 0,
    synced_at INTEGER
);

CREATE TABLE joy_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_id TEXT REFERENCES members(id),
    message TEXT,
    created_at INTEGER,
    delivered INTEGER DEFAULT 0
);

CREATE TABLE community_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_type TEXT,             -- demand_spike, surplus, lonely, new_member
    description TEXT,
    detected_at INTEGER,
    acted_on INTEGER DEFAULT 0
);
```

### Joy Engine (Python)

```python
# joy_engine.py — Runs on Mac Mini, analyzes patterns

import sqlite3
from datetime import datetime, timedelta

def detect_patterns(db):
    """Run pattern detection on transaction history."""
    patterns = []

    # 1. Demand spikes (what's popular this week vs last)
    popular = db.execute("""
        SELECT category, memo, COUNT(*) as cnt
        FROM transactions
        WHERE timestamp > ?
        GROUP BY memo
        ORDER BY cnt DESC LIMIT 5
    """, [week_ago()]).fetchall()

    # 2. Lonely members (haven't transacted in 2+ weeks)
    lonely = db.execute("""
        SELECT m.name, m.id, MAX(t.timestamp) as last_tx
        FROM members m
        LEFT JOIN transactions t ON t.from_id = m.id OR t.to_id = m.id
        GROUP BY m.id
        HAVING last_tx < ? OR last_tx IS NULL
    """, [two_weeks_ago()]).fetchall()

    # 3. Surplus detection (same item offered by multiple people)
    # 4. New member integration (who hasn't been welcomed)
    # 5. Reciprocity gaps (always giving, never receiving)

    return patterns

def generate_joy(db, member_id):
    """Generate personalized joy messages using local LLM."""
    patterns = detect_patterns(db)
    member = get_member(db, member_id)
    history = get_recent_history(db, member_id)

    # Use Ollama (Qwen 8B) to generate natural language
    prompt = f"""
    Community member: {member['name']}
    Recent activity: {history}
    Community patterns: {patterns}

    Generate a short, warm, specific suggestion that connects
    this person to something happening in the community.
    Max 2 sentences. Be specific (names, foods, times).
    """

    response = ollama_generate(prompt)
    return response
```

### Sync Server (Python Flask)

```python
# sync_server.py — Runs on Mac Mini port 8080

from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

@app.route('/api/sync', methods=['POST'])
def sync():
    data = request.json
    device_id = data['device_id']
    owner = data['owner']
    pending = data['pending_transactions']

    db = get_db()

    # 1. Ensure member exists
    ensure_member(db, device_id, owner, data.get('mac'))

    # 2. Process pending transactions
    conflicts = []
    for tx in pending:
        try:
            process_transaction(db, tx, device_id)
        except ConflictError as e:
            conflicts.append(str(e))

    # 3. Get current balance
    balance = db.execute(
        "SELECT balance FROM members WHERE id = ?", [device_id]
    ).fetchone()[0]

    # 4. Get joy messages
    joy = db.execute(
        "SELECT message FROM joy_messages WHERE target_id = ? AND delivered = 0",
        [device_id]
    ).fetchall()

    # Mark delivered
    db.execute(
        "UPDATE joy_messages SET delivered = 1 WHERE target_id = ?",
        [device_id]
    )

    # 5. Get community news
    news = get_community_news(db, data.get('last_sync', 0))

    db.commit()

    return jsonify({
        "status": "ok",
        "balance": balance,
        "conflicts": conflicts,
        "joy_messages": [j[0] for j in joy],
        "community_news": news
    })

def process_transaction(db, tx, device_id):
    """Validate and record a transaction."""
    # Check for duplicate
    existing = db.execute(
        "SELECT id FROM transactions WHERE tx_id = ?",
        [f"{device_id}_{tx['id']}"]
    ).fetchone()
    if existing:
        return  # Already processed

    # Record transaction
    db.execute("""
        INSERT INTO transactions (tx_id, timestamp, from_id, to_id, amount, memo, category, synced_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        f"{device_id}_{tx['id']}",
        tx['timestamp'],
        tx['from'],
        tx['to'],
        tx['amount'],
        tx.get('memo', ''),
        categorize(tx.get('memo', '')),
        int(time.time())
    ])

    # Update balances
    db.execute("UPDATE members SET balance = balance - ? WHERE name = ?", [tx['amount'], tx['from']])
    db.execute("UPDATE members SET balance = balance + ? WHERE name = ?", [tx['amount'], tx['to']])

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=8080)
```

---

## Conflict Resolution

```
Scenario: Dorothy's device says she sent 5 $LB to Maria.
          Maria's device says she never received it.

Mac Mini resolution:
1. Check timestamps — did both devices log at similar times?
2. Check proximity — were both devices on ESP-NOW range?
3. If timestamps match + proximity confirmed → credit Maria
4. If timestamps don't match → flag for steward review
5. Steward (human) makes final call
6. Adjusted balances pushed on next sync
```

---

## Firmware State Machine

```
                    ┌─────────┐
                    │  BOOT   │
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │  INIT   │ Initialize display, IMU, RTC,
                    │         │ ESP-NOW, load wallet, init WASM
                    └────┬────┘
                         │
                    ┌────▼────┐
              ┌────►│  HOME   │◄────────────────────────────┐
              │     │ (idle)  │                              │
              │     └─┬──┬──┬─┘                              │
              │       │  │  │                                │
              │  touch│  │  │shake                           │
              │       │  │  │                                │
              │  ┌────▼┐ │ ┌▼──────┐                         │
              │  │SEND │ │ │NEARBY │ (ESP-NOW scan)          │
              │  │FLOW │ │ │SCAN   │                         │
              │  └──┬──┘ │ └───┬───┘                         │
              │     │    │     │                              │
              │     │    │  ┌──▼──────┐                       │
              │     │    │  │INCOMING │ (received transfer)   │
              │     │    │  │REQUEST  │                       │
              │     │    │  └──┬──┬───┘                       │
              │     │    │     │  │                           │
              │     │    │  accept reject                     │
              │     │    │     │  │                           │
              │     │    │  ┌──▼──▼───┐                       │
              │     └────┤  │TRANSFER │ Update balance,       │
              │          │  │COMPLETE │ log tx, buzzer        │
              │          │  └────┬────┘                       │
              │          │       │                            │
              │     ┌────▼────┐  │                            │
              │     │  IDLE   │──┘                            │
              │     │FLOURISH │ Moon, breathe, face,          │
              │     │         │ steps, garden                 │
              │     └────┬────┘                               │
              │          │ (30s timeout or tap)                │
              └──────────┘                                    │
                                                              │
              WiFi detected?──►┌────────┐                     │
                               │  SYNC  │ Push pending tx,    │
                               │  BANK  │ pull updates        │
                               └────┬───┘                     │
                                    └─────────────────────────┘
```

---

## Build Instructions

### Step 1: Development Environment

```bash
# Arduino IDE with ESP32 support
# Install these libraries via Library Manager:
# - TFT_eSPI (display)
# - ArduinoJson (data serialization)
# - ESP-NOW (built into ESP32 Arduino core)

# OR use PlatformIO:
pip install platformio
```

### PlatformIO Configuration

```ini
; platformio.ini
[env:esp32s3]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino
board_build.mcu = esp32s3
board_build.f_cpu = 240000000L
board_upload.flash_size = 16MB
board_build.psram = enabled
monitor_speed = 115200
lib_deps =
    bodmer/TFT_eSPI@^2.5.0
    bblanchon/ArduinoJson@^7.0.0
```

### Step 2: TFT_eSPI Configuration

Create or edit `User_Setup.h` for this specific board:

```cpp
// User_Setup.h for Waveshare ESP32-S3-Touch-LCD-1.69
#define ST7789_DRIVER
#define TFT_WIDTH  240
#define TFT_HEIGHT 280
#define TFT_MOSI   11
#define TFT_SCLK   12
#define TFT_CS     10
#define TFT_DC     13
#define TFT_RST    9
#define TFT_BL     14
#define SPI_FREQUENCY 40000000
```

### Step 3: Build the WASM Binary

```bash
# From the ruvector repo
cd crates/micro-hnsw-wasm

# Build for WASM
cargo build --release --target wasm32-unknown-unknown

# Optimize
wasm-opt -Oz -o micro_hnsw.wasm \
    target/wasm32-unknown-unknown/release/micro_hnsw_wasm.wasm

# Convert to C header for embedding
xxd -i micro_hnsw.wasm > micro_hnsw_wasm.h

# This gives you:
# unsigned char micro_hnsw_wasm[] = { 0x00, 0x61, 0x73, ... };
# unsigned int micro_hnsw_wasm_len = 7234;
```

### Step 4: Include WASM Runtime

```bash
# Clone wasm3 for ESP32
git clone https://github.com/nicholasbishop/wasm3-esp-idf.git

# Or for Arduino, use wasm3-arduino:
# Add via Library Manager: wasm3
```

### Step 5: Firmware Structure

```
lovelb-firmware/
├── platformio.ini
├── src/
│   ├── main.cpp              # Entry point, state machine
│   ├── wallet.h              # Wallet data structures
│   ├── wallet.cpp            # Balance management
│   ├── display.h             # UI rendering
│   ├── display.cpp           # Screen drawing functions
│   ├── espnow_mesh.h         # ESP-NOW communication
│   ├── espnow_mesh.cpp       # Send/receive LOVELB packets
│   ├── imu_gesture.h         # IMU gesture detection
│   ├── imu_gesture.cpp       # Shake, tilt, tap detection
│   ├── sync.h                # WiFi sync to Mac Mini
│   ├── sync.cpp              # HTTP client for bank API
│   ├── ruvector_ai.h         # WASM/micro-hnsw integration
│   ├── ruvector_ai.cpp       # Local AI: patterns, suggestions
│   ├── flourish.h            # Idle screen animations
│   ├── flourish.cpp          # Moon, breathe, face, steps
│   ├── config.h              # WiFi credentials, device config
│   └── micro_hnsw_wasm.h     # Embedded WASM binary
├── data/
│   └── fonts/                # Custom fonts if needed
└── lib/
    └── wasm3/                # WASM runtime
```

### Step 6: Main Entry Point

```cpp
// src/main.cpp
#include <Arduino.h>
#include <TFT_eSPI.h>
#include <esp_now.h>
#include <WiFi.h>
#include <Wire.h>

#include "config.h"
#include "wallet.h"
#include "display.h"
#include "espnow_mesh.h"
#include "imu_gesture.h"
#include "sync.h"
#include "ruvector_ai.h"
#include "flourish.h"

// State machine
typedef enum {
    STATE_BOOT,
    STATE_HOME,
    STATE_SEND,
    STATE_INCOMING,
    STATE_TRANSFER_COMPLETE,
    STATE_LOG,
    STATE_IDLE_FLOURISH,
    STATE_SYNCING,
} AppState;

AppState state = STATE_BOOT;
Wallet wallet;
uint32_t idle_timer = 0;
#define IDLE_TIMEOUT_MS 30000

void setup() {
    Serial.begin(115200);

    // Initialize hardware
    init_display();          // TFT + backlight
    init_imu();              // QMI8658
    init_rtc();              // PCF85063
    init_espnow();           // ESP-NOW mesh
    init_ruvector();         // WASM + micro-hnsw

    // Load wallet from flash (NVS)
    load_wallet(&wallet);

    // Show home screen
    state = STATE_HOME;
    draw_home(&wallet);

    idle_timer = millis();
}

void loop() {
    Gesture gesture = detect_gesture();
    TouchEvent touch = read_touch();
    LOVELBPacket* incoming = check_espnow();

    switch (state) {
        case STATE_HOME:
            if (touch.on_send_button) {
                state = STATE_SEND;
                draw_send_screen(&wallet);
            }
            else if (touch.on_log_button) {
                state = STATE_LOG;
                draw_log_screen(&wallet);
            }
            else if (incoming && incoming->type == MSG_TRANSFER_REQUEST) {
                state = STATE_INCOMING;
                draw_incoming_screen(incoming);
            }
            else if (millis() - idle_timer > IDLE_TIMEOUT_MS) {
                state = STATE_IDLE_FLOURISH;
            }

            // Check if WiFi is available for sync
            if (wifi_available() && wallet.sync_queue.pending_count > 0) {
                state = STATE_SYNCING;
                sync_to_bank(&wallet);
                state = STATE_HOME;
                draw_home(&wallet);
            }
            break;

        case STATE_SEND:
            if (gesture == GESTURE_SHAKE) {
                send_transfer(&wallet);
                state = STATE_TRANSFER_COMPLETE;
                draw_transfer_complete(true);
                buzzer_happy();
                delay(2000);
                state = STATE_HOME;
                draw_home(&wallet);
            }
            else if (gesture == GESTURE_FLIP || touch.on_back) {
                state = STATE_HOME;
                draw_home(&wallet);
            }
            break;

        case STATE_INCOMING:
            if (touch.on_accept) {
                accept_transfer(&wallet, incoming);
                state = STATE_TRANSFER_COMPLETE;
                draw_transfer_complete(true);
                buzzer_happy();
                // Feed transaction to local AI
                on_transaction_ruvector(&wallet, incoming);
                delay(2000);
                state = STATE_HOME;
                draw_home(&wallet);
            }
            else if (touch.on_reject) {
                reject_transfer(incoming);
                state = STATE_HOME;
                draw_home(&wallet);
            }
            break;

        case STATE_IDLE_FLOURISH:
            update_flourish();
            if (gesture != GESTURE_NONE || touch.any) {
                state = STATE_HOME;
                draw_home(&wallet);
                idle_timer = millis();
            }
            if (incoming && incoming->type == MSG_TRANSFER_REQUEST) {
                state = STATE_INCOMING;
                draw_incoming_screen(incoming);
            }
            break;

        case STATE_LOG:
            handle_log_scroll(touch);
            if (touch.on_back || gesture == GESTURE_TILT_LEFT) {
                state = STATE_HOME;
                draw_home(&wallet);
            }
            break;

        default:
            break;
    }

    // Always: update nearby device count
    update_nearby_count();

    // Always: run pedometer
    detect_steps();

    // Reset idle timer on any interaction
    if (gesture != GESTURE_NONE || touch.any) {
        idle_timer = millis();
    }

    delay(20);  // 50Hz loop
}
```

---

## Configuration

```cpp
// src/config.h

// Device identity (set unique per device)
#define DEVICE_ID    "OMEGA_001"
#define OWNER_NAME   "Dorothy"

// Starting balance for new devices
#define STARTING_BALANCE 10

// WiFi (for bank sync)
#define WIFI_SSID     "OmegaSchool"
#define WIFI_PASSWORD "sovereignty"

// Bank server
#define BANK_HOST     "192.168.1.100"  // Mac Mini IP
#define BANK_PORT     8080

// Currency limits
#define HONOR_LIMIT   -100    // Maximum negative balance
#define MAX_TRANSFER  50      // Max single transfer

// Display
#define SCREEN_WIDTH  240
#define SCREEN_HEIGHT 280

// Timing
#define IDLE_TIMEOUT_MS     30000   // 30 seconds to idle flourish
#define SYNC_INTERVAL_MS    300000  // Try sync every 5 minutes
#define NEARBY_SCAN_MS      5000    // Scan for nearby devices every 5s
```

---

## RuVector AI Integration Details

### What the Local AI Learns

Each device maintains a micro-hnsw graph of 32 vectors (the max for micro-hnsw):

```
Node Type Assignments:
  Type 0: "Self" — this person's overall transaction pattern
  Type 1: Food transactions
  Type 2: Care transactions
  Type 3: Craft transactions
  Type 4: Knowledge transactions
  Type 5: People frequently transacted with
  Type 6-15: Available for expansion
```

### SNN Learning Loop

```
On each transaction:
1. Encode transaction → 16D vector
2. Insert into micro-hnsw (vector store)
3. Set node type (food/care/craft/knowledge)
4. Inject current into SNN neuron at that index
5. Run snn_tick with learning ON
   → STDP strengthens connections between co-occurring patterns
   → "Dorothy buys mole on Thursdays" becomes a strong pathway
6. Run homeostatic_update
   → Prevents any single pattern from dominating

On idle (periodic, every few minutes):
1. Encode current context (time, day, recent activity)
2. Search micro-hnsw for similar past contexts
3. Feed results into SNN via hnsw_to_snn
4. Run winner-take-all competition
5. Winner neuron's associated transaction = suggestion
6. Display on screen during flourish mode
```

### Example: How STDP Learns "Maria's Mole on Thursdays"

```
Week 1 Thursday:
  tx: Dorothy → Maria, 4 $LB, "mole"
  → Neuron 3 fires (food transaction)
  → Neuron 7 fires (Thursday pattern)
  → STDP: strengthen connection 3→7 (co-occurring)

Week 2 Thursday:
  tx: Dorothy → Maria, 4 $LB, "mole"
  → Neuron 3 fires again
  → Neuron 7 fires again
  → STDP: strengthen 3→7 more

Week 3, Wednesday evening:
  Context: "Tomorrow is Thursday"
  → Query encodes Thursday + food
  → Search finds similar past contexts
  → hnsw_to_snn injects current
  → Neuron 7 (Thursday) fires → propagates to Neuron 3 (mole)
  → Winner-take-all selects: "mole"
  → Device shows: "Maria usually has mole tomorrow"

The device LEARNED this with no cloud, no rules, no programming.
Just spike timing.
```

---

## Keynote Demo Configuration

For the keynote demo with 4 devices:

```
Device 1: "You" (the speaker)     — 50 $LB
Device 2: "Volunteer A"            — 50 $LB
Device 3: "Volunteer B"            — 50 $LB
Device 4: Connected to laptop via USB serial (aggregator/visualizer)
```

### Demo Script

1. Show Device 1 home screen: "50 $LB"
2. Tap "Send" → select Volunteer A → amount 10 → shake to confirm
3. Both screens update (Device 1: 40, Device 2: 60)
4. Volunteer A sends to Volunteer B (Device 2: 50, Device 3: 60)
5. Volunteer B sends back to you (Device 3: 50, Device 1: 50)
6. Circle completed. No bank needed. No internet needed.

### Laptop Visualization

Device 4 sends all ESP-NOW traffic via USB serial to a web page:

```javascript
// Simple p5.js visualization
// Shows 3 nodes with balances, lines drawn on transfers
// Amounts float between nodes during transfer animation
```

---

## File Checklist

When complete, the following should exist:

### ESP32 Firmware
- [ ] `src/main.cpp` — State machine and setup
- [ ] `src/wallet.h/cpp` — Wallet data structures and persistence
- [ ] `src/display.h/cpp` — All screen rendering
- [ ] `src/espnow_mesh.h/cpp` — ESP-NOW send/receive
- [ ] `src/imu_gesture.h/cpp` — Shake, tilt, tap detection
- [ ] `src/sync.h/cpp` — WiFi HTTP sync to Mac Mini
- [ ] `src/ruvector_ai.h/cpp` — WASM micro-hnsw integration
- [ ] `src/flourish.h/cpp` — Idle animations
- [ ] `src/config.h` — Device configuration
- [ ] `src/micro_hnsw_wasm.h` — Embedded WASM binary
- [ ] `platformio.ini` — Build configuration

### Mac Mini
- [ ] `bank/sync_server.py` — Flask sync API
- [ ] `bank/joy_engine.py` — Pattern detection + LLM suggestions
- [ ] `bank/schema.sql` — Database schema
- [ ] `bank/requirements.txt` — Python dependencies

### Visualization (Optional, for keynote)
- [ ] `viz/index.html` — Web visualization
- [ ] `viz/sketch.js` — p5.js node graph

---

## Philosophy Embedded in Code

**Negative balance is not an error state.** Never show red. Never show warnings. A person at -23 $LB is deeply connected to their community.

**Sync is not urgent.** The device works offline indefinitely. Sync is a nice-to-have, not a requirement.

**Joy over efficiency.** The flourish animations, the moon phase, the tilt face — these are not wasted bytes. They make the device feel alive and worth carrying.

**Simplicity over features.** If in doubt, leave it out. The grandmother must be able to use this.

**The device learns, not the cloud.** Each device's micro-hnsw develops its own personality based on its owner's patterns. Dorothy's device becomes an expert on Dorothy. Not a surveillance tool — a personal companion.

---

*Build the village. Keep it simple. Let the magic emerge.*
