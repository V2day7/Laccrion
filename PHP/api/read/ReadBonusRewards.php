<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require __DIR__ . '/../../inc/dbcon.php';
require __DIR__ . '/../function.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    
    if (!$user_id) {
        echo json_encode([
            'status' => 400,
            'message' => 'User ID is required'
        ]);
        exit();
    }

    echo ReadBonusRewards($user_id);
} else {
    echo json_encode([
        'status' => 405,
        'message' => 'Method not allowed'
    ]);
}
?>