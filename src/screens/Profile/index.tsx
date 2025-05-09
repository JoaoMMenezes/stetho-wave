import { Patient, usePatientDatabase } from '@/database/usePatientDatabase';
import React, { useEffect, useState } from 'react';
import { styles } from './_layout';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    Button,
    Alert,
} from 'react-native';

const initialPatients = [
    {
        id: '1',
        name: 'João da Silva',
        address: 'Rua Principal, 123',
        age: 45,
        maritalStatus: 'Casado',
        lastConsultation: '05/12/2024',
        observations: 'Paciente com histórico de hipertensão.',
    },
    {
        id: '2',
        name: 'Maria Oliveira',
        address: 'Av. Central, 456',
        age: 32,
        maritalStatus: 'Solteira',
        lastConsultation: '04/12/2024',
        observations: 'Exame de rotina realizado sem alterações.',
    },
    {
        id: '3',
        name: 'Carlos Souza',
        address: 'Travessa Secundária, 789',
        age: 58,
        maritalStatus: 'Divorciado',
        lastConsultation: '03/12/2024',
        observations: 'Recomendado acompanhamento cardiológico.',
    },
];

export default function Profile() {
    const [patients, setPatients] = useState(initialPatients);
    const [selectedPatient, setSelectedPatient] = useState<null | (typeof initialPatients)[0]>(
        null
    );
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        maritalStatus: '',
        address: '',
        observations: '',
    });
    const pacientDatabase = usePatientDatabase();

    const handlePressPatient = (patient: (typeof initialPatients)[0]) => {
        setSelectedPatient(patient);
    };

    const closeModal = () => {
        setSelectedPatient(null);
    };

    const toggleAddModal = () => {
        setIsAddModalVisible(!isAddModalVisible);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddPatient = async () => {
        if (!formData.name || !formData.age) {
            Alert.alert('Erro', 'Os campos Nome e Idade são obrigatórios.');
            return;
        }

        try {
            const res = await pacientDatabase.create({
                name: formData.name,
                age: parseInt(formData.age, 10),
                maritalStatus: formData.maritalStatus || 'Não informado',
                address: formData.address || 'Não informado',
                observations: formData.observations || 'Nenhuma observação.',
            });

            Alert.alert('Sucesso', 'Paciente adicionado com sucesso.');
        } catch (error) {
            console.log(error);
        }

        setFormData({
            name: '',
            age: '',
            maritalStatus: '',
            address: '',
            observations: '',
        });
        toggleAddModal();
    };

    const reloadPatients = async () => {
        try {
            const patients = await pacientDatabase.getAll();
            setPatients(patients as any);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        console.log('[!] Getting patients from database');
        reloadPatients();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Lista de Pacientes</Text>
                <TouchableOpacity style={styles.addButton} onPress={reloadPatients}>
                    <Text style={styles.addButtonText}>↻</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={toggleAddModal}>
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={patients}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.patientCard}
                        onPress={() => handlePressPatient(item)}
                    >
                        <Text style={styles.patientName}>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />

            {/* Detalhes do Paciente */}
            <Modal visible={!!selectedPatient} animationType="fade" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {selectedPatient && (
                            <>
                                <Text style={styles.modalTitle}>{selectedPatient.name}</Text>
                                <Text>Endereço: {selectedPatient.address}</Text>
                                <Text>Idade: {selectedPatient.age}</Text>
                                <Text>Estado Civil: {selectedPatient.maritalStatus}</Text>
                                <Text>Última Consulta: {selectedPatient.lastConsultation}</Text>
                                <Text style={styles.modalObservations}>
                                    Observações: {selectedPatient.observations}
                                </Text>
                                <Button title="Fechar" onPress={closeModal} />
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Modal para Adicionar Paciente */}
            <Modal visible={isAddModalVisible} animationType="fade" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Adicionar Paciente</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nome (Obrigatório)"
                            value={formData.name}
                            onChangeText={(text) => handleInputChange('name', text)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Idade (Obrigatório)"
                            value={formData.age}
                            onChangeText={(text) => handleInputChange('age', text)}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Estado Civil"
                            value={formData.maritalStatus}
                            onChangeText={(text) => handleInputChange('maritalStatus', text)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Endereço"
                            value={formData.address}
                            onChangeText={(text) => handleInputChange('address', text)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Observações"
                            value={formData.observations}
                            onChangeText={(text) => handleInputChange('observations', text)}
                        />
                        <Button title="Salvar" onPress={handleAddPatient} />
                        <Button title="Cancelar" onPress={toggleAddModal} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
