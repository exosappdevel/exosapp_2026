<?php
session_start();

// Ruta del sitio hacia la raíz de este micrositio, usada para construir
// enlaces/assets/redirects que funcionen sin importar la profundidad de la
// página actual (ej. perfiles/index.php vs usuarios/index.php).
define('BASE_URL', '/micrositio/exosapp/');

// Adaptador REST/JSON (controller_ws_rest.php) en vez de controller_ws.php:
// este micrositio necesita JSON limpio (arrays reales, no el XML con prefijos
// item_/subitem_/prod_). Ruta absoluta desde la raíz del sitio para que
// funcione sin importar dónde se despliegue este micrositio dentro del dominio.
define('WS_BASE_URL', '/webservice/controller_ws_rest.php');

// El backend actualmente no valida este passkey contra ningún valor (ver
// controller_ws.php), se deja configurable por si eso cambia más adelante.
define('WS_PASSKEY', '');
