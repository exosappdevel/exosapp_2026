<?php
require_once __DIR__ . '/../includes/auth.php';
$page_title = 'Perfiles-Grupos';
$active_module = 'grupos';
$page_scripts = ['assets/js/grupos.js'];
require_once __DIR__ . '/../includes/layout_header.php';
?>

  <div class="panel-header">
    <h1>Perfiles-Grupos</h1>
    <button id="btnNuevoGrupo" class="btn btn-primary">+ Nuevo grupo</button>
  </div>

   <div style="height: 50px;">
      <div id="listMessage" class="list-message" style="display:none;"></div>
   </div>

  <div class="search-box">
    <input type="text" id="gruposSearch" placeholder="Buscar grupo por nombre…">
  </div>

  <div class="table-wrap">
    <table id="gruposTable" class="data-table">
      <thead>
        <tr>
          <th class="col-sortable" id="thNombre">Nombre <span class="sort-arrow"></span></th>
          <th>Descripción</th>
          <th>Activo</th>
          <th class="col-actions">Acciones</th>
        </tr>
      </thead>
      <tbody id="gruposTableBody">
        <tr><td colspan="4" class="table-loading">Cargando grupos…</td></tr>
      </tbody>
    </table>
  </div>

<!-- Dialog: Nuevo/Editar grupo -->
<div id="dlgGrupo" title="Grupo" style="display:none;">
  <form id="formGrupo">
    <input type="hidden" id="grupo_id" value="">
    <div class="field">
      <label for="grupo_nombre">Nombre</label>
      <input type="text" id="grupo_nombre" maxlength="100" required>
    </div>
    <div class="field">
      <label for="grupo_descripcion">Descripción</label>
      <textarea id="grupo_descripcion" rows="3" maxlength="255"></textarea>
    </div>
    <div class="field field-checkbox">
      <label><input type="checkbox" id="grupo_activo"> Activo</label>
    </div>
  </form>
</div>

<!-- Dialog: Perfiles del grupo (árbol perfil -> módulo -> almacenes) -->
<div id="dlgGrupoPerfiles" title="Perfiles del grupo" style="display:none;">
  <p class="permisos-perfil-nombre"></p>
  <ul id="grupoPerfilesList" class="checklist"></ul>
</div>

<?php require_once __DIR__ . '/../includes/layout_footer.php'; ?>
