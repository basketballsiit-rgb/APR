<?php
// webhook.php - ดักจับ Group ID และตอบกลับในกลุ่มอัตโนมัติ
require_once __DIR__ . '/api/config.php';

$body = file_get_contents('php://input');
$data = json_decode($body, true);
$events = $data['events'] ?? [];

// บันทึก log
$logData = date('Y-m-d H:i:s') . "\n" . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n---\n";
file_put_contents(__DIR__ . '/webhook_log.txt', $logData, FILE_APPEND);

// ดึง token จาก system_settings
try {
    $row = $conn->query("SELECT `value` FROM system_settings WHERE `key` = 'line_channel_token' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    $token = trim($row['value'] ?? '');
} catch (Exception $e) {
    $token = '';
}

foreach ($events as $event) {
    $sourceType = $event['source']['type'] ?? '';
    $groupId    = $event['source']['groupId'] ?? '';
    $replyToken = $event['replyToken'] ?? '';

    // ถ้าเป็น event จากกลุ่ม และมี replyToken (เช่น มีคนส่งข้อความ)
    if ($sourceType === 'group' && !empty($groupId) && !empty($replyToken) && !empty($token)) {
        // ตอบกลับด้วย Group ID
        $replyMsg = "🤖 Group ID ของกลุ่มนี้:\n\n{$groupId}\n\nนำค่านี้ไปใส่ในหน้าตั้งค่าระบบ ช่อง 'Target ID' ได้เลยครับ";

        $ch = curl_init('https://api.line.me/v2/bot/message/reply');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'replyToken' => $replyToken,
            'messages'   => [['type' => 'text', 'text' => $replyMsg]]
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_exec($ch);
        curl_close($ch);
    }
}

http_response_code(200);
echo 'OK';
?>
