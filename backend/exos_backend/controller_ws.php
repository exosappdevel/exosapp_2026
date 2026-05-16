<?php
require_once "webservice/exosapp.php";

// 1. Configuraciones de Cabecera (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Dependencias originales
require_once "include/functions.php";
require_once "include/db_tools.php";
require_once "lib/nusoap.php";
require_once "dompdf/autoload.inc.php";
include "assets/plugins/phpqrcode/qrlib.php";
require_once "include/functions_ws.php";

date_default_timezone_set('America/Mexico_City');
@session_start();

class WebServiceController
{
    private $exosApp;
    private $implemented;
    private $result;
    private $is_debuging=false;

    /**
     * Mapa de metadatos para el Auditor de Métodos
     */
    private $metodos_info = [
        'audit_ws_log' => [
            'descripcion' => 'audita los logs de webservice.',
            'parameters' => ['limit', 'page', 'search']
        ],
        'metodo_ejemplo' => [
            'descripcion' => 'Ejemplo de implementacion real.',
            'parameters' => ['id']
        ],
        'inicia_sesion' => [
            'descripcion' => 'Valida las credenciales del usuario y genera una sesión activa.',
            'parameters' => ['login_usuario', 'login_password']
        ],
        'get_almacenes_list' => [
            'descripcion' => 'obtiene la lista de almacenes',
            'parameters' => ['id_usuario', 'limit (opcional)']
        ],
        'get_terminales_list' => [
            'descripcion' => 'Obtiene la lista de terminales configuradas para el proceso de picking.',
            'parameters' => ['id_usuario', 'id_almacen', 'limit (opcional)']
        ],
        'get_pickeo_list' => [
            'descripcion' => 'Recupera el listado de productos y cantidades pendientes para una terminal específica.',
            'parameters' => ['id_usuario', 'id_terminal', 'limit (opcional)']
        ],
        'pickeo_checkout' => [
            'descripcion' => 'Registra el avance final del pickeo y cierra la transacción de la terminal.',
            'parameters' => ['id_usuario', 'id_terminal', 'datos_pickeo (JSON)']
        ],
        'get_set_categorias' => [
            'descripcion' => 'Obtiene listado de set_categorias',
            'parameters' => []
        ],
        'get_set_subcategorias' => [
            'descripcion' => 'Obtiene listado de set_subcategorias',
            'parameters' => ['id_categoria']
        ],
        'get_set_categorias_subcategorias' => [
            'descripcion' => 'Obtiene listado de set_categorias y sub_categorias',
            'parameters' => []
        ],
        'get_equipos_poder_categoria' => [
            'descripcion' => 'Obtiene listado de equipos_poder_categoria',
            'parameters' => []
        ],
        'get_instrumental_categoria' => [
            'descripcion' => 'Obtiene listado de instrumental_categoria',
            'parameters' => []
        ],
        'get_consumible_categoria' => [
            'descripcion' => 'Obtiene listado de consumible_categoria',
            'parameters' => []
        ],
        'get_estados' => [
            'descripcion' => 'Obtiene listado de estados',
            'parameters' => []
        ],
        'get_vendedores' => [
            'descripcion' => 'Obtiene listado de vendedores',
            'parameters' => ["id_usuario", "first_row"]
        ],
        'get_tecnicos' => [
            'descripcion' => 'Obtiene listado de tecnicos',
            'parameters' => ["id_usuario"]
        ],
        'get_hospitales' => [
            'descripcion' => 'Obtiene listado de hospitales por id_almacen',
            'parameters' => ["id_almacen"]
        ],
        "get_subdistribuidor" => [
            'descripcion' => 'Obtiene listado de subdistribuidor',
            'parameters' => []
        ],
        "get_medicos_list" => [
            'descripcion' => 'Obtiene listado de medicos por usuario',
            'parameters' => ["id_usuario"]
        ],
        "save_profile" => [
            'descripcion' => 'Actualiza los datos del perfil del usuario app',
            'parameters' => ["id_usuario_app","tema","app_language","menu_favorites"],
        ],
        "guardar_cirugia" => [
            'descripcion' => 'Guarda una cirugia',
            'parameters' => [
                'id_usuario',
                'id_almacen',
                'tipo',
                'nuevo_cirugia_id',
                'nuevo_cirugia_fecha',
                'nuevo_cirugia_hora',
                'nuevo_cirugia_estado',
                'nuevo_cirugia_ciudad',
                'nuevo_cirugia_vendedor',
                'nuevo_cirugia_tecnico',
                'nuevo_cirugia_tecnico_2',                
                'nuevo_cirugia_subdistribuidor',
                'nuevo_cirugia_subdistribuidor_txt',
                'nuevo_cirugia_hospital',
                'nuevo_cirugia_medico',
                'minialmacen_string',
                'equipopoder_string',
                'adicionales_string',
                'consumibles_string',
                'nuevo_cirugia_notas',
                'nuevo_cirugia_paciente',
                'nuevo_cirugia_paciente_p',
                'nuevo_cirugia_paciente_m',
                'nuevo_cirugia_esteril',
                'nuevo_cirugia_orden_pago',
                'nuevo_cirugia_file_name'
            ]
        ],
        "buscar_cirugia" => [
            'descripcion' =>'Buscar cirugias de acuerdo a los parametros',
            'parameters' => [
                'id_usuario',
                "estatus",
                'fecha_inicial',
                'fecha_final',
                'vendedor',
                'tecnico',
                'subdistribuidor',
                'codigo_cirugia',
                'limite'
            ]
        ]
    ];

