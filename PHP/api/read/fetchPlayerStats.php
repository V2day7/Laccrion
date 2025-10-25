<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include('../function.php');


// Read user_id from query parameter
if (!isset($_GET['user_id']) || empty($_GET['user_id'])) {
    echo json_encode(['status' => 400, 'message' => 'Missing user_id']);
    exit();
}

$user_id = intval($_GET['user_id']);

// Call your function to get player stats
$stats = fetchPlayerStats($user_id);

echo json_encode($stats);