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

    const addTrack = useCallback((track) => {
        // Si la cancion ya esta en la playlist, no hagas nada
        if (playlistTracks.some((savedTrack) => savedTrack.id === track.id)) {
            return;
        }
        //Agrega la nueva cancion al final de la playlist.
        setPlaylistTracks((prevTracks) => [...prevTracks, track]);
    }, [playlistTracks]);

    return (
        <div>
            <h1>Ja<span className="highlight">mmm</span>ing</h1>
            <div className="App">
                <SearchBar /> 
                <div className="App-playlist">
                    <SearchResults searchResults={searchResults} onAdd={addTrack} /> 
                    <Playlist playlistTracks={playlistTracks} /> 
                </div>
            </div>
        </div>
    );
};

export default App;
