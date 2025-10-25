<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
include('../inc/dbcon.php');
include('../function.php');

session_start(); // or your auth
$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) { http_response_code(401); echo json_encode(['error'=>'Unauthorized']); exit(); }

$input = json_decode(file_get_contents("php://input"), true);
if (empty($input)) { http_response_code(400); echo json_encode(['error'=>'No payload']); exit(); }

$api_workout_id = $input['api_workout_id'] ?? null;
$api_data = $input['workout'] ?? null;

if ($api_workout_id) {
    // look for workout_id
    $stmt = $con->prepare("SELECT workout_id FROM workout_master_tbl WHERE api_workout_id = ?");
    $stmt->bind_param("s", $api_workout_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($r = $res->fetch_assoc()) $workout_id = $r['workout_id'];
    else $workout_id = false;
}

if (empty($workout_id) && $api_data) {
    // save via saveWorkoutFromAPI (returns workout_id)
    $workout_id = saveWorkoutFromAPI($api_data);
}

if (!$workout_id) { http_response_code(500); echo json_encode(['error'=>'Could not save workout']); exit(); }

// insert into user_workouts_tbl (avoid duplicates)
$stmt = $con->prepare("INSERT INTO user_workouts_tbl (user_id, api_workout_id, workout_name, created_at) VALUES (?, ?, ?, NOW())");
$stmt->bind_param("iss", $user_id, $api_workout_id, $api_data['name'] ?? null);
$ok = $stmt->execute();
if (!$ok) {
    // maybe duplicate — return success if already exists
}
echo json_encode(['status'=>200, 'message'=>'Saved', 'workout_id'=>$workout_id]);
exit();