    public function __construct()
    {
        $this->exosApp = new ExosApp_WS();
        $this->implemented = false;
        $this->result = [null];
        $this->run();
    }

    public function run()
    {
        $action = isset($_REQUEST["action"]) ? $_REQUEST["action"] : null;
        $subAction = isset($_REQUEST["sub_action"]) ? $_REQUEST["sub_action"] : null;
        $this->is_debuging = isset($_REQUEST["debug"]) ? $_REQUEST["debug"]=='on' : false;

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
    // --- LOGIN ---
    public function inicia_sesion()
    {
        // if IMPLEMENTED 
        if ($this->implemented && $this->result != null) {
            $id_usuario = $this->result["id_usuario"];
        } else { // ELSE USE NEXT MOCKUP
            $login_usuario = Requesting("login_usuario");
            $login_password = Requesting("login_password");

            if (!$login_usuario || !$login_password) {
                return $this->DatosIncorrectos();
            }

            // Se mantiene la lógica de tu archivo original con md5
            $query = "SELECT COUNT(u.id_usuario) AS existe, u.id_usuario, u.id_almacen, u.usuario, u.activo, a.nombre as almacen_nombre, a.codigo as almacen_codigo 
                    FROM usuario u left join almacen a on u.id_almacen=a.id_almacen
                    WHERE u.usuario = '" . $login_usuario . "' AND u.password = '" . md5($login_password) . "'";

            $existe = GetValueSQL($query, "existe");

            if ($existe == 0) {
                return $this->ResultError("Usuario o Contraseña incorrectos.");                
            }
            $id_usuario = GetValueSQL($query, "id_usuario");
            $this->result =
                [
                    'result' => 'ok',
                    'id_usuario' => $id_usuario,
                    'id_almacen' => GetValueSQL($query, "id_almacen"),
                    'almacen_nombre' => GetValueSQL($query, "almacen_nombre"),
                    'almacen_codigo' => GetValueSQL($query, "almacen_codigo"),
                    'alias_usuario' => GetValueSQL($query, "usuario"),
                    'result_text' => 'Acceso correcto'
                ];
        }

        try {
            $id_tipo_usuario = GetValueSQL("select id_tipo_usuario from usuario where id_usuario=" .$id_usuario ,'id_tipo_usuario');

            $query = "SELECT count(id_usuario_app) as existe, u.* 
                FROM user_profile u
                WHERE id_usuario = " . $id_usuario;

            $existe = GetValueSQL_WS($query, "existe");
            if ($existe == 0) {
                $sql_new = "insert into user_profile(id_usuario_app,id_usuario) values (0," . $id_usuario . ")";
                if (!ExecuteSQL_WS($sql_new)) {
                    $this->result["sql_error"] = $sql_new;
                }
            }

            $id_usuario_app = GetValueSQL_WS($query, "id_usuario_app");            
            $tema = GetValueSQL_WS($query, "tema");
            $app_language = GetValueSQL_WS($query, "app_language"); 
            $menu_favorites = GetValueSQL_WS($query, "menu_favorites"); 

            // --- menus
            $sSQL_menus_usuario = 'select * from tipo_usuario_menus where id_tipo_usuario=' .  $id_tipo_usuario;   
            $records_menu_usuario = DatasetSQL_WS($sSQL_menus_usuario);
            
            while ($row_menu_usuario = mysqli_fetch_array($records_menu_usuario)) {
                $sSQL_menus = "SELECT * FROM app_menus order by menu";
                $records_menus = DatasetSQL_WS($sSQL_menus);                

                $this->result["menu_count"] = $records_menus->num_rows;    
                $menus_text = "";

                while ($row = mysqli_fetch_array($records_menus)) {
                    $menu_field = $row['menu'];
                    $menus_text =  $menus_text . (($menus_text=="" ? "":";") . $menu_field);
                    $menu_items_all =$row['items_all'];
                    $menu_items_default =$row['items_default'];
                    if ($row_menu_usuario[$menu_field] == "")
                       $this->result["menu_" . $menu_field] = $menu_items_default;
                    else if ($row_menu_usuario[$menu_field] == "ALL")
                        $this->result["menu_" . $menu_field] = $menu_items_all;
                    else
                        $this->result["menu_" . $menu_field] =$row_menu_usuario[$menu_field];
                }
                $this->result["menus"] = $menus_text;    
            }
            

        } catch (Exception $e) {
            $id_usuario_app = 0;
            $tema = "light";
            $app_language ="es";            
            $this->result["exception"] = 'Excepción recibida: ' . $e->getMessage();
        }

        $this->result["id_tipo_usuario"] = $id_tipo_usuario;
        $this->result["id_usuario_app"] = $id_usuario_app;
        $this->result["tema"] = $tema;
        $this->result["app_language"] = $app_language;
        $this->result["menu_favorites"] = $menu_favorites;

        return ($this->result);
    }

    // ---- GET ALMACENES_LIST
    public function get_almacenes_list()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }
        // ELSE USE NEXT MOCKUP

