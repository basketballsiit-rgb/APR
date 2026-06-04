<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['id'])) {
        throw new Exception("ไม่ระบุรหัสกิจกรรม");
    }

    $id = (int)$data['id'];

    // Get the activity date to determine the correct status (completed, active, or upcoming)
    $stmtGet = $conn->prepare("SELECT activity_date FROM activities WHERE id = ?");
    $stmtGet->execute([$id]);
    $act = $stmtGet->fetch(PDO::FETCH_ASSOC);

    if (!$act) {
        throw new Exception("ไม่พบกิจกรรมนี้ในระบบ");
    }

    $date = $act['activity_date'];
    $today = date('Y-m-d');
    $status = 'upcoming';
    if ($date == $today) {
        $status = 'active';
    } elseif ($date < $today) {
        $status = 'completed';
    }

    $stmt = $conn->prepare("UPDATE activities SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);

    echo json_encode(["status" => "success", "message" => "ปลดล็อคกิจกรรมเรียบร้อยแล้ว"]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
