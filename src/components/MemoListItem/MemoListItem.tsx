import { View, Text, StyleSheet, Pressable } from "react-native";
import { FontAwesome5 } from '@expo/vector-icons';
import { SetStateAction, useCallback, useEffect, useState } from "react";
import { AVPlaybackStatus, Audio } from 'expo-av';
import { Sound } from "expo-av/build/Audio";
import React from "react";

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
  observations
}) => {
  const [sound, setSound] = useState<Sound>();
  const [status, setStatus] = useState<AVPlaybackStatus>();

  async function loadSound() {
    console.log('Loading Sound');
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      undefined,
      onPlaybackStatusUpdate
    );
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
    <View style={style.componentBackground}>
      {/* Exibição das Informações do Modal */}
      <View style={style.infoContainer}>
        <View>
          <View style={{ flexDirection: 'row' }}>
            <Text style={style.infoLabel}>Paciente: </Text>
            <Text style={style.infoText}>{patientName}</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Text style={style.infoLabel}>Observações: </Text>
            <Text style={style.infoText}>{observations}</Text>
          </View>
        </View>
        <Text style={[style.infoText, { position: 'absolute', top: 0, right: 20 }]}>{date}</Text>
      </View>

      <Pressable
        style={[style.container, isActive && style.activeItem]}
        onPressIn={() => {
          playSound();
          setCurrentMeteringData(meteringData);
          setActiveMemo(uri);
        }}
      >
        <FontAwesome5
          name={isPlaying ? 'pause' : 'play'}
          size={20}
          color={'gray'}
        />

        <View style={style.playbackContainer}>
          <View style={style.playbackBackground} />
          <View style={[style.playbackIndicator, { left: `${progress}%` }]} />
        </View>

        <Text>{formatMillis(position || 0)} / {formatMillis(duration || 0)}</Text>
      </Pressable>

      
    </View>
  );
};

const style = StyleSheet.create({
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

export default MemoListItem;
