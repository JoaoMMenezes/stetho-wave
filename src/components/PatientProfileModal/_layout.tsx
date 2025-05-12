import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },

    cancelButton: {
        backgroundColor: '#ccc',
        padding: 10,
        borderRadius: 6,
        flex: 1,
        marginRight: 8,
    },

    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 6,
        flex: 1,
        marginLeft: 8,
    },

    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        height: '100%',
        width: '100%',
        backgroundColor: '#a5d8ff',
        padding: 30,
    },
    patientName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        backgroundColor: '#e0f0ff',
        padding: 10,
        borderRadius: 10,
    },
    chartContainer: {
        width: '100%',
        height: '45%',
        padding: 10,
        borderBlockColor: 'black',
        borderWidth: 2,
        borderRadius: 28,
        backgroundColor: 'white',
    },
    audioProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#ccc',
        borderRadius: 2,
        marginLeft: 8,
    },
    observationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    label: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    textArea: {
        backgroundColor: '#228be6',
        color: '#fff',
        borderRadius: 10,
        padding: 10,
        minHeight: 80,
        maxHeight: '20%',
        height: 'auto',
        marginTop: 6,
    },
    disabledInput: {
        opacity: 0.6,
    },

    deleteButton: {
        backgroundColor: '#ff3b30',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        width: '40%',
        alignItems: 'center',
    },

    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        marginBottom: 10,
        borderRadius: 8,
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
    },

    noDataText: {
        fontSize: 14,
        color: 'gray',
        fontStyle: 'italic',
    },

    meteringItem: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
