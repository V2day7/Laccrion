<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 405,
        'message' => 'Method not allowed'
    ]);
    exit();
}

try {
    // ✅ Clear the JWT cookie (matches the name from login.php)
    setcookie(
        'logged_user',           // Cookie name
        '',                      // Empty value
        time() - 3600,          // Expire in the past
        '/',                    // Path
        '',                     // Domain (empty for localhost)
        false,                  // Secure (set to true in production with HTTPS)
        true                    // HttpOnly (same as login.php)
    );

    // ✅ Log the logout
    error_log("User logged out successfully at " . date('Y-m-d H:i:s'));

    // ✅ Return success response
    http_response_code(200);
    echo json_encode([
        'status' => 200,
        'message' => 'Logged out successfully',
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    error_log("Logout Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'message' => 'Logout failed: ' . $e->getMessage()
    ]);
}