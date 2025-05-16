#include <SPIFFS.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define LED_PIN 2  // LED onboard no ESP32

BLECharacteristic* audioCharacteristic;
File audioFile;

/**
 * Pisca o LED em loop para sinalizar erro
 */
void blinkError() {
  pinMode(LED_PIN, OUTPUT);
  while (true) {
    digitalWrite(LED_PIN, HIGH);
    delay(250);
    digitalWrite(LED_PIN, LOW);
    delay(250);
  }
}

void setupBLE() {
  BLEDevice::init("ESP32_Audio_SPIFFS");
  BLEServer* pServer = BLEDevice::createServer();
  BLEService* pService = pServer->createService("4fafc201-1fb5-459e-8fcc-c5c9c331914b");

  audioCharacteristic = pService->createCharacteristic(
    "beb5483e-36e1-4688-b7f5-ea07361b26a8",
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  audioCharacteristic->addDescriptor(new BLE2902());

  pService->start();
  BLEDevice::getAdvertising()->start();
  Serial.println("BLE pronto.");
}

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.println("Start");

  // Tenta montar o SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("Erro ao montar SPIFFS");
    blinkError();
  }

  // Tenta abrir o arquivo
  audioFile = SPIFFS.open("/audio_samples.bin", "r");
  if (!audioFile || audioFile.isDirectory()) {
    Serial.println("Erro ao abrir arquivo de áudio");
    blinkError();
  }

  setupBLE();
}

void loop() {
  // Se o arquivo acabou ou não está disponível, espera
  if (!audioFile || !audioFile.available()) {
    delay(1000);
    blinkError();
    return;
  }

  const size_t chunkSize = 20; // 10 amostras (int16_t)
  uint8_t buffer[chunkSize];

  size_t bytesRead = audioFile.read(buffer, chunkSize);
  if (bytesRead > 0) {
    audioCharacteristic->setValue(buffer, bytesRead);
    audioCharacteristic->notify();
    Serial.println("Pacote enviado");
  }

  delay(50);  // Ajuste conforme necessário
}
