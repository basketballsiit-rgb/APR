<?php
require_once 'config.php';

$staff_id = isset($_GET['staff_id']) ? (int)$_GET['staff_id'] : 0;

if (!$staff_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing staff_id']);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT id, staff_code, full_name, COALESCE(role, 'user') as role FROM staffs WHERE id = ? AND is_active = 1");
    $stmt->execute([$staff_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode(['status' => 'success', 'user' => $user]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'User not found']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
