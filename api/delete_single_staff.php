<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['id']) || empty($data['id'])) {
        throw new Exception("Missing staff ID");
    }
    
    $id = (int)$data['id'];

    $conn->beginTransaction();

    // ลบการเข้าร่วมกิจกรรมที่เกี่ยวข้องเพื่อป้องกัน Foreign Key Error
    $stmtDelAtt = $conn->prepare("DELETE FROM act_attendance WHERE staff_id = ?");
    $stmtDelAtt->execute([$id]);

    $stmt = $conn->prepare("DELETE FROM staffs WHERE id = ?");
    $stmt->execute([$id]);

    $conn->commit();

    echo json_encode(['status' => 'success', 'message' => 'ลบข้อมูลสำเร็จ']);
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()]);
}
?>
