<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

include('../../inc/dbcon.php');
include('../function.php');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(200); 
    exit(); 
}

// ✅ Get user's path_id to filter workouts
$user_id = $_GET['user_id'] ?? null;
$user_path_id = null;

if (!$user_id) {
    echo json_encode([
        'status' => 400,
        'message' => 'User ID is required'
    ]);
    exit();
}

$stmt = $con->prepare("SELECT path_id FROM users_tbl WHERE user_id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$user_path_id = $user['path_id'] ?? null;
$stmt->close();

if (!$user_path_id) {
    echo json_encode([
        'status' => 403,
        'message' => 'Please select a fitness path first'
    ]);
    exit();
}

// ✅ Map path_id to API workout types
$pathTypeMap = [
    1 => ['strength', 'powerlifting', 'strongman'], // Strength
    2 => ['strength', 'plyometrics'], // Calisthenics
    3 => ['cardio', 'stretching'], // Cardio
    4 => ['cardio', 'olympic_weightlifting', 'plyometrics', 'powerlifting', 'strength', 'stretching', 'strongman'] // Hybrid (all)
];

$filters = [
    'muscle' => $_GET['muscle'] ?? null,
    'difficulty' => $_GET['difficulty'] ?? null,
    'equipment' => $_GET['equipment'] ?? null,
    'search' => $_GET['search'] ?? null,
    'limit' => $_GET['limit'] ?? 20,
    'offset' => $_GET['offset'] ?? 0,
];

// ✅ If user has a path, filter by path types
if ($user_path_id && isset($pathTypeMap[$user_path_id])) {
    $filters['path_types'] = $pathTypeMap[$user_path_id];
}

// ✅ REMOVED: No longer require filters - will fetch all workouts for the path
$result = getWorkoutsCached($filters, 1000);

if (isset($result['error'])) {
    http_response_code(200);
    echo json_encode(['status'=>500,'data'=>[],'message'=>$result['error']]);
    exit();
}

// ✅ Add XP and Coin rewards based on difficulty
$rewardMap = [
    'beginner' => ['xp' => 30, 'coins' => 15],
    'intermediate' => ['xp' => 50, 'coins' => 25],
    'expert' => ['xp' => 80, 'coins' => 40]
];

foreach ($result as &$workout) {
    $difficulty = strtolower($workout['difficulty'] ?? 'beginner');
    $workout['xp_reward'] = $rewardMap[$difficulty]['xp'] ?? 30;
    $workout['coin_reward'] = $rewardMap[$difficulty]['coins'] ?? 15;
}

echo json_encode(['status'=>200,'data'=>$result]);
exit();
?>