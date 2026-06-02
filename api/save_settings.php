<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['settings']) || !is_array($data['settings'])) {
        throw new Exception("ข้อมูลการตั้งค่าไม่ถูกต้อง");
    }

    // Create table if not exists
    $conn->exec("
        CREATE TABLE IF NOT EXISTS system_settings (
            `key` VARCHAR(100) PRIMARY KEY,
            `value` TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $stmt = $conn->prepare("INSERT INTO system_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");

    foreach ($data['settings'] as $key => $value) {
        // Sanitize key to prevent injection
        if (preg_match('/^[a-z0-9_]+$/', $key)) {
            $stmt->execute([$key, $value]);
        }
    }

    echo json_encode(["status" => "success", "message" => "บันทึกการตั้งค่าเรียบร้อยแล้ว"]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
