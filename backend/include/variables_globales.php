<?php	
	/* variables globales */ 
	/* version USUARIOS v1 */	
		$tipo_usuario_sistemas 				= "SISTEMAS"; 
		$tipo_usuario_administrador 		= "Administrador"; 
		$tipo_usuario_mesa_de_control 		= "Mesa de Control"; 
		$tipo_usuario_vendedor 				= "Vendedor"; 
		$tipo_usuario_logistica 			= "Logistica"; 
		$tipo_usuario_almacen 				= "Almacen"; 
		$tipo_usuario_gerente 				= "Gerente";  
		$tipo_usuario_almacen_productos 	= "Almacen y Productos"; 
		$tipo_usuario_vidente 				= "Vidente";  
		$tipo_usuario_entregas 				= "Entregas";   
		$tipo_usuario_recepcion 			= "Recepcion";  
		$tipo_usuario_fabricante 			= "Fabricante";   
		$tipo_usuario_log_administrativa 	= "Logistica Administrativa";   
		
	/* version USUARIOS v2 */
	$tipo_usuario_general 				= "GENERAL"; /* verificar funcion */
	$tipo_usuario_administrador 		= "ADMINISTRADOR"; 
	$tipo_usuario_administrador 		= "ADMINISTRACION"; 
	$tipo_usuario_remisiones 			= "REMISIONES"; 
	$tipo_usuario_facturacion 			= "FACTURACION"; 
	$tipo_usuario_cobranza 				= "COBRANZA"; 
	$tipo_usuario_contabilidad 			= "CONTABILIDAD"; 
	$tipo_usuario_creador_carpetas 		= "CREADOR DE CARPETAS"; 
	$tipo_usuario_logistica 			= "LOGISTICA"; 
	$tipo_usuario_almacen 				= "ALMACEN"; 
	$tipo_usuario_autoridad_almacen 	= "AUTORIDAD DEL ALMACEN";  
	$tipo_usuario_recepcion 			= "RECEPCION";  
	$tipo_usuario_lavado 				= "LAVADO";   
	$tipo_usuario_ceye 					= "CEyE";  
	$tipo_usuario_vendedor 				= "VENTAS"; 
	$tipo_usuario_tecnico 				= "TECNICO"; 
	$tipo_usuario_base_datos 			= "BASE DE DATOS"; 
	$tipo_usuario_maestro_logistica 	= "MAESTRO DE LOGICA"; 
	$tipo_usuario_talento_humano 		= "TALENTO HUMANO";  
	$tipo_usuario_superadmin 			= "SUPERADMIN"; 
	$tipo_usuario_subdistribuidor 		= "SUBDISTRIBUIDOR"; 
	$tipo_usuario_cleared_almacen 		= "CLEARED ALMACEN"; 
	$tipo_usuario_cleared_logistica 	= "CLEARED LOGISTICA";  
	$tipo_usuario_cleared_ceye_azul 	= "CLEARED CEyE AZUL"; 
	$tipo_usuario_cleared_ceye_roja 	= "CLEARED CEyE ROJA"; 
	$tipo_usuario_cleared_recepcion 	= "CLEARED RECEPCIÓN DE MATERIAL"; 
	$tipo_usuario_cleared_asistencia 	= "CLEARED ASISTENCIA TÉCNICA"; 
	$tipo_usuario_sistemas 				= "SISTEMAS"; 
	$tipo_usuario_gerente 				= "GERENTE";  
	
	/* PRÓXIMOS A DEFINIR*/
	//	$tipo_usuario_tecnico 				= "TECNICO"; 
	//	$tipo_usuario_mesa_de_control 		= "Mesa de Control"; 
	//	$tipo_usuario_gerente 				= "Gerente";  
	//	$tipo_usuario_almacen_productos 	= "Almacen y Productos"; 
	//	$tipo_usuario_vidente 				= "Vidente";  
	//	$tipo_usuario_entregas 				= "Entregas";   
	//	$tipo_usuario_fabricante 			= "Fabricante";   
	//	$tipo_usuario_log_administrativa 	= "Logistica Administrativa";   	
	
	$valor_global 			= "global"; 
	$estatus_en_cirugia 	= "En Cirugia";
	$estatus_listo 			= "Listo para Entregar"; 
	$estatus_resurtir		= "Necesita Resurtir";
	$estatus_lavar			= "Se necesita Lavar";
	$estatus_vendido		= "VENDIDO"; 
	
	//	$ruta_archivos_pdf_generados 	= "https://exo2.creaccionesweb.com/archivos_pdf_generados/";  
	//	$ruta_archivos_pdf_generados 	= "https://exorta.creaccionesweb.com/archivos_pdf_generados/";  
	//	$ruta_archivos_pdf_generados 	= "http://localhost/exorta/erp/archivos_pdf_generados/";  
	$ruta_archivos_pdf_generados 	= "http://exorta.exos.software/archivos_pdf_generados/";  
	
	$pedido_estatus_fincado 	= "Fincado";
	$pedido_estatus_solicitado 	= "Solicitado a Fábrica";
	$pedido_estatus_transito 	= "En Tránsito";
	$pedido_estatus_arribo 		= "Arribo";
	$pedido_estatus_finalizado 	= "Finalizado";
	  
	/*vacaciones*/
	$vacaciones_estatus_solicitada 	= "Solicitada";
	$vacaciones_estatus_autorizada 	= "Autorizada";  
	$vacaciones_estatus_tomada 		= "Tomada";
	$vacaciones_estatus_cancelada 	= "Cancelada";
	$vacaciones_estatus_rechazada 	= "Rechazada";
	
	/*Bultos / CEyE*/
	$bulto_estatus_generado 		= "Generado";
	$bulto_estatus_esterilizado 	= "Esterilizado";  
	$bulto_estatus_encirugia 		= "En cirugia";
	$bulto_estatus_enproceso 		= "En proceso"; 
	$bulto_estatus_cancelado 		= "Cancelado";
	
	/* facturas entradas*/	  
	$estatus_factura_nueva 		= 1;
	$estatus_factura_finalizada = 2;   
			
	$estatus_caja_entrada_activa 	= 1;
	$estatus_caja_entrada_archivada = 2; 
			 
	//	$PNG_WEB_DIR = 'https://exorta.creaccionesweb.com/codigos_qr';
	$PNG_WEB_DIR = 'https://exorta.exos.software/codigos_qr';
	//	$PNG_WEB_DIR = 'codigos_qr';
	//	$PNG_WEB_DIR = 'http://localhost/exorta/erp/codigos_qr';
	
	//	$url_base = "https://exo2.creaccionesweb.com/";
	$url_base = "http://exorta.dvl.to/";
	//	$url_base = "https://exorta.creaccionesweb.com/";
	//$url_base = "https://exorta.exos.software/";
	
	$subdistribuidor_no_aplica 		= "00 NO APLICA";
	$subdistribuidor_no_registrado 	= "01 NO REGISTRADO";
	$subdistribuidor_bodega 		= "00 BODEGA SUBDISTRIBUIDOR";
	$subdistribuidor_area 			= "00 NO APLICA";
	$subdistribuidor_usuario 		= "SUBDISTRIBUIDOR";
		
	/* remisiones y facturas compaq */	
	$compaq_estatus_valida 		= "VÁLIDA";
	$compaq_estatus_cancelada 	= "CANCELADA";
	
	$vendedor_por_fefinir 	= "POR DEFINIR"; 
	$vendedor_por_definir 	= "POR DEFINIR"; 
	
	$porcentaje_iva = 16;
	
	/*estatus cigurias*/
	/* ****************
	0-cancelada  
	1-programada 
	2-surtida 
	3-finalizada  
	4-material entregado 	
	5-solicitada 	
	*/ 
	
	/* VARIABLES SEGÚN VERSIÓN DE EXOS */
	//	$incluir_precio_en_venta_directa = "si"; /* LEGOR */
	$incluir_precio_en_venta_directa = "no"; /* EXORTA */
	
?>