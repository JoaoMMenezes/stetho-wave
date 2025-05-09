import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SetStateAction, useCallback, useEffect, useState } from 'react';
import { AVPlaybackStatus, Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';
import { styles } from './_layout';
import React from 'react';

interface MemoListItemProps {
    uri: string;
    activeMemo: string | undefined;
    meteringData: number[];
    setActiveMemo: React.Dispatch<SetStateAction<string | undefined>>;
    setCurrentMeteringData: React.Dispatch<SetStateAction<number[]>>;
    patientName: string;
    date: string;
    observations: string;
}

const MemoListItem: React.FC<MemoListItemProps> = ({
    uri,
    activeMemo,
    setActiveMemo,
    meteringData,
    setCurrentMeteringData,
    patientName,
    date,
    observations,
}) => {
    const [sound, setSound] = useState<Sound>();
    const [status, setStatus] = useState<AVPlaybackStatus>();

    async function loadSound() {
        console.log('Loading Sound');
        const { sound } = await Audio.Sound.createAsync({ uri }, undefined, onPlaybackStatusUpdate);
        setSound(sound);
    }

    async function playSound() {
        if (!sound) return;
        console.log('Playing Sound');
        await sound.setPositionAsync(0);
        await sound.setProgressUpdateIntervalAsync(100);
        await sound.playAsync();
    }

    const onPlaybackStatusUpdate = useCallback(
        (newStatus: AVPlaybackStatus) => setStatus(newStatus),
        [sound]
    );

    useEffect(() => {
        loadSound();
        return () => {
            sound?.unloadAsync();
        };
    }, [uri]);

    const formatMillis = (millis: number) => {
        const seconds = Math.floor(millis / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const position = status?.isLoaded ? status.positionMillis : 0;
    const duration = status?.isLoaded ? status.durationMillis : 1;
    const progress = (position / (duration || 1)) * 100;

    const isPlaying = status?.isLoaded ? status.isPlaying : false;
    const isActive = activeMemo === uri;

    return (
        <View style={styles.componentBackground}>
            {/* Exibição das Informações do Modal */}
            <View style={styles.infoContainer}>
                <View>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.infoLabel}>Paciente: </Text>
                        <Text style={styles.infoText}>{patientName}</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.infoLabel}>Observações: </Text>
                        <Text style={styles.infoText}>{observations}</Text>
                    </View>
                </View>
                <Text style={[styles.infoText, { position: 'absolute', top: 0, right: 20 }]}>
                    {date}
                </Text>
            </View>

            <Pressable
                style={[styles.container, isActive && styles.activeItem]}
                onPressIn={() => {
                    playSound();
                    setCurrentMeteringData(meteringData);
                    setActiveMemo(uri);
                }}
            >
                <FontAwesome5 name={isPlaying ? 'pause' : 'play'} size={20} color={'gray'} />

                <View style={styles.playbackContainer}>
                    <View style={styles.playbackBackground} />
                    <View style={[styles.playbackIndicator, { left: `${progress}%` }]} />
                </View>

                <Text>
                    {formatMillis(position || 0)} / {formatMillis(duration || 0)}
                </Text>
            </Pressable>
        </View>
    );
};

export default MemoListItem;
