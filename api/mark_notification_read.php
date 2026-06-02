<?php
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$staff_id = isset($input['staff_id']) ? intval($input['staff_id']) : 0;
$notif_id = isset($input['notif_id']) ? intval($input['notif_id']) : null; // null = mark all

if (!$staff_id) {
    echo json_encode(['status' => 'error', 'message' => 'staff_id is required']);
    exit;
}

try {
    if ($notif_id) {
        // Mark a single notification as read
        $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND staff_id = ?");
        $stmt->execute([$notif_id, $staff_id]);
    } else {
        // Mark all notifications as read for this staff
        $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE staff_id = ?");
        $stmt->execute([$staff_id]);
    }
    echo json_encode(['status' => 'success']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
