#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <driver/i2s.h>

// =================================================================
// Definições do Bluetooth Low Energy (BLE)
// =================================================================
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer *pServer = nullptr;
BLECharacteristic *pCharacteristic = nullptr;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// =================================================================
// Definições do Microfone I2S
// =================================================================
#define I2S_WS_PIN    4  // Word Select
#define I2S_SD_PIN    5  // Serial Data
#define I2S_SCK_PIN   6  // Serial Clock

#define I2S_PORT      I2S_NUM_0
#define SAMPLE_RATE   48000 
#define BUFFER_LEN    1024 // Aumentado para ter uma média mais estável
#define BITS_PER_SAMPLE I2S_BITS_PER_SAMPLE_32BIT

// =================================================================
// Callbacks do Servidor BLE
// =================================================================
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Dispositivo conectado");
    }

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Dispositivo desconectado");
    }
};

// =================================================================
// Função de Configuração do I2S
// =================================================================
void setup_i2s() {
    Serial.println("Configurando I2S...");
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = BITS_PER_SAMPLE,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = BUFFER_LEN,
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_SCK_PIN,
        .ws_io_num = I2S_WS_PIN,
        .data_out_num = I2S_PIN_NO_CHANGE,
        .data_in_num = I2S_SD_PIN
    };

    esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
    if (err != ESP_OK) {
        Serial.printf("Falha ao instalar driver I2S: %d\n", err);
        return;
    }

    err = i2s_set_pin(I2S_PORT, &pin_config);
    if (err != ESP_OK) {
        Serial.printf("Falha ao configurar pinos I2S: %d\n", err);
        i2s_driver_uninstall(I2S_PORT); // Limpeza
        return;
    }
    Serial.println("Driver I2S configurado com sucesso.");
}


// =================================================================
// SETUP PRINCIPAL
// =================================================================
void setup() {
    Serial.begin(115200);
    Serial.println("Iniciando o sistema...");

    // 1. Configurar o Microfone I2S
    setup_i2s();

    // 2. Configurar o Servidor BLE
    Serial.println("Iniciando Servidor BLE...");
    BLEDevice::init("ESP32_Microphone");
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    BLEService *pService = pServer->createService(SERVICE_UUID);

    pCharacteristic = pService->createCharacteristic(
                          CHARACTERISTIC_UUID,
                          BLECharacteristic::PROPERTY_READ   |
                          BLECharacteristic::PROPERTY_NOTIFY
                        );
    pCharacteristic->addDescriptor(new BLE2902());

    pService->start();

    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    BLEDevice::startAdvertising();

    Serial.println("Sistema pronto. Aguardando conexões...");
}

// =================================================================
// LOOP PRINCIPAL
// =================================================================
void loop() {
    // Se um dispositivo estiver conectado...
    if (deviceConnected) {
        // 1. Ler um bloco de dados do microfone
        int32_t i2s_read_buff[BUFFER_LEN];
        size_t bytes_read = 0;
        esp_err_t result = i2s_read(I2S_PORT, i2s_read_buff, sizeof(i2s_read_buff), &bytes_read, portMAX_DELAY);

        if (result == ESP_OK && bytes_read > 0) {
            int samples_read = bytes_read / sizeof(int32_t);

            // 2. Processar os dados: Calcular o nível médio de volume (média dos valores absolutos)
            int64_t sum_abs = 0; // Usar 64 bits para evitar overflow na soma
            for (int i = 0; i < samples_read; i++) {
                // O valor da amostra está nos bits mais significativos, ajustamos com o shift
                int32_t sample = i2s_read_buff[i] >> 14; 
                sum_abs += abs(sample);
            }
            // Calcula a média e garante que o resultado caiba em 32 bits
            int32_t average_level = (int32_t)(sum_abs / samples_read);

            // 3. Enviar o valor processado via BLE
            // Enviamos os bytes crus do inteiro, que é mais eficiente que converter para string
            pCharacteristic->setValue((uint8_t*)&average_level, sizeof(average_level));
            pCharacteristic->notify();

            Serial.printf("Nível médio enviado: %d\n", average_level);
        }
        
        // Adiciona um pequeno delay para não sobrecarregar o BLE.
        // Controla a taxa de envio de notificações. 20x por segundo é uma boa taxa.
        delay(50); 
    }

    // Gerenciamento da reconexão (reiniciar o advertising)
    if (!deviceConnected && oldDeviceConnected) {
        delay(500); // Dá um tempo para a desconexão se estabilizar
        BLEDevice::startAdvertising();
        Serial.println("Reiniciando advertising...");
        oldDeviceConnected = deviceConnected;
    }
    
    if (deviceConnected && !oldDeviceConnected) {
        oldDeviceConnected = deviceConnected;
    }
}