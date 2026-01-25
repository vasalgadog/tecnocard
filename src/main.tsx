import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
        <App />
        <footer>© 2026 <a href="https://valentin.valra.cl">valentin.valra.cl</a></footer>
    </React.StrictMode>,
)
