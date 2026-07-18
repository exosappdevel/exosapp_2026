<?php
require_once __DIR__ . '/../../config.php';
header('Content-Type: application/javascript; charset=UTF-8');
?>
const WS_BASE_URL = <?php echo json_encode(WS_BASE_URL); ?>;
const WS_PASSKEY = <?php echo json_encode(WS_PASSKEY); ?>;
const BASE_URL = <?php echo json_encode(BASE_URL); ?>;
