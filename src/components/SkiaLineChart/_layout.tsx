import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    header: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fullscreenButton: {
        fontSize: 24,
        paddingHorizontal: 16,
    },
    fullscreenHeader: {
        zIndex: 10,
        position: 'absolute',
        top: 0,
        right: 0,
    },
    canvas: {
        width: '100%',
        height: '120%',
        backgroundColor: 'white',
    },
    container: {
        flex: 1,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    yAxis: {
        borderRightWidth: 1,
        borderColor: '#e0e0e0',
        alignItems: 'center',
    },
    scrollViewContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    modalContent: {
        flex: 1,
        backgroundColor: 'white',
    },
});
