<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true'); // ✅ Add this for cookies

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(200); 
    exit; 
}

require_once __DIR__ . '/../../../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

include('../../inc/dbcon.php');
include('../function.php');

// ✅ Get user_id from JWT cookie
$jwt_secret = 'Laccrion';
$user_id = null;

if (isset($_COOKIE['logged_user'])) {
    try {
        $decoded = JWT::decode($_COOKIE['logged_user'], new Key($jwt_secret, 'HS256'));
        $user_id = $decoded->user_id;
    } catch (Exception $e) {
        // User not logged in, continue without user_id
        $user_id = null;
    }
}

// --- Pagination params ---
$limit  = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 10;
$offset = isset($_GET['offset']) ? max(0, intval($_GET['offset'])) : 0;
$search = isset($_GET['search']) ? trim($_GET['search']) : '';

// Build filters
$filters = [
    'limit' => $limit,
    'offset' => $offset,
    'search' => $search,
    'user_id' => $user_id // ✅ Pass user_id to check ownership
];

// ✅ Use the cached function with ownership check
$result = getMealsCached($filters);

// ✅ Return response
echo json_encode([
    'status' => 200,
    'meals' => $result['meals'],
    'total' => $result['total'],
    'limit' => $result['limit'],
    'offset' => $result['offset'],
    'has_more' => $result['has_more']
]);
exit;
?>