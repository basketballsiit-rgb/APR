<?php
require_once 'config.php';

// ดึงการตั้งค่า LINE จาก DB
$rows = $conn->query("SELECT `key`, `value` FROM system_settings WHERE `key` LIKE 'line_%'")->fetchAll(PDO::FETCH_ASSOC);
$lineSettings = [];
foreach ($rows as $row) {
    $lineSettings[$row['key']] = $row['value'];
}

$token = trim($lineSettings['line_channel_token'] ?? '');
$target_id = trim($lineSettings['line_target_id'] ?? '');
$template = trim($lineSettings['line_message_template'] ?? '');

// จำลองการแทนที่ตัวแปร
$name = "ทดสอบระบบส่งแจ้งเตือน";
$formattedDate = "6 เม.ย. 2569";
$web_url = "https://service.npc.ac.th/APR/";
$attachment_text = "📎 ลิงก์เอกสารอ้างอิง: https://service.npc.ac.th/APR/uploads/att_test.pdf";

$lineMsgText = str_replace(
    ['[activity_name]', '[activity_date]', '[link]', '[attachment]'],
    [$name, $formattedDate, $web_url, $attachment_text],
    $template
);
$lineMsgText = preg_replace('/\n{2,}/', "\n", trim($lineMsgText));

// เลือก URL
$url = 'https://api.line.me/v2/bot/message/broadcast';
$messageData = ['messages' => [['type' => 'text', 'text' => $lineMsgText]]];
if (!empty($target_id)) {
    $url = 'https://api.line.me/v2/bot/message/push';
    $messageData['to'] = $target_id;
}

$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token
];

// เรียก LINE API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($messageData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo json_encode([
    'url_used' => $url,
    'target_id' => $target_id,
    'message_text' => $lineMsgText,
    'http_code' => $httpCode,
    'curl_error' => $curlError ?: null,
    'line_response' => json_decode($result, true) ?? $result,
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
