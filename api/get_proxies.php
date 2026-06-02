<?php
require_once 'config.php';

$activity_id = isset($_GET['activity_id']) ? (int)$_GET['activity_id'] : 0;
if ($activity_id === 0) {
    echo json_encode(["status" => "error", "message" => "Missing activity_id"]);
    exit();
}

$stmt = $conn->prepare("
    SELECT 
        px.absent_id,
        px.proxy_id,
        ps.full_name as proxy_name,
        ps.staff_code as proxy_code
    FROM act_proxy px
    JOIN staffs ps ON ps.id = px.proxy_id
    WHERE px.activity_id = :activity_id
");
$stmt->execute([':activity_id' => $activity_id]);
$proxies = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["status" => "success", "data" => $proxies]);
?>
