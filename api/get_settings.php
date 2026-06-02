<?php
require_once 'config.php';

// Create settings table if not exists
$conn->exec("
    CREATE TABLE IF NOT EXISTS system_settings (
        `key` VARCHAR(100) PRIMARY KEY,
        `value` TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

// Insert defaults if they don't exist
$defaults = [
    'director_name'  => '',
    'deputy_director_name' => '',
    'line_api_enabled' => 'false',
    'line_channel_token' => '',
    'line_target_id' => '',
    'line_message_template' => "🔔 กิจกรรมใหม่: [activity_name]\n📅 วันที่จัดกิจกรรม: [activity_date]\nเข้าสู่ระบบเพื่อดูรายละเอียด: [link]\n[attachment]",
    'reminder_enabled'   => 'false',
    'reminder_intervals' => '1,3',
    'reminder_time'      => '09:30',
    'reminder_template'  => "⏰ แจ้งเตือนกิจกรรมล่วงหน้า [days_left] วัน\n📌 ชื่อกิจกรรม: [activity_name]\n📅 วันที่จัด: [activity_date]\nเข้าสู่ระบบ: [link]",
    'reminder_last_run'  => '{}'
];
$stmtInit = $conn->prepare("INSERT IGNORE INTO system_settings (`key`, `value`) VALUES (?, ?)");
foreach ($defaults as $k => $v) {
    $stmtInit->execute([$k, $v]);
}

// Fetch all settings
$rows = $conn->query("SELECT `key`, `value` FROM system_settings")->fetchAll(PDO::FETCH_ASSOC);
$settings = [];
foreach ($rows as $row) {
    $settings[$row['key']] = $row['value'];
}

// Also fetch group secretaries (stored as group_id => secretary_name in settings like "secretary_group_1")
$groups = $conn->query("SELECT id, group_name FROM staff_groups ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "status"   => "success",
    "settings" => $settings,
    "groups"   => $groups
]);
?>
