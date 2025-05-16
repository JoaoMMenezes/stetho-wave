import { useEffect, useRef, useState } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
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
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Base64 } from 'js-base64';

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const MAX_DATA_POINTS = 500;

export default function Metering() {
    const { create } = useMeteringDatabase();
    const { getAll } = usePatientDatabase();
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    const [patients, setPatients] = useState<Patient[]>([]);
    const [recording, setRecording] = useState<Recording | undefined>(undefined);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);
    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [source, setSource] = useState<'mic' | 'ble'>('mic');

    const [bleDevice, setBleDevice] = useState<Device | null>(null);
    const [characteristicUUID, setCharacteristicUUID] = useState<string | null>(null);
    const bleManager = useRef(new BleManager()).current;
    const bleSubscription = useRef<Subscription | null>(null);

    const [currentMeteringData, setCurrentMeteringData] = useState<number[]>([0]);

    useEffect(() => {
        async function loadPatients() {
            const data = await getAll();
            setPatients(data as Patient[]);
        }
        loadPatients();
    }, []);

    const screenDimensions = Dimensions.get('window');

    async function startRecording() {
        if (source === 'mic') {
            try {
                if (permissionResponse?.status !== 'granted') {
                    await requestPermission();
                }

                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                setRecording(recording);
                setCurrentMeteringData([]);

                recording.setProgressUpdateInterval(1);
                recording.setOnRecordingStatusUpdate((status) => {
                    setCurrentMeteringData((prevData) => [...prevData, status.metering || 0]);
                });
            } catch (err) {
                console.error('Failed to start recording', err);
            }
        } else {
            if (!bleDevice || !characteristicUUID) {
                console.warn('Dispositivo BLE não conectado.');
            }
            setCurrentMeteringData([]); // reinicia os dados, mas não duplica a stream
        }
    }

    async function stopRecording() {
        if (recording) {
            try {
                await recording.stopAndUnloadAsync();
                const uri = recording.getURI();
                if (uri) setRecordingUri(uri);

                await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
                setRecording(undefined);
            } catch (err) {
                console.error('Failed to stop recording', err);
            }
        }

        // Interrompe stream BLE se ativo
        bleSubscription.current?.remove();
        bleSubscription.current = null;
    }

    function handleSaveRecording() {
        if (!recordingUri) return;
        setSaveModalVisible(true);
    }

    function handleSettings() {
        setSettingsModalVisible(true);
    }

    function startBLEStreaming(device: Device, characteristicUUID: string) {
        const subscription = device.monitorCharacteristicForService(
            SERVICE_UUID,
            characteristicUUID,
            (error, characteristic) => {
                if (error) {
                    console.error('Erro ao monitorar característica:', error);
                    return;
                }

                if (characteristic?.value) {
                    try {
                        const buffer = Base64.toUint8Array(characteristic.value);
                        const int16Array = new Int16Array(buffer.buffer);

                        setCurrentMeteringData((prev) => {
                            const newData = [...prev, ...Array.from(int16Array)];
                            return newData.length > MAX_DATA_POINTS
                                ? newData.slice(-MAX_DATA_POINTS)
                                : newData;
                        });
                    } catch (err) {
                        console.error('Erro ao decodificar binário:', err);
                    }
                }
            },
            'metering-stream'
        );

        bleSubscription.current = subscription;
    }

    return (
        <View style={styles.container}>
            <View style={styles.chartContainer}>
                <SkiaLineChart
                    data={currentMeteringData.map((value) => value * -1)}
                    fullscreenEnabled={true}
                    height={(screenDimensions.height - 50 - 30) * 0.55 - 40}
                    padding={screenDimensions.width * 0.05}
                />
            </View>

            <View style={styles.footer}>
                <Pressable style={styles.modalButton} onPress={handleSaveRecording}>
                    <MaterialIcons name="save" size={24} color="white" />
                </Pressable>

                <Pressable
                    style={styles.recordButton}
                    onPress={recording ? stopRecording : startRecording}
                >
                    <FontAwesome6 name={recording ? 'pause' : 'play'} size={24} color="#4dabf7" />
                </Pressable>

                <Pressable style={styles.modalButton} onPress={handleSettings}>
                    <Feather name="settings" size={24} color="white" />
                </Pressable>
            </View>

            <MeteringModal
                visible={saveModalVisible}
                onClose={() => setSaveModalVisible(false)}
                onSave={async ({ patientId, tag, observations }) => {
                    if (!recordingUri) return;

                    try {
                        await create({
                            patient_id: patientId,
                            date: new Date().toISOString(),
                            data: JSON.stringify(currentMeteringData.map((value) => value * -1)),
                            tag: tag ?? 'blue',
                            observations: observations ?? '',
                        });

                        console.log('Gravação salva com sucesso!');
                        setRecordingUri(null);
                        setCurrentMeteringData([0]);
                        setSaveModalVisible(false);
                    } catch (error) {
                        console.error('Erro ao salvar metering:', error);
                    }
                }}
                graphData={currentMeteringData.map((value) => value * -1)}
            />

            <SettingsModal
                visible={settingsModalVisible}
                onClose={() => setSettingsModalVisible(false)}
                source={source}
                onSourceChange={(newSource) => setSource(newSource)}
                onConnect={(device, uuid) => {
                    setBleDevice(device);
                    setCharacteristicUUID(uuid);
                    startBLEStreaming(device, uuid);
                }}
            />
        </View>
    );
}
