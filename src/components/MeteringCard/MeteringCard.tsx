import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface MeteringCardProps {
    patientName: string;
    date: string;
    status: 'danger' | 'inconclusive' | 'resolved';
}

export default function MeteringCard({ patientName, date, status }: MeteringCardProps) {
    const getStatusIcon = () => {
        switch (status) {
            case 'danger':
                return <MaterialIcons name="error" size={24} color="red" />;
            case 'inconclusive':
                return <MaterialIcons name="help" size={24} color="blue" />;
            case 'resolved':
                return <MaterialIcons name="check-circle" size={24} color="green" />;
            default:
                return null;
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.patientName}>{patientName}</Text>
            </View>
            <View style={styles.body}>
                <Text style={styles.date}>Data: {date}</Text>
            </View>
            <View style={styles.footer}>{getStatusIcon()}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 6,
        marginBottom: 8,
    },
    patientName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    body: { marginBottom: 8 },
    date: { fontSize: 14, color: '#555' },
    footer: {
        alignItems: 'flex-end',
    },
});
