import React, { useEffect, useState } from 'react';
import {
    Modal,
    Pressable,
    Text,
    View,
    Button,
    PermissionsAndroid,
    Platform,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { styles } from './_layout';
import { MaterialIcons } from '@expo/vector-icons';
import { defaultTheme } from '@/themes/default';
import { Buffer } from 'buffer';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    source: 'mic' | 'ble';
    onSourceChange: (source: 'mic' | 'ble') => void;
    onConnect: (device: Device, characteristicUUID: string) => void;
}

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const AUDIO_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

const bleManager = new BleManager();

export default function SettingsModal({
    visible,
    onClose,
    source,
    onSourceChange,
    onConnect,
}: SettingsModalProps) {
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        return () => {
            bleManager.destroy();
        };
    }, []);

    async function requestPermissions() {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);
            return Object.values(granted).every((v) => v === 'granted');
        }
        return true;
    }

    async function connectToDevice() {
        if (isConnected || isScanning) return;
        const ok = await requestPermissions();
        if (!ok) return;

        setIsScanning(true);
        setIsLoading(true);

        bleManager.startDeviceScan(null, null, async (error, device) => {
            console.log('Checking device', device?.name, device?.id);
            if (error) {
                console.warn('BLE scan error:', error);
                stopScan();
                return;
            }
            if (device?.name && device.name.includes('ESP32_Audio_SPIFFS')) {
                console.log('Found device:', device.name);
                stopScan();
                try {
                    const connected = await device.connect();
                    await connected.discoverAllServicesAndCharacteristics();
                    setConnectedDevice(connected);
                    setIsConnected(true);
                    onConnect(connected, AUDIO_CHAR_UUID);
                } catch (e) {
                    console.error('Connection error:', e);
                } finally {
                    setIsLoading(false);
                }
            }
        });

        // stop scan after timeout
        setTimeout(stopScan, 100000);
    }

    function stopScan() {
        bleManager.stopDeviceScan();
        setIsScanning(false);
        setIsLoading(false);
    }

    async function disconnectFromDevice() {
        if (!connectedDevice) return;
        try {
            await bleManager.cancelDeviceConnection(connectedDevice.id);
        } catch {}
        setConnectedDevice(null);
        setIsConnected(false);
    }

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.title}>Configurações</Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons
                                name="close"
                                size={24}
                                color={defaultTheme.colors.surface}
                            />
                        </Pressable>
                    </View>

                    <Text style={{ fontSize: 18, marginVertical: 10 }}>Fonte de entrada</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Text>Microfone</Text>
                        <Switch
                            value={source === 'ble'}
                            onValueChange={(val) => onSourceChange(val ? 'ble' : 'mic')}
                            style={{ marginHorizontal: 10 }}
                        />
                        <Text>Bluetooth</Text>
                    </View>

                    {isLoading ? (
                        <ActivityIndicator
                            style={styles.activtyIndicator}
                            size="large"
                            color="white"
                        />
                    ) : isConnected ? (
                        <View style={styles.connectedInfo}>
                            <Text>Dispositivo conectado</Text>
                            <Button title="Desconectar" onPress={disconnectFromDevice} />
                        </View>
                    ) : (
                        <Button title="Conectar ao ESP32" onPress={connectToDevice} />
                    )}
                </View>
            </View>
        </Modal>
    );
}
