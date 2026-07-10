<?php

	include 'conection.php';
	
	$pdo = new Conexion();
	$pdo2 = new Conexion();
	
	if($_SERVER['REQUEST_METHOD'] == 'GET'){
		
		/* obtener información */
		 
		if(isset($_GET['codigo']))
		{
			$sql = $pdo->prepare("SELECT cliente.alias, carpeta.id_llegada 
				FROM carpeta 
				INNER JOIN cliente ON (cliente.id_cliente = carpeta.id_cliente)
				WHERE codigo=:codigo");
			$sql->bindValue(':codigo', $_GET['codigo']);
			$sql->execute(); 
			$sql->setFetchMode(PDO::FETCH_ASSOC);
			header("HTTP/1.1 200 OK");
			echo json_encode($sql->fetchAll());
			exit;
		} 
		
		/* arroja todas las carpetas */
		
		//	else{		
		//		$sql = $pdo->prepare("SELECT codigo, nombre, texto, descripcion, texto_corto, id_categoria, id_marca, costo_regular, costo, inventario, estatus FROM productos");
		//		$sql->execute();
		//		$sql->setFetchMode(PDO::FETCH_ASSOC);
		//		header("HTTP/1.1 200 OK");
		//		echo json_encode($sql->fetchAll());
		//		exit;
		//	}
		
	}
	
	//			if($_SERVER['REQUEST_METHOD'] == 'POST'){		
	//				/* dar de alta productos */			
	//				
	//				/* primero valida que no exista codigo*/
	//				$existe = 0;
	//				$sql1 = $pdo->prepare("SELECT COUNT(id_producto) AS existe FROM productos WHERE codigo=:codigo");
	//				$sql1->bindValue(':codigo', $_POST['codigo']);
	//				$sql1->execute();
	//				$existe = $sql1->fetchColumn();
	//				
	//				if($existe == 0){
	//					$sql = "INSERT INTO productos (codigo, nombre, texto, descripcion, texto_corto, id_categoria, 
	//					id_marca, costo_regular, costo, inventario, estatus) VALUES (:codigo, :nombre, :texto,
	//					:descripcion, :texto_corto, :id_categoria, :id_marca, :costo_regular, :costo, 
	//					:inventario, :estatus)";
	//					
	//					$stmt = $pdo2->prepare($sql);
	//					$stmt->bindValue(':codigo', $_POST['codigo']);
	//					$stmt->bindValue(':nombre', $_POST['nombre']); 
	//					$stmt->bindValue(':texto', $_POST['texto']);
	//					$stmt->bindValue(':descripcion', $_POST['descripcion']);
	//					$stmt->bindValue(':texto_corto', $_POST['texto_corto']);
	//					$stmt->bindValue(':id_categoria', $_POST['id_categoria']);
	//					$stmt->bindValue(':id_marca', $_POST['id_marca']);
	//					$stmt->bindValue(':costo_regular', $_POST['costo_regular']);
	//					$stmt->bindValue(':costo', $_POST['costo']);
	//					$stmt->bindValue(':inventario', $_POST['inventario']);
	//					$stmt->bindValue(':estatus', $_POST['estatus']);
	//					$stmt->execute(); 
	//					$idPost = $pdo2->lastInsertId();
	//					if($idPost){
	//						header("HTTP/1.1 200 OK");
	//						echo json_encode($idPost);
	//						exit;
	//					}			
	//				}else{
	//					header("HTTP/1.1 200 no_valido");
	//					echo "El codigo enviado ya existe";
	//					exit;
	//				}	
	//				
	//				
	//			}
	//			
	//			if($_SERVER['REQUEST_METHOD'] == 'PUT'){
	//				
	//				$sql = "UPDATE productos SET inventario=:inventario WHERE codigo=:codigo";	
	//				$stmt = $pdo->prepare($sql);
	//				$stmt->bindValue(':inventario', $_GET['inventario']);
	//				$stmt->bindValue(':codigo', $_GET['codigo']);
	//				$stmt->execute();
	//				header("HTTP/1.1 200 OK");
	//				echo json_encode($_GET['codigo']); 
	//				exit;		
	//			}
	//			
	//			if($_SERVER['REQUEST_METHOD'] == 'DELETE'){ 
	//						
	//				$sql = "DELETE FROM productos WHERE codigo=:codigo"; 				
	//				$stmt = $pdo->prepare($sql);
	//				$stmt->bindValue(':codigo', $_GET['codigo']);
	//				$stmt->execute();
	//				header("HTTP/1.1 200 OK");
	//				exit;
	//				
	//				
	//			}
	
?>