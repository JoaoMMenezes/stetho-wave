import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './_layout';
import { usePatientDatabase } from '@/database/usePatientDatabase';
import { Metering, useMeteringDatabase } from '@/database/useMeteringDatabase';
import SaveMeteringModal from '../SaveMeteringModal/SaveMeteringModal';

interface PatientProfileModalProps {
    patientId: number;
    visible: boolean;
    onClose: () => void;
    onSave?: (data: { observations: string }) => void;
    onDelete?: () => void;
}

export default function PatientProfileModal({
    patientId,
    visible,
    onClose,
    onSave,
    onDelete,
}: PatientProfileModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const { get, update } = usePatientDatabase();
    const { searchByPatientId } = useMeteringDatabase();

    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [maritalStatus, setMaritalStatus] = useState('');
    const [address, setAddress] = useState('');
    const [observations, setObservations] = useState('');
    const [meterings, setMeterings] = useState([] as Metering[]);

    const [selectedMetering, setSelectedMetering] = useState<Metering | undefined>(undefined);
    const [saveModalVisible, setSaveModalVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            (async () => {
                try {
                    const patient = await get(patientId);
                    if (patient) {
                        setName(patient.name);
                        setAge(patient.age.toString());
                        setMaritalStatus(patient.maritalStatus || '');
                        setAddress(patient.address || '');
                        setObservations(patient.observations || '');
                    }

                    const meteringData = await searchByPatientId(patientId);

                    setMeterings(meteringData);
                } catch (error) {
                    console.error('Erro ao carregar dados do paciente:', error);
                }
            })();
        }
    }, [visible]);

    const handleSubmit = async () => {
        try {
            await update(patientId, {
                name,
                age: parseInt(age),
                maritalStatus,
                address,
                observations,
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Erro ao atualizar paciente:', error);
        }
    };

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* Header com nome e botão de edição */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.patientName}>{name}</Text>
                        <TouchableOpacity onPress={() => setIsEditing((prev) => !prev)}>
                            <MaterialIcons name="edit" size={24} color="black" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        <TextInput
                            placeholder="Nome"
                            value={name}
                            onChangeText={setName}
                            editable={isEditing}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Idade"
                            keyboardType="numeric"
                            value={age}
                            onChangeText={setAge}
                            editable={isEditing}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Estado Civil"
                            value={maritalStatus}
                            onChangeText={setMaritalStatus}
                            editable={isEditing}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Endereço"
                            value={address}
                            onChangeText={setAddress}
                            editable={isEditing}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Observações"
                            value={observations}
                            onChangeText={setObservations}
                            editable={isEditing}
                            style={[styles.input, { height: 80 }]}
                            multiline
                        />

                        {isEditing && (
                            <View style={styles.buttonRow}>
                                <Pressable style={styles.cancelButton} onPress={onClose}>
                                    <Text style={styles.buttonText}>Cancelar</Text>
                                </Pressable>
                                <Pressable style={styles.saveButton} onPress={handleSubmit}>
                                    <Text style={styles.buttonText}>Salvar</Text>
                                </Pressable>
                            </View>
                        )}

                        <View style={{ marginTop: 20 }}>
                            <Text style={styles.sectionTitle}>Gravações:</Text>
                            {meterings.length === 0 ? (
                                <Text style={styles.noDataText}>Nenhuma gravação encontrada.</Text>
                            ) : (
                                meterings.map((m) => (
                                    <Pressable
                                        key={m.id}
                                        style={styles.meteringItem}
                                        onPress={() => {
                                            setSelectedMetering(m);
                                            setSaveModalVisible(true);
                                        }}
                                    >
                                        <Text>{new Date(m.date).toLocaleString()}</Text>
                                        <Text style={{ color: m.tag }}>{m.tag.toUpperCase()}</Text>
                                    </Pressable>
                                ))
                            )}
                        </View>

                        {/* TODO: Implementar Modal de medição */}
                        <SaveMeteringModal
                            visible={saveModalVisible}
                            onClose={() => {
                                setSaveModalVisible(false);
                                setSelectedMetering(undefined);
                            }}
                            onSave={() => {}}
                            onDelete={() => {}}
                            patientId={patientId}
                            initialData={selectedMetering}
                        />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
