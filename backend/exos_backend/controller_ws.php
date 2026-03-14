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

class WebServiceController {
    private $exosApp;
    private $implemented;
    private $result;
    
    /**
     * Mapa de metadatos para el Auditor de Métodos
     */
    private $metodos_info = [
        'audit_ws_log'=> [
            'descripcion' => 'audita los logs de webservice.',
            'parameters' => ['limit','page','search']
        ],
        'metodo_ejemplo' => [
            'descripcion' => 'Ejemplo de implementacion real.',
            'parameters'  => ['id']
        ],
        'inicia_sesion' => [
            'descripcion' => 'Valida las credenciales del usuario y genera una sesión activa.',
            'parameters'  => ['login_usuario', 'login_password']
        ],
        'get_almacenes_list'=> [
            'descripcion'=> 'obtiene la lista de almacenes',
            'parameters'=> ['id_usuario','limit (opcional)']
            ],
        'get_terminales_list' => [
            'descripcion' => 'Obtiene la lista de terminales configuradas para el proceso de picking.',
            'parameters'  => ['id_usuario','id_almacen', 'limit (opcional)']
        ],
        'get_pickeo_list' => [
            'descripcion' => 'Recupera el listado de productos y cantidades pendientes para una terminal específica.',
            'parameters'  => ['id_usuario','id_terminal', 'limit (opcional)']
        ],
        'pickeo_checkout' => [
            'descripcion' => 'Registra el avance final del pickeo y cierra la transacción de la terminal.',
            'parameters'  => ['id_usuario','id_terminal', 'datos_pickeo (JSON)']
        ],
        'get_set_categorias' => [
            'descripcion' => 'Obtiene listado de set_categorias',
            'parameters'  => []
        ],
        'get_set_subcategorias'=> [
            'descripcion' => 'Obtiene listado de set_subcategorias',
            'parameters'  => ['id_categoria']
        ],
        'get_equipos_poder_categoria'=> [
            'descripcion' => 'Obtiene listado de equipos_poder_categoria',
            'parameters'  => []
        ],
        'get_instrumental_categoria'=> [
            'descripcion' => 'Obtiene listado de instrumental_categoria',
            'parameters'  => []
        ],
        'get_consumible_categoria'=> [
            'descripcion' => 'Obtiene listado de consumible_categoria',
            'parameters'  => []
        ],  
        'get_estados'=> [
            'descripcion' => 'Obtiene listado de estados',
            'parameters'  => []
        ],
        'get_vendedores'=> [
            'descripcion' => 'Obtiene listado de vendedores',
            'parameters'  => ["id_usuario","first_row"]
        ],     
        'get_tecnicos'=> [
            'descripcion' => 'Obtiene listado de tecnicos',
            'parameters'  => ["id_usuario"]
        ],     
        'get_hospitales'=> [
            'descripcion' => 'Obtiene listado de hospitales por id_almacen',
            'parameters'  => ["id_almacen"]
        ],         
    ];

    public function __construct() {
        $this->exosApp = new ExosApp_WS(); 
        $this->implemented = false;
        $this->result = [null];
        $this->run();
    }

    public function run() {
        $action = isset($_REQUEST["action"]) ? $_REQUEST["action"] : null;
        $subAction = isset($_REQUEST["sub_action"]) ? $_REQUEST["sub_action"] : null;

        if (!$action) {
            $this->sendError("Acción no especificada.");
            return;
        }

        // --- NUEVA ACCIÓN: LISTAR TODOS LOS MÉTODOS ---
        if ($action === "audit_methods") {
           $this->result =  $this->listAllMethods();
           $this->sendResponse($this->result);
           return;
        }

        // --- AUDITOR DE MÉTODO INDIVIDUAL ---
        if ( $subAction === "audit") {
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
            if ($this->implemented == true){
                 
                $this->sendResponse($this->result);
            }
            else{
                $this->sendError("La acción '{$action}' no es válida.");
            }
        }
    }

