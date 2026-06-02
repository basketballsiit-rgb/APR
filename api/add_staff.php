<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['code']) || empty($data['name'])) {
        throw new Exception("กรุณากรอกรหัสและชื่อบุคลากรให้ครบถ้วน");
    }
    
    $code = trim($data['code']);
    $name = trim($data['name']);
    $position = trim($data['position'] ?? '');

    // Check duplicate
    $stmtCheck = $conn->prepare("SELECT id FROM staffs WHERE staff_code = ?");
    $stmtCheck->execute([$code]);
    if ($stmtCheck->rowCount() > 0) {
        throw new Exception("รหัสบุคลากรนี้มีอยู่ในระบบแล้ว");
    }

    $stmt = $conn->prepare("INSERT INTO staffs (staff_code, full_name, position, is_active) VALUES (?, ?, ?, 1)");
    $stmt->execute([$code, $name, $position]);
    
    echo json_encode(['status' => 'success', 'message' => 'เพิ่มบุคลากรเรียบร้อย']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
