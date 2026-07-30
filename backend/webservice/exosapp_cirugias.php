<?php
use Dompdf\Dompdf; 

trait ExosApp_Cirugias
{
    public function listMethods_Cirugias(){
        return [
            'next_codigo_cirugia' => [
                'descripcion' => 'Obtiene el siguiente código de cirugía para un almacén específico.',
                'parameters' => ['id_almacen']
            ],
            'guardar_cirugia' => [
                'descripcion' => 'Guarda o actualiza la información de una cirugía.',
                'parameters' => ['id_usuario', 'id_almacen', 'tipo', 'nuevo_cirugia_id', 'nuevo_cirugia_fecha', 
                                 'nuevo_cirugia_hora', 'nuevo_cirugia_estado', 'nuevo_cirugia_ciudad', 
                                 'nuevo_cirugia_vendedor', 'nuevo_cirugia_tecnico', 'nuevo_cirugia_tecnico_2',
                                 'nuevo_cirugia_subdistribuidor', 'nuevo_cirugia_subdistribuidor_txt',
                                 'nuevo_cirugia_hospital', 'nuevo_cirugia_medico', 
                                 'minialmacen_string', 'equipopoder_string', 
                                 'adicionales_string', 'consumibles_string',
                                 'nuevo_cirugia_notas','nuevo_cirugia_paciente','nuevo_cirugia_paciente_p',
                                 'nuevo_cirugia_paciente_m','nuevo_cirugia_esteril','nuevo_cirugia_orden_pago',
                                 'nuevo_cirugia_file_name']
            ],
            'buscar_cirugia' => [
                'descripcion' => 'Busca cirugías según los criterios proporcionados.',
                'parameters' => ['id_usuario','estatus','filtrar_fecha','fecha_inicial','fecha_final',
                                 'vendedor','tecnico','subdistribuidor','codigo_cirugia','limite','orderby']
            ],
            'get_cirugia_report' => [
                'descripcion' => 'Obtiene el reporte de una cirugía específica.',
                'parameters' => ['id_cirugia']
            ],
            'cirugia_detalle_material_surtido' => [
                'descripcion' => 'Obtiene el detalle de material surtido de una cirugía específica.',
                'parameters' => ['id_cirugia']
            ],
            'imprimir_pdf_entregar' =>[
                'descripcion' => 'Obtiene la ruta del PDF de material surtido de una cirugía específica.',
                'parameters' => ['id_cirugia','show_fotos','url_base (optional)']
            ]
        ];
    }
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
            'get_cirugia_report' => $this->get_cirugia_report_data($nuevo_cirugia_id)
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
    