    // --- UTILIDADES ---
    private function sendResponse($data) {
        $id_usuario = isset($_REQUEST["id_usuario"]) ? strval($_REQUEST["id_usuario"]) : "0";

        $input = $_SERVER['QUERY_STRING'];

        $output = XML_Envelope_Text($data);

        $input_esc = str_replace("'", "\'", $input);
        $output_esc = str_replace("'", "\'", $output);
        
        $nombre ="";
        if ( ($id_usuario != "") && ($id_usuario != "0")) {                   
            $nombre =GetValueSQL("select coalesce(max(nombre), '') as usuario_nombre from usuario where id_usuario=" . $id_usuario, "usuario_nombre");
        }
        // Armamos la consulta
        $sSQL = "insert into ws_log(id, id_usuario, nombre, input, output) " .
                "values (0, " . $id_usuario . ",'". $nombre ."','" . $input_esc . "', '" . $output_esc . "')";

        $action = Requesting("action");
        if ( ($action != "listAllMethods") 
            && ($action != "auditMethod") 
            && ($action != "audit_ws_log") 
            && ($action != "audit_ws_log_data") )
                ExecuteSQL_WS($sSQL ); 
        //$data["SQL"] = $sSQL;
        XML_Envelope($data);
    }
    private function DatosIncorrectos(){
        $input = $_SERVER['QUERY_STRING'];
        return([
            'result' => 'error',
            'parametros' => $input,
            'result_text' => "Datos incorrectos"
        ]);       
    }
    private function sendError($message) {
        $this->sendResponse([
            'result' => 'error',
            'result_text' => $message
        ]);
    }
    /**
     * Lista todos los métodos registrados en el sistema de auditoría.
     */
    private function listAllMethods() {
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

        return($data);
    }

    /**
     * Auditoría de un método específico.
     */
    private function auditMethod($action) {
        if (isset($this->metodos_info[$action])) {
            $info = $this->metodos_info[$action];
            $data = [
                'result'      => 'true',
                'descripcion' => $info['descripcion'],
                'parameters'  => []
            ];

            foreach ($info['parameters'] as $index => $param) {
                $data['item_' . $index] = ['nombre' => $param];
            }

            return($data);
        } else {
            $this->sendError("No existe información de auditoría para la acción solicitada.");
        }
    }

