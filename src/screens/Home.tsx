import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MeteringCard from '../components/MeteringCard';

const data = [
    { patientName: 'João da Silva', date: '05/12/2024', status: 'danger' },
    { patientName: 'Maria Oliveira', date: '04/12/2024', status: 'inconclusive' },
    { patientName: 'Ana Costa', date: '03/12/2024', status: 'resolved' },
    { patientName: 'Carlos Souza', date: '02/12/2024', status: 'danger' },
    { patientName: 'Fernanda Lima', date: '01/12/2024', status: 'resolved' },
    { patientName: 'Pedro Santos', date: '30/11/2024', status: 'inconclusive' },
    { patientName: 'Cláudia Mendes', date: '29/11/2024', status: 'danger' },
];

export default function Home() {
    const [filter, setFilter] = useState<'all' | 'danger' | 'inconclusive' | 'resolved'>('all');

    const filteredData = filter === 'all' ? data : data.filter((item) => item.status === filter);

    return (
        <View style={styles.container}>
            <View style={styles.filterContainer}>
                {['all', 'danger', 'inconclusive', 'resolved'].map((status) => (
                    <TouchableOpacity
                        key={status}
                        style={[styles.filterButton, filter === status && styles.activeFilter]}
                        onPress={() =>
                            setFilter(status as 'all' | 'danger' | 'inconclusive' | 'resolved')
                        }
                    >
                        <Text
                            style={[
                                styles.filterText,
                                filter === status && styles.activeFilterText,
                            ]}
                        >
                            {status === 'all'
                                ? 'Todos'
                                : status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <ScrollView style={styles.cardsContainer}>
                {filteredData.map((item, index) => (
                    <MeteringCard
                        key={index}
                        patientName={item.patientName}
                        date={item.date}
                        status={item.status as 'danger' | 'inconclusive' | 'resolved'}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    filterButton: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    activeFilter: {
        backgroundColor: '#007BFF',
    },
    filterText: {
        fontSize: 14,
        color: '#555',
    },
    activeFilterText: {
        color: '#fff',
    },
    cardsContainer: {
        paddingVertical: 10,
    },
});
