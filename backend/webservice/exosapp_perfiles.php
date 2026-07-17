<?php

trait ExosApp_Perfiles
{
    public function listMethods_Perfiles()
    {
        return [
            'app_perfiles_list' => [
                'descripcion' => 'Obtiene la lista de perfiles de la aplicación.',
                'parameters' => []
            ],
            'app_perfiles_add' => [
                'descripcion' => 'Agrega un nuevo perfil a la aplicación.',
                'parameters' => ['nombre', 'descripcion', 'activo']
            ],
            'app_perfiles_delete' => [
                'descripcion' => 'Elimina un perfil de la aplicación.',
                'parameters' => ['id_perfil']
            ],
            'app_perfiles_update' => [
                'descripcion' => 'Actualiza un perfil existente en la aplicación.',
                'parameters' => ['id_perfil', 'nombre', 'descripcion', 'activo']
            ],
            'app_perfiles_info' => [
                'descripcion' => 'Obtiene información detallada de un perfil específico.',
                'parameters' => ['id_perfil']
            ],
            'app_perfiles_permisos_get' => [
                'descripcion' => 'Obtiene los permisos asociados a un perfil específico.',
                'parameters' => ['id_perfil']
            ],
            'app_perfiles_permisos_update' => [
                'descripcion' => 'Actualiza los permisos asociados a un perfil específico.',
                'parameters' => ['id_perfil', 'permisos (JSON)']
            ],
            'app_perfiles_usuario_get' => [
                'descripcion' => 'Obtiene los perfiles asignados a un usuario específico.',
                'parameters' => ['id_usuario_app']
            ],
            'app_perfiles_usuario_add' => [
                'descripcion' => 'Asigna un perfil a un usuario específico.',
                'parameters' => ['id_perfil', 'id_usuario_app']
            ],
            'app_perfiles_usuario_delete' => [
                'descripcion' => 'Elimina un perfil asignado a un usuario específico.',
                'parameters' => ['id_perfil', 'id_usuario_app']
            ],
            'app_perfiles_usuarios_get' => [
                'descripcion' => "Obtiene los usuarios asignados a un perfil específico.",
                "parameters" => ["id_perfil"]
            ],
            'app_usuarios_list' => [
                'descripcion' => "Obtiene la lista de usuarios de la aplicación.",
                "parameters" => []
            ]        
        ];
    }
    public function app_perfiles_list(){
        $sql_perfiles = "select * from app_perfiles";
        $ds_perfiles = DatasetSQL_WS($sql_perfiles);
        while ($row = mysqli_fetch_array($ds_perfiles)) {
            $data['item_' . $row['id']] = [
                'id_perfil' => $row['id'],
                'nombre' => $row['nombre'],
                'descripcion' => $row['descripcion'],
                'activo' => $row['activo']
            ];
        }
        return ( ['result' => 'ok',
                'result_text' => 'Perfiles obtenidos exitosamente desde ExosAPP',
                'data' => $data,
                ] );
    }

    public function app_perfiles_add(){
        $nombre = Requesting("nombre");
        $descripcion = Requesting("descripcion");
        $activo = Requesting("activo");

        $sql_perfil = "INSERT INTO app_perfiles (nombre, descripcion, activo) VALUES ('" . $nombre . "', '" . $descripcion . "', '" . $activo . "')";
        $id = ExecuteSQL_ReturnID_WS($sql_perfil);

        $sql_modulos ="select id from app_modulos";
        $ds_modulos = DatasetSQL_WS($sql_modulos);

        $sql_almacen ="select id_almacen from almacen order by id_almacen";
        $ds_almacenes = DatasetSQL($sql_almacen);        
        $almacenes = [];
        while ($row_almacen = mysqli_fetch_array($ds_almacenes)) {
            $almacenes[] = $row_almacen;
        }

        while ($row_modulo = mysqli_fetch_array($ds_modulos)) {   
            mysqli_data_seek($ds_almacenes, 0);            
            foreach ($almacenes as $row_almacen) {
                $sql_insert = 'INSERT INTO app_perfiles_modulos (id_perfil, id_modulo, id_almacen,activo) VALUES (' . $id . ', ' . $row_modulo['id'] . ', ' . $row_almacen['id_almacen'] . ', 0)';
                ExecuteSQL_WS($sql_insert);
            }
        }
        
        return ( ['result' => 'ok',
                'result_text' => 'Perfil creado exitosamente desde ExosAPP',
                'id_perfil' => $id,
                'sql_insert' => $sql_insert
                //'almacenes' => $almacenes
                ] );
    }

