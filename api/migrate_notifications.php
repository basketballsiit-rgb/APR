<?php
require_once 'config.php';

try {
    $conn->exec("CREATE TABLE IF NOT EXISTS act_notifications (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        staff_id    INT NOT NULL COMMENT 'ผู้รับการแจ้งเตือน',
        title       VARCHAR(255) NOT NULL,
        message     TEXT NOT NULL,
        is_read     TINYINT(1) DEFAULT 0,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo json_encode(["status" => "success", "message" => "Notifications table created"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
