import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
