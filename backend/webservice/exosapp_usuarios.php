<?php

trait ExosApp_Usuarios
{
    public function listMethods_Usuarios()
    {
        return [
            'inicia_sesion' => [
                'descripcion' => 'Inicia sesión en la aplicación y devuelve información del usuario.',
                'parameters' => ['login_usuario', 'login_password']
            ],
            'save_profile' => [
                'descripcion' => 'Guarda la configuración del perfil del usuario en la aplicación.',
                'parameters' => ['id_usuario_app', 'tema', 'app_language', 'menu_favorites']
            ]
        ];
    }
    public function inicia_sesion()
    {       
        $login_usuario = Requesting("login_usuario");
        $login_password = Requesting("login_password");

        if (!$login_usuario || !$login_password) {
            return $this->DatosIncorrectos();
        }

        // Se mantiene la lógica de tu archivo original con md5
        $query = "SELECT COUNT(u.id_usuario) AS existe, u.id_usuario, u.id_almacen, u.usuario, u.activo, a.nombre as almacen_nombre, a.codigo as almacen_codigo 
                FROM usuario u left join almacen a on u.id_almacen=a.id_almacen
                WHERE u.usuario = '" . $login_usuario . "' AND u.password = '" . md5($login_password) . "'";

        $existe = GetValueSQL($query, "existe");

        if ($existe == 0) {
            return[
                'result' => 'error',
                'result_text' => "Usuario o Contraseña incorrectos."
            ];            
        }
        $id_usuario = GetValueSQL($query, "id_usuario");
        $this->result =
            [
                'result' => 'ok',
                'id_usuario' => $id_usuario,
                'id_almacen' => GetValueSQL($query, "id_almacen"),
                'almacen_nombre' => GetValueSQL($query, "almacen_nombre"),
                'almacen_codigo' => GetValueSQL($query, "almacen_codigo"),
                'alias_usuario' => GetValueSQL($query, "usuario"),
                'result_text' => 'Acceso correcto'
            ];
    

        try {
            
            $id_tipo_usuario = GetValueSQL("select u.id_tipo_usuario, t.tipo_usuario from usuario u left join tipo_usuario t on u.id_tipo_usuario=t.id_tipo_usuario where u.id_usuario=" .$id_usuario ,'id_tipo_usuario');
            $tipo_usuario = GetValueSQL("select u.id_tipo_usuario, t.tipo_usuario from usuario u left join tipo_usuario t on u.id_tipo_usuario=t.id_tipo_usuario where u.id_usuario=" .$id_usuario ,'tipo_usuario');

            $query = "SELECT count(id_usuario_app) as existe, u.* 
                FROM user_profile u
                WHERE id_usuario = " . $id_usuario;

            $existe = GetValueSQL_WS($query, "existe");
            if ($existe == 0) {
                $sql_new = "insert into user_profile(id_usuario_app,id_usuario) values (0," . $id_usuario . ")";
                if (!ExecuteSQL_WS($sql_new)) {
                    $this->result["sql_error"] = $sql_new;
                }
            }

            $id_usuario_app = GetValueSQL_WS($query, "id_usuario_app");            
            $tema = GetValueSQL_WS($query, "tema");
            $app_language = GetValueSQL_WS($query, "app_language"); 
            $menu_favorites = GetValueSQL_WS($query, "menu_favorites"); 

            // --- menus
            $sSQL_menus_usuario = 'select * from tipo_usuario_menus where id_tipo_usuario=' .  $id_tipo_usuario;   
            $records_menu_usuario = DatasetSQL_WS($sSQL_menus_usuario);
            
            while ($row_menu_usuario = mysqli_fetch_array($records_menu_usuario)) {
                $sSQL_menus = "SELECT * FROM app_menus order by menu";
                $records_menus = DatasetSQL_WS($sSQL_menus);                

                $this->result["menu_count"] = $records_menus->num_rows;    
                $menus_text = "";

                while ($row = mysqli_fetch_array($records_menus)) {
                    $menu_field = $row['menu'];
                    $menus_text =  $menus_text . (($menus_text=="" ? "":";") . $menu_field);
                    $menu_items_all =$row['items_all'];
                    $menu_items_default =$row['items_default'];
                    if ($row_menu_usuario[$menu_field] == "")
                       $this->result["menu_" . $menu_field] = $menu_items_default;
                    else if ($row_menu_usuario[$menu_field] == "ALL")
                        $this->result["menu_" . $menu_field] = $menu_items_all;
                    else
                        $this->result["menu_" . $menu_field] =$row_menu_usuario[$menu_field];
                }
                $this->result["menus"] = $menus_text;    
            }
            

        } catch (Exception $e) {
            $id_usuario_app = 0;
            $tema = "light";
            $app_language ="es";            
            $this->result["exception"] = 'Excepción recibida: ' . $e->getMessage();
        }

        $this->result["id_tipo_usuario"] = $id_tipo_usuario;
        $this->result["tipo_usuario"] = $tipo_usuario;
        $this->result["id_usuario_app"] = $id_usuario_app;
        $this->result["tema"] = $tema;
        $this->result["app_language"] = $app_language;
        $this->result["menu_favorites"] = $menu_favorites;
        if ($this->is_debuging)
            $this->result["environment"] = $this->get_enviroment(true);

        // ------ chat token
        $chat_client = $this->get_stream_token_fn($id_usuario_app, $this->result["alias_usuario"]);
        $this->result["chat_client_enabled"] =  $chat_client["chat_enabled"]?1:0;
        $this->result["chat_client_connected"] =  $chat_client["result"]=="ok"?1:0;
        $this->result["chat_client_result_text"] = $chat_client["result_text"];
        $this->result["chat_client_stream_token"] = $chat_client["stream_token"];
        $this->result["chat_client_api_key"] = $chat_client["api_key"];
        $this->result["chat_client_appid"] = $chat_client["AppID"];
        return ($this->result);
    }
    public function save_profile()
    {
        $id_usuario_app = Requesting("id_usuario_app");
        $tema = Requesting("tema");
        $app_language = Requesting("app_language");
        $menu_favorites = Requesting("menu_favorites");

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
}
