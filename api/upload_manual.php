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
            throw new Exception("ขนาดไฟล์ใหญ่เกินกว่าที่เซิร์ฟเวอร์กำหนด (upload_max_filesize)");
        }
        throw new Exception("เกิดข้อผิดพลาดในการอัปโหลดไฟล์ (Code: $file_error)");
    }

    // Check file size (max 20MB)
    if ($file_size > 20 * 1024 * 1024) {
        throw new Exception("ไฟล์มีขนาดใหญ่เกินกว่า 20 MB");
    }

    // Check file type (PDF Only for manual)
    $ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
    if ($ext !== 'pdf') {
        throw new Exception("ระบบอนุญาตให้อัปโหลดเฉพาะไฟล์ PDF เท่านั้น");
    }

    // Create upload directory if it doesn't exist
    if (!is_dir($upload_dir)) {
        if (!mkdir($upload_dir, 0755, true)) {
            throw new Exception("ไม่สามารถสร้างโฟลเดอร์ uploads ได้ กรุณาตรวจสอบสิทธิ์");
        }
    }

    // Verify directory is writable
    $real_upload_dir = realpath($upload_dir);
    if (!$real_upload_dir || !is_writable($real_upload_dir)) {
        throw new Exception("โฟลเดอร์ uploads ไม่มีสิทธิ์เขียนไฟล์ (Permission Denied)");
    }

    // Always save as manual.pdf
    $new_file_name = 'manual.pdf';
    $destination = $real_upload_dir . '/' . $new_file_name;

    if (move_uploaded_file($file_tmp, $destination)) {
        echo json_encode([
            "status" => "success", 
            "message" => "อัปโหลดคู่มือสำเร็จ", 
            "file_path" => 'uploads/' . $new_file_name
        ]);
    } else {
        throw new Exception("ไม่สามารถบันทึกไฟล์ได้ กรุณาตรวจสอบสิทธิ์ของโฟลเดอร์ uploads");
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
