import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.jsx'
import './index.css'

// 1. Import Keycloak ที่เราเพิ่งติดตั้งมา
import Keycloak from 'keycloak-js'

// 2. ตั้งค่าการเชื่อมต่อ Keycloak
const keycloak = new Keycloak({
  url: 'https://service.npc.ac.th',
  realm: 'NPC-SSO',
  clientId: 'apr-app' // ⚠️ แก้ชื่อนี้ให้ตรงกับ Client ID ของระบบ APR ใน Keycloak ด้วยนะครับ
});

// 3. สั่งให้ Keycloak ทำงานและบังคับล็อกอิน (login-required)
keycloak.init({ onLoad: 'login-required' }).then((authenticated) => {
  if (!authenticated) {
    window.location.reload();
  } else {
    console.log("ล็อกอิน SSO สำเร็จ!");
    
    // 4. ถ้าล็อกอินผ่านแล้ว ค่อยยอมให้ React วาดหน้าเว็บ (เรนเดอร์ App)
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        {/* เราแอบส่งตัวแปร keycloak เข้าไปใน App ด้วย เผื่ออนาคตพี่นุจะเอาไปดึงชื่อผู้ใช้ หรือทำปุ่ม Logout */}
        <App keycloak={keycloak} />
      </React.StrictMode>,
    )
  }
}).catch((error) => {
  console.error("เกิดข้อผิดพลาดในการเชื่อมต่อ SSO:", error);
  document.getElementById('root').innerHTML = '<h2 style="text-align:center; margin-top:50px;">ขออภัย ไม่สามารถเชื่อมต่อระบบยืนยันตัวตนได้</h2>';
});