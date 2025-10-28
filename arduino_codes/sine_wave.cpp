#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <math.h> // Para a função sin()

// Definições do serviço e característica BLE
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer *pServer; // <--- MOVIDO PARA CÁ (DECLARAÇÃO GLOBAL)
BLECharacteristic *pCharacteristic;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// Parâmetros da onda senoidal simulada
float amplitude = 100.0;
float frequencia = 1.0;
float fase = 0.0;
float tempo = 0.0;
float passoTempo = 0.1;

// Classe para callbacks de conexão/desconexão do servidor BLE
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* serverInstance) { // 'serverInstance' é o pServer passado
      deviceConnected = true;
      Serial.println("Dispositivo conectado");
    }

    void onDisconnect(BLEServer* serverInstance) { // 'serverInstance' é o pServer passado
      deviceConnected = false;
      Serial.println("Dispositivo desconectado");
    }
};

void setup() {
  Serial.begin(115200);
  Serial.println("Iniciando Servidor BLE...");

  BLEDevice::init("ESP32_Senoide_Sim");
  pServer = BLEDevice::createServer(); // <--- AGORA APENAS ATRIBUIÇÃO
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );

  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising(); // Ou pServer->getAdvertising()
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising(); // Ou pServer->getAdvertising()->start()
  Serial.println("Aguardando conexões...");
}

void loop() {
  if (deviceConnected) {
    float valorSenoide = amplitude * sin(2 * PI * frequencia * tempo + fase);
    tempo += passoTempo;

    char buffer[10];
    dtostrf(valorSenoide, 6, 2, buffer);

    pCharacteristic->setValue((uint8_t*)buffer, strlen(buffer));
    pCharacteristic->notify();

    Serial.print("Valor enviado: ");
    Serial.println(buffer);

    delay(100);
  }

  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    // pServer->startAdvertising(); // Esta é a linha que causava o erro
    BLEDevice::startAdvertising(); // Forma mais comum de reiniciar o advertising globalmente
                                   // Ou, se você quiser usar o pServer especificamente:
                                   // BLEAdvertising *pAdvertising = pServer->getAdvertising();
                                   // pAdvertising->start();
    Serial.println("Reiniciando advertising...");
    oldDeviceConnected = deviceConnected;
  }
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
}