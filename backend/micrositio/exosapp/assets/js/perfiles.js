$(function () {

  var perfilesCache = [];
  var perfilesSearchText = '';
  var perfilesSortDir = 'asc';

  init();

  function init() {
    loadPerfiles();
    setupDialogs();

    $('#btnNuevoPerfil').on('click', openNuevoPerfil);
    $('#formPerfil').on('submit', function (e) { e.preventDefault(); guardarPerfil(); });

    $('#perfilesSearch').on('keyup', function () {
      perfilesSearchText = $.trim($(this).val()).toLowerCase();
      applyFilterAndSort();
    });

    $('#thNombre').on('click', function () {
      perfilesSortDir = perfilesSortDir === 'asc' ? 'desc' : 'asc';
      updateSortArrow();
      applyFilterAndSort();
    });

    updateSortArrow();
  }

  // ---------------------------------------------------------------------
  // Listado de perfiles
  // ---------------------------------------------------------------------
  function loadPerfiles() {
    $('#perfilesTableBody').html('<tr><td colspan="4" class="table-loading">Cargando perfiles…</td></tr>');
    hideMessage();

    apiGet('app_perfiles_list', {}).done(function (resp) {
      if (!resp || resp.result !== 'ok') {
        showMessage((resp && resp.result_text) || 'No se pudieron cargar los perfiles.', 'error');
        $('#perfilesTableBody').html('<tr><td colspan="4" class="table-empty">Sin datos.</td></tr>');
        return;
      }
      perfilesCache = normalizeList(resp.data);
      applyFilterAndSort();
    }).fail(function () {
      showMessage('Error de conexión con el servidor.', 'error');
      $('#perfilesTableBody').html('<tr><td colspan="4" class="table-empty">Sin datos.</td></tr>');
    });
  }

  function applyFilterAndSort() {
    var perfiles = perfilesCache.filter(function (p) {
      return !perfilesSearchText || (p.nombre || '').toLowerCase().indexOf(perfilesSearchText) !== -1;
    });

    perfiles.sort(function (a, b) {
      var na = (a.nombre || '').toLowerCase();
      var nb = (b.nombre || '').toLowerCase();
      var cmp = na < nb ? -1 : (na > nb ? 1 : 0);
      return perfilesSortDir === 'asc' ? cmp : -cmp;
    });

    renderPerfiles(perfiles);
  }

  function updateSortArrow() {
    $('#thNombre .sort-arrow').text(perfilesSortDir === 'asc' ? '▲' : '▼');
  }

  function renderPerfiles(perfiles) {
    var $tbody = $('#perfilesTableBody').empty();

    if (!perfiles.length) {
      var msg = perfilesSearchText ? 'Ningún perfil coincide con la búsqueda.' : 'No hay perfiles registrados.';
      $tbody.html('<tr><td colspan="4" class="table-empty">' + msg + '</td></tr>');
      return;
    }

    perfiles.forEach(function (p) {
      var activo = String(p.activo) === '1';
      var $row = $('<tr>');
      $row.append($('<td>').text(p.nombre || ''));
      $row.append($('<td>').addClass('col-descripcion').text(p.descripcion || ''));
      $row.append($('<td>').append(
        $('<span>').addClass('badge ' + (activo ? 'badge-on' : 'badge-off')).text(activo ? 'Activo' : 'Inactivo')
      ));

      var $actions = $('<td>').addClass('col-actions');
      $actions.append($('<button>').addClass('btn btn-small btn-outline').text('Permisos')
        .on('click', function () { abrirPermisos(p.id_perfil, p.nombre); }));
      $actions.append($('<button>').addClass('btn btn-small btn-outline').text('Editar')
        .on('click', function () { openEditarPerfil(p.id_perfil); }));
      $actions.append($('<button>').addClass('btn btn-small btn-outline').text('Clonar')
        .on('click', function () { confirmarClonarPerfil(p.id_perfil, p.nombre); }));
      $actions.append($('<button>').addClass('btn btn-small btn-danger').text('Eliminar')
        .on('click', function () { confirmarEliminarPerfil(p.id_perfil, p.nombre); }));

      $row.append($actions);
      $tbody.append($row);
    });
  }

  // ---------------------------------------------------------------------
  // Alta / edición de perfil
  // ---------------------------------------------------------------------
  function setupDialogs() {
    $('#dlgPerfil').dialog({
      autoOpen: false,
      modal: true,
      width: 420,
      resizable: false,
      buttons: {
        'Guardar': function () { guardarPerfil(); },
        'Cancelar': function () { $(this).dialog('close'); }
      }
    });

    $('#dlgPermisos').dialog({
      autoOpen: false,
      modal: true,
      width: 480,
      height: 480,
      resizable: false,
      buttons: {
        'Guardar permisos': function () { guardarPermisos(); },
        'Cerrar': function () { $(this).dialog('close'); }
      }
    });
  }

  function openNuevoPerfil() {
    $('#formPerfil')[0].reset();
    $('#perfil_id').val('');
    $('#perfil_activo').prop('checked', true);
    $('#dlgPerfil').dialog('option', 'title', 'Nuevo perfil').dialog('open');
  }

  function openEditarPerfil(idPerfil) {
    apiGet('app_perfiles_info', { id_perfil: idPerfil }).done(function (resp) {
      if (!resp || resp.result !== 'ok' || !resp.data) {
        showMessage((resp && resp.result_text) || 'No se pudo cargar el perfil.', 'error');
        return;
      }
      var data = resp.data;
      $('#perfil_id').val(data.id_perfil);
      $('#perfil_nombre').val(data.nombre);
      $('#perfil_descripcion').val(data.descripcion);
      $('#perfil_activo').prop('checked', String(data.activo) === '1');
      $('#dlgPerfil').dialog('option', 'title', 'Editar perfil').dialog('open');
    }).fail(function () {
      showMessage('Error de conexión con el servidor.', 'error');
    });
  }

  function guardarPerfil() {
    var idPerfil = $('#perfil_id').val();
    var nombre = $.trim($('#perfil_nombre').val());
    var descripcion = $.trim($('#perfil_descripcion').val());
    var activo = $('#perfil_activo').is(':checked') ? '1' : '0';

    if (!nombre) {
      alert('El nombre es obligatorio.');
      return;
    }

    var action = idPerfil ? 'app_perfiles_update' : 'app_perfiles_add';
    var payload = { nombre: nombre, descripcion: descripcion, activo: activo };
    if (idPerfil) {
      payload.id_perfil = idPerfil;
    }

    apiPost(action, payload).done(function (resp) {
      if (!resp || resp.result !== 'ok') {
        alert((resp && resp.result_text) || 'No se pudo guardar el perfil.');
        return;
      }
      $('#dlgPerfil').dialog('close');
      showMessage(idPerfil ? 'Perfil actualizado correctamente.' : 'Perfil creado correctamente.', 'success');
      loadPerfiles();
    }).fail(function () {
      alert('Error de conexión con el servidor.');
    });
  }

  // ---------------------------------------------------------------------
  // Eliminar perfil
  // ---------------------------------------------------------------------
  function confirmarEliminarPerfil(idPerfil, nombre) {
    if (!confirm('¿Eliminar el perfil "' + nombre + '"? Esta acción no se puede deshacer.')) {
      return;
    }
    apiPost('app_perfiles_delete', { id_perfil: idPerfil }).done(function (resp) {
      if (!resp || resp.result !== 'ok') {
        alert((resp && resp.result_text) || 'No se pudo eliminar el perfil.');
        return;
      }
      showMessage('Perfil eliminado correctamente.', 'success');
      loadPerfiles();
    }).fail(function () {
      alert('Error de conexión con el servidor.');
    });
  }
  // ---------------------------------------------------------------------
  // Clonar perfil
  // ---------------------------------------------------------------------
  function confirmarClonarPerfil(idPerfil, nombre) {
    if (!confirm('¿Clonar el perfil "' + nombre + '"? Se creará un nuevo perfil con el mismo nombre y permisos.')) {
      return;
    }
    apiPost('app_perfiles_clone', { id_perfil: idPerfil }).done(function (resp) {
      if (!resp || resp.result !== 'ok') {
        alert((resp && resp.result_text) || 'No se pudo clonar el perfil.');
        return;
      }
      showMessage('Perfil clonado correctamente.', 'success');
      loadPerfiles();
    }).fail(function () {
      alert('Error de conexión con el servidor.');
    });
  }

  // ---------------------------------------------------------------------
  // Permisos del perfil: lista de módulos (app_perfiles_modulos). Aquí no
  // interviene el almacén; eso se asigna por usuario en la página Usuarios.
  // ---------------------------------------------------------------------
  function abrirPermisos(idPerfil, nombrePerfil) {
    $('#permisosLista').empty().append('<li class="checklist-loading">Cargando módulos…</li>');
    $('#dlgPermisos .permisos-perfil-nombre').text(nombrePerfil || '');
    $('#dlgPermisos').data('idPerfil', idPerfil)
      .dialog('option', 'title', 'Permisos: ' + (nombrePerfil || ''))
      .dialog('open');

    apiGet('app_perfiles_permisos_get', { id_perfil: idPerfil }).done(function (resp) {
      if (!resp || resp.result !== 'ok') {
        $('#permisosLista').empty().append($('<li class="checklist-loading">').text(
          (resp && resp.result_text) || 'No se pudieron cargar los permisos.'));
        return;
      }
      renderPermisos(normalizeList(resp.data));
    }).fail(function () {
      $('#permisosLista').empty().append('<li class="checklist-loading">Error de conexión con el servidor.</li>');
    });
  }

  function renderPermisos(rows) {
    var $list = $('#permisosLista').empty();

    if (!rows.length) {
      $list.append('<li class="checklist-loading">No hay módulos configurados.</li>');
      return;
    }

    rows.forEach(function (row) {
      var $checkbox = $('<input type="checkbox">')
        .attr('data-modulo-id', row.id_modulo)
        .prop('checked', String(row.activo) === '1');
      var $label = $('<label>').append($checkbox)
        .append(' ' + (row.modulo || ('Módulo #' + row.id_modulo)));
      $list.append($('<li>').append($label));
    });
  }

  function guardarPermisos() {
    var idPerfil = $('#dlgPermisos').data('idPerfil');
    var permisos = [];

    $('#permisosLista input[data-modulo-id]').each(function () {
      permisos.push({
        id_modulo: $(this).attr('data-modulo-id'),
        activo: $(this).is(':checked') ? 1 : 0
      });
    });

    apiPost('app_perfiles_permisos_update', {
      id_perfil: idPerfil,
      permisos: permisos
    }).done(function (resp) {
      if (!resp || resp.result !== 'ok') {
        alert((resp && resp.result_text) || 'No se pudieron guardar los permisos.');
        return;
      }
      showMessage('Permisos actualizados correctamente.', 'success');
      $('#dlgPermisos').dialog('close');
    }).fail(function () {
      alert('Error de conexión con el servidor.');
    });
  }

});
