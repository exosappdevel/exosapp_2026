<?php
require_once __DIR__ . '/../includes/auth.php';
$page_title = 'Perfiles-Usuarios';
$active_module = 'usuarios';
$page_scripts = ['assets/js/usuarios.js'];
require_once __DIR__ . '/../includes/layout_header.php';
?>

  <div class="panel-header">
    <h1>Perfiles-Usuarios</h1>
  </div>
  
  <div style="height: 50px;">     
      <div id="listMessage" class="list-message" style="display:none;"></div>
   </div>

  <div class="search-box">
    <input type="text" id="usuariosSearch" placeholder="Buscar usuario por nombre…">
  </div>

  <div class="table-wrap">
    <table id="usuariosTable" class="data-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Activo</th>
          <th class="col-actions">Acciones</th>
        </tr>
      </thead>
      <tbody id="usuariosTableBody">
        <tr><td colspan="3" class="table-loading">Cargando usuarios…</td></tr>
      </tbody>
    </table>
  </div>

<!-- Dialog: Grupos de perfiles asignados al usuario -->
<div id="dlgPerfilesUsuario" title="Perfiles del usuario" style="display:none;">
  <p class="permisos-perfil-nombre"></p>
  <ul id="perfilesUsuarioList" class="checklist"></ul>
</div>

<?php require_once __DIR__ . '/../includes/layout_footer.php'; ?>
