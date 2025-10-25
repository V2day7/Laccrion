<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include('../../inc/dbcon.php');
include('../function.php');

// Parse input
$input = json_decode(file_get_contents("php://input"), true);
if (!$input && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $input = $_GET;
}

$meal_id = isset($input['meal_id']) ? intval($input['meal_id']) : null;
$meal_name = isset($input['meal_name']) ? trim($input['meal_name']) : null;

if (!$meal_id && !$meal_name) {
    echo json_encode(['error' => 'Provide meal_id or meal_name']);
    exit;
}

// STEP 1: Try cache first if meal_id exists
if ($meal_id) {
    $cached = getNutritionFromCache($meal_id);
    if ($cached) {
        $cached['meal_id'] = $meal_id;
        $cached['source'] = 'cache';
        $cached['is_cached'] = 1;
        echo json_encode($cached);
        exit;
    }

    // If no name provided, fetch from DB
    if (!$meal_name) {
        $stmt = $con->prepare("SELECT name FROM meals_tbl WHERE meal_id = ?");
        $stmt->bind_param("i", $meal_id);
        $stmt->execute();
        $stmt->bind_result($db_name);
        if ($stmt->fetch()) $meal_name = $db_name;
        $stmt->close();
        if (!$meal_name) {
            echo json_encode(['error' => 'meal_id does not exist in meals_tbl']);
            exit;
        }
    }
}

// STEP 2: Fallback — find meal_id if only name given
if (!$meal_id && $meal_name) {
    $stmt = $con->prepare("SELECT meal_id FROM meals_tbl WHERE name = ? LIMIT 1");
    $stmt->bind_param("s", $meal_name);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($r = $res->fetch_assoc()) {
        $meal_id = (int)$r['meal_id'];
        $cached = getNutritionFromCache($meal_id);
        if ($cached) {
            $cached['meal_id'] = $meal_id;
            $cached['source'] = 'cache';
            $cached['is_cached'] = 1;
            echo json_encode($cached);
            exit;
        }
    }
    $stmt->close();
}

// STEP 3: Call CalorieNinjas /v1/nutrition API
if (!canCallApi(1000)) {
    echo json_encode(['error' => 'API quota exhausted']);
    exit;
}

$apiData = callCalorieNinjas($meal_name);
if (isset($apiData['error'])) {
    echo json_encode(['error' => $apiData['error']]);
    exit;
}

// Extract first item’s nutrition totals
$items = $apiData['items'] ?? [];
if (empty($items)) {
    echo json_encode(['error' => 'No nutrition data found']);
    exit;
}

$totals = [
    'calories' => round(floatval($items[0]['calories'] ?? 0), 2),
    'protein'  => round(floatval($items[0]['protein_g'] ?? 0), 2),
    'carbs'    => round(floatval($items[0]['carbohydrates_total_g'] ?? 0), 2),
    'fat'      => round(floatval($items[0]['fat_total_g'] ?? 0), 2),
];

// STEP 4: Ensure meal exists
if (!$meal_id) {
    $meal_id = saveMealFromAPI($meal_name);
}

// STEP 5: Cache result
saveNutritionToCache($meal_id, $totals);
incrementApiUsage();

// STEP 6: Return response
$response = [
    'meal_id'   => $meal_id,
    'name'      => $meal_name,
    'calories'  => $totals['calories'],
    'protein'   => $totals['protein'],
    'carbs'     => $totals['carbs'],
    'fat'       => $totals['fat'],
    'source'    => 'api',
    'is_cached' => 0
];
echo json_encode($response, JSON_PRETTY_PRINT);
exit;
