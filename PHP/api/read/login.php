<?php

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Request-With');
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header_remove("X-Powered-By");

include('../function.php');

$requestMethod = $_SERVER["REQUEST_METHOD"];

if ($requestMethod == "OPTIONS") {
    // Handle CORS preflight
    http_response_code(200);
    exit();
}

if ($requestMethod == "POST") {

    // ✅ Get raw JSON body
    $raw = file_get_contents("php://input");

    // ✅ Optional debug: store received JSON
    // file_put_contents("debug_login.txt", $raw);

    // ✅ Decode JSON
    $inputData = json_decode($raw, true);

    // ✅ Validate JSON structure
    if (!is_array($inputData) || empty($inputData)) {
        $data = [
            'status' => 422,
            'message' => 'Invalid or empty JSON input',
        ];
        header("HTTP/1.0 422 Unprocessable Entity");
        echo json_encode($data);
        exit();
    }

    // ✅ Pass to your login function
    echo login($inputData);
    exit();
} else {
    $data = [
        'status' => 405,
        'message' => $requestMethod . ' method not allowed'
    ];
    header("HTTP/1.0 405 Method Not Allowed");
    echo json_encode($data);
}
