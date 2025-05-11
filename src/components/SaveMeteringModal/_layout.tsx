import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        width: '40%',
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: '#ff3b30',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        width: '40%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
});
