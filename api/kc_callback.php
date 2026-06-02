<?php
require_once 'config.php';

$client_id = 'apr-app';
$client_secret = 'foJMT0AEt1yNlFAtaqouuYQbhp4iCcVc';
// Auto-detect protocol and host
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$host = $_SERVER['HTTP_HOST'];
$redirect_uri = $protocol . $host . '/APR/api/kc_callback.php';

$kc_token_url = 'https://service.npc.ac.th/realms/NPC-SSO/protocol/openid-connect/token';
$kc_userinfo_url = 'https://service.npc.ac.th/realms/NPC-SSO/protocol/openid-connect/userinfo';

if (!isset($_GET['code'])) {
    die("Error: No authorization code received from Keycloak.");
}

$code = $_GET['code'];

// 1. Exchange the Authorization Code for an Access Token
$ch = curl_init($kc_token_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'grant_type' => 'authorization_code',
    'client_id' => $client_id,
    'client_secret' => $client_secret,
    'code' => $code,
    'redirect_uri' => $redirect_uri
]));

$response = curl_exec($ch);
curl_close($ch);

$tokenData = json_decode($response, true);

if (!isset($tokenData['access_token'])) {
    die("Error: Could not retrieve token from Keycloak. Details: " . htmlspecialchars($response));
}

$access_token = $tokenData['access_token'];

// 2. Fetch User Profile Info from Keycloak Userinfo Endpoint
$ch = curl_init($kc_userinfo_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $access_token"
]);
$userInfoStr = curl_exec($ch);
curl_close($ch);

$userInfo = json_decode($userInfoStr, true);

// Typical OIDC yields standard claims. Try 'email', fallback to 'preferred_username'
if (!isset($userInfo['email']) && !isset($userInfo['preferred_username'])) {
    die("Error: Could not determine user email/username from Keycloak UserInfo. Details: " . htmlspecialchars($userInfoStr));
}

$email = $userInfo['email'] ?? $userInfo['preferred_username'];

// Wait, the Google SAML/OIDC might return email as preferred_username, or email, or both.
// Let's ensure we just map the email.

// 3. Look up user in APR database using the email/username as staff_code
$stmt = $conn->prepare("SELECT id, staff_code, full_name, COALESCE(role, 'user') as role FROM staffs WHERE staff_code = ? AND is_active = 1");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    // ---- AUTO-PROVISION: สร้างบัญชีใหม่อัตโนมัติจากข้อมูล Keycloak ----
    $firstName = $userInfo['given_name'] ?? $userInfo['firstName'] ?? '';
    $lastName  = $userInfo['family_name'] ?? $userInfo['lastName'] ?? '';
    $fullName  = trim($firstName . ' ' . $lastName);
    if (empty($fullName)) {
        $fullName = $email; // fallback ใช้ username ถ้าไม่มีชื่อ
    }

    // ดึงตำแหน่งจาก attributes (ถ้ามี)
    $position = '-';
    if (isset($userInfo['position'])) {
        $position = is_array($userInfo['position']) ? $userInfo['position'][0] : $userInfo['position'];
    }

    // Insert บัญชีใหม่ role='user', ไม่มีกลุ่ม (Admin กำหนดทีหลัง)
    $ins = $conn->prepare("INSERT INTO staffs (staff_code, full_name, position, role, is_active) VALUES (?, ?, ?, 'user', 1)");
    $ins->execute([$email, $fullName, $position]);
    $newId = $conn->lastInsertId();

    $user = [
        'id'         => (int)$newId,
        'staff_code' => $email,
        'full_name'  => $fullName,
        'role'       => 'user',
    ];
}

// 4. Successful login: Generate the localStorage injection script
$userDataJson = json_encode($user);
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <title>เข้าสู่ระบบสำเร็จ...</title>
</head>
<body>
    <div style="font-family: sans-serif; text-align: center; margin-top: 20vh;">
        <h3>กำลังนำท่านเข้าสู่ระบบ...</h3>
    </div>
    <script>
        localStorage.setItem('srs_user', '<?php echo addslashes($userDataJson); ?>');
        window.location.href = '/APR/';
    </script>
</body>
</html>
