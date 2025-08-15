const clientId = '30f1f00be4504bb2ac9e627b29544fe3'; // Importante! Reemplaza esto con tu Client ID de Spotify.
const redirectUri = 'http://127.0.0.1:5173/'; // Debe coincidir con la URI de redireccion en tu app de Spotify.

let accessToken;

const Spotify = {
    getAccessToken() {
        // 1. Si ya tenemos un token, lo devolvemos.
        if (accessToken) {
            return accessToken;
        }

        // Si no, buscamos el token y la expiracion en la URL.
        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        if (accessTokenMatch && expiresInMatch) {
            accessToken = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);

            // Limpiamos el token despues de que expire.
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            //Limpiamos los parametros de la URL para no intentar obtener un token expirado.
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            // 3. Si no hay token, redirigimos al usuario para que se autentique.
            const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
            window.location = accessUrl;
        }
    }
};

export default Spotify;