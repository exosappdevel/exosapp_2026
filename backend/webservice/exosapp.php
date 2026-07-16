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
require_once "../include/functions_ws.php";
require_once "../include/variables_globales.php";

date_default_timezone_set('America/Mexico_City');

/**
 * Clase para la funcionalidad real de la aplicación
 */
class ExosApp_WS
{
    /**
     * Verifica si un método existe en esta clase
     * @param string $method_name Nombre del método a buscar
     * @return boolean
     */
    public $is_debuging=false;
    public $use_xml_envelope = true;

    public function Implemented($method_name)
    {
        return method_exists($this, $method_name);
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

    private function Get_Tipo_Usuario($id_usuario){
        $query_tu = "SELECT t.tipo_usuario FROM tipo_usuario t left join usuario u on t.id_tipo_usuario=u.id_tipo_usuario WHERE u.id_usuario = " . $id_usuario;
	    $tipo_de_usuario = GetValueSQL($query_tu,"tipo_usuario");
        return $tipo_de_usuario;
    }

    private function SQLDate($dateStr) {
        if (!$dateStr) return "";
        // Creamos el objeto desde el formato específico dd/mm/yyyy
        $dateObj = DateTime::createFromFormat('d/m/Y', $dateStr);
        // Retornamos en formato yyyy-mm-dd para el SQL
        return $dateObj ? $dateObj->format('Y-m-d') : $dateStr;
    }
    /**
     * Ejemplo de implementación
     * Aquí procesarías los datos recibidos por $_POST o $_REQUEST
     */
    public function metodo_ejemplo()
    {
        $id = Requesting("id");
        if (!$id) {
            return ['result' => 'error', 'result_text' => 'ID no valido'];
        }
        return [
            'result' => 'ok',
            'id' => $id,
            'result_text' => 'Metodo ejecutado exitosamente'
        ];
    }
    // Puedes ir moviendo aquí tus métodos reales poco a poco:
    
    //  GET TERMINALES 
    public function get_terminales_list()
    {
        $id_usuario = Requesting("id_usuario");
        $id_almacen = Requesting("id_almacen");
        $data = [];
        if (!$id_usuario OR !$id_almacen) {
            return ['result' => 'error', 'result_text' => 'USUARIO y ALMACEN son necesarios'];
        } else {
            $query = "SELECT id_terminal, terminal FROM terminal WHERE id_bodega = " . $id_almacen;
            $qresult = DatasetSQL($query);
            while ($row = mysqli_fetch_array($qresult)) {
                // Usamos el prefijo 'item_' para que el XML sea válido y el frontend lo reconozca como lista
                $data['item_' . $row['id_terminal']] = [
                    'id_terminal' => $row['id_terminal'],
                    'nombre' => $row['terminal'],
                    'descripcion' => $row['terminal']
                ];
            }
            return [
                'result' => 'ok',
                'data' => $data,
                'result_text' => 'Metodo ejecutado exitosamente'
            ];
        }
    }
    public function get_almacenes_list()
    {
        $id_usuario = Requesting("id_usuario");
        $data = [];
        if (!$id_usuario) {
            return ['result' => 'error', 'result_text' => 'USUARIO y ALMACEN son necesarios'];
        } else {
            // Query original para obtener productos como terminales
            $query = "SELECT a.id_almacen, a.nombre, a.codigo 
						FROM almacen a  
						order by a.codigo";
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
        }
        return [
            'result' => 'ok',
            'data' => $data,
            'result_text' => 'Metodo ejecutado exitosamente'
        ];
    }
    // --- GET PICKEO (RESTAURADO) --- 
    public function get_pickeo_list()
    {
        $id_terminal = Requesting("id_terminal");
        if (!$id_terminal) {
            return ['result' => 'error', 'result_text' => 'ID TERMINA necesaria'];
        } else {
            $limit = !Requesting("limit") ? 10 : Requesting("limit");
            /* *** De aqui tengo que enviar la info de la tabla fragmento *** */
            $query = "SELECT p.id_producto, p.nombre, p.referencia, p.codigo_1, m.marca, f.fabricante, fr.id_fragmento,
							fr.restante as cantidad_solicitada, 0 as cantidad_recolectada, now() as last_update
					FROM fragmento fr 
					INNER JOIN remision_inv ri ON (ri.id_remision_inv = fr.id_remision_inv )
					INNER JOIN inventario iv ON (iv.id_inventario = ri.id_inventario)
					INNER JOIN producto p ON (p.id_producto = iv.id_producto)
					LEFT JOIN marca m ON p.id_marca=m.id_marca
					LEFT JOIN fabricante f ON m.id_fabricante=f.id_fabricante 
					WHERE fr.pickeo = 0 AND fr.id_terminal = " . $id_terminal . "
					LIMIT " . $limit;
            //	echo $query;			 
            $qresult = DatasetSQL($query);
            $data = [];
            while ($row = mysqli_fetch_array($qresult)) {
                // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
                $data['prod_' . $row['id_producto']] = [
                    'id' => $row['id_producto'],
                    'id_fragmento' => $row['id_fragmento'],  /* *** fragmento.id_fragmento *** */
                    'descripcion' => $row['nombre'],
                    'referencia' => $row['referencia'],
                    'marca' => $row['marca'],
                    'fabricante' => $row['fabricante'],
                    'cantidad_solicitada' => $row['cantidad_solicitada'],
                    'cantidad_recolectada' => $row['cantidad_recolectada'],
                    'last_update' => $row['last_update']
                ];
            }
        }
        return [
            'result' => 'ok',
            'data' => $data,
            'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
        ];
    }
    public function pickeo_checkout()
    {
        /* *** Esta funcion guarda los fragmentos pickeados en la tabla fragmento_terminal *** */
        /* *** Fragmento_terminal es la tabla desde la cual se haran reposiciones desde EXOS *** */
        $id_terminal = Requesting("id_terminal");
        $id_usuario = Requesting("id_usuario");
        $datos_pickeo = Requesting("datos_pickeo"); // JSON enviado desde la App
        $bodega_surte = 1;
        $nums = 0;
        /* **** 
            necesito la sig estructura :
        $datos_pickeo[
            { 
                id_fragmento, 
                id_terminal,
                bodega_surte // en teoria ahora siempre seria matriz GDL
            }
        ]
        *** */
        if (!$id_usuario || !$datos_pickeo || !$id_terminal) {
            return ['result' => 'error', 'result_text' => 'DATOS REQUERIDOS'];
        }
        $sSQL = "insert into pickeo_list(id, id_usuario, id_terminal, data) " .
            " values (0," . $id_usuario . "," . $id_terminal . ",'" . $datos_pickeo . "')";
        //	 ExecuteSQL_WS($sSQL);
        /* **** AQUI DEBO GUARDAR LOS DATOS EN fragmento_terminal *** */
        $consulta = "INSERT INTO fragmento_terminal (id_fragmento, id_producto, id_terminal, cantidad, bodega_destino, bodega_surte, reposicion, kardex, id_usuario_kardex) VALUES ";
        /* **** estos son los datos reales que yo necesito que me envie la APP *** */
        /* **** id_fragmento se envia en get_pickeo_list() *** */
        $data = json_decode($datos_pickeo, true);
        foreach ($data as $row) {
            $id_fragmento = $row['id_fragmento'];
            //	$id_terminal 	= $row['id_terminal'];
            //	$bodega_surte 	= $row['bodega_surte'];
            $cantidad_recolectada = $row['cantidad_recolectada'];
            //	echo "ID ::: ".$id_fragmento." ::: TERMINAL ::: ".$terminal." ::: BODEGA ::: ".$bodega." //// ";
            if ($id_terminal > 0 AND $bodega_surte > 0 AND $cantidad_recolectada > 0) {
                $query1 = "SELECT fragmento.cantidad, inventario.id_producto, almacen.id_almacen AS bodega_destino, fragmento.id_fragmento
					FROM fragmento
					INNER JOIN remision_inv ON (remision_inv.id_remision_inv = fragmento.id_remision_inv)
					INNER JOIN inventario ON (inventario.id_inventario = remision_inv.id_inventario)
					INNER JOIN carpeta ON (carpeta.id_carpeta = fragmento.id_carpeta)
					INNER JOIN almacen ON (almacen.id_almacen = carpeta.id_bodega)
					WHERE fragmento.id_fragmento = " . $id_fragmento;
                $id_producto = GetValueSQL($query1, "id_producto");
                $cantidad = GetValueSQL($query1, "cantidad");
                $bodega_destino = GetValueSQL($query1, "bodega_destino");  /* ** bodega_destino es la bodega donde hizo el consumo *** se toma como DESTINO por que es a donde se enviará la REPO ** */
                /* **** aqui genero la consulta **** */
                $consulta .= "(" . $id_fragmento . ", " . $id_producto . ", " . $id_terminal . ", " . $cantidad_recolectada . ", " . $bodega_destino . ", " . $bodega_surte . ",0, NOW(), " . $id_usuario . "),";
                $nums++;
                /* ****** */
                /* Aqui pongo el campo PICKEO de la tabla FRAGMENTO en 1, ya que se mando a la canasta virtual *** */
                /* *** esta canasta virtual es donde se van a escanear para genera el QR DPI y meterlo a paqueteria *** */
                /* *** el flujo físico es que ya NO deberian regresar nada de las canastas al almacen, y de hacerlo, el producto seguira mostrandose en la tabla "fragmentos_terminal" *** */
                //	$queryupdf = "UPDATE fragmento SET pickeo = 1 WHERE id_fragmento = ".$id_fragmento;
                //	ExecuteSQL($queryupdf);
                /* *** EERORR *** */
                /* *** TENGO QUE VALIDAR QUE LA CANTIDAD_RECOLECTADA SEA IGUAL A LA CANTIDAD PICKEO. *** */
                /* *** SI ES IGUAL ENTONCES YA ELIMINO EL REGISTRO *** */
                $query2 = "SELECT restante FROM fragmento WHERE id_fragmento = " . $id_fragmento;
                $restante_actual = GetValueSQL($query2, "restante");
                $restante_nuevo = ($cantidad_recolectada) - ($restante_actual);
                if ($restante_nuevo < 0)
                    $restante_nuevo = 0;
                if ($restante_nuevo == 0) {
                    $queryupdf = "UPDATE fragmento SET restante = 0, pickeo = 1 WHERE id_fragmento = " . $id_fragmento;
                    ExecuteSQL($queryupdf);
                } else {
                    $queryupdf = "UPDATE fragmento SET restante = " . $restante_nuevo . " WHERE id_fragmento = " . $id_fragmento;
                    ExecuteSQL($queryupdf);
                }
            }
        }
        if ($nums > 0) {
            $consulta = rtrim($consulta, ",");
            ExecuteSQL($consulta);
        }
        //			[{"id_fragmento": 1, "id_terminal":1, "bodega_surte":1}]
        /*
        [{
            "id":"21327",
            "descripcion":"CEMENTO BonOs HV Genta 40.8g",
            "referencia":"01-0262",
            "marca":"BonOs HV Genta",
            "fabricante":"OSARTIS",
            "cantidad_solicitada":1,
            "cantidad_recolectada":0,
            "last_update":"2026-04-22 22:51:09",
            "prioridad":1001,
            "color":"#f56565",
            "faltante":1
        },
        {
            "id":"24426",
            "descripcion":"HOJA DE SIERRA 1.27  X 100",
            "referencia":"1002212",
            "marca":"DEPUY SYNTHES",
            "fabricante":"J&J",
            "cantidad_solicitada":1,
            "cantidad_recolectada":0,
            "last_update":"2026-04-22 22:51:09",
            "prioridad":1001,
            "color":"#f56565",
            "faltante":1
        },
        {
            "id":"23589",
            "descripcion":"SLIM BODY SKIN STAPLER",
            "referencia":"8886803712",
            "marca":"COVIDIEN",
            "fabricante":"MEDTRONIC",
            "cantidad_solicitada":1,
            "cantidad_recolectada":0,
            "last_update":"2026-04-22 22:51:09",
            "prioridad":1001,
            "color":"#f56565",
            "faltante":1
        }]
        */
        return [
            'result' => 'ok',
            //'sql' => $sSQL,
            'result_text' => 'Checkout procesado correctamente en EXOSAPP.PHP'
        ];
    }
    // ########################### PROGRAMAR CIRUGIA #########################
    public function get_set_categorias()
    {
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
        return [
            'result' => 'ok',
            //'sql' => $sSQL,
            'result_text' => 'Checkout procesado correctamente en EXOSAPP.PHP'
        ];
    }
    public function get_set_subcategorias()
    {
        $id_categoria = Requesting("id_categoria");
        if (!$id_categoria) {
            return ['result' => 'error', 'result_text' => 'DATOS REQUERIDOS'];
        } else {
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
            return [
                'result' => 'ok',
                'data' => $data,
                'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
            ];
        }
    }
    public function get_set_categorias_subcategorias()
    {
        $query = "SELECT id_set_categoria, nombre FROM set_categoria WHERE mostrar = 1 and id_set_categoria > 1 ORDER BY nombre";
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
        return [
            'result' => 'ok',
            'data' => $data,
            'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
        ];
    }
    public function get_equipos_poder_categoria()
    {
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
        return [
            'result' => 'ok',
            'data' => $data,
            'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
        ];
    }
    public function get_instrumental_categoria()
    {
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
        return [
            'result' => 'ok',
            'data' => $data,
            'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
        ];
    }
    public function get_consumible_categoria()
    {
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
        return [
            'result' => 'ok',
            'data' => $data,
            'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
        ];
    }
    public function get_estados()
    {
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
        return [
            'result' => 'ok',
            'data' => $data,
            'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
        ];
    }
    public function get_vendedores()
    {
        $id_usuario = Requesting("id_usuario");
        $first_row = Requesting("first_row");
        if (!$id_usuario) {
            return $this->DatosIncorrectos();
        }
        $query = "SELECT case when id_usuario=" . $id_usuario . " then 0 else 1 end as yo_primero, id_usuario, id_vendedor, upper(nombre) as nombre, programar 
			FROM vendedor 
			WHERE activo = 1 ORDER BY yo_primero, nombre";
        $qresult = DatasetSQL($query);
        $data = [];
        $row_no = 0;        
        while ($row = mysqli_fetch_array($qresult)) {
            // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
            $data['item_' . $row['id_vendedor']] = [
                'id_vendedor' => $row['id_vendedor'],
                'nombre' => ( ($first_row != "") && ($row_no==0))? $first_row : $row['nombre'],                
                'programar' => $row['programar'],
                'yo_primero' => $row['yo_primero']
            ];
            if ( ($row_no==0) && ($row['yo_primero']==0)){
                 break;
            }
            $row_no++;
        }
        return [
            'result' => 'ok',
            'data' => $data,            
            'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
        ];
    }
    public function get_tecnicos()
    {
        global $tipo_usuario_tecnico,$tipo_usuario_vendedor;
        $id_usuario = Requesting("id_usuario");
        if (!$id_usuario) {
            return $this->DatosIncorrectos();
        }
        $tipo_de_usuario = $this->Get_Tipo_Usuario($id_usuario);
        $es_tecnico = $tipo_de_usuario === $tipo_usuario_tecnico;
        $es_vendedor = $tipo_de_usuario === $tipo_usuario_vendedor;

        $sSQL_vendedor = "SELECT COUNT(v.id_vendedor) AS es_vendedor, upper(nombre) as nombre from vendedor v WHERE v.id_usuario =" . $id_usuario;        
        $sSQL_Tec ="";
        $data = [];

        if ($es_tecnico || $es_vendedor){
            $nombre_vendedor = GetValueSQL($sSQL_vendedor, "nombre");

            $sSQL_Tec = "SELECT COUNT(t.id_tecnico) AS existe, id_tecnico, upper(nombre) as nombre from tecnico t WHERE t.nombre ='VENDEDOR'";
            $existe_tecnico =GetValueSQL($sSQL_Tec, "existe");
            $id_tecnico_vendedor = ($existe_tecnico) ? GetValueSQL($sSQL_Tec, "id_tecnico") : 0; 

            $data['item_' .  $id_tecnico_vendedor] = [
                'id_tecnico' => $id_tecnico_vendedor,
                'nombre' => $nombre_vendedor];
        }
        else{
            $query1 = "SELECT id_tecnico, nombre FROM tecnico WHERE nombre = 'VENDEDOR'";
            $id_tecnico = GetValueSQL($query1,"id_tecnico");
            $data['item_' .  $id_tecnico] = [
                'id_tecnico' => $id_tecnico,
                'nombre' => 'MISMO QUE VENDEDOR'];
	    }
        
        
 
        $query = "SELECT id_tecnico, nombre FROM tecnico WHERE activo = 1 AND nombre <> 'VENDEDOR' ORDER BY nombre";
	    $qresult = DatasetSQL($query); 
        while ($row = mysqli_fetch_array($qresult)){
            $data['item_' .  $row['id_tecnico']] = [
                'id_tecnico' => $row['id_tecnico'],
                'nombre' => $row['nombre']
                ];            
        }  
        
        return [
            'result' => 'ok',
            'data' => $data,
            'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
        ];
    }
    public function get_hospitales(){        
        $id_almacen = Requesting("id_almacen");        
        $data = [];

        if (!$id_almacen ) {
            return ['result' => 'error', 'result_text' => 'DATOS REQUERIDOS'];
        } else {
            $query = "SELECT id_hospital, nombre, prepago FROM hospital where id_almacen=" . $id_almacen . " ORDER BY nombre";
            $qresult = DatasetSQL($query);                    
            while ($row = mysqli_fetch_array($qresult)) {
                    // Se usa el prefijo 'prod_' para asegurar etiquetas XML válidas
                    $data['item_' . $row['id_hospital']] = [
                        'id_hospital' => $row['id_hospital'],
                        'nombre' => $row['nombre'],
                        'prepago' => $row['prepago']
                    ];
                }                    
        
            return [
                    'result' => 'ok',
                    'data' => $data,
                    'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
                ];
        }                           
    }
    public function get_subdistribuidor()
    {
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
        return [
            'result' => 'ok',
            'data' => $data,
            'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
        ];
    }
    public function get_medicos_list()
    {        
        global $tipo_usuario_tecnico , $tipo_usuario_vendedor;
        global $tipo_usuario_sistemas , $tipo_usuario_administrador;  
        $id_usuario = Requesting("id_usuario");
        $id_almacen = Requesting("id_almacen");
        if (!$id_usuario || !$id_almacen) {
            return $this->DatosIncorrectos();
        }
        
        $tipo_de_usuario = $this->Get_Tipo_Usuario($id_usuario);
        $data = [];

        if($tipo_de_usuario === $tipo_usuario_sistemas OR $tipo_de_usuario === $tipo_usuario_administrador){
		    $query = "SELECT id_medico, nombre, paterno, materno, cedula FROM medico WHERE id_almacen = " . $id_almacen . " ORDER BY nombre";
            $qresult = DatasetSQL($query);
            while ($row = mysqli_fetch_array($qresult)) {
                $data['item_' . $row['id_medico']] = [
                    "id_medico" => $row['id_medico'],
                    "nombre" => trim(str_replace('  ',' ',str_replace('  ',' ', strtoupper($row['nombre'] . " " . $row['paterno'] . " " . $row['materno'] . " / " . $row['cedula']))))
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
                            "nombre" => trim(str_replace('  ',' ',str_replace('  ',' ', strtoupper($row['nombre'] . " " . $row['paterno'] . " " . $row['materno'] . " / " . $row['cedula']))))
                        ];
                    }
                }
            } else {
                $query = "SELECT id_medico, nombre, paterno, materno, cedula FROM medico WHERE id_almacen = " . $id_almacen . " ORDER BY nombre";
                $qresult = DatasetSQL($query);
                while ($row = mysqli_fetch_array($qresult)) {
                    $data['item_' . $row['id_medico']] = [
                        "id_medico" => $row['id_medico'],
                        "nombre" => trim(str_replace('  ',' ',str_replace('  ',' ', strtoupper($row['nombre'] . " " . $row['paterno'] . " " . $row['materno'] . " / " . $row['cedula']))))
                    ];
                }
            }
        }
        return [
            'result' => 'ok',
            'data' => $data,
            'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
        ];
    }
    /* ********* EXCLUSVIO DE LA APP ************ */    
    public function next_codigo_cirugia(){
        $id_almacen = Requesting("id_almacen");
        if (!$id_almacen) {
            return $this->DatosIncorrectos();
        }

         return[
            'result' => "ok",
            'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP',
            'codigo' =>$this->get_next_codigo_cirugia($id_almacen) ];
    }

    public function get_next_codigo_cirugia($id_almacen){        
        $query = "select concat('" . date("y") . "','CX', case when count(*)=0 then 1 else max(cast(mid(mid(c.codigo,1, instr(c.codigo, a.codigo)-1),5) as unsigned))+1 end,a.codigo) as codigo_num "
            . " from cirugia c left join almacen a on c.id_almacen=a.id_almacen where c.year=" . date("Y")
            . " and c.id_almacen=" . $id_almacen;
        $codigo_de_cirugia = GetValueSQL($query, "codigo_num");
        return $codigo_de_cirugia;
    }
    public function guardar_cirugia()
    {
        global $subdistribuidor_no_registrado;
        $id_usuario = Requesting("id_usuario");
        $id_almacen = Requesting("id_almacen");
        $tipo = Requesting("tipo");
        $nuevo_cirugia_id = Requesting("nuevo_cirugia_id");
        $nuevo_cirugia_fecha = Requesting("nuevo_cirugia_fecha");
        $nuevo_cirugia_hora = Requesting("nuevo_cirugia_hora");
        $nuevo_cirugia_estado = Requesting("nuevo_cirugia_estado");
        $nuevo_cirugia_ciudad = Requesting("nuevo_cirugia_ciudad");
        $nuevo_cirugia_vendedor = Requesting("nuevo_cirugia_vendedor");
        $nuevo_cirugia_tecnico = Requesting("nuevo_cirugia_tecnico");
        $nuevo_cirugia_tecnico_2 = Requesting("nuevo_cirugia_tecnico_2");
        $nuevo_cirugia_tecnico_2 = ($nuevo_cirugia_tecnico_2 == "0") ? $nuevo_cirugia_tecnico : $nuevo_cirugia_tecnico_2;
        $nuevo_cirugia_subdistribuidor = Requesting("nuevo_cirugia_subdistribuidor");
        $nuevo_cirugia_subdistribuidor_txt = Requesting("nuevo_cirugia_subdistribuidor_txt");
        $nuevo_cirugia_hospital = Requesting("nuevo_cirugia_hospital");
        $nuevo_cirugia_medico = Requesting("nuevo_cirugia_medico");
        $minialmacen_string = Requesting("minialmacen_string");
        $equipopoder_string = Requesting("equipopoder_string");
        $adicionales_string = Requesting("adicionales_string");
        $consumibles_string = Requesting("consumibles_string");
        $nuevo_cirugia_notas = Requesting("nuevo_cirugia_notas");
        $nuevo_cirugia_paciente = Requesting("nuevo_cirugia_paciente");
        $nuevo_cirugia_paciente_p = Requesting("nuevo_cirugia_paciente_p");
        $nuevo_cirugia_paciente_m = Requesting("nuevo_cirugia_paciente_m");
        $nuevo_cirugia_esteril = Requesting("nuevo_cirugia_esteril");
        $nuevo_cirugia_orden_pago = Requesting("nuevo_cirugia_orden_pago");
        $nuevo_cirugia_file_name = Requesting("nuevo_cirugia_file_name");
        
        $notas = $nuevo_cirugia_notas;                
        $fecha = $this->SQLDate($nuevo_cirugia_fecha) . " " . $nuevo_cirugia_hora;        
        
        $query ="SELECT case when id_subdistribuidor=6 then concat(subdistribuidor,upper('-" . $nuevo_cirugia_subdistribuidor_txt . "')) else subdistribuidor end as subdistribuidor_name "
                . " FROM subdistribuidor where id_subdistribuidor=".$nuevo_cirugia_subdistribuidor;
        $subdistribuidor = GetValueSQL($query,"subdistribuidor_name");

        if($subdistribuidor == $subdistribuidor_no_registrado){
					$subdistribuidor = $subdistribuidor." - ".$nuevo_cirugia_subdistribuidor_txt;
				}

	    $prepago = GetValueSQL("SELECT prepago FROM hospital WHERE id_hospital = ".$nuevo_cirugia_hospital,"prepago");  

        if ($nuevo_cirugia_id == "0") {
            
            // -- Verifica si existe la cirugia
            $query_bc = "SELECT COUNT(id_cirugia) AS existe, max(codigo) as codigo FROM cirugia WHERE
							id_almacen = ".$id_almacen." AND 
							id_vendedor = ".$nuevo_cirugia_vendedor." AND 
							id_medico = ".$nuevo_cirugia_medico." AND 
							id_hospital = ".$nuevo_cirugia_hospital." AND 
							fecha_cirugia = '".$fecha."'";
			$existe = GetValueSQL($query_bc, "existe");
			if($existe >= 1){ 
                $codigo_de_cirugia = GetValueSQL($query_bc, "codigo");
                return[
                    'metodo' => "EXOSAPP.PHP",                    
                    'result' => "error",
                    'result_text' => "Ya existe esta cirugia con el codigo " . $codigo_de_cirugia
                ];        
			}

            // --- La cirugua no existe, agregala

            $thisyear = date("Y");

            $query = "select concat('" . $thisyear . "','CX', case when count(*)=0 then 1 else max(cast(mid(mid(c.codigo,1, instr(c.codigo, a.codigo)-1),5) as unsigned))+1 end,a.codigo) as codigo_num "
                . " from cirugia c left join almacen a on c.id_almacen=a.id_almacen where c.year=" . $thisyear
                . " and c.id_almacen=" . $id_almacen;
            $codigo_de_cirugia =  $this->get_next_codigo_cirugia($id_almacen);
            
            $query = "INSERT INTO cirugia (codigo, id_solicitud, id_vendedor, id_almacen, id_tecnico,id_tecnico2, 
					id_medico, id_hospital, id_estado, municipio, fecha_programacion, fecha_cirugia, id_subdistribuidor, 
					subdistribuidor, minialmacen, equipo_poder, adicionales, consumibles, notas, estatus, 
					paciente, paciente_p, paciente_m, paciente_edad, esteril, diagnostico, year, codigo_qr, kardex, id_usuario_kardex)
					VALUES ( '" . $codigo_de_cirugia . "', 0, " . $nuevo_cirugia_vendedor . ", " . $id_almacen . ", " . $nuevo_cirugia_tecnico . ", " . $nuevo_cirugia_tecnico_2 . ",  
					" . $nuevo_cirugia_medico . ",  " . $nuevo_cirugia_hospital . ", " . $nuevo_cirugia_estado . ", '" . $nuevo_cirugia_ciudad . "', NOW(), '" . $fecha . "', " . $nuevo_cirugia_subdistribuidor . ", 
					'" . $subdistribuidor . "', '" . $minialmacen_string . "', '" . $equipopoder_string . "', '" . $adicionales_string . "','" . $consumibles_string . "','" . $notas . "', 5, 
					'" . $nuevo_cirugia_paciente . "' ,'" . $nuevo_cirugia_paciente_p . "' ,'" . $nuevo_cirugia_paciente_m . "' , 0, " . $nuevo_cirugia_esteril . ", '', " . $thisyear . ", '', NOW(),  " . $id_usuario . ")";
            $nuevo_cirugia_id = ExecuteSQL_ReturnID($query);
            
            if($prepago == "1"){
					$query_pp = "INSERT INTO cirugia_prepago (id_cirugia, orden_pago, url_archivo) VALUES (".$nuevo_cirugia_id.", '".$nuevo_cirugia_orden_pago."','".$nuevo_cirugia_file_name."' )";
					ExecuteSQL($query_pp); 	 
				}

        } else {
            $query = "UPDATE cirugia SET 
						id_vendedor = " . $nuevo_cirugia_vendedor . ", 
						id_tecnico = " . $nuevo_cirugia_tecnico . ", 
						id_tecnico2 = " . $nuevo_cirugia_tecnico_2 . ", 
						id_medico = " . $nuevo_cirugia_medico . ", 
						id_hospital = " . $nuevo_cirugia_hospital . ", 
						id_estado = " . $nuevo_cirugia_estado . ", 
						municipio = '" . $nuevo_cirugia_ciudad . "', 
						fecha_cirugia = '" . $fecha . "', 
						minialmacen = '" . $minialmacen_string . "',  
						equipo_poder = '" . $equipopoder_string . "', 
						adicionales = '" . $adicionales_string . "',  
						consumibles = '" . $consumibles_string . "', 
						notas = '" . $notas . "',  
						paciente = '" . $nuevo_cirugia_paciente . "',
						paciente_p = '" . $nuevo_cirugia_paciente_p . "',
						paciente_m = '" . $nuevo_cirugia_paciente_m . "',
						esteril = '" . $nuevo_cirugia_esteril . "',
						kardex = NOW(), id_usuario_kardex = " . $id_usuario . " 
					WHERE id_cirugia = " . $nuevo_cirugia_id;
            ExecuteSQL($query);

            if($prepago == "1"){ 
			
				$query_x = "SELECT COUNT(id_prepago) AS existe, orden_pago, url_archivo FROM cirugia_prepago WHERE id_cirugia = ".$nuevo_cirugia_id; 
				$existe = GetValueSQL($query_x,"existe");  
				if($existe > 0){
					$query_pp = "UPDATE cirugia_prepago SET 
						orden_pago = '".$nuevo_cirugia_orden_pago."' , 
						url_archivo = '".$nuevo_cirugia_file_name."' 
						WHERE id_cirugia = ".$nuevo_cirugia_id; 
				}else{
					$query_pp = "INSERT INTO cirugia_prepago (id_cirugia, orden_pago, url_archivo) VALUES (".$nuevo_cirugia_id.", '".$nuevo_cirugia_orden_pago."','".$nuevo_cirugia_file_name."' )";
					ExecuteSQL($query_pp); 	 
				}				
			}
        }

        $query_alerta = "INSERT INTO alerta (fecha, titulo, texto, url, estatus) 
                            VALUES (NOW(), 'Nueva cirugia solicitada ".$nuevo_cirugia_id."', 'Se ha solicitado una nueva cirugia con ID: ".$nuevo_cirugia_id." ', 
                            'editar_cirugia.php?id_cirugia=".$nuevo_cirugia_id."', 1)";
        ExecuteSQL($query_alerta); 
                    
        return[
            'result' => "ok",
            'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP',
            'metodo' => "EXOSAPP.PHP",
            'nuevo_cirugia_hospital' => $nuevo_cirugia_hospital,
            'nuevo_cirugia_id' => $nuevo_cirugia_id,
            'nuevo_cirugia_codigo' => $codigo_de_cirugia,            
            'get_cirugia_report' => $this->get_cirugia_report($nuevo_cirugia_id)
        ];
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

        // Get Prepago
        $sSQL_pre = "select url_archivo from cirugia_prepago where id_cirugia=" .  $id_cirugia;
        $pre_result = DatasetSQL($sSQL_pre);
        $url_prepago = "";
        while ($row_pre = mysqli_fetch_array($pre_result)) {
            $url_prepago = $url_prepago . $row_pre["url_archivo"] .";";
        }
        

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
            "prepago_url" => $url_prepago,         
            'sql' => $this->is_debuging ? $query : ""
        ];
        return $data;
    }
    public function buscar_cirugia(){        
        $id_usuario  = Requesting("id_usuario"); 
        $estatus  = Requesting("estatus");
        $filtrar_fecha = Requesting("filtrar_fecha");
        $fecha_inicial  = $this->SQLDate(Requesting('fecha_inicial'));
        $fecha_final  = $this->SQLDate(Requesting('fecha_final'));
        $vendedor  = Requesting('vendedor');
        $tecnico  = Requesting('tecnico');        
        $subdistribuidor  = Requesting('subdistribuidor');
        $codigo_cirugia   = Requesting('codigo_cirugia');
        $limite  = Requesting('limite');
        $limite = (($limite == '' ) || ($limite=='0')?10:$limite);
        $orderby = Requesting('orderby');

        if ( ($orderby =='')  || ($orderby =='codigo_newest'))
            $orderby = "codigo desc";
        else if ( ($orderby =='codigo_oldest'))
            $orderby = "codigo desc";
        else if ( ($orderby =='fecha_newest'))
            $orderby = "fecha_cirugia desc";
        else
            $orderby = "fecha_cirugia";

        if (!$id_usuario) {
            return $this->DatosIncorrectos();
        }         

        $query = "SELECT c.id_cirugia
                FROM `cirugia` c                     
                WHERE 1=1" 
                . ( $filtrar_fecha=="1" ? 
                     " and fecha_cirugia >= '$fecha_inicial' and fecha_cirugia <= '$fecha_final'"
                    : "")                
                . ($vendedor ? " and id_vendedor=" . $vendedor : "")
                . ($tecnico ? " and (id_tecnico1=$tecnico or id_tecnico2=$tecnico)":"")
                . ($subdistribuidor ? " and id_subdistribuidor=" . $subdistribuidor : "")
                . ($codigo_cirugia ? " and c.codigo='" . $codigo_cirugia ."'" : "")                
                . ($estatus >=0 ? " and estatus=" .  $estatus : "")
                . " order by $orderby"
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
    public function piezas_danadas_reporte_estatus(){        
        $show_todos  = Requesting("show_todas");
        if ($show_todos == "")
            $show_todos  = "1";    
        
        $query = "SELECT * from pieza_danada_reporte_estatus ORDER BY estatus";
        $qresult = DatasetSQL($query);
        
        
        $data = [];    
        if ($show_todos=="1"){
            $data['item_0' ] = [
                'id_estatus' => "0",
                'estatus' => "TODOS",
                'color' => "#FFFFFF"
            ];
        }    

        while ($row = mysqli_fetch_array($qresult)) {
            // Usamos el prefijo 'item_' para que el XML sea válido y el frontend lo reconozca como lista
            $data['item_' . $row['id_estatus']] = [
                'id_estatus' => $row['id_estatus'],
                'estatus' => $row['estatus'],
                'color' => $row['color']
            ];
        }

        $data_count = count($data) + ($show_todos?1:0);

        return ( ['result' => 'ok',
                'result_text' => 'ejecutado desde ExosAPP',
                'data_count' => $data_count,
                'data'=> $data,            
                ] );

    }
}
?>
