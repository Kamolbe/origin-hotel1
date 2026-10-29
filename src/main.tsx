import { initializeHotelServer } from './services/hotelServer';
import { CloudSyncProvider } from './context/CloudSyncContext';
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

async function start() {
try { await initializeHotelServer(); } catch {
  const message = document.createElement("p"); message.textContent = "Serverga ulanib bo‘lmadi. Django serverni ishga tushiring va sahifani yangilang.";
  const retry = document.createElement("button"); retry.textContent = "Qayta urinish"; retry.onclick = () => window.location.reload();
  root!.replaceChildren(message, retry); return;
}
createRoot(root!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppDataProvider>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <CloudSyncProvider><ContactDialogProvider>
                <App />
              </ContactDialogProvider></CloudSyncProvider>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </AppDataProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

}
void start();
