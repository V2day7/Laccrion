<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require __DIR__ . '/../../inc/dbcon.php';
require __DIR__ . '/../function.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, true);

    $user_id = $input['user_id'] ?? null;
    $bonus_id = $input['bonus_id'] ?? null;

    if (!$user_id || !$bonus_id) {
        echo json_encode([
            'status' => 400,
            'message' => 'User ID and Bonus ID required'
        ]);
        exit();
    }

    $result = completeBonusReward($user_id, $bonus_id);
    echo json_encode($result);
} else {
    echo json_encode([
        'status' => 405,
        'message' => 'Method not allowed'
    ]);
}
?>