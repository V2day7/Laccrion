<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") {
    http_response_code(200);
    exit();
}

require_once '../inc/dbcon.php';

if ($_SERVER["REQUEST_METHOD"] == "GET") {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

    if (!$user_id) {
        echo json_encode([
            'status' => 400,
            'message' => 'User ID required'
        ]);
        exit();
    }

    // Check if user has selected a path
    $stmt = $con->prepare("SELECT path_id FROM users_tbl WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if ($user) {
        echo json_encode([
            'status' => 200,
            'has_path' => !is_null($user['path_id']),
            'path_id' => $user['path_id']
        ]);
    } else {
        echo json_encode([
            'status' => 404,
            'message' => 'User not found'
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 405, 'message' => 'Method not allowed']);
}
?>