import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Track from './Track.jsx';

// `describe` agrupa un conjunto de tests relacionados, en este caso, para el componente Track.
describe('Track', () => {
    // --- DATOS DE PRUEBA ---
    // Creamos un objeto de cancion simulado (mock) para usarlo en todos nuestros tests.
    // Esto asegura que las pruebas sean consistentes y dependan de datos reales.
    const mockTrack = {
        id: '1',
        name: 'Starboy',
        artist: 'The Weeknd',
        album: 'Starboy',
        uri: 'spotify:track:7MXVkk9YMctZqd1Srtv4MB'
    };

    // --- CASO DE PRUEBA 1: Renderizado Básico ---
    // 'it' define un caso de prueba individual.
    it('deberia renderizar la informacion de la cancion correctamente', () => {
        // `render()` dibuja el componente en un DOM virtual para poder inspeccionarlo.
        // Le pasamos las props mínimas necesarias para que el componente funcione.
        render(<Track track={mockTrack} />);

        // `screen.getByText (...)` busca un elemento que contenga el texto expecifico.
        // Usamos `expect().toBeInTheDocument()` para afirmar que estos elementos existen.
        expect(screen.getByText('Starboy')).toBeInTheDocument();
        expect(screen.getByText('The Weeknd | Starboy')).toBeInTheDocument();
    });

    // --- CASO DE PRUEBA 2: Funcionalidad de Añadir ---
    it('deberia renderizar un boton de "+" y llamar a onAdd al hacer clic si isRemoval es false', async () => {
        // `const user` inicializa el simulador de eventos de usuario.
        const user = userEvent.setup();

        // `vi.fn()` crea una funcion "espia" (mock) que podemos observar.
        // Nos permite verificar si fue llamada y con que argumentos.
        const handleAdd = vi.fn();

        // Renderizamos el componente en su modo "añadir".
        // `isRemoval` es `false`por defecto, pero lo hacemos explicito para mayor claridad.
        render(<Track track={mockTrack} onAdd={handleAdd} isRemoval={false} />);

        // Buscamos el boton por su rol y su contenido de texto ('+').
        const addButton = screen.getByRole('button', { name: '+' });
        expect(addButton).toBeInTheDocument();

        // `await user.click(...)` simula un clic del usuario en el botón.
        await user.click(addButton);

        // `expect().toHaveBeenCalledWith(...)` verifica que nuestra funcion espía `handleAdd`.
        // fue llamada exactamente con el objeto `mockTrack`.
        expect(handleAdd).toHaveBeenCalledWith(mockTrack);
    });

    // --- CASO DE PRUEBA 3: Funcionalidad de Eliminar ---
    it('deberia renderizar un botón de "-" y llamar a onRemove al hacer clic si isRemoval es true', async () => {
        const user = userEvent.setup();
        const handleRemove = vi.fn();

        // Renderizamos el componente en su modo "eliminar", pasando `isRemoval={true}`.
        render(<Track track={mockTrack} onRemove={handleRemove} isRemoval={true} />);

        // Buscamos el botón por su contenido de texto ('-').
        const removeButton = screen.getByRole('button', { name: '-' });
        expect(removeButton).toBeInTheDocument();

        // Simulamos un clic del usuario.
        await user.click(removeButton);

        // Verificamos que la funcion `handleRemove` fue llamada con el objeto `mockTrack`.
        expect(handleRemove).toHaveBeenCalledWith(mockTrack);
    });
}); //Cierra el test Track.