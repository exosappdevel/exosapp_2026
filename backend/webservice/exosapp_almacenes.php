<?php

trait ExosApp_Almacenes
{
    private function listMethods_Almacenes()
    {
        return [        
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
            ]
        ];
    }

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

}
