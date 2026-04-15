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

require_once "include/functions.php";
require_once "include/db_tools.php";
require_once "lib/nusoap.php";
require_once "dompdf/autoload.inc.php";
require_once "include/functions_ws.php";



date_default_timezone_set('America/Mexico_City');

@session_start();

/**

 * Clase para la funcionalidad real de la aplicación

 */

class ExosApp_WS { 



    /**

     * Verifica si un método existe en esta clase

     * @param string $method_name Nombre del método a buscar

     * @return boolean

     */

    public function Implemented($method_name) {

        return method_exists($this, $method_name);

    }



    /**

     * Ejemplo de implementación

     * Aquí procesarías los datos recibidos por $_POST o $_REQUEST

     */

    public function metodo_ejemplo() {

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
	
	
    public function get_terminales_list() {
     
		
		$id_usuario = Requesting("id_usuario");
		$id_almacen = Requesting("id_almacen");

		$data = [];
		
		if (!$id_usuario OR !$id_almacen) {
            return ['result' => 'error', 'result_text' => 'USUARIO y ALMACEN son necesarios'];
        }else{			
			$query = "SELECT id_terminal, terminal FROM terminal WHERE id_bodega = ".$id_almacen;
			$qresult = DatasetSQL($query); 
			while ($row = mysqli_fetch_array($qresult)){
            	// Usamos el prefijo 'item_' para que el XML sea válido y el frontend lo reconozca como lista
            	$data['item_' . $row['id_terminal']] = [
					'id_terminal' => $row['id_terminal'],
					'nombre'      => $row['terminal'],
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
	
	 
	 public function get_almacenes_list(){
   
		
        $id_usuario = Requesting("id_usuario");

        $data = [];
		
		if (!$id_usuario) {

            return ['result' => 'error', 'result_text' => 'USUARIO y ALMACEN son necesarios'];

        }else{
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
        }else{			
			
			$limit = !Requesting("limit") ? 10 : Requesting("limit");
			
			// Query original solicitado para la lista de pickeo
			//	$query = "SELECT p.id_producto, p.nombre, p.referencia, p.codigo_1, m.marca, f.fabricante, 
			//					p.id_producto as cantidad_solicitada, 0 as cantidad_recolectada, now() as last_update
			//			FROM producto p 
			//			LEFT JOIN marca m ON p.id_marca=m.id_marca
			//			LEFT JOIN fabricante f ON m.id_fabricante=f.id_fabricante
			//			LIMIT " . $limit;
	
			/* ************************************************************ */
			/* *** De aqui tengo que enviar la info de la tabla fragmento *** */
			
			$query = "SELECT p.id_producto, p.nombre, p.referencia, p.codigo_1, m.marca, f.fabricante, 
							ri.cantidad as cantidad_solicitada, 0 as cantidad_recolectada, now() as last_update
					FROM fragmento fr 
					INNER JOIN remision_inv ri ON (ri.id_remision_inv = fr.id_remision_inv )
					INNER JOIN inventario iv ON (iv.id_inventario = ri.id_inventario)
					INNER JOIN producto p ON (p.id_producto = iv.id_producto)
					LEFT JOIN marca m ON p.id_marca=m.id_marca
					LEFT JOIN fabricante f ON m.id_fabricante=f.id_fabricante 
					WHERE fr.reposicion = 0 AND fr.id_terminal = ".$id_terminal."
					LIMIT " . $limit;	
					
			//	echo $query;
			 
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
		}
 
        return [
 
				'result' 		=> 'ok',
				'data' 			=> $data,
				'result_text' 	=> 'Metodo ejecutado exitosamente en EXOSAPP.PHP'

			];
    }
	
	
	   public function pickeo_checkout()
    {

        $id_terminal = Requesting("id_terminal");
        $id_usuario = Requesting("id_usuario");
        $datos_pickeo = Requesting("datos_pickeo"); // JSON enviado desde la App

        if (!$id_usuario || !$datos_pickeo || !$id_terminal) {
            return ['result' => 'error', 'result_text' => 'DATOS REQUERIDOS'];
        }

        $sSQL = "insert into pickeo_list(id, id_usuario, id_terminal, data) " .
            " values (0," . $id_usuario . "," . $id_terminal . ",'" . $datos_pickeo . "')";
        ExecuteSQL_WS($sSQL);

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
        }else{
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
 
				'result' 		=> 'ok',
				'data' 			=> $data,
				'result_text' 	=> 'Metodo ejecutado exitosamente en EXOSAPP.PHP'

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
 
				'result' 		=> 'ok',
				'data' 			=> $data,
				'result_text' 	=> 'Metodo ejecutado exitosamente en EXOSAPP.PHP'

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
 
				'result' 		=> 'ok',
				'data' 			=> $data,
				'result_text' 	=> 'Metodo ejecutado exitosamente en EXOSAPP.PHP'

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
 
				'result' 		=> 'ok',
				'data' 			=> $data,
				'result_text' 	=> 'Metodo ejecutado exitosamente en EXOSAPP.PHP'

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
 
				'result' 		=> 'ok',
				'data' 			=> $data,
				'result_text' 	=> 'Metodo ejecutado exitosamente en EXOSAPP.PHP'

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
 
				'result' 		=> 'ok',
				'data' 			=> $data,
				'result_text' 	=> 'Metodo ejecutado exitosamente en EXOSAPP.PHP'

			];
    }
	
	
    public function get_vendedores()
    {
        $id_usuario = Requesting("id_usuario");
        $first_row 	= Requesting("first_row");

        if (!$id_usuario) {
            return $this->DatosIncorrectos();
        }

        $query = "SELECT case when id_usuario=" . $id_usuario . " then 0 else 1 end as yo_primero, id_usuario, id_vendedor, upper(nombre) as nombre, programar 
			FROM vendedor 
			WHERE activo = 1 ORDER BY yo_primero, nombre";
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
                'programar' => $row['programar'],
            ];
        }
        return [
 
				'result' 		=> 'ok',
				'data' 			=> $data,
				'result_text' 	=> 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
 
			]; 
    }
	
	    public function get_tecnicos()
    {
       
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
		
         return [
 
				'result' 		=> 'ok',
				'data' 			=> $data,
				'result_text' 	=> 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
 
			]; 
    }
	
	
	
	public function get_hospitales()
    {
        
        $id_almacen = Requesting("id_almacen");

        if (!$id_almacen){
            return ['result' => 'error', 'result_text' => 'DATOS REQUERIDOS'];

		}else{
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
			return [
 
				'result' 		=> 'ok',
				'data' 			=> $data,
				'result_text' 	=> 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
 
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
 
				'result' 		=> 'ok',
				'data' 			=> $data,
				'result_text' 	=> 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
 
			]; 
    }

    public function get_medicos_list()
    {
       
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

        return [
 
				'result' 		=> 'ok',
				'data' 			=> $data,
				'result_text' 	=> 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
 
			]; 
    }


	/* ********* EXCLUSVIO DE LA APP ************ */
    public function save_profile()
    {
		 // if IMPLEMENTED
        if ($this->implemented && $this->result != null) {
            $this->sendResponse($this->result);
            return;
        }
        // ELSE USE NEXT MOCKUP    
		
        $id_usuario_app 	= Requesting("id_usuario_app");
        $tema 				= Requesting("tema");
        $app_language 		= Requesting("app_language");
        $menu_favorites 	= Requesting("menu_favorites");

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
        
		//	echo ":::uno:::";
		//	
        //	//	$query1 ="SELECT case when id_subdistribuidor=6 then concat(subdistribuidor,upper('-" . $nuevo_cirugia_subdistribuidor_txt . "')) else subdistribuidor end as subdistribuidor_name "
        //	//	        . " FROM subdistribuidor where id_subdistribuidor=".$nuevo_cirugia_subdistribuidor;
		//	
		//	echo $query1;
		//	
		//	$subdistribuidor = GetValueSQL($query1,"subdistribuidor_name");
        
		$notas = $nuevo_cirugia_notas;

        $resultStatus 	= "ok"; 
	    $resultText 	= "Correcto.";

       //	 echo ":::dos:::";

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
					'".$nuevo_cirugia_subdistribuidor_txt."', '".$minialmacen_string."', '".$equipopoder_string."', '".$adicionales_string."','".$consumibles_string."','".$notas."', 5, 
					'".$nuevo_cirugia_paciente."' ,'".$nuevo_cirugia_paciente_p."' ,'".$nuevo_cirugia_paciente_m."' , 0, ".$nuevo_cirugia_esteril.", '', ".$thisyear.", '', NOW(),  ".$id_usuario.")";
				$nuevo_cirugia_id = ExecuteSQL_ReturnID($query);
				//	$nuevo_cirugia_id = -1; //ExecuteSQL_ReturnID($query);
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
                        'metodo' 	=> "EXOSAPP.PHP",    
                        'nuevo_cirugia_hospital' 	=> $nuevo_cirugia_hospital,    
                        'nuevo_cirugia_id' 	=> $nuevo_cirugia_id,    
                        'result' 			=> $resultStatus,  
                        'result_text' 		=> $resultText,
                        'sql'               => $query
	                 );	
        return ($this->result);	
		
	
			
			
    }


}

?>
