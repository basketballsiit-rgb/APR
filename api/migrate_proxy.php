<?php
require_once 'config.php';

try {
    $conn->exec("CREATE TABLE IF NOT EXISTS act_proxy (
        id INT AUTO_INCREMENT PRIMARY KEY,
        activity_id INT NOT NULL,
        proxy_id INT NOT NULL COMMENT 'คนที่ไปแทน (ได้สถิติ)',
        absent_id INT NOT NULL COMMENT 'คนที่ขาด (ถูกแทน)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_proxy (activity_id, absent_id)
    )");
    echo json_encode(["status" => "success", "message" => "Table created"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
