<?php
require_once 'config.php';

$staff_id = isset($_GET['staff_id']) ? intval($_GET['staff_id']) : 0;

if (!$staff_id) {
    echo json_encode(['status' => 'error', 'message' => 'staff_id is required']);
    exit;
}

try {
    // 1. Get staff info + group names
    $stmtInfo = $conn->prepare("
        SELECT s.id, s.full_name, s.position, s.staff_code,
               GROUP_CONCAT(DISTINCT g.group_name ORDER BY g.group_name SEPARATOR ', ') as group_names
        FROM staffs s
        LEFT JOIN staff_group_assignments sga ON s.id = sga.staff_id
        LEFT JOIN staff_groups g ON sga.group_id = g.id
        WHERE s.id = ?
        GROUP BY s.id
    ");
    $stmtInfo->execute([$staff_id]);
    $staffInfo = $stmtInfo->fetch(PDO::FETCH_ASSOC);

    if (!$staffInfo) {
        echo json_encode(['status' => 'error', 'message' => 'Staff not found']);
        exit;
    }

    // 2. Get OWN GROUP activities + attendance status
    //    If proxy_by exists → treat as "present" (they arranged someone to substitute)
    $stmtOwn = $conn->prepare("
        SELECT 
            a.id as activity_id,
            a.activity_name,
            DATE_FORMAT(a.activity_date, '%d/%m/%Y') as activity_date,
            a.activity_date as raw_date,
            g.group_name,
            COALESCE(att.status, 'pending') as recorded_status,
            -- Who covered for them (if anyone)
            (SELECT s3.full_name FROM act_proxy ap2 
             JOIN staffs s3 ON ap2.proxy_id = s3.id 
             WHERE ap2.activity_id = a.id AND ap2.absent_id = ? LIMIT 1) as proxy_by
        FROM activities a
        INNER JOIN staff_group_assignments sga ON sga.group_id = a.group_id AND sga.staff_id = ?
        INNER JOIN staff_groups g ON g.id = a.group_id
        LEFT JOIN act_attendance att ON att.activity_id = a.id AND att.staff_id = ?
        ORDER BY a.activity_date DESC
    ");
    $stmtOwn->execute([$staff_id, $staff_id, $staff_id]);
    $ownActivities = $stmtOwn->fetchAll(PDO::FETCH_ASSOC);

    // Compute effective status: if proxy_by is set → counts as "present"
    foreach ($ownActivities as &$act) {
        if (!empty($act['proxy_by'])) {
            $act['effective_status'] = 'present'; // covered = present
        } else {
            $act['effective_status'] = $act['recorded_status'];
        }
    }
    unset($act);

    // 3. Get PROXY activities (where they went to substitute for others)
    //    These are shown separately and NOT counted in the main total
    $stmtProxy = $conn->prepare("
        SELECT 
            a.id as activity_id,
            a.activity_name,
            DATE_FORMAT(a.activity_date, '%d/%m/%Y') as activity_date,
            a.activity_date as raw_date,
            g.group_name,
            absent_staff.full_name as proxied_for
        FROM act_proxy ap
        JOIN activities a ON ap.activity_id = a.id
        JOIN staff_groups g ON g.id = a.group_id
        JOIN staffs absent_staff ON absent_staff.id = ap.absent_id
        WHERE ap.proxy_id = ?
        ORDER BY a.activity_date DESC
    ");
    $stmtProxy->execute([$staff_id]);
    $proxyActivities = $stmtProxy->fetchAll(PDO::FETCH_ASSOC);

    // 4. Summary — based on OWN GROUP activities only
    $total   = count($ownActivities);
    $present = count(array_filter($ownActivities, fn($a) => $a['effective_status'] === 'present'));
    $absent  = count(array_filter($ownActivities, fn($a) =>
        $a['effective_status'] === 'absent' || $a['effective_status'] === 'leave'
    ));
    $pending = count(array_filter($ownActivities, fn($a) => $a['effective_status'] === 'pending'));
    $proxyCount = count($proxyActivities); // informational only

    $rate = $total > 0 ? round(($present / $total) * 100, 1) : 0;

    echo json_encode([
        'status'        => 'success',
        'staff'         => $staffInfo,
        'summary'       => compact('total', 'present', 'absent', 'proxyCount', 'pending', 'rate'),
        'activities'    => $ownActivities,     // own group activities (for main list)
        'proxyHistory'  => $proxyActivities,   // activities they went to as a substitute (info only)
    ]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
