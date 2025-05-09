import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './_layout';

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
