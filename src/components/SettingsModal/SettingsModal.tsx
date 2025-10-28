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
import { BleManager, Device, Characteristic } from 'react-native-ble-plx'; // Import Characteristic
import { Base64 } from 'js-base64'; // js-base64 para decodificar
import { styles } from './_layout'; // Supondo que seus estilos estão aqui
import { MaterialIcons } from '@expo/vector-icons';
import { defaultTheme } from '@/themes/default'; // Supondo que seu tema está aqui
import { requestPermissions } from '@/utils/bleUtils';
import { convertInt16SampleToPascal } from '@/utils/audioUtils';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    onDeviceConnected: (device: Device) => void;
    handleDataStream: (newSamples: number[]) => void;
    handleRawAudioStream: (rawSamples: number[]) => void;
}

// UUIDs do seu ESP32 (conforme o firmware da senoide)
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'; // Renomeado para clareza
const TARGET_DEVICE_NAME = 'ESP32_Audio_Stream'; // Nome do seu dispositivo ESP32

// Instância única do BleManager
const bleManager = new BleManager();

export default function SettingsModal({
    visible,
    onClose,
    onDeviceConnected,
    handleDataStream,
    handleRawAudioStream,
}: SettingsModalProps) {
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastSampleValue, setLastSampleValue] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // Efeito para lidar com a desconexão do dispositivo
    useEffect(() => {
        if (connectedDevice) {
            const subscription = bleManager.onDeviceDisconnected(
                connectedDevice.id,
                (error, device) => {
                    if (error) {
                        console.warn('Erro na desconexão:', error);
                    }
                    console.log('Dispositivo desconectado:', device?.name);
                    setIsConnected(false);
                    setConnectedDevice(null);
                    setLastSampleValue(0);
                }
            );
            return () => subscription.remove();
        }
    }, [connectedDevice]);

    /**
     * Conecta ao dispositivo BLE e inicia o monitoramento do valor recebido
     */
    async function connectAndMonitorDevice() {
        console.log('Tentando conectar ao dispositivo...');
        if (isConnected || isScanning) {
            console.warn('Já conectado ou escaneando.');
            return;
        }

        const permissionsGranted = await requestPermissions();
        if (!permissionsGranted) {
            console.warn('Permissões não concedidas. Não é possível escanear.');
            setIsLoading(false);
            setIsScanning(false);
            return;
        }
        console.log('Permissões concedidas.');

        setIsScanning(true);
        setIsLoading(true);

        bleManager.startDeviceScan(null, null, async (error, device) => {
            if (error) {
                console.warn('Erro ao escanear:', error);
                bleManager.stopDeviceScan();
                setIsScanning(false);
                setIsLoading(false);
                return;
            }

            console.log('Dispositivo encontrado:', device?.name, device?.id);

            if (device?.name === TARGET_DEVICE_NAME) {
                console.log(`Dispositivo alvo ${TARGET_DEVICE_NAME} encontrado!`);
                bleManager.stopDeviceScan();
                setIsScanning(false);

                try {
                    console.log('Conectando a:', device.name);
                    // Nota: device.connect() pode demorar. O estado isLoading já está true.
                    const connectedDev = await device.connect();
                    console.log('Conectado com sucesso a:', connectedDev.name);

                    // Solicita um MTU maior para otimizar a transferência de dados. 517 é o máximo para ESP32.
                    try {
                        await connectedDev.requestMTU(517);
                        console.log('MTU negociado com sucesso.');
                    } catch (mtuError) {
                        console.warn('Falha ao negociar MTU:', mtuError);
                    }

                    setConnectedDevice(connectedDev); // Armazena o objeto do dispositivo conectado
                    setIsConnected(true);
                    setIsLoading(false); // Conexão estabelecida, para o loading principal

                    console.log('Descobrindo serviços e características...');
                    await connectedDev.discoverAllServicesAndCharacteristics();
                    console.log('Serviços e características descobertos.');

                    // Notificar o componente pai sobre a conexão
                    onDeviceConnected(connectedDev);

                    // Monitorar a característica para atualizações da senoide
                    console.log('Iniciando monitoramento da característica...');
                    const subscriptionId = `monitor-${CHARACTERISTIC_UUID}`; // ID único para a transação
                    const subscription = connectedDev.monitorCharacteristicForService(
                        SERVICE_UUID,
                        CHARACTERISTIC_UUID,
                        (err, characteristic) => {
                            if (err) {
                                console.warn('Erro no monitoramento:', err.message);
                                return;
                            }

                            if (characteristic?.value) {
                                // 1. DECODIFICAR OS DADOS PARA UM ARRAY DE INTEIROS DE 16-BIT
                                const byteArray = Base64.toUint8Array(characteristic.value);
                                const dataView = new DataView(byteArray.buffer);
                                const int16Samples = [];

                                try {
                                    // Lê o buffer de 2 em 2 bytes para obter os inteiros
                                    for (let i = 0; i < dataView.byteLength; i += 2) {
                                        const sample = dataView.getInt16(i, true);
                                        int16Samples.push(sample);
                                    }
                                } catch (e) {
                                    console.error('Erro ao processar os dados recebidos:', e);
                                }

                                // 2. CONVERTER OS DADOS DE int16 PARA PASCAL
                                const pascalSamples = int16Samples.map((sample) =>
                                    convertInt16SampleToPascal(sample)
                                );

                                // 3. ENVIAR DADOS CONVERTIDOS (PASCAL) PARA O GRÁFICO
                                if (pascalSamples.length > 0) {
                                    handleDataStream(pascalSamples);

                                    // (Bônus: Atualiza o valor de amostra no modal)
                                    setLastSampleValue(pascalSamples[pascalSamples.length - 1]);
                                }

                                // 4. ENVIAR DADOS BRUTOS (INT16) PARA A GRAVAÇÃO DE ÁUDIO
                                if (int16Samples.length > 0) {
                                    handleRawAudioStream(int16Samples); // <-- ADICIONE ESTA LINHA
                                }
                            }
                        },
                        `monitor-${CHARACTERISTIC_UUID}` // ID da transação
                    );
                    console.log(`Monitoramento iniciado com ID: ${subscriptionId}`);
                } catch (connectionError) {
                    console.error('Erro na conexão ou descoberta:', connectionError);
                    setIsLoading(false); // Para o loading em caso de erro
                    setIsConnected(false);
                    setConnectedDevice(null);
                    // Tentar limpar se o device foi parcialmente conectado
                    if (device) {
                        try {
                            await bleManager.cancelDeviceConnection(device.id);
                        } catch (cancelError) {
                            console.error('Erro ao cancelar conexão após falha:', cancelError);
                        }
                    }
                }
            }
        });

        setTimeout(() => {
            if (isScanning) {
                // Só para o scan se ainda estiver escaneando
                console.log('Timeout do scan, parando o scan.');
                bleManager.stopDeviceScan();
                setIsScanning(false);
                if (isLoading && !isConnected) {
                    // Se estava carregando e não conectou
                    setIsLoading(false);
                }
            }
        }, 15000);
    }

    async function disconnectFromDevice() {
        console.log('Tentando desconectar...');
        if (connectedDevice) {
            try {
                await connectedDevice.cancelConnection();
                console.log('Desconexão solicitada para:', connectedDevice.name);
            } catch (error) {
                console.error('Erro ao desconectar:', error);
            } finally {
                setConnectedDevice(null);
                setIsConnected(false);
                setLastSampleValue(0);
            }
        } else {
            console.log('Nenhum dispositivo conectado para desconectar.');
        }
        setIsLoading(false);
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

                    {isLoading && (
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                            <ActivityIndicator size="large" color={defaultTheme.colors.primary} />
                            <Text style={{ marginTop: 10 }}>
                                {isScanning ? 'Procurando ESP32...' : 'Conectando...'}
                            </Text>
                        </View>
                    )}

                    {!isLoading && isConnected && connectedDevice && (
                        <View style={styles.connectedInfo}>
                            <Text style={{ fontWeight: 'bold' }}>
                                Conectado a: {connectedDevice.name}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 18,
                                    marginVertical: 10,
                                }}
                            >
                                Valor: {lastSampleValue.toFixed(2)}
                            </Text>
                            <Button
                                title="Desconectar do ESP32"
                                onPress={disconnectFromDevice}
                                color={defaultTheme.colors.error}
                            />
                        </View>
                    )}

                    {!isLoading && !isConnected && (
                        <Button
                            title="Conectar ao ESP32"
                            onPress={connectAndMonitorDevice}
                            disabled={isScanning || isLoading}
                            color={defaultTheme.colors.primary}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}
