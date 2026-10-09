<?php

trait ExosApp_Paqueteria
{
    public function listMethods_Paqueteria()
    {
        return [
            'paqueteria_por_enviar' => [
                'descripcion' => 'Obtiene la lista de paquetería por enviar.',
                'parameters' => ['id_usuario', 'id_almacen','ordenar_por(optional)'],
            ],            
            'paqueteria_por_recibir' => [
                'descripcion' => 'Obtiene la lista de paquetería por recibir.',
                'parameters' => ['id_usuario', 'id_almacen','ordenar_por(optional)'],
            ],            
            'paqueteria_detalle' => [
                'descripcion' => 'Obtiene el detalle de una paquetería específica.',
                'parameters' => ['id_paqueteria'],
            ],
            'paqueteria_transito_detalle' => [
                'descripcion' => 'Obtiene el detalle de una paquetería en transito específica.',
                'parameters' => ['id_paqueteria'],
            ]
        ];
    }
    public function paqueteria_por_enviar(){        
        $id_usuario = Requesting("id_usuario");
        $id_almacen = Requesting("id_almacen");
        $ordenar_por = Requesting("ordenar_por");
        
        if (!$ordenar_por) {
            $ordenar_por = "codigo"; // Valor por defecto si no se proporciona
        }

        if (!$id_usuario || !$id_almacen) {
            return $this->DatosIncorrectos();
        }

        $query = "SELECT paqueteria.id_paqueteria, paqueteria.codigo, paqueteria.kardex, paqueteria.enviada, 
                    usuario.usuario AS username, almacena.nombre AS origen, almacenb.nombre AS destino 
                    FROM paqueteria 
                    INNER JOIN usuario ON (usuario.id_usuario = paqueteria.id_usuario_kardex)
                    INNER JOIN almacen AS almacena ON (almacena.id_almacen = paqueteria.id_bodega_origen)
                    INNER JOIN almacen AS almacenb ON (almacenb.id_almacen = paqueteria.id_bodega_destino)
                    WHERE paqueteria.id_bodega_origen = " . $id_almacen . " AND finalizada = 1 AND enviada = 0
                    ORDER BY " . $ordenar_por . " ASC";
        $qresult = DatasetSQL($query);
        
        
        $data = [];    
        while ($row = mysqli_fetch_array($qresult)) {
            $total = GetValueSQL("SELECT COUNT(id_registro) AS total FROM paqueteria_fragmento WHERE id_paqueteria = ".$row["id_paqueteria"],"total");
            $existe_transito = GetValueSQL("SELECT COUNT(id_registro) AS existe_transito FROM paqueteria_transito WHERE id_paqueteria = ".$row["id_paqueteria"],"existe_transito");
            $existe_compaq = GetValueSQL("SELECT COUNT(id_registro) AS existe_compaq FROM paqueteria_compaq WHERE id_paqueteria = ".$row["id_paqueteria"],"existe_compaq");            

            // Usamos el prefijo 'item_' para que el XML sea válido y el frontend lo reconozca como lista
            $data['item_' . $row['id_paqueteria']] = [
                'id_paqueteria' => $row['id_paqueteria'],
                'codigo' => $row['codigo'],
                'origen' => $row['origen'],
                'destino' => $row['destino'],
                'total' => $total,
                'existe_transito' => $existe_transito,
                'existe_compaq' => $existe_compaq,                
                'kardex' => $row['kardex'],
                'username' => $row['username'],
            ];
        }

        $data_count = count($data);

        return ( ['result' => 'ok',
                'result_text' => 'ejecutado desde ExosAPP',
                'data_count' => $data_count,
                'data'=> $data,            
                ] );

    }
    public function paqueteria_por_recibir(){        
        $id_usuario = Requesting("id_usuario");
        $id_almacen = Requesting("id_almacen");
        $ordenar_por = Requesting("ordenar_por");
        
        if (!$ordenar_por) {
            $ordenar_por = "codigo"; // Valor por defecto si no se proporciona
        }

        if (!$id_usuario || !$id_almacen) {
            return $this->DatosIncorrectos();
        }

        $query = "SELECT paqueteria_transito.id_registro, paqueteria_transito.id_paqueteria, paqueteria.codigo, paqueteria_transito.kardex, paqueteria.enviada, 
                    usuario.usuario AS username, almacena.nombre AS origen, almacenb.nombre AS destino, paqueteria.id_bodega_destino,
                    paqueteria_transito.comentarios, paqueteria_transito.guia, paqueteria_transito.precio
                    FROM paqueteria_transito 
                    INNER JOIN paqueteria ON (paqueteria.id_paqueteria = paqueteria_transito.id_paqueteria)
                    INNER JOIN usuario ON (usuario.id_usuario = paqueteria_transito.id_usuario_kardex)
                    INNER JOIN almacen AS almacena ON (almacena.id_almacen = paqueteria.id_bodega_origen) 
                    INNER JOIN almacen AS almacenb ON (almacenb.id_almacen = paqueteria.id_bodega_destino)
                    WHERE paqueteria.id_bodega_destino = ".$id_almacen." AND  paqueteria.recibida = 0
		            ORDER BY " . $ordenar_por . " ASC";
        $qresult = DatasetSQL($query);
        
        
        $data = [];    
        while ($row = mysqli_fetch_array($qresult)) {
            $total = GetValueSQL("SELECT COUNT(id_registro) AS total FROM paqueteria_fragmento WHERE id_paqueteria = ".$row["id_paqueteria"],"total");
            $existe_faltante = GetValueSQL("SELECT COUNT(paqueteria_fragmento_faltante.id_registro) AS existe_faltante
                                                FROM paqueteria_fragmento_faltante 
                                                INNER JOIN paqueteria_fragmento ON (paqueteria_fragmento.id_registro = paqueteria_fragmento_faltante.id_paqueteria_fragmento)
                                                WHERE paqueteria_fragmento.id_paqueteria = ".$row["id_paqueteria"]
                                                , "existe_faltante");

        /** obtengo los PDFs *** */
		$pdfs = [];
		$querypdf = "SELECT pdf FROM paqueteria_compaq WHERE id_paqueteria = ".$row["id_paqueteria"];
		$qresultpdf = DatasetSQL($querypdf);
		while ($rowpdf = mysqli_fetch_array($qresultpdf)){		
			// 'item_N' (no [] => <0>): un elemento XML no puede llamarse "0" y
			// el parser del frontend marcaba toda la respuesta como inválida.
			$pdfs['item_' . count($pdfs)] = $rowpdf['pdf'];
		}

        // Usamos el prefijo 'item_' para que el XML sea válido y el frontend lo reconozca como lista
        $data['item_' . $row['id_paqueteria']] = [
                'id_paqueteria' => $row['id_paqueteria'],
                'codigo' => $row['codigo'],
                'origen' => $row['origen'],
                'destino' => $row['destino'],
                'total' => $total,
                'existe_faltante' => $existe_faltante,
                'pdfs' => $pdfs,         
                'kardex' => $row['kardex'],
                'username' => $row['username'],
                'comentarios' => $row['comentarios'],
                'guia' => $row['guia'],
                'precio' => $row['precio']
            ];
        }

        $data_count = count($data);

        return ( ['result' => 'ok',
                'result_text' => 'ejecutado desde ExosAPP',
                'data_count' => $data_count,
                'data'=> $data,            
                ] );

    }

