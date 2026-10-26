import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import './styles.css';
import { App } from './App';
import { AppDataProvider } from './context/AppDataContext';
import { AuthProvider } from './context/AuthContext';
import { ContactDialogProvider } from './context/ContactDialogContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root was not found');

createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppDataProvider>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <ContactDialogProvider>
                <App />
              </ContactDialogProvider>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </AppDataProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
