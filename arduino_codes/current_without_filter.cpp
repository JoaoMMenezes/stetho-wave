#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <driver/i2s.h>

//================================================================
// --- SEÇÃO DE CONFIGURAÇÃO OTIMIZADA ---
//================================================================

// 1. CONFIGURAÇÕES DE BLUETOOTH LOW ENERGY (BLE)
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// 2. CONFIGURAÇÕES DO MICROFONE I2S
#define I2S_WS_PIN    4  // Word Select
#define I2S_SCK_PIN   6  // Serial Clock
#define I2S_SD_PIN    5  // Serial Data

// 3. PARÂMETROS DE ÁUDIO OTIMIZADOS
#define I2S_PORT          I2S_NUM_0
#define I2S_SAMPLE_RATE   20000     // Aumentar a taxa de amostragem agora é mais viável
#define I2S_SAMPLE_BITS   I2S_BITS_PER_SAMPLE_32BIT
#define I2S_CHANNEL_FMT   I2S_CHANNEL_FMT_ONLY_LEFT

// OTIMIZAÇÃO: Ajusta o buffer de amostras para o tamanho máximo do pacote BLE (MTU)
#define I2S_BUFFER_SAMPLES 250  // 257 amostras * 2 bytes/amostra = 514 bytes

//================================================================
// --- VARIÁVEIS GLOBAIS E CALLBACKS ---
//================================================================

BLEServer *pServer = nullptr;
BLECharacteristic *pCharacteristic = nullptr;
bool deviceConnected = false;

// --- NOVOS CALLBACKS para monitorar status da conexão e MTU ---
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer, esp_ble_gatts_cb_param_t *param) {
      deviceConnected = true;
      Serial.println("Dispositivo conectado");
      // Imprime o MTU negociado na conexão
    }

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Dispositivo desconectado");
    }
    
    // Callback para quando o MTU é atualizado após a conexão
    void onMtuChanged(BLEServer* pServer, esp_ble_gatts_cb_param_t* param) {
      Serial.printf("MTU foi alterado para: %d\n", param->mtu.mtu);
    }
};

//================================================================
// --- OTIMIZAÇÃO 3: TAREFA DEDICADA PARA STREAMING DE ÁUDIO ---
//================================================================
void audioStreamingTask(void *pvParameters) {
    Serial.println("Tarefa de streaming de áudio iniciada.");
    
    // Buffer para amostras brutas
    int32_t raw_samples[I2S_BUFFER_SAMPLES];
    // Buffer para amostras processadas prontas para envio
    int16_t processed_samples[I2S_BUFFER_SAMPLES];
    size_t bytes_read = 0;

    while (true) { // Loop infinito da tarefa
        if (deviceConnected) {
            // 1. LER UM BLOCO DE DADOS DO MICROFONE
            esp_err_t result = i2s_read(I2S_PORT, &raw_samples, sizeof(raw_samples), &bytes_read, portMAX_DELAY);

            if (result == ESP_OK && bytes_read > 0) {
                int samples_read = bytes_read / sizeof(int32_t);

                // 2. PROCESSAR OS DADOS
                for (int i = 0; i < samples_read; i++) {
                    processed_samples[i] = (int16_t)(raw_samples[i] >> 14);
                }

                // 3. ENVIAR OS DADOS PROCESSADOS VIA BLE
                pCharacteristic->setValue((uint8_t*)processed_samples, samples_read * sizeof(int16_t));
                pCharacteristic->notify();
            }
        } else {
            // Se não estiver conectado, aguarda um pouco para não consumir 100% da CPU
            vTaskDelay(pdMS_TO_TICKS(100));
        }
    }
}


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
        .dma_buf_len = 256, // Ajuste para acomodar o novo tamanho de buffer
        .use_apll = false
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_SCK_PIN,
        .ws_io_num = I2S_WS_PIN,
        .data_out_num = I2S_PIN_NO_CHANGE,
        .data_in_num = I2S_SD_PIN
    };

    i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_PORT, &pin_config);
    Serial.println("Driver I2S configurado com sucesso.");
}


void setup() {
    Serial.begin(115200);
    Serial.println("Iniciando o dispositivo...");

    setupI2S();

    BLEDevice::init("ESP32_Audio_Stream");
    // Opcional: Define o MTU que o ESP32 pode suportar. A negociação final é iniciada pelo cliente.
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
    // Intervalos de anúncio rápidos para uma conexão mais ágil
    pAdvertising->setMinPreferred(0x06); // 7.5ms
    pAdvertising->setMaxPreferred(0x0C); // 15ms
    BLEDevice::startAdvertising();
    
    Serial.println("Servidor BLE iniciado. Aguardando conexões...");

    // Inicia a tarefa dedicada para o áudio no Core 1, deixando o Core 0 para WiFi/BLE
    xTaskCreatePinnedToCore(
        audioStreamingTask,    // Função da tarefa
        "AudioStreamTask",     // Nome da tarefa
        10000,                 // Tamanho da pilha
        NULL,                  // Parâmetros da tarefa
        1,                     // Prioridade da tarefa
        NULL,                  // Handle da tarefa
        1                      // Core onde a tarefa irá rodar
    );
}

// O loop principal agora está livre. Ele pode ser usado para outras tarefas de baixa prioridade
// ou simplesmente ficar vazio, já que o trabalho pesado está na tarefa dedicada.
void loop() {
    // A lógica de reconexão foi movida para o callback onDisconnect
    // O loop pode ser usado para tarefas não críticas, como piscar um LED de status.
    delay(2000); 
}