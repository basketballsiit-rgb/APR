<?php
require_once 'config.php';

// Get notifications for the currently logged-in user.
$staff_id = isset($_GET['staff_id']) ? intval($_GET['staff_id']) : 0;

if (!$staff_id) {
    echo json_encode(['status' => 'error', 'message' => 'staff_id is required']);
    exit;
}

// NOTE: Auto Reminder ถูกส่งผ่าน Cron Job จริง (cron_reminder.php)
// ไม่จำเป็นต้องทำผ่าน Poor Man's Cron อีกแล้ว

try {
    $stmt = $conn->prepare("
        SELECT id, type, title, message, is_read, created_at
        FROM notifications
        WHERE staff_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    ");
    $stmt->execute([$staff_id]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $notifications]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
