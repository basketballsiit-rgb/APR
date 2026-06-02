<?php
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$staff_id = isset($input['staff_id']) ? intval($input['staff_id']) : 0;
$role = isset($input['role']) ? $input['role'] : '';
$allowed_roles = ['admin', 'reporter', 'user'];

if (!$staff_id || !in_array($role, $allowed_roles)) {
    echo json_encode(['status' => 'error', 'message' => 'ข้อมูลไม่ถูกต้อง: ต้องระบุ staff_id และ role ที่ถูกต้อง (admin, reporter, user)']);
    exit;
}

try {
    $stmt = $conn->prepare("UPDATE staffs SET role = ? WHERE id = ?");
    $stmt->execute([$role, $staff_id]);
    echo json_encode(['status' => 'success', 'message' => 'อัปเดตสิทธิ์เรียบร้อยแล้ว']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
