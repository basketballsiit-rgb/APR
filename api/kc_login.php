<?php
require_once 'config.php';

// Keycloak OAuth2 parameters
$kc_auth_url = 'https://service.npc.ac.th/realms/NPC-SSO/protocol/openid-connect/auth';
$client_id = 'apr-app';
// Auto-detect protocol and host
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$host = $_SERVER['HTTP_HOST'];
$redirect_uri = $protocol . $host . '/APR/api/kc_callback.php';

// Build the query string for Authorization endpoint
$query = http_build_query([
    'client_id' => $client_id,
    'redirect_uri' => $redirect_uri,
    'response_type' => 'code',
    'scope' => 'openid email profile',
    'kc_idp_hint' => 'google' // Force redirect to Google Identity Provider directly
]);

// Redirect the user to Keycloak
header("Location: $kc_auth_url?$query");
exit;
?>
