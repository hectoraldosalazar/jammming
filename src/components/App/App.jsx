import React, { useCallback, useState } from 'react';
import './App.css';

//Importando los componentes

import Playlist from '../Playlist/Playlist';
import SearchBar from '../SearchBar/SearchBar';
import SearchResults from '../SearchResults/SearchResults';

const App = () => {

    //useState contiene un array de objetos de prueba para poder ver el flujo del componente padre a los hijos

    const [searchResults, setSearchResults] = useState([
        { name: 'Tiny Dncer', artist: 'Elton john', album: 'Madman Across the Water', id: 1 },
        { name: 'Bohemia Rhapsody', artist: 'Queen', album: 'A Night at the Opera', id: 2 },
        { name: 'Stairway to Haven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', id: 3 },
    ]);

    const [playlistTracks, setPlaylistTracks] = useState([
        { name: 'Hotel California', artist: 'Eagles', album: 'Hotel California', id: 4 },
        { name: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', id: 5 },
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

    return (
        <div>
            <h1>Ja<span className="highlight">mmm</span>ing</h1>
            <div className="App">
                <SearchBar /> 
                <div className="App-playlist">
                    <SearchResults searchResults={searchResults} onAdd={addTrack} /> 
                    <Playlist playlistName={playlistName} onNameChange={updatePlaylistName} playlistTracks={playlistTracks} onRemove={removeTrack} /> 
                </div>
            </div>
        </div>
    );
};

export default App;
