import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { DataProvider } from './contexts/DataContext';
import { UIProvider } from './contexts/UIContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Strip trailing slash so React Router gets a clean basename ("/abu-rabee" not "/abu-rabee/").
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>
              <UIProvider>
                <DataProvider>
                  <App />
                </DataProvider>
              </UIProvider>
            </AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
