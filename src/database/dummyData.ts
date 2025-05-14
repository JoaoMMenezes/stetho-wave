// dummyData.ts

export const dummyPatients = [
    {
        name: 'Maria Souza',
        age: 28,
        marital_status: 'Solteira',
        address: 'Rua das Flores, 123',
        observations: 'Paciente saudável',
    },
    {
        name: 'João Silva',
        age: 45,
        marital_status: 'Casado',
        address: 'Av. Brasil, 456',
        observations: 'Paciente com hipertensão',
    },
    {
        name: 'Ana Oliveira',
        age: 34,
        marital_status: 'Divorciada',
        address: 'Rua do Sol, 789',
        observations: 'Sintomas recorrentes',
    },
    {
        name: 'Carlos Pereira',
        age: 52,
        marital_status: 'Viúvo',
        address: 'Rua das Palmeiras, 321',
        observations: 'Histórico de asma',
    },
    {
        name: 'Beatriz Lima',
        age: 40,
        marital_status: 'Casada',
        address: 'Av. Central, 654',
        observations: 'Paciente em acompanhamento',
    },
];

const exampleData =
    '"[160,160,160,156,120,117,111,104,101,110,106,108,110,107,71,27,90,100,104,102,105,108,112,104,106,116,104,112,121,108,112,116,110,74,23,94,102,106,112,109,101,113,109,112,120,107,109,104,121,104,111,14,68,91,103,103,106,107,110,107,110,115,111,113,106,114,107,111,89,106,110,160,160,160,160,160,0]"';

// Gera 3 medições para cada um dos últimos 5 dias (3 x 5 = 15)
const now = new Date();
export const dummyMeterings = Array.from({ length: 15 }, (_, i) => {
    const dayOffset = Math.floor(i / 3); // muda a cada 3 gravações
    const date = new Date(now);
    date.setDate(now.getDate() - dayOffset);
    return {
        data: exampleData,
        date: date.toISOString(),
        observations: `Observação ${i + 1}`,
        tag: ['red', 'green', 'blue'][i % 3],
        patientIndex: i % 5, // associa com os 5 pacientes (0–4)
    };
});
