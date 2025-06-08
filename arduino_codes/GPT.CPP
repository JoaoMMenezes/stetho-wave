#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <driver/i2s.h>

// ======== CONFIGURAÇÕES BLE ========
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define BLE_BUFFER_SIZE     32  // número de amostras por pacote BLE

BLEServer*        pServer   = nullptr;
BLECharacteristic* pCharacteristic = nullptr;
bool deviceConnected = false, oldDeviceConnected = false;

// Callbacks para acompanhar conexão BLE
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* server)   { deviceConnected = true;  Serial.println("BLE: conectado"); }
  void onDisconnect(BLEServer* server){ deviceConnected = false; Serial.println("BLE: desconectado"); }
};

// ======== CONFIGURAÇÕES I2S (MICROFONE) ========
#define I2S_WS_PIN   4
#define I2S_SD_PIN   5
#define I2S_SCK_PIN  6
#define SAMPLE_RATE  16000            // ajuste conforme seu mic
#define I2S_PORT     I2S_NUM_0
#define BUFFER_LEN   64               // amostras de 32-bit lidas por chamada

void setup_i2s() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len   = BUFFER_LEN
  };
  i2s_pin_config_t pin_config = {
    .bck_io_num   = I2S_SCK_PIN,
    .ws_io_num    = I2S_WS_PIN,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num  = I2S_SD_PIN
  };
  esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  if (err != ESP_OK) {
    Serial.printf("I2S install failed: %d\n", err);
    return;
  }
  err = i2s_set_pin(I2S_PORT, &pin_config);
  if (err != ESP_OK) {
    Serial.printf("I2S pin config failed: %d\n", err);
    i2s_driver_uninstall(I2S_PORT);
    return;
  }
  Serial.println("I2S ok");
}

void setup() {
  Serial.begin(921600);
  delay(100);
  Serial.println("\n=== Iniciando Microfone+BLE ===");

  // 1) Inicializa I2S
  setup_i2s();

  // 2) Inicializa BLE
  BLEDevice::init("ESP32_Mic_Stream");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                     CHARACTERISTIC_UUID,
                     BLECharacteristic::PROPERTY_NOTIFY
                   );
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();
  BLEAdvertising* adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->setScanResponse(true);
  adv->setMinPreferred(0x06);
  adv->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("BLE advertising iniciado");
}

void loop() {
  // Reinicia advertising se desconectou
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    BLEDevice::startAdvertising();
    oldDeviceConnected = deviceConnected;
  }
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }

  // Se não estiver conectado, só aguarde
  if (!deviceConnected) {
    delay(100);
    return;
  }

  // Buffer de leitura I2S
  int32_t  i2s_buf[BUFFER_LEN];
  size_t   bytes_read = 0;
  esp_err_t r = i2s_read(I2S_PORT, i2s_buf, sizeof(i2s_buf), &bytes_read, portMAX_DELAY);
  if (r != ESP_OK || bytes_read == 0) return;

  int samples = bytes_read / sizeof(int32_t);
  static int16_t ble_buf[BLE_BUFFER_SIZE];
  int idx = 0;

  // Para cada amostra, converte de 32→18 bits, armazena no buffer BLE
  for (int i = 0; i < samples; i++) {
    int32_t s = i2s_buf[i] >> 14;        // de 32→18 bits
    ble_buf[idx++] = constrain(s, -32768, 32767);
    // Se o buffer BLE encheu, envia e reseta
    if (idx >= BLE_BUFFER_SIZE) {
      pCharacteristic->setValue((uint8_t*)ble_buf, sizeof(ble_buf));
      pCharacteristic->notify();
      idx = 0;
      // opcional: breve delay para não inundar o link
      // delay(1);
    }
  }
  // Se sobrou amostras não-enviadas, envia também
  if (idx > 0) {
    pCharacteristic->setValue((uint8_t*)ble_buf, idx * sizeof(int16_t));
    pCharacteristic->notify();
  }
}
