<?php
/**
 * APR - Auto Reminder Cron Script
 * ========================================================
 * ใช้งาน: ตั้ง cron job เรียกไฟล์นี้ตามเวลาที่ต้องการ
 * ตัวอย่าง crontab: 30 9 * * * php /var/www/html/APR/api/cron_reminder.php
 *
 * Log จะถูกบันทึกที่: /var/www/html/APR/storage/logs/reminder.log
 */

// ป้องกันการเรียกจากบนเว็บ (อนุญาตเฉพาะ CLI หรือ localhost)
if (PHP_SAPI !== 'cli') {
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!in_array($remote, ['127.0.0.1', '::1'])) {
        http_response_code(403);
        die('Access denied.');
    }
}

// ใช้ Timezone ของ Server (Asia/Bangkok)
date_default_timezone_set('Asia/Bangkok');

define('BASE_DIR', dirname(__DIR__));
$logDir  = BASE_DIR . '/storage/logs';
$logFile = $logDir . '/reminder.log';

// สร้างโฟลเดอร์ log ถ้ายังไม่มี
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

function logMsg(string $msg, string $logFile): void {
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $msg . PHP_EOL;
    file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
    if (PHP_SAPI === 'cli') echo $line;
}

require_once BASE_DIR . '/api/config.php';
require_once BASE_DIR . '/api/line_helper.php';

logMsg('=== Cron Reminder Started ===', $logFile);

try {
    // ดึง Settings
    $stmtSettings = $conn->query("SELECT `key`, `value` FROM system_settings WHERE `key` IN 
        ('reminder_enabled','reminder_intervals','reminder_time','reminder_template','reminder_last_run',
         'line_api_enabled','line_channel_token','line_target_id')");
    $s = [];
    while ($r = $stmtSettings->fetch(PDO::FETCH_ASSOC)) {
        $s[$r['key']] = $r['value'];
    }

    $reminderEnabled = ($s['reminder_enabled'] ?? 'false') === 'true';
    $lineEnabled     = ($s['line_api_enabled'] ?? 'false') === 'true';
    $token           = trim($s['line_channel_token'] ?? '');
    $targetId        = trim($s['line_target_id'] ?? '');
    $intervalsCsv    = $s['reminder_intervals'] ?? '1';
    $template        = $s['reminder_template'] ?? "⏰ แจ้งเตือนกิจกรรมล่วงหน้า [days_left] วัน\n📌 [activity_name]\n📅 [activity_date]\n🔗 [link]";
    $lastRunRaw      = $s['reminder_last_run'] ?? '{}';
    $lastRunData     = json_decode($lastRunRaw, true) ?: [];

    logMsg("Reminder enabled: " . ($reminderEnabled ? 'yes' : 'no'), $logFile);
    logMsg("LINE enabled: " . ($lineEnabled ? 'yes' : 'no'), $logFile);
    logMsg("Token present: " . (!empty($token) ? 'yes' : 'NO (ยังไม่ได้ตั้งค่า)'), $logFile);

    if (!$reminderEnabled) {
        logMsg('Reminder ถูกปิดอยู่ — หยุดการทำงาน', $logFile);
        exit(0);
    }

    // LINE เป็น Optional — ถ้าไม่มี token แค่ warn แต่ยังส่ง web notification ได้
    $canSendLine = $lineEnabled && !empty($token);
    if (!$canSendLine) {
        logMsg('LINE API ถูกปิดหรือไม่มี Token — จะส่งเฉพาะ Web Notification', $logFile);
    }

    $today     = date('Y-m-d');
    $intervals = array_filter(array_map('intval', explode(',', $intervalsCsv)));
    $todayRuns = $lastRunData[$today] ?? [];

    logMsg("Today: $today | Intervals: $intervalsCsv", $logFile);
    logMsg("Already sent today: " . implode(', ', $todayRuns ?: ['(none)']), $logFile);

    $thaiMonths = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    $web_url    = "https://service.npc.ac.th/APR/";
    $changed    = false;

    foreach ($intervals as $daysAhead) {
        $key = "day_{$daysAhead}";

        if (in_array($key, $todayRuns)) {
            logMsg("Interval day_{$daysAhead}: ส่งแล้ววันนี้ — ข้าม", $logFile);
            continue;
        }

        $targetDate = date('Y-m-d', strtotime("+{$daysAhead} days"));
        logMsg("Checking activities on $targetDate (ล่วงหน้า $daysAhead วัน)...", $logFile);

        $stmtActs = $conn->prepare("
            SELECT a.*, IFNULL(sg.group_name, 'ทั้งหมด') as group_name
            FROM activities a
            LEFT JOIN staff_groups sg ON a.group_id = sg.id
            WHERE a.activity_date = ? AND a.status != 'completed'
        ");
        $stmtActs->execute([$targetDate]);
        $activities = $stmtActs->fetchAll(PDO::FETCH_ASSOC);

        if (empty($activities)) {
            logMsg("  ไม่พบกิจกรรมในวันที่ $targetDate — ข้าม", $logFile);
            $todayRuns[] = $key; // mark ว่าตรวจแล้ว ป้องกันตรวจซ้ำ
            $changed = true;
            continue;
        }

        foreach ($activities as $act) {
            $d = strtotime($act['activity_date']);
            $formattedDate = date('j', $d) . ' ' . $thaiMonths[(int)date('n', $d)] . ' ' . ((int)date('Y', $d) + 543);

            logMsg("  กิจกรรม: [{$act['activity_name']}] กลุ่ม: {$act['group_name']}", $logFile);

            // ─── 2) ส่ง LINE (ถ้าเปิดใช้งาน) ───────────────────────────────────
            if ($canSendLine) {
                $msg = str_replace(
                    ['[days_left]', '[activity_name]', '[activity_date]', '[link]', '[group_name]'],
                    [$daysAhead, $act['activity_name'], $formattedDate, $web_url, $act['group_name']],
                    $template
                );
                $msg = preg_replace('/\n{2,}/', "\n", trim($msg));

                $result = sendLineMessage($token, $targetId, $msg);
                if ($result['success']) {
                    logMsg("  ✅ LINE ส่งสำเร็จ (HTTP {$result['http_code']})", $logFile);
                } else {
                    logMsg("  ❌ LINE ส่งล้มเหลว: " . ($result['error'] ?? 'Unknown'), $logFile);
                }
            }
        }

        $todayRuns[] = $key;
        $changed = true;
    }

    if ($changed) {
        // เก็บแค่ 14 วันล่าสุด
        $newLastRun = [];
        foreach ($lastRunData as $date => $runs) {
            if ($date >= date('Y-m-d', strtotime('-14 days'))) {
                $newLastRun[$date] = $runs;
            }
        }
        $newLastRun[$today] = $todayRuns;
        $conn->prepare("INSERT INTO system_settings (`key`, `value`) VALUES ('reminder_last_run', ?) 
                        ON DUPLICATE KEY UPDATE `value` = ?")
             ->execute([json_encode($newLastRun), json_encode($newLastRun)]);
        logMsg("บันทึก last_run เรียบร้อย", $logFile);
    }

    logMsg('=== Cron Reminder Finished ===', $logFile);
    exit(0);

} catch (Exception $e) {
    logMsg('ERROR: ' . $e->getMessage(), $logFile);
    exit(1);
}
?>
