<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['id'])) {
        throw new Exception("ไม่ระบุรหัสภาคเรียน");
    }

    $id = (int)$data['id'];

    // Check if term is active
    $stmtCheck = $conn->prepare("SELECT is_active FROM terms WHERE id = ?");
    $stmtCheck->execute([$id]);
    $term = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if ($term && $term['is_active'] == 1) {
        throw new Exception("ไม่สามารถลบภาคเรียนที่กำลังใช้งานอยู่ได้");
    }

    // Check if it's used in activities
    $stmtCheckAct = $conn->prepare("SELECT COUNT(*) FROM activities WHERE term_id = ?");
    $stmtCheckAct->execute([$id]);
    if ($stmtCheckAct->fetchColumn() > 0) {
        throw new Exception("ไม่สามารถลบภาคเรียนนี้ได้เนื่องจากมีข้อมูลกิจกรรมเกี่ยวข้องอยู่");
    }

    // Delete term
    $stmt = $conn->prepare("DELETE FROM terms WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(["status" => "success", "message" => "ลบภาคเรียนสำเร็จ"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
