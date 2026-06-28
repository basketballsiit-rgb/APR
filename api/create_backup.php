<?php
// api/create_backup.php
require_once 'config.php';

try {
    // 1. Create backups folder if not exists
    $backup_dir = '../uploads/backups/';
    if (!is_dir($backup_dir)) {
        if (!mkdir($backup_dir, 0755, true)) {
            throw new Exception("ไม่สามารถสร้างโฟลเดอร์ backups ได้");
        }
    }

    // Verify backups folder is writable
    if (!is_writable($backup_dir)) {
        throw new Exception("โฟลเดอร์ backups ไม่มีสิทธิ์เขียนไฟล์ (Permission Denied)");
    }

    // 2. Fetch all tables dynamically
    $tables = [];
    $stmt = $conn->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }

    if (empty($tables)) {
        throw new Exception("ไม่พบตารางในฐานข้อมูล");
    }

    $sql_content = "-- Database Backup\n";
    $sql_content .= "-- Generated on: " . date('Y-m-d H:i:s') . "\n";
    $sql_content .= "-- Host: " . $host . "\n";
    $sql_content .= "-- Database: " . $db_name . "\n\n";
    $sql_content .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

    // 3. Dump each table structure and data
    foreach ($tables as $table) {
        // Structure
        $sql_content .= "-- --------------------------------------------------------\n";
        $sql_content .= "-- Table structure for table `$table`\n";
        $sql_content .= "-- --------------------------------------------------------\n";
        $sql_content .= "DROP TABLE IF EXISTS `$table`;\n";
        
        $create_stmt = $conn->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC);
        $sql_content .= $create_stmt['Create Table'] . ";\n\n";

        // Data
        $sql_content .= "-- Dumping data for table `$table`\n";
        $rows_stmt = $conn->query("SELECT * FROM `$table`");
        $rows = $rows_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($rows)) {
            foreach ($rows as $row) {
                $keys = array_keys($row);
                $escaped_keys = array_map(function($k) { return "`$k`"; }, $keys);
                
                $values = array_values($row);
                $escaped_values = array_map(function($v) use ($conn) {
                    if ($v === null) {
                        return "NULL";
                    }
                    return $conn->quote($v);
                }, $values);

                $sql_content .= "INSERT INTO `$table` (" . implode(', ', $escaped_keys) . ") VALUES (" . implode(', ', $escaped_values) . ");\n";
            }
        }
        $sql_content .= "\n";
    }

    $sql_content .= "SET FOREIGN_KEY_CHECKS=1;\n";

    // 4. Save file
    $file_name = 'db_backup_' . date('Ymd_His') . '.sql';
    $destination = $backup_dir . $file_name;

    if (file_put_contents($destination, $sql_content) !== false) {
        echo json_encode([
            "status" => "success",
            "message" => "สำรองข้อมูลฐานข้อมูลสำเร็จ: $file_name",
            "file" => $file_name
        ]);
    } else {
        throw new Exception("ไม่สามารถเขียนไฟล์สำรองข้อมูลได้");
    }

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