        $id_usuario = Requesting("id_usuario");

        if (!$id_usuario)
            return $this->DatosIncorrectos();
        $limit = !Requesting("limit") ? 1000 : Requesting("limit");
        $limit = ($limit == 0?1000:$limit);

        // Query original para obtener productos como terminales
        $query = "SELECT a.id_almacen, a.nombre, a.codigo 
                    FROM almacen a  
                    order by a.codigo
                    LIMIT " . $limit;

        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Usamos el prefijo 'item_' para que el XML sea válido y el frontend lo reconozca como lista            
            $data['item_' . $row['id_almacen']] = [
                'id_almacen' => $row['id_almacen'],
                'nombre' => $row['nombre'],
                'codigo' => $row['codigo']
            ];
        }

        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }


    // --- GET TERMINALES 
    public function get_terminales_list()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }

        // ELSE USE NEXT MOCKUP

        $id_usuario = Requesting("id_usuario");
        $id_almacen = Requesting("id_almacen");

        if (!$id_usuario || !$id_almacen)
            return $this->DatosIncorrectos();

        $limit = !Requesting("limit") ? 5 : Requesting("limit");
        $limit = ($limit == 0?5:$limit);

        // Query original para obtener productos como terminales
        $query = "SELECT p.id_producto as id_terminal, concat('Terminal ' , p.id_producto) as terminal
                  FROM producto p 
                  LIMIT " . $limit;

        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Usamos el prefijo 'item_' para que el XML sea válido y el frontend lo reconozca como lista
            $data['item_' . $row['id_terminal']] = [
                'id_terminal' => $row['id_terminal'],
                'nombre' => $row['terminal'],
                'descripcion' => $row['terminal']
            ];
        }

        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }

    // --- GET PICKEO (RESTAURADO) ---
    public function get_pickeo_list()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
           return $this->result;
        }

        // ELSE USE NEXT MOCKUP

        $id_terminal = Requesting("id_terminal");
        if (!$id_terminal) {
            return $this->DatosIncorrectos();
        }
        $limit = !Requesting("limit") ? 10 : Requesting("limit");
        $limit = ($limit == 0?10:$limit);

        // Query original solicitado para la lista de pickeo
        $query = "SELECT p.id_producto, p.nombre, p.referencia, p.codigo_1, m.marca, f.fabricante, 
                         p.id_producto as cantidad_solicitada, 0 as cantidad_recolectada, now() as last_update
                  FROM producto p 
                  LEFT JOIN marca m ON p.id_marca=m.id_marca
                  LEFT JOIN fabricante f ON m.id_fabricante=f.id_fabricante
                  LIMIT " . $limit;

        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['prod_' . $row['id_producto']] = [
                'id' => $row['id_producto'],
                'descripcion' => $row['nombre'],
                'referencia' => $row['referencia'],
                'marca' => $row['marca'],
                'fabricante' => $row['fabricante'],
                'cantidad_solicitada' => $row['cantidad_solicitada'],
                'cantidad_recolectada' => $row['cantidad_recolectada'],
                'last_update' => $row['last_update']
            ];
        }

        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }
    public function pickeo_checkout()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
           return $this->result;
        }

        // ELSE USE NEXT MOCKUP

        $id_terminal = Requesting("id_terminal");
        $id_usuario = Requesting("id_usuario");
        $datos_pickeo = Requesting("datos_pickeo"); // JSON enviado desde la App

        if (!$id_usuario || !$datos_pickeo || !$id_terminal) {
            return $this->DatosIncorrectos();
        }

        $sSQL = "insert into pickeo_list(id, id_usuario, id_terminal, data) " .
            " values (0," . $id_usuario . "," . $id_terminal . ",'" . $datos_pickeo . "')";
        ExecuteSQL_WS($sSQL);

        return [
            'result' => 'ok',
            //'sql' => $sSQL,
            'result_text' => 'Checkout procesado correctamente en ExosApp_WS'
        ];
    }

    // ########################### PROGRAMAR CIRUGIA #########################
    public function get_set_categorias()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }
        // ELSE USE NEXT MOCKUP

        $query = "SELECT id_set_categoria, nombre FROM set_categoria WHERE mostrar = 1 and id_set_categoria>1 ORDER BY nombre";
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_set_categoria']] = [
                'id_set_categoria' => $row['id_set_categoria'],
                'nombre' => $row['nombre'],
            ];
        }
        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }

    public function get_set_subcategorias()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }
        // ELSE USE NEXT MOCKUP
        $id_categoria = Requesting("id_categoria");

        if (!$id_categoria) {
            return $this->DatosIncorrectos();
        }

        $query = "SELECT id_set_subcategoria, nombre FROM set_subcategoria WHERE id_set_categoria = " . $id_categoria . " ORDER BY nombre";
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_set_subcategoria']] = [
                'id_categoria' => $id_categoria,
                'id_set_subcategoria' => $row['id_set_subcategoria'],
                'nombre' => $row['nombre'],
            ];
        }
        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }
    public function get_set_categorias_subcategorias()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }
        // ELSE USE NEXT MOCKUP        

        $query = "SELECT id_set_categoria, nombre FROM set_categoria WHERE mostrar = 1 and id_set_categoria>1 ORDER BY nombre";
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $query = "SELECT id_set_subcategoria, nombre FROM set_subcategoria WHERE id_set_categoria = " . $row['id_set_categoria'] . " ORDER BY nombre";
            $subitems_rows = DatasetSQL($query);
            $subitems = [];
            while ($sub_row = mysqli_fetch_array($subitems_rows)) {
                $subitems['subitem_' . $sub_row['id_set_subcategoria']] = [
                    'id_set_subcategoria' => $sub_row['id_set_subcategoria'],
                    'nombre' => $sub_row['nombre'],
                ];
            }
            $data['item_' . $row['id_set_categoria']] = [
                'id_set_categoria' => $row['id_set_categoria'],
                'nombre' => $row['nombre'],
                'subcategorias' => $subitems
            ];
        }
        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }

    public function get_equipos_poder_categoria()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }
        // ELSE USE NEXT MOCKUP      
        $query = "SELECT id_ep_categoria, nombre FROM equipo_poder_categoria ORDER BY nombre";
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_ep_categoria']] = [
                'id_ep_categoria' => $row['id_ep_categoria'],
                'nombre' => $row['nombre'],
            ];
        }
        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }


    public function get_instrumental_categoria()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }
        // ELSE USE NEXT MOCKUP
        $query = "SELECT id_instru_categoria, nombre FROM instrumental_categoria ORDER BY nombre";
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_instru_categoria']] = [
                'id_instru_categoria' => $row['id_instru_categoria'],
                'nombre' => $row['nombre'],
            ];
        }
        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }
    public function get_consumible_categoria()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }
        // ELSE USE NEXT MOCKUP
        $query = "SELECT id_consu_categoria, nombre FROM consumible_categoria ORDER BY nombre";
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_consu_categoria']] = [
                'id_consu_categoria' => $row['id_consu_categoria'],
                'nombre' => $row['nombre'],
            ];
        }
        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }
    public function get_estados()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }
        // ELSE USE NEXT MOCKUP
        $query = "SELECT id_estado, nombre FROM estado ORDER BY nombre";
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_estado']] = [
                'id_estado' => $row['id_estado'],
                'nombre' => $row['nombre'],
            ];
        }
        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }
    public function get_vendedores()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }
        // ELSE USE NEXT MOCKUP
        $id_usuario = Requesting("id_usuario");
        $first_row = Requesting("first_row");

        if (!$id_usuario) {
            return $this->DatosIncorrectos();
        }

        $query = "SELECT case when id_usuario=" . $id_usuario . " then 0 else 1 end as yo_primero, id_usuario, id_vendedor, upper(nombre) as nombre, programar FROM vendedor WHERE activo = 1 ORDER BY yo_primero, nombre";
        $qresult = DatasetSQL($query);
        $data = [];
        if ($first_row != "") {
            $data['item_0'] = [
                'id_vendedor' => "0",
                'nombre' => $first_row,
            ];
        }
        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_vendedor']] = [
                'id_vendedor' => $row['id_vendedor'],
                'nombre' => $row['nombre'],
            ];
        }
        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }

    public function get_tecnicos()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }
        // ELSE USE NEXT MOCKUP
        $id_usuario = Requesting("id_usuario");

        if (!$id_usuario) {
            return $this->DatosIncorrectos();
        }

        $sSQL = "SELECT case when upper(t.tipo_usuario) = 'TECNICO' then 1 else 0 end as es_tecnico" .
            " from usuario u left join tipo_usuario t on u.id_tipo_usuario=t.id_tipo_usuario where u.id_usuario =" . $id_usuario;
        $es_tecnico = GetValueSQL($sSQL, "es_tecnico");

        $sSQL = "SELECT COUNT(v.id_vendedor) AS es_vendedor from vendedor v WHERE v.id_usuario =" . $id_usuario;
        $es_vendedor = GetValueSQL($sSQL, "es_vendedor");


        $data = [];

        $data['item_0'] = [
            'id_tecnico' => "0",
            'nombre' => ($es_tecnico || $es_vendedor) ? "VENDEDOR" : "MISMO QUE VENDEDOR"
        ];

        $query = "select case when t.id_usuario=" . $id_usuario . " then 0 else 1 end as yo_primero, t.id_usuario,  t.id_tecnico, t.nombre from tecnico t where t.activo = 1 and upper(t.nombre)<>'VENDEDOR' order by yo_primero, t.nombre";
        $qresult = DatasetSQL($query);



        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_tecnico']] = [
                'id_tecnico' => $row['id_tecnico'],
                'nombre' => $row['nombre'],
            ];
        }
        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }

    public function get_hospitales()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }
        // ELSE USE NEXT MOCKUP
        $id_almacen = Requesting("id_almacen");

        if (!$id_almacen)
            return $this->DatosIncorrectos();

        $query = "SELECT id_hospital, nombre FROM hospital where id_almacen=" . $id_almacen . " ORDER BY nombre";
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_hospital']] = [
                'id_hospital' => $row['id_hospital'],
                'nombre' => $row['nombre'],
            ];
        }
        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }

    public function get_subdistribuidor()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }
        // ELSE USE NEXT MOCKUP

        $query = "SELECT id_subdistribuidor, subdistribuidor FROM subdistribuidor where es_socio=0  ORDER BY subdistribuidor";
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_subdistribuidor']] = [
                'id_subdistribuidor' => $row['id_subdistribuidor'],
                'subdistribuidor' => $row['subdistribuidor'],
                'no_registrado' => $row['subdistribuidor'] == "01 NO REGISTRADO" ? 1 : 0
            ];
        }
        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }

    public function get_medicos_list()
    {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }
        // ELSE USE NEXT MOCKUP

        $resultStatus = "ok";
        $resultText = "Correcto.";
        $data['item_0'] = [
            "id_medico" => "0",
            "nombre" => "Medicos..."
        ];

        $id_usuario = Requesting("id_usuario");

        if (!$id_usuario) {
            return $this->DatosIncorrectos();
        }

        $query_tu = "select t.tipo_usuario,u.id_almacen from usuario u left join tipo_usuario t on u.id_tipo_usuario=t.id_tipo_usuario where u.id_usuario = " . $id_usuario;
        $tipo_de_usuario = GetValueSQL($query_tu, "tipo_usuario");
        $id_almacen = GetValueSQL($query_tu, "id_almacen");

        
        if ($tipo_de_usuario === "SISTEMAS") {
            $query = "SELECT id_medico, nombre, paterno, materno, cedula FROM medico WHERE id_almacen = " . $id_almacen . " ORDER BY nombre";
            $qresult = DatasetSQL($query);
            while ($row = mysqli_fetch_array($qresult)) {
                $data['item_' . $row['id_medico']] = [
                    "id_medico" => $row['id_medico'],
                    "nombre" => strtoupper($row['nombre'] . " " . $row['paterno'] . " " . $row['materno'] . " / " . $row['cedula'])
                ];

            }
        } else {
            $query_v = "SELECT COUNT(id_vendedor) AS existe, id_vendedor FROM vendedor WHERE id_usuario = " . $id_usuario;
            $existe = GetValueSQL($query_v, "existe");
            if ($existe > 0) {

                $id_vendedor = GetValueSQL($query_v, "id_vendedor");
                $query1 = "SELECT id_medico FROM medico_vendedor WHERE id_vendedor = " . $id_vendedor;
                $qresult1 = DatasetSQL($query1);
                while ($row1 = mysqli_fetch_array($qresult1)) {
                    $query = "SELECT id_medico, nombre, paterno, materno, cedula FROM medico WHERE id_medico = " . $row1['id_medico'];
                    $qresult = DatasetSQL($query);
                    while ($row = mysqli_fetch_array($qresult)) {
                        $data['item_' . $row['id_medico']] = [
                            "id_medico" => $row['id_medico'],
                            "nombre" => strtoupper($row['nombre']." ".$row['paterno']." ".$row['materno']." / ".$row['cedula'])
                        ];

                    }
                }

            } else {
                $query = "SELECT id_medico, nombre, paterno, materno, cedula FROM medico WHERE id_almacen = " . $id_almacen . " ORDER BY nombre";
                $qresult = DatasetSQL($query);
                while ($row = mysqli_fetch_array($qresult)) {
                    $data['item_' . $row['id_medico']] = [
                            "id_medico" => $row['id_medico'],
                            "nombre" => strtoupper($row['nombre']." ".$row['paterno']." ".$row['materno']." / ".$row['cedula'])
                        ];
                }
            }


        }

        return ( $data ? [
                'result' => 'ok',
                'result_text' => '',
                'data'=> $data
                ] : ['result' => 'empty']);
    }

    public function save_profile()
    {
         // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }
        // ELSE USE NEXT MOCKUP    

        $id_usuario_app = Requesting("id_usuario_app");
        $tema = Requesting("tema");
        $app_language = Requesting("app_language");
        $menu_favorites = Requesting("menu_favorites");

        if (!$id_usuario_app || !$tema || !$app_language) {
            return $this->DatosIncorrectos();
        }

        try {
            $query = "update user_profile set tema='" . $tema ."', app_language='" .  $app_language . "', menu_favorites='". $menu_favorites ."' where id_usuario_app=" . $id_usuario_app;
            ExecuteSQL_WS($query);
            $this->result["result"] = 'ok';
            $this->result["result_text"] = 'Perfil guardado con éxito';
            
        } catch (Exception $e) {
            $this->result["result_text"] = 'Excepción recibida: ' . $e->getMessage();
            $this->result["result"] = 'error';
        }

        $this->result["id_usuario_app"] = $id_usuario_app;
        $this->result["tema"] = $tema;
        $this->result["app_language"] = $app_language;

        return ($this->result);
    }

    public function guardar_cirugia(){
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }        
        // ELSE USE NEXT MOCKUP

        $id_usuario 					= Requesting("id_usuario"); 
        $id_almacen 					= Requesting("id_almacen"); 
        $tipo							= Requesting("tipo"); 
        $nuevo_cirugia_id 				= Requesting("nuevo_cirugia_id"); 
        $nuevo_cirugia_fecha 			= Requesting("nuevo_cirugia_fecha");
        $nuevo_cirugia_hora 			= Requesting("nuevo_cirugia_hora");
        $nuevo_cirugia_estado 			= Requesting("nuevo_cirugia_estado");
        $nuevo_cirugia_ciudad 			= Requesting("nuevo_cirugia_ciudad");
        $nuevo_cirugia_vendedor 		= Requesting("nuevo_cirugia_vendedor");
        $nuevo_cirugia_tecnico 			= Requesting("nuevo_cirugia_tecnico"); 
        $nuevo_cirugia_tecnico_2 		= Requesting("nuevo_cirugia_tecnico_2");
		$nuevo_cirugia_tecnico_2 = ($nuevo_cirugia_tecnico_2 == "0") ? $nuevo_cirugia_tecnico : $nuevo_cirugia_tecnico_2;
        $nuevo_cirugia_subdistribuidor 	= Requesting("nuevo_cirugia_subdistribuidor");
        $nuevo_cirugia_subdistribuidor_txt 	= Requesting("nuevo_cirugia_subdistribuidor_txt");
        $nuevo_cirugia_hospital 		= Requesting("nuevo_cirugia_hospital"); 
        $nuevo_cirugia_medico 			= Requesting("nuevo_cirugia_medico");
        $minialmacen_string 			= Requesting("minialmacen_string");
        $equipopoder_string 			= Requesting("equipopoder_string");
        $adicionales_string 			= Requesting("adicionales_string");
        $consumibles_string 			= Requesting("consumibles_string");
        $nuevo_cirugia_notas 			= Requesting("nuevo_cirugia_notas");        
        $nuevo_cirugia_paciente 		= Requesting("nuevo_cirugia_paciente");
        $nuevo_cirugia_paciente_p 		= Requesting("nuevo_cirugia_paciente_p");
        $nuevo_cirugia_paciente_m 		= Requesting("nuevo_cirugia_paciente_m");
        
        $nuevo_cirugia_esteril 			= Requesting("nuevo_cirugia_esteril");
        
        $nuevo_cirugia_orden_pago 		= Requesting("nuevo_cirugia_orden_pago");
        $nuevo_cirugia_file_name 		= Requesting("nuevo_cirugia_file_name"); 
        
        $query ="SELECT case when id_subdistribuidor=6 then concat(subdistribuidor,upper('-" . $nuevo_cirugia_subdistribuidor_txt . "')) else subdistribuidor end as subdistribuidor_name "
                . " FROM subdistribuidor where id_subdistribuidor=".$nuevo_cirugia_subdistribuidor;
        $subdistribuidor = GetValueSQL($query,"subdistribuidor_name");
        $notas = $nuevo_cirugia_notas;

        $resultStatus 	= "ok"; 
	    $resultText 	= "Correcto.";

        

        $fecha = $nuevo_cirugia_fecha." ".$nuevo_cirugia_hora;        

        if($nuevo_cirugia_id == "0"){
                $thisyear = date("Y");
                $query = "select concat('". $thisyear ."','CX', case when count(*)=0 then 1 else max(cast(mid(mid(c.codigo,1, instr(c.codigo, a.codigo)-1),5) as integer))+1 end,a.codigo) as codigo_num " 
                         . " from cirugia c left join almacen a on c.id_almacen=a.id_almacen where c.year=" . $thisyear
                         . " and c.id_almacen=" . $id_almacen;

                $codigo_de_cirugia = GetValueSQL($query,"codigo_num");

                $query = "INSERT INTO cirugia (codigo, id_solicitud, id_vendedor, id_almacen, id_tecnico,id_tecnico2, 
					id_medico, id_hospital, id_estado, municipio, fecha_programacion, fecha_cirugia, id_subdistribuidor, 
					subdistribuidor, minialmacen, equipo_poder, adicionales, consumibles, notas, estatus, 
					paciente, paciente_p, paciente_m, paciente_edad, esteril, diagnostico, year, codigo_qr, kardex, id_usuario_kardex)
					VALUES ( '".$codigo_de_cirugia."', 0, ".$nuevo_cirugia_vendedor.", ".$id_almacen.", ".$nuevo_cirugia_tecnico.", ".$nuevo_cirugia_tecnico_2.",  
					".$nuevo_cirugia_medico.",  ".$nuevo_cirugia_hospital.", ".$nuevo_cirugia_estado.", '".$nuevo_cirugia_ciudad."', NOW(), '".$fecha."', ".$nuevo_cirugia_subdistribuidor.", 
					'".$subdistribuidor."', '".$minialmacen_string."', '".$equipopoder_string."', '".$adicionales_string."','".$consumibles_string."','".$notas."', 5, 
					'".$nuevo_cirugia_paciente."' ,'".$nuevo_cirugia_paciente_p."' ,'".$nuevo_cirugia_paciente_m."' , 0, ".$nuevo_cirugia_esteril.", '', ".$thisyear.", '', NOW(),  ".$id_usuario.")";
				
				$nuevo_cirugia_id = -1; //ExecuteSQL_ReturnID($query);
        }
        else {
                $query = "UPDATE cirugia SET 
						id_vendedor = ".$nuevo_cirugia_vendedor.", 
						id_tecnico = ".$nuevo_cirugia_tecnico.", 
						id_tecnico2 = ".$nuevo_cirugia_tecnico_2.", 
						id_medico = ".$nuevo_cirugia_medico.", 
						id_hospital = ".$nuevo_cirugia_hospital.", 
						id_estado = ".$nuevo_cirugia_estado.", 
						municipio = '".$nuevo_cirugia_ciudad."', 
						fecha_cirugia = '".$fecha."', 
						minialmacen = '".$minialmacen_string."',  
						equipo_poder = '".$equipopoder_string."', 
						adicionales = '".$adicionales_string."',  
						consumibles = '".$consumibles_string."', 
						notas = '".$notas."',  
						paciente = '".$nuevo_cirugia_paciente."',
						paciente_p = '".$nuevo_cirugia_paciente_p."',
						paciente_m = '".$nuevo_cirugia_paciente_m."',
						esteril = '".$nuevo_cirugia_esteril."',
						kardex = NOW(), id_usuario_kardex = ".$id_usuario." 
					WHERE id_cirugia = ".$nuevo_cirugia_id ;
                //ExecuteSQL($query); 
        }

        $this->result = array(    
                        'nuevo_cirugia_hospital' 	=> $nuevo_cirugia_hospital,    
                        'nuevo_cirugia_id' 	=> $nuevo_cirugia_id,    
                        'result' 			=> $resultStatus,  
                        'result_text' 		=> $resultText
                        //,'sql'               => $query
	                 );	
        return ($this->result);	
    }
    public function getExtrasList($list, $cat_table, $cat_id, $cat_name, $line_sep="\n") {
        if (empty($list)) return "";

        $values = explode(',', $list);
        $items = []; // Usamos un array para manejar mejor los resultados

        foreach ($values as $id) {
            // Validamos que el par tenga el formato correcto para evitar errores            
            $sQuery = "SELECT upper(c.$cat_name) as item 
                    FROM $cat_table c                        
                    WHERE c.$cat_id = $id";

            $val = getValueSQL($sQuery, "item");
            
            if ($val) {
                $items[] = $val;
            }
        
        }       
        return trim(implode($line_sep, $items));
    }

    public function getMaterialList($list, $cat_table, $cat_id, $cat_name, $sub_table, $sub_id, $sub_name, $sep = " : ",$line_sep="\n") {
        if (empty($list)) return "";

        $pares = explode(',', $list);
        $items = []; // Usamos un array para manejar mejor los resultados

        foreach ($pares as $par) {
            // Validamos que el par tenga el formato correcto para evitar errores
            if (strpos($par, '/') !== false) {
                [$cat_value, $sub_value] = explode('/', $par);

                // 1. Usamos comillas simples para el separador en SQL: '$sep'
                // 2. Corregimos los alias: 'c' para categoría, 's' para subcategoría
                $sQuery = "SELECT concat(upper(c.$cat_name), '$sep', upper(s.$sub_name)) as item 
                        FROM $sub_table s
                        INNER JOIN $cat_table c  ON s.$cat_id = c.$cat_id
                        WHERE c.$cat_id = $cat_value 
                        AND s.$sub_id = $sub_value";

                $val = getValueSQL($sQuery, "item");
                
                if ($val) {
                    $items[] = $val;
                }
            }
        }

        // Unimos los resultados con un salto de línea (PHP_EOL) o una coma
        return trim(implode($line_sep, $items));
    }
    public function get_cirugia_report($id_cirugia){
        $query = "SELECT c.id_cirugia, c.codigo, c.fecha_cirugia, c.estatus,c.fecha_programacion, 
                        case when c.esteril=0 then 'NO' else 'SI' end as esteril, c.notas,
                        c.minialmacen, c.equipo_poder, c.adicionales, c.consumibles,
                        upper(v.nombre) as vendedor, 
                        upper(t1.nombre) as tecnico, 
                        upper(t2.nombre) as tecnico2, 
                        c.id_subdistribuidor ,                
                        upper(c.subdistribuidor) as subdistribuidor ,                
                        upper(trim(concat(m.nombre, ' ', m.paterno,' ',m.materno))) as medico,
                        upper(h.nombre) as hospital ,
                        upper(e.nombre) as estado,
                        upper(c.municipio) as municipio
                FROM `cirugia` c 
                    LEFT join vendedor v on c.id_vendedor = v.id_vendedor 
                    LEFT join tecnico t1 on c.id_tecnico = t1.id_tecnico 
                    LEFT join tecnico t2 on c.id_tecnico2 = t2.id_tecnico 
                    /*LEFT join subdistribuidor sub on c.id_subdistribuidor=sub.id_subdistribuidor */
                    LEFT join medico m on c.id_medico = m.id_medico
                    LEFT join hospital h on c.id_hospital = h.id_hospital
                    LEFT join estado e on c.id_estado = e.id_estado
                WHERE c.id_cirugia=$id_cirugia";

         
        $qresult = DatasetSQL($query);
        $data_count = 0;        
        $row = mysqli_fetch_array($qresult);
        $estatus = $row['estatus'];
        switch($estatus){
            case 0: $estatus_text = "CANCELADA"; break;
            case 1: $estatus_text = "PROGRAMADA"; break;
            case 2: $estatus_text = "SURITDA"; break;
            case 3: $estatus_text = "FINALIZADA"; break;
            case 4: $estatus_text = "MATERIAL ENTREGADO"; break;
            case 5: $estatus_text = "SOLICITADA"; break;
        }

        $id_subdistribuidor = $row['id_subdistribuidor'];
        $subdistribuidor = $row['subdistribuidor'];
        if($id_subdistribuidor == 1) $subdistribuidor ="";            
        

        $data_count ++;
        
        $minialmacen = $this->getMaterialList($row['minialmacen'],"set_categoria","id_set_categoria","nombre","set_subcategoria","id_set_subcategoria","nombre",":");
        $ep =  $this->getExtrasList($row['equipo_poder'],"equipo_poder_categoria","id_ep_categoria","nombre");
        $adicionales = $this->getExtrasList($row['adicionales'],"instrumental_categoria","id_instru_categoria","nombre");
        $consumibles = $this->getExtrasList($row['consumibles'],"consumible_categoria","id_consu_categoria","nombre");        
        
        $tiempo_surtido = "";
        $tiempo_entrega_tecnico = "";

        $remision = "";
        $last_update ="";
        $last_updater ="";
        

        $data = [
            "id_cirugia" => $row['id_cirugia'],                    
            "codigo" => $row['codigo'],                    
            "fecha_cirugia" => $row['fecha_cirugia'],                    
            "estatus" => $row['estatus'],                    
            "estatus_text" => $estatus_text,
            "vendedor" => $row['vendedor'],                    
            "tecnico" => $row['tecnico'],                    
            "tecnico2" => $row['tecnico2'],
            "id_subdistribuidor" => $id_subdistribuidor,
            "subdistribuidor" => $subdistribuidor,
            "tiempo_surtido"  => $tiempo_surtido,
            "tiempo_entrega_tecnico"  => $tiempo_entrega_tecnico,
            "fecha_programacion"  => $row['fecha_programacion'],                    
            "medico"  => $row['medico'],
            "hospital"  => $row['hospital'],
            "estado"  => $row['estado'],
            "municipio"  => $row['municipio'],
            "minialmacen"  => $minialmacen,
            "ep"  => $ep,
            "adicionales"  => $adicionales,
            "consumibles"  => $consumibles,
            "esteril"  => $row['esteril'],
            "notas"  => $row['notas'],
            "remision"  => $remision,
            "last_update"  => $last_update,
            "last_updater"  => $last_updater,            
            'sql' => $this->is_debuging ? $query : ""
        ];
        return $data;
    }
    public function buscar_cirugia(){
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            return $this->result;
        }        
        // ELSE USE NEXT MOCKUP

        $id_usuario  = Requesting("id_usuario"); 
        $estatus  = Requesting("estatus");
        $fecha_inicial  = $this->SQLDate(Requesting('fecha_inicial'));
        $fecha_final  = $this->SQLDate(Requesting('fecha_final'));
        $vendedor  = Requesting('vendedor');
        $tecnico  = Requesting('tecnico');
        $subdistribuidor  = Requesting('subdistribuidor');
        $codigo_cirugia   = Requesting('codigo_cirugia');
        $limite  = Requesting('limite');
        $limite = (($limite == '' ) || ($limite=='0')?10:$limite);

        if (!$id_usuario) {
            return $this->DatosIncorrectos();
        }         

        $query = "SELECT c.id_cirugia
                FROM `cirugia` c                     
                WHERE 1=1" 
                . " and fecha_cirugia >= '$fecha_inicial'" 
                . " and fecha_cirugia <= '$fecha_final'"
                . ($vendedor ? " and id_vendedor=" . $vendedor : "")
                . ($tecnico ? " and (id_tecnico1=$tecnico or id_tecnico2=$tecnico)":"")
                . ($subdistribuidor ? " and id_subdistribuidor=" . $subdistribuidor : "")
                . ($codigo_cirugia ? " and c.codigo='" . $codigo_cirugia ."'" : "")                
                . ($estatus >=0 ? " and estatus=" .  $estatus : "")
                ." LIMIT " . ($limite ? $limite : "10");

         
        $qresult = DatasetSQL($query);
        
        $data = [];
        while ($row = mysqli_fetch_array($qresult)) {
            $id_cirugia = $row['id_cirugia'];            
            $data['item_' . $row['id_cirugia']] = $this->get_cirugia_report($id_cirugia);
        }            
        $data_count = count($data);


        return ( ['result' => 'ok',
                'result_text' => '',
                'data_count' => $data_count,
                'data'=> $data,
                'sql' => $this->is_debuging ? $query : ""                
                ] );
    }                
}

    

new WebServiceController();