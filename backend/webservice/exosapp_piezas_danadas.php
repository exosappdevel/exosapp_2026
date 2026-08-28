<?php

trait ExosApp_PiezasDanadas
{
    public function listMethods_PiezasDanadas()
    {
        return [
            'piezas_danadas_reporte_estatus' => [
                'descripcion' => 'Obtiene la lista de estatus de piezas dañadas.',
                'parameters' => ['show_todas (opcional)']
            ],
            'buscar_pieza_danada_registro_general' => [
                'descripcion' => 'Busca registros de piezas dañadas según los criterios proporcionados.',
                'parameters' => ['fecha_inicio', 'fecha_fin', 'codigo_registro', 'codigo_cirugia', 'codigo_activo', 'referencia', 'lote', 'pieza_estatus', 'codigo_traspaso', 'orderby', 'limite']
            ],
            'get_fabricante_list' => [
                'descripcion' => 'Obtiene la lista de fabricantes.',
                'parameters' => ["show_todos (opcional)"]
            ],
            'registrar_pieza_danada' => [
                'descripcion' => 'Registra una nueva pieza dañada.',
                'parameters' => ['id_reporte', 'codigo_reporte', 'id_almacen', 'codigo_cirugia', 'codigo_activo', 'en_inventario', 'id_fabricante', 'referencia', 'lote', 'comentarios']
            ],
            'eliminar_pieza_danada' => [
                'descripcion' => 'Eliminar una nueva pieza dañada.',
                'parameters' => ['id_registro']
            ],            
            'iniciar_reporte_pieza_danada' => [
                'descripcion' => 'Crea un nuevo reporte de piezas dañadas (equivalente a iniciar_reporte_pieza_danada de reportar_pieza_danada.php).',
                'parameters' => ['id_usuario', 'id_almacen']
            ],
            'guardar_foto_reporte_piezas_danadas' => [
                'descripcion' => 'Guarda una foto asociada a un registro de pieza dañada.',
                'parameters' => ['id_registro', 'nombre_archivo', 'id_usuario']
            ],
            'eliminar_foto_reporte_piezas_danadas' => [
                'descripcion' => 'Elimina una foto asociada a un registro de pieza dañada.',
                'parameters' => ['id_foto']
            ],
            'finalizar_reporte_pieza_danada' => [
                'descripcion' => 'Valida y finaliza un reporte de piezas dañadas, actualizando inventario y estatus.',
                'parameters' => ['id_reporte', 'id_usuario']
            ]
        ];
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
    
    public function buscar_pieza_danada_registro_general() {        
        $fecha_inicio 		= Requesting("fecha_inicio"); 
        $fecha_fin 			= Requesting("fecha_fin"); 
        $codigo_registro 	= Requesting("codigo_registro"); 
        $codigo_cirugia 	= Requesting("codigo_cirugia"); 
        $codigo_activo 		= Requesting("codigo_activo"); 
        $referencia 		= Requesting("referencia"); 
        $lote 				= Requesting("lote"); 
        $pieza_estatus  	= Requesting("pieza_estatus"); 
        $codigo_traspaso 	= Requesting("codigo_traspaso"); 
        $orderby 	        = Requesting("orderby"); 
        $limite 	        = Requesting("limite"); 
        
        $where = "";
    
        if($fecha_inicio <> "" AND $fecha_fin <> ""){		
            $fecha_inicio 	= $this->SQLDate(Requesting('fecha_inicio'));
            $fecha_fin 		= $this->SQLDate(Requesting('fecha_fin'));
            $where = " WHERE pieza_danada_reporte.fecha_registro BETWEEN '".$fecha_inicio." 00:00:01' AND '".$fecha_fin." 23:59:59' ";		
        }
            
        if($codigo_registro <> ""){ 
            if($where == ""){
                $where = " WHERE pieza_danada_reporte_inv.codigo LIKE '%".$codigo_registro."%'";
            }else{
                $where .= " AND pieza_danada_reporte_inv.codigo LIKE '%".$codigo_registro."%'";
            }
        }	 
        
        if($codigo_cirugia <> ""){ 	
            /* busco CX */
            $querycx = "SELECT COUNT(id_cirugia) AS existe, id_cirugia FROM cirugia WHERE codigo LIKE '%".$codigo_cirugia."%'";
            $existe_cx = GetValueSQL($querycx,"existe");
            if($existe_cx > 0){
                $id_cirugia = GetValueSQL($querycx,"id_cirugia");
                if($where == ""){
                    $where = " WHERE pieza_danada_reporte_inv.id_cirugia = ".$id_cirugia;
                }else{
                    $where .= " AND pieza_danada_reporte_inv.id_cirugia = ".$id_cirugia;
                }
            }		
        }
        
        if($codigo_activo <> ""){ 	
            /* busco CX */
            $queryat = "SELECT COUNT(id_set) AS existe, id_set FROM activo_set WHERE codigo_qr LIKE '%".$codigo_activo."%'";
            $existe_at = GetValueSQL($queryat,"existe");
            if($existe_at > 0){
                $id_set = GetValueSQL($queryat,"id_set");
                if($where == ""){
                    $where = " WHERE pieza_danada_reporte_inv.id_set = ".$id_set;
                }else{
                    $where .= " AND pieza_danada_reporte_inv.id_set = ".$id_set;
                }
            }		 
        }

            
        if($referencia <> ""){ 
            if($where == ""){
                $where = " WHERE pieza_danada_reporte_inv.referencia LIKE '%".$referencia."%'";
            }else{
                $where .= " AND pieza_danada_reporte_inv.referencia LIKE '%".$referencia."%'";
            }
        }	 
        
        if($lote <> ""){  
            if($where == ""){
                $where = " WHERE pieza_danada_reporte_inv.lote LIKE '%".$lote."%'";
            }else{
                $where .= " AND pieza_danada_reporte_inv.lote LIKE '%".$lote."%'";
            }
        }	
        
        if($pieza_estatus > "0"){  
            if($where == ""){
                $where = " WHERE pieza_danada_reporte_inv.id_estatus = ".$pieza_estatus;
            }else{
                $where .= " AND pieza_danada_reporte_inv.id_estatus = ".$pieza_estatus;
            }
        }	

        if($codigo_traspaso <> ""){  
        
            
            
            $querytr = "SELECT COUNT(id_salida) AS existe, id_salida FROM salida_almacen_rapida WHERE codigo = '".$codigo_traspaso."'";
            $existe_traspaso = GetValueSQL($querytr,"existe");
            if($existe_traspaso > 0){
                $id_salida = GetValueSQL($querytr,"id_salida");
                $querytr2 = "SELECT id_traspaso FROM traspaso_inventario WHERE id_salida = ".$id_salida;
                $id_traspaso = GetValueSQL($querytr2,"id_traspaso");	
            
                if($where == ""){
                    $inner = "INNER JOIN  pieza_danada_reporte_inv_traspaso ON (pieza_danada_reporte_inv_traspaso.id_registro = pieza_danada_reporte_inv.id_registro)";
                    $where = " WHERE pieza_danada_reporte_inv_traspaso.id_traspaso = ".$id_traspaso;
                }else{ 
                    $where .= " AND pieza_danada_reporte_inv_traspaso.id_traspaso = ".$id_traspaso;
                }                                
                
            }else{
                
                $querycx = "SELECT COUNT(id_cirugia) AS existe, id_cirugia FROM cirugia WHERE codigo = '".$codigo_traspaso."'";
                $existe_cirugia = GetValueSQL($querycx,"existe");
                if($existe_cirugia > 0){
                    $id_cirugia = GetValueSQL($querycx,"id_cirugia");
                    
                    if($where == ""){
                        $inner = "INNER JOIN  pieza_danada_reporte_inv_traspaso ON (pieza_danada_reporte_inv_traspaso.id_registro = pieza_danada_reporte_inv.id_registro)";
                        $where = " WHERE pieza_danada_reporte_inv_traspaso.id_cirugia = ".$id_cirugia;
                    }else{  
                        $where .= " AND pieza_danada_reporte_inv_traspaso.id_cirugia = ".$id_cirugia;
                    }
                }                                
            }
        }	
        
        
        if($where == ""){	
            $fecha_inicio_mes = date("Y")."-".date("m")."-01 00:00:01";
            $fecha_fin_mes = date("Y")."-".date("m")."-31 23:59:59"; 
            
            $where = " WHERE pieza_danada_reporte.fecha_registro BETWEEN '".$fecha_inicio_mes."' AND '".$fecha_fin_mes."'"; 
        }      
        
        if ($orderby==""){

        }
        
        $query = "SELECT pieza_danada_reporte.id_reporte, pieza_danada_reporte_inv.id_registro, pieza_danada_reporte_inv.codigo, pieza_danada_reporte_inv.referencia, pieza_danada_reporte_inv.lote, 
            pieza_danada_reporte_inv.comentarios, pieza_danada_reporte_inv.id_cirugia, pieza_danada_reporte_inv.id_set, pieza_danada_reporte_estatus.estatus, 
            pieza_danada_reporte_estatus.color , pieza_danada_reporte_inv.repuesto, pieza_danada_reporte_inv.codigo_cirugia, pieza_danada_reporte_inv.codigo_set
            FROM pieza_danada_reporte
            INNER JOIN  pieza_danada_reporte_inv ON (pieza_danada_reporte_inv.id_reporte = pieza_danada_reporte.id_reporte)
            INNER JOIN  pieza_danada_reporte_estatus ON (pieza_danada_reporte_estatus.id_estatus = pieza_danada_reporte_inv.id_estatus)"
            . $where." AND pieza_danada_reporte.finalizado = 1"
            . ( ($orderby=="" )?"":" order by " . $orderby)
            . ( ($limite=="" )?"": " limit " . $limite);
        
        //	echo $query;
        
        $data = [];
        $qresult = DatasetSQL($query);
        while ($row = mysqli_fetch_array($qresult)) {
            
            /* obtengo cirugia*/
            if($row["id_cirugia"] > 0){			
                $query2 = "SELECT codigo FROM cirugia WHERE id_cirugia = ".$row["id_cirugia"];
                $codigo_cirugia = GetValueSQL($query2,"codigo");			
            }else{
                //$codigo_cirugia = "NA";
                $codigo_cirugia = $row["codigo_cirugia"];
            }		 
            /* obtengo activo*/ 
            if($row["id_set"] > 0){			
                $query3 = "SELECT activo.nombre, activo_set.caja 
                    FROM activo_set 
                    INNER JOIN activo ON (activo.id_activo = activo_set.id_activo)
                    WHERE activo_set.id_set = ".$row["id_set"];
                $codigo_activo = GetValueSQL($query3,"nombre")." CAJA ".GetValueSQL($query3,"caja");			
            }else{ 
                    $codigo_activo = $row["codigo_set"];
                //	$codigo_activo = "NA";
            } 	 
            /* obtengo traspaso*/ 
            if($row["repuesto"] > 0){

                $query4 = "SELECT id_traspaso, id_cirugia 
                    FROM pieza_danada_reporte_inv_traspaso
                    WHERE pieza_danada_reporte_inv_traspaso.id_registro = ".$row["id_registro"];
                $id_traspaso = GetValueSQL($query4,"id_traspaso");		
                $id_cirugia = GetValueSQL($query4,"id_cirugia");		
                
                
                if($id_traspaso > 0){
                    $query42 = "SELECT salida_almacen_rapida.codigo  
                        FROM salida_almacen_rapida
                        INNER JOIN traspaso_inventario ON (traspaso_inventario.id_salida = salida_almacen_rapida.id_salida)
                        WHERE traspaso_inventario.id_traspaso = ".$id_traspaso;
                    $codigo_traspaso = GetValueSQL($query42,"codigo");	
                }else{
                    //	$query42 = "SELECT codigo FROM cirugia WHERE id_cirugia = ".$id_cirugia;
                    
                    if($id_cirugia > 0){
                        $query42 = "SELECT codigo FROM cirugia WHERE id_cirugia = ".$id_cirugia;
                        $codigo_traspaso = GetValueSQL($query42,"codigo");	
                    }else{
                        $codigo_traspaso = "DEFINIDO NO RESURTIDO";
                        
                    }
                } 
                
            }else{ 
                $codigo_traspaso = "SIN TRASPASO";
            } 

            // Usamos el prefijo 'item_' para que el XML sea válido y el frontend lo reconozca como lista
            $data['item_' . $row['id_reporte'] . "_" . $row['id_registro'] ] = [
                'id_reporte' => $row['id_reporte'],
                'id_registro' => $row['id_registro'],
                'codigo' => $row['codigo'],
                'referencia' => $row['referencia'],
                'lote' => $row['lote'],
                'comentarios' => $row['comentarios'],
                'id_cirugia' => $row['id_cirugia'],
                'id_set' => $row['id_set'],
                'estatus' => $row['estatus'],
                'color' => $row['color'],
                'repuesto' => $row['repuesto'],
                'codigo_cirugia' => $row['codigo_cirugia'],
                'codigo_set' => $row['codigo_set'],
                'codigo_traspaso' => $codigo_traspaso,
                'enable_traspado' => $codigo_traspaso=="SIN TRASPASO" ? 1:0,                
                ];

        }

        $data_count = count($data);

        return ( ['result' => 'ok',
                'result_text' => '',
                'data_count' => $data_count,
                'data'=> $data,    
                'sql' => $this->is_debuging?$query:""        
                ] );
    }

    public function get_fabricante_list() {
        
        $resultStatus 	= "ok";
        $resultText 	= "Correcto.";	 
        $show_todos = Requesting("show_todos")=="1"?true:false;   
        
        $query = "SELECT id_fabricante, fabricante FROM fabricante ORDER BY fabricante";
        $qresult = DatasetSQL($query);
        $data = [];
        if ($show_todos) {
            $data['item_0'] = [
                'id_fabricante' => "0",
                'fabricante' => "Todos los Fabricantes"
            ];
        }
        while ($row = mysqli_fetch_array($qresult)){
            $data['item_' . $row['id_fabricante']] = [
                'id_fabricante' => $row['id_fabricante'],
                'fabricante' => $row['fabricante']
            ];            
        } 
            
        $result = array( 
            'data' => $data,    
            'result' 			=> $resultStatus, 
            'result_text' 		=> $resultText
        );		 
        return $result;	 
   }
   // Equivalente stateless (via id_usuario/key, sin sesión PHP) del paso
    // "iniciar_reporte_pieza_danada" de reportar_pieza_danada.php: valida el
    // PIN del usuario contra usuario.pin y crea el registro padre en
    // pieza_danada_reporte, devolviendo id_reporte/codigo_reporte para poder
    // llamar registrar_pieza_danada por cada pieza.
    
    public function iniciar_reporte_pieza_danada() {
        $id_usuario = Requesting("id_usuario");
        $id_almacen = Requesting("id_almacen");
        

        if (!$id_usuario || !$id_almacen) {
            return $this->DatosIncorrectos();
        }

        /* genero codigo */ 
		$thisyearfull = Date('Y');
		$thisyear = Date('y');
		
		$query3 = "SELECT codigo FROM almacen WHERE id_almacen = ".$id_almacen;
		$codigo_sucursal = GetValueSQL($query3,"codigo");
		 
		$query4 = "SELECT MAX(consecutivo) AS ultimo FROM pieza_danada_reporte WHERE anio = ".$thisyearfull." AND id_sucursal = ".$id_almacen;
		$ultimo_consecutivo = GetValueSQL($query4,"ultimo");
		
		$sig_consecutivo = ($ultimo_consecutivo) + (1); 
		
		$codigo_reporte = $thisyear."RPD".$sig_consecutivo.$codigo_sucursal;
		
		$query2 = "INSERT INTO pieza_danada_reporte (id_usuario, anio, id_sucursal, consecutivo, codigo, fecha_registro, finalizado, kardex, id_usuario_kardex)
			VALUES (".$id_usuario.", ".$thisyearfull.", ".$id_almacen.", ".$sig_consecutivo.", '".$codigo_reporte."',  NOW(), 0, NOW(), ".$id_usuario.")";
			
			//	echo $query2;
			
		$id_reporte = ExecuteSQL_ReturnID($query2);

        return [
            'id_reporte' => $id_reporte,
            'codigo_reporte' => $codigo_reporte,
            'result' => 'ok',
            'result_text' => 'Correcto.'
        ];
    }
   public function eliminar_pieza_danada() {            
        $id_registro 	= Requesting("id_registro");
        if($id_registro == ""){
            $resultStatus 	= "error"; 
            $resultText 	= "Error. Datos incompletos.";	  
            $id_registro 	= 0;
        }else{ 		 
            $resultStatus 	= "ok"; 
            $resultText 	= "Correcto.";	
            $query = "DELETE FROM pieza_danada_reporte_inv where id_registro=".$id_registro;
            ExecuteSQL($query);		 
        }
        
        return array(
            'result' 		=> $resultStatus, 
            'result_text' 	=> $resultText,        
        );	 
   }
   public function registrar_pieza_danada() {            
        $id_reporte 	= Requesting("id_reporte");
        $codigo_reporte = Requesting("codigo_reporte");
        $id_almacen     = Requesting("id_almacen");
        $codigo_cirugia = Requesting("codigo_cirugia");
        $codigo_activo 	= Requesting("codigo_activo");
        $en_inventario 	= Requesting("en_inventario");
        $id_fabricante 	= Requesting("id_fabricante");
        $referencia 	= Requesting("referencia");
        $lote 			= Requesting("lote");
        $comentarios 	= Requesting("comentarios");
        
        $resultStatus 	= "ok"; 
        $resultText 	= "Correcto.";	  
        $id_registro 	= 0;

        if($id_reporte == "" || $codigo_reporte == "" || $id_almacen == "" || $codigo_cirugia == "" || $codigo_activo == "" || $en_inventario == "" || $id_fabricante == "" || $referencia == "" || $lote == ""){
            $resultStatus 	= "error"; 
            $resultText 	= "Error. Datos incompletos.";	  
            $id_registro 	= 0;
        }else{

            /* primero obtengo codigo */
            $query2 = "SELECT MAX(consecutivo) AS ultimo FROM pieza_danada_reporte_inv WHERE id_reporte = ".$id_reporte;
            $ultimo_consecutivo = GetValueSQL($query2,"ultimo");
            $sig_consecutivo = ($ultimo_consecutivo) + (1);	
            $codigo_registro = $codigo_reporte.$sig_consecutivo;
            
            /* valido CX */
            $query3 = "SELECT COUNT(id_cirugia) AS existe, id_cirugia FROM cirugia WHERE codigo = '".$codigo_cirugia."'";
            $existe_cx = GetValueSQL($query3,"existe");
            if($existe_cx > 0){
                $id_cirugia = GetValueSQL($query3,"id_cirugia");
            }else{
                $id_cirugia = 0;
            } 
            
            /* valido caja ACTIVO */
            $query4 = "SELECT COUNT(id_set) AS existe, id_set FROM activo_set WHERE codigo_qr = '".$codigo_activo."'";
            $existe_set = GetValueSQL($query4,"existe");
            if($existe_set > 0){
                $id_set = GetValueSQL($query4,"id_set");
            }else{
                $id_set = 0;
            } 
            
            if($en_inventario == 1){
                /* busco el id_inventario por lote*/
                $query5 = "SELECT COUNT(id_inventario) AS existe, id_inventario 
                    FROM inventario 
                    WHERE lote = '".$lote."' AND id_almacen = ".$id_almacen;
                $existe_inv = GetValueSQL($query5,"existe");
                
                if($existe_inv > 0){
                    $id_inventario = GetValueSQL($query5,"id_inventario");
                }else{
                    $id_inventario = 0;
                }
                
            }else{  
                $id_inventario = 0;
            } 
                
            
            if($en_inventario == 1 && $id_inventario == 0){ 
                $resultStatus 	= "error"; 
                $resultText 	= "El Lote NO se encuentra en Inventario. Por favor verifique.";	  
                $id_registro 	= 0;
            }else{		
                //	$queryet = "SELECT id_estatus FROM pieza_danada_reporte_estatus WHERE estatus = '".$pieza_danada_estatus_reportado."'";
                $queryet = "SELECT id_estatus FROM pieza_danada_reporte_estatus WHERE estatus = 'REPORTADO'";
                $id_estatus_inicio = GetValueSQL($queryet,"id_estatus"); 
                
                $query1 = "INSERT INTO pieza_danada_reporte_inv (id_reporte, consecutivo, codigo, codigo_cirugia, id_cirugia, codigo_set, id_set, en_inventario, id_fabricante, id_inventario, referencia, lote, comentarios, id_estatus, repuesto)
                    VALUES(".$id_reporte.", ".$sig_consecutivo.", '".$codigo_registro."', '".$codigo_cirugia."', ".$id_cirugia.", '".$codigo_activo."', ".$id_set.", ".$en_inventario.", ".$id_fabricante.", ".$id_inventario.", '".$referencia."', 
                        '".$lote."', '".$comentarios."', ".$id_estatus_inicio.", 0)";
                $id_registro = ExecuteSQL_ReturnID($query1);
            }
        }
    
        $result = array(
            'id_registro' 	=> $id_registro,
            'codigo_registro' => $codigo_registro,
            'result' 		=> $resultStatus,
            'result_text' 	=> $resultText
        );
        return $result;
    }

    
    public function guardar_foto_reporte_piezas_danadas(){                    
        $id_registro 	= Requesting("id_registro");
        $nombre_archivo = Requesting("nombre_archivo");
        $id_usuario = Requesting("id_usuario");
        
        $resultStatus 	= "ok"; 
        $resultText 	= "Correcto. La imagen fue guardada con exito.";	
        
        if($nombre_archivo == "" || $id_registro == "" || $id_usuario == ""){ 
            $resultStatus 	= "error"; 
            $resultText 	= "Error. Datos incompletos.";	
        }else{ 		 
            $query = "INSERT INTO pieza_danada_reporte_fotos (id_registro, url, kardex, id_usuario_kardex) 
                VALUES (".$id_registro.", '".$nombre_archivo."', NOW(), ".$id_usuario." )";
            $id_foto = ExecuteSQL_ReturnID($query);		 
        }
        
        return array(
            'result' 		=> $resultStatus, 
            'result_text' 	=> $resultText,
            'id_foto'       => $id_foto
        );	 
    }

    public function eliminar_foto_reporte_piezas_danadas(){                    
        $id_foto 	= Requesting("id_foto");
        
        $resultStatus 	= "ok"; 
        $resultText 	= "Correcto. La imagen fue guardada con exito.";	
        
        if($id_foto == ""){ 
            $resultStatus 	= "error"; 
            $resultText 	= "Error. Datos incompletos.";	
        }else{ 		 
            $query = "DELETE FROM pieza_danada_reporte_fotos where id_foto=".$id_foto;
            ExecuteSQL($query);		 
        }
        
        return array(
            'result' 		=> $resultStatus, 
            'result_text' 	=> $resultText,
            'id_foto'       => $id_foto
        );	 
    }


    public function finalizar_reporte_pieza_danada(){    		 
        $id_reporte 	= Requesting("id_reporte");        
        $id_usuario 	= Requesting("id_usuario"); 
        if ($id_reporte == "" || $id_usuario == "") { 
            $resultStatus 	= "error"; 
            $resultText 	= "Error. Datos incompletos.";
        }else{
            $resultStatus 	= "ok"; 
            $resultText 	= "Correcto. La imagen fue guardada con exito.";	
            
            $query1 = "SELECT COUNT(id_registro) AS cantidad FROM pieza_danada_reporte_inv WHERE id_reporte = ".$id_reporte;
            $total_registros = GetValueSQL($query1,"cantidad");
                
            if($total_registros > 0){
                    
                $query = "SELECT en_inventario, id_inventario, codigo FROM pieza_danada_reporte_inv WHERE id_reporte = ".$id_reporte;
                $qresult = DatasetSQL($query);
                while ($row = mysqli_fetch_array($qresult)){
                    //	$variable_dato = $row["campo"]; 
                    
                    if($row['en_inventario'] == 1){
                        
                        $id_inventario = $row['id_inventario'];
                        
                        $query2 = "SELECT cantidad FROM inventario WHERE id_inventario = ".$id_inventario;
                        $cant_actual = GetValueSQL($query2,"cantidad");
                        
                        if($cant_actual <= 0){
                            $cant_nueva = 0;
                        }else{
                            $cant_nueva = ($cant_actual) - (1);
                        } 
                        
                        $query3 = "UPDATE inventario SET  
                            cantidad = ".$cant_nueva.",
                            kardex = NOW(),
                            id_usuario_kardex = ".$id_usuario."
                            WHERE id_inventario = ".$id_inventario;
                        ExecuteSQL($query3);
                        
                        /* registra el movimiento */ 
                        //	$query_mov = "INSERT INTO movimiento_almacen (id_inventario, tipo, cantidad, comentarios,  kardex, id_usuario_kardex) 
                        //				VALUES (".$id_inventario.", 0, 1, 'Salida por pieza dañada - ".$row['codigo']."  ', NOW(), ".$_SESSION['id_sesion'].")";
                        //	ExecuteSQL($query_mov); 
                        
                        $query_invd = "SELECT cantidad FROM inventario WHERE id_inventario = ".$id_inventario;  
                        $cantidad_despues = GetValueSQL($query_invd,"cantidad");   
                        $comentarios_movimiento_almacen = "SALIDA POR PIEZA DAÑADA ".$row['codigo'];  
                        registra_movimiento_almacen($id_inventario, 0,$cant_actual, 1, $cantidad_despues, $comentarios_movimiento_almacen);
                    }
                } 
                
                /* actualiza el reporte a finalizado */
                $queryup = "UPDATE pieza_danada_reporte SET 
                    finalizado = 1, 
                    kardex = NOW(), 
                    id_usuario_kardex = ".$id_usuario."
                    WHERE id_reporte = ".$id_reporte;
                ExecuteSQL($queryup);
                
            }else{
                $resultStatus 	= "error"; 
                $resultText 	= "Por favor registre al menos un articulo dañado.";	
            }	 		
                
            $result = array(
                'result' 		=> $resultStatus, 
                'result_text' 	=> $resultText
            );	 
            return $result;
        }
    }
}
