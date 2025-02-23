import { type SQLiteDatabase } from 'expo-sqlite';

export async function initializeDatabase(database: SQLiteDatabase) {
    // await database.execAsync(`
    //     DROP TABLE IF EXISTS patient;
    // `);

    // await database.execAsync(`
    //     DROP TABLE IF EXISTS metering;
    // `);

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
            FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE
        );
    `);
}
