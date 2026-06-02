<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['id'])) {
        throw new Exception("ไม่ระบุรหัสกิจกรรม");
    }

    $id = (int)$data['id'];

    $stmt = $conn->prepare("UPDATE activities SET status = 'locked' WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(["status" => "success", "message" => "ล็อคกิจกรรมเรียบร้อยแล้ว"]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
