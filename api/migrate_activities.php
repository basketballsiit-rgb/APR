<?php
require_once 'config.php';

try {
    // Check if column exists
    $stmt = $conn->query("SHOW COLUMNS FROM activities LIKE 'attachment_path'");
    if ($stmt->rowCount() == 0) {
        $conn->exec("ALTER TABLE activities ADD COLUMN attachment_path VARCHAR(255) NULL");
        echo "Column attachment_path added successfully.\n";
    } else {
        echo "Column attachment_path already exists.\n";
    }
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
