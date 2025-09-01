import React, { useCallback, useState, useEffect, useRef } from 'react';
import './App.css';

//Importando los componentes

import Playlist from '../Playlist/Playlist';
import SearchBar from '../SearchBar/SearchBar';
import SearchResults from '../SearchResults/SearchResults';
import UserPlaylists from '../UserPlaylists/UserPlaylists';
import Spotify from '../../util/Spotify';

const App = () => {


    const [searchResults, setSearchResults] = useState([]);

    const [playlistTracks, setPlaylistTracks] = useState([]);

    const [playlistName, setPlaylistName] = useState('New Playlist');

    // Nuevo estado para guardar el ID de la playlist que se está editando.
    const [playlistId, setPlaylistId] = useState(null);

    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const authEffectRan = useRef(false);

    // Al cargar la app, verifica si ya tenemos un token de acceso valido.
    useEffect(() => {
        // En React 18+, en modo estricto, los useEffect se ejecutan dos veces en desarrollo.
        // Usamos un `useRef` para asegurarnos de que esta lógica de autenticación solo se ejecte una vez.
        if (authEffectRan.current === true) {
            return;
        }
        authEffectRan.current = true;
        const checkToken = async () => {
            // getAccessToken se encargara de la logica de buscar en localStorage o en la URL.
            const accessToken = await Spotify.getAccessToken();
            if (accessToken) {
                setIsAuthenticated(true);
            }
        };
        checkToken();
    }, []); // El array vacío asegura que el efecto solo se ejecute en el montaje (y desmontaje en modo estricto).


    //Crea la funcion para que el usuario agrege canciones de searchResults a playlistTracks.
    const addTrack = useCallback((track) => {
        // Si la cancion ya esta en la playlist, no hagas nada
        if (playlistTracks.some((savedTrack) => savedTrack.id === track.id)) {
            return;
        }
        //Agrega la nueva cancion al final de la playlist.
        setPlaylistTracks((prevTracks) => [...prevTracks, track]);
    }, [playlistTracks]);


    //Crea la funcion para que el usuario elimine canciones de playlistTracks.
    const removeTrack = useCallback((track) => {
        // Filtra el array, manteniendo solo las canciones que NO coinciden con el id de la cancion a eliminar.
        setPlaylistTracks((prevTracks) =>
            prevTracks.filter((currentTrack) => currentTrack.id !== track.id)
        );
    }, []);

    // Deja al usuario actualizar el nombre de la playlist.
    const updatePlaylistName = useCallback((name) => {
        setPlaylistName(name);
    }, []);

    // *** Nueva función para seleccionar una playlist existente ***
    // Se pasa como prop a UserPlaylists.
    const selectPlaylist = useCallback(async (id, name) => {
        try {
            // Llama a la API para obtener los tracks de la playlist seleccionada.
            const tracks = await Spotify.getPlaylist(id);
            setPlaylistName(name); // Actualiza el nombre de la playlist en la UI.
            setPlaylistTracks(tracks); // Actualiza la lista de canciones.
            setPlaylistId(id); // Guardar el ID de la playlist seleccionada.
        } catch (error) {
            console.error("Error al seleccionar la playlist:", error);
            alert(`No se pudo cargar la playlist: ${error.message}`);
        }
    }, []);

    //Guarda la playlist en la cuenta de Spotify del usuario.
    const savePlaylist = useCallback(async () => {
        const trackURIs = playlistTracks.map(track => track.uri);
        if (!trackURIs.length) {
            alert("Tu playlist esta vacía. Añade algunas canciones antes de guardar.");
            return;
        }

        try {
            await Spotify.savePlaylist(playlistName, trackURIs, playlistId); //3. Pasamos el ID de la playlist al guardar
            alert(`Playlist "${playlistName}" guardada exitosamente!`);
            setPlaylistName('New Playlist');
            setPlaylistTracks([]);
            setPlaylistId(null); // Reseteamos el ID despues de guardar.

        } catch (error) {
            console.error("Error al guardar la playlist:", error);
            alert(`No se pudo guardar la playlist: ${error.message}`);
        } // Cierra el catch
    }, [playlistName, playlistTracks, playlistId]); // Añadimos playlistId a las dependencias.

    // Conecta la app a la API de Spotify para buscar canciones.
    const search = useCallback(async (term) => {
        try {
            const results = await Spotify.search(term);
            setSearchResults(results);
        } catch (error) {
            console.error("Error durante la busqueda:", error);
            alert(`Ocurrio un error en la busqueda: ${error.message}`);
        }
    }, []);

    // Inicia el proceso de autenticacion redirigiendo al usuario.
    const handleLogin = () => {
        Spotify.redirectToSpotifyAuth();
    };

    return (
        <div>
            <h1>Ja<span className="highlight">mmm</span>ing</h1>
            <div className="App">
                {isAuthenticated ? (
                    <>
                        <SearchBar onSearch={search} />
                        <div className="App-content">
                            <UserPlaylists onSelectPlaylist={selectPlaylist} />
                            <div className="App-playlist">
                                <SearchResults searchResults={searchResults} onAdd={addTrack} />
                                <Playlist playlistName={playlistName} onNameChange={updatePlaylistName} playlistTracks={playlistTracks} onRemove={removeTrack} onSave={savePlaylist} />
                            </div>
                        </div>

                    </>
                ) : (
                    <div className="Connect-container">
                        <h2>Por favor, conecta tu cuenta de Spotify para continuar</h2>
                        <button className="Connect-button" onClick={handleLogin}>
                            CONECTAR CON SPOTIFY
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