    public function app_perfiles_delete(){
        $id_perfil = Requesting("id_perfil");
        $sql_perfil = "DELETE FROM app_perfiles WHERE id = " . $id_perfil;
        ExecuteSQL_WS($sql_perfil);
        return ( ['result' => 'ok',
                'result_text' => 'Perfil eliminado exitosamente desde ExosAPP',
                'id_perfil' => $id_perfil,
                ] );
    }

    public function app_perfiles_update(){
        $id_perfil = Requesting("id_perfil");
        $nombre = Requesting("nombre");
        $descripcion = Requesting("descripcion");
        $activo = Requesting("activo");

        $sql_perfil = "UPDATE app_perfiles SET nombre = '" . $nombre . "', descripcion = '" . $descripcion . "', activo = '" . $activo . "' WHERE id = " . $id_perfil;
        ExecuteSQL_WS($sql_perfil);

        return ( ['result' => 'ok',
                'result_text' => 'Perfil actualizado exitosamente desde ExosAPP',
                'id_perfil' => $id_perfil,
                ] );
    }

    public function app_perfiles_info(){
        $id_perfil = Requesting("id_perfil");
        $sql_perfil = "select * from app_perfiles where id = " . $id_perfil;
        $ds_perfil = DatasetSQL_WS($sql_perfil);
        $row = mysqli_fetch_array($ds_perfil);
        $data = [
            'id_perfil' => $row['id'],
            'nombre' => $row['nombre'],
            'descripcion' => $row['descripcion'],
            'activo' => $row['activo']
        ];
        return ( ['result' => 'ok',
                'result_text' => 'Perfil obtenido exitosamente desde ExosAPP',
                'data' => $data,
                ] );
    }

    public function app_perfiles_permisos_get(){
            $id_perfil = Requesting("id_perfil");
            $sql_permisos = "select pm.*, md.modulo , mn.menu from app_perfiles_modulos pm left join app_modulos md on pm.id_modulo = md.id left join app_menus mn on md.id_menu = mn.id where pm.id_perfil=" . $id_perfil;
            $ds_permisos = DatasetSQL_WS($sql_permisos);
            while ($row = mysqli_fetch_array($ds_permisos)) {
                $almacen = GetValueSQL("select nombre from almacen where id_almacen=" . $row['id_almacen'], "nombre");
                $data['item_' . $row['id']] = [
                    'id' => $row['id'],
                    'id_perfil' => $row['id_perfil'],
                    'id_modulo' => $row['id_modulo'],
                    'modulo' => $row['modulo'],
                    'menu' => $row['menu'],
                    'id_almacen' => $row['id_almacen'],
                    'almacen' => $almacen,
                    'activo' => $row['activo']
                ];
            }
            return ( ['result' => 'ok',
                    'result_text' => 'Permisos obtenidos exitosamente desde ExosAPP',
                    'data' => $data,                       
                    ] );
    }

    public function app_perfiles_permisos_update(){

        $id_perfil = Requesting("id_perfil");
        $permisos = Requesting("permisos");

        $lista = json_decode($permisos, true);
        if (!is_array($lista)) {
            return ['result' => 'error', 'result_text' => 'permisos inválido, se espera JSON'];
        }

        foreach ($lista as $permiso) {
            $id = intval($permiso['id']);
            $activo = intval($permiso['activo']) ? 1 : 0;
            $sql_update = "UPDATE app_perfiles_modulos SET activo = " . $activo . " WHERE id = " . $id . " AND id_perfil = " . intval($id_perfil);
            ExecuteSQL_WS($sql_update);
        }

        return ( ['result' => 'ok',
                'result_text' => 'Permisos actualizados exitosamente desde ExosAPP',
                'id_perfil' => $id_perfil,
                ] );
    }

