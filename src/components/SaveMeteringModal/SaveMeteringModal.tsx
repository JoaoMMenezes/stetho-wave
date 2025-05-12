import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './_layout';
import SkiaLineChart from '../SkiaLineChart/SkiaLineChart';
import DropDownPicker from 'react-native-dropdown-picker';
import { usePatientDatabase, Patient } from '@/database/usePatientDatabase';
import { Metering } from '@/database/useMeteringDatabase';

interface SaveMeteringModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: {
        patientId: number;
        observations: string;
        tag: 'red' | 'yellow' | 'green' | 'blue';
    }) => void;
    onDelete: () => void;
    graphData?: number[]; // para novas medições
    initialData?: Metering; // para visualização/edição
    patientId?: number; // usado em nova medição
}

export default function SaveMeteringModal({
    visible,
    onClose,
    onSave,
    onDelete,
    graphData,
    initialData,
    patientId,
}: SaveMeteringModalProps) {
    const { getAll } = usePatientDatabase();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [observations, setObservations] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const screenDimensions = Dimensions.get('window');

    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<{ label: string; value: number }[]>([]);

    useEffect(() => {
        async function fetchPatients() {
            const data = (await getAll()) as Patient[];
            setPatients(data);
            setItems(data.map((p) => ({ label: p.name, value: p.id })));
        }

        if (visible) {
            fetchPatients();

            if (initialData) {
                setSelectedPatientId(initialData.patient_id);
                setObservations(initialData.observations || '');
                setIsEditing(false);
            } else {
                setSelectedPatientId(patientId ?? null);
                setObservations('');
                setIsEditing(true);
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
            tag: initialData?.tag ?? 'blue',
        });
    };

    const chartDataToShow = initialData?.data ? JSON.parse(initialData?.data) : graphData;

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.label}>Paciente</Text>
                    <DropDownPicker
                        open={open}
                        value={selectedPatientId}
                        items={items}
                        setOpen={setOpen}
                        setValue={setSelectedPatientId}
                        setItems={setItems}
                        placeholder="Selecione um paciente"
                        style={{ marginBottom: open ? 120 : 20 }}
                        zIndex={1}
                        maxHeight={160}
                        disabled={!!initialData}
                    />

                    {chartDataToShow && (
                        <>
                            <Text style={styles.label}>Gráfico da Ausculta</Text>
                            <View style={styles.chartContainer}>
                                <SkiaLineChart
                                    data={chartDataToShow}
                                    fullscreenEnabled={true}
                                    height={screenDimensions.height * 0.4}
                                    padding={screenDimensions.width * 0.05}
                                />
                            </View>

                            <View style={styles.audioProgress}>
                                <MaterialIcons name="play-arrow" size={24} color="black" />
                                <View style={styles.progressBar} />
                            </View>
                        </>
                    )}

                    <View style={styles.observationHeader}>
                        <Text style={styles.label}>Observações</Text>
                        {initialData && !isEditing && (
                            <TouchableOpacity onPress={() => setIsEditing(true)}>
                                <MaterialIcons name="edit" size={20} color="#007AFF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <TextInput
                        style={[styles.textArea, !isEditing && styles.disabledInput]}
                        value={observations}
                        onChangeText={setObservations}
                        placeholder="Digite suas observações"
                        multiline
                        editable={isEditing}
                    />

                    <View style={styles.buttonRow}>
                        {initialData ? (
                            isEditing ? (
                                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                    <Text style={styles.buttonText}>Atualizar</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={() => setIsEditing(true)}
                                >
                                    <Text style={styles.buttonText}>Editar</Text>
                                </TouchableOpacity>
                            )
                        ) : (
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.buttonText}>Salvar</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                            <Text style={styles.buttonText}>Deletar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
