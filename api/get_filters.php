<?php
require_once 'config.php';

// ดึงข้อมูลสำหรับตัวกรอง
// ภาคเรียน
$stmt = $conn->query("SELECT id, term_name, is_active FROM terms");
$terms = $stmt->fetchAll(PDO::FETCH_ASSOC);

// กลุ่ม
$stmt = $conn->query("SELECT id, group_name FROM staff_groups");
$groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

// กิจกรรม (ดึงเฉพาะ 20 อันดับล่าสุด)
$stmt = $conn->query("SELECT id, activity_name, term_id FROM activities ORDER BY activity_date DESC LIMIT 20");
$activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "status" => "success",
    "data" => [
        "terms" => $terms,
        "groups" => $groups,
        "activities" => $activities
    ]
]);
?>
