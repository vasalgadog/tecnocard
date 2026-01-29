import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'
import { registerSW } from 'virtual:pwa-register'

// Safe Update Logic
const updateSW = registerSW({
    onNeedRefresh() {
        if (document.visibilityState === 'visible') {
            if (confirm('Nueva versión disponible. ¿Recargar ahora?')) {
                updateSW(true); // skipWaiting
            }
        } else {
            // Update silently if backgrounded
            updateSW(true);
        }
    },
    onOfflineReady() {
        console.log('App lista para trabajar offline');
    },
});

ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
        <App />
        <footer>© 2026 <a href="https://valentin.valra.cl">valentin.valra.cl</a></footer>
    </React.StrictMode>,
)
