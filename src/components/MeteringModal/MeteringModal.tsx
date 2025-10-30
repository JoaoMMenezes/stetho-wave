import React, { useEffect, useMemo, useState } from 'react';
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

interface MeteringModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: {
        patientId: number;
        observations: string;
        tag: 'red' | 'green' | 'blue';
    }) => void;

    // --- Nossas Props Unificadas ---

    // Para novas gravações (da tela Metering)
    graphData?: number[];
    sound?: Audio.Sound | null;

    // Para gravações existentes (da tela Home)
    initialData?: Metering;
    patientId?: number; // Para o caso de vir de PatientProfileModal
    isEditing?: boolean;
}

export default function MeteringModal({
    visible,
    onClose,
    onSave,
    graphData,
    sound, // Prop da tela Metering
    initialData,
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

    useEffect(() => {
        async function fetchPatients() {
            const data = (await getAll()) as Patient[];
            setPatients(data);
            setPatientItems(data.map((p) => ({ label: p.name, value: p.id })));
        }

        if (visible) {
            fetchPatients();

            if (initialData) {
                // Modo "Visualização/Edição" (Vindo da Home)
                setSelectedPatientId(initialData.patient_id);
                setObservations(initialData.observations || '');
                setSelectedTag(initialData.tag);
                setIsEditingInternal(isEditing); // 'isEditing' será 'false' da Home
            } else {
                // Modo "Nova Gravação" (Vindo da Metering)
                setSelectedPatientId(patientId ?? null);
                setObservations('');
                setSelectedTag('blue');
                setIsEditingInternal(true); // Sempre editável ao criar
            }
        }
    }, [visible, initialData, isEditing, patientId]);

    // Efeito para carregar e descarregar o áudio
    useEffect(() => {
        const loadSound = async () => {
            if (!visible) return;

            if (sound) {
                // 1. Se recebemos um som pré-carregado (da tela Metering), usamos ele
                setInternalSound(sound);

                // ### ESTA É A CORREÇÃO ###
            } else if (initialData?.audio_uri) {
                // 2. Se recebemos initialData (da Home), carregamos o som da URI
                try {
                    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
                    const { sound: newSound } = await Audio.Sound.createAsync({
                        uri: initialData.audio_uri, // Usar initialData.audio_uri
                    });
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
                // Só descarrega o som se ele foi carregado INTERNAMENTE (via URI)
                if (!sound && internalSound.unloadAsync) {
                    console.log('Descarregando áudio interno do modal');
                    internalSound.unloadAsync();
                }
                setInternalSound(null);
            }
        };
        // ### ATUALIZE AS DEPENDÊNCIAS ###
    }, [visible, sound, initialData]);

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
        if (initialData?.data) {
            // Caso 1: Vindo da Home, parseia o JSON
            try {
                return JSON.parse(initialData.data);
            } catch (e) {
                return [0];
            }
        }
        if (graphData) {
            // Caso 2: Vindo da Metering, usa a prop direta
            return graphData;
        }
        return [0]; // Default
    }, [initialData, graphData]);

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
                                {/* ... (Seu seletor de Tags - Ótimo) ... */}
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
                                />
                            </View>

                            {/* BOTÃO DE PLAY (Sua lógica está ótima) */}
                            {internalSound && (
                                <Pressable
                                    style={styles.audioProgress}
                                    onPress={async () => {
                                        console.log('Reproduzindo som do modal...');
                                        await internalSound.replayAsync();
                                    }}
                                >
                                    <MaterialIcons name="play-arrow" size={24} color="white" />
                                </Pressable>
                            )}
                        </>
                    )}

                    <View style={styles.buttonRow}>
                        {isEditingInternal ? (
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.buttonText}>
                                    {initialData ? 'Atualizar' : 'Salvar'}
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
