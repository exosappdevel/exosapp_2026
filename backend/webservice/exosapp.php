<?php
// 1. Configuraciones de Cabecera (CORS)

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Dependencias originales
require_once "../include/functions.php";
require_once "../include/db_tools.php";
require_once "../lib/nusoap.php";
require_once "../dompdf/autoload.inc.php";
require_once "../include/functions_ws.php";
require_once "../include/variables_globales.php";

require_once "exosapp_core.php";
require_once "exosapp_usuarios.php";
require_once "exosapp_chatclient.php";
require_once "exosapp_almacenes.php";
require_once "exosapp_catalogos.php";
require_once "exosapp_cirugias.php";
require_once "exosapp_piezas_danadas.php";
require_once "exosapp_perfiles.php";


date_default_timezone_set('America/Mexico_City');

/**
 * Clase para la funcionalidad real de la aplicación
 */
class ExosApp_WS
{
    use ExosApp_Core,ExosApp_Chatclient, ExosApp_Usuarios, ExosApp_Almacenes, ExosApp_Catalogos, ExosApp_Cirugias, ExosApp_PiezasDanadas, ExosApp_Perfiles;

    /**
     * Verifica si un método existe en esta clase
     * @param string $method_name Nombre del método a buscar
     * @return boolean
     */
    public $is_debuging=false;
    public $use_xml_envelope = true;
    public $metodos_info = [];

    public function listMethods_ExosApp(){        
        return [
                ...$this->listMethods_Chatclient(),
                ...$this->listMethods_Core(),
                ...$this->listMethods_Usuarios(),
                ...$this->listMethods_Almacenes(),
                ...$this->listMethods_Catalogos(),
                ...$this->listMethods_Cirugias(),
                ...$this->listMethods_PiezasDanadas(),
                ...$this->listMethods_Perfiles(),
        ];
    }
    public function formato_fecha_lectura($fecha_sql){  
        //2020-06-20 16:42:04
        $mes = "";
        $array_date = explode("-",$fecha_sql); /* Separa date */
        switch($array_date[1]){
            case "01": $mes = "Enero"; break;
            case "02": $mes = "Febrero"; break;
            case "03": $mes = "Marzo"; break;
            case "04": $mes = "Abril"; break; 
            case "05": $mes = "Mayo"; break;
            case "06": $mes = "Junio"; break;
            case "07": $mes = "Julio"; break;
            case "08": $mes = "Agosto"; break;
            case "09": $mes = "Septiembre"; break;
            case "10": $mes = "Octubre"; break;
            case "11": $mes = "Noviembre"; break;
            case "12": $mes = "Diciembre"; break;
        }
        $fecha_lectura = $array_date[2] ." ". $mes. " " .$array_date[0];
        return $fecha_lectura;
    } 
}
