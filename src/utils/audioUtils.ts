import * as FileSystem from 'expo-file-system';

const MIC_SENSITIVITY_DBFS = -26.0; //para um sinal de 94 dB SPL.
const REF_DB_SPL = 94.0; // Nível de Pressão Sonora de referência
const FULL_SCALE_16_BIT = 32767.0; // Valor máximo para um inteiro de 16 bits com sinal
const REF_PRESSURE_PA = 20.0e-6; // Pressão de referência do ar em Pascal

/**
 * Converte uma amostra de áudio de 16 bits para pressão em Pascal (Pa).
 * @param {number} sampleInt16 A amostra no formato int16 (-32768 a 32767).
 * @returns {number} A pressão sonora correspondente em Pascal.
 */
export function convertInt16SampleToPascal(sampleInt16: any) {
    if (sampleInt16 === 0) {
        return 0.0;
    }

    // 1. Converter a amostra para dBFS (Decibels relative to Full Scale de 16-bit)
    const dbfs = 20 * Math.log10(Math.abs(sampleInt16) / FULL_SCALE_16_BIT);

    // 2. Converter dBFS para dB SPL (Sound Pressure Level)
    const dbspl = REF_DB_SPL + (dbfs - MIC_SENSITIVITY_DBFS);

    // 3. Converter dB SPL para Pascal
    let pascals = REF_PRESSURE_PA * Math.pow(10, dbspl / 20);

    // 4. Reaplicar o sinal original da amostra
    if (sampleInt16 < 0) {
        pascals = -pascals;
    }

    return pascals;
}

/**
 * Cria um arquivo .wav a partir de dados PCM brutos (Int16)
 * @param pcmData O array de amostras de áudio (números Int16)
 * @returns A URI do arquivo .wav criado
 */
export async function createWavFile(pcmData: number[]): Promise<string> {
    const sampleRate = 20000; // Do seu ESP32
    const numChannels = 1; // Do seu ESP32 (I2S_CHANNEL_FMT_ONLY_LEFT)
    const bitsPerSample = 16; // Do seu ESP32 (int16_t)

    const bytesPerSample = bitsPerSample / 8;
    const dataLength = pcmData.length * bytesPerSample;
    const headerLength = 44;
    const fileSize = headerLength + dataLength;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // --- Cabeçalho RIFF ---
    view.setUint8(0, 'R'.charCodeAt(0));
    view.setUint8(1, 'I'.charCodeAt(0));
    view.setUint8(2, 'F'.charCodeAt(0));
    view.setUint8(3, 'F'.charCodeAt(0));
    view.setUint32(4, fileSize - 8, true); // fileSize - 8 (little-endian)
    view.setUint8(8, 'W'.charCodeAt(0));
    view.setUint8(9, 'A'.charCodeAt(0));
    view.setUint8(10, 'V'.charCodeAt(0));
    view.setUint8(11, 'E'.charCodeAt(0));

    // --- Sub-chunk 'fmt ' ---
    view.setUint8(12, 'f'.charCodeAt(0));
    view.setUint8(13, 'm'.charCodeAt(0));
    view.setUint8(14, 't'.charCodeAt(0));
    view.setUint8(15, ' '.charCodeAt(0));
    view.setUint32(16, 16, true); // Subchunk1Size (16 para PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 para PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // ByteRate
    view.setUint16(32, numChannels * bytesPerSample, true); // BlockAlign
    view.setUint16(34, bitsPerSample, true);

    // --- Sub-chunk 'data' ---
    view.setUint8(36, 'd'.charCodeAt(0));
    view.setUint8(37, 'a'.charCodeAt(0));
    view.setUint8(38, 't'.charCodeAt(0));
    view.setUint8(39, 'a'.charCodeAt(0));
    view.setUint32(40, dataLength, true);

    // Escreve os dados PCM (Int16)
    let offset = headerLength;
    for (let i = 0; i < pcmData.length; i++, offset += bytesPerSample) {
        view.setInt16(offset, pcmData[i], true); // little-endian
    }

    // Converte o ArrayBuffer para Base64 para salvar com expo-file-system
    // (btoa está disponível globalmente no React Native)
    const uint8Array = new Uint8Array(buffer);
    let base64 = '';
    const chunkSize = 0x8000; // 32k
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
        base64 += String.fromCharCode.apply(null, [...uint8Array.subarray(i, i + chunkSize)]);
    }
    const base64String = btoa(base64);

    // 1. Gere um nome de arquivo único
    const fileName = `recording-${Date.now()}.wav`;

    // 2. Use 'documentDirectory' para persistência (em vez de 'cacheDirectory')
    const uri = FileSystem.documentDirectory + fileName;

    console.log('Salvando arquivo WAV em:', uri);

    // Salva o arquivo
    await FileSystem.writeAsStringAsync(uri, base64String, {
        encoding: FileSystem.EncodingType.Base64,
    });

    return uri;
}
