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
