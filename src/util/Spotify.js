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

const Spotify = {

    // ** Se encarga de redirigir al usuario a spotify... este es el prmer contacto
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
    async savePlaylist(name, trackUris) {
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
        let userId;

        // PASO 1: Obtener el ID del usuario actual.
        const userResponse = await fetch('https://api.spotify.com/v1/me', { headers });
        if (!userResponse.ok) throw new Error(`Failed to fetch user data. Status: ${userResponse.status}`);

        const userData = await userResponse.json();
        userId = userData.id;

        // PASO 2: Crear una nueva playlist para el usuario.
        const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name, public: true })
        });
        // Asegura que estemos haciendo el fetch de playlistResponse correctamente
        if (!playlistResponse.ok) throw new Error(`Failed to create playlist. Status: ${playlistResponse.status}`);

        const { id: playlistId } = await playlistResponse.json();

        // PASO 3: Añadir las canciones a la nueva playlist
        const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ uris: trackUris })
        });

        // Revisamos si las tracks se estan añadiendo exitosamente
        if (!addTracksResponse.ok) throw new Error(`Failed to add tracks to playlist. Status: ${addTracksResponse.status}`);
    }
};

export default Spotify;