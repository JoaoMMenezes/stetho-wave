import { type SQLiteDatabase } from 'expo-sqlite';
import { dummyPatients, dummyMeterings } from './dummyData';

export async function initializeDatabase(database: SQLiteDatabase) {
    const resetDatabase = false;

    if (resetDatabase) {
        await database.execAsync(`DROP TABLE IF EXISTS metering;`);
        await database.execAsync(`DROP TABLE IF EXISTS patient;`);
    }

    await database.execAsync(`
        CREATE TABLE IF NOT EXISTS patient (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            marital_status TEXT,
            address TEXT,
            observations TEXT
        );
    `);

    await database.execAsync(`
        CREATE TABLE IF NOT EXISTS metering (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            data TEXT NOT NULL,
            audio_uri TEXT,
            observations TEXT,
            tag TEXT CHECK (tag IN ('red', 'green', 'blue')),
            FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE
        );
    `);

    if (resetDatabase) {
        // Inserir pacientes
        dummyPatients.forEach(async (patient) => {
            await database.runAsync(
                `INSERT INTO patient (name, age, marital_status, address, observations)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    patient.name,
                    patient.age,
                    patient.marital_status,
                    patient.address,
                    patient.observations,
                ]
            );
        });

        console.log('Banco de dados inicializado com dados de teste.');
    }
}
