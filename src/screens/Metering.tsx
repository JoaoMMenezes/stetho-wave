import { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    Modal,
    Button,
    Text,
    TouchableOpacity,
} from 'react-native';
import { Audio } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';
import MemoListItem from '../components/MemoListItem';
import AudioChart from '../components/AudioChart';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

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
            <ScrollView style={styles.listContainer}>
                {memos.map((memo, index) => (
                    <MemoListItem
                        key={index}
                        uri={memo.uri}
                        activeMemo={activeMemo}
                        setActiveMemo={setActiveMemo}
                        setCurrentMeteringData={setCurrentMeteringData}
                        meteringData={memo.meteringData}
                        patientName={memo.patientName}
                        date={memo.date}
                        observations={memo.observations}
                    />
                ))}
            </ScrollView>

            <AudioChart data={currentMeteringData} />

            <View style={styles.footer}>
                <Pressable style={styles.iconButton} onPress={() => setCurrentMeteringData([0])}>
                    <MaterialIcons name="delete-sweep" size={24} color="gray" />
                    <Text style={styles.iconText}>Limpar Gráfico</Text>
                </Pressable>

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

                <Pressable style={styles.iconButton} onPress={() => setMemos([])}>
                    <MaterialIcons name="delete" size={24} color="gray" />
                    <Text style={styles.iconText}>Limpar Gravações</Text>
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

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', paddingTop: 30, marginTop: 30 },
    listContainer: { flex: 1, marginBottom: 10 },
    footer: {
        height: 150,
        alignItems: 'center',
        justifyContent: 'space-around',
        flexDirection: 'row',
    },
    iconButton: { alignItems: 'center', justifyContent: 'center' },
    recordButton: {
        width: 60,
        height: 60,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: 'gray',
        alignItems: 'center',
        justifyContent: 'center',
    },
    redCircle: { aspectRatio: 1, backgroundColor: 'orangered', borderRadius: 30 },
    iconText: { fontSize: 12, color: 'gray', marginTop: 4 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        elevation: 5,
    },
    saveButton: { alignSelf: 'center', width: '40%', marginTop: 10 },
    input: {
        height: 40,
        borderColor: 'rgba(0, 0, 0, 0.4)',
        borderWidth: 1,
        borderRadius: 6,
        marginBottom: 12,
        paddingHorizontal: 10,
    },
    closeButton: { alignSelf: 'flex-end', marginBottom: 10 },
});
