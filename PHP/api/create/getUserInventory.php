<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

include('../../inc/dbcon.php');
include('../function.php');

// ✅ Get user_id from JWT
$jwt_secret = 'Laccrion';
$user_id = null;

if (isset($_COOKIE['logged_user'])) {
    try {
        $decoded = JWT::decode($_COOKIE['logged_user'], new Key($jwt_secret, 'HS256'));
        $user_id = $decoded->user_id;
    } catch (Exception $e) {
        echo json_encode([
            'status' => 401,
            'message' => 'Unauthorized: Invalid token'
        ]);
        exit;
    }
} else {
    echo json_encode([
        'status' => 401,
        'message' => 'Unauthorized: Please login first'
    ]);
    exit;
}

// ✅ Get filters from query params
$filters = [
    'limit' => isset($_GET['limit']) ? (int)$_GET['limit'] : 20,
    'offset' => isset($_GET['offset']) ? (int)$_GET['offset'] : 0,
    'search' => isset($_GET['search']) ? trim($_GET['search']) : ''
];

// ✅ Call function from function.php
$result = getUserInventory($user_id, $filters);

echo json_encode($result);
exit;
?>