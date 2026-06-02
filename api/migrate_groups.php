<?php
require_once 'config.php';

try {
    // 1. Create the new pivot table
    $conn->exec("CREATE TABLE IF NOT EXISTS staff_group_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        staff_id INT NOT NULL,
        group_id INT NOT NULL,
        UNIQUE KEY unique_staff_group (staff_id, group_id)
    )");

    // 2. Migrate existing data from staffs.group_id
    // Only migrate if someone is already assigned a group, using INSERT IGNORE to prevent duplicates
    $conn->exec("INSERT IGNORE INTO staff_group_assignments (staff_id, group_id)
                 SELECT id, group_id FROM staffs WHERE group_id IS NOT NULL");

    echo json_encode(["status" => "success", "message" => "Migration complete"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
