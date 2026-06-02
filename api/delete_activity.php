<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['id'])) {
        throw new Exception("ไม่ระบุรหัสกิจกรรม");
    }

    $id = (int)$data['id'];

    // Check if locked
    $stmtCheck = $conn->prepare("SELECT status FROM activities WHERE id = ?");
    $stmtCheck->execute([$id]);
    $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    if ($existing && $existing['status'] === 'locked') {
        throw new Exception("ไม่สามารถลบกิจกรรมที่ถูกล็อคแล้ว");
    }

    // Explicitly delete all child records to prevent orphaned data in dashboard
    $conn->prepare("DELETE FROM act_proxy WHERE activity_id = ?")->execute([$id]);
    $conn->prepare("DELETE FROM act_attendance WHERE activity_id = ?")->execute([$id]);
    // Note: act_notifications (old table) cleanup if it exists
    try { $conn->prepare("DELETE FROM act_notifications WHERE activity_id = ?")->execute([$id]); } catch (Exception $e) {}

    // Delete the activity itself
    $conn->prepare("DELETE FROM activities WHERE id = ?")->execute([$id]);

    echo json_encode(["status" => "success", "message" => "ลบกิจกรรมเรียบร้อยแล้ว"]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
