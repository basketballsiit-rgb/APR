<?php
require_once 'config.php';
require_once 'line_helper.php';

// Allow OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $token = trim($data['token'] ?? '');
    $target_id = trim($data['target_id'] ?? '');

    if (empty($token)) {
        throw new Exception("กรุณาระบุ Channel Access Token");
    }

    $testMessage = '✅ ทดสอบระบบแจ้งเตือน LINE Messaging API ของระบบรายงานการเข้าร่วมกิจกรรม เรียบร้อยแล้ว';

    $result = sendLineMessage($token, $target_id, $testMessage);

    if ($result['success']) {
        echo json_encode(["status" => "success", "message" => "ส่งข้อความทดสอบสำเร็จ!"]);
    } else {
        throw new Exception("API ส่งข้อความไม่สำเร็จ: " . $result['error']);
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
