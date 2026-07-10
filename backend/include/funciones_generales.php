<?php




function registra_movimiento_almacen($id_inventario, $tipo, $cantidad_antes, $cantidad_manipulada, $cantidad_despues, $comentarios){
	$query_mov = "INSERT INTO movimiento_almacen (id_inventario, tipo, cantidad_antes, cantidad_manipulada, cantidad_despues, comentarios, kardex, id_usuario_kardex) 
			VALUES (".$id_inventario.", ".$tipo.", ".$cantidad_antes.",".$cantidad_manipulada.",".$cantidad_despues.", '".$comentarios."', NOW(), ".$_SESSION['id_sesion'].")";  
	ExecuteSQL($query_mov);  	
}


?>