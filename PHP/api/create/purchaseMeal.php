<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ✅ FIX: Correct path to vendor/autoload.php
require_once __DIR__ . '/../../../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

include('../../inc/dbcon.php');
include('../function.php');

// ✅ Debug logging (remove after testing)
error_log("Purchase Request - User Cookie: " . print_r($_COOKIE, true));
error_log("Purchase Request - POST Data: " . file_get_contents('php://input'));

// ✅ Get user_id from JWT cookie
$jwt_secret = 'Laccrion';
$user_id = null;

if (isset($_COOKIE['logged_user'])) {
    try {
        $decoded = JWT::decode($_COOKIE['logged_user'], new Key($jwt_secret, 'HS256'));
        $user_id = $decoded->user_id;
        error_log("Decoded User ID: " . $user_id); // ✅ Debug
    } catch (Exception $e) {
        error_log("JWT Decode Error: " . $e->getMessage()); // ✅ Debug
        echo json_encode([
            'status' => 401,
            'message' => 'Unauthorized: Invalid token - ' . $e->getMessage()
        ]);
        exit;
    }
} else {
    error_log("No logged_user cookie found"); // ✅ Debug
    echo json_encode([
        'status' => 401,
        'message' => 'Unauthorized: Please login first'
    ]);
    exit;
}

// ✅ Get request body
$input = json_decode(file_get_contents('php://input'), true);
error_log("Parsed Input: " . print_r($input, true)); // ✅ Debug

if (!isset($input['meal_id'])) {
    echo json_encode([
        'status' => 422,
        'message' => 'meal_id is required'
    ]);
    exit;
}

$meal_id = intval($input['meal_id']);
error_log("Calling purchaseMeal - User ID: $user_id, Meal ID: $meal_id"); // ✅ Debug

// ✅ Call the purchase function from function.php
$result = purchaseMeal($user_id, $meal_id);
error_log("Purchase Result: " . print_r($result, true)); // ✅ Debug

// ✅ Return the result
echo json_encode($result);
exit;
?>