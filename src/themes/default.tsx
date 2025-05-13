export const defaultTheme = {
    colors: {
        primary: '#228be6',
        secondary: '#4dabf7',
        background: '#a5d8ff',
        surface: 'white',
        text: {
            primary: '#212121',
            secondary: '#757575',
            disabled: '#bdbdbd',
            inverse: '#ffffff',
        },
    },
    spacing: (factor: number) => `${factor * 8}px`,
    borderRadius: '4px',
    typography: {
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        fontSize: '16px',
        fontWeight: {
            regular: 400,
            medium: 500,
            bold: 700,
        },
    },
    shadows: [
        'none',
        '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)',
        '0px 3px 6px rgba(0,0,0,0.16), 0px 3px 6px rgba(0,0,0,0.23)',
    ],
};
