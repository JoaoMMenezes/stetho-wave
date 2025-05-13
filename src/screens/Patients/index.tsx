import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { usePatientDatabase, Patient } from '@/database/usePatientDatabase';
import AddPatientModal from '@/components/AddPatientModal/AddPatientModal';
import { styles } from './_layout';
import PatientProfileModal from '@/components/PatientProfileModal/PatientProfileModal';

export default function Patients() {
    const { getAll, searchByName } = usePatientDatabase();

    const [patients, setPatients] = useState<Patient[]>([]);
    const [searchText, setSearchText] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    async function fetchPatients(query?: string) {
        try {
            if (query && query.trim() !== '') {
                const result = await searchByName(query);
                setPatients(result);
            } else {
                const result = await getAll();
                setPatients(result as Patient[]);
            }
        } catch (error) {
            console.error('Erro ao buscar pacientes:', error);
        }
    }

    useEffect(() => {
        fetchPatients();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchPatients(searchText);
        }, 300); // debounce leve
        return () => clearTimeout(timeout);
    }, [searchText]);

    return (
        <View style={styles.container}>
            <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.addButtonText}>+ Adicionar Paciente</Text>
            </Pressable>

            <TextInput
                placeholder="Pesquisar paciente por nome..."
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchInput}
            />

            <Text style={styles.sectionTitle}>Pacientes</Text>
            <FlatList
                data={patients}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <Pressable style={styles.patientItem} onPress={() => setSelectedPatient(item)}>
                        <Text style={styles.patientName}>{item.name}</Text>
                    </Pressable>
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Nenhum paciente encontrado.</Text>
                }
            />

            <AddPatientModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    fetchPatients(); // Atualiza lista após cadastro
                }}
                onPatientAdded={() => fetchPatients()}
            />

            {/* Abrir patient profile modal */}
            <PatientProfileModal
                visible={!!selectedPatient}
                onClose={() => setSelectedPatient(null)}
                patientId={selectedPatient?.id || 0}
            />
        </View>
    );
}
