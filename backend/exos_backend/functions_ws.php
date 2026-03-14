<?php 
require_once "db_params_ws.php";


error_reporting(E_ALL ^ E_DEPRECATED);

function DatasetSQL_WS($sSQL){
	global $WS_DB_Host, $WS_DB_User, $WS_DB_Password, $WS_DB_Database, $WS_DB_Init_Params, $WS_DB_Host;
    Init_DBParams_WS();
   $dbConx = mysqli_connect($WS_DB_Host,$WS_DB_User,$WS_DB_Password,$WS_DB_Database);
   $ret = DatasetSQL_con($sSQL,$dbConx);
   mysqli_close($dbConx);
   return $ret;
}
function GetValueSQL_WS($sSQL,$sFieldname){
	global $WS_DB_Host, $WS_DB_User, $WS_DB_Password, $WS_DB_Database, $WS_DB_Init_Params, $WS_DB_Host;
	Init_DBParams_WS();
	$rsTemp=null;
	$dbConx = mysqli_connect($WS_DB_Host,$WS_DB_User,$WS_DB_Password,$WS_DB_Database);
	$rsTemp=DatasetSQL_con($sSQL,$dbConx);
	if ($rsTemp!=null){
		$row = mysqli_fetch_array($rsTemp);
		$Value = $row[$sFieldname];
		mysqli_free_result($rsTemp);		
		mysqli_close($dbConx);
		return $Value;
	}
	else {
		//echo "erroe:";
		return null;
	}
}

function ExecuteSQL_WS($sSQL){
	global $WS_DB_Host, $WS_DB_User, $WS_DB_Password, $WS_DB_Database, $WS_DB_Init_Params, $WS_DB_Host;
	Init_DBParams_WS();
    $dbConx = mysqli_connect($WS_DB_Host,$WS_DB_User,$WS_DB_Password,$WS_DB_Database);
 	try {
 		$rsTemp=DatasetSQL_con($sSQL,$dbConx);
 		mysqli_close($dbConx);
 		return true;	
 	} catch (Exception $e) {
 		 echo $e->getMessage();
 		return false;
 	}
}

//********************************************************************************************
?>