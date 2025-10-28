import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Solicita permissões necessárias para BLE no Android
 * @returns true se as permissões foram concedidas, false caso contrário
 */
export async function requestPermissions() {
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
        if (!permissionsToRequest.includes(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)) {
            permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        }

        if (permissionsToRequest.length > 0) {
            const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest as any); // Type assertion
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
