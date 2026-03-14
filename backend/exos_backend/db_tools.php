<?php
require_once "functions.php";

//error_reporting(E_ALL ^ E_DEPRECATED);
function mysqli_Types_to_CDS($tipo,$size){
	switch ($tipo) {
		case 'string': return 'string';	break;		
		case 'int':  return ($size==20)?'i8': 'i4'; break;
		case 'real':	return 'r4'; break;
		case 'double':	return 'r8'; break;
		case 'date': return 'date';	break;		
		case 'time': return 'time';	break;		
		case 'datetime': return 'datetime';	break;		
		case 'timestamp': return 'string';	break;	
		case 'blob': return 'bin.hex" SUBTYPE="Binary'; break;	
		default: return $tipo; break;
	}
}
function Dataset_To_XMLCDS_File($sSQL){
	$result = datasetSQL($sSQL);
	$fields = mysqli_num_fields($result);
	$sRet = '<?xml version="1.0" encoding="UTF-8"?>';
	$sRet = $sRet .  ' <DATAPACKET Version="2.0"><METADATA>';
	$sRet = $sRet .  '<FIELDS>';
	for ($i=0; $i < $fields; $i++) {
	    $type  = mysqli_field_type($result, $i);
	    $name  = mysqli_field_name($result, $i);
	    $len   = mysqli_field_len($result, $i);
	    //$flags = mysqli_field_flags($result, $i);
	    $sRet = $sRet .  '<FIELD attrname="'. $name . '" fieldtype="' . mysqli_Types_to_CDS($type,$len) .'" ';
        if ($type=='string')
        	$sRet = $sRet .  ' width="' . $len .'"';
        if ($type=='timestamp')
        	$sRet = $sRet .  ' width="20"';
        $sRet = $sRet .  "/>";
	}
	$sRet = $sRet .  '</FIELDS>';
	//<FIELD attrname="codigo_articulo" fieldtype="string" width="200/><FIELD attrname="existencia_disponible" fieldtype="r4"/><FIELD attrname="unidad_precio" fieldtype="string" width="10"/></FIELDS>
	$sRet = $sRet .  "<PARAMS /></METADATA>";
	$sRet = $sRet .  "<ROWDATA>";
	while ($row = mysqli_fetch_array($result)){
		$sRet = $sRet .  "<ROW ";
		for ($i=0; $i < $fields; $i++) {
				$type  = mysqli_field_type($result, $i);
			    $name  = mysqli_field_name($result, $i);
			    if ($type=="datetime") {
			    	$sval = "".$row[$name];			    	
			    	$sval =  str_replace("-", "/", $sval);
			    	if($sval!="")
				  $sRet = $sRet .  $name . '="' . $sval .'" ';
			    }
			   	else
			    	$sRet = $sRet .  $name . '="' . $row[$name] .'" ';
		}
		$sRet = $sRet .  "/>";
	}
	$sRet = $sRet .  "</ROWDATA></DATAPACKET>";
	return $sRet;
}

function Dataset_To_XMLCDS($sSQL){
	header('Content-type: text/xml');
	echo Dataset_To_XMLCDS_File($sSQL);	
}

