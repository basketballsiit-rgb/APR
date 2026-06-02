<?php
require_once 'config.php';
try {
    // Try to add column
    $conn->exec("ALTER TABLE activities ADD COLUMN group_id INT NULL DEFAULT NULL AFTER term_id");
    echo json_encode(["status" => "success", "message" => "Column group_id added to activities."]);
} catch (Exception $e) {
    // Column might already exist
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
