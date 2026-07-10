<?php

	class Conexion extends PDO 
	{
		private $hostBd = "localhost";
		private $nombreBd = "creaccio_exorta";
		private $usuarioBd = "creaccio_exorta";
		private $passwordBd = "Ex0rt4*22#.!";  
		
		public function __construct()
		{
			try{
				parent::__construct('mysql:host='.$this->hostBd.';dbname='
				.$this-> nombreBd . ';charset=utf8', $this->usuarioBd, 
				$this->passwordBd, array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION));
			}catch(PDOException $e){
				echo 'Error::'. $e->getMessage();
			}
			
		}
		
	}
	


	//	$DB_Host ="localhost";
	//	$DB_User = "creaccio_exorta"; 
	//	$DB_Password = "Ex0rt4*22#.!";
	//	$DB_Database ="creaccio_exorta";
	//	$DB_Init_Params = true;
	
?>