function Dataset_To_XML($sSQL){
	header('Content-type: text/xml');
	echo Dataset_To_XML_File($sSQL);	
}
function Dataset_To_XML_File($sSQL){
$result = datasetSQL($sSQL);
	$fields = mysqli_num_fields($result);
	$sRet = '<?xml version="1.0" encoding="UTF-8"?>';
	$sRet = $sRet . "<rows>";
	while ($row = mysqli_fetch_array($result)){
		$sRet = $sRet .  "<row>";
		for ($i=0; $i < $fields; $i++) {
			    $name  = mysqli_field_name($result, $i);
			    if(mysqli_field_type($result, $i)=="string")
			    	$sRet = $sRet . '<' . $name . '> ' . CDATA($row[$name]) .'</' . $name . '>';
			   	else
			    	$sRet = $sRet . '<' . $name . '> ' . $row[$name] .'</' . $name . '>';
		}
		$sRet = $sRet . "</row>";
	}
	$sRet = $sRet . "</rows>";
	return $sRet;
}
function Datarow_To_XML_File($sSQL){
$result = datasetSQL($sSQL);
	$fields = mysqli_num_fields($result);
	$sRet = '<?xml version="1.0" encoding="UTF-8"?>';
	if ($row = mysqli_fetch_array($result)){
		$sRet = $sRet .  "<row>";
		for ($i=0; $i < $fields; $i++) {
			    $name  = mysqli_field_name($result, $i);
			    if(mysqli_field_type($result, $i)=="string")
			    	$sRet = $sRet . '<' . $name . '> ' . CDATA($row[$name]) .'</' . $name . '>';
			   	else
			    	$sRet = $sRet . '<' . $name . '> ' . $row[$name] .'</' . $name . '>';
		}
		$sRet = $sRet . "</row>";
	}
	return $sRet;
}
function Get_Sub_array($data){
	if(!is_array($data))
		return '';
	$sRet = '';
	foreach ($data as $key => $value) {
		if(is_array($value))
			$sRet = $sRet . '<' . $key . '>'. Get_Sub_array($value). '</' . $key .'>';
		else
			$sRet = $sRet . '<' . $key . '>'. CDATA($value) . '</' . $key .'>'; 
	}
	return $sRet;
}
function XML_Envelope_Text($Valores,$root='response'){
        $sRet = '<?xml version="1.0" encoding="UTF-8"?>';
	$sRet = $sRet . '<'.$root.'>';
  	/*foreach ($Valores as $key => $value) {
  		$sRet = $sRet . '<' . $key . '>'. CDATA($value) . '</' . $key .'>';
  	}*/
  		$sRet = $sRet . Get_Sub_array($Valores);
  	$sRet = $sRet . '</'.$root.'>';
  	return $sRet;
}

function XML_Envelope($Valores,$root='response'){
	header('Content-type: text/xml; charset=UTF-8');
	echo XML_Envelope_Text($Valores,$root);
}

function Dataset_To_JSON($sSQL){
	//header('Content-type: text/xml');
	header('Content-type: application/json');
    $result = datasetSQL($sSQL);
	$fields = mysqli_num_fields($result);
	$rows   = mysqli_num_rows($result);
	$sRet = "<root>";
	/*$sRet = $sRet ."<sql>".$sSQL."</sql>";	
	$sRet = $sRet ."<count>".$rows."</count>";*/	
	$sRet = $sRet . "<rows>";
	while ($row = mysqli_fetch_array($result)){
		$sRet = $sRet . "<row>";
		for ($i=0; $i < $fields; $i++) {
			    $name  = mysqli_field_name($result, $i);
			    if(mysqli_field_type($result, $i)=="string")
			    	$sRet = $sRet . '<' . $name . '> ' . ($row[$name]) .'</' . $name . '>';
			   	else
			    	$sRet = $sRet . '<' . $name . '> ' . $row[$name] .'</' . $name . '>';
		}
		$sRet = $sRet . "</row>";
	}
	$sRet = $sRet . "</rows></root>";
    //echo $sRet;    
    $xXml = simplexml_load_string($sRet);
    echo json_encode($xXml);
}

function JSON_Envelope($Valores){
	header('Content-type: application/json');
	$sXML= simplexml_load_string( XML_Envelope_Text($Valores));
        echo json_encode($sXML);
}

function Datarow_To_Table($sSQL,$only_det){
	$result = datasetSQL($sSQL);
	$fields = mysqli_num_fields($result);
	$sRet = '';
	$sHeads ="<tr>";
	$fields_info = $result->fetch_fields();
	foreach ($fields_info as $field_info) {
		    $name  = $field_info->name;
		    $sHeads = $sHeads . '<th>' . $name . '</th> ';
	}	
	$sHeads = $sHeads . '</tr>';
			    
	while ($row = mysqli_fetch_array($result)){
		$sRet = $sRet .  "<tr>";		
		for ($i=0; $i < $fields; $i++) {
			    $sRet = $sRet . '<td>' . $row[$i] .'</td>';
		}
		$sRet = $sRet . "</tr>";
	}	
	
	if($only_det)
		return $sRet;
	else
		return "<table>" .  $sHeads . $sRet . "</table>";
}
?>