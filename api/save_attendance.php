<?php
require_once 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['activity_id']) || !isset($data['attendance'])) {
    echo json_encode(["status" => "error", "message" => "Invalid data"]);
    exit();
}

$activity_id = (int)$data['activity_id'];
$attendance  = $data['attendance'];

try {
    // Check if activity is locked
    $stmtLock = $conn->prepare("SELECT status, activity_name FROM activities WHERE id = ?");
    $stmtLock->execute([$activity_id]);
    $actRow = $stmtLock->fetch(PDO::FETCH_ASSOC);
    if ($actRow && $actRow['status'] === 'locked') {
        echo json_encode(["status" => "error", "message" => "ไม่สามารถบันทึกกิจกรรมที่ถูกล็อคแล้ว (มีการพิมพ์รายงานไปแล้ว)"]);
        exit();
    }

    $activityName = $actRow['activity_name'] ?? 'กิจกรรม';

    $conn->beginTransaction();

    $stmt = $conn->prepare("
        INSERT INTO act_attendance (activity_id, staff_id, status) 
        VALUES (:activity_id, :staff_id, :status)
        ON DUPLICATE KEY UPDATE status = :update_status
    ");

    $stmtNotif = $conn->prepare("
        INSERT INTO notifications (staff_id, type, title, message)
        VALUES (?, 'absence', ?, ?)
        ON DUPLICATE KEY UPDATE is_read = is_read
    ");

    foreach ($attendance as $record) {
        if (!empty($record['staff_id']) && !empty($record['status'])) {
            $stmt->execute([
                ':activity_id'   => $activity_id,
                ':staff_id'      => (int)$record['staff_id'],
                ':status'        => $record['status'],
                ':update_status' => $record['status']
            ]);

            // Send notification for absent/leave staff only
            if ($record['status'] === 'absent' || $record['status'] === 'leave') {
                $statusTh = $record['status'] === 'absent' ? 'ขาด' : 'ลา';
                $stmtNotif->execute([
                    (int)$record['staff_id'],
                    "📋 บันทึกการเข้าร่วมกิจกรรม",
                    "คุณถูกบันทึกว่า{$statusTh}กิจกรรม \"{$activityName}\" หากมีข้อผิดพลาด กรุณาติดต่อผู้จัดงาน"
                ]);
            }
        }
    }

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "บันทึกข้อมูลเรียบร้อยแล้ว"]);

} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["status" => "error", "message" => "Failed to save attendance: " . $e->getMessage()]);
}
?>
