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
}
