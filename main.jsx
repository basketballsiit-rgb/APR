import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.jsx'
import './index.css'

// ให้ส่วนหลังบ้าน (Backend - PHP) เป็นผู้ประมวลผลการล็อกอิน SSO ผ่าน Client Secret
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)