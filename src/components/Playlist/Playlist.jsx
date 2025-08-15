import React from 'react';
import './Playlist.css';
import TrackList from '../TrackList/TrackList';

const Playlist = ({ playlistTracks, onRemove, playlistName, onNameChange, onSave }) => {

    
   // Le pasa la nota del nuevo nombre a su padre App.jsx el cual realmente es el que actualiza el nombre
    const handleNameChange = (event) => {
        onNameChange(event.target.value);
    };

    return (
        <div className="Playlist">
            <input type="text" value={playlistName} onChange={handleNameChange} />
            <TrackList tracks={playlistTracks} onRemove={onRemove} isRemoval={true}/>
            <button className="Playlist-save" onClick={onSave}>SAVE TO SPOTIFY</button>
        </div>
    );
};

export default Playlist;
