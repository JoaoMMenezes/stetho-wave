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

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    source: 'mic' | 'ble';
    onSourceChange: (source: 'mic' | 'ble') => void;
    // Atualizado para passar o valor da senoide, se necessário, ou apenas notificar a conexão
    onDeviceConnected: (device: Device) => void; // Callback quando o dispositivo conectar
    onSineValueUpdate: (newSamples: number[]) => void; // Callback para atualizar o valor da senoide no componente pai
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
    source,
    onSourceChange,
    onDeviceConnected, // Renomeado para clareza
    onSineValueUpdate,
}: SettingsModalProps) {
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    // const [sineValue, setLastSampleValue] = useState(0); // Estado para o valor da senoide
    const [lastSampleValue, setLastSampleValue] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // Limpeza de recursos ao desmontar o componente
    useEffect(() => {
        return () => {
            // Não destrua o bleManager aqui se ele for usado em outros lugares.
            // Se este modal é o único lugar que usa BLE, então está OK.
            // Considere mover a inicialização e destruição do bleManager para um nível mais alto
            // se múltiplos componentes precisarem dele.
            // bleManager.destroy(); // Comentado por precaução, gerencie o ciclo de vida do manager conforme sua app
            console.log('SettingsModal desmontado');
        };
    }, []);

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
                    // setLastSampleValue(0);
                    setLastSampleValue(0);
                    // Notificar o componente pai se necessário
                }
            );
            return () => subscription.remove();
        }
    }, [connectedDevice]);

    /**
     * Solicita permissões necessárias para BLE no Android
     * @returns true se as permissões foram concedidas, false caso contrário
     */
    async function requestPermissions() {
        if (Platform.OS === 'android') {
            const SdkVersion = Platform.Version; // Precisa ser >= 31 para BLUETOOTH_SCAN/CONNECT
            let permissionsToRequest = [];
            if (SdkVersion >= 31) {
                permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
                permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
            } else {
                // Para SDK < 31, ACCESS_FINE_LOCATION é suficiente para scan,
                // e BLUETOOTH/BLUETOOTH_ADMIN para conexão (geralmente implícito).
                permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
                // Adicione BLUETOOTH e BLUETOOTH_ADMIN se necessário para versões mais antigas,
                // mas BLUETOOTH_CONNECT e SCAN são os novos.
            }
            // ACCESS_FINE_LOCATION é frequentemente necessário para scan BLE, mesmo em SDKs mais altos
            if (
                !permissionsToRequest.includes(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
            ) {
                permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            }

            if (permissionsToRequest.length > 0) {
                const granted = await PermissionsAndroid.requestMultiple(
                    permissionsToRequest as any
                ); // Type assertion
                const allGranted = Object.values(granted).every(
                    (v) => v === PermissionsAndroid.RESULTS.GRANTED
                );
                if (!allGranted) {
                    console.warn('Algumas permissões BLE não foram concedidas', granted);
                    return false;
                }
            }
        }
        return true;
    }

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
                                        const sample = dataView.getInt16(i, true); // O 'true' indica little-endian (correto)
                                        int16Samples.push(sample);
                                    }
                                } catch (e) {
                                    console.error('Erro ao processar os dados recebidos:', e);
                                }

                                // 2. CONVERTER OS DADOS DE int16 PARA PASCAL
                                const pascalSamples = int16Samples.map((sample) =>
                                    convertInt16SampleToPascal(sample)
                                );

                                if (pascalSamples.length > 0) {
                                    onSineValueUpdate(pascalSamples);
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
                // Parar monitoramento. O ID da transação deve ser o mesmo usado em monitorCharacteristicForService
                // await bleManager.cancelTransaction(`monitor-${CHARACTERISTIC_UUID}`);
                // console.log("Monitoramento cancelado."); // A biblioteca pode cancelar automaticamente na desconexão

                await connectedDevice.cancelConnection(); // Mais direto com o objeto Device
                // Ou: await bleManager.cancelDeviceConnection(connectedDevice.id);
                console.log('Desconexão solicitada para:', connectedDevice.name);
            } catch (error) {
                console.error('Erro ao desconectar:', error);
            } finally {
                setConnectedDevice(null);
                setIsConnected(false);
                setLastSampleValue(0);
                // Não precisa mais chamar onDeviceDisconnected aqui, o listener já faz isso.
            }
        } else {
            console.log('Nenhum dispositivo conectado para desconectar.');
        }
        setIsLoading(false); // Garante que o loading seja resetado
    }

    //================================================================
    // --- SEÇÃO DE CONVERSÃO ACÚSTICA (LADO DO CLIENTE) ---
    //================================================================

    // Sensibilidade do Microfone em dBFS para um sinal de 94 dB SPL.
    const MIC_SENSITIVITY_DBFS = -26.0;
    // Nível de Pressão Sonora de referência que gera o sinal acima.
    const REF_DB_SPL = 94.0;
    // Valor máximo para um inteiro de 16 bits com sinal (o formato que estamos recebendo).
    const FULL_SCALE_16_BIT = 32767.0;
    // Pressão de referência do ar em Pascal (limiar da audição).
    const REF_PRESSURE_PA = 20.0e-6;

    /**
     * Converte uma amostra de áudio de 16 bits para pressão em Pascal (Pa).
     * @param {number} sampleInt16 A amostra no formato int16 (-32768 a 32767).
     * @returns {number} A pressão sonora correspondente em Pascal.
     */
    const convertInt16SampleToPascal = (sampleInt16: any) => {
        if (sampleInt16 === 0) {
            return 0.0;
        }

        // 1. Converter a amostra para dBFS (Decibels relative to Full Scale de 16-bit)
        const dbfs = 20 * Math.log10(Math.abs(sampleInt16) / FULL_SCALE_16_BIT);

        // 2. Converter dBFS para dB SPL (Sound Pressure Level)
        const dbspl = REF_DB_SPL + (dbfs - MIC_SENSITIVITY_DBFS);

        // 3. Converter dB SPL para Pascal
        let pascals = REF_PRESSURE_PA * Math.pow(10, dbspl / 20);

        // 4. Reaplicar o sinal original da amostra
        if (sampleInt16 < 0) {
            pascals = -pascals;
        }

        return pascals;
    };

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
                                color={defaultTheme.colors.surface} // Ajuste a cor conforme seu tema
                            />
                        </Pressable>
                    </View>

                    <Text style={styles.fonteEntrada}>Fonte de entrada</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                        <Text>Microfone</Text>
                        <Switch
                            value={source === 'ble'}
                            onValueChange={(val) => onSourceChange(val ? 'ble' : 'mic')}
                            style={{ marginHorizontal: 10 }}
                            trackColor={{ false: '#767577', true: defaultTheme.colors.primary }}
                            thumbColor={source === 'ble' ? defaultTheme.colors.primary : '#f4f3f4'}
                        />
                        <Text>Bluetooth</Text>
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
                            {/* Se você tiver alguma ação para enviar ao ESP32, adicione um botão aqui */}
                            {/* <Button title="Pausar Senoide (Exemplo)" onPress={toggleSomeValue} /> */}
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
