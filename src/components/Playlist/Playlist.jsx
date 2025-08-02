import React, { useState } from 'react';
import './Playlist.css';
import TrackList from '../TrackList/TrackList';

const Playlist = ({ playlistTracks }) => {

    const [playlistName, setPlaylistName] = useState('New Playlist');

    const handleNameChange = (event) => {
        setPlaylistName(event.target.value);
    };

    return (
        <div className="Playlist">
            <input value={playlistName} onChange={handleNameChange} />
            <TrackList tracks={playlistTracks} isRemoval={true}/>
            <button className="Playlist-save">SAVE TO SPOTIFY</button>
        </div>
    );
}

export default Playlist;
