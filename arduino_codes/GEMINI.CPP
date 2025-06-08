#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <driver/i2s.h>

//================================================================
// --- SEÇÃO DE CONFIGURAÇÃO (AJUSTE CONFORME NECESSÁRIO) ---
//================================================================

// 1. CONFIGURAÇÕES DE BLUETOOTH LOW ENERGY (BLE)
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// 2. CONFIGURAÇÕES DO MICROFONE I2S
// !!! IMPORTANTE: Verifique e ajuste estes pinos para corresponder à sua placa !!!
#define I2S_WS_PIN    4  // Word Select
#define I2S_SCK_PIN   6  // Serial Clock
#define I2S_SD_PIN    5  // Serial Data

// 3. PARÂMETROS DE ÁUDIO
#define I2S_PORT          I2S_NUM_0
#define I2S_SAMPLE_RATE   16000   // Taxa de amostragem em Hz (16kHz é bom para voz)
#define I2S_SAMPLE_BITS   I2S_BITS_PER_SAMPLE_32BIT // Microfones I2S MEMS geralmente usam 32-bit (com dados de 18-24 bit)
#define I2S_CHANNEL_FMT   I2S_CHANNEL_FMT_ONLY_LEFT // Usar mono (apenas um canal)

// Tamanho do buffer de leitura do I2S. Um buffer maior reduz a carga da CPU mas aumenta a latência.
#define I2S_BUFFER_SAMPLES 256 // Ler 256 amostras por vez

//================================================================
// --- VARIÁVEIS GLOBAIS ---
//================================================================

BLEServer *pServer = nullptr;
BLECharacteristic *pCharacteristic = nullptr;
bool deviceConnected = false;
bool oldDeviceConnected = false;

/**
 * @brief Classe para callbacks de eventos de conexão/desconexão do servidor BLE.
 */
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* serverInstance) {
      deviceConnected = true;
      Serial.println("Dispositivo conectado");
    }

    void onDisconnect(BLEServer* serverInstance) {
      deviceConnected = false;
      Serial.println("Dispositivo desconectado");
    }
};

/**
 * @brief Inicializa o driver do microfone I2S com as configurações definidas.
 */
void setupI2S() {
    Serial.println("Configurando I2S...");
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = I2S_SAMPLE_RATE,
        .bits_per_sample = I2S_SAMPLE_BITS,
        .channel_format = I2S_CHANNEL_FMT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 64,
        .use_apll = false
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_SCK_PIN,
        .ws_io_num = I2S_WS_PIN,
        .data_out_num = I2S_PIN_NO_CHANGE,
        .data_in_num = I2S_SD_PIN
    };

    // Instala o driver e configura os pinos
    esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
    if (err != ESP_OK) {
        Serial.printf("Falha ao instalar driver I2S: %d\n", err);
        while (true);
    }
    err = i2s_set_pin(I2S_PORT, &pin_config);
    if (err != ESP_OK) {
        Serial.printf("Falha ao configurar pinos I2S: %d\n", err);
        while (true);
    }
    Serial.println("Driver I2S configurado com sucesso.");
}


void setup() {
    Serial.begin(115200);
    Serial.println("Iniciando o dispositivo...");

    // --- 1. INICIALIZAÇÃO DO MICROFONE ---
    setupI2S();

    // --- 2. INICIALIZAÇÃO DO SERVIDOR BLE ---
    BLEDevice::init("ESP32_Audio_BLE");
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    BLEService *pService = pServer->createService(SERVICE_UUID);

    pCharacteristic = pService->createCharacteristic(
                          CHARACTERISTIC_UUID,
                          BLECharacteristic::PROPERTY_NOTIFY // Propriedade para enviar dados sem confirmação
                      );
    
    pCharacteristic->addDescriptor(new BLE2902()); // Permite que o cliente se inscreva para notificações

    pService->start();

    // Inicia o "advertising" (anúncio) para que outros dispositivos possam encontrar este ESP32
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    BLEDevice::startAdvertising();
    
    Serial.println("Servidor BLE iniciado. Aguardando conexões...");
}

void loop() {
    // Se um dispositivo estiver conectado, começa a transmitir os dados de áudio
    if (deviceConnected) {
        // Buffer para armazenar os dados brutos lidos do I2S (em 32 bits)
        int32_t raw_samples[I2S_BUFFER_SAMPLES];
        size_t bytes_read = 0;

        // 1. LER UM BLOCO DE DADOS DO MICROFONE
        // A função i2s_read irá aguardar até que o buffer DMA esteja cheio
        esp_err_t result = i2s_read(I2S_PORT, &raw_samples, sizeof(raw_samples), &bytes_read, portMAX_DELAY);

        if (result == ESP_OK && bytes_read > 0) {
            // Buffer para armazenar as amostras processadas em 16 bits (mais eficiente para transmitir)
            int16_t processed_samples[I2S_BUFFER_SAMPLES];
            int samples_read = bytes_read / sizeof(int32_t);

            // 2. PROCESSAR OS DADOS
            // Converte as amostras de 32 bits para 16 bits para economizar banda
            for (int i = 0; i < samples_read; i++) {
                // O valor real da amostra está nos bits mais significativos.
                // O deslocamento (shift) depende do seu microfone (e.g., INMP441 usa 14).
                processed_samples[i] = (int16_t)(raw_samples[i] >> 14);
            }

            // 3. ENVIAR OS DADOS PROCESSADOS VIA BLE
            pCharacteristic->setValue((uint8_t*)processed_samples, samples_read * sizeof(int16_t));
            pCharacteristic->notify(); // Envia a notificação para o cliente conectado

            // (Opcional) Imprime um indicador de que os dados foram enviados
            // Serial.printf("Enviado %d bytes de áudio\n", samples_read * sizeof(int16_t));
        }
    }

    // Gerenciamento de reconexão
    if (!deviceConnected && oldDeviceConnected) {
        delay(500); // Dá um tempo para o stack BLE se estabilizar
        pServer->startAdvertising(); // Reinicia o advertising para permitir novas conexões
        Serial.println("Advertising reiniciado. Aguardando nova conexão...");
        oldDeviceConnected = deviceConnected;
    }
    
    if (deviceConnected && !oldDeviceConnected) {
        oldDeviceConnected = deviceConnected;
    }
}