# Omega School ESP32 Build Guide

## What We're Building

**A $15 AI device that replaces $400 Chromebooks.**

Students hold a tiny computer running real neuromorphic AI—spiking neural networks that work like biological brains. These devices form mesh networks, learn locally, and never phone home to Google.

This is AI education without screens, without cloud dependency, without attention harvesting.

---

## The Vision

### The Problem
- Chromebooks cost $300-400, owned by Google's ecosystem
- Cloud AI extracts data, requires subscriptions, consumes massive energy
- Screens are attention-harvesting machines designed for engagement, not learning
- Students learn to *use* AI, not *understand* or *build* it

### The Solution
- ESP32 devices cost $15-25, owned by the student
- Neuromorphic AI runs locally, no cloud needed, 1/100th the energy
- Tiny purpose-built screens serve the user, not advertisers
- Students *build* the AI, solder the device, own everything they create

---

## The Hardware

**Device:** Waveshare ESP32-S3-Touch-LCD-1.69

| Component | What It Does |
|-----------|--------------|
| ESP32-S3R8 | 240MHz dual-core processor, 8MB PSRAM |
| 1.69" LCD | 240×280 touchscreen (ST7789V2 driver) |
| QMI8658 IMU | 6-axis accelerometer + gyroscope |
| PCF85063 RTC | Real-time clock |
| WiFi + BLE | Mesh networking via ESP-NOW |
| Battery support | Runs untethered with LiPo |

**Cost:** ~$15-20 per unit

---

## The Software Stack

### Ruvector

Ruvector is the AI infrastructure that makes this possible:

```
ruvector/
├── crates/
│   ├── micro-hnsw-wasm/     ← 7KB neuromorphic AI (THIS IS THE MAGIC)
│   │   └── #![no_std]       ← Runs on bare metal, no OS needed
│   │
│   ├── ruvector-gnn/        ← Graph neural networks
│   ├── sona/                ← Self-optimizing neural architecture
│   └── exo-federation/      ← Mesh networking + consensus
```

### micro-hnsw-wasm: The Core

This 7-12KB WASM module contains:
- **Spiking Neural Network** - LIF neurons that fire like biological neurons
- **STDP Learning** - Learns from spike timing, no backprop needed
- **Vector Search** - HNSW algorithm for similarity matching
- **Winner-Take-All** - Competitive neural selection

It's `#![no_std]` which means it runs without an operating system—directly on the ESP32's metal.

---

## Why Spiking Neural Networks?

### Traditional AI (GPT, etc.)
```
Every neuron computes every cycle
Constant electricity flow
Battery dies in hours
Requires GPU/cloud
```

### Spiking AI (Neuromorphic)
```
Neurons only fire when threshold crossed
Electricity flows only on meaningful events
Battery lasts months/years
Runs on $3 microcontroller
```

**The human brain runs on 20 watts.** GPUs running AI use 300+ watts.

Spiking networks mimic biology: sparse, event-driven, temporally-coded.

---

## The Keynote Demo Plan

### What We're Building (3 weeks)

**4 ESP32 devices that:**
1. Display a "wallet" balance on screen
2. Transfer value via shake gesture (IMU detection)
3. Communicate over ESP-NOW mesh (no WiFi router needed)
4. Aggregate to your Mac Mini for visualization

### The Demo Flow

1. You hold one device, three volunteers each get one
2. Screen shows balance: **50 credits**
3. You shake hands with a volunteer (devices detect gesture)
4. Value transfers—both screens update
5. Volunteers transfer between themselves
6. Mac Mini shows the network of trust forming in real-time

**No bank. No internet. No cloud. Just humans deciding to trust each other.**

---

## Setup Instructions

### Prerequisites (Mac Mini)

```bash
# Check you have these
python3 --version   # Need 3.8+
git --version

# Install Rust if needed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### Option A: Arduino IDE (Fastest Start)

1. Download Arduino IDE 2.x: https://www.arduino.cc/en/software

2. Add ESP32 board support:
   - Preferences → Additional Boards Manager URLs:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
   - Tools → Board → Boards Manager → Search "esp32" → Install "esp32 by Espressif"

3. Configure for your device:
   - Board: "ESP32S3 Dev Module"
   - USB CDC On Boot: "Enabled"
   - USB Mode: "Hardware CDC and JTAG"
   - Flash Size: "16MB"
   - PSRAM: "OPI PSRAM"

4. Select port: `/dev/cu.usbmodem*` (whatever shows up)

### Option B: ESP-IDF (Full Control)

```bash
# Create workspace
mkdir -p ~/esp && cd ~/esp

