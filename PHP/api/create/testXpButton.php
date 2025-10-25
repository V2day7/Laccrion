<?php
require '../function.php';

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['user_id']) || !isset($input['xp_amount'])) {
    echo json_encode(['status' => 400, 'message' => 'Missing user_id or xp_amount']);
    exit();
}

$user_id = intval($input['user_id']);
$xp_amount = intval($input['xp_amount']);

// Add XP to user
$stmt = $con->prepare("UPDATE users_tbl SET xp = xp + ? WHERE user_id = ?");
$stmt->bind_param("ii", $xp_amount, $user_id);

if ($stmt->execute()) {
    $stmt->close();
    
    // ✅ Check for level up
    $levelUpResult = checkAndLevelUp($user_id);
    
    // ✅ Fetch updated stats
    $stats = fetchPlayerStats($user_id);
    
    // ✅ Return consistent response format
    echo json_encode([
        'status' => 200,
        'message' => 'XP added successfully',
        'level_up' => $levelUpResult,
        'new_xp' => $stats['data']['xp'],
        'level' => $stats['data']['level'],
        'next_level_xp' => $stats['data']['next_level_xp'],
        'stats' => $stats // Full stats for coin updates too
    ]);
} else {
    echo json_encode(['status' => 500, 'message' => 'Failed to add XP']);
}
?>