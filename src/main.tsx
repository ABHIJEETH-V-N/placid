import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA offline caching & notifications
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Placid ServiceWorker active with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('Placid ServiceWorker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
