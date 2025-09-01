import React from "react";

// --- DEFINICIÓN DEL COMPONENTE ---
// playlist: Un objeto que contiene el 'id' y el 'name' de la playlist.
// onSelect: La función que se llamará cuando el usuario haga clic en esta playlist.
const UserPlaylistEntry = ({ playlist, onSelect }) => {

    const handleSelect = () => {
        // Le pasa el 'id' y el 'name' de la playlist actual hacia arriba, al componente pare (`UserPlaylists`),
        // que a su vez lo pasará a `App.jsx` para que el estado de la aplicación se actualice.
        onSelect(playlist.id, playlist.name);
    };

    // El texto que se muestra en el return es el nombre de la playlist.
    return <li onClick={handleSelect}>{playlist.name}</li>;

}; // Cierra el componente UserPlaylistEntry.

// Exportamos el componente para que 'UserPlaylists.jsx' lo pueda utilizar.
export default UserPlaylistEntry;