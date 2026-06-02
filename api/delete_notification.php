<?php
require_once 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $notif_id = isset($data['notification_id']) ? intval($data['notification_id']) : 0;
    $staff_id  = isset($data['user_id'])        ? intval($data['user_id'])        : 0;

    if ($notif_id && $staff_id) {
        $stmt = $conn->prepare("DELETE FROM notifications WHERE id = ? AND staff_id = ?");
        if ($stmt->execute([$notif_id, $staff_id])) {
            echo json_encode(['status' => 'success']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to delete notification']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Missing ID']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
}
