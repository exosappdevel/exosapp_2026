<?php

// 1. Configuraciones de Cabecera (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Dependencias originales
require_once "../include/functions.php";
require_once "../include/db_tools.php";
require_once "../lib/nusoap.php";
require_once "../dompdf/autoload.inc.php";
include "../assets/plugins/phpqrcode/qrlib.php";
require_once "../include/functions_ws.php";

require_once '../lib/vendor/autoload.php';
require_once '../include/chat_client_config.php';
require_once "exosapp.php";

date_default_timezone_set('America/Mexico_City');
@session_start();

class WebServiceController
{
    private $exosApp;
    private $implemented;
    private $result;
    private $is_debuging=false;
    private $use_xml_envelope = true;

    /**
     * Mapa de metadatos para el Auditor de Métodos
     */
    private $metodos_info = [
        "listAllMethods" => [
            'descripcion' => 'Lista todos los métodos registrados en el sistema de auditoría.',
            'parameters' => []
        ],
        "auditMethod" => [
            'descripcion' => 'Audita un método específico y devuelve información sobre sus parámetros.',
            'parameters' => ['action']
        ],
        "audit_ws_log" => [
            'descripcion' => 'Audita el log de WS y devuelve registros paginados.',
            'parameters' => ['limit', 'page', 'search']
        ],
        "audit_ws_log_data" => [
            'descripcion' => 'Audita un registro específico del log de WS y devuelve su input o output.',
            'parameters' => ['id_log', 'type']
        ]
    ];

    public function __construct()
    {
        $this->exosApp = new ExosApp_WS();        
        $this->metodos_info = [...$this->metodos_info,...$this->exosApp->listMethods_ExosApp()];
        $this->implemented = false;
        $this->use_xml_envelope = true;
        $this->result = [null];
        $this->run();
    }

    public function run()
    {
        $action = isset($_REQUEST["action"]) ? $_REQUEST["action"] : null;
        $subAction = isset($_REQUEST["sub_action"]) ? $_REQUEST["sub_action"] : null;
        $this->is_debuging = isset($_REQUEST["debug"]) ? $_REQUEST["debug"]=='on' : false;
        $this->use_xml_envelope = isset($_REQUEST["json"]) ? false : true;
        $this->exosApp->is_debuging = $this->is_debuging;
        $this->exosApp->use_xml_envelope = $this->use_xml_envelope;

        if (!$action) {
            $this->sendError("Acción no especificada.");
            return;
        }

        // --- NUEVA ACCIÓN: LISTAR TODOS LOS MÉTODOS ---
        if ($action === "audit_methods") {
            $this->result = $this->listAllMethods();
            $this->sendResponse($this->result);
            return;
        }

        // --- AUDITOR DE MÉTODO INDIVIDUAL ---
        if ($subAction === "audit") {
            $this->result = $this->auditMethod($action);
            $this->sendResponse($this->result);
            return;
        }

        // --- FLUJO DE EJECUCIÓN (Lógica Real o Mockups) ---
        if ($this->exosApp->Implemented($action)) {
            $this->result = $this->exosApp->$action();
            $this->implemented = true;
        } else {
            $this->result = [];
            $this->implemented = false;
        }
        $metodosProhibidos = ['run', 'sendResponse', 'sendError', '__construct', 'auditMethod', 'listAllMethods'];

        if (method_exists($this, $action) && !in_array($action, $metodosProhibidos)) {
            $this->result = $this->$action();
            $this->sendResponse($this->result);
        } else {
            if ($this->implemented == true) {

                $this->sendResponse($this->result);
            } else {
                $this->sendError("La acción '{$action}' no es válida.");
            }
        }
    }

