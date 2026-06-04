<?php
// api/save_report_pdf.php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $activity_id = isset($data['activity_id']) ? (int)$data['activity_id'] : 0;
    $report_pdf_path = isset($data['report_pdf_path']) ? $data['report_pdf_path'] : null;

    if (!$activity_id) {
        throw new Exception("ไม่พบรหัสกิจกรรม");
    }

    $stmt = $conn->prepare("UPDATE activities SET report_pdf_path = ? WHERE id = ?");
    $stmt->execute([$report_pdf_path, $activity_id]);

    echo json_encode([
        'status' => 'success',
        'message' => 'บันทึกไฟล์รายงานสำเร็จ'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
