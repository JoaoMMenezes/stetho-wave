# Stetho Wave 📱🔊

Stetho Wave é um aplicativo mobile desenvolvido por **João Pedro Maduro Menezes** como parte de seu **Trabalho de Conclusão de Curso (TCC) no certificado de Engenharia da Computação**, vinculado ao curso de Engenharia Elétrica da Escola de Engenharia da **Universidade Federal de Minas Gerais (UFMG)**. O projeto tem como objetivo facilitar a ausculta médica digital, integrando um estetoscópio eletrônico via Bluetooth para permitir a aquisição, organização e visualização dos sinais auscultados diretamente no celular.

---

## 🩺 Objetivo do Projeto

Este projeto busca explorar tecnologias móveis para melhorar o processo de coleta e análise de sons corporais, como batimentos cardíacos e sons respiratórios, oferecendo uma interface intuitiva para profissionais da saúde e pesquisadores.

---

## 🚀 Tecnologias Utilizadas

-   **React Native com Expo**
-   **TypeScript**
-   **SQLite** (armazenamento local)
-   **Bluetooth Low Energy (BLE)**
-   **Gráficos usando SKIA**

---

## ⚙️ Funcionalidades

-   🔎 **Visualização de auscultas anteriores** agrupadas por data (hoje, ontem, etc.).
-   📊 **Exibição gráfica** dos dados dos sinais adquiridos.
-   🧑‍⚕️ **Gerenciamento de pacientes** com múltiplas consultas por paciente.
-   🎙️ **Aquisição de dados** de áudio de um estetoscópio digital via Bluetooth.
-   ✏️ **Edição e anotação de observações** sobre cada ausculta.
-   🏷️ **Classificação por tags** (vermelho, verde, azul) para facilitar a triagem.

---

## 🧪 Como funciona

O aplicativo permite ao usuário:

1. Iniciar uma nova ausculta utilizando um estetoscópio digital conectado via Bluetooth.
2. Salvar os dados capturados, que são processados e exibidos como gráficos.
3. Associar cada ausculta a um paciente, com data e observações.
4. Consultar e filtrar auscultas anteriores por data e categoria.
5. Armazenar tudo localmente.

---

## 📸 Telas principais

-   **Home** – Lista de auscultas agrupadas por data.
-   **Nova Ausculta** – Tela para iniciar uma nova gravação.
-   **Pacientes** – Cadastro e gerenciamento de pacientes.
