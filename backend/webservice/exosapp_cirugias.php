<?php

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

}
