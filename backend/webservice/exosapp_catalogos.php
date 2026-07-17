<?php

trait ExosApp_Catalogos
{
    private function listMethods_Catalogos()
    {
        return [
            'get_set_categorias' => [
                'descripcion' => 'Obtiene la lista de categorías',
                'parameters' => []
            ],
            'get_set_subcategorias' => [
                'descripcion' => 'Obtiene la lista de subcategorías para una categoría específica',
                'parameters' => ['id_categoria']
            ],
            'get_set_categorias_subcategorias' => [
                'descripcion' => 'Obtiene la lista de categorías y sus subcategorías',
                'parameters' => []
            ],
            'get_equipos_poder_categoria' => [
                'descripcion' => 'Obtiene la lista de categorías de equipos de poder',
                'parameters' => []
            ],
            'get_instrumental_categoria' => [
                'descripcion' => 'Obtiene la lista de categorías de instrumental',
                'parameters' => []
            ],
            'get_consumible_categoria' => [
                'descripcion' => 'Obtiene la lista de categorías de consumibles',
                'parameters' => []
            ],
            'get_estados' => [
                'descripcion' => 'Obtiene la lista de estados',
                'parameters' => []
            ],
            'get_vendedores' => [
                'descripcion' => 'Obtiene la lista de vendedores',
                'parameters' => ['id_usuario', "first_row (opcional)"]
            ],
            'get_tecnicos' => [
                'descripcion' => 'Obtiene la lista de técnicos',
                'parameters' => ['id_usuario']
            ],
            'get_hospitales'=>[
                "descripcion" =>'Obtiene la lista de hospitales para un almacén específico.',
                "parameters" => ['id_almacen']
            ],
            "get_subdistribuidor"=>[
                "descripcion" =>'Obtiene la lista de subdistribuidores.',
                "parameters" => []
            ],
            "get_medicos_list"=>[
                "descripcion" =>'Obtiene la lista de médicos para un almacén específico.',
                "parameters" => ['id_usuario', "id_almacen"]
            ]
        ];
    }
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
            'data' => $data,
            'result_text' => 'Metodo ejecutado exitosamente en EXOSAPP.PHP'
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

}
