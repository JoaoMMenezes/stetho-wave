import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { usePatientDatabase } from '@/database/usePatientDatabase';
import { styles } from './_layout';

type AddPatientModalProps = {
    visible: boolean;
    onClose: () => void;
    onPatientAdded?: (patientId: string) => void;
};

export default function AddPatientModal({
    visible,
    onClose,
    onPatientAdded,
}: AddPatientModalProps) {
    const { create } = usePatientDatabase();

    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [maritalStatus, setMaritalStatus] = useState('');
    const [address, setAddress] = useState('');
    const [observations, setObservations] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const isFormValid = name.trim() !== '' && age.trim() !== '' && !isNaN(parseInt(age, 10));

    useEffect(() => {
        if (visible) {
            clearForm();
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!isFormValid) {
            setErrorMessage('Preencha corretamente os campos obrigatórios: Nome e Idade.');
            return;
        }

        try {
            const newPatientId = await create({
                name,
                age: parseInt(age, 10),
                maritalStatus,
                address,
                observations,
            });

            if (onPatientAdded) {
                onPatientAdded(newPatientId);
            }

            clearForm();
            onClose();
        } catch (error) {
            console.error('Erro ao adicionar paciente:', error);
            setErrorMessage('Erro ao adicionar paciente. Tente novamente.');
        }
    };

    const clearForm = () => {
        setName('');
        setAge('');
        setMaritalStatus('');
        setAddress('');
        setObservations('');
        setErrorMessage('');
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Novo Paciente</Text>

                    {errorMessage ? (
                        <Text style={{ color: 'red', marginBottom: 10 }}>{errorMessage}</Text>
                    ) : null}

                    <ScrollView>
                        <TextInput
                            placeholder="Nome"
                            value={name}
                            onChangeText={(text) => {
                                setName(text);
                                setErrorMessage('');
                            }}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Idade"
                            keyboardType="numeric"
                            value={age}
                            onChangeText={(text) => {
                                setAge(text);
                                setErrorMessage('');
                            }}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Estado Civil"
                            value={maritalStatus}
                            onChangeText={setMaritalStatus}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Endereço"
                            value={address}
                            onChangeText={setAddress}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Observações"
                            value={observations}
                            onChangeText={setObservations}
                            style={[styles.input, { height: 80 }]}
                            multiline
                        />

                        <View style={styles.buttonRow}>
                            <Pressable style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.buttonText}>Cancelar</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.saveButton, { opacity: isFormValid ? 1 : 0.5 }]}
                                onPress={handleSubmit}
                                disabled={!isFormValid}
                            >
                                <Text style={styles.buttonText}>Salvar</Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