    private function audit_ws_log(){
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $offset = ($page - 1) * $limit;

        // 1. Contar total de registros para la paginación (con filtro)
        $searchQuery = "%$search%";
        $sqlCount = "SELECT COUNT(*) as total FROM ws_log WHERE nombre LIKE '%" . $search . "%'";
        $totalRows = GetValueSQL_WS($sqlCount,"total");
        $totalPages = ceil($totalRows / $limit);

        // 2. Obtener los datos paginados
        $sqlData = "SELECT * FROM ws_log WHERE nombre LIKE '%" . $search . "%' ORDER BY id DESC LIMIT $limit OFFSET $offset";
        $records = DatasetSQL_WS($sqlData);
        $data = [];
        
        while ($row = mysqli_fetch_array($records)){
            // Usamos el prefijo 'item_' para que el XML sea válido y el frontend lo reconozca como lista
            $input_esc = str_replace("'", "\'", $row['input']);
            $output_esc = str_replace("'", "\'", $row['output']);
            $data['id' . $row['id']] = [
                'fecha' => $row['fecha'],
                'hora' => $row['hora'],
                'id_usuario' => $row['id_usuario'],
                'nombre'      => $row['nombre']
            ];
        }
        $data = [
                'result'      => 'true',
                'sql' => $sqlData,
                'data'  => $data
            ];
        return ($data); 
    }
    private function audit_ws_log_data(){
        $id_log = Requesting("id_log");
        $type = Requesting("type");
        if (!$id_log || !$type) {
            return $this->DatosIncorrectos();
        }
        $sqlData = "select " . $type ." from ws_log where id=" . $id_log;
        $value = GetValueSQL_WS($sqlData,$type);
        echo $value;
        exit;
        $data = [
            'result'      => 'true',
            'sql' => $sqlData,
            'value'  => $value
        ];
        return ($data);  

    }
    //****************************************************************************************** */
    // -------------------------- IMPLEMENTACION DE LOS WEB SERVICES MOCKUP --------------------
    //****************************************************************************************** */
    private function db_test(){
        try{
            $dbConx = mysqli_connect(Requesting('host'),Requesting('user'),Requesting('password'),Requesting('database'));
            $sSQL = isset($_REQUEST["sql"]) ? $_REQUEST["sql"] : "";
            $field = Requesting('field');
            $rsTemp=DatasetSQL_con($sSQL,$dbConx);
            if ($rsTemp!=null){
                $row = mysqli_fetch_array($rsTemp);
                $value = $row[$field=='' ? 0 : $field];
                return([$field=>$value]); 
            }
        }
        catch (Exception $e) {
            $id_usuario_app = 0;
            $tema = "light";
            $this->sendResponse(["exception" =>   $e->getMessage()]);
        }
    }
    // --- LOGIN ---
    public function inicia_sesion() {
        // if IMPLEMENTED 
        if ($this->implemented && $this->result != null){
           $id_usuario = $this->result["id_usuario"];
        }
        else { // ELSE USE NEXT MOCKUP
            $login_usuario = Requesting("login_usuario");
            $login_password = Requesting("login_password");

            if (!$login_usuario || !$login_password) {
                return $this->DatosIncorrectos();
            }

            // Se mantiene la lógica de tu archivo original con md5
            $query = "SELECT COUNT(u.id_usuario) AS existe, u.id_usuario, u.id_almacen, u.usuario, u.activo, a.nombre as almacen_nombre, a.codigo as almacen_codigo 
                    FROM usuario u left join almacen a on u.id_almacen=a.id_almacen
                    WHERE u.usuario = '".$login_usuario."' AND u.password = '".md5($login_password)."'";
            
            $existe = GetValueSQL($query, "existe");
            
            if($existe == 0){
                $this->sendError("Usuario o Contraseña incorrectos.");
                return;
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
            $query = "SELECT count(id_usuario_app) as existe, u.* 
                FROM user_profile u
                WHERE id_usuario = ".$id_usuario;
        
            $existe = GetValueSQL_WS($query, "existe");
            if ($existe==0){
                $sql_new ="insert into user_profile(id_usuario_app,id_usuario) values (0,". $id_usuario .")";
                if (!ExecuteSQL_WS($sql_new)){
                    $this->result["sql_error"] = $sql_new;
                }  
            }
            
            $id_usuario_app = GetValueSQL_WS($query,"id_usuario_app");
            $tema = GetValueSQL_WS($query,"tema");
        }
        catch (Exception $e) {
            $id_usuario_app = 0;
            $tema = "light";
            $this->result["exception"] =   'Excepción recibida: '.  $e->getMessage();
        }

        $this->result["id_usuario_app"] = $id_usuario_app;
        $this->result["tema"] = $tema;


        return($this->result); 
    }

    // ---- GET ALMACENES_LIST
    public function get_almacenes_list(){   
       // if IMPLEMENTED
        if ($this->implemented && $this->result != null){
           $this->sendResponse($this->result); 
           return;
        }  
        // ELSE USE NEXT MOCKUP

        $id_usuario = Requesting("id_usuario");
    
        if (!$id_usuario) 
            return $this->DatosIncorrectos();
        $limit = !Requesting("limit") ? 10 : Requesting("limit");

        // Query original para obtener productos como terminales
        $query = "SELECT a.id_almacen, a.nombre, a.codigo 
                    FROM almacen a  
                    order by a.codigo
                    LIMIT " . $limit;	
        
        $qresult = DatasetSQL($query);
        $data = [];
        
        while ($row = mysqli_fetch_array($qresult)){
            // Usamos el prefijo 'item_' para que el XML sea válido y el frontend lo reconozca como lista
            $data['item_' . $row['id_almacen']] = [
                'id_almacen' => $row['id_almacen'],
                'nombre'      => $row['nombre'],
                'codigo' => $row['codigo']
            ];
        }

        return($data ?: ['result' => 'empty']);
    }   
    

    // --- GET TERMINALES 
    public function get_terminales_list() {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null){
           $this->sendResponse($this->result); 
           return;
        }

        // ELSE USE NEXT MOCKUP

        $id_usuario = Requesting("id_usuario");
        $id_almacen = Requesting("id_almacen");

        if (!$id_usuario || !$id_almacen) 
            return $this->DatosIncorrectos();

        $limit = !Requesting("limit") ? 5 : Requesting("limit");

        // Query original para obtener productos como terminales
        $query = "SELECT p.id_producto as id_terminal, concat('Terminal ' , p.id_producto) as terminal
                  FROM producto p 
                  LIMIT " . $limit;	
        
        $qresult = DatasetSQL($query);
        $data = [];
        
        while ($row = mysqli_fetch_array($qresult)){
            // Usamos el prefijo 'item_' para que el XML sea válido y el frontend lo reconozca como lista
            $data['item_' . $row['id_terminal']] = [
                'id_terminal' => $row['id_terminal'],
                'nombre'      => $row['terminal'],
                'descripcion' => $row['terminal']
            ];
        }

       return ($data ?: ['result' => 'empty']);
    }

