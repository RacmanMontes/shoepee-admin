import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Remove any tailwind imports from this file if present

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);