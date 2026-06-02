<?php
require_once 'config.php';

try {
    // รับค่า config จาก React
    $data = json_decode(file_get_contents('php://input'), true);
    
    $url = $data['url'] ?? '';
    $realm = $data['realm'] ?? '';
    $clientId = $data['client_id'] ?? '';
    $clientSecret = $data['client_secret'] ?? '';

    if(empty($url) || empty($realm) || empty($clientId) || empty($clientSecret)){
        throw new Exception("ข้อมูลการเชื่อมต่อ Keycloak ไม่ครบถ้วน");
    }

    // 1. ขอ Token ด้วย Client Credentials
    $url = rtrim($url, '/');
    $tokenUrl = "{$url}/realms/{$realm}/protocol/openid-connect/token";
    
    $ch = curl_init($tokenUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type' => 'client_credentials',
        'client_id' => $clientId,
        'client_secret' => $clientSecret
    ]));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception("ไม่สามารถขอ Access Token ($httpCode): " . $response);
    }

    $tokenData = json_decode($response, true);
    $accessToken = $tokenData['access_token'];

    // 2. ดึงข้อมูล Users ทั้งหมดผ่าน Admin API
    // แยก host และ port ออกมาจาก url เผื่อกรณีที่เป็น url ผูกแบบย่อ
    $parsedUrl = parse_url($url);
    $baseUrl = $parsedUrl['scheme'] . '://' . $parsedUrl['host'] . (isset($parsedUrl['port']) ? ':' . $parsedUrl['port'] : '');
    
    $usersUrl = "{$baseUrl}/admin/realms/{$realm}/users?max=1000"; // ดึงสูงสุด 1000 คน

    $ch2 = curl_init($usersUrl);
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer {$accessToken}",
        "Accept: application/json"
    ]);

    $usersResponse = curl_exec($ch2);
    $usersHttpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
    curl_close($ch2);

    if ($usersHttpCode !== 200) {
        throw new Exception("ไม่สามารถอ่านรายชื่อ Users ได้ (HTTP $usersHttpCode): อาจจะไม่มี Role 'view-users' ใน Service Account");
    }

    $users = json_decode($usersResponse, true);
    
    // 3. แปลง Format ข้อมูลให้ตรงกับ Excel Data ของเรา
    $formattedData = [];
    foreach ($users as $u) {
        // ใช้ username เป็น รหัส, ใช้ firstName + lastName เป็น ชื่อ
        $code = $u['username'] ?? '';
        $firstName = $u['firstName'] ?? '';
        $lastName = $u['lastName'] ?? '';
        $name = trim($firstName . ' ' . $lastName);
        
        if(empty($name)) {
            $name = $code; // fallback
        }

        // ดึงตำแหน่ง หรือ แผนก จาก Attributes ถ้ามี
        $position = '-';
        if(isset($u['attributes']['position'])) {
            $position = is_array($u['attributes']['position']) ? $u['attributes']['position'][0] : $u['attributes']['position'];
        }

        $groupName = 'กลุ่มจากระบบกลาง';
        if(isset($u['attributes']['department'])) {
            $groupName = is_array($u['attributes']['department']) ? $u['attributes']['department'][0] : $u['attributes']['department'];
        }

        $formattedData[] = [
            'code' => $code,
            'name' => $name,
            'position' => $position,
            'group_name' => $groupName
        ];
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'ซิงค์ข้อมูลสำเร็จ จำนวน ' . count($formattedData) . ' บัญชี',
        'data' => $formattedData
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
