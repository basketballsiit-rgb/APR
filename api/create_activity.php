<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['activity_name']) || empty($data['activity_date'])) {
        throw new Exception("กรุณากรอกชื่อกิจกรรมและวันที่ให้ครบถ้วน");
    }

    $name = $data['activity_name'];
    $date = $data['activity_date'];
    $group_id = isset($data['group_id']) && $data['group_id'] !== '' ? (int)$data['group_id'] : 0;
    $attachment_path = isset($data['attachment_path']) ? $data['attachment_path'] : null;

    // Get active term
    $stmtTerm = $conn->prepare("SELECT id FROM terms WHERE is_active = 1 LIMIT 1");
    $stmtTerm->execute();
    $termId = $stmtTerm->fetchColumn();

    if (!$termId) {
        throw new Exception("ไม่พบภาคเรียนปัจจุบันในระบบ กรุณาตั้งค่าภาคเรียนก่อนสร้างกิจกรรม");
    }

    // Calculate status
    $today = date('Y-m-d');
    $status = 'upcoming';
    if ($date == $today) {
        $status = 'active';
    } elseif ($date < $today) {
        $status = 'completed';
    }

    // Insert activity
    $stmt = $conn->prepare("INSERT INTO activities (activity_name, activity_date, term_id, group_id, status, attachment_path) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$name, $date, $termId, $group_id, $status, $attachment_path]);
    $newActivityId = $conn->lastInsertId();

    // Fetch applicable staffs
    if ($group_id > 0) {
        $stmtStaffs = $conn->prepare("
            SELECT DISTINCT s.id FROM staffs s
            JOIN staff_group_assignments sga ON s.id = sga.staff_id
            WHERE s.is_active = 1 AND sga.group_id = ?
        ");
        $stmtStaffs->execute([$group_id]);
    } else {
        $stmtStaffs = $conn->query("SELECT id FROM staffs WHERE is_active = 1");
    }
    
    $staffs = $stmtStaffs->fetchAll(PDO::FETCH_ASSOC);

    // คำนวณวันที่ภาษาไทย
    $thaiMonths = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    $thaiDate   = date('j', strtotime($date));
    $thaiMonth  = $thaiMonths[(int)date('n', strtotime($date))];
    $thaiYear   = (int)date('Y', strtotime($date)) + 543;
    $formattedDate = "$thaiDate $thaiMonth $thaiYear";

    // ดึงชื่อกลุ่ม (สำหรับแสดงใน notification)
    $groupName = 'ทุกกลุ่ม';
    if ($group_id > 0) {
        $stmtGrp = $conn->prepare("SELECT group_name FROM staff_groups WHERE id = ?");
        $stmtGrp->execute([$group_id]);
        $gn = $stmtGrp->fetchColumn();
        if ($gn) $groupName = $gn;
    }

    if (count($staffs) > 0) {
        // สร้างรายการเช็คชื่อ
        $insertAttQuery = "INSERT INTO act_attendance (activity_id, staff_id, status) VALUES ";
        $insertVals = [];
        $params = [];
        foreach ($staffs as $staff) {
            $insertVals[] = "(?, ?, 'pending')";
            $params[] = $newActivityId;
            $params[] = $staff['id'];
        }
        $insertAttQuery .= implode(", ", $insertVals);
        $conn->prepare($insertAttQuery)->execute($params);

        // ส่งการแจ้งเตือน In-App เข้าระบบเว็บเท่านั้น (ไม่ส่ง LINE)
        $notifTitle   = "🔔 กิจกรรมใหม่: $name";
        $notifMessage = "📅 วันที่จัด: $formattedDate | 👥 กลุ่ม: $groupName";
        if ($attachment_path) {
            $notifMessage .= "|ATTACHMENT:" . $attachment_path;
        }

        $notifVals   = [];
        $notifParams = [];
        foreach ($staffs as $staff) {
            $notifVals[]   = "(?, 'activity', ?, ?, 0)";
            $notifParams[] = $staff['id'];
            $notifParams[] = $notifTitle;
            $notifParams[] = $notifMessage;
        }
        $notifQuery = "INSERT INTO notifications (staff_id, type, title, message, is_read) VALUES " . implode(", ", $notifVals);
        $conn->prepare($notifQuery)->execute($notifParams);
    }

    // หมายเหตุ: การแจ้งเตือน LINE ถูกส่งผ่าน Cron Job อัตโนมัติ (cron_reminder.php)
    // ล่วงหน้า 1 วันก่อนถึงวันจัดกิจกรรม ไม่ส่ง LINE ตอนสร้างกิจกรรมอีกต่อไป

    echo json_encode(["status" => "success", "message" => "สร้างกิจกรรมใหม่เรียบร้อยแล้ว", "activity_id" => $newActivityId]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
