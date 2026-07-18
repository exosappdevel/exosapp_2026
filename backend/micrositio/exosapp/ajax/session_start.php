<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json; charset=UTF-8');

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['id_usuario']) || empty($input['alias_usuario'])) {
    http_response_code(400);
    echo json_encode(['result' => 'error', 'result_text' => 'Datos de sesión inválidos']);
    exit;
}

$_SESSION['app_perfiles_user'] = [
    'id_usuario' => $input['id_usuario'],
    'alias_usuario' => $input['alias_usuario'],
    'tipo_usuario' => $input['tipo_usuario'] ?? '',
];

echo json_encode(['result' => 'ok']);
