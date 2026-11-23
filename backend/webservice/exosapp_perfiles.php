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
            'app_perfiles_clone' => [
                'descripcion' => 'Clona un perfil existente en la aplicación.',
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
                'descripcion' => 'Obtiene todos los módulos indicando cuáles tiene asignados el perfil (activo = 1).',
                'parameters' => ['id_perfil']
            ],
            'app_perfiles_permisos_update' => [
                'descripcion' => 'Actualiza los módulos asignados a un perfil. permisos = JSON [{id_modulo, activo}].',
                'parameters' => ['id_perfil', 'permisos (JSON)']
            ],
            'app_perfiles_tipos_list' => [
                'descripcion' => 'Obtiene la lista de Grupos de Perfiles (app_perfiles_tipos).',
                'parameters' => []
            ],
            'app_perfiles_tipos_info' => [
                'descripcion' => 'Obtiene un Grupo de Perfiles.',
                'parameters' => ['id_perfil_tipo']
            ],
            'app_perfiles_tipos_add' => [
                'descripcion' => 'Agrega un Grupo de Perfiles.',
                'parameters' => ['nombre', 'descripcion', 'activo']
            ],
            'app_perfiles_tipos_update' => [
                'descripcion' => 'Actualiza un Grupo de Perfiles.',
                'parameters' => ['id_perfil_tipo', 'nombre', 'descripcion', 'activo']
            ],
            'app_perfiles_tipos_clone' => [
                'descripcion' => 'Clona un Grupo de Perfiles con sus almacenes por módulo (no copia los usuarios asignados).',
                'parameters' => ['id_perfil_tipo']
            ],
            'app_perfiles_tipos_delete' => [
                'descripcion' => 'Elimina un Grupo de Perfiles (y sus asignaciones por cascada).',
                'parameters' => ['id_perfil_tipo']
            ],
            'app_perfiles_modulos_list' => [
                'descripcion' => 'Obtiene los perfiles activos con sus módulos (app_perfiles_modulos); una fila por perfil+módulo.',
                'parameters' => []
            ],
            'app_perfiles_tipos_modulos_get' => [
                'descripcion' => 'Obtiene los almacenes asignados por módulo dentro de un Grupo (app_perfiles_tipos_modulos; una fila por módulo+almacén).',
                'parameters' => ['id_perfil_tipo']
            ],
            'app_perfiles_tipos_modulos_update' => [
                'descripcion' => 'Asigna/quita almacenes de un módulo dentro de un Grupo. almacenes = JSON [{id_almacen, activo}].',
                'parameters' => ['id_perfil_tipo', 'id_modulo', 'almacenes (JSON)']
            ],
            'app_perfiles_usuario_get' => [
                'descripcion' => 'Obtiene los Grupos de Perfiles asignados a un usuario (app_perfiles_usuarios).',
                'parameters' => ['id_usuario_app']
            ],
            'app_perfiles_usuario_add' => [
                'descripcion' => 'Asigna un Grupo de Perfiles a un usuario.',
                'parameters' => ['id_perfil_tipo', 'id_usuario_app']
            ],
            'app_perfiles_usuario_delete' => [
                'descripcion' => 'Quita un Grupo de Perfiles a un usuario.',
                'parameters' => ['id_perfil_tipo', 'id_usuario_app']
            ],
            'app_almacenes_list' => [
                'descripcion' => "Obtiene la lista de almacenes.",
                "parameters" => []
            ],
            'app_usuarios_list' => [
                'descripcion' => "Obtiene la lista de usuarios de la aplicación (exosapp.user_profile + nombre de exos.usuario).",
                "parameters" => []
            ]        
        ];
    }
    public function app_perfiles_list(){
        $sql_perfiles = "select * from app_perfiles order by nombre";
        $ds_perfiles = DatasetSQL_WS($sql_perfiles);
        $data=[];
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

        // Un perfil nuevo no tiene módulos; se asignan con app_perfiles_permisos_update.

        return ( ['result' => 'ok',
                'result_text' => 'Perfil creado exitosamente desde ExosAPP',
                'id_perfil' => $id,
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
    public function app_perfiles_clone(){
        $id_perfil = Requesting("id_perfil");
        $sql_perfil = "insert into app_perfiles (nombre, descripcion, activo) select concat(nombre, ' (Copia)'), descripcion, activo from app_perfiles WHERE id = " . $id_perfil;
        $id_nuevo = ExecuteSQL_ReturnID_WS($sql_perfil);
        $sql_permisos = "insert into app_perfiles_modulos (id_perfil, id_modulo) select " . $id_nuevo . ", id_modulo from app_perfiles_modulos WHERE id_perfil = " . intval($id_perfil);
        ExecuteSQL_WS($sql_permisos);

        return ( ['result' => 'ok',
                'result_text' => 'Perfil clonado exitosamente desde ExosAPP',
                'id_perfil' => $id_nuevo,
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
            $id_perfil = intval(Requesting("id_perfil"));
            // Todos los módulos; activo = 1 si el perfil lo tiene en app_perfiles_modulos
            // (la existencia de la fila es el permiso). No interviene el almacén.
            $sql_permisos = "select md.id as id_modulo, md.modulo, 
                                    if(pm.id is null, 0, 1) as activo
                             from app_modulos md 
                             left join app_perfiles_modulos pm on pm.id_modulo = md.id and pm.id_perfil = " . $id_perfil . "
                             group by md.id
                             order by md.modulo";
            $ds_permisos = DatasetSQL_WS($sql_permisos);
            $data = [];
            while ($row = mysqli_fetch_array($ds_permisos)) {
                $data['item_' . $row['id_modulo']] = [
                    'id_perfil' => $id_perfil,
                    'id_modulo' => $row['id_modulo'],
                    'modulo' => $row['modulo'],
                    'activo' => $row['activo']
                ];
            }
            return ( ['result' => 'ok',
                    'result_text' => 'Permisos obtenidos exitosamente desde ExosAPP',
                    'data' => $data,                       
                    ] );
    }

    public function app_perfiles_permisos_update(){

        $id_perfil = intval(Requesting("id_perfil"));
        $permisos = Requesting("permisos");

        $lista = json_decode($permisos, true);
        if (!is_array($lista)) {
            return ['result' => 'error', 'result_text' => 'permisos inválido, se espera JSON'];
        }

        foreach ($lista as $permiso) {
            $id_modulo = intval($permiso['id_modulo']);
            if ($id_modulo <= 0) continue;
            $activo = intval($permiso['activo']) ? 1 : 0;
            $existe = GetValueSQL_WS("select count(id) as existe from app_perfiles_modulos where id_perfil = " . $id_perfil . " and id_modulo = '" . $id_modulo . "'", "existe");
            if ($activo && !$existe) {
                ExecuteSQL_WS("INSERT INTO app_perfiles_modulos (id_perfil, id_modulo) VALUES (" . $id_perfil . ", '" . $id_modulo . "')");
            } elseif (!$activo && $existe) {
                ExecuteSQL_WS("DELETE FROM app_perfiles_modulos WHERE id_perfil = " . $id_perfil . " AND id_modulo = '" . $id_modulo . "'");
            }
        }

        return ( ['result' => 'ok',
                'result_text' => 'Permisos actualizados exitosamente desde ExosAPP',
                'id_perfil' => $id_perfil,
                ] );
    }

    // ------------------------------------------------------------------
    // Grupos de Perfiles (app_perfiles_tipos)
    // ------------------------------------------------------------------
    public function app_perfiles_tipos_list(){
        $ds = DatasetSQL_WS("select * from app_perfiles_tipos order by nombre");
        $data = [];
        while ($row = mysqli_fetch_array($ds)) {
            $data['item_' . $row['id']] = [
                'id_perfil_tipo' => $row['id'],
                'nombre' => $row['nombre'],
                'descripcion' => $row['descripcion'],
                'activo' => $row['activo']
            ];
        }
        return ( ['result' => 'ok',
                'result_text' => 'Grupos de perfiles obtenidos exitosamente desde ExosAPP',
                'data' => $data,
                ] );
    }

    public function app_perfiles_tipos_info(){
        $id = intval(Requesting("id_perfil_tipo"));
        $ds = DatasetSQL_WS("select * from app_perfiles_tipos where id = " . $id);
        $row = mysqli_fetch_array($ds);
        if (!$row) {
            return ['result' => 'error', 'result_text' => 'El grupo de perfiles no existe.'];
        }
        return ( ['result' => 'ok',
                'result_text' => 'Grupo de perfiles obtenido exitosamente desde ExosAPP',
                'data' => [
                    'id_perfil_tipo' => $row['id'],
                    'nombre' => $row['nombre'],
                    'descripcion' => $row['descripcion'],
                    'activo' => $row['activo']
                ],
                ] );
    }

    public function app_perfiles_tipos_add(){
        $nombre = Requesting("nombre");
        $descripcion = Requesting("descripcion");
        $activo = intval(Requesting("activo")) ? 1 : 0;
        if (!$nombre) {
            return ['result' => 'error', 'result_text' => 'El nombre es obligatorio.'];
        }
        $id = ExecuteSQL_ReturnID_WS("INSERT INTO app_perfiles_tipos (nombre, descripcion, activo) VALUES ('" . $nombre . "', '" . $descripcion . "', " . $activo . ")");
        if (!$id) {
            return ['result' => 'error', 'result_text' => 'No se pudo crear el grupo de perfiles.'];
        }
        return ( ['result' => 'ok',
                'result_text' => 'Grupo de perfiles creado exitosamente desde ExosAPP',
                'id_perfil_tipo' => $id,
                ] );
    }

    public function app_perfiles_tipos_update(){
        $id = intval(Requesting("id_perfil_tipo"));
        $nombre = Requesting("nombre");
        $descripcion = Requesting("descripcion");
        $activo = intval(Requesting("activo")) ? 1 : 0;
        if (!$id || !$nombre) {
            return ['result' => 'error', 'result_text' => 'Grupo y nombre son necesarios.'];
        }
        ExecuteSQL_WS("UPDATE app_perfiles_tipos SET nombre = '" . $nombre . "', descripcion = '" . $descripcion . "', activo = " . $activo . " WHERE id = " . $id);
        return ( ['result' => 'ok',
                'result_text' => 'Grupo de perfiles actualizado exitosamente desde ExosAPP',
                'id_perfil_tipo' => $id,
                ] );
    }

    public function app_perfiles_tipos_clone(){
        $id = intval(Requesting("id_perfil_tipo"));
        if (!$id) {
            return ['result' => 'error', 'result_text' => 'Grupo es necesario.'];
        }
        $id_nuevo = ExecuteSQL_ReturnID_WS("insert into app_perfiles_tipos (nombre, descripcion, activo) select concat(nombre, ' (Copia)'), descripcion, activo from app_perfiles_tipos where id = " . $id);
        if (!$id_nuevo) {
            return ['result' => 'error', 'result_text' => 'No se pudo clonar el grupo de perfiles.'];
        }
        ExecuteSQL_WS("insert into app_perfiles_tipos_modulos (id_perfil_tipo, id_modulo, id_almacen) select " . intval($id_nuevo) . ", id_modulo, id_almacen from app_perfiles_tipos_modulos where id_perfil_tipo = " . $id);
        return ( ['result' => 'ok',
                'result_text' => 'Grupo de perfiles clonado exitosamente desde ExosAPP',
                'id_perfil_tipo' => $id_nuevo,
                ] );
    }

    public function app_perfiles_tipos_delete(){
        $id = intval(Requesting("id_perfil_tipo"));
        if (!$id) {
            return ['result' => 'error', 'result_text' => 'Grupo es necesario.'];
        }
        // Las asignaciones (app_perfiles_tipos_modulos, app_perfiles_usuarios) caen por ON DELETE CASCADE.
        ExecuteSQL_WS("DELETE FROM app_perfiles_tipos WHERE id = " . $id);
        return ( ['result' => 'ok',
                'result_text' => 'Grupo de perfiles eliminado exitosamente desde ExosAPP',
                'id_perfil_tipo' => $id,
                ] );
    }

    // Perfiles activos con sus módulos (para armar el árbol perfil -> módulo -> almacén)
    public function app_perfiles_modulos_list(){
        $ds = DatasetSQL_WS("select p.id as id_perfil, p.nombre as perfil, pm.id_modulo, md.modulo
                             from app_perfiles p
                             inner join app_perfiles_modulos pm on pm.id_perfil = p.id
                             left join app_modulos md on md.id = pm.id_modulo
                             where p.activo = 1
                             order by p.nombre, md.modulo");
        $data = [];
        while ($row = mysqli_fetch_array($ds)) {
            $data['item_' . $row['id_perfil'] . '_' . $row['id_modulo']] = [
                'id_perfil' => $row['id_perfil'],
                'perfil' => $row['perfil'],
                'id_modulo' => $row['id_modulo'],
                'modulo' => $row['modulo']
            ];
        }
        return ( ['result' => 'ok',
                'result_text' => 'Perfiles y módulos obtenidos exitosamente desde ExosAPP',
                'data' => $data,
                ] );
    }

    // Almacenes por módulo dentro de un Grupo (app_perfiles_tipos_modulos)
    public function app_perfiles_tipos_modulos_get(){
        $id = intval(Requesting("id_perfil_tipo"));
        $ds = DatasetSQL_WS("select id, id_modulo, id_almacen from app_perfiles_tipos_modulos where id_perfil_tipo = " . $id);
        $data = [];
        while ($row = mysqli_fetch_array($ds)) {
            $data['item_' . $row['id']] = [
                'id_modulo' => $row['id_modulo'],
                'id_almacen' => $row['id_almacen']
            ];
        }
        return ( ['result' => 'ok',
                'result_text' => 'Almacenes del grupo obtenidos exitosamente desde ExosAPP',
                'data' => $data,
                ] );
    }

    public function app_perfiles_tipos_modulos_update(){
        $id_tipo = intval(Requesting("id_perfil_tipo"));
        $id_modulo = intval(Requesting("id_modulo"));
        $lista = json_decode(Requesting("almacenes"), true);
        if (!$id_tipo || !$id_modulo || !is_array($lista)) {
            return ['result' => 'error', 'result_text' => 'Grupo, módulo y almacenes (JSON) son necesarios.'];
        }
        foreach ($lista as $it) {
            $id_almacen = intval($it['id_almacen']);
            if ($id_almacen <= 0) continue;
            $activo = intval($it['activo']) ? 1 : 0;
            $where = " where id_perfil_tipo = " . $id_tipo . " and id_modulo = '" . $id_modulo . "' and id_almacen = " . $id_almacen;
            $existe = GetValueSQL_WS("select count(id) as existe from app_perfiles_tipos_modulos" . $where, "existe");
            if ($activo && !$existe) {
                if (!ExecuteSQL_WS("INSERT INTO app_perfiles_tipos_modulos (id_perfil_tipo, id_modulo, id_almacen) VALUES (" . $id_tipo . ", '" . $id_modulo . "', " . $id_almacen . ")")) {
                    return ['result' => 'error', 'result_text' => 'No se pudo asignar el almacén.'];
                }
            } elseif (!$activo && $existe) {
                ExecuteSQL_WS("DELETE FROM app_perfiles_tipos_modulos" . $where);
            }
        }
        return ( ['result' => 'ok',
                'result_text' => 'Almacenes del módulo en el grupo actualizados exitosamente desde ExosAPP',
                'id_perfil_tipo' => $id_tipo,
                'id_modulo' => $id_modulo,
                ] );
    }

    // ------------------------------------------------------------------
    // Grupos de Perfiles asignados a un usuario (app_perfiles_usuarios)
    // ------------------------------------------------------------------
    public function app_perfiles_usuario_get(){
        $id_usuario_app = intval(Requesting("id_usuario_app"));
        $ds = DatasetSQL_WS("select pu.id, pu.id_perfil_tipo, t.nombre from app_perfiles_usuarios pu left join app_perfiles_tipos t on pu.id_perfil_tipo = t.id where pu.id_usuario_app = " . $id_usuario_app . " order by t.nombre");
        $data = [];
        while ($row = mysqli_fetch_array($ds)) {
            $data['item_' . $row['id']] = [
                'id' => $row['id'],
                'id_usuario_app' => $id_usuario_app,
                'id_perfil_tipo' => $row['id_perfil_tipo'],
                'nombre' => $row['nombre'],
            ];
        }
        return ( ['result' => 'ok',
                'result_text' => 'Grupos del usuario obtenidos exitosamente desde ExosAPP',
                'data' => $data,
                ] );
    }

    public function app_perfiles_usuario_add(){
        $id_tipo = intval(Requesting("id_perfil_tipo"));
        $id_usuario_app = intval(Requesting("id_usuario_app"));
        if (!$id_tipo || !$id_usuario_app) {
            return ['result' => 'error', 'result_text' => 'Grupo y usuario son necesarios.'];
        }
        $existe = GetValueSQL_WS("SELECT count(id) as existe FROM app_perfiles_usuarios WHERE id_perfil_tipo = " . $id_tipo . " AND id_usuario_app = " . $id_usuario_app, "existe");
        if ($existe > 0) {
            return ['result' => 'error', 'result_text' => 'El usuario ya tiene este grupo de perfiles.'];
        }
        if (!ExecuteSQL_WS("INSERT INTO app_perfiles_usuarios (id_usuario_app, id_perfil_tipo) VALUES (" . $id_usuario_app . ", " . $id_tipo . ")")) {
            return ['result' => 'error', 'result_text' => 'No se pudo asignar el grupo al usuario.'];
        }
        return ( ['result' => 'ok',
                'result_text' => 'Grupo asignado al usuario exitosamente desde ExosAPP',
                'id_perfil_tipo' => $id_tipo,
                'id_usuario_app' => $id_usuario_app,
                ] );
    }

    public function app_perfiles_usuario_delete(){
        $id_tipo = intval(Requesting("id_perfil_tipo"));
        $id_usuario_app = intval(Requesting("id_usuario_app"));
        if (!$id_tipo || !$id_usuario_app) {
            return ['result' => 'error', 'result_text' => 'Grupo y usuario son necesarios.'];
        }
        ExecuteSQL_WS("DELETE FROM app_perfiles_usuarios WHERE id_perfil_tipo = " . $id_tipo . " AND id_usuario_app = " . $id_usuario_app);
        return ( ['result' => 'ok',
                'result_text' => 'Grupo eliminado del usuario exitosamente desde ExosAPP',
                'id_perfil_tipo' => $id_tipo,
                'id_usuario_app' => $id_usuario_app,
                ] );
    }

     public function app_almacenes_list(){
        $ds_almacenes = DatasetSQL("select id_almacen, nombre, codigo from almacen order by codigo");
        $data = [];
        while ($row = mysqli_fetch_array($ds_almacenes)) {
            $data['item_' . $row['id_almacen']] = [
                'id_almacen' => $row['id_almacen'],
                'nombre' => $row['nombre'],
                'codigo' => $row['codigo']
            ];
        }
        return ( ['result' => 'ok',
                'result_text' => 'Almacenes obtenidos exitosamente desde ExosAPP',
                'data' => $data,
                ] );
     }

     public function app_usuarios_list(){
        // Lista basada en exosapp.user_profile; el nombre sale de exos.usuario
        // (son dos bases distintas, por eso dos consultas en vez de un JOIN).
        $ds_profiles = DatasetSQL_WS("select id_usuario_app, id_usuario from user_profile where id_usuario > 0");
        $perfiles = [];
        while ($row = mysqli_fetch_array($ds_profiles)) {
            $perfiles[intval($row['id_usuario'])] = intval($row['id_usuario_app']);
        }
        $data = [];
        if (!empty($perfiles)) {
            $ids = implode(",", array_keys($perfiles));
            $ds_usuarios = DatasetSQL("select id_usuario, usuario, id_tipo_usuario, activo, upper(trim(nombre)) as nombre_upper 
                                       from usuario where id_usuario in (" . $ids . ") order by nombre_upper");
            while ($row = mysqli_fetch_array($ds_usuarios)) {
                $data['item_' . $row['id_usuario']] = [
                    'id_usuario' => $row['id_usuario'],
                    'id_usuario_app' => $perfiles[intval($row['id_usuario'])],
                    'nombre' => $row['nombre_upper'],
                    'usuario' => $row['usuario'],
                    'id_tipo_usuario' => $row['id_tipo_usuario'],
                    'activo' => $row['activo']
                ];
            }
        }
        return ( ['result' => 'ok',
                'result_text' => 'Usuarios obtenidos exitosamente desde ExosAPP',
                'data' => $data,
                ] );
    }

}
