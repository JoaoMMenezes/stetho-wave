import { StyleSheet } from 'react-native';
import { defaultTheme } from '@/themes/default';

export const styles = StyleSheet.create({
    container: {
        padding: 16,
        flex: 1,
        backgroundColor: defaultTheme.colors.background,
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
        borderWidth: 2,
        borderColor: defaultTheme.colors.primary,
        backgroundColor: defaultTheme.colors.surface,
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        color: defaultTheme.colors.primary,
    },
    patientItem: {
        padding: 12,
        backgroundColor: 'white',
        borderRadius: 8,
        marginVertical: 4,
        elevation: 2,
        shadowColor: defaultTheme.shadows[1],
    },
    patientName: {
        fontSize: 16,
        color: defaultTheme.colors.text.primary,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 20,
    },
});
