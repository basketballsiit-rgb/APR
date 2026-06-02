<?php
// This script runs once on the production server to apply the RBAC & Notifications DB schema.
// Access via browser: https://service.npc.ac.th/APR/api/setup_roles_and_notifs.php
require_once 'config.php';

// Override content type for HTML display
header('Content-Type: text/html; charset=utf-8');
echo "<pre style='font-family:sans-serif; padding:20px;'>";
echo "<h2>🔧 ตั้งค่าฐานข้อมูลสำหรับ RBAC & Notifications</h2>";

try {
    // 1. Add 'role' column to staffs if not exists
    $checkRole = $conn->query("SHOW COLUMNS FROM staffs LIKE 'role'");
    if ($checkRole->rowCount() == 0) {
        $conn->exec("ALTER TABLE staffs ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user' AFTER position");
        echo "<p style='color:green;'>✅ เพิ่มคอลัมน์ 'role' ในตาราง staffs สำเร็จ!</p>";
        // Set the first user as admin as a bootstrap measure
        $conn->exec("UPDATE staffs SET role = 'admin' WHERE id = (SELECT id FROM (SELECT id FROM staffs ORDER BY id ASC LIMIT 1) t)");
        echo "<p style='color:blue;'>ℹ️ กำหนดสิทธิ์ Admin ให้บุคลากรคนแรกในตารางแล้ว (โปรดไปปรับสิทธิ์เพิ่มเติมในหน้าตั้งค่าระบบ)</p>";
    } else {
        echo "<p style='color:gray;'>⏭️ คอลัมน์ 'role' มีอยู่แล้วในตาราง staffs ข้ามขั้นตอนนี้</p>";
    }

    // 2. Create notifications table
    $conn->exec("
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            staff_id INT NOT NULL,
            type VARCHAR(50) DEFAULT 'general',
            title VARCHAR(255) NOT NULL,
            message TEXT,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "<p style='color:green;'>✅ ตรวจสอบ/สร้างตาราง 'notifications' สำเร็จ!</p>";

    echo "<h3 style='color:green;'>🎉 การปรับปรุงฐานข้อมูลเสร็จสมบูรณ์ทั้งหมดแล้ว คุณสามารถปิดหน้านี้ได้เลยครับ</h3>";
} catch (PDOException $e) {
    echo "<p style='color:red;'>❌ เกิดข้อผิดพลาด: " . $e->getMessage() . "</p>";
}

echo "</pre>";
?>
