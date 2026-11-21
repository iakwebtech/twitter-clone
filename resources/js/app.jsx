import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { ToastProvider } from './Components/ToastContext';

window.Pusher = Pusher;

if (import.meta.env.VITE_REVERB_APP_KEY) {
    const useTls = (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https';
    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
        forceTLS: useTls,
        enabledTransports: useTls ? ['ws', 'wss'] : ['ws'],
        disableStats: true,
    });
}

// Initialize theme early
const savedTheme = localStorage.getItem('pulse_theme') || 'system';
if (
    savedTheme === 'dark' ||
    (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

const appName = import.meta.env.VITE_APP_NAME || 'Pulse';

createInertiaApp({
    title: (title) => (title ? `${title} / ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
        return pages[`./Pages/${name}.jsx`];
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <ToastProvider>
                <App {...props} />
            </ToastProvider>
        );
    },
    progress: {
        color: '#0ea5e9',
    },
});
