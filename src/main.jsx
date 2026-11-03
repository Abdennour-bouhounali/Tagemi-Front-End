import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './Components/ui/ui.css' // after index.css: the app's resets must come last

import AppProvider from './Context/AppContext.jsx'
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { validateEnvironment } from './utils/envValidator';

validateEnvironment();

// After a deploy the old page chunks are deleted from the server: a tab opened
// before it fails to load the next page. Reload once to get the new version.
window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    try {
        const last = Number(sessionStorage.getItem('chunk-reload-at') || 0);
        if (Date.now() - last < 30000) return; // already reloaded: don't loop
        sessionStorage.setItem('chunk-reload-at', String(Date.now()));
    } catch { /* storage blocked: reload anyway */ }
    window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <AppProvider>
        <I18nextProvider i18n={i18n}>

            <App />
        </I18nextProvider >

    </AppProvider>
)
