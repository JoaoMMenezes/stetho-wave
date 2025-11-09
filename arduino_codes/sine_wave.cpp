#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <math.h>

//================================================================
// --- CONFIGURAÇÕES DE BLE (mesmas do firmware original) ---
//================================================================
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

//================================================================
// --- PARÂMETROS DE ÁUDIO / GERAÇÃO DE SINAL ---
//================================================================
#define I2S_SAMPLE_RATE     20000   // 20 kHz
#define I2S_BUFFER_SAMPLES  250     // Mesmo tamanho de buffer usado no firmware original
#define TEST_TONE_FREQ      60.0f  // Frequência do tom senoidal (A4)
#define AMPLITUDE           10000   // Amplitude do sinal (máx 32767 para int16_t)

//================================================================
// --- VARIÁVEIS GLOBAIS ---
//================================================================
BLEServer *pServer = nullptr;
BLECharacteristic *pCharacteristic = nullptr;
bool deviceConnected = false;

//================================================================
// --- CALLBACKS DE CONEXÃO BLE ---
//================================================================
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer, esp_ble_gatts_cb_param_t *param) override {
      deviceConnected = true;
      Serial.println("Dispositivo conectado.");
    }

    void onDisconnect(BLEServer* pServer) override {
      deviceConnected = false;
      Serial.println("Dispositivo desconectado.");
    }

    void onMtuChanged(BLEServer* pServer, esp_ble_gatts_cb_param_t* param) override {
      Serial.printf("MTU alterado para: %d\n", param->mtu.mtu);
    }
};

//================================================================
// --- TAREFA DE STREAMING DE SINAL SENOIDAL ---
//================================================================
void audioStreamingTask(void *pvParameters) {
    Serial.println("Tarefa de streaming de áudio iniciada.");

    int16_t samples[I2S_BUFFER_SAMPLES];
    static float phase = 0.0f;
    const float phase_increment = 2.0f * M_PI * TEST_TONE_FREQ / I2S_SAMPLE_RATE;

    while (true) {
        if (deviceConnected) {
            // Gerar um bloco de amostras senoidais
            for (int i = 0; i < I2S_BUFFER_SAMPLES; i++) {
                samples[i] = (int16_t)(AMPLITUDE * sinf(phase));
                phase += phase_increment;
                if (phase >= 2.0f * M_PI) phase -= 2.0f * M_PI;
            }

            // Enviar via BLE
            pCharacteristic->setValue((uint8_t*)samples, I2S_BUFFER_SAMPLES * sizeof(int16_t));
            pCharacteristic->notify();

            // Manter a taxa de envio (20 000 amostras/seg = 1 s/20 000 = 50 µs por amostra)
            // Enviamos 250 amostras → 250 * 50 µs = 12.5 ms entre pacotes
            vTaskDelay(pdMS_TO_TICKS(12));
        } else {
            vTaskDelay(pdMS_TO_TICKS(100));
        }
    }
}

//================================================================
// --- CONFIGURAÇÃO PRINCIPAL ---
//================================================================
void setup() {
    Serial.begin(115200);
    Serial.println("Iniciando dispositivo BLE de teste...");

    BLEDevice::init("ESP32_Audio_Stream");  // mesmo nome usado pelo app
    BLEDevice::setMTU(517);

    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    BLEService *pService = pServer->createService(SERVICE_UUID);

    pCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_NOTIFY
    );

    pCharacteristic->addDescriptor(new BLE2902());
    pService->start();

    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMaxPreferred(0x0C);
    BLEDevice::startAdvertising();

    Serial.println("Servidor BLE iniciado. Aguardando conexões...");

    // Inicia a tarefa que gera e envia o tom senoidal
    xTaskCreatePinnedToCore(
        audioStreamingTask,
        "AudioStreamTask",
        10000,
        NULL,
        1,
        NULL,
        1
    );
}

void loop() {
    delay(2000);
}