    // --- GET PICKEO (RESTAURADO) ---
    public function get_pickeo_list() {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null){
           $this->sendResponse($this->result); 
           return;
        }

        // ELSE USE NEXT MOCKUP

        $id_terminal = Requesting("id_terminal");
        if (!$id_terminal) {
            return $this->DatosIncorrectos();
        }
        $limit = !Requesting("limit") ? 10 : Requesting("limit");

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
                'id'                   => $row['id_producto'],
                'descripcion'          => $row['nombre'],
                'referencia'           => $row['referencia'],
                'marca'                => $row['marca'],
                'fabricante'           => $row['fabricante'],
                'cantidad_solicitada'  => $row['cantidad_solicitada'],
                'cantidad_recolectada' => $row['cantidad_recolectada'],
                'last_update'          => $row['last_update']
            ];
        }

        return $data ?: ['result' => 'empty'];
    }
    public function pickeo_checkout() {
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null){
           $this->sendResponse($this->result); 
           return;
        }

        // ELSE USE NEXT MOCKUP

        $id_terminal = Requesting("id_terminal");
        $id_usuario = Requesting("id_usuario");
        $datos_pickeo = Requesting("datos_pickeo"); // JSON enviado desde la App

        if ( !$id_usuario || !$datos_pickeo || !$id_terminal ) {
            return $this->DatosIncorrectos();
        }
        
        $sSQL = "insert into pickeo_list(id, id_usuario, id_terminal, data) " .
                " values (0," . $id_usuario . "," . $id_terminal . ",'". $datos_pickeo  ."')";
        ExecuteSQL_WS($sSQL);
        
        return [
            'result' => 'ok',
            //'sql' => $sSQL,
            'result_text' => 'Checkout procesado correctamente en ExosApp_WS'
        ];
    }

    // ########################### PROGRAMAR CIRUGIA #########################
    public function get_set_categorias(){
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null){
           $this->sendResponse($this->result); 
           return;
        }  
        // ELSE USE NEXT MOCKUP

        $query = "SELECT id_set_categoria, nombre FROM set_categoria WHERE mostrar = 1 ORDER BY nombre";
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_set_categoria']] = [
                'id_set_categoria' => $row['id_set_categoria'],
                'nombre'        => $row['nombre'],
            ];
        }
        return $data ?: ['result' => 'empty'];
    }

    public function get_set_subcategorias(){
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null){
           $this->sendResponse($this->result); 
           return;
        }  
        // ELSE USE NEXT MOCKUP
        $id_categoria = Requesting("id_categoria");        

        if ( !$id_categoria ) {
            return $this->DatosIncorrectos();
        }
        
        $query = "SELECT id_set_subcategoria, nombre FROM set_subcategoria WHERE id_set_categoria = ".$id_categoria." ORDER BY nombre";
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_set_subcategoria']] = [
                'id_categoria' => $id_categoria ,
                'id_set_subcategoria' => $row['id_set_subcategoria'],
                'nombre'        => $row['nombre'],
            ];
        }
        return $data ?: ['result' => 'empty'];
    }

    public function get_equipos_poder_categoria(){  
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null){
           $this->sendResponse($this->result); 
           return;
        }  
        // ELSE USE NEXT MOCKUP      
        $query = "SELECT id_ep_categoria, nombre FROM equipo_poder_categoria ORDER BY nombre";
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_ep_categoria']] = [                
                'id_ep_categoria' => $row['id_ep_categoria'],
                'nombre'        => $row['nombre'],
            ];
        }
        return $data ?: ['result' => 'empty'];
    }
   

    public function get_instrumental_categoria(){
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null){
           $this->sendResponse($this->result); 
           return;
        }  
        // ELSE USE NEXT MOCKUP
        $query = "SELECT id_instru_categoria, nombre FROM instrumental_categoria ORDER BY nombre";              
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_instru_categoria']] = [                
                'id_instru_categoria' => $row['id_instru_categoria'],
                'nombre'        => $row['nombre'],
            ];
        }
        return $data ?: ['result' => 'empty'];
    }
    public function get_consumible_categoria(){
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null){
           $this->sendResponse($this->result); 
           return;
        }  
        // ELSE USE NEXT MOCKUP
        $query = "SELECT id_consu_categoria, nombre FROM consumible_categoria ORDER BY nombre";              
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_consu_categoria']] = [                
                'id_consu_categoria' => $row['id_instru_categoria'],
                'nombre'        => $row['nombre'],
            ];
        }
        return $data ?: ['result' => 'empty'];
    }
    public function get_estados(){
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null){
           $this->sendResponse($this->result); 
           return;
        }  
        // ELSE USE NEXT MOCKUP
        $query = "SELECT id_estado, nombre FROM estado ORDER BY nombre";
        $qresult = DatasetSQL($query);
        $data = [];

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_estado']] = [                
                'id_estado' => $row['id_estado'],
                'nombre'        => $row['nombre'],
            ];
        }
        return $data ?: ['result' => 'empty'];
    }
    public function get_vendedores(){
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null){
           $this->sendResponse($this->result); 
           return;
        }  
        // ELSE USE NEXT MOCKUP
        $id_usuario = Requesting("id_usuario");
        $first_row = Requesting("first_row");

        if ( !$id_usuario ) {
            return $this->DatosIncorrectos();
        }

        $query = "SELECT case when id_usuario=". $id_usuario . " then 0 else 1 end as yo_primero, id_usuario, id_vendedor, upper(nombre) as nombre, programar FROM vendedor WHERE activo = 1 ORDER BY yo_primero, nombre";
        $qresult = DatasetSQL($query);
        $data = [];
        if ($first_row != ""){
            $data['item_0'] = [                
                    'id_vendedor' => "0",
                    'nombre'        => $first_row,
                ];
        }
        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_vendedor']] = [                
                'id_vendedor' => $row['id_vendedor'],
                'nombre'        => $row['nombre'],
            ];
        }
        return $data ?: ['result' => 'empty'];
    }

    public function get_tecnicos(){
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null){
           $this->sendResponse($this->result); 
           return;
        }  
        // ELSE USE NEXT MOCKUP
        $id_usuario = Requesting("id_usuario");

        if ( !$id_usuario ) {
            return $this->DatosIncorrectos();
        }

        $sSQL = "SELECT case when upper(t.tipo_usuario) = 'TECNICO' then 1 else 0 end as es_tecnico" .
               " from usuario u left join tipo_usuario t on u.id_tipo_usuario=t.id_tipo_usuario where u.id_usuario =" . $id_usuario;
        $es_tecnico = GetValueSQL($sSQL,"es_tecnico");

        $sSQL = "SELECT COUNT(v.id_vendedor) AS es_vendedor from vendedor v WHERE v.id_usuario =" . $id_usuario;
        $es_vendedor = GetValueSQL($sSQL,"es_vendedor");
        
        
        $data = [];

        $data['item_0'] = [                
                'id_tecnico' => "0",
                'nombre'        => ($es_tecnico || $es_vendedor) ? "VENDEDOR" : "MISMO QUE VENDEDOR"
            ];
    
        $query = "select case when t.id_usuario=" . $id_usuario . " then 0 else 1 end as yo_primero, t.id_usuario,  t.id_tecnico, t.nombre from tecnico t where t.activo = 1 and upper(t.nombre)<>'VENDEDOR' order by yo_primero, t.nombre";
        $qresult = DatasetSQL($query);

        

        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_tecnico']] = [                
                'id_tecnico' => $row['id_tecnico'],
                'nombre'        => $row['nombre'],
            ];
        }
        return $data ?: ['result' => 'empty'];
    }
    
    public function get_hospitales(){
        // if IMPLEMENTED
        if ($this->implemented && $this->result != null){
           $this->sendResponse($this->result); 
           return;
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
                'nombre'        => $row['nombre'],
            ];
        }
        return $data ?: ['result' => 'empty'];
    }
    
}

new WebServiceController();