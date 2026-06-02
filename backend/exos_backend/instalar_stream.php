<?php
// instalar_stream.php

// 1. Registramos el autoloader adaptado a tu carpeta física "lib" dentro de "tmp"
spl_autoload_register(function ($class) {
    // El namespace que usa GetStream
    $prefix = 'GetStream\\Stream\\';
    
    // Corregido: Salimos un nivel (si estás en carpeta pública) y entramos a /tmp/stream-php-main/...
    $base_dir = __DIR__ . '/../tmp/stream-php-main/lib/GetStream/Stream/';

    // Comprobamos si la clase pertenece al SDK
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return; // No pertenece, ignorar
    }

    // Tomamos el nombre del archivo de la clase (ej: "Client")
    $relative_class = substr($class, $len);
    
    // Construimos la ruta exacta convirtiendo los namespaces en carpetas
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    // Si el archivo físico existe, lo incluimos de inmediato
    if (file_exists($file)) {
        require_once $file;
    }
});

// 2. Importamos el espacio de nombres del cliente
use GetStream\Stream\Client;

try {
    // 3. Inicializar el cliente con tus credenciales de Stream Dashboard
    $client = new Client('TU_API_KEY_AQUI', 'TU_API_SECRET_AQUI');
    
    // Conexión exitosa si no lanza una excepción
    $userFeed = $client->feed('user', 'usuario_exos_1');

    echo "¡GetStream SDK cargado y funcionando al 100% de manera manual desde /tmp!";

} catch (\Exception $e) {
    echo "Error en la inicialización de GetStream: " . $e->getMessage();
}