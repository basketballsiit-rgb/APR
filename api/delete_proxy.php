<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['activity_id']) || empty($data['absent_id'])) {
        throw new Exception("ข้อมูลไม่ครบถ้วน");
    }

    $stmt = $conn->prepare("
        DELETE FROM act_proxy WHERE activity_id = ? AND absent_id = ?
    ");
    $stmt->execute([(int)$data['activity_id'], (int)$data['absent_id']]);

    echo json_encode(['status' => 'success', 'message' => 'ยกเลิกตัวแทนเรียบร้อย']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
