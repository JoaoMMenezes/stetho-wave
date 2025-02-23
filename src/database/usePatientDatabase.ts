import { useSQLiteContext } from 'expo-sqlite';

export type Patient = {
    id: number;
    name: string;
    age: number;
    maritalStatus: string;
    address: string;
    observations: string;
};

export function usePatientDatabase() {
    const database = useSQLiteContext();

    async function create(data: Omit<Patient, 'id'>) {
        const statement = await database.prepareAsync(`
            INSERT INTO patient (name, age, marital_status, address, observations)
            VALUES ($name, $age, $maritalStatus, $address, $observations)
        `);

        try {
            const result = await statement.executeAsync({
                $name: data.name,
                $age: data.age,
                $maritalStatus: data.maritalStatus,
                $address: data.address,
                $observations: data.observations,
            });

            return result.lastInsertRowId.toLocaleString();
        } catch (error) {
            throw error;
        }
    }

    async function update(data: Patient) {
        // Implementar
    }

    async function remove(id: number) {
        // Implementar
    }

    async function get(id: number) {
        // Implementar
    }

    async function getAll() {
        try {
            const result = await database.getAllAsync(`
                SELECT * FROM patient;
            `);
            return result;
        } catch (error) {
            throw error;
        }
    }

    return { create, update, remove, get, getAll };
}
