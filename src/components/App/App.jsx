import React, { useCallback, useState } from 'react';
import './App.css';

//Importando los componentes

import Playlist from '../Playlist/Playlist';
import SearchBar from '../SearchBar/SearchBar';
import SearchResults from '../SearchResults/SearchResults';
import Spotify from '../../util/Spotify';

const App = () => {

    //useState contiene un array de objetos de prueba para poder ver el flujo del componente padre a los hijos

    const [searchResults, setSearchResults] = useState([
        { name: 'Tiny Dncer', artist: 'Elton john', album: 'Madman Across the Water', id: 1, uri: 'spotify:track:1' },
        { name: 'Bohemia Rhapsody', artist: 'Queen', album: 'A Night at the Opera', id: 2, uri: 'spotify:track:2' },
        { name: 'Stairway to Haven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', id: 3, uri: 'spotify:track:3' },
    ]);

    const [playlistTracks, setPlaylistTracks] = useState([
        { name: 'Hotel California', artist: 'Eagles', album: 'Hotel California', id: 4, uri: 'spotify:track:4' },
        { name: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', id: 5, uri: 'spotify:track:5' },
    ]);

    const [playlistName, setPlaylistName] = useState('New Playlist');


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

    //Guarda la playlist en la cuenta de Spotify del usuario.
    const savePlaylist = useCallback(() => {
        // Genera un array de URIs de las canciones en la playlist.
        const trackURIs = playlistTracks.map(track => track.uri);
        console.log('Saving to Spotify with URIs:', trackURIs); // Para pruebas unicamente

        // TODO: Aqui ira la logica para interactuar con la API de Spotify.

        //Resetea la playlist despues de guardarla.
        setPlaylistName('New Playlist');
        setPlaylistTracks([]);
    }, [playlistTracks]);

    //Conecta la app a la API de Spotify para buscar canciones.
    const search = useCallback((term) => {
        Spotify.getAccessToken(); // Esto iniciara el flujo de autenticacion si es necesario.
        console.log(`Buscando en Spotify: ${term}`);
        // TODO: La logica de busqueda real ira aqui en el siguiente paso.
    }, []);

    return (
        <div>
            <h1>Ja<span className="highlight">mmm</span>ing</h1>
            <div className="App">
                <SearchBar onSearch={search} /> 
                <div className="App-playlist">
                    <SearchResults searchResults={searchResults} onAdd={addTrack} /> 
                    <Playlist playlistName={playlistName} onNameChange={updatePlaylistName} playlistTracks={playlistTracks} onRemove={removeTrack} onSave={savePlaylist} /> 
                </div>
            </div>
        </div>
    );
};

export default App;
