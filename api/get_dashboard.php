<?php
require_once 'config.php';

// ดึงจำนวนบุคลากรทั้งหมดที่ยังทำงานอยู่
$stmt = $conn->prepare("SELECT COUNT(id) as total FROM staffs WHERE is_active = 1");
$stmt->execute();
$totalStaff = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// ดึงจำนวนกิจกรรมทั้งหมดในเทอมปัจจุบัน
$stmt = $conn->prepare("
    SELECT COUNT(a.id) as total 
    FROM activities a 
    JOIN terms t ON a.term_id = t.id 
    WHERE t.is_active = 1
");
$stmt->execute();
$totalActivities = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// คำนวณเปอร์เซ็นต์การเข้าร่วม (มา) จากการเช็คชื่อทั้งหมดในเทอมปัจจุบัน
$stmt = $conn->prepare("
    SELECT 
        COUNT(att.id) as total_attendance,
        SUM(CASE WHEN att.status = 'present' THEN 1 ELSE 0 END) as total_present
    FROM act_attendance att
    JOIN activities a ON att.activity_id = a.id
    JOIN terms t ON a.term_id = t.id
    WHERE t.is_active = 1 AND att.status != 'pending'
");
$stmt->execute();
$attendanceData = $stmt->fetch(PDO::FETCH_ASSOC);
$overallAttendance = 0;
if ($attendanceData['total_attendance'] > 0) {
    $overallAttendance = round(($attendanceData['total_present'] / $attendanceData['total_attendance']) * 100, 1);
}

// ข้อมูลสำหรับกราฟ: การเข้าร่วมแยกตามกลุ่ม (เปอร์เซ็นต์ มา และ ขาด/ลา)
// ดึงกลุ่มทั้งหมดและจำนวนสมาชิก
$stmtGroups = $conn->query("
    SELECT sg.id, sg.group_name as name, COUNT(sga.staff_id) as total_members
    FROM staff_groups sg
    LEFT JOIN staff_group_assignments sga ON sg.id = sga.group_id
    GROUP BY sg.id
");
$groups = $stmtGroups->fetchAll(PDO::FETCH_ASSOC);

// ดึงการเข้ากิจกรรมของแต่ละกลุ่ม (เฉพาะเทอมปัจจุบัน และเฉพาะกิจกรรมของกลุ่มนั้นเอง)
$stmtAtt = $conn->query("
    SELECT 
        sg.id as group_id,
        a.id as activity_id,
        SUM(CASE WHEN att.status = 'present' THEN 1 ELSE 0 END) as present_cnt,
        SUM(CASE WHEN att.status IN ('absent', 'leave') THEN 1 ELSE 0 END) as absent_cnt
    FROM staff_groups sg
    JOIN staff_group_assignments sga ON sg.id = sga.group_id
    JOIN act_attendance att ON sga.staff_id = att.staff_id
    JOIN activities a ON att.activity_id = a.id AND a.group_id = sg.id
    JOIN terms t ON a.term_id = t.id
    WHERE t.is_active = 1 AND att.status != 'pending'
    GROUP BY sg.id, a.id
    ORDER BY a.activity_date ASC, a.id ASC
");
$attendances = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);

$groupStats = [];
foreach ($groups as $g) {
    $groupStats[$g['id']] = [
        'name' => $g['name'],
        'total_members' => $g['total_members'],
        'presents' => [],
        'absents' => [],
        'total_present_all' => 0,
        'total_absent_all' => 0
    ];
}

foreach ($attendances as $row) {
    $gid = $row['group_id'];
    if (isset($groupStats[$gid])) {
        $groupStats[$gid]['presents'][] = $row['present_cnt'];
        $groupStats[$gid]['absents'][] = $row['absent_cnt'];
        $groupStats[$gid]['total_present_all'] += $row['present_cnt'];
        $groupStats[$gid]['total_absent_all'] += $row['absent_cnt'];
    }
}

$chartData = [];
foreach ($groupStats as $gid => $stats) {
    $act_count = count($stats['presents']); 
    if ($act_count > 0) {
        $detailStr = implode('/', $stats['presents']);
        $absentStr = implode('/', $stats['absents']);
    } else {
        $detailStr = '0';
        $absentStr = '0';
    }

    $chartData[] = [
        "name" => $stats['name'],
        "เข้าร่วม" => $stats['total_present_all'],
        "ขาด" => $stats['total_absent_all'],
        "รายละเอียดเข้าร่วม" => $detailStr,
        "รายละเอียดขาด" => $absentStr,
        "จำนวนกิจกรรม" => $act_count,
        "จำนวนคนทั้งกลุ่ม" => $stats['total_members']
    ];
}

// ส่งผลลัพธ์กลับเป็น JSON
echo json_encode([
    "status" => "success",
    "data" => [
        "totalStaff" => (int)$totalStaff,
        "totalActivities" => (int)$totalActivities,
        "overallAttendance" => $overallAttendance,
        "chartData" => $chartData
    ]
]);
?>
