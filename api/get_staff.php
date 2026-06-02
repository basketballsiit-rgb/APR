<?php
require_once 'config.php';

$activity_id = isset($_GET['activity_id']) ? (int)$_GET['activity_id'] : 0;
$group_id    = isset($_GET['group_id'])    ? (int)$_GET['group_id']    : 0;

if ($activity_id === 0) {
    echo json_encode(["status" => "error", "message" => "Missing activity_id"]);
    exit();
}

// Use staff_group_assignments (many-to-many) as the source of truth for group membership.
// This ensures any staff added/moved via Group Management UI is always reflected here.
if ($group_id > 0) {
    $stmt = $conn->prepare("
        SELECT 
            s.id, 
            s.staff_code as code, 
            s.full_name as name, 
            s.position, 
            IFNULL(att.status, 'pending') as status,
            IFNULL(att.remark, '-') as remark
        FROM staffs s
        INNER JOIN staff_group_assignments sga ON s.id = sga.staff_id AND sga.group_id = :group_id
        LEFT JOIN act_attendance att ON s.id = att.staff_id AND att.activity_id = :activity_id
        WHERE s.is_active = 1
        ORDER BY s.full_name ASC
    ");
    $stmt->execute([':activity_id' => $activity_id, ':group_id' => $group_id]);
} else {
    // No group filter — return all active staff
    $stmt = $conn->prepare("
        SELECT 
            s.id, 
            s.staff_code as code, 
            s.full_name as name, 
            s.position, 
            IFNULL(att.status, 'pending') as status,
            IFNULL(att.remark, '-') as remark
        FROM staffs s
        LEFT JOIN act_attendance att ON s.id = att.staff_id AND att.activity_id = :activity_id
        WHERE s.is_active = 1
        ORDER BY s.full_name ASC
    ");
    $stmt->execute([':activity_id' => $activity_id]);
}

$staffList = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "status" => "success",
    "data"   => $staffList
]);
?>
