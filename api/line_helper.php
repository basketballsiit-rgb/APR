<?php
/**
 * ส่งข้อความผ่าน LINE Messaging API พร้อมรองรับกรณี DNS ไม่ตอบสนอง
 */
function sendLineMessage(string $token, string $target_id, string $message_text): array {
    if (empty($token)) {
        return ['success' => false, 'error' => 'No token'];
    }

    $messageData = [
        'messages' => [['type' => 'text', 'text' => $message_text]]
    ];

    $url = 'https://api.line.me/v2/bot/message/broadcast';
    if (!empty($target_id)) {
        $url = 'https://api.line.me/v2/bot/message/push';
        $messageData['to'] = $target_id;
    }

    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ];

    // พยายาม Resolve IP ของ api.line.me ก่อน เพื่อ Bypass DNS ที่ช้า
    $resolveOpts = [];
    $lineIp = @gethostbyname('api.line.me');
    if ($lineIp && $lineIp !== 'api.line.me') {
        // DNS resolve สำเร็จ บอก cURL ใช้ IP นี้เลย
        $resolveOpts = ["api.line.me:443:$lineIp"];
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($messageData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    // ใช้ CURLOPT_RESOLVE ถ้า resolve สำเร็จ
    if (!empty($resolveOpts)) {
        curl_setopt($ch, CURLOPT_RESOLVE, $resolveOpts);
    }

    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        return ['success' => false, 'error' => $curlError, 'http_code' => 0];
    }

    $response = json_decode($result, true);
    if ($httpCode >= 200 && $httpCode < 300) {
        return ['success' => true, 'http_code' => $httpCode];
    }

    $apiError = $response['message'] ?? ($result ?: 'Unknown Error');
    return ['success' => false, 'error' => "HTTP $httpCode: $apiError", 'http_code' => $httpCode];
}
?>
