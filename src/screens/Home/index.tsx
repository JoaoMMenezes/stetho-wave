import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { styles } from './_layout';
import MeteringCard from '@/components/MeteringCard/MeteringCard';
import { Metering, useMeteringDatabase } from '@/database/useMeteringDatabase';
import MeteringModal from '@/components/MeteringModal/MeteringModal';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import 'dayjs/locale/pt-br';
import { MaterialIcons } from '@expo/vector-icons';

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.locale('pt-br');

export default function Home() {
    const { getAll, update } = useMeteringDatabase();

    const [selectedTag, setSelectedTag] = useState<'red' | 'green' | 'blue' | 'all'>('all');
    const [sortAscending, setSortAscending] = useState(false);

    const [meterings, setMeterings] = useState<Metering[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMetering, setSelectedMetering] = useState<Metering | undefined>(undefined);
    const [meteringModalVisible, setMeteringModalVisible] = useState(false);

    useEffect(() => {
        loadMeterings();
    }, []);

    async function loadMeterings() {
        const data = await getAll();
        setMeterings(data as Metering[]);
    }

    async function onRefresh() {
        setRefreshing(true);
        await loadMeterings();
        setRefreshing(false);
    }

    function groupByDate(meterings: Metering[]): { title: string; data: Metering[] }[] {
        const groups: { [key: string]: Metering[] } = {};

        meterings.forEach((metering) => {
            const date = dayjs(metering.date);
            let key = date.format('DD [de] MMMM, YYYY');

            if (date.isToday()) {
                key = 'Hoje';
            } else if (date.isYesterday()) {
                key = 'Ontem';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(metering);
        });

        const sortedGroups = Object.entries(groups)
            .sort(([aKey], [bKey]) => {
                const aDate =
                    aKey === 'Hoje'
                        ? dayjs()
                        : aKey === 'Ontem'
                        ? dayjs().subtract(1, 'day')
                        : dayjs(aKey, 'DD [de] MMMM, YYYY');

                const bDate =
                    bKey === 'Hoje'
                        ? dayjs()
                        : bKey === 'Ontem'
                        ? dayjs().subtract(1, 'day')
                        : dayjs(bKey, 'DD [de] MMMM, YYYY');

                return bDate.valueOf() - aDate.valueOf();
            })
            .map(([title, data]) => ({ title, data }));

        return sortedGroups;
    }

    function mapTagIcon(tag: string) {
        switch (tag) {
            case 'red':
                return <MaterialIcons name="error" size={26} color="white" />;
            case 'green':
                return <MaterialIcons name="check-circle" size={26} color="white" />;
            case 'blue':
                return <MaterialIcons name="help" size={26} color="white" />;
            default:
                return <MaterialIcons name="filter-alt-off" size={22} color="white" />;
        }
    }

    async function handleOnSave(metering: any) {
        try {
            if (selectedMetering && selectedMetering.id !== undefined) {
                await update(selectedMetering.id, {
                    ...selectedMetering,
                    observations: metering.observations,
                    tag: metering.tag as 'red' | 'green' | 'blue',
                });
                console.log('Gravação atualizada com sucesso!');
                loadMeterings();
            }
        } catch (error) {
            console.error('Erro ao salvar metering:', error);
        }
    }

    const filteredMeterings = meterings
        .filter((m) => selectedTag === 'all' || m.tag === selectedTag)
        .sort((a, b) => {
            const aDate = dayjs(a.date).valueOf();
            const bDate = dayjs(b.date).valueOf();
            return sortAscending ? aDate - bDate : bDate - aDate;
        });

    const groupedMeterings = groupByDate(filteredMeterings);

    return (
        <View style={styles.container}>
            <View style={styles.filtersContainer}>
                <TouchableOpacity
                    onPress={() => setSortAscending(!sortAscending)}
                    style={styles.sortButton}
                >
                    <Text style={styles.filterText}>Data</Text>
                    <MaterialIcons
                        name={sortAscending ? 'arrow-upward' : 'arrow-downward'}
                        size={20}
                        color="white"
                    />
                </TouchableOpacity>

                <View style={styles.tagFilters}>
                    <Text style={styles.filterLabel}>Filtros:</Text>
                    {['all', 'red', 'green', 'blue'].map((tag) => (
                        <TouchableOpacity
                            key={tag}
                            style={[
                                styles.tag,
                                {
                                    backgroundColor: tag === 'all' ? 'gray' : tag,
                                    opacity: selectedTag === tag ? 1 : 0.6,
                                },
                            ]}
                            onPress={() => setSelectedTag(tag as any)}
                        >
                            {mapTagIcon(tag)}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView
                style={styles.cardsContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {groupedMeterings.map((group) => (
                    <View key={group.title}>
                        <View style={styles.groupHeader}>
                            <Text style={styles.headerTitle}>{group.title}</Text>
                            <View style={styles.divider} />
                        </View>
                        {group.data.map((metering) => (
                            <MeteringCard
                                key={metering.id}
                                metering={metering}
                                showPatientName={true}
                                onPress={() => {
                                    setSelectedMetering(metering);
                                    setMeteringModalVisible(true);
                                }}
                            />
                        ))}
                    </View>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Metering Modal */}
            <MeteringModal
                visible={meteringModalVisible}
                onClose={async () => {
                    setMeteringModalVisible(false);
                    setSelectedMetering(undefined);
                }}
                onSave={async (metering) => handleOnSave(metering)}
                isEditing={false}
                initialData={selectedMetering}
            />
        </View>
    );
}
