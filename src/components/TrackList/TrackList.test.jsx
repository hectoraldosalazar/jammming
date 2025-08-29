import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TrackList from './TrackList';

// Para probar Tracklist de forma aislada, simulamos (mock) su comppnente hijo, Track.
// Esto nos permite verificar que TrackList *intenta* renderizar la cantidad correcta de tracks.
// sin depender de como funciona internamente el componente Track.
vi.mock('../Track/Track', () => ({
    default: (props) => <div data-testid="mock-track">{props.track.name}</div>
}));

describe('TrackList', () => {
    // --- DATOS DE PRUEBA ---
    // Preparamos un array de canciones simuladas que usaremos en nuestras pruebas.
    const mockTracks = [
        { id: '1', name: 'Around the World', artist: 'Daft Punk', album: 'Homework' },
        { id: '2', name: 'One More Time', artist: 'Daft Punk', album: 'Discovery' },
    ];

    // --- CASO DE PRUEBA 1: Renderizado con una lista de canciones ---
    it('deberia renderizar un componente Track por cada cancion en la lista', () => {
        // ARRANGE (Organizar):
        // En este caso, el 'arrange' es simplemente tener nuestros `mockTracks` listos.
        // No se necesita más preparación para esta prueba.

        // ACT:
        // Rnederizamos nuestro componente Tracklist, pasándole nuestro array de canciones como prop.
        // Esta es la cancion que queremos probar.
        render(<TrackList tracks={mockTracks} />);

        // ASSERT:
        // Verificamos que el resultado de la accion es el esperado.
        // Buscamos que todos los elementos de nuestro `Track` simulado renderizan.
        const renderedTracks = screen.getAllByTestId('mock-track');

        // Afirmamos que la cantidad de 'Tracks' renderizados es igual a la cantidad de canciones que pasamos.
        expect(renderedTracks).toHaveLength(mockTracks.length);

        // Como una verificacion extra, nos aseguramos que los nombres de las canciones estén en el documento.
        expect(screen.getByText('Around the World')).toBeInTheDocument();
        expect(screen.getByText('One More Time')).toBeInTheDocument();
    });

    // --- CASO DE PRUEBA 2: Renderizado con una lista vacia ---
    it('no deberia renderizar ningun componente Track si la lista de canciones esta vacia', () => {
        // ARRANGE:
        // Preaparamos el escenario con una lista de canciones vacía.
        const emptyTracks = [];

        // ACT:
        // Renderizamos el componente con la lista vacía.
        render(<TrackList tracks={emptyTracks} /> );

        // ASSERT:
        // Usamos `queryAllByTestId` porque, a diferencia de `getAllByTestId`, no falla si no encuentra
        // elementos, simplemente devuelve un array vacio. Esto es perfecto para probar la ausencia de algo.
        const renderedTracks = screen.queryAllByTestId('mock-track');

        // Confirmamos que no se renderizo ningun 'Track'.
        expect(renderedTracks).toHaveLength(0);
    });
}); // Cierra el describe de TrackList