# Clone ESP-IDF v5.2
git clone -b v5.2 --recursive https://github.com/espressif/esp-idf.git
cd esp-idf

# Install for ESP32-S3
./install.sh esp32s3

# Activate (run in each new terminal)
source ~/esp/esp-idf/export.sh

# Verify
idf.py --version
```

### Get Waveshare Examples

```bash
cd ~/esp
git clone https://github.com/waveshare/ESP32-S3-Touch-LCD-1.69.git
cd ESP32-S3-Touch-LCD-1.69
```

---

## Pin Configuration

| Function | GPIO | Notes |
|----------|------|-------|
| LCD MOSI | 11 | SPI data |
| LCD SCLK | 12 | SPI clock |
| LCD CS | 10 | Chip select |
| LCD DC | 13 | Data/command |
| LCD RST | 9 | Reset |
| LCD BL | 14 | Backlight (set HIGH) |
| Touch SDA | 6 | I2C data (shared) |
| Touch SCL | 7 | I2C clock (shared) |
| Touch INT | 5 | Interrupt |
| Touch RST | 8 | Reset |
| IMU SDA | 6 | I2C data (shared with touch) |
| IMU SCL | 7 | I2C clock (shared with touch) |
| Buzzer | 4 | PWM audio |
| Button | 0 | User button |

---

## Test 1: Hello OMEGA (Verify Display Works)

Create new Arduino sketch:

```cpp
#include <SPI.h>
#include <TFT_eSPI.h>

TFT_eSPI tft = TFT_eSPI();

void setup() {
  Serial.begin(115200);

  // Initialize display
  tft.init();
  tft.setRotation(0);
  tft.fillScreen(TFT_BLACK);

  // Show text
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(3);
  tft.setCursor(50, 100);
  tft.println("OMEGA");

  tft.setTextSize(1);
  tft.setCursor(30, 150);
  tft.println("School of Sovereignty");

  Serial.println("Display initialized!");
}

void loop() {
  // Nothing yet
}
```

**TFT_eSPI Setup:** You may need to configure `User_Setup.h` for this specific board. Check the Waveshare examples for their configuration.

---

## Test 2: IMU Shake Detection

```cpp
#include <Wire.h>

// QMI8658 I2C address
#define QMI8658_ADDR 0x6B

void setup() {
  Serial.begin(115200);
  Wire.begin(6, 7); // SDA=6, SCL=7

  // Initialize QMI8658 (simplified)
  Wire.beginTransmission(QMI8658_ADDR);
  Wire.write(0x02); // CTRL2 register
  Wire.write(0x60); // Enable accelerometer
  Wire.endTransmission();

  Serial.println("IMU ready - shake the device!");
}

void loop() {
  // Read accelerometer
  Wire.beginTransmission(QMI8658_ADDR);
  Wire.write(0x35); // ACC_X_L register
  Wire.endTransmission(false);
  Wire.requestFrom(QMI8658_ADDR, 6);

  int16_t ax = Wire.read() | (Wire.read() << 8);
  int16_t ay = Wire.read() | (Wire.read() << 8);
  int16_t az = Wire.read() | (Wire.read() << 8);

  // Calculate magnitude
  float magnitude = sqrt(ax*ax + ay*ay + az*az);

  // Detect shake (threshold ~20000)
  if (magnitude > 25000) {
    Serial.println("SHAKE DETECTED!");
  }

  delay(50);
}
```

---

## Test 3: ESP-NOW Between 2 Devices

### Device A: Sender

```cpp
#include <esp_now.h>
#include <WiFi.h>

// Broadcast address
uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

typedef struct {
  int value;
  char action[10];
} Message;

Message msg;

void onSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Sent!" : "Failed");
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    return;
  }

  esp_now_register_send_cb(onSent);

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  esp_now_add_peer(&peerInfo);

  Serial.println("Sender ready");
}

