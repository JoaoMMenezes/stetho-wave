import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Button, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './_layout';
import SkiaLineChart from '../SkiaLineChart/SkiaLineChart';

interface SaveMeteringModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: { observations: string }) => void;
    onDelete: () => void;
    graphData: number[];
}

export default function SaveMeteringModal({
    visible,
    onClose,
    onSave,
    onDelete,
    graphData,
}: SaveMeteringModalProps) {
    const [observations, setObservations] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const screenDimensions = Dimensions.get('window');

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* Nome do Paciente */}
                    <Text style={styles.patientName}>{'patientName'}</Text>

                    {/* Gráfico */}
                    <View style={styles.chartContainer}>
                        <SkiaLineChart
                            data={graphData}
                            fullscreenEnabled={true}
                            height={screenDimensions.height * 0.4}
                            padding={screenDimensions.width * 0.05}
                        />
                    </View>

                    {/* Placeholder da barra de progresso */}
                    <View style={styles.audioProgress}>
                        <MaterialIcons name="play-arrow" size={24} color="black" />
                        <View style={styles.progressBar} />
                    </View>

                    {/* Observações com botão de edição */}
                    <View style={styles.observationHeader}>
                        <Text style={styles.label}>Observações</Text>
                        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                            <MaterialIcons name="edit" size={20} color="#007AFF" />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={[styles.textArea, !isEditing && styles.disabledInput]}
                        value={observations}
                        onChangeText={setObservations}
                        placeholder="Digite suas observações"
                        multiline
                        editable={isEditing}
                    />

                    {/* Botões */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => onSave({ observations })}
                        >
                            <Text style={styles.buttonText}>Salvar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                            <Text style={styles.buttonText}>Deletar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
