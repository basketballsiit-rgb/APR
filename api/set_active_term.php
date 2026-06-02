<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['id'])) {
        throw new Exception("ไม่ระบุรหัสภาคเรียน");
    }

    $id = (int)$data['id'];

    // Update all to 0
    $conn->query("UPDATE terms SET is_active = 0");
    
    // Update target to 1
    $stmt = $conn->prepare("UPDATE terms SET is_active = 1 WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(["status" => "success", "message" => "ตั้งค่าปีการศึกษาปัจจุบันสำเร็จ"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
