<?php
// api/migrate_report_pdf.php
require_once 'config.php';

header('Content-Type: text/plain; charset=utf-8');
echo "=== Migrating Database: Add report_pdf_path to activities ===\n";

try {
    $checkCol = $conn->query("SHOW COLUMNS FROM activities LIKE 'report_pdf_path'");
    if ($checkCol->rowCount() === 0) {
        $conn->exec("ALTER TABLE activities ADD COLUMN report_pdf_path VARCHAR(255) NULL AFTER report_images");
        echo "✅ Column 'report_pdf_path' added successfully!\n";
    } else {
        echo "⏭️ Column 'report_pdf_path' already exists.\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