    // --- UTILIDADES ---
    private function sendResponse($data)
    {
        $id_usuario = isset($_REQUEST["id_usuario"]) ? strval($_REQUEST["id_usuario"]) : "0";

        $input = $_SERVER['QUERY_STRING'];
        $data["is_debuging"] = $this->is_debuging?"true":"false";
        $data["now"] = date('Y-m-d H:i:s');

        $output = XML_Envelope_Text($data);

        $input_esc = str_replace("'", "\'", $input);
        $output_esc = str_replace("'", "\'", $output);

        $nombre = "";
        if (($id_usuario != "") && ($id_usuario != "0")) {
            $nombre = GetValueSQL("select coalesce(max(nombre), '') as usuario_nombre from usuario where id_usuario=" . $id_usuario, "usuario_nombre");
        }
        // Armamos la consulta
        $sSQL = "insert into ws_log(id, id_usuario, nombre, input, output) " .
            "values (0, " . $id_usuario . ",'" . $nombre . "','" . $input_esc . "', '" . $output_esc . "')";

        $action = Requesting("action");
        if (
            ($action != "listAllMethods")
            && ($action != "auditMethod")
            && ($action != "audit_ws_log")
            && ($action != "audit_ws_log_data")
        )
            ExecuteSQL_WS($sSQL);
        //$data["SQL"] = $sSQL;
        if (!$this->use_xml_envelope) 
            JSON_Envelope($data);        
        else
            XML_Envelope($data);
    }
    private function DatosIncorrectos()
    {
        $input = $_SERVER['QUERY_STRING'];
        return ([
            'result' => 'error',
            'parametros' => $input,
            'result_text' => "Datos incorrectos"
        ]);
    }
    private function ResultError($message)
    {
        return[
            'result' => 'error',
            'result_text' => $message
        ];
    }
    private function sendError($message)
    {
        $this->sendResponse($this->ResultError($message));
    }
    /**
     * Lista todos los métodos registrados en el sistema de auditoría.
     */
    private function listAllMethods()
    {        
        $data = [
            'result' => 'true',
            'total_methods' => count($this->metodos_info)
        ];

        $i = 0;
        foreach ($this->metodos_info as $name => $info) {
            $data['method_' . $i] = [
                'action' => $name,
                'descripcion' => $info['descripcion'],
                'parametros_count' => count($info['parameters'])
            ];
            $i++;
        }

        return ($data);
    }

    /**
     * Auditoría de un método específico.
     */
    private function auditMethod($action)
    {
        if (isset($this->metodos_info[$action])) {
            $info = $this->metodos_info[$action];
            $data = [
                'result' => 'true',
                'descripcion' => $info['descripcion'],
                'parameters' => []
            ];

            foreach ($info['parameters'] as $index => $param) {
                $data['item_' . $index] = ['nombre' => $param];
            }

            return ($data);
        } else {
            $this->sendError("No existe información de auditoría para la acción solicitada.");
        }
    }

    private function audit_ws_log()
    {
        $limit = (isset($_GET['limit']) ? (int) $_GET['limit'] : 10);
        $limit = ($limit == 0?10:$limit);
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $page = ($page == 0?1:$page);
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $offset = ($page - 1) * $limit;

        // 1. Contar total de registros para la paginación (con filtro)
        $searchQuery = "%$search%";
        $sqlCount = "SELECT COUNT(*) as total FROM ws_log WHERE nombre LIKE '%" . $search . "%'";
        $totalRows = GetValueSQL_WS($sqlCount, "total");
        $totalPages = ceil($totalRows / $limit);

        // 2. Obtener los datos paginados
        $sqlData = "SELECT * FROM ws_log WHERE nombre LIKE '%" . $search . "%' ORDER BY id DESC LIMIT $limit OFFSET $offset";
        $records = DatasetSQL_WS($sqlData);
        $data = [];

        while ($row = mysqli_fetch_array($records)) {
            // Usamos el prefijo 'item_' para que el XML sea válido y el frontend lo reconozca como lista
            $input_esc = str_replace("'", "\'", $row['input']);
            $output_esc = str_replace("'", "\'", $row['output']);
            $data['id' . $row['id']] = [
                'fecha' => $row['fecha'],
                'hora' => $row['hora'],
                'id_usuario' => $row['id_usuario'],
                'nombre' => $row['nombre']
            ];
        }
        $data = [
            'result' => 'true',
            'sql' => $sqlData,
            'data' => $data
        ];
        return ($data);
    }
    private function audit_ws_log_data()
    {
        $id_log = Requesting("id_log");
        $type = Requesting("type");
        if (!$id_log || !$type) {
            return $this->DatosIncorrectos();
        }
        $sqlData = "select " . $type . " from ws_log where id=" . $id_log;
        $value = GetValueSQL_WS($sqlData, $type);
        echo $value;
        exit;
        $data = [
            'result' => 'true',
            'sql' => $sqlData,
            'value' => $value
        ];
        return ($data);        
    }
    private function SQLDate($dateStr) {
        if (!$dateStr) return "";
        // Creamos el objeto desde el formato específico dd/mm/yyyy
        $dateObj = DateTime::createFromFormat('d/m/Y', $dateStr);
        // Retornamos en formato yyyy-mm-dd para el SQL
        return $dateObj ? $dateObj->format('Y-m-d') : $dateStr;
    }

