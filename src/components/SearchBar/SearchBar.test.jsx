import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SearchBar from './SearchBar';

// `describe` agrupa un conjunto de test relacionados. En este caso, para el componente SearchBar.
describe('SearchBar', () => {
    // -- CASO DE PRUEBA 1: Renderizado ---
    // 'it' define un caso de prueba individual. Describe lo que el componente deberia hacer.
    it('deberia renderizar un input y un boton', () => {
        // `render()` es una funcion de Testing Library que dibuja el componente en un DOM virtual.
        // `<SearchBar />` es la sintaxis de JSX para usar el componente.
        // `onSearch` es una "prop" que le pasamos al componente, Aqui le damos una funcion vacia `() => {}` porque es requerida.
        render(<SearchBar onSearch={() => {}} /> );

        // `screen.getByPlaceholderText(...)` busca un elemento en el DOM virtual que coincida con el texto del placeholder.
        const inputElement = screen.getByPlaceholderText(/enter a song, album, or artist/i);
        // `screen.getByRole('button', ...)` busca un elemento por su rol de accesibilidad (en este caso, un botón).
        const buttonElement = screen.getByRole('button', {name: /search/i});

        // `expect()` es la funcion de Vitest para hacer una afirmacion.
        // `.toBeInTheDocument()` es un "matcher" que verifica si el elemento existe en el DOM.
        expect(inputElement).toBeInTheDocument();
        expect(buttonElement).toBeInTheDocument();
    });

    // ___ CASO DE PRUEBA 2: Interaccion del usuario (Escribir) ___
    // `async () => {}`define una funcion asincronica, necesaria porque las acciones del usuario toman tiempo,
    it('deberia actualizar el valor del input cuando el usuario escribe', async () => {
        // `const user` declara la variable que contendra el objeto para simular eventos de usuario.
        // `userEvent.setup()` inicializa el simulador.
        const user = userEvent.setup();
        render(<SearchBar onSearch={() => {}} />);

        // `await` pausa la ejecucion hasta que la accion del usuario (escribir) se complete.
        // `user.type()` simula a un usuario escribiendo en el `ìnputElement`.
        const inputElement = screen.getByPlaceholderText(/enter a song, album, or artist/i);
        await user.type(inputElement, 'Daft Punk');

        // `.toHaveValue()` es un "matcher" que verifica el atributo `value` de un input.
        expect(inputElement).toHaveValue('Daft Punk'); 
    });

    // --- CASO DE PRUEBA 3: Interaccion del usuario (Click) ---
    it('deberia llamar a onSearch con el término correcto cuando se hace click en el botón', async () => {
        const user = userEvent.setup();
        // `const handleSearch` declara una variable para nuestra funcion "espia"
        // `vi.fn()` crea una funcion mock (simulada) que podemos espiar para ver si fue llamada.
        const handleSearch = vi.fn();

        //Renderizamos el componente, pasandole nuestra funcion espia como la prop `onSearch`.
        render(<SearchBar onSearch={handleSearch} />);

        // Simulamos la escritura del usuario.
        const inputElement = screen.getByPlaceholderText(/enter a song, album, or artist/i);
        await user.type(inputElement, 'Justice');
        // Simulamos el click en el bóton.
        //await screen.getByRole('button', { name: /search/i }).click();
        await user.click(screen.getByRole('button', { name: /search/i }));

        //`.toHaveBeenCalledWith()` es un "marcher" que verifica si nuestra funcion espia fue llamada
        // y si fue llamada con los argumentos correctos (en este caso, el string 'justice').
        expect(handleSearch).toHaveBeenCalledWith('Justice');
    });
});