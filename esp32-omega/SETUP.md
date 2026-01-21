# ESP32-S3-Touch-LCD-1.69 Setup Guide

## Quick Start (Mac Mini)

### 1. Check Device Connection

```bash
# Plug in ESP32 via USB-C, then:
ls /dev/cu.*

# Expected: /dev/cu.usbmodem* or /dev/cu.usbserial*
```

**If not detected:**
- Press RST button on device
- Hold BOOT + press RST, then release both (enters download mode)
- Try different USB-C cable (must be data cable, not charge-only)
- Try different USB port

### 2. Install ESP-IDF (Recommended)

```bash
# Create workspace
mkdir -p ~/esp
cd ~/esp

# Clone ESP-IDF
git clone -b v5.2 --recursive https://github.com/espressif/esp-idf.git

# Install tools
cd esp-idf
./install.sh esp32s3

# Activate (run this in each new terminal)
source ~/esp/esp-idf/export.sh
```

### 3. Alternative: Arduino IDE (Faster Start)

1. Download Arduino IDE 2.x from https://www.arduino.cc/en/software
2. Open Preferences → Additional Boards Manager URLs, add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Tools → Board → Boards Manager → Search "esp32" → Install
4. Select Board: "ESP32S3 Dev Module"
5. Select Port: Your /dev/cu.usbmodem* device

### 4. Waveshare Examples

```bash
# Clone Waveshare examples
git clone https://github.com/waveshare/ESP32-S3-Touch-LCD-1.69.git
cd ESP32-S3-Touch-LCD-1.69
```

### 5. Pin Configuration for This Board

| Function | Pin |
|----------|-----|
| LCD_MOSI | GPIO11 |
| LCD_SCLK | GPIO12 |
| LCD_CS | GPIO10 |
| LCD_DC | GPIO13 |
| LCD_RST | GPIO9 |
| LCD_BL | GPIO14 |
| Touch_SDA | GPIO6 |
| Touch_SCL | GPIO7 |
| Touch_INT | GPIO5 |
| Touch_RST | GPIO8 |
| IMU_SDA | GPIO6 |
| IMU_SCL | GPIO7 |
| Buzzer | GPIO4 |
| PWM Button | GPIO0 |

### 6. Simple Display Test (Arduino)

```cpp
#include <TFT_eSPI.h>

TFT_eSPI tft = TFT_eSPI();

void setup() {
  tft.init();
  tft.setRotation(0);
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(2);
  tft.setCursor(40, 120);
  tft.println("OMEGA");
}

void loop() {
  // Nothing yet
}
```

### 7. ESP-NOW Mesh (Between 2 Devices)

Device A (Sender):
```cpp
#include <esp_now.h>
#include <WiFi.h>

uint8_t peerAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF}; // Broadcast

void setup() {
  WiFi.mode(WIFI_STA);
  esp_now_init();

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, peerAddress, 6);
  esp_now_add_peer(&peerInfo);
}

void loop() {
  char msg[] = "PING";
  esp_now_send(peerAddress, (uint8_t *)msg, sizeof(msg));
  delay(1000);
}
```

Device B (Receiver):
```cpp
#include <esp_now.h>
#include <WiFi.h>

void onReceive(const uint8_t *mac, const uint8_t *data, int len) {
  Serial.printf("Got: %s\n", (char*)data);
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  esp_now_init();
  esp_now_register_recv_cb(onReceive);
}

void loop() {}
```

## Troubleshooting

### Device not detected
- ESP32-S3 uses native USB - no driver needed on modern macOS
- Make sure USB-C cable supports data (not charge-only)
- Try: Hold BOOT, press RST, release RST, release BOOT

### Upload fails
- Select correct board: "ESP32S3 Dev Module"
- Set USB Mode: "USB-OTG (TinyUSB)"
- Set USB CDC On Boot: "Enabled"

### Screen doesn't work
- Check TFT_eSPI User_Setup.h matches pin configuration above
- Backlight pin (GPIO14) needs to be set HIGH
