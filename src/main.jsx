import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import AppProvider from './Context/AppContext.jsx'
// import reportWebVitals from './reportWebVitals';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n'; // Import your i18n configuration

ReactDOM.createRoot(document.getElementById('root')).render(
    <AppProvider>
        <I18nextProvider i18n={i18n}>

            <App />
        </I18nextProvider >

    </AppProvider>
)
