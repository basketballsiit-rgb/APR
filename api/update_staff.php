<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['id']) || empty($data['id'])) {
        throw new Exception("Missing staff ID");
    }
    
    $id = (int)$data['id'];
    $code = trim($data['code'] ?? '');
    $name = trim($data['name'] ?? '');
    $position = trim($data['position'] ?? '');
    $group_id = isset($data['group_id']) ? (int)$data['group_id'] : null;
    
    if (empty($code) || empty($name)) {
        throw new Exception("Code and name cannot be empty");
    }

    $stmt = $conn->prepare("UPDATE staffs SET staff_code = ?, full_name = ?, position = ?, group_id = ? WHERE id = ?");
    $stmt->execute([$code, $name, $position, $group_id, $id]);

    echo json_encode(['status' => 'success', 'message' => 'อัปเดตข้อมูลสำเร็จ']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()]);
}
?>
