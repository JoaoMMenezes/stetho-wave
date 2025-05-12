import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        padding: 16,
        flex: 1,
    },
    addButton: {
        backgroundColor: '#4CAF50',
        padding: 14,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    patientItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    patientName: {
        fontSize: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    },
});
