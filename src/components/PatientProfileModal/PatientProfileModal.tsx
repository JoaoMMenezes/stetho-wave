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

    function formatDate(date: Date) {
        return `${date.getHours().toString().padStart(2, '0')}:${date
            .getMinutes()
            .toString()
            .padStart(2, '0')} - ${date.getDate().toString().padStart(2, '0')}/${(
            date.getMonth() + 1
        )
            .toString()
            .padStart(2, '0')}/${date.getFullYear()}`;
    }

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* Nome do Paciente*/}
                    <Text numberOfLines={2} ellipsizeMode="tail" style={styles.patientName}>
                        {name}
                    </Text>

                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                        }}
                    >
                        <Text style={styles.sectionTitle}>Informações:</Text>
                        {isEditing ? (
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity
                                    style={[styles.circleButton, { borderColor: 'red' }]}
                                    onPress={() => setIsEditing(false)}
                                >
                                    <MaterialIcons name="close" size={18} color="red" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.circleButton, { borderColor: '#4CAF50' }]}
                                    onPress={handleSubmit}
                                >
                                    <MaterialIcons name="check" size={18} color="#4CAF50" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.circleButton, { borderColor: '#228be6' }]}
                                onPress={() => setIsEditing((prev) => !prev)}
                            >
                                <MaterialIcons name="edit" size={18} color="#228be6" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Campos de informações */}
                    <ScrollView
                        contentContainerStyle={{
                            justifyContent: 'space-between',
                            flexGrow: 1,
                            minHeight: 250,
                        }}
                        style={styles.inputsContainer}
                    >
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
                    </ScrollView>

                    {/* Lista de Gravações */}
                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Gravações:</Text>
                    <ScrollView style={styles.meteringsContainer}>
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
                                    <Text style={styles.noDataText}>
                                        {formatDate(new Date(m.date))}
                                    </Text>
                                    <View
                                        style={[
                                            styles.tag,
                                            { backgroundColor: m.tag, opacity: 0.6 },
                                        ]}
                                    />
                                </Pressable>
                            ))
                        )}

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
