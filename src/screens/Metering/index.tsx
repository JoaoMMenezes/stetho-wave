import { useEffect, useRef, useState } from 'react';
import { View, Pressable, Dimensions, Alert } from 'react-native';
import { Audio } from 'expo-av';
import React from 'react';
import { styles } from './_layout';
import SkiaLineChart from '@/components/SkiaLineChart/SkiaLineChart';
import { MaterialIcons, Feather, FontAwesome6 } from '@expo/vector-icons';
import MeteringModal from '@/components/MeteringModal/MeteringModal';
import { Patient, usePatientDatabase } from '@/database/usePatientDatabase';
import { useMeteringDatabase } from '@/database/useMeteringDatabase';
import type { Metering } from '@/database/useMeteringDatabase';
import * as FileSystem from 'expo-file-system';
import SettingsModal from '@/components/SettingsModal/SettingsModal';
import { Device } from 'react-native-ble-plx';
import { convertInt16SampleToPascal, createWavFile } from '@/utils/audioUtils';

// Defina a janela de tempo que você quer exibir. 1 segundos é um bom começo.
const SAMPLE_RATE = 20000; // Taxa de amostragem, conforme definido no ESP32
const WINDOW_DURATION_SECONDS = 1; // Queremos exibir os últimos 1 segundos de dados
const MAX_SAMPLES_IN_WINDOW = SAMPLE_RATE * WINDOW_DURATION_SECONDS;

