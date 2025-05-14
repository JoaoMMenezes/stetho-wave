import { defaultTheme } from '@/themes/default';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    meteringItem: {
        padding: 12,
        backgroundColor: 'white',
        borderRadius: 6,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: 'black',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        elevation: 1,
    },
    dataText: {
        fontSize: 16,
        color: 'gray',
    },
    nameText: {
        fontSize: 16,
        fontWeight: 500,
    },
    tag: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
    },
});
