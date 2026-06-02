<?php
require_once 'config.php';

try {
    $stmt = $conn->query("SELECT id, term_name, is_active FROM terms ORDER BY id DESC");
    $terms = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $terms]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
