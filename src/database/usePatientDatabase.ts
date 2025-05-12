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

    async function update(id: number, data: Omit<Patient, 'id'>) {
        const statement = await database.prepareAsync(`
            UPDATE patient
            SET name = $name,
                age = $age,
                marital_status = $maritalStatus,
                address = $address,
                observations = $observations
            WHERE id = $id
        `);

        try {
            await statement.executeAsync({
                $id: id,
                $name: data.name,
                $age: data.age,
                $maritalStatus: data.maritalStatus,
                $address: data.address,
                $observations: data.observations,
            });
        } catch (error) {
            throw error;
        }
    }

    async function remove(id: number) {
        try {
            await database.runAsync(`DELETE FROM patient WHERE id = ?`, [id]);
        } catch (error) {
            throw error;
        }
    }

    async function get(id: number): Promise<Patient | null> {
        try {
            const result = await database.getFirstAsync<Patient>(
                `SELECT * FROM patient WHERE id = ?`,
                [id]
            );
            return result ?? null;
        } catch (error) {
            throw error;
        }
    }

    async function searchByName(name: string): Promise<Patient[]> {
        try {
            const result = await database.getAllAsync<Patient>(
                `SELECT * FROM patient WHERE name LIKE ?`,
                [`%${name}%`]
            );
            return result;
        } catch (error) {
            throw error;
        }
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

    return { create, update, remove, get, searchByName, getAll };
}
