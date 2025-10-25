<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(200); 
    exit; 
}

include('../../inc/dbcon.php');
include('../function.php');

// ✅ Get how many new meals to fetch (default 10, max 20)
$count = isset($_GET['count']) ? max(1, min(20, intval($_GET['count']))) : 10;

// ✅ Check API quota
if (!canCallApi(1000)) {
    echo json_encode([
        'status' => 429,
        'message' => 'API quota exhausted for this month',
        'meals' => [],
        'saved_count' => 0
    ]);
    exit;
}

// ✅ Fetch fresh meals from API
$result = fetchMoreMealsFromAPI($count);

echo json_encode([
    'status' => 200,
    'message' => $result['message'],
    'meals' => $result['meals'],
    'saved_count' => $result['saved_count'],
    'api_calls_used' => $result['api_calls_used']
]);
exit;
?>