import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { Buffer } from 'buffer';

export function convertToInt16Array(data: number[]): Int16Array {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
        let sample = data[i];

        // Se estiver normalizado (-1 a 1), converta para int16
        if (sample >= -1 && sample <= 1) {
            sample = sample * 32767;
        }

        // Faz clamp e arredonda para inteiro
        int16[i] = Math.max(-32768, Math.min(32767, Math.round(sample)));
    }
    return int16;
}

export function createWavBuffer(samples: Int16Array, sampleRate = 44100) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = samples.length * 2;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    let offset = 0;

    function writeString(str: string) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset++, str.charCodeAt(i));
        }
    }

    function writeUint32(val: number) {
        view.setUint32(offset, val, true);
        offset += 4;
    }

    function writeUint16(val: number) {
        view.setUint16(offset, val, true);
        offset += 2;
    }

    writeString('RIFF');
    writeUint32(36 + dataSize);
    writeString('WAVE');
    writeString('fmt ');
    writeUint32(16);
    writeUint16(1);
    writeUint16(numChannels);
    writeUint32(sampleRate);
    writeUint32(byteRate);
    writeUint16(blockAlign);
    writeUint16(bitsPerSample);
    writeString('data');
    writeUint32(dataSize);

    for (let i = 0; i < samples.length; i++) {
        view.setInt16(offset, samples[i], true);
        offset += 2;
    }

    return new Uint8Array(buffer);
}

export async function playWavFromSamples(samples: Int16Array, sampleRate = 44100) {
    const wavBuffer = createWavBuffer(samples, sampleRate);
    const base64 = Buffer.from(wavBuffer).toString('base64');

    const fileName = `temp_audio_${Date.now()}.wav`;
    const path = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64,
    });

    const { sound } = await Audio.Sound.createAsync({ uri: path });
    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
            FileSystem.deleteAsync(path).catch(() => {});
        }
    });

    return sound;
}

export function convertFictitiousDataToInt16(data: number[]): Int16Array {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
        const sample = data[i];
        const normalized = (sample - 80) / 80; // Agora varia de -1 a 1
        const intSample = Math.max(-1, Math.min(1, normalized)) * 10000; // Você pode trocar 10000 por 32767 se quiser volume máximo
        int16[i] = Math.round(intSample);
    }
    return int16;
}
