/* =====================================================================
   main.jsx — starts the React app.
   - BrowserRouter: enables page URLs (/patient/doctors, …)
   - AuthProvider:  makes the logged-in user available everywhere
   - index.css:     loads the whole design system once
   ===================================================================== */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import App from './App';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
