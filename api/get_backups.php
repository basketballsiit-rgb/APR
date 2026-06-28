<?php
// api/get_backups.php
require_once 'config.php';

try {
    $backup_dir = '../uploads/backups/';
    $backups = [];

    if (is_dir($backup_dir)) {
        $files = scandir($backup_dir);
        foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'sql') {
                $file_path = $backup_dir . $file;
                $size = filesize($file_path);
                
                // Format size
                if ($size >= 1048576) {
                    $formatted_size = round($size / 1048576, 2) . ' MB';
                } else {
                    $formatted_size = round($size / 1024, 2) . ' KB';
                }

                $backups[] = [
                    'filename' => $file,
                    'size' => $formatted_size,
                    'created_at' => date('d/m/Y H:i:s', filemtime($file_path)),
                    'raw_time' => filemtime($file_path)
                ];
            }
        }

        // Sort by newest first
        usort($backups, function($a, $b) {
            return $b['raw_time'] - $a['raw_time'];
        });
    }

    echo json_encode([
        "status" => "success",
        "data" => $backups
    ]);

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
