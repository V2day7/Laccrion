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
    // Send a 200 OK response for preflight requests
    http_response_code(200);
    exit();
}

if ($requestMethod == "POST") {

    $inputData = json_decode(file_get_contents("php://input"), true);

    if (empty($inputData)) {
        $register = register($_POST);
    } else {
        $register = register($inputData);
    }
    echo $register;
    exit();
} else {
    $data = [
        'status' => 405,
        'message' => $requestMethod . ' method not allowed'
    ];
    header("HTTP/1.0 405 Method Not Allowed");
    echo json_encode($data);
}
