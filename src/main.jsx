import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './Components/ui/ui.css' // after index.css: the app's resets must come last

import AppProvider from './Context/AppContext.jsx'
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { validateEnvironment } from './utils/envValidator';

validateEnvironment();

ReactDOM.createRoot(document.getElementById('root')).render(
    <AppProvider>
        <I18nextProvider i18n={i18n}>

            <App />
        </I18nextProvider >

    </AppProvider>
)
