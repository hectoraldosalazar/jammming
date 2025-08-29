// --- IMPORTACIONES ---
// Importamos las funciones necesarias de 'vitest' para estructurar y ejecutar nuestras pruebas.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Importamos el modulo 'Spotify' que vamos a probar.
import Spotify from './Spotify';


// --- CONFIGURACION DEL ENTORNO DE PRUEBA ---
// Mock (simulacion) de la funcion global 'fetch'. Esto es CRUCIAL para evitar llamadas reales a la red durante las pruebas.
global.fetch = vi.fn();

// Mock de 'localStorage' para simular el almacenamiento del navegador
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock de `window.location` para poder simular cambios en la URL, como cuando Spotify nos redirig con un codigo.
const originalLocation = window.location;
const mockLocation = (search) => {
    delete window.location;
    window.location = { ...originalLocation, search, href: '' };
};

// Mock de `window.history.pushState` para evitar el error de seguridad en jsdom.
window.history.pushState = vi.fn();

// --- SUITE DE PRUEBAS PARA EL MODULO SPOTIFY ---

// `describe` agrupa un conjunto de tests relacionados para el modulo 'Spotify'.
describe('Spotify Module', () => {
    // `beforeEach` es un "hook" que se ejecuta ANTES de cada test en esta suite.
    // Es fundamental para asegurar que cada test comience desde un estado limpio y no se vea afectado por los anteriores.
    beforeEach(() => {
        vi.clearAllMocks(); // Limpia todos los "espias" y mocks.
        localStorageMock.clear(); // Borra todo el contenido del localStorage simulado.
        mockLocation(''); // Resetea la URL a una sin parametros.
    });

    // `afterEach` es un "hook" que se ejecuta DESPUES de cada test.
    // Se usa para restaurar cualquier cambio global que hayamos hecho.
    afterEach(() => {
        window.location = originalLocation; // Restaura la URL original.
    });

    // Sub-suite para la funcion `getAccessToken`
    describe('getAccessToken', () => {
        // Test 1: El caso mas simple, ya tenemos un token valido.
        it('deberia devolver un token desde localStorage si es valido y no ha expirado', async () => {
            // ARRANGE: Preparamos el estado inicial. Creamos un token que expira en el futuro y lo guardamos en nuestro localStorage simulado.
            const futureTime = new Date().getTime() + 3600 * 1000;
            localStorageMock.setItem('spotify_access_token', 'valid-token');
            localStorageMock.setItem('spotify_token_expires_at', futureTime);

            // ACT: Ejecutamos la funcion que queremos probar.
            const token = await Spotify.getAccessToken();

            // ASSERT: Verificamos que el resultado es el esperado. El token debe ser el que guardamos y no se debe haber echo ninguna llamada a la red.
            expect(token).toBe('valid-token');
            expect(global.fetch).not.toHaveBeenCalled();
        });

        // Test 2: El token ha expirado, pero tenemos un refresh_token.
        it('deberia usar el refresh_token para obtener un nuevo token si el actual ha expirado', async () => {
            // ARRANGE: Preparamos un token expirado y un refresh_token valido en localStorage. Tambien simulamos la respuesta de la API.
            const pastTime = new Date().getTime() - 3600 * 1000;
            localStorageMock.setItem('spotify_access_token', 'expired-token');
            localStorageMock.setItem('spotify_token_expires_at', pastTime);
            localStorageMock.setItem('spotify_refresh_token', 'my-refresh-token');
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ access_token: 'new-refreshed-token', expires_in: 3600 }),
            });

            // ACT: Ejecutamos la funcion.
            const token = await Spotify.getAccessToken();

            // ASSERT: Verificamos que se devolvio el nuevo token, que se hizo la llamada a la API y que el nuevo token se guardo.
            expect(token).toBe('new-refreshed-token');
            expect(global.fetch).toHaveBeenCalledWith('https://accounts.spotify.com/api/token', expect.any(Object));
            expect(localStorageMock.getItem('spotify_access_token')).toBe('new-refreshed-token');
        });

        // Test 3: El flujo de login inicial, cuando el usuario es redirigido desde Spotify.
        it('deberia solicitar un nuevo token si hay un codigo en la URL', async () => {
            // ARRANGE: Simulamos una URL con el codigo de autorizacion, un code_verifier guardado y la respuesta de la API.
            mockLocation('?code=mock-code');
            localStorageMock.setItem('spotify_code_verifier', 'mock-verifier');
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ access_token: 'new-token-from-api', expires_in: 3600, refresh_token: 'new-refresh-token' }),
            });

            // ACT: Ejecutamos la funcion.
            const token = await Spotify.getAccessToken();

            // ASSERT: Verificamos que se devuelve el nuevo token y que el access_token como el refresh_token se guardan.
            expect(token).toBe('new-token-from-api');
            expect(global.fetch).toHaveBeenCalledWith('https://accounts.spotify.com/api/token', expect.any(Object));
            expect(localStorageMock.getItem('spotify_access_token')).toBe('new-token-from-api');
            expect(localStorageMock.getItem('spotify_refresh_token')).toBe('new-refresh-token');
        });

        // NUEVO TEST 3: El token ha expirado, y el intento de refrescarlo falla.
        it('debería intentar refrescar, fallar, limpiar localStorage y redirigir a la autenticación', async () => {
            // ARRANGE: Preparamos un token expirado y un refresh_token.
            // `fetch` se simula para que falle. `redirectToSpotifyAuth` se espía para verificar su llamada.
            const pastTime = new Date().getTime() - 3600 * 1000;
            localStorageMock.setItem('spotify_access_token', 'expired-token');
            localStorageMock.setItem('spotify_token_expires_at', pastTime);
            localStorageMock.setItem('spotify_refresh_token', 'my-refresh-token');
            global.fetch.mockResolvedValue({ ok: false });
            vi.spyOn(Spotify, 'redirectToSpotifyAuth').mockImplementation(() => {});
            
            // ACT: Ejecutamos lo función.
            const token = await Spotify.getAccessToken();

            // ASSER: Verificamos que se intentó la llamada a la API, se limpió el localStorage,
            // se llamó a la redirección y se devolvió null.
            expect(global.fetch).toHaveBeenCalledWith('https://accounts.spotify.com/api/token', expect.any(Object));
            expect(localStorageMock.getItem('spotify_access_token')).toBe(null);
            expect(Spotify.redirectToSpotifyAuth).toHaveBeenCalledTimes(1);
            expect(token).toBe(null);
        });

        // NUEVA PRUEVA 4: El código de la URL es inválido y la API de token devuelve un error.
        it('debería devolver null y limpiar la URL si el intercambio de código falla', async () => {
            // ARRANGE: Simulamos una URL con un código inválido y una respuesta de error de la API.
            mockLocation('?code=invalid-code');
            localStorageMock.setItem('spotify_code_verifier', 'mock-verifier');
            global.fetch.mockResolvedValue({
                ok: false,
                json: async () => ({ error_description: 'Invalid authorization code' }),
            });

            // ACT: Ejecutamos la función.
            const token = await Spotify.getAccessToken();

            // ASSERT: Verificamos que se devolvió null y que se limpió la URL para evitar reintentos.
            expect(token).toBe(null);
            expect(window.history.pushState).toHaveBeenCalledWith({}, '', 'http://127.0.0.1:5173/');
        });

        // Test 4: El caso en que no hay niguna forma de autenticarse.
        it('deberia devolver null si no hay token, ni refresh_token, ni codigo en la URL', async () => {

            // ARRANGE: No se necesita preparacio, `beforeEach` ya limpio todo.

            // ACT: Ejecutamos la funcion.
            const token = await Spotify.getAccessToken();

            // ASSERT: Verificamos que devuelve null y que no se intento ninguna llamada a la red.
            expect(token).toBe(null);
            expect(global.fetch).not.toHaveBeenCalled();
        });
    }); // Cierra funcion getAccessToken

    // Sub-suit para la funcion `search`.
    describe('search', () => {
        // Test 1: Busqueda exitosa.
        it('deberia hacer una peticion GET al endpoint de busqueda y devolver las canciones formateadas', async () => {
            // ARRANGE: Usamos `vi.spyOn` para interceptar `getAccessToken` y forzar que devuelva un token. Preparamos la respuesta de la API.
            vi.spyOn(Spotify, 'getAccessToken').mockResolvedValue('fake-token');
            const mockSearchResponse = {
                tracks: {
                    items: [{ id: 'track1', name: 'Test Track', artists: [{ name: 'Artist' }], album: { name: 'Album' }, uri: 'uri:1' }],
                },
            };
            global.fetch.mockResolvedValue({ ok: true, json: async () => mockSearchResponse });

            // ACT: Ejecutamos la funcion de busqueda.
            const results = await Spotify.search('test');

            // ASSERT: Verificamos que la llamada a la API fue correcta y que los datos se formatearon como esperamos.
            expect(global.fetch).toHaveBeenCalledWith(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent('test')}&type=track`,
                { headers: { Authorization: `Bearer fake-token` } }
            );
            expect(results).toEqual([{ id: 'track1', name: 'Test Track', artist: 'Artist', album: 'Album', uri: 'uri:1' }]);
        });

        // Test 2: Búsqueda fallida.
        it('deberia lanzar un error si la busqueda falla', async () => {
            // ARRANGE: Forzamos que `getAccessToken` devuelva un token y que `fetch` devuelva una respuesta de error.
            vi.spyOn(Spotify, 'getAccessToken').mockResolvedValue('fake-token');
            global.fetch.mockResolvedValue({ ok: false, status: 401 });

            // ACT & ASSERT: Verificamos que llamar a `Spotify.search` resulta en una promesa rechazada con el mensaje de error correcto.
            await expect(Spotify.search('test')).rejects.toThrow('Spotify search request failed with status 401');
        });
    }); // Cierra el describe de 'search'

    // Sub-suite para la función `savePlaylist`.
    describe('savePlaylist', () => {
        // Test 1: Guardado de playlist exitoso.
        it('deberia hacer las peticiones POST para crear una playlist y añadir canciones', async () => {
            // ARRANGE: Forzamos un token y preparamos una secuencia de respuestas exitosas para las 3 llamadas a la API.
            vi.spyOn(Spotify, 'getAccessToken').mockResolvedValue('fake-token');
            global.fetch
                .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'user-123' }) }) //1. Respuesta para obtener el ID de usuario
                .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'playlist-abc' }) }) // 2. Respuesta para crear la playlist
                .mockResolvedValueOnce({ ok: true, json: async () => ({ snapshot_id: 'snapshot-xyz' }) }); // 3. Respuesta para añadir las canciones.

            const playlistName = 'My Awesome Mix';
            const trackUris = ['uri:track:1', 'uri:track:2'];

            // ACT: Ejecutamos la funcion para guardar la playlist.
            await Spotify.savePlaylist(playlistName, trackUris);

            // ASSERT: Verificamos que cada una de las 3 llamadas a la API se hizo en el orden correcto y con los parametros correctos.
            expect(global.fetch).toHaveBeenNthCalledWith(1,
                'https://api.spotify.com/v1/me',
                expect.objectContaining({ headers: { Authorization: 'Bearer fake-token', 'Content-Type': 'application/json' } })
            );

            expect(global.fetch).toHaveBeenNthCalledWith(2,
                'https://api.spotify.com/v1/users/user-123/playlists',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ name: playlistName, public: true })
                })
            );

            expect(global.fetch).toHaveBeenNthCalledWith(3,
                `https://api.spotify.com/v1/playlists/playlist-abc/tracks`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ uris: trackUris })
                })
            );

        }); // Cierra el 'it' de savePlaylist.
    }); // Cierra el describe de 'savePlaylist'.
}); // Cierra el describe principal de 'Spotify Module'.