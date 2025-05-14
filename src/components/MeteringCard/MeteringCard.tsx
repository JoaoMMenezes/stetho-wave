import React, { useEffect, useState } from 'react';
import { Pressable, StyleProp, Text, View } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Metering } from '@/database/useMeteringDatabase';
import { styles } from './_layout';
import { usePatientDatabase } from '@/database/usePatientDatabase';

type MeteringCardProps = {
    metering: Metering;
    onPress: () => void;
    customStyles?: StyleProp<any>;
    showPatientName?: boolean;
};

export default function MeteringCard({
    metering,
    onPress,
    customStyles,
    showPatientName,
}: MeteringCardProps) {
    const { get } = usePatientDatabase();
    const [patientName, setPatientName] = useState<string>('Desconhecido');

    useEffect(() => {
        const fetchPatientName = async () => {
            setPatientName(await getPatientName());
        };
        fetchPatientName();
    }, [metering.patient_id]);

    function formatDate(date: Date) {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}/${date.getFullYear()}  -  ${date
            .getHours()
            .toString()
            .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    function mapTagIcon(tag: string) {
        switch (tag) {
            case 'red':
                return <MaterialIcons name="error" size={18} color="white" />;
            case 'green':
                return <MaterialIcons name="check-circle" size={18} color="white" />;

            default:
                return <MaterialIcons name="help" size={18} color="white" />;
        }
    }

    async function getPatientName() {
        if (metering.patient_id) {
            const patient = await get(metering.patient_id);
            return patient?.name || 'Desconhecido';
        }
        return 'Desconhecido';
    }

    return (
        <Pressable style={[styles.meteringItem, customStyles]} onPress={() => onPress()}>
            {showPatientName ? (
                <Text style={styles.nameText}>{patientName}</Text>
            ) : (
                <Text style={styles.dataText}>{formatDate(new Date(metering.date))}</Text>
            )}
            <View style={[styles.tag, { backgroundColor: metering.tag }]}>
                {mapTagIcon(metering.tag)}
            </View>
        </Pressable>
    );
}
