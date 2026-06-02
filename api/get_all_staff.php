<?php
require_once 'config.php';

try {
    $stmt = $conn->query("
        SELECT 
            s.id, 
            s.staff_code as code, 
            s.full_name as name, 
            s.position,
            COALESCE(s.role, 'user') as role,
            GROUP_CONCAT(g.group_name SEPARATOR ', ') as group_name,
            GROUP_CONCAT(sga.group_id SEPARATOR ',') as group_ids
        FROM staffs s
        LEFT JOIN staff_group_assignments sga ON s.id = sga.staff_id
        LEFT JOIN staff_groups g ON sga.group_id = g.id
        GROUP BY s.id
        ORDER BY s.staff_code ASC
    ");
    $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $staff]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
