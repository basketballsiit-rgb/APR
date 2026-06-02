<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !is_array($data) || empty($data)) {
        throw new Exception("ไม่มีข้อมูลอัปโหลดหรือข้อมูลไม่ถูกต้อง");
    }

    $conn->beginTransaction();
    
    $importedCount = 0;
    
    // Map existing groups: name => id
    $stmtGroups = $conn->query("SELECT id, group_name as name FROM staff_groups");
    $existingGroups = [];
    while ($row = $stmtGroups->fetch(PDO::FETCH_ASSOC)) {
        // use lower case or exact match, here we match exactly trimmed
        $existingGroups[trim($row['name'])] = $row['id'];
    }
    
    foreach ($data as $staff) {
        $code = trim($staff['code'] ?? '');
        $name = trim($staff['name'] ?? '');
        $position = trim($staff['position'] ?? '');
        $groupName = trim($staff['group_name'] ?? '');
        
        if (empty($code) || empty($name)) {
            continue; // ข้ามข้อมูลที่ไม่ค่อยสมบูรณ์
        }
        
        $groupId = null;
        if (!empty($groupName)) {
            if (isset($existingGroups[$groupName])) {
                $groupId = $existingGroups[$groupName];
            } else {
                // ออโต้สร้างกลุ่มใหม่หากยังไม่เคบมี
                $stmtNewGroup = $conn->prepare("INSERT INTO staff_groups (group_name) VALUES (?)");
                $stmtNewGroup->execute([$groupName]);
                $groupId = $conn->lastInsertId();
                $existingGroups[$groupName] = $groupId;
            }
        }
        
        // เช็คว่าเคยมีรหัสพนักงานนี้หรือไม่
        $staffId = null;
        $stmtCheck = $conn->prepare("SELECT id FROM staffs WHERE staff_code = ?");
        $stmtCheck->execute([$code]);
        if ($stmtCheck->rowCount() > 0) {
            // Update
            $staffId = $stmtCheck->fetchColumn();
            $stmtUpdate = $conn->prepare("UPDATE staffs SET full_name = ?, position = ? WHERE staff_code = ?");
            $stmtUpdate->execute([$name, $position, $code]);
        } else {
            // Insert
            $stmtInsert = $conn->prepare("INSERT INTO staffs (staff_code, full_name, position, is_active) VALUES (?, ?, ?, 1)");
            $stmtInsert->execute([$code, $name, $position]);
            $staffId = $conn->lastInsertId();
        }
        
        // Insert into pivot table
        if ($groupId && $staffId) {
            $stmtAssign = $conn->prepare("INSERT IGNORE INTO staff_group_assignments (staff_id, group_id) VALUES (?, ?)");
            $stmtAssign->execute([$staffId, $groupId]);
        }
        
        $importedCount++;
    }
    
    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => "บันทึกข้อมูลเรียบร้อย จำนวน $importedCount รายชื่อ"]);
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()]);
}
