<?php
require_once 'config.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    
    // Keycloak config (Can be adjusted if stored in DB)
    $kc_url = 'http://service.npc.ac.th';
    $realm = 'NPC-SSO';
    $client_id = 'apr-app';
    $client_secret = 'foJMT0AEt1yNlFAtaqouuYQbhp4iCcVc';

    if (empty($username) || empty($password)) {
        throw new Exception("กรุณากรอกข้อมูลให้ครบถ้วน");
    }

    // --- DEV BYPASS ---
    // ชั่วคราวสำหรับการพัฒนาระบบ ให้ admin / admin เข้าสู่ระบบได้เลยโดยข้าม Keycloak
    if ($username === 'admin' && $password === 'admin') {
        $httpCode = 200;
        $tokenData = ['access_token' => 'dev_bypass_token_' . time()];
    } else {
        // 1. ตรวจสอบรหัสผ่านกับ Keycloak (Direct Access Grant)
        $tokenUrl = rtrim($kc_url, '/') . "/realms/{$realm}/protocol/openid-connect/token";
        
        $ch = curl_init($tokenUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'grant_type' => 'password',
            'client_id' => $client_id,
            'client_secret' => $client_secret,
            'username' => $username,
            'password' => $password
        ]));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $tokenData = json_decode($response, true);

        if ($httpCode !== 200 || isset($tokenData['error'])) {
            throw new Exception("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
        }
    }

    // 2. ถ้าเข้าสู่ระบบสำเร็จ ให้ดึงข้อมูลพนักงานจากระบบ
    $stmt = $conn->prepare("SELECT id, staff_code, full_name, group_id FROM staffs WHERE staff_code = ? AND is_active = 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception("ไม่พบข้อมูลบุคลากรในระบบ กรุณาตรวจสอบให้แน่ใจว่าซิงค์ข้อมูลแล้ว");
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'เข้าสู่ระบบสำเร็จ',
        'user' => $user,
        'access_token' => $tokenData['access_token'] // ส่ง token กลับเผื่อให้ frontend ใช้
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
