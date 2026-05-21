<?php
/*
 * jQuery File Upload Plugin PHP Example
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

// --- INICIO DE CONTROL DE CORS ---
// Permitir cualquier origen (ideal para desarrollo local y producción mobile)
header("Access-Control-Allow-Origin: *");
// Permitir los métodos que usa tu app y la librería
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
// Permitir las cabeceras que estás enviando en tu Fetch de React Native
header("Access-Control-Allow-Headers: Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization");

// Si el navegador envía una petición de pre-vuelo (OPTIONS), respondemos 200 OK de inmediato y cortamos la ejecución
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}
// --- FIN DE CONTROL DE CORS ---


error_reporting(E_ALL | E_STRICT);
require('UploadHandler.php');
$upload_handler = new UploadHandler();
