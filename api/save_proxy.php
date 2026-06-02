<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['activity_id']) || empty($data['proxy_id']) || empty($data['absent_id'])) {
        throw new Exception("ข้อมูลไม่ครบถ้วน");
    }

    $activity_id = (int)$data['activity_id'];
    $proxy_id    = (int)$data['proxy_id'];
    $absent_id   = (int)$data['absent_id'];

    if ($proxy_id === $absent_id) throw new Exception("ไม่สามารถระบุตัวเองเป็นตัวแทนได้");

    // Check if activity is locked
    $stmtLock = $conn->prepare("SELECT status FROM activities WHERE id = ?");
    $stmtLock->execute([$activity_id]);
    $actRow = $stmtLock->fetch(PDO::FETCH_ASSOC);
    if ($actRow && $actRow['status'] === 'locked') {
        throw new Exception("ไม่สามารถแก้ไขกิจกรรมที่ถูกล็อคแล้ว");
    }

    // INSERT OR REPLACE proxy assignment
    $stmt = $conn->prepare("
        INSERT INTO act_proxy (activity_id, proxy_id, absent_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE proxy_id = VALUES(proxy_id)
    ");
    $stmt->execute([$activity_id, $proxy_id, $absent_id]);

    // Fetch names for notification messages
    $stmtProxy = $conn->prepare("SELECT full_name FROM staffs WHERE id = ?");
    $stmtProxy->execute([$proxy_id]);
    $proxyName = $stmtProxy->fetchColumn() ?: 'ผู้แทน';

    $stmtAbsent = $conn->prepare("SELECT full_name FROM staffs WHERE id = ?");
    $stmtAbsent->execute([$absent_id]);
    $absentName = $stmtAbsent->fetchColumn() ?: 'ผู้ขาด';

    $stmtAct = $conn->prepare("SELECT activity_name FROM activities WHERE id = ?");
    $stmtAct->execute([$activity_id]);
    $activityName = $stmtAct->fetchColumn() ?: 'กิจกรรม';

    // Prepare notification insert
    $stmtNotif = $conn->prepare("
        INSERT INTO notifications (staff_id, type, title, message)
        VALUES (?, ?, ?, ?)
    ");

    // 1. Notify the PROXY — they have been assigned to go on someone's behalf
    $stmtNotif->execute([
        $proxy_id,
        'proxy_assigned',
        '🤝 ได้รับมอบหมายเป็นตัวแทน',
        "คุณถูกระบุให้เข้าร่วมกิจกรรม \"{$activityName}\" แทน {$absentName} กรุณาเตรียมตัวให้พร้อม"
    ]);

    // 2. Notify the ABSENT person — their proxy has been confirmed
    $stmtNotif->execute([
        $absent_id,
        'proxy_confirmed',
        '✅ มีผู้เข้าร่วมแทนคุณแล้ว',
        "{$proxyName} จะเข้าร่วมกิจกรรม \"{$activityName}\" แทนคุณเรียบร้อยแล้ว"
    ]);

    echo json_encode(['status' => 'success', 'message' => 'บันทึกตัวแทนและส่งการแจ้งเตือนเรียบร้อย']);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
