import React, { useCallback, useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {

    // Estado para guardar el termino de busqueda que el usuario escribe.
    const [term, setTerm] = useState('');

    // Funcion que se ejecuta cada vez que el usurario escribe en el input
    const handleTermChange = useCallback((event) => {
        setTerm(event.target.value);
    }, []);

    // Pasa el termino de busqueda al componente padre (App.jsx)
    const search = useCallback(() => {
        onSearch(term); 
    }, [onSearch, term]);

    return (
        <div className="SearchBar">
            <input placeholder="Enter A Song, Album, or Artist" onChange={handleTermChange} value={term} />
            <button className="SearchButton" onClick={search}>SEARCH</button>
        </div>
    );
};

export default SearchBar;

