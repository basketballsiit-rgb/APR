<?php
require_once 'config.php';

try {
    $conn->beginTransaction();

    // เคลียร์ประวัติการลงชื่อทั้งหมดก่อน เพื่อไม่ให้ติด Foreign Key
    $conn->exec("DELETE FROM act_attendance");
    
    // เคลียร์พนักงานทั้งหมด
    $conn->exec("DELETE FROM staffs");
    $conn->exec("ALTER TABLE staffs AUTO_INCREMENT = 1");

    // เคลียร์กลุ่มไปด้วยเลยก็ได้ (ตัวเลือก)
    $conn->exec("DELETE FROM staff_groups");
    $conn->exec("ALTER TABLE staff_groups AUTO_INCREMENT = 1");

    $conn->commit();

    echo json_encode(['status' => 'success', 'message' => 'ล้างข้อมูลบุคลากรและกลุ่มออกจากระบบทั้งหมดเรียบร้อยแล้ว']);
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาดในการล้างข้อมูล: ' . $e->getMessage()]);
}
?>
