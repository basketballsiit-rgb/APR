<?php
require_once 'config.php';
require_once 'line_helper.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // 1. ดึง settings ที่เกี่ยวข้องทั้งหมด
    $stmtSettings = $conn->query("SELECT `key`, `value` FROM system_settings WHERE `key` IN 
        ('reminder_enabled','reminder_intervals','reminder_time','reminder_template','reminder_last_run',
         'line_api_enabled','line_channel_token','line_target_id')");
    $s = [];
    while ($r = $stmtSettings->fetch(PDO::FETCH_ASSOC)) {
        $s[$r['key']] = $r['value'];
    }

    $reminderEnabled  = ($s['reminder_enabled']  ?? 'false') === 'true';
    $lineEnabled      = ($s['line_api_enabled']   ?? 'false') === 'true';
    $token            = trim($s['line_channel_token'] ?? '');
    $targetId         = trim($s['line_target_id']   ?? '');
    $reminderTime     = $s['reminder_time']      ?? '09:30';
    $intervalsCsv     = $s['reminder_intervals'] ?? '1';
    $template         = $s['reminder_template'] ?? '';
    $lastRunRaw       = $s['reminder_last_run']  ?? '{}';
    $lastRunData      = json_decode($lastRunRaw, true) ?: [];

    $currentTime = date('H:i');
    $today       = date('Y-m-d');
    $intervals   = array_filter(array_map('intval', explode(',', $intervalsCsv)));
    $todayRuns   = $lastRunData[$today] ?? [];
    $tokenMasked = !empty($token) ? substr($token, 0, 8) . '...' . substr($token, -4) : '(ว่าง)';

    $diagnostics = [
        'server_time_now'    => date('Y-m-d H:i:s'),
        'server_timezone'    => date_default_timezone_get(),
        'current_time_hhmm'  => $currentTime,
        'reminder_enabled'   => $reminderEnabled,
        'line_enabled'       => $lineEnabled,
        'token_present'      => !empty($token),
        'token_preview'      => $tokenMasked,
        'target_id'          => $targetId ?: '(Broadcast)',
        'reminder_time_set'  => $reminderTime,
        'time_check_passes'  => ($currentTime >= $reminderTime),
        'intervals'          => array_values($intervals),
        'template_preview'   => mb_substr($template, 0, 80) . '...',
        'today_already_run'  => $todayRuns,
        'last_run_raw_short' => mb_substr($lastRunRaw, 0, 200),
        'all_conditions_pass'=> ($reminderEnabled && $lineEnabled && !empty($token) && ($currentTime >= $reminderTime)),
    ];

    // 2. ตรวจสอบกิจกรรมที่จะถูก Remind
    $activities_to_remind = [];
    foreach ($intervals as $daysAhead) {
        $key = "day_{$daysAhead}";
        $alreadySent = in_array($key, $todayRuns);
        $targetDate = date('Y-m-d', strtotime("+{$daysAhead} days"));
        
        $stmtActs = $conn->prepare("SELECT id, activity_name, activity_date, status FROM activities WHERE activity_date = ? AND status != 'completed'");
        $stmtActs->execute([$targetDate]);
        $acts = $stmtActs->fetchAll(PDO::FETCH_ASSOC);

        $activities_to_remind[] = [
            'interval_days' => $daysAhead,
            'key'           => $key,
            'already_sent_today' => $alreadySent,
            'target_date'   => $targetDate,
            'activities_found' => $acts,
        ];
    }

    // 3. ตัวเลือกบังคับส่งใหม่ (?force=1)
    $forceResult = null;
    if (isset($_GET['force']) && $_GET['force'] === '1' && $reminderEnabled && $lineEnabled && !empty($token)) {
        $thaiMonths = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
        $web_url    = "https://" . $_SERVER['HTTP_HOST'] . "/APR/";
        $forceResult = [];

        foreach ($intervals as $daysAhead) {
            $targetDate = date('Y-m-d', strtotime("+{$daysAhead} days"));

            $stmtActs = $conn->prepare("SELECT * FROM activities WHERE activity_date = ? AND status != 'completed'");
            $stmtActs->execute([$targetDate]);
            $acts = $stmtActs->fetchAll(PDO::FETCH_ASSOC);

            foreach ($acts as $act) {
                $d = strtotime($act['activity_date']);
                $formattedDate = date('j', $d) . ' ' . $thaiMonths[(int)date('n', $d)] . ' ' . ((int)date('Y', $d) + 543);

                $msg = str_replace(
                    ['[days_left]', '[activity_name]', '[activity_date]', '[link]'],
                    [$daysAhead, $act['activity_name'], $formattedDate, $web_url],
                    $template
                );
                $msg = preg_replace('/\n{2,}/', "\n", trim($msg));
                $r = sendLineMessage($token, $targetId, $msg);
                $forceResult[] = [
                    'activity' => $act['activity_name'],
                    'date'     => $targetDate,
                    'days_ahead' => $daysAhead,
                    'send_result' => $r,
                    'message_preview' => mb_substr($msg, 0, 100),
                ];
            }
        }

        // รีเซ็ต reminder_last_run สำหรับวันนี้เพื่อให้ส่งได้อีกครั้ง
        if (!empty($forceResult)) {
            $lastRunData[$today] = [];
            $conn->prepare("INSERT INTO system_settings (`key`, `value`) VALUES ('reminder_last_run', ?) 
                            ON DUPLICATE KEY UPDATE `value` = ?")
                 ->execute([json_encode($lastRunData), json_encode($lastRunData)]);
        }
    }

    echo json_encode([
        'diagnostics'         => $diagnostics,
        'reminder_activities' => $activities_to_remind,
        'force_send_result'   => $forceResult,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
