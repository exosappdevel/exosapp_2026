<?php
// Espera que la página que incluye este archivo ya haya hecho:
//   require_once __DIR__ . '/../includes/auth.php';
//   $page_title = 'Perfiles';
//   $active_module = 'perfiles';
// antes de incluirlo.

$modules = [
    ['key' => 'perfiles', 'label' => 'Perfiles', 'url' => BASE_URL . 'perfiles/index.php'],
    ['key' => 'usuarios', 'label' => 'Usuarios', 'url' => BASE_URL . 'usuarios/index.php'],
];
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?php echo htmlspecialchars($page_title ?? 'ExosApp'); ?> - Administración</title>
<link rel="icon" href="<?php echo BASE_URL; ?>assets/images/favicon.png">
<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css">
<link rel="stylesheet" href="<?php echo BASE_URL; ?>assets/css/style.css">
</head>
<body>

<header class="topbar">
  <div class="topbar-brand">
    <img src="<?php echo BASE_URL; ?>assets/images/favicon.png" alt="" class="topbar-logo">
    <span>ExosApp &middot; Administración</span>
  </div>
  <div class="topbar-user">
    <span class="topbar-user-name"><?php echo htmlspecialchars($current_user['alias_usuario']); ?></span>
    <a href="<?php echo BASE_URL; ?>logout.php" class="topbar-logout">Cerrar sesión</a>
  </div>
</header>

<div class="app-shell">
  <nav class="sidemenu">
    <?php foreach ($modules as $m): ?>
      <a href="<?php echo $m['url']; ?>" class="sidemenu-link<?php echo ($active_module === $m['key']) ? ' active' : ''; ?>">
        <?php echo htmlspecialchars($m['label']); ?>
      </a>
    <?php endforeach; ?>
  </nav>

  <main class="container">
