<?php

trait ExosApp_Chatclient
{
    public function listMethods_Chatclient()
    {
        return [
            'get_stream_token' => [
                'descripcion' => 'Obtiene un token de acceso para el usuario en la plataforma de GetStream.',
                'parameters' => ['id_usuario_app', 'alias_usuario']
            ]
        ];
    }
// ########################### GET STREAM TOKEN (FEEDS) #########################
    public function get_stream_token(){
        $id_usuario_app = Requesting("id_usuario_app");
        $alias_usuario  = Requesting("alias_usuario");

        if (!$id_usuario_app || !$alias_usuario) {
            return $this->DatosIncorrectos();
        }        
        return $this->get_stream_token_fn($id_usuario_app, $alias_usuario);
    }

    private function _init_get_stream() {              
        $client_keys = Stream_chat_key();

        // 2. Definición local de credenciales
        $apiKey    = $client_keys["apiKey"];
        $apiSecret = $client_keys["apiSecret"];
        $AppID = $client_keys["AppID"];

        return [
            'client'  => is_Stream_Chat_enabled() ?  new GetStream\StreamChat\Client($apiKey, $apiSecret) : 'CHAT_NOT_ENABLED',
            'api_key' => $apiKey,
            'AppID' => $AppID
        ];
    }

    public function get_stream_token_fn($id_usuario_app, $alias_usuario)
    {     
        // Inicializamos variables críticas para que existan siempre en el bloque return/catch
        $apiKey = '';
        $AppID = '';
        $token  = null;

        try {            
            $streamSetup  = $this->_init_get_stream();
            $streamClient = $streamSetup['client'];
            $apiKey       = $streamSetup['api_key'];
            $AppID        = $streamSetup['AppID'];

            $userIdStr = strval($id_usuario_app);

            // 4. Sincronizar metadatos del usuario en la plataforma de GetStream
            // Ajustado a la sintaxis estándar de la SDK de PHP para Feeds
            $streamClient->updateUser([
                'id'   => $userIdStr,
                'name' => strtoupper($alias_usuario),
                'role' => 'user'               
            ]);
            // 5. Generación del token para el usuario de la App
            $token = $streamClient->createToken($userIdStr);

            return [
                'result'       => 'ok',
                'result_text'  => 'Token generado correctamente.',
                'stream_token' => $token,
                'api_key'      => $apiKey,
                'AppID'        => $AppID,
                'chat_enabled' => is_Stream_Chat_enabled()
            ];

        } catch (\Exception $e) {
            return [
                'result'       => 'error',
                'result_text'  => 'Error en Stream: ' . $e->getMessage(),
                'stream_token' => null, // Evitamos el "Undefined variable"
                'api_key'      => $apiKey ,
                'AppID'        => $AppID,
                'chat_enabled' => 0             
            ];         
        }
    }   
}