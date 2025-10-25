<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../function.php';
require '../../inc/dbcon.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['user_id']) || !isset($input['quest_id'])) {
    echo json_encode(['status' => 400, 'message' => 'Missing user_id or quest_id']);
    exit();
}

$user_id = intval($input['user_id']);
$quest_id = intval($input['quest_id']);
$today = date('Y-m-d');

try {
    // ✅ Check if quest exists and is pending for today
    $stmt = $con->prepare("
        SELECT * FROM user_quests_tbl 
        WHERE user_id = ? 
        AND quest_id = ? 
        AND assigned_date = ?
        AND status = 'pending'
    ");
    $stmt->bind_param("iis", $user_id, $quest_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['status' => 400, 'message' => 'Quest not found or already completed']);
        exit();
    }
    $stmt->close();

    // ✅ Get quest rewards
    $stmt = $con->prepare("SELECT xp_reward, coin_reward FROM daily_quests_tbl WHERE quest_id = ?");
    $stmt->bind_param("i", $quest_id);
    $stmt->execute();
    $quest = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$quest) {
        echo json_encode(['status' => 404, 'message' => 'Quest not found']);
        exit();
    }

    // ✅ Add rewards to user
    $stmt = $con->prepare("UPDATE users_tbl SET xp = xp + ?, coins = coins + ? WHERE user_id = ?");
    $stmt->bind_param("iii", $quest['xp_reward'], $quest['coin_reward'], $user_id);

    if (!$stmt->execute()) {
        echo json_encode(['status' => 500, 'message' => 'Failed to update rewards']);
        exit();
    }
    $stmt->close();

    // ✅ UPDATE quest status to completed (don't insert new row!)
    $stmt = $con->prepare("
        UPDATE user_quests_tbl 
        SET status = 'completed', 
            completed_at = NOW(),
            completed_date = CURDATE()
        WHERE user_id = ? 
        AND quest_id = ? 
        AND assigned_date = ?
    ");
    $stmt->bind_param("iis", $user_id, $quest_id, $today);
    
    if (!$stmt->execute()) {
        echo json_encode(['status' => 500, 'message' => 'Failed to mark quest as completed']);
        exit();
    }
    $stmt->close();

    // ✅ Check for level up
    $levelUpResult = checkAndLevelUp($user_id);

    // ✅ Fetch updated player stats
    $stats = fetchPlayerStats($user_id);

    echo json_encode([
        'status' => 200,
        'message' => 'Quest completed successfully',
        'rewards' => [
            'xp' => $quest['xp_reward'],
            'coins' => $quest['coin_reward']
        ],
        'level_up' => $levelUpResult,
        'stats' => $stats
    ]);

} catch (Exception $e) {
    error_log("Quest completion error: " . $e->getMessage());
    echo json_encode([
        'status' => 500, 
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>