import { defaultTheme } from '@/themes/default';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#a5d8ff',
    },
    activeFilterText: {
        color: '#fff',
    },
    cardsContainer: {
        padding: 20,
    },
    groupHeader: {
        marginVertical: 6,
        flexDirection: 'row',
        alignContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: { fontWeight: 'bold', fontSize: 18, color: 'white' },
    divider: {
        height: 1,
        backgroundColor: defaultTheme.colors.surface,
        marginVertical: 8,
        flex: 1,
    },
    filtersContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: defaultTheme.colors.surface,
    },
    tagFilters: {
        backgroundColor: defaultTheme.colors.secondary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderRadius: 10,
        gap: 8,
    },
    filterButton: {
        padding: 8,
        borderRadius: 4,
    },
    filterLabel: {
        marginRight: 8,
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    filterText: {
        fontWeight: '500',
        fontSize: 18,
        color: 'white',
    },
    sortButton: {
        padding: 5,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: defaultTheme.colors.secondary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tag: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
    },
});
