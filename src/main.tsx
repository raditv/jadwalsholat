import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with periodic updates
const updateSW = registerSW({
  immediate: true,
  registerType: 'autoUpdate',
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onRegistered(r) {
    // Register for push notifications
    if (r && 'pushManager' in r) {
      r.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BJoON1-QsJiFBNJdpY46ztk6Xn5RbrOYgN6joK_9TU37Jrpp_4l2m0H34-44bDo29vZ7QvyPdYc6Dl2cPM0YJ0w' // Replace with your VAPID key
      }).then(subscription => {
        // Send subscription to your server
        console.log('Push notification subscription:', subscription);
      });
    }

    // Register for periodic background sync
    if (r && 'periodicSync' in r) {
      r.periodicSync.register('prayer-times-sync', {
        minInterval: 24 * 60 * 60 * 1000 // 24 hours
      }).catch(console.error);
    }
  },
  onRegisterError(error) {
    console.error('SW registration error', error);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);