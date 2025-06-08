import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Button,
    Platform,
    PermissionsAndroid,
    StyleSheet,
    TextInput,
    Alert,
    ScrollView,
} from 'react-native';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer'; // Lembre-se de instalar: npm install buffer

// --- Constantes de Configuração ---
const SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const CHAR_UUID_RX = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
const DEVICE_NAME_TO_SCAN = 'ESP32-Audio';

type ConnectionStatus = 'idle' | 'scanning' | 'connecting' | 'connected' | 'disconnected';

export default function AudioBLEDebug() {
    // --- Refs e Estados ---
    const managerRef = useRef(new BleManager());
    const monitorSubscription = useRef<Subscription | null>(null);

    const [status, setStatus] = useState<ConnectionStatus>('idle');
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [audioSamples, setAudioSamples] = useState<number[]>([]);
    const [targetDeviceId, setTargetDeviceId] = useState('');

    // --- Efeitos de Ciclo de Vida ---

    // Efeito principal para limpeza geral e estado do Bluetooth
    useEffect(() => {
        const bleManager = managerRef.current;
        const stateSubscription = bleManager.onStateChange((state) => {
            if (state !== 'PoweredOn') {
                Alert.alert(
                    'Bluetooth Desligado',
                    'Por favor, ative o Bluetooth para usar o aplicativo.'
                );
                setStatus('idle');
            }
        }, true);

        return () => {
            stateSubscription.remove();
            if (monitorSubscription.current) {
                monitorSubscription.current.remove();
            }
            bleManager.stopDeviceScan();
            // Descomente a linha abaixo apenas se este componente for a saída final do seu app
            // managerRef.current.destroy();
        };
    }, []);

    // Efeito para lidar com desconexões inesperadas
    useEffect(() => {
        if (!connectedDevice) return;

        const disconnectionSubscription = connectedDevice.onDisconnected((error, device) => {
            console.log(`Desconexão inesperada do dispositivo ${device.id}`, error);
            handleDisconnect(false); // `false` para não tentar desconectar de novo
        });

        return () => {
            disconnectionSubscription.remove();
        };
    }, [connectedDevice]);

    // --- Funções de Lógica BLE ---

    async function requestPermissions(): Promise<boolean> {
        if (Platform.OS === 'android') {
            const apiLevel = parseInt(Platform.Version.toString(), 10);
            let permissions;

            if (apiLevel < 31) {
                permissions = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
            } else {
                permissions = [
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ];
            }

            const granted = await PermissionsAndroid.requestMultiple(permissions);
            const allGranted = Object.values(granted).every(
                (result) => result === PermissionsAndroid.RESULTS.GRANTED
            );

            if (!allGranted) {
                Alert.alert(
                    'Permissões Negadas',
                    'Todas as permissões de Bluetooth e localização são necessárias para continuar.'
                );
                return false;
            }
            return true;
        }
        return true;
    }

    // Conexão por Varredura (Scan)
    async function startScan() {
        const permissionsGranted = await requestPermissions();
        if (!permissionsGranted) return;

        setStatus('scanning');
        managerRef.current.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
            if (error) {
                Alert.alert('Erro na Varredura', error.message);
                setStatus('idle');
                return;
            }

            if (device?.name === DEVICE_NAME_TO_SCAN) {
                managerRef.current.stopDeviceScan();
                connectToDevice(device);
            }
        });
    }

    async function connectToDevice(device: Device) {
        setStatus('connecting');
        try {
            const connected = await device.connect();
            await connected.discoverAllServicesAndCharacteristics();
            setConnectedDevice(connected);
            setStatus('connected');
            monitorAudio(connected);
        } catch (error: any) {
            Alert.alert('Falha na Conexão', error.message);
            setStatus('disconnected');
        }
    }

    // Conexão Direta por ID
    async function connectDirectly() {
        if (!targetDeviceId) {
            Alert.alert('Erro', 'Por favor, insira um ID de dispositivo (Endereço MAC).');
            return;
        }
        const permissionsGranted = await requestPermissions();
        if (!permissionsGranted) return;

        console.log(`Tentando conectar diretamente ao dispositivo: ${targetDeviceId}`);
        setStatus('connecting');
        managerRef.current.stopDeviceScan();

        try {
            const device = await managerRef.current.connectToDevice(targetDeviceId);
            await device.discoverAllServicesAndCharacteristics();
            setConnectedDevice(device);
            setStatus('connected');
            monitorAudio(device);
        } catch (error: any) {
            Alert.alert(
                'Falha na Conexão Direta',
                `Não foi possível conectar ao dispositivo ${targetDeviceId}. Verifique se ele está ligado e ao alcance.`
            );
            setStatus('disconnected');
        }
    }

    function monitorAudio(device: Device) {
        monitorSubscription.current = device.monitorCharacteristicForService(
            SERVICE_UUID,
            CHAR_UUID_RX,
            (error, characteristic) => {
                if (error) {
                    console.error('Erro no monitoramento:', error);
                    return;
                }
                if (characteristic?.value) {
                    const buffer = Buffer.from(characteristic.value, 'base64');
                    const newSamples: number[] = [];
                    for (let i = 0; i < buffer.length; i += 2) {
                        if (buffer.length >= i + 2) {
                            newSamples.push(buffer.readInt16LE(i));
                        }
                    }
                    setAudioSamples((prevSamples) => [...prevSamples, ...newSamples].slice(-500)); // Mantém as últimas 500 amostras
                }
            }
        );
    }

    async function handleDisconnect(initiatedByUser = true) {
        if (monitorSubscription.current) {
            monitorSubscription.current.remove();
            monitorSubscription.current = null;
        }
        if (connectedDevice && initiatedByUser) {
            await connectedDevice.cancelConnection();
        }
        setConnectedDevice(null);
        setAudioSamples([]);
        setStatus('disconnected');
    }

    // --- Renderização do Componente ---

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Monitor de Áudio BLE</Text>

            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                    Status: <Text style={{ fontWeight: 'bold' }}>{status}</Text>
                </Text>
                <Text style={styles.statusText}>Dispositivo: {connectedDevice?.name || 'N/A'}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Conectar por ID (Endereço MAC)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: 1A:2B:3C:4D:5E:6F"
                    value={targetDeviceId}
                    onChangeText={setTargetDeviceId}
                    autoCapitalize="characters"
                    editable={status !== 'connecting' && status !== 'connected'}
                />
                <Button
                    title={status === 'connected' ? 'Desconectar' : 'Conectar por ID'}
                    onPress={() => (connectedDevice ? handleDisconnect() : connectDirectly())}
                    disabled={status === 'connecting' || status === 'scanning'}
                    color={status === 'connected' ? '#c44' : '#007AFF'}
                />
            </View>

            <Text style={styles.orText}>— OU —</Text>

            <View style={styles.card}>
                <Button
                    title="Procurar Dispositivo por Nome"
                    onPress={startScan}
                    disabled={status !== 'idle' && status !== 'disconnected'}
                />
            </View>

            <View style={styles.samplesContainer}>
                <Text style={styles.label}>Amostras de Áudio Recebidas</Text>
                <ScrollView style={styles.samplesScrollView}>
                    <Text style={styles.samplesText}>{audioSamples.join(', ')}</Text>
                </ScrollView>
            </View>
        </View>
    );
}

// --- Folha de Estilos ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 20,
    },
    statusContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    statusText: {
        fontSize: 16,
        color: '#555',
    },
    card: {
        width: '100%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
        fontWeight: '600',
        color: '#333',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 15,
        textAlign: 'center',
        borderRadius: 5,
        fontSize: 16,
    },
    orText: {
        marginVertical: 15,
        color: '#888',
        fontSize: 16,
    },
    samplesContainer: {
        flex: 1,
        width: '100%',
        marginTop: 20,
    },
    samplesScrollView: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#fff',
    },
    samplesText: {
        fontSize: 14,
        color: '#666',
    },
});
