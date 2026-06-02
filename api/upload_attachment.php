<?php
require_once 'config.php';

// Allow OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$upload_dir = '../uploads/';

try {
    if (!isset($_FILES['file'])) {
        throw new Exception("ไม่พบไฟล์ที่อัปโหลด");
    }

    $file = $_FILES['file'];
    $file_name = $file['name'];
    $file_tmp = $file['tmp_name'];
    $file_size = $file['size'];
    $file_error = $file['error'];

    if ($file_error !== UPLOAD_ERR_OK) {
        if ($file_error === UPLOAD_ERR_INI_SIZE) {
            throw new Exception("เซิร์ฟเวอร์ปฏิเสธการรับไฟล์ (ชนิดข้อผิดพลาด: ไฟล์ใหญ่เกินกว่า upload_max_filesize ที่ตั้งไว้ใน php.ini) กรุณาติดต่อผู้ดูแลเซิร์ฟเวอร์ครับ");
        }
        throw new Exception("เกิดข้อผิดพลาดในการอัปโหลดไฟล์ (Code: $file_error)");
    }

    // Check file size (max 20MB)
    if ($file_size > 20 * 1024 * 1024) {
        throw new Exception("ไฟล์มีขนาดใหญ่เกินกว่า 20 MB");
    }

    // Check file type
    $ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
    $allowed_exts = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'];
    if (!in_array($ext, $allowed_exts)) {
        throw new Exception("ไม่อนุญาตให้อัปโหลดไฟล์ประเภทนี้ ($ext)");
    }

    // Create upload directory if it doesn't exist
    if (!is_dir($upload_dir)) {
        if (!mkdir($upload_dir, 0755, true)) {
            throw new Exception("ไม่สามารถสร้างโฟลเดอร์ uploads ได้ กรุณาสร้างโฟลเดอร์ 'uploads' ด้วยตนเองบนเซิร์ฟเวอร์แล้วให้สิทธิ์ write ครับ");
        }
    }

    // Verify directory is writable
    $real_upload_dir = realpath($upload_dir);
    if (!$real_upload_dir || !is_writable($real_upload_dir)) {
        $path_hint = $real_upload_dir ?: (dirname(__DIR__) . '/uploads');
        throw new Exception("โฟลเดอร์ uploads ไม่มีสิทธิ์เขียนไฟล์ กรุณาเปลี่ยนสิทธิ์ (chmod) เป็น 755 หรือ 777 สำหรับโฟลเดอร์: $path_hint");
    }

    $new_file_name = uniqid('att_') . '.' . $ext;
    $destination = $real_upload_dir . '/' . $new_file_name;

    if (move_uploaded_file($file_tmp, $destination)) {
        echo json_encode([
            "status" => "success", 
            "message" => "อัปโหลดไฟล์สำเร็จ", 
            "file_path" => 'uploads/' . $new_file_name
        ]);
    } else {
        throw new Exception("ไม่สามารถบันทึกไฟล์ได้ กรุณาตรวจสอบสิทธิ์ของโฟลเดอร์ uploads บน Server ว่าสามารถเขียนไฟล์ได้หรือไม่");
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