export default function Metering() {
    const { create } = useMeteringDatabase();
    const { getAll } = usePatientDatabase();

    const [patients, setPatients] = useState<Patient[]>([]);
    const [recordingUri, setRecordingUri] = useState<string | undefined>(undefined);
    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [bleDevice, setBleDevice] = useState<Device | null>(null);
    const [currentMeteringData, setCurrentMeteringData] = useState<number[]>([0]);
    const [isRecording, setIsRecording] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [meteringToSave, setMeteringToSave] = useState<Partial<Metering> | undefined>(undefined);

    const isRecordingRef = useRef(isRecording);
    const fullRecordingDataRef = useRef<number[]>([]);

    useEffect(() => {
        async function loadPatients() {
            const data = await getAll();
            setPatients(data as Patient[]);
        }
        loadPatients();
    }, []);

    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    useEffect(() => {
        return () => {
            sound?.unloadAsync();
        };
    }, [sound]);

    const screenDimensions = Dimensions.get('window');

    async function startCapture() {
        setCurrentMeteringData([]);
        fullRecordingDataRef.current = [];

        if (sound) {
            await sound.unloadAsync();
            setSound(null);
        }

        if (!bleDevice) {
            Alert.alert(
                'Dispositivo BLE Não Conectado',
                'Por favor, conecte a um dispositivo BLE nas configurações antes de iniciar a captura.'
            );
            setIsRecording(false);
            return;
        }

        setIsRecording(true);
        console.log('[startCapture] Is recording:', isRecording);
    }

    function showFinalRecordingData(rawData: number[]) {
        if (!rawData || rawData.length === 0) {
            return [0];
        }

        try {
            const pascalData = rawData.map(convertInt16SampleToPascal);
            setCurrentMeteringData(pascalData);
        } catch (e) {
            console.error('Erro ao converter dados para Pascal:', e);
            return currentMeteringData || [0];
        }
    }

    async function stopCapture() {
        console.log('[Metering stopCapture] Parando captura. ', 'isRecording era:', isRecording);
        setIsRecording(false);

        // Verifica se gravamos algum dado
        if (fullRecordingDataRef.current.length > 0) {
            try {
                console.log('Criando arquivo .wav...');
                // 1. Cria o arquivo .wav com os dados completos
                const fileUri = await createWavFile(fullRecordingDataRef.current);
                showFinalRecordingData(fullRecordingDataRef.current);

                // 2. Salva a URI real (substitui 'ble_data')
                setRecordingUri(fileUri);
                console.log('Arquivo WAV criado em:', fileUri);

                // 3. Carrega o som para reprodução
                await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); // Necessário para playback
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: fileUri },
                    { shouldPlay: false } // Não toca imediatamente
                );
                setSound(newSound); // Salva o objeto de som no estado
            } catch (error) {
                console.error('Erro ao criar ou carregar arquivo WAV:', error);
                Alert.alert('Erro', 'Falha ao processar o áudio gravado.');
            }
        } else {
            console.log('Nenhum dado de áudio para processar.');
            setRecordingUri(undefined); // Garante que a URI antiga seja limpa
        }

        console.log(
            '[Metering stopCapture] Captura BLE parada. Amostras totais:',
            fullRecordingDataRef.current.length
        );
    }

    function handleSaveData() {
        if (fullRecordingDataRef.current.length === 0) {
            console.warn('Nenhum dado BLE para salvar.');
            Alert.alert('Atenção', 'Não há dados Bluetooth para salvar.');
            return;
        }

        // 1. Constrói o objeto Parcial de Medição
        const partialMetering: Partial<Metering> = {
            data: fullRecordingDataRef.current,
            audio_uri: recordingUri,
            date: new Date().toISOString(),
            tag: 'blue', // default
            observations: '',
        };

        // 2. Salva no state para passar ao Modal
        setMeteringToSave(partialMetering);
        setSaveModalVisible(true);
    }

    function handleSettings() {
        if (isRecording) {
            Alert.alert('Atenção', 'Pare a captura atual antes de abrir as configurações.', [
                { text: 'OK' },
            ]);
            return;
        }
        setSettingsModalVisible(true);
    }

    const handleDeviceConnected = (device: Device) => {
        console.log('[Metering handleDeviceConnected] Dispositivo BLE conectado:', device.name);
        setBleDevice(device);
        Alert.alert(
            'Conectado',
            `Conectado ao ${device.name}. Agora você pode iniciar a captura BLE.`
        );
    };

    /**
     * Lida com a chegada de um novo "bloco" de amostras de áudio.
     * @param {number[]} newSamples O array de novas amostras recebidas do BLE.
     */
    const handleDataStream = (newSamples: number[]) => {
        if (!isRecordingRef.current) return;
        setCurrentMeteringData((prevData) => {
            const combinedData = [...prevData, ...newSamples];

            // Retorna sempre os últimos N elementos, criando a "janela deslizante"
            return combinedData.slice(-MAX_SAMPLES_IN_WINDOW);
        });
    };

    /**
     * Lida com a chegada de um novo "bloco" de amostras de áUDIO BRUTO (Int16).
     * Usado para construir o arquivo .wav para playback.
     * @param {number[]} newRawSamples O array de novas amostras Int16.
     */
    const handleRawAudioStream = (newRawSamples: number[]) => {
        if (!isRecordingRef.current) return;

        // Acumula os dados brutos para a gravação completa
        fullRecordingDataRef.current.push(...newRawSamples);
    };

    return (
        <View style={styles.container}>
            <View style={styles.chartContainer}>
                <SkiaLineChart
                    data={currentMeteringData}
                    fullscreenEnabled={true}
                    height={(screenDimensions.height - 50 - 30) * 0.55 - 40}
                    scrollable={currentMeteringData.length > 0 && !isRecording}
                />
            </View>

            <View style={styles.footer}>
                <Pressable
                    style={styles.modalButton}
                    onPress={handleSaveData}
                    // Habilita salvar se NÃO estiver gravando E tiver dados, OU se gravou algo (recordingUri para mic)
                    disabled={isRecording || fullRecordingDataRef.current.length === 0}
                >
                    <MaterialIcons
                        name="save"
                        size={24}
                        color={
                            isRecording || (currentMeteringData.length === 0 && !recordingUri)
                                ? 'grey'
                                : 'white'
                        }
                    />
                </Pressable>

                {sound && !isRecording && (
                    <Pressable
                        style={styles.modalButton}
                        onPress={async () => {
                            console.log('Reproduzindo som...');
                            await sound.replayAsync(); // Toca do início
                        }}
                    >
                        <MaterialIcons name="play-arrow" size={24} color="white" />
                    </Pressable>
                )}

                <Pressable
                    style={styles.recordButton}
                    onPress={isRecording ? stopCapture : startCapture}
                >
                    <FontAwesome6 name={isRecording ? 'pause' : 'play'} size={24} color="#4dabf7" />
                </Pressable>

                <Pressable style={styles.modalButton} onPress={handleSettings}>
                    <Feather name="settings" size={24} color="white" />
                </Pressable>
            </View>

            <MeteringModal
                visible={saveModalVisible}
                isEditing={true}
                onClose={() => {
                    setSaveModalVisible(false);
                    setMeteringToSave(undefined); // Limpa o objeto ao fechar
                }}
                meteringData={meteringToSave}
                soundObject={sound}
                onSave={async ({ patientId, tag, observations }) => {
                    // Usamos o 'meteringToSave' que está no state
                    if (!meteringToSave || !meteringToSave.data) {
                        console.error('Nenhum dado de medição para salvar.');
                        Alert.alert('Erro', 'Dados da medição não encontrados.');
                        setSaveModalVisible(false);
                        return;
                    }

                    try {
                        await create({
                            patient_id: patientId,
                            date: meteringToSave.date!,
                            data: meteringToSave.data!,
                            audio_uri: meteringToSave.audio_uri,
                            tag: tag,
                            observations: observations,
                        });

                        console.log('Medição salva com sucesso!');

                        // Limpeza
                        setRecordingUri(undefined);
                        setCurrentMeteringData([0]);
                        setSaveModalVisible(false);
                        setMeteringToSave(undefined);
                        fullRecordingDataRef.current = [];
                        if (sound) {
                            await sound.unloadAsync();
                            setSound(null);
                        }
                    } catch (error) {
                        console.error('Erro ao salvar medição:', error);
                        Alert.alert('Erro', 'Falha ao salvar a medição.');
                    }
                }}
            />

            <SettingsModal
                visible={settingsModalVisible}
                onClose={() => setSettingsModalVisible(false)}
                onDeviceConnected={handleDeviceConnected}
                handleDataStream={handleDataStream}
                handleRawAudioStream={handleRawAudioStream}
            />
        </View>
    );
}
