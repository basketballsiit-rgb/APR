<?php
// run_migration.php
require_once 'api/config.php';

try {
    // 1. ตรวจสอบว่ามีกลุ่ม 'รายวิชาระยะสั้น' หรือยัง
    $stmt = $conn->prepare("SELECT id FROM staff_groups WHERE group_name = ?");
    $stmt->execute(['รายวิชาระยะสั้น']);
    $group = $stmt->fetch();
    
    if (!$group) {
        $stmtInsert = $conn->prepare("INSERT INTO staff_groups (group_name) VALUES (?)");
        $stmtInsert->execute(['รายวิชาระยะสั้น']);
        $new_id = $conn->lastInsertId();
        echo json_encode([
            "status" => "success", 
            "message" => "เพิ่มสาขาวิชา 'รายวิชาระยะสั้น' สำเร็จ (ID: $new_id)"
        ]);
    } else {
        echo json_encode([
            "status" => "success", 
            "message" => "สาขาวิชา 'รายวิชาระยะสั้น' มีอยู่ในระบบอยู่แล้ว (ID: {$group['id']})"
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "status" => "error", 
        "message" => $e->getMessage()
    ]);
}
?>
