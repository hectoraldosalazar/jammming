import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Playlist from './Playlist';


// Para probar Playlist de forma aislada, simulamos (mock) su componente hijo, TrackList.
// Esto nos permite verificar que Playlist le pasa los props correctos a TrackList.
// sin depender de como funciona internamente TrackList.
vi.mock('../TrackList/TrackList', () => ({
    default: (props) => (
        <div data-testid="mock-tracklist">
            {/* Podemos usar este mock para verificar las props que recibe */ }
            <span data-testid="tracklist-tracks-count">{props.tracks.length}</span>
            <span data-testid="tracklist-is-removal">{String(props.isRemoval)}</span>
        </div>
    )
}));

describe('Playlist', () => {
    // --- DATOS DE PRUEBA ---
    const mockTracks = [
        { id: '3', name: 'Instant Crush', artist: 'Daft Punk', album: 'Random Access Memories' },
        { id: '4', name: 'Get Lucky', artist: 'Daft Punk', album: 'Random Access Memories' },
    ];

    // --- CASO DE PRUEBA 1: Renderizado inicial y paso de props ---
    it('debería renderizar el input con el nombre de playlist y pasar las props correctas a Tracklist', () => {
        // ARRANGE: Preparamos las props que le daremos al componente.
        const playlistName = 'My Funcky Mix';

        // ACT: Renderizamos el componente Playlist con las props.
        render(<Playlist playlistTracks={mockTracks} playlistName={playlistName} />);

        // ASSERT: Verificamos que todo se renderizo como esperamos.
        // 1. El input debe tener el valor del nombre de la playlist.
        const inputElement = screen.getByRole('textbox');
        expect(inputElement).toHaveValue(playlistName);

        // 2. El botón de guardar debe estar presente.
        expect(screen.getByRole('button', { name: /save to spotify/i})).toBeInTheDocument();

        // 3. El mock de Tracklist recibió la cantidad correcta de canciones.
        expect(screen.getByTestId('tracklist-tracks-count')).toHaveTextContent(mockTracks.length.toString());

        // 4. El mock de Tracklist recibió la prop `isRemoval={true}`.
        expect(screen.getByTestId('tracklist-is-removal')).toHaveTextContent('true');
    });

    // --- CASO DE PRUEBA 2: Interaccion con el input ---
    it('debería llamar a onNameChange cuando el usuario escribe en el input', async () => {
        // ARRANGE:
        const user = userEvent.setup();
        // Creamos una función "espía" para la prop onNameChange.
        const handleNameChange = vi.fn();
        render(<Playlist onNameChange={handleNameChange} playlistTracks={[]} />);
        const inputElement = screen.getByRole('textbox');

        // ACT: Simulamos que el usuario escribe "New Name" en el input.
        await user.type(inputElement, 'New Name');

        // ASSERT: Verificamos que nuestra funcion espia fue llamada con el valor correcto.
        // `onNameChange` se llama con cada letra, así que verificamos la última llamada.
        expect(handleNameChange).toHaveBeenCalledWith('New Name');
    });

    // --- CASO DE PRUEBA 3: Interacción con el botón de guardar ---
    it('deberia llamar a onSave cuando se hace clic en el botón "SAVE TO SPOTIFY" ', async () => {
        // ARRANGE:
        const user = userEvent.setup();
        // Creamos una función "espía" para la prop onSave.
        const handleSave = vi.fn();
        render(<Playlist onSave={handleSave} playlistTracks={mockTracks} />);
        const saveButton = screen.getByRole('button', { name: /save to spotify/i});

        // ACT: Simulamos que el usuario hace clic en el botón de guardar.
        await user.click(saveButton);

        // ASSERT: Verificamos que la funcion espía fue llamada una vez.
        expect(handleSave).toHaveBeenCalledTimes(1);
    });
}); // Cierra el describe de Playlist.