void loop() {
  msg.value = 10;
  strcpy(msg.action, "TRANSFER");

  esp_now_send(broadcastAddress, (uint8_t *)&msg, sizeof(msg));
  Serial.println("Sent transfer message");

  delay(2000);
}
```

### Device B: Receiver

```cpp
#include <esp_now.h>
#include <WiFi.h>

typedef struct {
  int value;
  char action[10];
} Message;

void onReceive(const uint8_t *mac, const uint8_t *data, int len) {
  Message *msg = (Message *)data;
  Serial.printf("Received: %d credits, action: %s\n", msg->value, msg->action);
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    return;
  }

  esp_now_register_recv_cb(onReceive);
  Serial.println("Receiver ready - waiting for messages...");
}

void loop() {
  // Just wait for messages
}
```

---

## Building the Wallet Demo

Once the above tests work, we combine them:

1. **Display:** Show balance on screen
2. **IMU:** Detect shake gesture
3. **ESP-NOW:** Send/receive transfer messages
4. **Logic:** Update balance on successful transfer

### Wallet State Machine

```
IDLE → (shake detected) → SENDING
SENDING → (peer responds) → TRANSFER_COMPLETE
TRANSFER_COMPLETE → update display → IDLE

IDLE → (message received) → RECEIVING
RECEIVING → (confirm) → TRANSFER_COMPLETE
```

---

## Connecting to Mac Mini

The Mac Mini acts as the "central bank" / aggregator:

```
ESP32 #1 ──┐
ESP32 #2 ──┼── WiFi/Serial ──→ Mac Mini ──→ Visualization
ESP32 #3 ──┤                      │
ESP32 #4 ──┘                      └── Qwen 8B (local LLM)
```

Options:
1. **Serial:** One ESP32 connected via USB, relays mesh data
2. **WiFi:** Mac runs a simple server, ESP32s connect when in range
3. **BLE:** Mac receives BLE advertisements from devices

For the keynote, serial is most reliable.

---

## Three-Week Timeline

| Week | Goals |
|------|-------|
| **1** | Get display working. Get IMU shake detection working. Get ESP-NOW working between 2 devices. |
| **2** | Build wallet UI. Implement shake-to-transfer. Add Mac Mini aggregation. |
| **3** | Polish. Test with volunteers. Practice demo. Have backup video ready. |

---

## Troubleshooting

### Device not detected on Mac
```bash
ls /dev/cu.*
```
- If nothing: try different USB-C cable (must be data cable)
- Hold BOOT, press RST, release RST, release BOOT (enters download mode)
- Try different USB port

### Upload fails
- Board: "ESP32S3 Dev Module"
- USB CDC On Boot: "Enabled"
- USB Mode: "Hardware CDC and JTAG"

### Display doesn't work
- Check TFT_eSPI User_Setup.h pin configuration
- Make sure backlight pin (GPIO14) is set HIGH:
  ```cpp
  pinMode(14, OUTPUT);
  digitalWrite(14, HIGH);
  ```

### ESP-NOW not receiving
- Both devices must be on same WiFi channel
- Check MAC addresses if using unicast instead of broadcast
- Make sure WiFi.mode(WIFI_STA) is called

---

## Resources

- **Ruvector repo:** https://github.com/ruvnet/ruvector
- **Waveshare wiki:** https://www.waveshare.com/wiki/ESP32-S3-Touch-LCD-1.69
- **ESP-NOW docs:** https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/network/esp_now.html
- **TFT_eSPI library:** https://github.com/Bodmer/TFT_eSPI

---

## The Bigger Picture

This isn't just a keynote demo. This is proof that:

1. **AI doesn't require the cloud**
2. **Education doesn't require Chromebooks**
3. **Economy doesn't require banks**
4. **Technology can be owned, not rented**

When you hold that device and transfer value to another person with a handshake, you're demonstrating a different future.

One where students build infrastructure instead of consuming apps.
One where communities own their tools.
One where intelligence serves humans instead of harvesting them.

**That's Omega School. That's what we're building.**

---

*Now go flash that device and make it say "OMEGA".*
