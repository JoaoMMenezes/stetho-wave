import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
        padding: 20,
    },
    patientName: {
        fontSize: 20,
        textAlign: 'center',
        fontWeight: 'bold',
        padding: 10,
        color: 'white',
        borderRadius: 12,
        backgroundColor: '#228be6',
        borderColor: '#228be6',
        borderWidth: 2,
        marginBottom: 20,
    },

    circleButton: {
        width: 30,
        height: 30,
        backgroundColor: 'white',
        borderColor: '#228be6',
        borderWidth: 2,
        borderRadius: 60,
        alignItems: 'center',
        alignSelf: 'flex-end',
        justifyContent: 'center',
        marginBottom: 10,
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

    inputsContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 10,
        height: '60%',
    },

    meteringsContainer: {
        height: '50%',
    },

    input: {
        marginHorizontal: 10,
        borderBottomWidth: 1,
        borderColor: '#228be6',
        padding: 12,
        marginBottom: 10,
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },

    noDataText: {
        fontSize: 14,
        color: 'gray',
        fontStyle: 'italic',
    },
    // meteringItem: {
    //     padding: 12,
    //     backgroundColor: 'white',
    //     borderRadius: 6,
    //     marginBottom: 8,
    //     flexDirection: 'row',
    //     justifyContent: 'space-between',
    //     alignItems: 'center',
    //     shadowColor: 'black',
    //     shadowOffset: {
    //         width: 0,
    //         height: 1,
    //     },
    //     shadowOpacity: 0.2,
    //     elevation: 1,
    // },
    // tag: {
    //     width: 20,
    //     height: 20,
    //     justifyContent: 'center',
    //     alignContent: 'center',
    //     alignItems: 'center',
    //     borderRadius: 30,
    // },
});
