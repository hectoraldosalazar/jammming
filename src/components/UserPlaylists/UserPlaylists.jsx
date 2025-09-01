import React, { useState, useEffect } from "react";
import Spotify from '../../util/Spotify';
import UserPlaylistEntry from '../UserPlaylistEntry/UserPlaylistEntry';

// --- DEFINICIÓN DEL COMPONENTE ---
//  Definimos el componente `userPlaylists`. Recibe una prop llamada `onSelectPlaylist`,
// Que es una funcion que viene desde `App.jsx`.
const UserPlaylists = ({ onSelectPlaylist }) => {
    
    // Define el hook `useState` para crear una variable de estado llamada `playlists`.
    const [playlists, setPlaylists] = useState([]);

    // --- EFFECT SECUNDARIO (LLAMADA A LA API) ---
    // Usamos el hook 'useEffect' para ejecutar una función cuando el componente se monta por primera vez.
    useEffect(() => {
        
        // Define una funcion 'async' dentro del efecto. Es la forma moderna y recomendada.
        // 'await' pausa la ejecución aquí hasta que la API de Spotify responde.
        const getPlaylists = async () => {
            try {
                // Llama al método 'getUserPlaylists' del módulo Spotify y se espera a tener una respuesta.
                const userPlaylists = await Spotify.getUserPlaylists();

                // Una vez que tenemos la lista de playlists, actualizamos nuestro estado.
                setPlaylists(userPlaylists);

            } catch (error) {
                // Si ocurre un error, mostramos un mensaje de error.
                console.error("Error al obtener las playlists del usuario:", error);
            }
        }; // Cierra la función async getPlaylists.

        // ** Llamamos a la función que acabamos de definir para que se inicie la petisión.
        getPlaylists();
       
    }, []); // Cierra el useEffect.

    // --- RENDERIZADO DEL COMPONENTE ---
    return (
        <div className="UserPlaylists">
            <h2>Tus Playlists</h2>
            <ul>
                {
                    // 1. Usamos el método `.map()`para recorrer el array `playlists` de nuestro estado.
                    // Por cada `playlists` en el array, creamos un componente `UserPlaylistEntry`.
                    playlists.map(playlist => (
                        <UserPlaylistEntry
                        // `key` es un prop especial y obligatoria en React para las listas.
                        // Ayuda a React a identificar cada elemento de forma única.
                        key={playlist.id}

                        // Pasamos el objeto `playlist` completo como prop al componente hijo.
                        playlist={playlist}

                        // Pasamos la función `onSelectPlaylist` (que vino de App.jsx) como prop
                        // al componente hijo, para que pueda ser llamada desde allí.
                        onSelect={onSelectPlaylist}
                        />
                    ))
                }
            </ul>
        </div>
    );

}; // Cierra el componente UserPlaylists.

// --- EXPORTACIÓN DEL COMPONENTE ---
export default UserPlaylists;