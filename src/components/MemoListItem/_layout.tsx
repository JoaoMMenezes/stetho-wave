import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        margin: 5,
        marginHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        gap: 10,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    activeItem: {
        backgroundColor: 'lightblue',
    },
    playbackContainer: {
        flex: 1,
        height: 30,
        justifyContent: 'center',
    },
    playbackBackground: {
        height: 1,
        backgroundColor: 'grey',
    },
    playbackIndicator: {
        width: 8,
        aspectRatio: 1,
        borderRadius: 8,
        backgroundColor: 'royalblue',
        position: 'absolute',
    },
    infoContainer: {
        marginTop: 10,
        marginLeft: 15,
        flexDirection: 'row',
        width: '100%',
        alignContent: 'space-between',
    },
    infoText: {
        fontSize: 14,
        color: 'black',
        marginBottom: 5,
    },
    infoLabel: {
        fontSize: 14,
        color: 'gray',
        fontWeight: 'bold',
    },
    componentBackground: {
        backgroundColor: 'lightgray',
        borderRadius: 10,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
        marginHorizontal: 12,
        marginVertical: 4,
        padding: 6,
    },
});
