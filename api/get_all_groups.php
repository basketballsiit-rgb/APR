<?php
require_once 'config.php';

try {
    $stmt = $conn->query("SELECT id, group_name FROM staff_groups ORDER BY id ASC");
    $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $groups]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
