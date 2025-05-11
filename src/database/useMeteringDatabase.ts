import { useSQLiteContext } from 'expo-sqlite';

export type Metering = {
    id: number;
    patient_id: number;
    date: string;
    data: string;
    tag: 'red' | 'yellow' | 'green' | 'blue';
};

export function useMeteringDatabase() {
    const database = useSQLiteContext();

    async function create(metering: Omit<Metering, 'id'>) {
        const statement = await database.prepareAsync(`
            INSERT INTO metering (patient_id, date, data, tag)
            VALUES ($patient_id, $date, $data, $tag)
        `);

        try {
            const result = await statement.executeAsync({
                $patient_id: metering.patient_id,
                $date: metering.date,
                $data: JSON.stringify(metering.data),
                $tag: metering.tag,
            });

            return result.lastInsertRowId.toLocaleString();
        } catch (error) {
            throw error;
        }
    }

    async function update(id: number, metering: Metering) {
        const statement = await database.prepareAsync(`
            UPDATE metering
            SET 
                patient_id = $patient_id,
                date = $date,
                data = $data,
                tag = $tag
            WHERE id = $id
        `);
        try {
            await statement.executeAsync({
                $id: id,
                $patient_id: metering.patient_id,
                $date: metering.date,
                $data: JSON.stringify(metering.data),
                $tag: metering.tag,
            });
        } catch (error) {
            throw error;
        }
    }

    async function remove(id: number) {
        try {
            await database.runAsync(`DELETE FROM metering WHERE id = ?`, [id]);
        } catch (error) {
            throw error;
        }
    }

    async function get(id: number): Promise<Metering | null> {
        try {
            const result = await database.getFirstAsync<Metering>(
                `SELECT * FROM metering WHERE id = ?`,
                [id]
            );
            return result ? { ...result, data: JSON.parse(result.data) } : null;
        } catch (error) {
            throw error;
        }
    }

    async function searchByPatientId(patientId: number) {
        try {
            const result = await database.getAllAsync<Metering>(
                `SELECT * FROM metering WHERE patient_id = ? ORDER BY date DESC`,
                [patientId]
            );
            return result.map((row) => ({
                ...row,
                data: JSON.parse(row.data), // desserializa aqui
            }));
        } catch (error) {
            throw error;
        }
    }

    async function getAll(): Promise<Metering[]> {
        try {
            const result = await database.getAllAsync<Metering>(
                `SELECT * FROM metering ORDER BY date DESC`
            );
            return result.map((row) => ({
                ...row,
                data: JSON.parse(row.data),
            }));
        } catch (error) {
            throw error;
        }
    }

    return { create, update, remove, get, searchByPatientId, getAll };
}
