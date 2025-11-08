import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Dimensions,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './_layout';
import SkiaLineChart from '../SkiaLineChart/SkiaLineChart';
import DropDownPicker from 'react-native-dropdown-picker';
import { usePatientDatabase, Patient } from '@/database/usePatientDatabase';
import { Metering } from '@/database/useMeteringDatabase';
import { defaultTheme } from '@/themes/default';
import { Audio } from 'expo-av';
import { convertInt16SampleToPascal } from '@/utils/audioUtils';

const SAMPLE_RATE = 20000; // Hz

interface MeteringModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: {
        patientId: number;
        observations: string;
        tag: 'red' | 'green' | 'blue';
    }) => void;
    meteringData?: Partial<Metering>;
    soundObject?: Audio.Sound | null;
    patientId?: number;
    isEditing?: boolean;
}

export default function MeteringModal({
    visible,
    onClose,
    onSave,
    meteringData,
    soundObject,
    patientId,
    isEditing = true,
}: MeteringModalProps) {
    const { getAll } = usePatientDatabase();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [observations, setObservations] = useState('');
    const [openPatientDropdown, setOpenPatientDropdown] = useState(false);
    const [patientItems, setPatientItems] = useState<{ label: string; value: number }[]>([]);

    const [selectedTag, setSelectedTag] = useState<'red' | 'green' | 'blue'>('blue');
    const [isEditingInternal, setIsEditingInternal] = useState(isEditing);

    const [internalSound, setInternalSound] = useState<Audio.Sound | null>(null);

    const screenDimensions = Dimensions.get('window');

    const tags = ['red', 'green', 'blue'];

    const [playbackSampleIndex, setPlaybackSampleIndex] = useState<number | null>(null);
    const lastUpdateRefModal = useRef<number>(0);
    const PLAYBACK_UPDATE_MS_MODAL = 20;

    useEffect(() => {
        if (!internalSound) {
            setPlaybackSampleIndex(null);
            return;
        }
        const onStatus = (status: any) => {
            if (!status || !status.isLoaded) return;
            const now = Date.now();
            if (now - lastUpdateRefModal.current < PLAYBACK_UPDATE_MS_MODAL) return;
            lastUpdateRefModal.current = now;
            const seconds = status.positionMillis / 1000.0;
            const sampleIndex = Math.round(seconds * SAMPLE_RATE);
            setPlaybackSampleIndex(sampleIndex);
        };
        internalSound.setOnPlaybackStatusUpdate(onStatus);
        return () => internalSound.setOnPlaybackStatusUpdate(null);
    }, [internalSound]);

    useEffect(() => {
        async function fetchPatients() {
            const data = (await getAll()) as Patient[];
            setPatients(data);
            setPatientItems(data.map((p) => ({ label: p.name, value: p.id })));
        }

        if (visible) {
            fetchPatients();

            // Popula os campos com base no meteringData unificado
            if (meteringData) {
                // Tenta pegar o ID do paciente do objeto, senão da prop 'patientId'
                setSelectedPatientId(meteringData.patient_id ?? patientId ?? null);
                setObservations(meteringData.observations || '');
                setSelectedTag(meteringData.tag || 'blue');
                setIsEditingInternal(isEditing);
            } else {
                // Fallback (se nenhum dado for passado)
                setSelectedPatientId(patientId ?? null);
                setObservations('');
                setSelectedTag('blue');
                setIsEditingInternal(true);
            }
        }
    }, [visible, meteringData, isEditing, patientId]);

    // Efeito para carregar e descarregar o áudio
    useEffect(() => {
        const loadSound = async () => {
            if (!visible || !meteringData) return;

            // Caso 1: Vindo da tela Metering (som já carregado na prop 'soundObject')
            if (soundObject) {
                setInternalSound(soundObject);
            }
            // Caso 2: Vindo da Home (precisa carregar da URI)
            else if (meteringData.audio_uri) {
                try {
                    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
                    const { sound: newSound } = await Audio.Sound.createAsync({
                        uri: meteringData.audio_uri,
                    });
                    await newSound.setProgressUpdateIntervalAsync(20);
                    setInternalSound(newSound);
                } catch (error) {
                    console.error('Erro ao carregar áudio no modal:', error);
                    Alert.alert('Erro', 'Não foi possível carregar o áudio.');
                }
            }
        };

        loadSound();

        // Função de limpeza
        return () => {
            if (internalSound) {
                // Só descarrega o som se ele foi carregado pela URI (vindo da Home)
                // Se veio da prop 'soundObject' (tela Metering), a tela Metering gerencia ele
                if (!soundObject && internalSound.unloadAsync) {
                    internalSound.unloadAsync();
                }
                setInternalSound(null);
            }
        };
    }, [visible, soundObject, meteringData]);

    const handleSave = () => {
        if (!selectedPatientId) {
            alert('Selecione um paciente antes de salvar.');
            return;
        }

        onSave({
            patientId: selectedPatientId,
            observations,
            tag: selectedTag,
        });

        setIsEditingInternal(false);
    };

    // Ela decide qual gráfico mostrar
    const chartDataToShow = useMemo(() => {
        // Pega os dados brutos (int16) do objeto unificado
        const rawData = meteringData?.data;

        if (!rawData || rawData.length === 0) {
            return [0];
        }

        try {
            const pascalData = rawData.map(convertInt16SampleToPascal);
            return pascalData;
        } catch (e) {
            console.error('Erro ao converter dados para Pascal:', e);
            return [0];
        }
    }, [meteringData]);

    function getTagIcon(tag: string) {
        switch (tag) {
            case 'red':
                return <MaterialIcons name="error" size={24} color="white" />;
            case 'green':
                return <MaterialIcons name="check-circle" size={24} color="white" />;
            default:
                return <MaterialIcons name="help" size={24} color="white" />;
        }
    }

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalContainer}
            >
                <SafeAreaView style={styles.modalContent}>
                    {/* Botão X */}
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 10, right: 20, zIndex: 10 }}
                        onPress={onClose}
                    >
                        <MaterialIcons name="close" size={28} color="#000" />
                    </TouchableOpacity>

                    <Text style={styles.sectionTitle}>Paciente</Text>
                    <DropDownPicker
                        open={openPatientDropdown}
                        value={selectedPatientId}
                        items={patientItems}
                        setOpen={setOpenPatientDropdown}
                        setValue={setSelectedPatientId}
                        setItems={setPatientItems}
                        placeholder="Selecione um paciente"
                        style={[styles.dropDownPicker, !isEditingInternal && styles.disabledInput]}
                        zIndex={3}
                        maxHeight={160}
                        disabled={!isEditingInternal}
                        dropDownContainerStyle={{
                            borderColor: defaultTheme.colors.primary,
                            borderWidth: 2,
                            zIndex: 3,
                        }}
                    />

                    {/* Observações */}
                    <View style={styles.observationHeader}>
                        <Text style={styles.sectionTitle}>Observações</Text>
                    </View>

                    <TextInput
                        style={[styles.textArea, !isEditingInternal && styles.disabledInput]}
                        value={observations}
                        onChangeText={setObservations}
                        placeholder="Digite suas observações"
                        multiline
                        editable={isEditingInternal}
                    />

                    {chartDataToShow && chartDataToShow.length > 0 && (
                        <>
                            <View style={styles.graphHeader}>
                                <Text style={styles.sectionTitle}>Gráfico da Ausculta</Text>
                                <View
                                    style={[
                                        styles.tagButtonGroup,
                                        !isEditingInternal && styles.disabledInput,
                                    ]}
                                >
                                    {tags.map((value) => (
                                        <Pressable
                                            key={value}
                                            onPress={() =>
                                                isEditingInternal &&
                                                setSelectedTag(value as typeof selectedTag)
                                            }
                                            style={[
                                                styles.tagButton,
                                                {
                                                    backgroundColor: value,
                                                    opacity: selectedTag === value ? 1 : 0.4,
                                                },
                                            ]}
                                        >
                                            {getTagIcon(value)}
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.chartContainer}>
                                <SkiaLineChart
                                    data={chartDataToShow}
                                    fullscreenEnabled={true}
                                    height={screenDimensions.height * 0.4}
                                    scrollable={true}
                                    playbackSampleIndex={playbackSampleIndex ?? undefined}
                                    followPlayback={true}
                                />
                            </View>

                            {/* Container com botão + linha de progresso */}
                            <View style={styles.audioControlsContainer}>
                                {/* Botão de play */}
                                {internalSound && (
                                    <Pressable
                                        style={styles.playButton}
                                        onPress={async () => {
                                            await internalSound.replayAsync();
                                        }}
                                    >
                                        <MaterialIcons name="play-arrow" size={28} color="white" />
                                    </Pressable>
                                )}

                                {/* Linha de progresso */}
                                {chartDataToShow.length > 0 && playbackSampleIndex !== null && (
                                    <View style={styles.progressBarContainer}>
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                {
                                                    width: `${
                                                        (playbackSampleIndex /
                                                            chartDataToShow.length) *
                                                        100
                                                    }%`,
                                                },
                                            ]}
                                        />
                                    </View>
                                )}
                            </View>
                        </>
                    )}

                    <View style={styles.buttonRow}>
                        {isEditingInternal ? (
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.buttonText}>
                                    {meteringData?.id ? 'Atualizar' : 'Salvar'}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={() => setIsEditingInternal(true)}
                            >
                                <Text style={styles.buttonText}>Editar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}
