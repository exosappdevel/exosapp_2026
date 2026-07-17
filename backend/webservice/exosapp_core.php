<?php
trait ExosApp_Core
{
    public function listMethods_Core()
    {
        return [
            'metodo_ejemplo' => [
                'descripcion' => 'Método de ejemplo para ilustrar la estructura de los métodos.',
                'parameters' => ['id']
            ]
        ];
    }
    public function Implemented($method_name)
    {
        return method_exists($this, $method_name);
    }

    private function DatosIncorrectos()
    {
        $input = $_SERVER['QUERY_STRING'];
        return ([
            'result' => 'error',
            'parametros' => $input,
            'result_text' => "Datos incorrectos"
        ]);
    }
        // --- get_enviroment -
    private function get_enviroment($logged){
        global $WS_DB_USE_LOCAL, $STREAM_CHAT_APP_NAME;
        if (!$logged) {
            return ["env"=>""]; 
        }
        return [
            "__DIR_" => __DIR__,            
            "STREAM_CHAT_APP_NAME" => $STREAM_CHAT_APP_NAME            
         ];
    } 

    private function Get_Tipo_Usuario($id_usuario){
        $query_tu = "SELECT t.tipo_usuario FROM tipo_usuario t left join usuario u on t.id_tipo_usuario=u.id_tipo_usuario WHERE u.id_usuario = " . $id_usuario;
	    $tipo_de_usuario = GetValueSQL($query_tu,"tipo_usuario");
        return $tipo_de_usuario;
    }

    private function SQLDate($dateStr) {
        if (!$dateStr) return "";
        // Creamos el objeto desde el formato específico dd/mm/yyyy
        $dateObj = DateTime::createFromFormat('d/m/Y', $dateStr);
        // Retornamos en formato yyyy-mm-dd para el SQL
        return $dateObj ? $dateObj->format('Y-m-d') : $dateStr;
    }

    private function Existe_usuario_en_App($id_usuario)
    {
        $query = "SELECT COUNT(id_usuario_app) AS existe, Max(id_usuario_app) AS max_id FROM user_profile WHERE id_usuario = " . $id_usuario;
        $existe = GetValueSQL_WS($query, "existe");
        $id_usuario_app = GetValueSQL_WS($query, "max_id");
        return ($existe > 0 ? $id_usuario_app : 0);
    }

    private function Sync_Usuario_App($id_usuario)
    {
        $id_usuario_app = $this->Existe_usuario_en_App($id_usuario);
        if ($id_usuario_app > 0) {
            return $id_usuario_app; // Ya existe, no es necesario sincronizar
        }

        
        $sql_new = "insert into user_profile(id_usuario_app,id_usuario) values (0," . $id_usuario . ")";
        $id_usuario_app = ExecuteSQL_ReturnID_WS($sql_new);
        return $id_usuario_app;            
    }

    public function metodo_ejemplo()
    {
        $id = Requesting("id");
        if (!$id) {
            return ['result' => 'error', 'result_text' => 'ID no valido'];
        }
        return [
            'result' => 'ok',
            'id' => $id,
            'result_text' => 'Metodo ejecutado exitosamente'
        ];
    }

}
