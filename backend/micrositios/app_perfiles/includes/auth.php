<?php
require_once __DIR__ . '/../config.php';

if (empty($_SESSION['app_perfiles_user'])) {
    header('Location: ' . BASE_URL . 'login.php');
    exit;
}

$current_user = $_SESSION['app_perfiles_user'];
