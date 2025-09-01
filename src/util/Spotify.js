const clientId = '30f1f00be4504bb2ac9e627b29544fe3';
const redirectUri = 'http://127.0.0.1:5173/';

const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const generateCodeChallenge = async (codeVerifier) => {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

// Variable para cachear el ID del usuario y evitar llamadas repetidas.
let userId;


const Spotify = {

    // ** Se encarga de redirigir al usuario a spotify... este es el primer contacto
    //    ** La primera llamda de nuestra aplicacion con Spotify
    async redirectToSpotifyAuth() {
        // Genera un nuevo secreto (Verifier) para esta seccion de login.
        const codeVerifier = generateRandomString(128);
        // Guardamos el secreto en el local storage del navegador.
        // Es como guardarla en un cajon seguro para cuando el usuario regrese de Spotify.
        localStorage.setItem('spotify_code_verifier', codeVerifier);

        // Creamos el desafio publico apartir de nuestro secreto
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        // PROFESOR: Definimos los permisos que nuestra aplicación necesita. 'playlist-modify-public'
        //           nos permitirá crear y modificar playlists públicas en nombre del usuario.
        const scope = 'user-read-private playlist-modify-public';
        const authUrl = new URL("https://accounts.spotify.com/authorize");

        authUrl.search = new URLSearchParams({
            response_type: "code",
            client_id: clientId,
            scope,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            redirect_uri: redirectUri,
        }).toString();

        window.location.href = authUrl.toString();

    },

    // ** Se encarga de conseguir el Token
    async getAccessToken() {
        let accessToken = localStorage.getItem('spotify_access_token');
        let expiresAt = localStorage.getItem('spotify_token_expires_at');
        // 1. Si tenemos un token valido y no ha expirado, lo usamos.
        if (accessToken && expiresAt && new Date().getTime() < expiresAt) {
            return accessToken;
        }

        // 2. Si el token ha expirado, intentamos refrescarlo usando el refrech_token.
        //           'URLSearchParams' es una API del navegador para leer fácilmente los parámetros de la URL.
        const refreshToken = localStorage.getItem('spotify_refresh_token');
        if (refreshToken) {
            try {
                const response = await fetch("https://accounts.spotify.com/api/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        grant_type: "refresh_token",
                        refresh_token: refreshToken,
                        client_id: clientId,
                    }),
                });


                if (!response.ok) {
                    // Su el refresco falla, es mejor forzar un nuevo login.
                    throw new Error('Failed to refresh token. Re-authentication required.');
                }

                const { access_token, expires_in, refresh_token: newRefreshToken } = await response.json();
                const newExpiresAt = new Date().getTime() + expires_in * 1000;
                localStorage.setItem('spotify_access_token', access_token);
                localStorage.setItem('spotify_token_expires_at', newExpiresAt);
                if (newRefreshToken) { // Spotify puede devolver un nuevo refresh token, es buena practica guardarlo.
                    localStorage.setItem('spotify_refresh_token', newRefreshToken);
                }
                return access_token;

            } catch (error) {
                console.error(error);
                //Si el refresco falla, limpiamos los tokens viejos y redirigimos para autenticar de nuevo.
                localStorage.removeItem('spotify_access_token');
                localStorage.removeItem('spotify_token_expires_at');
                localStorage.removeItem('spotify_refresh_token');
                await this.redirectToSpotifyAuth();
                return null;
            }
        }

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (!code) {
            return null;
        }

        // Si hay un code recuperamos nuestro secreto (Verifier) del cajon en donde lo guardamos.
        const codeVerifier = localStorage.getItem('spotify_code_verifier');

        // PROFESOR: Ahora, hacemos una petición segura y directa (POST) a la "bóveda" de Spotify para canjear nuestro ticket.
        //           Usamos 'fetch', la API nativa del navegador para hacer peticiones de red.

        try {
            const response = await fetch("https://accounts.spotify.com/api/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: clientId,
                    grant_type: "authorization_code",
                    code,
                    redirect_uri: redirectUri,
                    code_verifier: codeVerifier,
                }),
            });


            // VERIFICACION CRITICA: Revisa si la peticion para obtener el token fue exitosa .
            if (!response.ok) {
                const errorDetails = await response.json();
                throw new Error(`Failed to fetch token: ${errorDetails.error_description || 'Unknown error'}`);
            }

            const { access_token, expires_in, refresh_token } = await response.json();

            const newExpiresAt = new Date().getTime() + expires_in * 1000;
            localStorage.setItem('spotify_access_token', access_token);
            localStorage.setItem('spotify_token_expires_at', newExpiresAt);
            localStorage.setItem('spotify_refresh_token', refresh_token);


            window.history.pushState({}, '', redirectUri);
            return access_token;

        } catch (error) {
            console.error(error);
            window.history.pushState({}, '', redirectUri); // Limpia la URL para no reintentar con un codigo invalido.
            return null;
        }
    },

    // ** Obtiene el ID del usuario actual, usando caché para evitar llamadas innecesarias.
    async getCurrentUserId() {
        if (userId) {
            return userId;
        }

        const accessToken = await this.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}` };
        const response = await fetch('https://api.spotify.com/v1/me', { headers });
        if (!response.ok) throw new Error(`Failed to fetch user data. Status: ${response.status}`);

        const userData = await response.json();
        userId = userData.id;
        return userId;
    },

    // ** Obtiene la lista de playlists del usuario actual.
    async getUserPlaylists() {
        const currentUserId = await this.getCurrentUserId();
        const accessToken = await this.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}` };

        const response = await fetch(`https://api.spotify.com/v1/users/${currentUserId}/playlists`, { headers });
        if(!response.ok) throw new Error(`Failed to fetch user playlist. Status: ${response.status}`);

        const jsonResponse = await response.json();
        return jsonResponse.items.map(playlist => ({
            id: playlist.id,
            name: playlist.name
        }));
    },

    // ** Obtiene los tracks de una playlist específica usando ID.
    async getPlaylist(playlistId) {
        const accessToken = await this.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}`};

        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, { headers });
        if (!response.ok) throw new Error(`Failed to fetch playlists tracks. Status: ${response.status}`);

        const jsonResponse = await response.json();
        // Mapeamos la respuesta para devolver un array de tracks con el formato que el app necestia.
        // Filtramos por si algún item no tiene track, para evitar errores.
        return jsonResponse.items.filter(item => item.track).map(item => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists[0].name,
            album: item.track.album.name,
            uri: item.track.uri
        }));
    },

    // ** Esta funcion busca canciones en Spotify
    async search(term) {
        const accessToken = await this.getAccessToken();
        if (!accessToken) {
            throw new Error("Authentication failed: Cannot get access token.");
        }

        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(term)}&type=track`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        // Verificacion de robustez: Asegura que la busqueda fue exitosa.
        if (!response.ok) {
            throw new Error(`Spotify search request failed with status ${response.status}`);
        }

        // Revisa si recivimos tracks en formato json, de no ser asi detenemos la funcion
        const jsonResponse = await response.json();
        if (!jsonResponse.tracks) return [];

        // Usa map para regresar los track con la informacion que necesitamos en nuestra app
        return jsonResponse.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            uri: track.uri
        }));
    },

    // ** Se encarga de la logica en el codigo para guardar Playlist del usuario en Spotify
    async savePlaylist(name, trackUris, playlistId) {
        if (!name || !trackUris || !trackUris.length) {
            return; // No hay nada que guardar, no es un error
        }

        const accessToken = await this.getAccessToken();
        if (!accessToken) {
            throw new Error("Authentication failed: Cannot get access token.");
        }

        // Preparamos la cabezera de autorizacion que usaremos en las siguientes peticiones
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };

        const currentUserId = await this.getCurrentUserId();

        // ** Flujo condicional: ¿Estamos actualizando o creando?
        if (playlistId) {
            // --- LÓGICA PARA ACTUALIZAR UNA PLAYLIST EXISTENTE ---
            // PASO 1: Actualizar el nombre de la playlist.
            const updateNameResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ name })
            });
            if (!updateNameResponse.ok) {
                throw new Error(`Failed to update playlist name. Status: ${updateNameResponse.status}`);

            }
                
            // PASO 2: Reemplazar los tracks de la playlist.
            const updateTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ uris: trackUris })
            });
            if (!updateTracksResponse.ok) {
                
                throw new Error(`Failed to update playlist tracks. Status: ${updateTracksResponse.status}`);
             } 
             
            } else { // Aqui se cierra el if(playlistId)
            // --- LÓGICA PARA CREAR UNA NUEVA PLAYLIST.
            // PASO 1: Crear una nueva playlist para el usuario.
            const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${currentUserId}/playlists`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name, public: true })
            });

            if (!playlistResponse.ok) throw new Error(`Failed to create playlist. Status: ${playlistResponse.status}`);
            const { id: newPlaylistId } = await playlistResponse.json();

            // PASO 2: Añadir las canciones a la nueva playlist.
            const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${newPlaylistId}/tracks`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ uris: trackUris })
            });
            if (!addTracksResponse.ok) {
                throw new Error(`Failed to add tracks to new playlist. Status: ${addTracksResponse.status}`);
            }


        } // Este cierra el else
    } // Cierra SavePlatlis. 
}; // Cierra el componente Spotify.

export default Spotify;