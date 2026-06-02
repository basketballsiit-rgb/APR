<?php
require_once 'config.php';
$stmt = $conn->query('DESCRIBE activities');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
