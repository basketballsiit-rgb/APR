<?php
require_once 'config.php';

try {
    $term_id = isset($_GET['term_id']) ? (int)$_GET['term_id'] : 0;
    
    if (!$term_id) {
        throw new Exception("ไม่ระบุภาคเรียน");
    }

    // 1. ดึงภาคเรียน
    $stmtTerm = $conn->prepare("SELECT term_name FROM terms WHERE id = ?");
    $stmtTerm->execute([$term_id]);
    $term = $stmtTerm->fetch(PDO::FETCH_ASSOC);

    // 2. ดึงข้อมูลพนักงานทั้งหมดที่ใช้งานอยู่
    $stmtStaff = $conn->query("
        SELECT 
            s.id, s.staff_code AS code, s.full_name AS name,
            GROUP_CONCAT(g.group_name SEPARATOR ', ') AS group_name,
            GROUP_CONCAT(sga.group_id SEPARATOR ',') AS group_ids
        FROM staffs s
        LEFT JOIN staff_group_assignments sga ON s.id = sga.staff_id
        LEFT JOIN staff_groups g ON sga.group_id = g.id
        WHERE s.is_active = 1
        GROUP BY s.id
        ORDER BY s.staff_code
    ");
    $staffs = $stmtStaff->fetchAll(PDO::FETCH_ASSOC);

    // 3. ดึงกิจกรรมทั้งหมดในภาคเรียนนี้ที่ถึงกำหนดแล้ว
    $stmtAct = $conn->prepare("
        SELECT id, activity_name, group_id, activity_date 
        FROM activities 
        WHERE term_id = ? AND activity_date <= CURDATE()
        ORDER BY activity_date ASC
    ");
    $stmtAct->execute([$term_id]);
    $activities = $stmtAct->fetchAll(PDO::FETCH_ASSOC);

    // 4. ดึงข้อมูลการเข้าร่วม
    $stmtAtt = $conn->prepare("
        SELECT att.staff_id, att.activity_id, att.status 
        FROM act_attendance att
        JOIN activities a ON att.activity_id = a.id
        WHERE a.term_id = ? AND a.activity_date <= CURDATE()
    ");
    $stmtAtt->execute([$term_id]);
    $attendance = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);

    // 5. ดึงข้อมูล Proxy
    $stmtProxy = $conn->prepare("
        SELECT p.proxy_id, p.absent_id, p.activity_id, a.activity_name,
               s_proxy.full_name AS proxy_name,
               s_absent.full_name AS absent_name
        FROM act_proxy p
        JOIN activities a ON p.activity_id = a.id
        JOIN staffs s_proxy ON p.proxy_id = s_proxy.id
        JOIN staffs s_absent ON p.absent_id = s_absent.id
        WHERE a.term_id = ?
    ");
    $stmtProxy->execute([$term_id]);
    $proxies = $stmtProxy->fetchAll(PDO::FETCH_ASSOC);

    // สร้าง lookup proxy เพื่อเช็คว่าใครมีตัวแทนในกิจกรรมไหนบ้าง
    $proxyLookup = [];
    foreach ($proxies as $p) {
        $proxyLookup[$p['absent_id']][$p['activity_id']] = true;
    }

    // จัดระเบียบข้อมูล
    $staffMap = [];
    foreach ($staffs as $s) {
        $s['total_acts'] = 0;
        $s['attended'] = 0;
        $s['missed'] = 0;
        $s['remarks'] = [];
        if (empty($s['group_name'])) {
            $s['group_name'] = 'ไม่มีสังกัด';
        }
        $s['group_ids_array'] = $s['group_ids'] ? explode(',', $s['group_ids']) : [];
        $staffMap[$s['id']] = $s;
    }

    // คำนวณกิจกรรมทั้งหมดที่แต่ละคนต้องเข้า
    $actMap = [];
    foreach ($activities as $act) {
        $actMap[$act['id']] = $act;
        foreach ($staffMap as &$s) {
            $is_in_group = ($act['group_id'] == 0 || in_array($act['group_id'], $s['group_ids_array']));
            if ($is_in_group) {
                $s['total_acts']++;
            }
        }
        unset($s);
    }

    // สร้าง lookup การเข้าร่วมปกติ
    $attendanceLookup = [];
    foreach ($attendance as $att) {
        if ($att['status'] === 'present') {
            $attendanceLookup[$att['staff_id']][$att['activity_id']] = true;
        }
    }

    // คำนวณการเข้าร่วมโดยรวม
    foreach ($activities as $act) {
        foreach ($staffMap as &$s) {
            $is_in_group = ($act['group_id'] == 0 || in_array($act['group_id'], $s['group_ids_array']));
            
            if ($is_in_group) {
                // หากมาเข้าร่วมปกติก็นับว่า 'เข้าร่วม'
                if (isset($attendanceLookup[$s['id']][$act['id']])) {
                    $s['attended']++;
                }
            }
        }
        unset($s);
    }

    // คำนวณคนไม่เข้า และเพิ่มหมายเหตุ Proxy
    foreach ($proxies as $p) {
        $p_id = $p['proxy_id'];
        $a_id = $p['absent_id'];
        $act_name = $p['activity_name'];

        if (isset($staffMap[$p_id])) {
            $staffMap[$p_id]['remarks'][] = "ไปแทน " . $p['absent_name'] . " (" . $act_name . ")";
        }
        if (isset($staffMap[$a_id])) {
            $staffMap[$a_id]['remarks'][] = "มีผู้ไปแทน: " . $p['proxy_name'] . " (" . $act_name . ")";
        }
    }

    // สรุปรวม
    $resultData = [];
    foreach ($staffMap as $s) {
        // missed คือ กิจกรรมทั้งหมดที่ต้องเข้า - เข้าร่วมแล้ว
        // (ป้องกันติดลบ เผื่อมีข้อผิดพลาด)
        $s['missed'] = max(0, $s['total_acts'] - $s['attended']);
        
        $s['remark_text'] = implode(", ", $s['remarks']);
        unset($s['remarks']);
        
        $resultData[] = $s;
    }

    // สร้างสรุปรายชื่อกิจกรรมแยกตามกลุ่ม
    $stmtGroupMap = $conn->query("SELECT id, group_name FROM staff_groups");
    $groupsDict = [];
    foreach ($stmtGroupMap->fetchAll(PDO::FETCH_ASSOC) as $g) {
        $groupsDict[$g['id']] = $g['group_name'];
    }

    $actSummary = [];
    $thMonths = [
        1 => 'ม.ค.', 2 => 'ก.พ.', 3 => 'มี.ค.', 4 => 'เม.ย.',
        5 => 'พ.ค.', 6 => 'มิ.ย.', 7 => 'ก.ค.', 8 => 'ส.ค.',
        9 => 'ก.ย.', 10 => 'ต.ค.', 11 => 'พ.ย.', 12 => 'ธ.ค.'
    ];

    foreach ($activities as $act) {
        $gid = $act['group_id'];
        if ($gid == 0) {
            $catName = "กิจกรรมส่วนกลาง (นับรวมทุกคน)";
        } else {
            $gn = isset($groupsDict[$gid]) ? $groupsDict[$gid] : "กลุ่ม $gid";
            // ถ้าชื่อกลุ่มมีคำว่า "กลุ่ม" อยู่แล้วให้ใช้เลย ไม่งั้นเติมคำว่ากิจกรรมกลุ่ม
            if (mb_strpos($gn, 'กลุ่ม') === 0) {
                $catName = "กิจกรรม" . $gn;
            } else {
                $catName = "กิจกรรมกลุ่ม " . $gn;
            }
        }
        
        if (!isset($actSummary[$catName])) {
            $actSummary[$catName] = [];
        }
        
        $ts = strtotime($act['activity_date']);
        $thYearShort = (date('Y', $ts) + 543) % 100;
        $m = (int)date('m', $ts);
        $d = date('j', $ts);
        $dateStr = "$d " . $thMonths[$m] . " $thYearShort";
        
        $actSummary[$catName][] = "[$dateStr] " . $act['activity_name'];
    }

    echo json_encode([
        "status" => "success", 
        "data" => [
            "term" => $term ? $term['term_name'] : '',
            "activity_summary" => $actSummary,
            "report" => $resultData
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
