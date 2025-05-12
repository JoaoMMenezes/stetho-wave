import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        maxHeight: '90%',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        marginBottom: 10,
        borderRadius: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    cancelButton: {
        backgroundColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginRight: 8,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginLeft: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
