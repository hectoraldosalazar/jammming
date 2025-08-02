import React, { useState } from 'react';
import './SearchBar.css';

const SearchBar = () => {

    // Estado para guardar el termino de busqueda que el usuario escribe.
    const [term, setTerm] = useState('');

    // Funcion que se ejecuta cada vez que el usurario escribe en el input
    const handleTermChange = (event) => {
        setTerm(event.target.value);
    };

    // Funcion que se ejecutara al hacer clic en el boton
    // Mas adelante, esta funcion llamara a la API de Spotify
    const search = () => {
        console.log(`Buscando: ${term}`);
        // Props.onSearch(term); // Asi se conectara con App.jsx en el futuro.
    };

    return (
        <div className="SearchBar">
            <input placeholder="Enter A Song, Album, or Artist" onChange={handleTermChange} value={term} />
            <button className="SearchButton" onClick={search}>SEARCH</button>
        </div>
    );
};

export default SearchBar;

