<?php
// migrate_term_activities.php
// สคริปต์ย้ายกิจกรรมที่ยังไม่ lock จาก term เก่าไปยัง term ที่ active ปัจจุบัน
require_once __DIR__ . '/config.php';

try {
    // หา active term
    $stmtActive = $conn->prepare("SELECT id, term_name FROM terms WHERE is_active = 1 LIMIT 1");
    $stmtActive->execute();
    $activeTerm = $stmtActive->fetch(PDO::FETCH_ASSOC);

    if (!$activeTerm) {
        echo json_encode(["status" => "error", "message" => "ไม่พบภาคเรียนที่ active"]);
        exit;
    }

    // หากิจกรรมที่ไม่อยู่ใน active term และ status != locked
    $stmtFind = $conn->prepare("
        SELECT a.id, a.activity_name, a.term_id, t.term_name
        FROM activities a
        JOIN terms t ON a.term_id = t.id
        WHERE a.term_id != ? AND a.status != 'locked'
    ");
    $stmtFind->execute([$activeTerm['id']]);
    $toMigrate = $stmtFind->fetchAll(PDO::FETCH_ASSOC);

    if (empty($toMigrate)) {
        echo json_encode([
            "status" => "success",
            "message" => "ไม่มีกิจกรรมที่ต้องย้าย (กิจกรรมอยู่ใน active term อยู่แล้ว หรือ locked ทั้งหมด)",
            "active_term" => $activeTerm['term_name']
        ]);
        exit;
    }

    // ย้ายกิจกรรมไป active term
    $ids = array_column($toMigrate, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $params = array_merge([$activeTerm['id']], $ids);
    $stmtUpdate = $conn->prepare("UPDATE activities SET term_id = ? WHERE id IN ($placeholders)");
    $stmtUpdate->execute($params);

    echo json_encode([
        "status" => "success",
        "message" => "ย้ายกิจกรรมสำเร็จ " . count($toMigrate) . " รายการ → ภาคเรียน " . $activeTerm['term_name'],
        "active_term" => $activeTerm['term_name'],
        "migrated" => $toMigrate
    ]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
