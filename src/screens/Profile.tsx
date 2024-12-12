import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Button } from 'react-native';

const patients = [
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
    const [selectedPatient, setSelectedPatient] = useState<null | (typeof patients)[0]>(null);

    const handlePressPatient = (patient: (typeof patients)[0]) => {
        setSelectedPatient(patient);
    };

    const closeModal = () => {
        setSelectedPatient(null);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Lista de Pacientes</Text>
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

            <Modal visible={!!selectedPatient} animationType="slide" transparent>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        padding: 10,
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        margin: 10,
    },
    patientCard: {
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
    },
    patientName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        gap: 10,
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalObservations: {
        marginTop: 10,
        fontStyle: 'italic',
        marginBottom: 20,
    },
});
