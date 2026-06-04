<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['activity_id'])) {
        throw new Exception("ข้อมูลไม่ครบถ้วน: Missing activity_id");
    }

    $activity_id = (int)$data['activity_id'];
    $images = isset($data['report_images']) ? $data['report_images'] : [];

    if (!is_array($images)) {
        throw new Exception("ข้อมูลรูปภาพไม่ถูกต้อง");
    }

    // Check if activity exists
    $stmtCheck = $conn->prepare("SELECT status FROM activities WHERE id = ?");
    $stmtCheck->execute([$activity_id]);
    $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        throw new Exception("ไม่พบกิจกรรมนี้ในระบบ");
    }

    // Update report_images column
    $imagesJson = json_encode($images, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $stmt = $conn->prepare("UPDATE activities SET report_images = ? WHERE id = ?");
    $stmt->execute([$imagesJson, $activity_id]);

    echo json_encode(["status" => "success", "message" => "บันทึกภาพประกอบรายงานเรียบร้อยแล้ว"]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
