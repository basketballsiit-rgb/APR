<?php
// api/delete_backup.php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $filename = $data['filename'] ?? '';

    if (empty($filename)) {
        throw new Exception("ไม่พบชื่อไฟล์ที่จะลบ");
    }

    // Safety checks: Prevent directory traversal
    $filename = basename($filename);
    
    // Check filename format (should be db_backup_*.sql)
    if (!preg_match('/^db_backup_\d{8}_\d{6}\.sql$/', $filename)) {
        throw new Exception("ชื่อไฟล์ไม่ถูกต้องเพื่อความปลอดภัย");
    }

    $file_path = '../backups/' . $filename;

    if (!file_exists($file_path)) {
        throw new Exception("ไม่พบไฟล์สำรองข้อมูลบนเซิร์ฟเวอร์");
    }

    if (unlink($file_path)) {
        echo json_encode([
            "status" => "success",
            "message" => "ลบไฟล์สำรองข้อมูลสำเร็จ"
        ]);
    } else {
        throw new Exception("ไม่สามารถลบไฟล์สำรองข้อมูลได้");
    }

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
