#include <driver/i2s.h>

// Definições dos pinos I2S (ajuste conforme sua placa, se necessário)
#define I2S_WS_PIN  4
#define I2S_SD_PIN  5
#define I2S_SCK_PIN 6

// Taxa de amostragem
#define SAMPLE_RATE 48000 // Ou a taxa suportada pelo seu microfone (e.g., 16000)

// Porta I2S
#define I2S_PORT    I2S_NUM_0

// Tamanho do buffer de leitura (em amostras de 32 bits)
#define BUFFER_LEN  64

void setup_i2s_simplified() {
    Serial.println("Configurando I2S simplificado...");
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT, // Ajuste se seu microfone for 16-bit ou 24-bit
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S, // Formato padrão I2S
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 4,
        .dma_buf_len = BUFFER_LEN,
        //.use_apll = false, // Descomente se houver problemas de clock
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_SCK_PIN,
        .ws_io_num = I2S_WS_PIN,
        .data_out_num = I2S_PIN_NO_CHANGE, // Não usado para RX
        .data_in_num = I2S_SD_PIN
    };

    esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
    if (err != ESP_OK) {
        Serial.printf("Falha ao instalar driver I2S: %d\n", err);
        return;
    }
    Serial.println("Driver I2S instalado.");

    err = i2s_set_pin(I2S_PORT, &pin_config);
    if (err != ESP_OK) {
        Serial.printf("Falha ao configurar pinos I2S: %d\n", err);
        i2s_driver_uninstall(I2S_PORT); // Limpeza
        return;
    }
    Serial.println("Pinos I2S configurados.");
    
    // Opcional: Limpar buffer DMA se encontrar lixo no início
    // i2s_zero_dma_buffer(I2S_PORT);

    Serial.println("Configuracao I2S simplificada OK.");
}

void setup() {
    // 1. AUMENTE A VELOCIDADE DA PORTA SERIAL AQUI
    Serial.begin(921600); 

    // O resto do seu código de setup...
    Serial.println("\nSetup: Iniciando teste I2S em alta velocidade.");
    setup_i2s_simplified();
    Serial.println("Setup: Sistema pronto.");
}
void loop() {
    // Buffer para armazenar os dados lidos do microfone
    int32_t i2s_read_buff[BUFFER_LEN];
    size_t bytes_read = 0;

    // A função i2s_read() já introduz uma pequena espera natural
    // enquanto aguarda o buffer DMA encher. Não precisamos de mais delays.
    esp_err_t result = i2s_read(I2S_PORT, i2s_read_buff, sizeof(i2s_read_buff), &bytes_read, portMAX_DELAY);

    if (result == ESP_OK && bytes_read > 0) {
        // Processa e imprime todas as amostras lidas o mais rápido possível
        int samples_read = bytes_read / sizeof(int32_t);
        for (int i = 0; i < samples_read; i++) {
            // Pega o valor real de 18 bits
            int32_t sample_val = i2s_read_buff[i] >> 14;

            // (Opcional) Aplica o ganho, se necessário
            // int32_t amplified_sample = sample_val * GANHO;
            
            Serial.println(sample_val);
        }
    }
    // 2. NENHUM delay() AQUI. O loop vai repetir imediatamente.
}