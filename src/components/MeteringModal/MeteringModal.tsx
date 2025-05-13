import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './_layout';
import SkiaLineChart from '../SkiaLineChart/SkiaLineChart';
import DropDownPicker from 'react-native-dropdown-picker';
import { usePatientDatabase, Patient } from '@/database/usePatientDatabase';
import { Metering } from '@/database/useMeteringDatabase';
import { defaultTheme } from '@/themes/default';

interface MeteringModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: {
        patientId: number;
        observations: string;
        tag: 'red' | 'yellow' | 'green' | 'blue';
    }) => void;
    graphData?: number[];
    initialData?: Metering;
    patientId?: number;
    isEditing?: boolean;
}

export default function MeteringModal({
    visible,
    onClose,
    onSave,
    graphData,
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

    const [selectedTag, setSelectedTag] = useState<'red' | 'yellow' | 'green' | 'blue'>('blue');
    const [isEditingInternal, setIsEditingInternal] = useState(isEditing);

    const screenDimensions = Dimensions.get('window');

    const tagItems = [
        { label: 'Vermelho', value: 'red' },
        { label: 'Amarelo', value: 'yellow' },
        { label: 'Verde', value: 'green' },
        { label: 'Azul', value: 'blue' },
    ];

    useEffect(() => {
        async function fetchPatients() {
            const data = (await getAll()) as Patient[];
            setPatients(data);
            setPatientItems(data.map((p) => ({ label: p.name, value: p.id })));
        }

        if (visible) {
            fetchPatients();

            if (initialData) {
                setSelectedPatientId(initialData.patient_id);
                setObservations(initialData.observations || '');
                setSelectedTag(initialData.tag);
                setIsEditingInternal(isEditing);
            } else {
                setSelectedPatientId(patientId ?? null);
                setObservations('');
                setSelectedTag('blue');
                setIsEditingInternal(true);
            }
        }
    }, [visible]);

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

    const chartDataToShow = initialData?.data ? JSON.parse(initialData?.data) : graphData;

    function getTagIcon(tag: string) {
        switch (tag) {
            case 'red':
                return <MaterialIcons name="dangerous" size={24} color="white" />;
            case 'green':
                return <MaterialIcons name="check-circle" size={24} color="white" />;
            case 'yellow':
                return <MaterialIcons name="error" size={24} color="white" />;
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
                        {!isEditingInternal && (
                            <TouchableOpacity onPress={() => setIsEditingInternal(true)}>
                                <MaterialIcons name="edit" size={20} color="#007AFF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <TextInput
                        style={[styles.textArea, !isEditingInternal && styles.disabledInput]}
                        value={observations}
                        onChangeText={setObservations}
                        placeholder="Digite suas observações"
                        multiline
                        editable={isEditingInternal}
                    />

                    {chartDataToShow && (
                        <>
                            <View style={styles.graphHeader}>
                                <Text style={styles.sectionTitle}>Gráfico da Ausculta</Text>

                                <View
                                    style={[
                                        styles.tagButtonGroup,
                                        !isEditingInternal && styles.disabledInput,
                                    ]}
                                >
                                    {tagItems.map(({ value }) => (
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
                                    padding={screenDimensions.width * 0.05}
                                />
                            </View>

                            <View style={styles.audioProgress}>
                                <MaterialIcons name="play-arrow" size={24} color="white" />
                                <View style={styles.progressBar} />
                            </View>
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
