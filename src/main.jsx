import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA service worker — prompt user when new version available
const updateSW = registerSW({
  onNeedRefresh() {
    // Show update toast
    const toast = document.createElement('div');
    toast.id = 'sw-update-toast';
    toast.innerHTML = `
      <div style="
        position:fixed; bottom:80px; left:12px; right:12px; z-index:9999;
        background:#1e1b4b; color:white; border-radius:16px;
        padding:14px 18px; display:flex; align-items:center; justify-content:space-between;
        box-shadow:0 8px 30px rgba(0,0,0,0.25); font-family:system-ui,sans-serif;
      ">
        <span style="font-size:14px; font-weight:500;">New version available</span>
        <button id="sw-update-btn" style="
          background:white; color:#1e1b4b; border:none; border-radius:10px;
          padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer;
        ">Update</button>
      </div>
    `;
    document.body.appendChild(toast);
    document.getElementById('sw-update-btn').addEventListener('click', () => {
      updateSW(true); // skipWaiting + reload
    });
  },
  onOfflineReady() {
    console.log('PWA ready for offline use');
  },
});
