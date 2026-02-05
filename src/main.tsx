import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'
import { registerSW } from 'virtual:pwa-register'

// Safe Update Logic
// Auto-update logic
registerSW({
    onRegistered(r) {
        r && setInterval(() => {
            r.update();
        }, 60 * 60 * 1000); // Check for updates every hour
    },
});

// Force reload when new service worker takes control
let refreshing = false;
navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
});

ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
        <App />
        <footer>© 2026 <a href="https://valentin.valra.cl" target="_blank">valentin.valra.cl</a></footer>
    </React.StrictMode>,
)
