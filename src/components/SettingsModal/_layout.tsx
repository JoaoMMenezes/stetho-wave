import { defaultTheme } from '@/themes/default';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: defaultTheme.colors.secondary,
        padding: 10,
        borderRadius: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: defaultTheme.colors.background,
    },
    modalContent: {
        width: '90%',
        backgroundColor: defaultTheme.colors.surface,
        borderRadius: 8,
        padding: 20,
        gap: 10,
        justifyContent: 'space-between',
    },
    connectedInfo: {
        borderWidth: 1,
        borderRadius: 8,
        borderColor: defaultTheme.colors.primary,
        padding: 10,
        marginTop: 10,
    },
    activtyIndicator: {
        alignSelf: 'center',
        width: '100%',
        backgroundColor: defaultTheme.colors.primary,
        borderRadius: 8,
        opacity: 0.5,
    },
});
