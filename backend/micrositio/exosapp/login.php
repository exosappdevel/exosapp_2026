<?php
require_once __DIR__ . '/config.php';

if (!empty($_SESSION['app_perfiles_user'])) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Administrar Perfiles - ExosApp</title>
<link rel="icon" href="assets/images/favicon.png">
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="login-body">

<div class="login-screen">
  <div class="login-logo-container">
    <img src="assets/images/logo_login.png" alt="ExosApp" class="login-logo">
    <div class="login-appname">ExosApp &middot; Admin</div>
  </div>

  <form id="loginForm" class="login-form" autocomplete="off">
    <div class="input-group">
      <span class="input-icon">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/></svg>
      </span>
      <input type="text" id="login_usuario" name="login_usuario" placeholder="Usuario" autocapitalize="off" autocomplete="username" required>
    </div>

    <div class="input-group">
      <span class="input-icon">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M18 8h-1V6c0-2.8-2.2-5-5-5S7 3.2 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9V6zm3 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
      </span>
      <input type="password" id="login_password" name="login_password" placeholder="Contraseña" autocomplete="current-password" required>
      <span class="input-icon toggle-password" id="togglePassword">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/></svg>
      </span>
    </div>

    <div id="loginError" class="login-error" style="display:none;"></div>

    <button type="submit" id="loginButton" class="login-button">
      <span class="btn-label">Iniciar sesión</span>
      <span class="btn-spinner" style="display:none;"></span>
    </button>
  </form>

  <div class="login-footer-text">Administrador de Perfiles de Usuario</div>

  <img src="assets/images/logo_Elidev.png" alt="Elidev" class="login-logo-elidev">
</div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="assets/js/ws_config.php"></script>
<script src="assets/js/login.js"></script>
</body>
</html>
