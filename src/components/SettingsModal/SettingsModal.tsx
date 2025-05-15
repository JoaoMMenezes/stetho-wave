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
import { Base64 } from 'js-base64';
import { styles } from './_layout';
import { MaterialIcons } from '@expo/vector-icons';
import { defaultTheme } from '@/themes/default';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    source: 'mic' | 'ble';
    onSourceChange: (source: 'mic' | 'ble') => void;
    onConnect: (device: Device, characteristicUUID: string) => void;
}

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const BOX_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

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
    const [boxValue, setBoxValue] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        return () => {
            bleManager.destroy(); // limpa recursos ao desmontar
        };
    }, []);

    /**
     * Solicita permissões necessárias para BLE no Android
     * @returns true se as permissões foram concedidas, false caso contrário
     */
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

    /**
     * Conecta ao dispositivo BLE e inicia o monitoramento do valor recebido
     */
    async function connectToDevice() {
        console.log('Conectando ao dispositivo...');
        if (isConnected || isScanning) {
            console.warn('Já conectado ou escaneando');
            return;
        }

        const permission = await requestPermissions();
        if (!permission) return;

        console.log('Permissões concedidas');

        setIsScanning(true);
        setIsLoading(true);

        bleManager.startDeviceScan(null, null, async (error, device) => {
            console.log('Escaneando dispositivos...');

            if (error) {
                console.warn('Erro ao escanear:', error);
                bleManager.stopDeviceScan();
                setIsScanning(false);
                setIsLoading(false);
                return;
            }

            console.log('Dispositivo encontrado:', device?.name, device?.id);

            if (device?.name === 'ESP32_Box') {
                bleManager.stopDeviceScan();
                setIsScanning(false);
                try {
                    const alreadyConnected = await bleManager.isDeviceConnected(device.id);
                    const connected = alreadyConnected ? device : await device.connect();

                    const connectAlready = await bleManager.isDeviceConnected(device.id);
                    console.log('connectAlready?', connectAlready);

                    await connected.discoverAllServicesAndCharacteristics();
                    setConnectedDevice(connected);
                    setIsConnected(true);
                    onConnect(device, BOX_CHARACTERISTIC_UUID);

                    // leitura inicial
                    const char = await connected.readCharacteristicForService(
                        SERVICE_UUID,
                        BOX_CHARACTERISTIC_UUID
                    );
                    const value = parseInt(Base64.decode(char?.value || '0'));
                    setBoxValue(value);

                    // monitoramento
                    connected.monitorCharacteristicForService(
                        SERVICE_UUID,
                        BOX_CHARACTERISTIC_UUID,
                        (error, characteristic) => {
                            if (error) {
                                console.warn('Erro no monitoramento:', error);
                                return;
                            }
                            if (characteristic?.value) {
                                const updatedValue = parseInt(Base64.decode(characteristic.value));
                                setBoxValue(updatedValue);
                                console.log('Valor atualizado:', updatedValue);
                            }
                        },
                        'monitor-box'
                    );
                } catch (err) {
                    console.error('Erro na conexão:', err);
                }
                setIsLoading(false);
            }
        });

        // timeout
        setTimeout(() => {
            bleManager.stopDeviceScan();
            setIsScanning(false);
            setIsLoading(false);
        }, 30000);
    }

    async function disconnectFromDevice() {
        if (connectedDevice) {
            await bleManager.cancelTransaction('monitor-box');
            await bleManager.cancelDeviceConnection(connectedDevice.id);
            setConnectedDevice(null);
            setIsConnected(false);
        }
    }

    async function toggleBoxValue() {
        if (!connectedDevice) return;

        const newValue = boxValue === 0 ? 1 : 0;

        await bleManager.writeCharacteristicWithResponseForDevice(
            connectedDevice.id,
            SERVICE_UUID,
            BOX_CHARACTERISTIC_UUID,
            Base64.encode(newValue.toString())
        );

        setBoxValue(newValue);
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
                            <Text>Valor atual: {boxValue}</Text>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 10,
                                }}
                            >
                                <Text>Alternar valor:</Text>
                                <Switch
                                    value={boxValue === 1}
                                    onValueChange={toggleBoxValue}
                                    style={{ marginLeft: 10 }}
                                />
                            </View>
                            <Button title="Desconectar" onPress={disconnectFromDevice} />
                        </View>
                    ) : (
                        <Button
                            title="Conectar ao ESP32"
                            onPress={() => {
                                connectToDevice();
                            }}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}