    public function upload_pago_cirugia(){
        // Identificar si el archivo viene bajo la clave 'files[]' (como se ve en tu captura) o 'files'
        $paramName = isset($_FILES['files[]']) ? 'files[]' : (isset($_FILES['files']) ? 'files' : null);

        if ($paramName === null) {
            return [
                'result' => 'error',
                'result_text' => 'No se detectó ninguna clave de archivo válida en $_FILES. Recibido: ' . json_encode(array_keys($_FILES))
            ];
        }

        // Extraer los datos dinámicamente según cómo lo haya empaquetado el navegador
        $fileData = $_FILES[$paramName];
        
        if (is_array($fileData['name'])) {
            $fileName    = $fileData['name'][0];
            $fileTmpName = $fileData['tmp_name'][0];
            $fileError   = $fileData['error'][0];
        } else {
            $fileName    = $fileData['name'];
            $fileTmpName = $fileData['tmp_name'];
            $fileError   = $fileData['error'];
        }

        // Si hay un error en el servidor temporal, te devolverá el código numérico exacto de PHP
        if ($fileError !== UPLOAD_ERR_OK) {
            return [
                'result' => 'error',
                'result_text' => 'Error en el servidor temporal de PHP. Código de error interno: ' . $fileError . '. (Verifica post_max_size o upload_max_filesize en tu php.ini)'
            ];
        }

        // Directorio de subida (Asegúrate de que la carpeta tenga permisos de escritura 755 o 777)
        $uploadDir = __DIR__ . '/pagos_cirugias/files/exosapp/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
        $newFileName   = uniqid('pago_', true) . '.' . $fileExtension;
        $destination   = $uploadDir . $newFileName;

        if (move_uploaded_file($fileTmpName, $destination)) {
            $publicUrl = "pagos_cirugias/files/exosapp/" . $newFileName;
            return [
                'result' => 'ok',
                'result_text' => 'Archivo subido con éxito al controlador.',
                'url' => $publicUrl,
                'fileName' => $fileName,
                'tmp' => $fileTmpName,
                'dest' => $destination
            ];
        } else {
            return [
                'result' => 'error',
                'result_text' => 'El archivo llegó al temporal pero no se pudo mover a la carpeta final: ' . $uploadDir
            ];
        }
    }
    //****************************************************************************************** */
    // -------------------------- IMPLEMENTACION DE LOS WEB SERVICES MOCKUP --------------------
    //****************************************************************************************** */
    private function db_test()
    {
        try {
            $dbConx = mysqli_connect(Requesting('host'), Requesting('user'), Requesting('password'), Requesting('database'));
            $sSQL = isset($_REQUEST["sql"]) ? $_REQUEST["sql"] : "";
            $field = Requesting('field');
            $rsTemp = DatasetSQL_con($sSQL, $dbConx);
            if ($rsTemp != null) {
                $row = mysqli_fetch_array($rsTemp);
                $value = $row[$field == '' ? 0 : $field];
                return ([$field => $value]);
            }
        } catch (Exception $e) {
            $id_usuario_app = 0;
            $tema = "light";
            $this->sendResponse(["exception" => $e->getMessage()]);
        }
    }    
}

    

new WebServiceController();
