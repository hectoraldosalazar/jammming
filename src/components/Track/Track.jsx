import React from 'react';
import './Track.css';

const Track = ({ track, onAdd, onRemove, isRemoval }) => {
    //Esta funcion se llamara cuando se haga clic en el boton '+'
    const addTrack = () => {
        onAdd(track);
    };

    //Esta funcion se llamara cunado se haga clic en el boton '-'
    const removeTrack = () => {
        // Llama a la funcion onRemove que se le pasa como prop
        onRemove(track);
    };

    return (
        <div className="Track">
            <div className="Track-information">
                <h3>{track.name}</h3>
                <p>{track.artist} | {track.album} </p>
            </div>
            <button className="Track-action" onClick={isRemoval ? removeTrack : addTrack}>
                {isRemoval ? '-' : '+'}
            </button>
        </div>
    )
}

export default Track;