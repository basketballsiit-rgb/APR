<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['id']) || empty($data['id'])) {
        throw new Exception("Missing group ID");
    }
    
    $id = (int)$data['id'];

    // เช็คว่ามีบุคลากรอยู่ในกลุ่มนี้ไหม
    $stmtCheck = $conn->prepare("SELECT COUNT(*) FROM staffs WHERE group_id = ?");
    $stmtCheck->execute([$id]);
    $count = $stmtCheck->fetchColumn();

    if ($count > 0) {
        throw new Exception("ไม่สามารถลบกลุ่มได้ เนื่องจากมีบุคลากรอยู่ในกลุ่มนี้ $count คน กรุณาย้ายบุคลากรออกก่อน");
    }

    $stmt = $conn->prepare("DELETE FROM staff_groups WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['status' => 'success', 'message' => 'ลบกลุ่มสำเร็จ']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
