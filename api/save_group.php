<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = trim($data['name'] ?? '');
    
    if (empty($name)) {
        throw new Exception("ชื่อกลุ่มห้ามว่าง");
    }

    if (isset($data['id']) && !empty($data['id'])) {
        // Update
        $id = (int)$data['id'];
        $stmt = $conn->prepare("UPDATE staff_groups SET group_name = ? WHERE id = ?");
        $stmt->execute([$name, $id]);
        $message = "อัปเดตกลุ่มสำเร็จ";
    } else {
        // Insert
        // Check duplicate
        $stmtCheck = $conn->prepare("SELECT id FROM staff_groups WHERE group_name = ?");
        $stmtCheck->execute([$name]);
        if ($stmtCheck->rowCount() > 0) {
            throw new Exception("มีชื่อกลุ่มนี้อยู่ในระบบแล้ว");
        }

        $stmt = $conn->prepare("INSERT INTO staff_groups (group_name) VALUES (?)");
        $stmt->execute([$name]);
        $message = "เพิ่มกลุ่มใหม่สำเร็จ";
    }

    echo json_encode(['status' => 'success', 'message' => $message]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()]);
}
?>
