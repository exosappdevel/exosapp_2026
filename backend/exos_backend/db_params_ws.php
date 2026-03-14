<?php
//------------------------- variables globales --------------------
$WS_DB_Host = "";
$WS_DB_User = "";
$WS_DB_Password = "";
$WS_DB_Database ="";
$WS_DB_Init_Params = false;

//*********************** INICIALIZA LOS PARAMETROS DE CONEXION CON LA BASE DE DATOS  ********************
function Init_DBParams_WS(){
	global $WS_DB_Host, $WS_DB_User, $WS_DB_Password, $WS_DB_Database, $WS_DB_Init_Params, $WS_DB_Host;
	$WS_DB_Host ="localhost";
	$WS_DB_User = "exos_exosapp"; 
	$WS_DB_Password = "ExosApp2026!"; 
	$WS_DB_Database ="exos_exosapp";
	$WS_DB_Init_Params = true; 
}

?>