    public function Get_Estatus_Text($estatus) {
        $estatus_text = "";
        switch($estatus){
            case 0: $estatus_text = "CANCELADA"; break;
            case 1: $estatus_text = "PROGRAMADA"; break;
            case 2: $estatus_text = "SURTIDA"; break;
            case 3: $estatus_text = "FINALIZADA"; break;
            case 4: $estatus_text = "MATERIAL ENTREGADO"; break;
            case 5: $estatus_text = "SOLICITADA"; break;
        }
        return $estatus_text;
    }
    public function get_cirugia_fotos($id_cirugia){
        $query = "select id_cirugia_foto, url_archivo from cirugia_foto where id_cirugia=" . $id_cirugia . " order by id_cirugia_foto";
        $qresult = DatasetSQL($query);
        $fotos =[];
        while ($row = mysqli_fetch_array($qresult)) {
            $fotos['item_' . $row['id_cirugia_foto']] = [
                "foto" => $row["url_archivo"]
            ];
        }

        return $fotos;
    }
    public function get_cirugia_report_data($id_cirugia){
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
        $estatus_text = $this->Get_Estatus_Text($estatus);
        
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
        
        $fotos = $this->get_cirugia_fotos($id_cirugia);
        $material_surtido = $this->cirugia_detalle_material_surtido_data($id_cirugia);
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
            'fotos' => $fotos,
            'fotos_count' => count($fotos),
            'material_surtido' => $material_surtido,
            'material_surtido_count' => count($material_surtido),
            'sql' => $this->is_debuging ? $query : ""
        ];
        return $data;
    }

    public function get_cirugia_report(){
        $id_cirugia=Requesting("id_cirugia"); 
        if (!$id_cirugia) {
            return $this->DatosIncorrectos();
        }  
        $data = $this->get_cirugia_report_data($id_cirugia);        
        return ( ['result' => 'ok',
                'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP',
                'data_count' => count($data),
                'data'=> $data,
                'sql' => $this->is_debuging ? "" : ""                
                ] );
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

        $query = "SELECT c.id_cirugia, c.codigo, c.estatus, upper(v.nombre) as vendedor
                FROM `cirugia` c     
                    LEFT join vendedor v on c.id_vendedor = v.id_vendedor 
                WHERE 1=1" 
                . ( $filtrar_fecha=="1" ? 
                     " and fecha_cirugia >= '$fecha_inicial' and fecha_cirugia <= '$fecha_final'"
                    : "")                
                . ($vendedor ? " and c.id_vendedor=" . $vendedor : "")
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
            $data['item_' . $row['id_cirugia']] = 
                [                    
                    "id_cirugia" => $row['id_cirugia'],                    
                    "codigo" => $row['codigo'],                    
                    "estatus" => $row['estatus'],  
                    "estatus_text" => $this->Get_Estatus_Text($row['estatus']),                
                    "vendedor" => $row['vendedor']
                ];
        }            
        $data_count = count($data);


        return ( ['result' => 'ok',
                'result_text' => '',
                'data_count' => $data_count,
                'data'=> $data,
                'sql' => $this->is_debuging ? $query : ""                
                ] );
    }
    public function cirugia_detalle_material_surtido(){
        $id_cirugia=Requesting("id_cirugia"); 
        if (!$id_cirugia) {
            return $this->DatosIncorrectos();
        }  
        $data = $this->cirugia_detalle_material_surtido_data($id_cirugia);
        return ( ['result' => 'ok',
                'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP',
                'data_count' => count($data),
                'data'=> $data,
                'sql' => $this->is_debuging ? "" : ""                
                ] );
    }
    public function cirugia_detalle_material_surtido_data($id_cirugia){
        $query1 = "SELECT COUNT(id_prepago) AS existe, orden_pago, url_archivo FROM cirugia_prepago WHERE id_cirugia = ".$id_cirugia;
        $existe = GetValueSQL($query1,"existe");  
        if($existe > 0){
            $orden_pago = GetValueSQL($query1,"orden_pago");  
            $url_archivo = GetValueSQL($query1,"url_archivo");  
        }else{
            $orden_pago = "";
            $url_archivo = "";
        }
        $data = [];
        $sections =[];
        $section_no=0;
        $row_no = 0;
        $numero = 0;
        
        
        /* busca minialmacen*/	
                        
        $query = "SELECT cirugia_minialmacen.id_cirugia_mini, cirugia_minialmacen.id_minialmacen, activo.id_activo, activo.nombre, activo_set.caja 
                    FROM cirugia_minialmacen 
                    INNER JOIN activo_set ON (activo_set.id_set = cirugia_minialmacen.id_minialmacen)
                    INNER JOIN activo ON (activo.id_activo = activo_set.id_activo) 
                    WHERE id_cirugia = ".$id_cirugia;
        $qresult = DatasetSQL($query);
        while ($row = mysqli_fetch_array($qresult)){		
            $numero++; if ($numero%2==0){ $color_row = "#FFF"; }else{ $color_row = "#EEE"; } 			
            
            //$query2 = "SELECT id_inventario, cantidad FROM producto_set WHERE id_set = ".$row["id_minialmacen"]; 
            $query2 = "SELECT id_inventario, cantidad FROM cirugia_minialmacen_inv WHERE id_cirugia_mini = ".$row["id_cirugia_mini"];
            $qresult2 = DatasetSQL($query2);
            $data =[];
            while ($row2 = mysqli_fetch_array($qresult2)){				
                if($row2['id_inventario'] <> ""){
                    $query3 = "SELECT COUNT(id_producto) AS existe_prod, id_producto, lote, codigo_2, fecha_cad FROM inventario WHERE id_inventario = ".$row2['id_inventario'];
                    $existe_prod = GetValueSQL($query3,"existe_prod");
                    if($existe_prod > 0){
                        $id_producto = GetValueSQL($query3,"id_producto");
                        $lote = GetValueSQL($query3,"lote");
                        $fecha_cad = GetValueSQL($query3,"fecha_cad");
                        $codigo_2 = GetValueSQL($query3,"codigo_2");
                        $query4 = "SELECT referencia, nombre FROM producto WHERE id_producto = ".$id_producto;
                        $referencia = GetValueSQL($query4,"referencia");
                        $nombre = GetValueSQL($query4,"nombre");
                        $data["item_" . (string)$row_no++ ] = [
                            'id_activo' =>  $row['id_activo'],
                            'activo_nombre' =>  strtoupper($row['nombre'].' CAJA '.$row['caja']),
                            'cantidad' => $row2["cantidad"],
                            'codigo_2' => $codigo_2,
                            'referencia' => strtoupper($referencia),
                            'lote' => $lote,
                            'fecha_cad' => $fecha_cad,
                            'nombre' => $nombre
                        ];                      
                    }
                }
            }
            if (count($data)>0){
                $sections["item_" . (string)$section_no++] =[
                    'id' => $row['id_activo']."_".$row['caja'],
                    'nombre' =>  strtoupper($row['nombre'].' CAJA '.$row['caja']),
                    //'swl' => $query.";".$query2.";".$query3,
                    'data' => $data
                ];
            }
        } 
        /* busca equipo de poder*/
        
        $query = "SELECT cirugia_equipo.id_cirugia_equipo, equipo_poder.nombre FROM cirugia_equipo 
                    INNER JOIN equipo_poder ON (equipo_poder.id_equipo = cirugia_equipo.id_equipo)
                    WHERE id_cirugia = ".$id_cirugia;
        $qresult = DatasetSQL($query);
        $data=[];
        while ($row = mysqli_fetch_array($qresult)){		
            $numero++; if ($numero%2==0){ $color_row = "#FFF"; }else{ $color_row = "#EEE"; } 			
            //$xmlRow .= '<tr style="background-color:'.$color_row.'"><th scope="row">'.$numero.'</th><td><strong>'.$row['nombre'].'</strong></td></tr>';
            $data["item_" . (string)$row_no++ ] = [
                            'id_activo' =>  '0',
                            'activo_nombre' =>  'EQUIPO DE PODER',
                            'cantidad' => '',
                            'codigo_2' => '',
                            'referencia' => '',
                            'lote' => '',
                            'fecha_cad' => '',
                            'nombre' => '',
                        ];             
        } 
        
        if (count($data)>0){
            $sections["item_" . (string)$section_no++] =[
                'id' => 'equipo_poder',
                'nombre' =>  'EQUIPO DE PODER',
                'data' => $data
            ];
        }
                            
        
        /* producto suelto */
        $query_ms = "SELECT cirugia_producto.id_cirugia_producto, cirugia_producto.cantidad, producto.referencia, producto.nombre, inventario.lote, inventario.fecha_cad, inventario.codigo_2 	
                FROM cirugia_producto 	
                INNER JOIN inventario ON (inventario.id_inventario = cirugia_producto.id_inventario)	 
                INNER JOIN producto ON (producto.id_producto = inventario.id_producto)
                WHERE id_cirugia = ".$id_cirugia;				
        $qresult_ms = DatasetSQL($query_ms); 
        $data =[];

        while ($row_ms = mysqli_fetch_array($qresult_ms)){
            $data["item_" . (string)$row_no++ ] = [
                            'nombre' => strtoupper('Material Suelto'),
                            'cantidad' => $row_ms["cantidad"],
                            'codigo_2' => $row_ms["codigo_2"],
                            'referencia' => strtoupper($row_ms["referencia"]),
                            'lote' => $row_ms["lote"],
                            'fecha_cad' => $row_ms["fecha_cad"],
                            'nombre' => $row_ms["nombre"]
                        ];             
        }	
        if (count($data)>0){             
            $sections["item_" . (string)$section_no++] =[
                    'id' => 'material_suelto',
                    'nombre' =>  'MATERIAL SUELTO',
                    'data' => $data
                ];            
        }
        return $sections;
    }

    public function imprimir_pdf_entregar() {
	
        $id_cirugia = Requesting("id_cirugia"); 
        $url_base  = Requesting("url_base"); 
        $show_fotos  = Requesting("show_fotos")=="1"; 
        if (!$id_cirugia) {
            return $this->DatosIncorrectos();
        }  
        if (!$url_base)
            $url_base  ="https://exorta.exos.software/";
        
        $resultStatus 	= "ok"; 
        $resultText 	= "Correcto";	
        $times = [];
        $timer = 0;
        $times['init']=date("d/m/Y H:i:s");
        
        $query1 = "SELECT COUNT(id_prepago) AS existe, orden_pago, url_archivo FROM cirugia_prepago WHERE id_cirugia = ".$id_cirugia;
        $existe = GetValueSQL($query1,"existe");  
        if($existe > 0){
            $orden_pago = GetValueSQL($query1,"orden_pago");  
            $url_archivo = GetValueSQL($query1,"url_archivo");  
        }else{
            $orden_pago = "";
            $url_archivo = "";
        }
        
        $query = "SELECT cirugia.codigo,cirugia.fecha_cirugia,cirugia.fecha_programacion, cirugia.municipio, cirugia.subdistribuidor, 
                    cirugia.minialmacen, cirugia.equipo_poder, cirugia.adicionales, cirugia.consumibles, cirugia.notas, cirugia.id_almacen,
                    cirugia.paciente, cirugia.paciente_p, cirugia.paciente_m, 
                    vendedor.nombre AS vendedor, tecnico.nombre AS tecnico, medico.nombre AS medico, medico.paterno AS medicop, medico.materno AS medicom,
                    hospital.nombre AS hospital, estado.nombre AS estado
                    FROM cirugia 
                    INNER JOIN vendedor ON (vendedor.id_vendedor = cirugia.id_vendedor)
                    INNER JOIN tecnico ON (tecnico.id_tecnico = cirugia.id_tecnico)
                    INNER JOIN medico ON (medico.id_medico = cirugia.id_medico)
                    INNER JOIN hospital ON (hospital.id_hospital = cirugia.id_hospital)
                    INNER JOIN estado ON (estado.id_estado = cirugia.id_estado) 
                    WHERE id_cirugia = ".$id_cirugia;				
        $qresult_info = DatasetSQL($query);
        $row_info = mysqli_fetch_array($qresult_info);
        $times['info']=date("d/m/Y H:i:s");
        $times['info_sql']=$query;
        
        $clave_cirugia 	= $row_info["codigo"]; 
        $estado 		= $row_info["estado"]; 
        $vendedor 		= $row_info["vendedor"]; 
        $municipio 		= $row_info["municipio"]; 
        $tecnico 		= $row_info["tecnico"]; 
        $hospital 		= $row_info["hospital"]; 
        $medico 		= $row_info["medico"]." ".$row_info["medicop"]." ".$row_info["medicom"]; 
        $notas 			= $row_info["notas"]; 
        $paciente 		= $row_info["paciente"]." ".$row_info["paciente_p"]." ".$row_info["paciente_m"]; 
        $minialmacen 	= $row_info["minialmacen"]; 
        $equipo_poder 	= $row_info["equipo_poder"]; 
        $adicionales 	= $row_info["adicionales"]; 
        $consumibles 	= $row_info["consumibles"]; 
        $subdistribuidor 	= $row_info["subdistribuidor"]; 
        $fecha_programacion = $row_info["fecha_programacion"]; 
        
        $id_almacen_cx = $row_info["id_almacen"]; 
            
        
        $fechas_1 	= explode(" ",$fecha_programacion);
        $fecha_prog = $this->formato_fecha_lectura($fechas_1[0]);
        $hora_prog 	= $fechas_1[1];
            
        $fecha_cirugia 	= $row_info["fecha_cirugia"]; 
        $fechas_2 		= explode(" ",$fecha_cirugia);
        $fecha_cirug 	= $this->formato_fecha_lectura($fechas_2[0]);
        $hora_cirug 	= $fechas_2[1];
            
        $xmlRow = ""; 
        $numero = "0";  
        $cantidad_productos_cscp = "0";

        $array_cscp = array();
        
        /* 2025 - tabla con info Carta Porte */
        $tablaCartaPorte = "
            <table border=1 style='border:1px solid; width:100%; font-size:12px;'>		
                <tr>
                    <td style='text-align:center;'>ACTIVO</td>
                    <td style='text-align:center;'>CODIGO SERVICIO CARTA PORTE</td>
                    <td style='text-align:center;'>CANTIDAD DE PRODUCTOS</td>
                </tr>		
            ";
            
        $xmlRow .= '		
                <div class="col-md-12 mb-3" style="font-size:10px;">
                    <div class="form-group">
                        
                        <table class="table table-hover mb-0" width=100%>
                            <thead>
                                <tr>
                                    <th scope="col">Factura</th>
                                    <th scope="col">Cantidad</th>
                                    <th scope="col">Referencia</th>
                                    <th scope="col">Lote</th> 
                                    <th scope="col">Caducidad</th>
                                    <th scope="col">Producto</th>
                                </tr>
                            </thead>
                            <tbody>';	

        /* busca minialmacen*/
        $xmlRow .= '<tr>
                        <td colspan="6" style="background-color:#5774a3; color:#FFF;">SET DE IMPLANETES</td>
                    </tr>';
        //	$query = "SELECT cirugia_minialmacen.id_cirugia_mini, cirugia_minialmacen.id_minialmacen, activo.nombre, activo_set.caja, carta_porte_codigos.codigo AS cscp
        //				FROM cirugia_minialmacen 
        //				INNER JOIN activo_set ON (activo_set.id_set = cirugia_minialmacen.id_minialmacen)
        //				INNER JOIN activo ON (activo.id_activo = activo_set.id_activo) 
        //				INNER JOIN set_subcategoria ON (set_subcategoria.id_set_subcategoria = activo.id_subcategoria)
        //				INNER JOIN carta_porte_codigos ON (carta_porte_codigos.id_codigo = set_subcategoria.id_codigo_carta_porte)
        //				WHERE id_cirugia = ".$id_cirugia;
                    
        $query = "SELECT cirugia_minialmacen.id_cirugia_mini, cirugia_minialmacen.id_minialmacen, activo.nombre, activo_set.caja, 
                    activo.id_subcategoria, set_subcategoria.id_codigo_carta_porte, activo_tipo.prefijo
                    FROM cirugia_minialmacen  
                    INNER JOIN activo_set ON (activo_set.id_set = cirugia_minialmacen.id_minialmacen)
                    INNER JOIN activo ON (activo.id_activo = activo_set.id_activo)
                    INNER JOIN activo_tipo ON (activo_tipo.id_activo_tipo = activo.id_tipo_activo)
                    INNER JOIN set_subcategoria ON (set_subcategoria.id_set_subcategoria = activo.id_subcategoria)
                    WHERE id_cirugia = ".$id_cirugia;
                    
        $qresult = DatasetSQL($query);
        $times['t2'.(string)$timer++]=date("d/m/Y H:i:s");
        $times['t2'.(string)$timer++]=$query;
        while ($row = mysqli_fetch_array($qresult)){		
            $numero++; if ($numero%2==0){ $color_row = "#FFF"; }else{ $color_row = "#EEE"; } 			
            $xmlRow .= '<tr style="background-color:'.$color_row.'">
                            <th scope="row">'.$numero.'</th>  
                            <td colspan="5"><strong>'.$row['nombre'].' CAJA '.$row['caja'].'</strong></td>
                        </tr>';
            
            $query2 = "SELECT cmi.id_inventario, cmi.cantidad, i.id_producto , i.lote, i.fecha_cad, p.referencia , p.nombre, case when entrada_factura.factura is null then 'N/A' else entrada_factura.factura end as factura
                            FROM cirugia_minialmacen_inv cmi
                                left join inventario i on cmi.id_inventario =i.id_inventario and i.id_inventario is not null
                                left join producto p on i.id_producto = p.id_producto
                                left join entrada_almacen_factura_producto  on cmi.id_inventario = entrada_almacen_factura_producto.id_inventario 
                                    left JOIN entrada_almacen_factura ON (entrada_almacen_factura.id_entrada = entrada_almacen_factura_producto.id_entrada)
                                    left JOIN entrada_factura ON (entrada_factura.id_entrada_factura = entrada_almacen_factura.id_entrada_factura)
                            WHERE cmi.id_cirugia_mini = ".$row["id_cirugia_mini"];

            $qresult2 = DatasetSQL($query2);
            $times['t2_00_1_'.(string)$timer++]=date("d/m/Y H:i:s");
            $times['t2_00_1_'.(string)$timer++]=$query2;
            while ($row2 = mysqli_fetch_array($qresult2)){				
                $id_producto 	= $row2["id_producto"];
                $lote 			= $row2["lote"];
                $fecha_cad 		= $row2["fecha_cad"];
                $referencia 	= $row2["referencia"];
                $nombre 		= $row2["nombre"];                
                $factura        = $row2["factura"];                
                					  
               
                $xmlRow .= '
                    <tr>   
                        <td>'.$factura.'</td>  
                        <td>'.$row2["cantidad"].'</td> 
                        <td>'.$referencia.'</td>  
                        <td>'.$lote.'</td>   
                        <td>'.$fecha_cad.'</td>   
                        <td>'.$nombre.'</td> 
                    </tr>  
                ';
                
                $cantidad_productos_cscp++;
                    
            }
            
            /* CSCP - 2025 */
            if($row['id_codigo_carta_porte'] > 0){
                        
                $query_cscp = "SELECT COUNT(id_codigo) AS existe, codigo FROM carta_porte_codigos WHERE id_codigo = ".$row['id_codigo_carta_porte'];
                $existe_cscp = GetValueSQL($query_cscp,"existe");
                $times['t2_05'.(string)$timer++]=date("d/m/Y H:i:s");
                if($existe_cscp > 0){
                    $codigo_cscp = GetValueSQL($query_cscp,"codigo");            
                        
                    if (isset($array_cscp[$codigo_cscp])) {
                        $cantidad_actual = $array_cscp[$codigo_cscp]; 
                
                        $suma_cantidad = ($cantidad_productos_cscp) + ($cantidad_actual);
                        unset($array_cscp[$codigo_cscp]);
                        
                        $array_cscp[$codigo_cscp] = $suma_cantidad;
                        $suma_cantidad = 0;
                        
                    }else{
                        $array_cscp[$codigo_cscp] = $cantidad_productos_cscp;
                    }
                    $times['t2_05'.(string)$timer++]=date("d/m/Y H:i:s");
                }
            }	
            
            $cantidad_productos_cscp = 0;
            $suma_cantidad = 0;
            
        
            foreach ($array_cscp as $key => $value) { 
            
                if($value > 0){
                    $tablaCartaPorte .= ' 
                        <tr>
                            <td style="text-align:center;">'.$row['nombre'].' CAJA '.$row['caja'].'</td>
                            <td style="text-align:center;">'.$row['prefijo'].''.$key.'</td>
                            <td style="text-align:center;">'.$value.'</td> 
                        </tr>
                    ';
                }
                
            }
            
            $array_cscp = array();
            
        }
        $times['t3'.(string)$timer++]=date("d/m/Y H:i:s");

        $tablaCartaPorte .= '</table>';
        
        /* busca equipo de poder*/
        //			$xmlRow .= '<tr>
        //							<td colspan="5" style="background-color:#5774a3; color:#FFF;">EQUIPOS DE PODER</td>
        //						</tr>';
        //			$query = "SELECT cirugia_equipo.id_cirugia_equipo, equipo_poder.nombre FROM cirugia_equipo 
        //						INNER JOIN equipo_poder ON (equipo_poder.id_equipo = cirugia_equipo.id_equipo)
        //						WHERE id_cirugia = ".$id_cirugia;
        //			$qresult = DatasetSQL($query);
        //			while ($row = mysqli_fetch_array($qresult)){		
        //				$numero++; if ($numero%2==0){ $color_row = "#FFF"; }else{ $color_row = "#EEE"; } 			
        //				$xmlRow .= '<tr style="background-color:'.$color_row.'"><th scope="row">'.$numero.'</th><td><strong>'.$row['nombre'].'</strong></td></tr>';
        //			} 	
        
        //			$xmlRow .= '<tr>
        //					<td colspan="5" style="background-color:#5774a3; color:#FFF;">SET DE INSTRUMENTAL</td>
        //				</tr>'; 	 
                    
                
        /* MATERIAL SUELTO SURTIDO A LA CIRUGIA*/
        
        $xmlRow .= '<tr>
                        <td colspan="6" style="background-color:#5774a3; color:#FFF;">PRODUCTO SUELTO SURTIDO</td>
                    </tr>'; 
        $query_ms = "SELECT cirugia_producto.id_cirugia_producto, cirugia_producto.cantidad, producto.referencia, producto.nombre, inventario.lote,  inventario.fecha_cad,  cirugia_producto.id_inventario 	
                FROM cirugia_producto 	
                INNER JOIN inventario ON (inventario.id_inventario = cirugia_producto.id_inventario)	 
                INNER JOIN producto ON (producto.id_producto = inventario.id_producto)
                WHERE id_cirugia = ".$id_cirugia;				
        $qresult_ms = DatasetSQL($query_ms); 
        $times['t4'.(string)$timer++]=date("d/m/Y H:i:s");
        while ($row_ms = mysqli_fetch_array($qresult_ms)){
            
            $query_factura = "SELECT COUNT(entrada_factura.id_entrada_factura) AS existe, entrada_factura.factura 
                FROM entrada_almacen_factura_producto
                INNER JOIN entrada_almacen_factura ON (entrada_almacen_factura.id_entrada = entrada_almacen_factura_producto.id_entrada)
                INNER JOIN entrada_factura ON (entrada_factura.id_entrada_factura = entrada_almacen_factura.id_entrada_factura)
                WHERE entrada_almacen_factura_producto.id_inventario = ".$row_ms["id_inventario"]."
                ORDER BY entrada_almacen_factura.fecha DESC";
            $existefactura = GetValueSQL($query_factura,"existe");
            
            if($existefactura > 0){
                $factura = GetValueSQL($query_factura,"factura");
            }else{
                $factura = "NA";
            }
                
            $xmlRow .= ' 
                <tr> 
                    <td>'.$factura.'</td> 
                    <td>'.$row_ms["cantidad"].'</td> 
                    <td>'.$row_ms["referencia"].'</td> 
                    <td>'.$row_ms["lote"].'</td> 
                    <td>'.$row_ms["fecha_cad"].'</td> 
                    <td>'.$row_ms["nombre"].'</td> 
                </tr>  
            ';	
        }	
        $times['t5'.(string)$timer++]=date("d/m/Y H:i:s");
            
        $xmlRow .= '</tbody></table></div></div>';
        
        
        $xmlRow2 = "<br><br><br><br>"; 
           
        /* buscar fotos surtidas */
        $queryfsn = "SELECT COUNT(url_archivo) AS nums FROM cirugia_foto WHERE id_cirugia = ".$id_cirugia;
        $numero_de_fotos = GetValueSQL($queryfsn,"nums");
        
        if ($show_fotos){
            if($numero_de_fotos > 10 AND $numero_de_fotos < 25){
                ini_set('memory_limit', '512M');
            }
            
            if($numero_de_fotos < 26){
                
                $queryfs = "SELECT url_archivo FROM cirugia_foto WHERE id_cirugia = ".$id_cirugia;
                $qresultfs = DatasetSQL($queryfs); 
                while ($rowfs = mysqli_fetch_array($qresultfs)){		
                    //$imagenBase64 = "data:image/png;base64,".base64_encode(file_get_contents($url_base.$rowfs['url_archivo']));
                    
                    if(file_exists($rowfs['url_archivo'])){
                        $lafoto = $rowfs['url_archivo'];
                        $imagenBase64 = "data:image/png;base64,".base64_encode(file_get_contents($lafoto));
                        $xmlRow2 .= "<img src='".$imagenBase64." alt='' style='width:30%; height:auto'> ";
                    }else{
                        $lafoto = $url_base.$rowfs['url_archivo'];
                        $xmlRow2 .= "<img src='".$lafoto."' alt='' style='width:30%; height:auto'> ";
                    }	    
                }                            
            }
        }
        
        //echo $xmlRow2;  
        //$xmlRow2 = ""; /* siempre no se imprimen fotos */
        //	<p class='control-label' style='font-size:24px; font-weight:900'>Reporte de Material Entregado. Folio de Cirugia: ".strtoupper($clave_cirugia)."</p>	
        //	$imagen = "<img src='https://exorta.creaccionesweb.com/assets/images/logo.jpg' alt=''>";		
        
        $imagen = "<img src='".$url_base."assets/images/logo.jpg' alt=''>";		
        
        /* *** 2026 *** */ 
        /* *** Toma el logo de la tabla EMPRESA *** */
        $querylogo = "SELECT empresa.logo 
            FROM almacen
            INNER JOIN empresa ON (empresa.id_empresa = almacen.id_empresa)
            WHERE almacen.id_almacen = ".$id_almacen_cx;
        $url_logo = GetValueSQL($querylogo,"logo");		 
        $imagen = "<img style='max-width:200px; height:auto;' src='".$url_base.$url_logo."' alt=''>";
            
            
        $hoja = "
            <table border=0 style='border:0px solid; width:100%'>		
                <tr>
                    <td colspan=2 style='text-align:left;'>".$imagen." </td>
                    <td colspan=2 style='text-align:right;'>Reporte de Material Entregado. <br>Folio de Cirugia: ".strtoupper($clave_cirugia)."</td>
                </tr>		
                <tr>
                    <td style='text-align:right;font-size:10px;'>ESTADO:</td>
                    <td style='text-align:center;border:1px solid'>".strtoupper($estado)."</td>
                    <td style='text-align:right;font-size:10px;'> AGENTE: </td>
                    <td style='text-align:center;border:1px solid'>".strtoupper($vendedor)."</td>
                </tr>			
                <tr>
                    <td style='text-align:right;font-size:10px;'>CIUDAD:</td>
                    <td style='text-align:center;border:1px solid'>".strtoupper($municipio)."</td>
                    <td style='text-align:right;font-size:10px;'> TECNICO: </td>
                    <td style='text-align:center;border:1px solid'>".strtoupper($tecnico)."</td>
                </tr>			
                <tr>
                    <td style='text-align:right;font-size:10px;'>FECHA:</td>
                    <td style='text-align:center;border:1px solid'>".$fecha_cirug."</td>
                    <td style='text-align:right;font-size:10px;'> HOSPITAL: </td>
                    <td style='text-align:center;border:1px solid'>".strtoupper($hospital)."</td>
                </tr>			
                <tr>
                    <td style='text-align:right;font-size:10px;'>HORA:</td>
                    <td style='text-align:center;border:1px solid'>".$hora_cirug."</td>
                    <td style='text-align:right;font-size:10px;'> MEDICO: </td>
                    <td style='text-align:center;border:1px solid'>".strtoupper($medico)."</td>
                </tr>			
                <tr>
                    <td style='text-align:right;font-size:10px;'>SD:</td>
                    <td style='text-align:center; border:1px solid'>".strtoupper($subdistribuidor)."</td>
                    <td style='text-align:right;font-size:10px;'> PACIENTE: </td>
                    <td style='text-align:center;border:1px solid'>".strtoupper($paciente)."</td>
                </tr>			
                <tr>
                    <td style='text-align:right;font-size:10px;'>NOTAS:</td>
                    <td style='text-align:center;border:1px solid' colspan=3>".($notas)."</td>
                </tr>
                
            </table>
            <hr> 
            ".$tablaCartaPorte."
            <hr>
            ".$xmlRow."
            ".$xmlRow2."
        
        ";
        $times['t6'.(string)$timer++]=date("d/m/Y H:i:s");
        
        $dompdf = new Dompdf(); 	
        $options = $dompdf->getOptions();
        $options->set(array('isRemoteEnabled' => true));
        
        $options->set('isHtml5ParserEnabled', true);
        
        $dompdf->setOptions($options);
        $dompdf->loadHtml($hoja);  
        $dompdf->setPaper('A4', 'legal');
        $dompdf->render();			
        
        $filename = DATE('Y')."_".DATE('m')."_".date('d')."-".date('h')."_".date('i')."_".date('sa');
        $output = $dompdf->output();  
        
        file_put_contents('../archivos_pdf_generados/'.$filename.'.pdf', $output); 

        $filepath = $url_base.'/archivos_pdf_generados/'.$filename.".pdf" ;
        $times['fin']=date("d/m/Y H:i:s");        
                
        return [ 
            'filepath' 			=> $filepath, 
            'result' 			=> $resultStatus, 
            'result_text' 		=> $resultText,
            //'times'             => $times
        ];	 
    
    } 
}
