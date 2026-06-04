<?php
// api/debug_deploy.php
header('Content-Type: text/plain; charset=utf-8');

echo "=== Deployment Debugger ===\n";
echo "Current Directory: " . __DIR__ . "\n";
echo "Root Directory: " . realpath(__DIR__ . '/..') . "\n\n";

echo "=== Directory Listing of Root ===\n";
$files = scandir(realpath(__DIR__ . '/..'));
foreach ($files as $file) {
    $path = realpath(__DIR__ . '/..') . '/' . $file;
    $time = date("Y-m-d H:i:s", filemtime($path));
    $isDir = is_dir($path) ? '[DIR]' : '     ';
    echo "  $time $isDir $file\n";
}

echo "\n=== Directory Listing of Root/assets ===\n";
$assetsPath = realpath(__DIR__ . '/../assets');
if ($assetsPath && is_dir($assetsPath)) {
    $assets = scandir($assetsPath);
    foreach ($assets as $asset) {
        $path = $assetsPath . '/' . $asset;
        $time = date("Y-m-d H:i:s", filemtime($path));
        echo "  $time $asset\n";
    }
} else {
    echo "  assets directory not found!\n";
}

echo "\n=== Node & NPM Version ===\n";
echo "node version: " . shell_exec('node -v 2>&1') . "\n";
echo "npm version: " . shell_exec('npm -v 2>&1') . "\n";

echo "\n=== Git Status ===\n";
echo shell_exec('git status 2>&1') . "\n";
?>
