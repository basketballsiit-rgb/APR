<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['staff_id']) || empty($data['staff_id']) || !isset($data['group_id']) || empty($data['group_id'])) {
        throw new Exception("Missing staff ID or group ID");
    }
    
    $staff_id = (int)$data['staff_id'];
    $group_id = (int)$data['group_id'];

    $stmt = $conn->prepare("DELETE FROM staff_group_assignments WHERE staff_id = ? AND group_id = ?");
    $stmt->execute([$staff_id, $group_id]);

    echo json_encode(['status' => 'success', 'message' => 'นำออกจากกลุ่มสำเร็จ']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()]);
}
?>
