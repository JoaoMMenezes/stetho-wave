import { defaultTheme } from '@/themes/default';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: '100%',
        backgroundColor: '#a5d8ff',
        padding: 10,
        alignContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    chartContainer: {
        marginTop: '20%',
        width: '90%',
        height: '55%',
        padding: 10,
        borderColor: '#228be6',
        borderWidth: 2,
        borderRadius: 28,
        backgroundColor: 'white',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#228be6',
        borderRadius: 20,
        height: 80,
        alignContent: 'center',
        justifyContent: 'space-around',
        width: '90%',
    },
    modalButton: {
        width: 60,
        height: 40,
        backgroundColor: '#4dabf7',
        borderColor: 'white',
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordButton: {
        width: 70,
        height: 70,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#4dabf7',
        alignItems: 'center',
        backgroundColor: 'white',
        justifyContent: 'center',
    },
    progressBarContainer: {
        flex: 1,
        height: 4,
        backgroundColor: '#fff',
        borderRadius: 2,
        overflow: 'hidden',
    },
    audioControlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        width: '90%',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4dabf7', // cor da barra de progresso
    },
    playButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: defaultTheme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },

    redCircle: { aspectRatio: 1, backgroundColor: 'orangered', borderRadius: 30 },
});
