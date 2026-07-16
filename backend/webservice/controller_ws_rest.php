<?php
/**
 * Adaptador REST/JSON para las mismas acciones que expone controller_ws.php.
 *
 * No modifica controller_ws.php ni exosapp.php: reutiliza exactamente el mismo
 * código de negocio (ExosApp_WS y los métodos "mockup vs real" de
 * WebServiceController) cargando la clase de controller_ws.php vía eval() sin
 * su instanciación final (`new WebServiceController();`), así no se dispara
 * su propio run()/salida XML ni el insert a ws_log al incluir el archivo.
 *
 * Uso:
 *   POST/GET .../controller_ws_rest.php/<accion>   (estilo REST, requiere PATH_INFO)
 *   .../controller_ws_rest.php?action=<accion>      (fallback si el servidor no pasa PATH_INFO)
 *
 * Autenticación (cualquiera de las tres, además del ?key= ya existente):
 *   Authorization: Bearer <passkey>
 *   X-Api-Key: <passkey>
 *
 * El body JSON en POST/PUT/PATCH/DELETE se mezcla en $_POST/$_REQUEST para que
 * Requesting()/$_REQUEST[...] sigan funcionando sin cambios en las acciones existentes.
 * Los valores array/objeto del body se re-serializan a JSON string, que es lo que ya
 * esperan campos como datos_pickeo, minialmacen_string, etc.
 *
 * Nota: upload_pago_cirugia (multipart), audit_ws_log*, db_test quedan fuera a propósito
 * (utilidades internas o no aptas para JSON) y el logging a ws_log de controller_ws.php
 * no se replica aquí.
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Api-Key, X-Requested-With");
    http_response_code(200);
    exit;
}

// Carga las clases ExosApp_WS y WebServiceController desde los archivos originales,
// quitando solo la línea final `new WebServiceController();` para no ejecutar su
// flujo automático. Todo lo demás (requires, date_default_timezone_set, session_start)
// corre igual que en el archivo original.
if (!class_exists('WebServiceController', false)) {
    $controllerSource = file_get_contents(__DIR__ . '/controller_ws.php');
    $controllerSource = preg_replace('/^<\?php/', '', $controllerSource, 1);
    $controllerSource = preg_replace('/new\s+WebServiceController\s*\(\s*\)\s*;\s*$/', '', rtrim($controllerSource));
    eval($controllerSource);
}

// Nuestras propias cabeceras van DESPUÉS del eval, que reafirma las cabeceras
// CORS originales (más restrictivas) como parte de su código de nivel superior.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Api-Key, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

function esdimed_rest_error($status, $message)
{
    http_response_code($status);
    echo json_encode(['result' => 'error', 'result_text' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Resolver la acción desde la ruta (estilo REST), con fallback a ?action=
$scriptName = basename($_SERVER['SCRIPT_NAME']);
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$afterScript = '';
$pos = strpos($requestPath, $scriptName);
if ($pos !== false) {
    $afterScript = substr($requestPath, $pos + strlen($scriptName));
}
$pathInfo = $_SERVER['PATH_INFO'] ?? $afterScript;
$action = trim($pathInfo, '/');
if ($action === '') {
    $action = isset($_GET['action']) ? $_GET['action'] : null;
}

if (!$action) {
    esdimed_rest_error(400, "Debes indicar la acción en la ruta (ej. /controller_ws_rest.php/inicia_sesion) o en ?action=");
}

// 2. Autenticación: acepta el mismo passkey via header, además de ?key= existente.
if (empty($_GET['key'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $key = null;
    if (stripos($authHeader, 'Bearer ') === 0) {
        $key = trim(substr($authHeader, 7));
    } elseif (!empty($_SERVER['HTTP_X_API_KEY'])) {
        $key = $_SERVER['HTTP_X_API_KEY'];
    }
    if ($key) {
        $_GET['key'] = $key;
        $_REQUEST['key'] = $key;
    }
}

// 3. Mezclar el body JSON (POST/PUT/PATCH/DELETE) en $_POST/$_REQUEST.
$method = $_SERVER['REQUEST_METHOD'];
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? ($_SERVER['HTTP_CONTENT_TYPE'] ?? '');
    if (stripos($contentType, 'application/json') !== false) {
        $rawBody = file_get_contents('php://input');
        if ($rawBody) {
            $decoded = json_decode($rawBody, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                foreach ($decoded as $k => $v) {
                    $value = is_array($v) ? json_encode($v) : $v;
                    $_POST[$k] = $value;
                    $_REQUEST[$k] = $value;
                }
            } else {
                esdimed_rest_error(400, "El body no es JSON válido.");
            }
        }
    }
}

// 4. Listado de acciones soportadas (equivalente REST de ?action=audit_methods).
//    En vez de depender de $metodos_info (metadata mantenida a mano, puede quedar
//    incompleta), se refleja el código real: métodos públicos sin parámetros
//    obligatorios de ExosApp_WS y WebServiceController son justo los que el
//    dispatcher puede invocar como `$obj->$action()`. $metodos_info se usa solo
//    como fuente opcional de descripcion/parametros documentados, si existe.
if ($action === 'audit_methods') {
    $exosAppRef = new ReflectionClass('ExosApp_WS');
    $controllerRef = new ReflectionClass('WebServiceController');
    $excludedNames = ['__construct', 'run', 'Implemented'];

    $collectDispatchable = function (ReflectionClass $ref) use ($excludedNames) {
        $found = [];
        foreach ($ref->getMethods(ReflectionMethod::IS_PUBLIC) as $m) {
            if (in_array($m->getName(), $excludedNames, true)) {
                continue;
            }
            if ($m->getNumberOfRequiredParameters() > 0) {
                continue; // helper interno, no se puede invocar como $obj->$action() sin argumentos
            }
            $found[$m->getName()] = true;
        }
        return $found;
    };

    $actionNames = $collectDispatchable($exosAppRef) + $collectDispatchable($controllerRef);

    // $metodos_info es un property con valor por default, se puede leer sin invocar el constructor.
    $metodosInfoProp = $controllerRef->getProperty('metodos_info');
    $metodosInfoProp->setAccessible(true);
    $metodosInfo = $metodosInfoProp->getValue($controllerRef->newInstanceWithoutConstructor());

    $methods = [];
    foreach (array_keys($actionNames) as $name) {
        $info = $metodosInfo[$name] ?? null;
        $methods[] = [
            'action' => $name,
            'descripcion' => $info['descripcion'] ?? '',
            'parametros_count' => $info ? count($info['parameters']) : 0,
        ];
    }
    usort($methods, function ($a, $b) {
        return strcmp($a['action'], $b['action']);
    });

    http_response_code(200);
    echo json_encode([
        'result' => 'ok',
        'total_methods' => count($methods),
        'methods' => $methods,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// 5. Dispatch — misma prioridad que WebServiceController::run(): primero ExosApp_WS,
//    y si WebServiceController también define la acción (patrón mockup/real), esa gana,
//    pudiendo reusar el resultado de ExosApp_WS via $this->implemented/$this->result.
$exosApp = new ExosApp_WS();
$exosApp->is_debuging = false;
$exosApp->use_xml_envelope = false;

$implemented = false;
$result = [null];

if ($exosApp->Implemented($action)) {
    try {
        $result = $exosApp->$action();
    } catch (Throwable $e) {
        esdimed_rest_error(500, "Error interno: " . $e->getMessage());
    }
    $implemented = true;
}

$metodosProhibidos = ['run', 'sendResponse', 'sendError', '__construct', 'auditMethod', 'listAllMethods'];
$controllerRef = new ReflectionClass('WebServiceController');

if ($controllerRef->hasMethod($action) && !in_array($action, $metodosProhibidos, true)) {
    $methodRef = $controllerRef->getMethod($action);
    if ($methodRef->isPublic() && !$methodRef->isStatic() && !$methodRef->isAbstract()) {
        $controller = $controllerRef->newInstanceWithoutConstructor();

        // Replicar el estado que normalmente deja __construct() antes de run().
        $state = ['exosApp' => $exosApp, 'implemented' => $implemented, 'result' => $result, 'is_debuging' => false];
        foreach ($state as $prop => $value) {
            if ($controllerRef->hasProperty($prop)) {
                $propRef = $controllerRef->getProperty($prop);
                $propRef->setAccessible(true);
                $propRef->setValue($controller, $value);
            }
        }

        try {
            $result = $methodRef->invoke($controller);
        } catch (Throwable $e) {
            esdimed_rest_error(500, "Error interno: " . $e->getMessage());
        }
        $implemented = true;
    }
}

if (!$implemented) {
    esdimed_rest_error(404, "La acción '{$action}' no existe.");
}

if (!is_array($result)) {
    $result = ['result' => 'ok', 'data' => $result];
}

// 6. Traducir la convención item_/subitem_/prod_ a arrays JSON reales
//    (en vez del hack de simplexml que usa el ?json= de controller_ws.php).
function esdimed_rest_flatten($value)
{
    if (!is_array($value)) {
        return $value;
    }

    $isList = false;
    foreach (array_keys($value) as $k) {
        if (is_string($k) && (strpos($k, 'item_') === 0 || strpos($k, 'subitem_') === 0 || strpos($k, 'prod_') === 0)) {
            $isList = true;
            break;
        }
    }

    if ($isList) {
        $out = [];
        foreach ($value as $v) {
            $out[] = esdimed_rest_flatten($v);
        }
        return $out;
    }

    $out = [];
    foreach ($value as $k => $v) {
        $out[$k] = esdimed_rest_flatten($v);
    }
    return $out;
}

$result = esdimed_rest_flatten($result);

// 7. Status HTTP acorde al resultado, sin requerir cambios en las acciones existentes.
$resultFlag = strtolower((string) ($result['result'] ?? 'ok'));
http_response_code($resultFlag === 'error' ? 400 : 200);

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
