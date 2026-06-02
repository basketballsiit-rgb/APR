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

    $conn->beginTransaction();

    $stmt = $conn->prepare("UPDATE staffs SET staff_code = ?, full_name = ?, position = ?, group_id = ? WHERE id = ?");
    $stmt->execute([$code, $name, $position, $group_id, $id]);

    // Update the pivot table for many-to-many group assignments
    $stmtDel = $conn->prepare("DELETE FROM staff_group_assignments WHERE staff_id = ?");
    $stmtDel->execute([$id]);

    if ($group_id !== null && $group_id > 0) {
        $stmtIns = $conn->prepare("INSERT INTO staff_group_assignments (staff_id, group_id) VALUES (?, ?)");
        $stmtIns->execute([$id, $group_id]);
    }

    $conn->commit();

    echo json_encode(['status' => 'success', 'message' => 'อัปเดตข้อมูลสำเร็จ']);
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()]);
}
?>
