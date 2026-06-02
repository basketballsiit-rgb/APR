<?php
// ตั้งค่าต้อนรับการเรียกใช้ (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// --- Environment-aware DB Configuration ---
// On the production server (service.npc.ac.th), the DB name is 'APR' with a password.
// On local XAMPP (localhost), the DB name is 'srs_db' with no password.
// Safe for CLI (cron) execution — $_SERVER['HTTP_HOST'] may not exist.
$httpHost = $_SERVER['HTTP_HOST'] ?? 'localhost';
$isProduction = ($httpHost !== 'localhost' && $httpHost !== '127.0.0.1');

// When running from CLI (cron), always use production DB
if (PHP_SAPI === 'cli') {
    $isProduction = true;
}

if ($isProduction) {
    $host     = "localhost";
    $db_name  = "APR";
    $username = "root";
    $password = "@Npc2026#";
} else {
    $host     = "localhost";
    $db_name  = "srs_db";
    $username = "root";
    $password = "";
}

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    echo json_encode(["status" => "error", "message" => "Connection error: " . $exception->getMessage()]);
    exit();
}
?>
