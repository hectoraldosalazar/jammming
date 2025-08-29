import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import Spotify from '../../util/Spotify';

// Mockeamos el módulo completo de Spotify, Esto nos da control sobre todas sus funciones.
vi.mock('../../util/Spotify');

describe('Pruebas de integración para el Componente App', () => {
    const user = userEvent.setup();

    // --- DATOS DE PRUEBA ---
    const mockSearchResults = [
        { id: '1', name: 'Test Song 1', artist: 'Artist 1', album: 'Album 1', uri: 'uri1' },
        { id: '2', name: 'Test Song 2', artist: 'Artist 2', album: 'Album 2', uri: 'uri2' },
    ];
    const trackToAdd = mockSearchResults[0];

    // Antes de cada prueba, resetamos los mocks y simulamos window.alert
    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(window, 'alert').mockImplementation(() => {});
    });

    describe('Flujo de Autenticación', () => {
        it('debería renderizar la vista de login si no hay token de acceso', async () => {
            // ARRANGE: Simulamos que getAccessToken devuelve null.
            Spotify.getAccessToken.mockResolvedValue(null);

            // ACT: Renderizamos la App.
            render(<App />);

            // ASSERT: Verificamos que el botón de login está presente y la app principal no.
            expect(screen.getByRole('button', { name: /conectar con spotify/i })).toBeInTheDocument();
            expect(screen.queryByPlaceholderText(/enter a song/i)).not.toBeInTheDocument(); 
        });

        it('debería llamar a redirectToSpotifyAuth al hacer clic en el botón de login', async () => {
            // ARRANGE:
            Spotify.getAccessToken.mockResolvedValue(null);
            render(<App />);
            const loginButton = screen.getByRole('button', { name: /conectar con spotify/i });

            // ACT
            await user.click(loginButton);

            // ASSERT
            expect(Spotify.redirectToSpotifyAuth).toHaveBeenCalledTimes(1);
        });

        it('debería renderizar la app principal si esta autenticado', async () => {
            // ARRANGE: Simulamos que getAccessToken devuelve un token válido.
            Spotify.getAccessToken.mockResolvedValue('fake-token');

            // ACT
            render(<App />);

            // ASSERT: Usamos waitFor para esperar el cambio de estado asíncrono del useEffect.
            await waitFor(() => {
                expect(screen.getByPlaceholderText(/enter a song/i)).toBeInTheDocument();
            });
            expect(screen.queryByRole('button', { name: /conectar con spotify/i})).not.toBeInTheDocument();
        });
    }); // Cierra el descibe 'Flujo de Autenticación'

    describe('Funcionalidad Principal de la App (Autenticación)', () => {
        // Para todas las pruebas en este bloque, aseguramos que el usuario esté autenticado.
        beforeEach(() => {
            Spotify.getAccessToken.mockResolvedValue('fake-token');
        });
        
        it('permite el flujo completo: buscar, añadir, renombrar, guardar y eliminar', async () => {
            // ARRANGE: Preparamos las respuestas simuladas de la API.
            Spotify.search.mockResolvedValue(mockSearchResults);
            Spotify.savePlaylist.mockResolvedValue();

            // ACT
            render(<App />);

            // Esperamos a que la app esté en modo autenticado.
            await waitFor(() => expect(screen.getByText('Results')).toBeInTheDocument());

            // --- 1. BUSCAR una canción ---
            const searchInput = screen.getByPlaceholderText(/enter a song/i);
            const searchButton = screen.getByRole('button', { name: /search/i });

            await user.type(searchInput, 'Daft Punk');
            await user.click(searchButton);

            // ASSERT: Verificamos que se llamo a la API y se muestran los resultados.
            expect(Spotify.search).toHaveBeenCalledWith('Daft Punk');
            const addButtons = await screen.findAllByRole('button', { name: '+' });
            expect(addButtons).toHaveLength(mockSearchResults.length);
            expect(screen.getByText('Test Song 1')).toBeInTheDocument();

            // --- 2. AÑADIR una canción a la playlist ---
            await user.click(addButtons[0]);

            // ASSERT (AÑADIR): Verificar que la canción se agregó correctamente a la playlist.
            const playlistContainer = screen.getByText('SAVE TO SPOTIFY').closest('.Playlist');
            expect(playlistContainer).toHaveTextContent('Test Song 1');
            const removeButton = await screen.findByRole('button', { name: '-' });
            expect(removeButton).toBeInTheDocument();

            // --- 3. RENOMBRAR la playlist ---
            const playlistNameInput = screen.getByDisplayValue('New Playlist');
            await user.clear(playlistNameInput);
            await user.type(playlistNameInput, 'My Awesome Mix');

            // ASSERT (RENOMBRAR): El valor del input debe cambiar.
            expect(playlistNameInput).toHaveValue('My Awesome Mix');

            // --- 4. GUARDAR la playlist ---
            const saveButton = screen.getByRole('button', { name: /save to spotify/i });
            await user.click(saveButton);

            // ASSERT (GUARDAR): Verificamos que se llamó a la API y que la UI se reseteó.
            expect(Spotify.savePlaylist).toHaveBeenCalledWith('My Awesome Mix', [trackToAdd.uri]);
            await waitFor(() => {
                expect(screen.getByDisplayValue('New Playlist')).toBeInTheDocument();
                expect(playlistContainer).not.toHaveTextContent('Test Song 1');
            });
            expect(window.alert).toHaveBeenCalledWith('Playlist "My Awesome Mix" guardada exitosamente!');

            // --- 5. ELIMINAR una canción (la añadimos de nuevo para probar) ---
            const newAddButtons = await screen.findAllByRole('button', { name: '+' });
            await user.click(newAddButtons[0]); // Añadir canción de nuevo.
            const newRemoveButton = await screen.findByRole('button', { name: '-' });

            await user.click(newRemoveButton);

            // ASSERT (ELIMINAT): La canción ya no debe estar en la playlist.
            expect(playlistContainer).not.toHaveTextContent('Test Song 1');
        });
    })// Cierra el describe Funcionalidad Principal de la App (Autenticación).
}) // Cierra el describe Pruebas de integracion para el componente App.