<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['id']) || empty($data['activity_name']) || empty($data['activity_date'])) {
        throw new Exception("ข้อมูลไม่ครบถ้วน");
    }

    $id = (int)$data['id'];
    $name = $data['activity_name'];
    $date = $data['activity_date'];
    $group_id = isset($data['group_id']) && $data['group_id'] !== '' ? (int)$data['group_id'] : 0;
    $has_attachment = array_key_exists('attachment_path', $data);
    $attachment_path = $has_attachment ? $data['attachment_path'] : null;

    // Check if activity exists and is not locked
    $stmtCheck = $conn->prepare("SELECT group_id, status FROM activities WHERE id = ?");
    $stmtCheck->execute([$id]);
    $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        throw new Exception("ไม่พบกิจกรรมนี้ในระบบ");
    }

    if ($existing['status'] === 'locked') {
        throw new Exception("ไม่สามารถแก้ไขกิจกรรมที่ถูกล็อคแล้ว (มีการพิมพ์รายงานไปแล้ว)");
    }

    // Calculate status
    $today = date('Y-m-d');
    $status = 'upcoming';
    if ($date == $today) {
        $status = 'active';
    } elseif ($date < $today) {
        $status = 'completed';
    }

    // Update activity
    if ($has_attachment) {
        $stmt = $conn->prepare("UPDATE activities SET activity_name = ?, activity_date = ?, group_id = ?, status = ?, attachment_path = ? WHERE id = ?");
        $stmt->execute([$name, $date, $group_id, $status, $attachment_path, $id]);
    } else {
        $stmt = $conn->prepare("UPDATE activities SET activity_name = ?, activity_date = ?, group_id = ?, status = ? WHERE id = ?");
        $stmt->execute([$name, $date, $group_id, $status, $id]);
    }

    // Note: If the group_id changes, the current attendance records might not match the new group.
    // For simplicity, we keep the existing attendance records intact or we let the admin recreate them.
    // To be perfectly safe, we delete old pending attendances that are not in the new group, but that's complex.
    // We will just do a basic info update.

    echo json_encode(["status" => "success", "message" => "อัปเดตกิจกรรมเรียบร้อยแล้ว"]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
