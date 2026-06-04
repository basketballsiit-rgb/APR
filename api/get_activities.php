<?php
require_once 'config.php';

// ดึงรายการกิจกรรมทั้งหมดพร้อมข้อมูลภาคเรียน
try {
    $term_id = isset($_GET['term_id']) ? (int)$_GET['term_id'] : 0;
    $where_clause = "";
    $params = [];
    if ($term_id > 0) {
        $where_clause = "WHERE a.term_id = ?";
        $params[] = $term_id;
    }

    $stmt = $conn->prepare("
        SELECT 
            a.id, 
            a.activity_name as name, 
            a.activity_date as raw_date,
            DATE_FORMAT(a.activity_date, '%d/%m/%Y') as date, 
            t.term_name as term, 
            CASE 
                WHEN a.status = 'locked' THEN 'locked'
                WHEN a.activity_date < CURDATE() THEN 'completed'
                WHEN a.activity_date = CURDATE() THEN 'active'
                ELSE 'upcoming'
            END as status,
            a.group_id,
            IFNULL(sg.group_name, 'ทั้งหมด') as group_name,
            a.attachment_path,
            a.report_pdf_path
        FROM activities a
        JOIN terms t ON a.term_id = t.id
        LEFT JOIN staff_groups sg ON a.group_id = sg.id
        $where_clause
        ORDER BY a.activity_date DESC
    ");
    $stmt->execute($params);
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $activities
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
