import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchResults from './SearchResults';

// Al igual que en otras pruebas, simulamos (mock) el componente hijo de Tracklist.
// para aislar nuestro componente SearchResults y probarlo de forma independiente.
vi.mock('../TrackList/TrackList', () => ({
    default: (props) => (
        <div data-testid="mock-tracklist">
            {/* Exponemos las props que recibe el mock para poder verificarlas en nuestras pruebas. */}
            <span data-testid="tracklist-tracks-count">{props.tracks.length}</span>
            <span data-testid="tracklist-is-removal">{String(props.isRemoval)}</span>
        </div>
    )
}));

describe('SearchResults', () => {
    // --- DATOS DE PRUEBA ---
    const mockSearchResults = [
        { id: '1', name: 'Song A', artist: 'Artist A', album: 'Album A' },
        { id: '2', name: 'Song B', artist: 'Artist B', album: 'Album B' }, 
    ];

    // --- CASO DE PRUEBA: Renderizado y paso de props ---
    it('debería renderizar el título y pasar las props correctas a TrackList', () => {
        // ARRANGE:
        // Preparamos una funcion "espía" para el prop onAdd.
        // Aunque no simularemos un clic aquí, nos aseguraos de que el componente
        // reciba una función válida, como lo haría en la aplicación real.
        const handleAdd = vi.fn();

        // ACT:
        // Renderizamos el componente SearchResults con nuestros datos de prueba.
        render(<SearchResults searchResults={mockSearchResults} onAdd={handleAdd} />);

        // ASSERT:
        // Verificamos que todos los elementos se renderizan correctamente.

        // 1. El título "Results" debe estar en el documento.
        // Usamos una expresión regular /results/i para que no sea sensible a mayúsculas/minúscular.
        expect(screen.getByRole('heading', { name: /results/i })).toBeInTheDocument();

        // 2. El mock de TrackList recibió la cantidad correcta de canciones.
        expect(screen.getByTestId('tracklist-tracks-count')).toHaveTextContent(mockSearchResults.length.toString());

        // 3. El mock de TrackList recinió la prop `isRemoval={false}`, indicando que son para añadir.
        expect(screen.getByTestId('tracklist-is-removal')).toHaveTextContent('false');

    });
}); // Cierra el describe de SearchResults