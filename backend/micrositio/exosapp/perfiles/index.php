<?php
require_once __DIR__ . '/../includes/auth.php';
$page_title = 'Perfiles';
$active_module = 'perfiles';
$page_scripts = ['assets/js/perfiles.js'];
require_once __DIR__ . '/../includes/layout_header.php';
?>

  <div class="panel-header">
    <h1>Perfiles de usuario</h1>
    <button id="btnNuevoPerfil" class="btn btn-primary">+ Nuevo perfil</button>
  </div>

   <div style="height: 50px;">     
      <div id="listMessage" class="list-message" style="display:none;"></div>
   </div>

  <div class="search-box">
    <input type="text" id="perfilesSearch" placeholder="Buscar perfil por nombre…">
  </div>

  <div class="table-wrap">
    <table id="perfilesTable" class="data-table">
      <thead>
        <tr>
          <th class="col-sortable" id="thNombre">Nombre <span class="sort-arrow"></span></th>
          <th>Descripción</th>
          <th>Activo</th>
          <th class="col-actions">Acciones</th>
        </tr>
      </thead>
      <tbody id="perfilesTableBody">
        <tr><td colspan="4" class="table-loading">Cargando perfiles…</td></tr>
      </tbody>
    </table>
  </div>

<!-- Dialog: Nuevo/Editar perfil -->
<div id="dlgPerfil" title="Perfil" style="display:none;">
  <form id="formPerfil">
    <input type="hidden" id="perfil_id" value="">
    <div class="field">
      <label for="perfil_nombre">Nombre</label>
      <input type="text" id="perfil_nombre" maxlength="100" required>
    </div>
    <div class="field">
      <label for="perfil_descripcion">Descripción</label>
      <textarea id="perfil_descripcion" rows="3" maxlength="255"></textarea>
    </div>
    <div class="field field-checkbox">
      <label><input type="checkbox" id="perfil_activo"> Activo</label>
    </div>
  </form>
</div>

<!-- Dialog: Permisos por módulo -->
<div id="dlgPermisos" title="Permisos del perfil" style="display:none;">
  <p class="permisos-perfil-nombre"></p>
  <div id="permisosAccordion"></div>
</div>

<!-- Dialog: Usuarios asignados al perfil -->
<div id="dlgUsuariosPerfil" title="Usuarios del perfil" style="display:none;">
  <p class="permisos-perfil-nombre"></p>
  <div class="search-box">
    <input type="text" id="usuariosPerfilSearch" placeholder="Buscar usuario por nombre…">
  </div>
  <ul id="usuariosPerfilList" class="checklist"></ul>
</div>

<?php require_once __DIR__ . '/../includes/layout_footer.php'; ?>
