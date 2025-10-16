import { useEffect, useRef, useState } from 'react';
import { View, Pressable, Dimensions, Text, Platform, Alert } from 'react-native'; // Adicionado Alert
import { Audio } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';
import React from 'react';
import { styles } from './_layout';
import SkiaLineChart from '@/components/SkiaLineChart/SkiaLineChart';
import { MaterialIcons, Feather, FontAwesome6 } from '@expo/vector-icons';
import MeteringModal from '@/components/MeteringModal/MeteringModal';
import { Patient, usePatientDatabase } from '@/database/usePatientDatabase';
import { useMeteringDatabase } from '@/database/useMeteringDatabase';
import SettingsModal from '@/components/SettingsModal/SettingsModal';
import { Device } from 'react-native-ble-plx';

interface RecordingData {
    uri: string;
    meteringData: number[];
    patientName: string;
    date: string;
    observations: string;
}

const MAX_DATA_POINTS_CHART = 20000;
// Defina a janela de tempo que você quer exibir. 2 segundos é um bom começo.
const SAMPLE_RATE = 20000; // Taxa de amostragem, conforme definido no ESP32
const WINDOW_DURATION_SECONDS = 1; // Queremos exibir os últimos 2 segundos de dados
const MAX_SAMPLES_IN_WINDOW = SAMPLE_RATE * WINDOW_DURATION_SECONDS; // = 64.000 amostras

export default function Metering() {
    const { create } = useMeteringDatabase();
    const { getAll } = usePatientDatabase();

    const [patients, setPatients] = useState<Patient[]>([]);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);
    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [bleDevice, setBleDevice] = useState<Device | null>(null);
    const [currentMeteringData, setCurrentMeteringData] = useState<number[]>([0]);
    const [isRecording, setIsRecording] = useState(false);
    const isRecordingRef = useRef(isRecording);

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

    const screenDimensions = Dimensions.get('window');

    async function startCapture() {
        setCurrentMeteringData([]);

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

    async function stopCapture() {
        console.log('[Metering stopCapture] Parando captura. ', 'isRecording era:', isRecording);
        setIsRecording(false);

        if (currentMeteringData.length > 0) {
            setRecordingUri('ble_data');
        }
        console.log(
            '[Metering stopCapture] Captura BLE parada. Dados coletados:',
            currentMeteringData.length
        );
    }

    function handleSaveData() {
        if (currentMeteringData.length === 0) {
            console.warn('Nenhum dado BLE para salvar.');
            Alert.alert('Atenção', 'Não há dados Bluetooth para salvar.');
            return;
        }
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

    return (
        <View style={styles.container}>
            <View style={styles.chartContainer}>
                <SkiaLineChart
                    data={currentMeteringData}
                    fullscreenEnabled={true}
                    height={(screenDimensions.height - 50 - 30) * 0.55 - 40}
                    // padding={screenDimensions.width * 0.05}
                />
            </View>

            <View style={styles.footer}>
                <Pressable
                    style={styles.modalButton}
                    onPress={handleSaveData}
                    // Habilita salvar se NÃO estiver gravando E tiver dados, OU se gravou algo (recordingUri para mic)
                    disabled={isRecording || (currentMeteringData.length === 0 && !recordingUri)}
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
                onClose={() => setSaveModalVisible(false)}
                onSave={async ({ patientId, tag, observations }) => {
                    if (currentMeteringData.length === 0) {
                        console.error('Nenhum dado de medição para salvar.');
                        setSaveModalVisible(false);
                        return;
                    }
                    try {
                        await create({
                            patient_id: patientId,
                            date: new Date().toISOString(),
                            data: JSON.stringify(currentMeteringData),
                            tag: tag ?? 'blue',
                            observations: observations ?? '',
                        });
                        console.log('Medição salva com sucesso!');
                        setRecordingUri(null);
                        setCurrentMeteringData([0]);
                        setSaveModalVisible(false);
                    } catch (error) {
                        console.error('Erro ao salvar medição:', error);
                        Alert.alert('Erro', 'Falha ao salvar a medição.');
                    }
                }}
                graphData={currentMeteringData}
            />

            <SettingsModal
                visible={settingsModalVisible}
                onClose={() => setSettingsModalVisible(false)}
                onDeviceConnected={handleDeviceConnected}
                handleDataStream={handleDataStream}
            />
        </View>
    );
}