    public function app_perfiles_usuario_get(){
        $id_usuario_app = Requesting("id_usuario_app");
        $sql_perfil_usuario = "select pu.*, p.nombre from app_perfiles_usuarios pu left join app_perfiles p on pu.id_perfil = p.id where pu.id_usuario_app = " . $id_usuario_app;
        $ds_perfil_usuario = DatasetSQL_WS($sql_perfil_usuario);
        $data = [];
        while ($row = mysqli_fetch_array($ds_perfil_usuario)) {
            $data['item_' . $row['id']] = [
                'id' => $row['id'],
                'id_usuario_app' => $row['id_usuario_app'],     
                'id_perfil' => $row['id_perfil'],
                'perfil_nombre' => $row['nombre'],                
            ];
        }
        return ( ['result' => 'ok',
                'result_text' => 'Perfiles del usuario obtenidos exitosamente desde ExosAPP',
                'data' => $data,                       
                ] );
    }

    public function app_perfiles_usuario_add(){
        $id_perfil = Requesting("id_perfil");
        $id_usuario_app = Requesting("id_usuario_app");
        $sql_existe_perfil_usuario = "SELECT count(id) as existe FROM app_perfiles_usuarios WHERE id_perfil = " . $id_perfil . " AND id_usuario_app = " . $id_usuario_app;
        $existe_perfil_usuario = getValueSQL_WS($sql_existe_perfil_usuario, "existe");
        if ($existe_perfil_usuario > 0) {
            return ( ['result' => 'error',
                    'result_text' => 'El perfil ya está asignado al usuario.',
                    'id_perfil' => $id_perfil,
                    'id_usuario_app' => $id_usuario_app
                    ] );
        }
        else{
            $sql_perfil_usuario = "INSERT INTO app_perfiles_usuarios (id_perfil, id_usuario_app) VALUES (" . $id_perfil . ", " . $id_usuario_app . ")"; 
            executeSQL_WS($sql_perfil_usuario);
            return ( ['result' => 'ok', 
                    'result_text' => 'Perfil asignado al usuario exitosamente desde ExosAPP',
                    'id_perfil' => $id_perfil,
                    'id_usuario_app' => $id_usuario_app
                    ] );    
        }
     }

     public function app_perfiles_usuario_delete(){
        $id_perfil = Requesting("id_perfil");
        $id_usuario_app = Requesting("id_usuario_app");
        $sql_perfil_usuario = "DELETE FROM app_perfiles_usuarios WHERE id_perfil = " . $id_perfil . " AND id_usuario_app = " . $id_usuario_app;
        executeSQL_WS($sql_perfil_usuario); 
        return ( ['result' => 'ok', 
                'result_text' => 'Perfil eliminado del usuario exitosamente desde ExosAPP',
                'id_perfil' => $id_perfil,
                'id_usuario_app' => $id_usuario_app
                ] );
     }

     public function app_perfiles_usuarios_get(){
        $id_perfil = Requesting("id_perfil");
        $sql_usuarios_perfil = "select id_usuario_app from app_perfiles_usuarios where id_perfil = " . intval($id_perfil);
        $ds_usuarios_perfil = DatasetSQL_WS($sql_usuarios_perfil);
        $data = [];
        while ($row = mysqli_fetch_array($ds_usuarios_perfil)) {
            $data['item_' . $row['id_usuario_app']] = [
                'id_usuario_app' => $row['id_usuario_app']
            ];
        }
        return ( ['result' => 'ok',
                'result_text' => 'Usuarios del perfil obtenidos exitosamente desde ExosAPP',
                'data' => $data,
                ] );
     }

     public function app_usuarios_list(){
        $sql_usuarios = "select *, upper(trim(nombre)) as nombre_upper from usuario order by nombre_upper";
        $ds_usuarios = DatasetSQL($sql_usuarios);
        while ($row = mysqli_fetch_array($ds_usuarios)) {
            $id_usuario_app = $this->Sync_Usuario_App($row['id_usuario']);
            $data['item_' . $row['id_usuario']] = [
                'id_usuario' => $row['id_usuario'],
                'id_usuario_app' => $id_usuario_app,
                'nombre' => $row['nombre_upper'],
                'id_tipo_usuario' => $row['id_tipo_usuario'],
                'activo' => $row['activo']
            ];
        }
        return ( ['result' => 'ok',
                'result_text' => 'Usuarios obtenidos exitosamente desde ExosAPP',
                'data' => $data,
                ] );
    }

}
