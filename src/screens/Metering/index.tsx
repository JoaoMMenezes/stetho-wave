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

const MAX_DATA_POINTS_CHART = 200;

export default function Metering() {
    const { create } = useMeteringDatabase();
    const { getAll } = usePatientDatabase();
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    const [patients, setPatients] = useState<Patient[]>([]);
    const [micRecording, setMicRecording] = useState<Recording | undefined>(undefined);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);
    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [source, setSource] = useState<'mic' | 'ble'>('mic');
    const [bleDevice, setBleDevice] = useState<Device | null>(null);
    const [currentMeteringData, setCurrentMeteringData] = useState<number[]>([0]);
    const [isRecordingActive, setIsRecordingActive] = useState(false);

    // Efeito para logar mudanças em bleDevice - útil para depuração
    useEffect(() => {
        console.log('[Metering useEffect] bleDevice mudou:', bleDevice ? bleDevice.id : null);
    }, [bleDevice]);

    // Efeito para logar mudanças em isRecordingActive - útil para depuração
    useEffect(() => {
        console.log('[Metering useEffect] isRecordingActive mudou:', isRecordingActive);
    }, [isRecordingActive]);

    useEffect(() => {
        async function loadPatients() {
            const data = await getAll();
            setPatients(data as Patient[]);
        }
        loadPatients();
    }, []);

    const screenDimensions = Dimensions.get('window');

    async function startCapture() {
        console.log('[Metering startCapture] Tentando iniciar. Fonte:', source);
        setCurrentMeteringData([]); // Limpa dados anteriores independentemente da fonte

        if (source === 'mic') {
            try {
                if (permissionResponse?.status !== 'granted') {
                    await requestPermission();
                }
                const currentPermissions = await Audio.getPermissionsAsync();
                if (currentPermissions.status !== 'granted') {
                    console.warn('Permissão de áudio não concedida.');
                    Alert.alert(
                        'Permissão Necessária',
                        'É necessário conceder permissão ao microfone para iniciar a gravação.'
                    );
                    setIsRecordingActive(false); // Garante que não fique ativo
                    return;
                }

                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording: newRecording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY,
                    undefined,
                    100
                );
                setMicRecording(newRecording);
                setIsRecordingActive(true); // Define como ativo APÓS sucesso na configuração do MIC
                console.log('[Metering startCapture] Gravação de MIC iniciada.');

                newRecording.setOnRecordingStatusUpdate((status) => {
                    if (status.isRecording) {
                        const micValue = status.metering ?? 0;
                        setCurrentMeteringData((prevData) => {
                            const newData = [...prevData, micValue];
                            return newData.length > MAX_DATA_POINTS_CHART
                                ? newData.slice(newData.length - MAX_DATA_POINTS_CHART)
                                : newData;
                        });
                    }
                });
            } catch (err) {
                console.error('Falha ao iniciar gravação do microfone:', err);
                Alert.alert('Erro', 'Não foi possível iniciar a gravação do microfone.');
                setIsRecordingActive(false);
            }
        } else {
            // source === 'ble'
            console.log(
                '[Metering startCapture] Verificando bleDevice:',
                bleDevice ? bleDevice.id : 'Nenhum'
            );
            if (!bleDevice) {
                console.warn(
                    'Fonte BLE selecionada, mas nenhum dispositivo conectado. Abra as Configurações para conectar.'
                );
                Alert.alert(
                    'Dispositivo BLE Não Conectado',
                    'Por favor, conecte a um dispositivo BLE nas configurações antes de iniciar a captura.'
                );
                // setIsRecordingActive(false) não é estritamente necessário aqui,
                // pois não o definimos como true ainda para o caso BLE se bleDevice for null.
                // Mas para garantir, podemos deixar.
                setIsRecordingActive(false);
                return;
            }
            // Se bleDevice existe, então podemos considerar a gravação BLE como ativa
            setIsRecordingActive(true);
            console.log(
                '[Metering startCapture] Captura BLE iniciada. Aguardando dados via handleSineValueUpdate. isRecordingActive deve ser true agora.'
            );
        }
    }

    async function stopCapture() {
        console.log(
            '[Metering stopCapture] Parando captura. Fonte:',
            source,
            'isRecordingActive era:',
            isRecordingActive
        );
        setIsRecordingActive(false);

        if (source === 'mic' && micRecording) {
            try {
                await micRecording.stopAndUnloadAsync();
                const uri = micRecording.getURI();
                if (uri) setRecordingUri(uri);
                await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
                setMicRecording(undefined);
                console.log('[Metering stopCapture] Gravação de MIC parada.');
            } catch (err) {
                console.error('Falha ao parar gravação do microfone:', err);
            }
        } else if (source === 'ble') {
            if (currentMeteringData.length > 0) {
                setRecordingUri('ble_data');
            }
            console.log(
                '[Metering stopCapture] Captura BLE parada. Dados coletados:',
                currentMeteringData.length
            );
        }
    }

    function handleSaveData() {
        if (source === 'mic' && !recordingUri) {
            console.warn('Nenhuma gravação de áudio para salvar.');
            Alert.alert('Atenção', 'Não há gravação de áudio para salvar.');
            return;
        }
        if (source === 'ble' && currentMeteringData.length === 0) {
            console.warn('Nenhum dado BLE para salvar.');
            Alert.alert('Atenção', 'Não há dados Bluetooth para salvar.');
            return;
        }
        setSaveModalVisible(true);
    }

    function handleSettings() {
        if (isRecordingActive) {
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
        // Opcional: Se a fonte já for BLE, e o usuário acabou de conectar,
        // poderia dar um feedback ou mudar o estado do botão de play.
        // Alert.alert("Conectado", `Conectado ao ${device.name}. Agora você pode iniciar a captura BLE.`);
    };

    const handleSineValueUpdate = (value: number) => {
        // Este log é crucial para ver o estado no momento da chegada dos dados
        console.log(
            `[Metering handleSineValueUpdate] Valor: ${value}, Fonte: ${source}, Gravando: ${isRecordingActive}`
        );
        if (source === 'ble') {
            setCurrentMeteringData((prevData) => {
                const newData = [...prevData, value];
                if (newData.length > MAX_DATA_POINTS_CHART) {
                    return newData.slice(newData.length - MAX_DATA_POINTS_CHART);
                }
                return newData;
            });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.chartContainer}>
                <SkiaLineChart
                    data={currentMeteringData.map(
                        (value) => (source === 'mic' ? ((value + 160) / 160) * 200 : value) // Ajuste a normalização do MIC conforme necessário
                    )}
                    fullscreenEnabled={true}
                    height={(screenDimensions.height - 50 - 30) * 0.55 - 40}
                    padding={screenDimensions.width * 0.05}
                />
            </View>

            <View style={styles.footer}>
                <Pressable
                    style={styles.modalButton}
                    onPress={handleSaveData}
                    // Habilita salvar se NÃO estiver gravando E tiver dados, OU se gravou algo (recordingUri para mic)
                    disabled={
                        isRecordingActive || (currentMeteringData.length === 0 && !recordingUri)
                    }
                >
                    <MaterialIcons
                        name="save"
                        size={24}
                        color={
                            isRecordingActive || (currentMeteringData.length === 0 && !recordingUri)
                                ? 'grey'
                                : 'white'
                        }
                    />
                </Pressable>

                <Pressable
                    style={styles.recordButton}
                    onPress={isRecordingActive ? stopCapture : startCapture}
                >
                    <FontAwesome6
                        name={isRecordingActive ? 'pause' : 'play'}
                        size={24}
                        color="#4dabf7"
                    />
                </Pressable>

                <Pressable style={styles.modalButton} onPress={handleSettings}>
                    <Feather name="settings" size={24} color="white" />
                </Pressable>
            </View>

            <MeteringModal
                visible={saveModalVisible}
                onClose={() => setSaveModalVisible(false)}
                onSave={async ({ patientId, tag, observations }) => {
                    if (source === 'mic' && !recordingUri) {
                        console.error('URI da gravação de áudio não encontrada para salvar.');
                        setSaveModalVisible(false);
                        return;
                    }
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
                            // Adicionar campos opcionais para diferenciar a origem
                            // source_type: source,
                            // audio_uri: source === 'mic' ? recordingUri : null,
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
                source={source}
                onSourceChange={(newSource) => {
                    console.log(
                        `[Metering SettingsModal] onSourceChange: de ${source} para ${newSource}. isRecordingActive: ${isRecordingActive}`
                    );
                    if (isRecordingActive) {
                        // Se estava gravando, para a captura antes de mudar a fonte
                        stopCapture();
                    }
                    setSource(newSource);
                    setCurrentMeteringData([0]);
                    if (newSource === 'mic') {
                        console.log(
                            '[Metering SettingsModal] Mudando para MIC, definindo bleDevice como null.'
                        );
                        setBleDevice(null); // Limpa dispositivo BLE se mudou para mic
                    }
                }}
                onDeviceConnected={handleDeviceConnected}
                onSineValueUpdate={handleSineValueUpdate}
            />
        </View>
    );
}
