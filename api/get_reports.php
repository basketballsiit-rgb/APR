<?php
require_once 'config.php';

$term_id = isset($_GET['term_id']) ? (int)$_GET['term_id'] : 0;
$activity_id = isset($_GET['activity_id']) ? (int)$_GET['activity_id'] : 0;

if ($activity_id === 0) {
    echo json_encode(["status" => "error", "message" => "Missing required filter params"]);
    exit();
}

try {
    $stmtAct = $conn->prepare("SELECT id, group_id, activity_name as name, DATE_FORMAT(activity_date, '%d/%m/%Y') as date, attachment_path FROM activities WHERE id = :id");
    $stmtAct->execute([':id' => $activity_id]);
    $activityInfo = $stmtAct->fetch(PDO::FETCH_ASSOC);

    if (!$activityInfo) {
        echo json_encode(["status" => "error", "message" => "Activity not found"]);
        exit();
    }

    $group_id = $activityInfo['group_id'];

    // 1. ดึงผู้เข้าร่วมทั้งหมดในกลุ่มที่เลือก
    if ($group_id > 0) {
        $stmt = $conn->prepare("
            SELECT 
                s.id, 
                s.staff_code as code, 
                s.full_name as name, 
                s.position, 
                IFNULL(att.status, 'absent') as status,
                IFNULL(att.remark, '-') as remark,
                (SELECT COUNT(*) FROM staff_group_assignments WHERE staff_id = s.id) as group_count,
                px.proxy_id,
                ps.full_name as proxy_name,
                ps.staff_code as proxy_code
            FROM staffs s
            JOIN staff_group_assignments sga ON s.id = sga.staff_id AND sga.group_id = :group_id
            LEFT JOIN act_attendance att ON s.id = att.staff_id AND att.activity_id = :activity_id
            LEFT JOIN act_proxy px ON px.absent_id = s.id AND px.activity_id = :activity_id2
            LEFT JOIN staffs ps ON ps.id = px.proxy_id
            WHERE s.is_active = 1
            ORDER BY group_count DESC, s.staff_code ASC
        ");
        $stmt->execute([':activity_id' => $activity_id, ':group_id' => $group_id, ':activity_id2' => $activity_id]);
    } else {
        $stmt = $conn->prepare("
            SELECT 
                s.id, 
                s.staff_code as code, 
                s.full_name as name, 
                s.position, 
                IFNULL(att.status, 'absent') as status,
                IFNULL(att.remark, '-') as remark,
                1 as group_count,
                px.proxy_id,
                ps.full_name as proxy_name,
                ps.staff_code as proxy_code
            FROM staffs s
            LEFT JOIN act_attendance att ON s.id = att.staff_id AND att.activity_id = :activity_id
            LEFT JOIN act_proxy px ON px.absent_id = s.id AND px.activity_id = :activity_id2
            LEFT JOIN staffs ps ON ps.id = px.proxy_id
            WHERE s.is_active = 1
            ORDER BY s.staff_code ASC
        ");
        $stmt->execute([':activity_id' => $activity_id, ':activity_id2' => $activity_id]);
    }
    $staffList = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. ดึงข้อมูลรายละเอียดของเทอม, กลุ่ม
    $stmtTerm = $conn->prepare("SELECT term_name as term FROM terms WHERE id = :id");
    $stmtTerm->execute([':id' => $term_id]);
    $termInfo = $stmtTerm->fetch(PDO::FETCH_ASSOC);

    if ($group_id == 0) {
        $groupInfo = ['name' => 'ทั้งหมด'];
    } else {
        $stmtGroup = $conn->prepare("SELECT group_name as name FROM staff_groups WHERE id = :id");
        $stmtGroup->execute([':id' => $group_id]);
        $groupInfo = $stmtGroup->fetch(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "staffList" => $staffList,
            "activity" => $activityInfo,
            "term" => $termInfo,
            "group" => $groupInfo
        ]
    ]);
} catch (Exception $e) {
     echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