    public function paqueteria_detalle(){
        $id_paqueteria = Requesting("id_paqueteria");
        if (!$id_paqueteria) {
            return $this->DatosIncorrectos();
        }

        
        $query = "SELECT producto.referencia, producto.nombre, fragmento_reposicion.codigo, fragmento_reposicion.cantidad , 
                    inventario.lote, inventario.codigo_2, inventario.fecha_cad  , carpeta.codigo AS codecarpeta, paqueteria_fragmento.id_registro 
                    FROM paqueteria_fragmento
                    INNER JOIN fragmento_reposicion ON (fragmento_reposicion.id_registro = paqueteria_fragmento.id_fragmento_reposicion)
                    INNER JOIN fragmento ON (fragmento.id_fragmento = fragmento_reposicion.id_fragmento)
                    INNER JOIN carpeta ON (carpeta.id_carpeta = fragmento.id_carpeta)
                    INNER JOIN inventario ON (inventario.id_inventario = fragmento_reposicion.id_inventario)
                    INNER JOIN producto ON (producto.id_producto = inventario.id_producto)
                    WHERE paqueteria_fragmento.id_paqueteria = ".$id_paqueteria." ORDER BY carpeta.codigo"; 

        $qresult = DatasetSQL($query);
        
        
        $data = [];    
        while ($row = mysqli_fetch_array($qresult)) {
            // Usamos el prefijo 'item_' para que el XML sea válido y el frontend lo reconozca como lista
            // La clave debe ser única por fila: varios productos comparten
            // carpeta, y con 'item_' . codecarpeta se pisaban entre sí (una
            // paquetería con 36 productos devolvía solo 7).
            $data['item_' . $row['id_registro']] = [
                'codecarpeta' => $row['codecarpeta'],
                'referencia' => $row['referencia'],
                'nombre' => $row['nombre'],
                'codigo' => $row['codigo'],
                'cantidad' => $row['cantidad'],
                'lote' => $row['lote'],
                'codigo_2' => $row['codigo_2'],
                'fecha_cad' => $row['fecha_cad'],
                'codecarpeta' => $row['codecarpeta'],                
            ];
        }
        
        $data_count = count($data);

        return ( ['result' => 'ok',
                'result_text' => 'ejecutado desde ExosAPP',
                'data_count' => $data_count,
                'data'=> $data,            
                ] );
    }

    public function paqueteria_transito_detalle(){
        $id_paqueteria = Requesting("id_paqueteria");
        if (!$id_paqueteria) {
            return $this->DatosIncorrectos();
        }
        $query = "SELECT paqueteria_transito.comentarios, paqueteria_transito.guia, paqueteria_transito.precio
                    FROM paqueteria_transito                     
                    WHERE paqueteria_transito.id_paqueteria = ".$id_paqueteria;
        
        $qresult = DatasetSQL($query);
        $row = mysqli_fetch_array($qresult);
        
        /** obtengo las Fotos de paqueteria_transito_fotos *** */
		$fotos = [];
		$queryfotos = "SELECT foto FROM paqueteria_transito_fotos WHERE id_paqueteria = ".$id_paqueteria;
		$qresultfotos = DatasetSQL($queryfotos);
		while ($rowfotos = mysqli_fetch_array($qresultfotos)){		
			$fotos['item_' . count($fotos)] = $rowfotos['foto'];
		}

        return ( ['result' => 'ok',
                'result_text' => 'ejecutado desde ExosAPP',
                'comentarios' => ($row) ? $row['comentarios'] : '',
                'guia' =>  ($row) ? $row['guia'] : '',
                'precio' => ($row) ? $row['precio'] : '0.00',                
                'fotos_count' => count($fotos),
                'fotos'=> $fotos,            
                ] );
    }
}
