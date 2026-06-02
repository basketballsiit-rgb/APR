<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['term_name'])) {
        throw new Exception("กรุณาระบุชื่อภาคเรียน");
    }

    $term_name = trim($data['term_name']);

    if (!empty($data['id'])) {
        // Update existing term
        $stmt = $conn->prepare("UPDATE terms SET term_name = ? WHERE id = ?");
        $stmt->execute([$term_name, $data['id']]);
        echo json_encode(["status" => "success", "message" => "อัปเดตภาคเรียนสำเร็จ"]);
    } else {
        // First term check - if yes, set it active by default
        $stmt = $conn->query("SELECT COUNT(*) FROM terms");
        $count = $stmt->fetchColumn();
        $is_active = ($count == 0) ? 1 : 0;

        // Insert new term
        $stmt = $conn->prepare("INSERT INTO terms (term_name, is_active) VALUES (?, ?)");
        $stmt->execute([$term_name, $is_active]);
        echo json_encode(["status" => "success", "message" => "เพิ่มภาคเรียนสำเร็จ", "id" => $conn->lastInsertId()]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
