<?php
//------------------------- variables globales --------------------
$DB_Host = "";
$DB_User = "";
$DB_Password = "";
$DB_Database ="";
$DB_Init_Params = false;

//*********************** INICIALIZA LOS PARAMETROS DE CONEXION CON LA BASE DE DATOS  ********************
function Init_DBParams(){
	global $DB_Host, $DB_User, $DB_Password, $DB_Database, $DB_Init_Params, $DB_Host;
	


//		$DB_Host ="localhost";
//		$DB_User = "root";
//		$DB_Password = "";
//		$DB_Database ="exorta";
//		$DB_Init_Params = true; 

	/*
	$DB_Host ="localhost";
	$DB_User = "creaccio_exorta"; 
	$DB_Password = "Ex0rt4*22#.!";
	$DB_Database ="creaccio_exorta";
	$DB_Init_Params = true;
*/


	//	$DB_Host ="localhost";
	//	$DB_User = "creaccio_exorta"; 
	//	$DB_Password = "Ex0rt4*22#.!";
	//	$DB_Database ="creaccio_exo2025";
	//	$DB_Init_Params = true;


	/* Google Cloud */
	//	$DB_Host ="localhost";
	//	$DB_User = "exos"; 
	//	$DB_Password = "FPLLDQFscbR4CQY";
	//	$DB_Database ="exos";
	//	$DB_Init_Params = true; 


	/* GOOGLE CLOUD EXOS.SOFTWARE */
	//	$DB_Host ="34.51.48.23";
	//	$DB_Host ="localhost";
	//	$DB_User = "oswaldo_exos01";
	//	$DB_Password = "Ex0._GC_2025#";
	//	$DB_Database ="oswaldo_exos01";
	//	$DB_Init_Params = true; 
	
	
	/* GOOGLE CLOUD EXOS.SOFTWARE */
	//	$DB_Host ="34.51.48.23";
	$DB_Host ="localhost";
	$DB_User = "exos_exos001"; 
	$DB_Password = "Ex0._GC_2025#"; 
	$DB_Database ="exos_exos001";
	$DB_Init_Params = true; 
	
	
}

?>
