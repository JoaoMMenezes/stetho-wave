import { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    Modal,
    Button,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './_layout';
import SkiaLineChart from '@/components/SkiaLineChart/SkiaLineChart';

interface RecordingData {
    uri: string;
    meteringData: number[];
    patientName: string;
    date: string;
    observations: string;
}

export default function Metering() {
    const [recording, setRecording] = useState<Recording | undefined>(undefined);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [memos, setMemos] = useState<RecordingData[]>([]);
    const [activeMemo, setActiveMemo] = useState<string | undefined>();
    const [currentMeteringData, setCurrentMeteringData] = useState<number[]>([0]);
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({
        patientName: '',
        date: '',
        observations: '',
    });

    const screenDimensions = Dimensions.get('window');

    useEffect(() => {
        if (modalVisible) {
            const now = new Date();
            const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
            setFormData((prev) => ({ ...prev, date: formattedDate }));
        }
    }, [modalVisible]);

    async function startRecording() {
        try {
            if (permissionResponse?.status !== 'granted') {
                await requestPermission();
            }

            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

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
    }

    async function stopRecording() {
        if (!recording) return;

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            if (uri) setRecordingUri(uri); // Salva a URI no estado

            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
            setModalVisible(true);
            setRecording(undefined);
        } catch (err) {
            console.error('Failed to stop recording', err);
        }
    }

    function handleSave() {
        // Será usado o db para salvar os dados
        if (recordingUri) {
            setMemos((existingMemos) => [
                {
                    uri: recordingUri,
                    meteringData: currentMeteringData,
                    ...formData,
                },
                ...existingMemos,
            ]);
        }
        setModalVisible(false);
        resetForm();
    }

    function handleDiscard() {
        setModalVisible(false);
        resetForm();
    }

    function resetForm() {
        setFormData({ patientName: '', date: '', observations: '' });
        setRecordingUri(null);
    }

    return (
        <View style={styles.container}>
            <View style={styles.ChartContainer}>
                <SkiaLineChart
                    data={currentMeteringData.map((value) => value * -1)}
                    fullscreenEnabled={true}
                    height={screenDimensions.height * 0.4}
                    padding={screenDimensions.width * 0.05}
                />
            </View>

            <View style={styles.footer}>
                <Pressable
                    style={styles.recordButton}
                    onPress={recording ? stopRecording : startRecording}
                >
                    <View
                        style={[
                            styles.redCircle,
                            { width: recording ? '80%' : '100%' },
                            { opacity: recording ? 0.5 : 1 },
                        ]}
                    />
                </Pressable>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleDiscard}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={handleDiscard}>
                            <MaterialIcons name="close" size={24} color="black" />
                        </TouchableOpacity>
                        <TextInput
                            placeholder="Nome do Paciente"
                            value={formData.patientName}
                            onChangeText={(text) => setFormData({ ...formData, patientName: text })}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Data"
                            value={formData.date}
                            editable={false}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Observações"
                            value={formData.observations}
                            onChangeText={(text) =>
                                setFormData({ ...formData, observations: text })
                            }
                            style={styles.input}
                        />
                        <View style={styles.saveButton}>
                            <Button title="Salvar" onPress={handleSave} />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
