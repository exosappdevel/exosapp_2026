$(function () {

  var usuariosCache = [];

  init();

  function init() {
    loadUsuarios();
    setupDialogs();

    $('#usuariosSearch').on('keyup', function () {
      filtrarUsuarios($.trim($(this).val()).toLowerCase());
    });
  }

  // ---------------------------------------------------------------------
  // Listado de usuarios
  // ---------------------------------------------------------------------
  function loadUsuarios() {
    $('#usuariosTableBody').html('<tr><td colspan="3" class="table-loading">Cargando usuarios…</td></tr>');
    hideMessage();

    apiGet('app_usuarios_list', {}).done(function (resp) {
      if (!resp || resp.result !== 'ok') {
        showMessage((resp && resp.result_text) || 'No se pudieron cargar los usuarios.', 'error');
        $('#usuariosTableBody').html('<tr><td colspan="3" class="table-empty">Sin datos.</td></tr>');
        return;
      }
      usuariosCache = normalizeList(resp.data);
      renderUsuarios(usuariosCache);
    }).fail(function () {
      showMessage('Error de conexión con el servidor.', 'error');
      $('#usuariosTableBody').html('<tr><td colspan="3" class="table-empty">Sin datos.</td></tr>');
    });
  }

  function renderUsuarios(usuarios) {
    var $tbody = $('#usuariosTableBody').empty();

    if (!usuarios.length) {
      $tbody.html('<tr><td colspan="3" class="table-empty">No hay usuarios registrados.</td></tr>');
      return;
    }

    usuarios.forEach(function (u) {
      var activo = String(u.activo) === '1';
      var $row = $('<tr>').attr('data-nombre', (u.nombre || '').toLowerCase());
      $row.append($('<td>').text(u.nombre+ ' (' + u.usuario.toLowerCase() + ')' || ''));
      $row.append($('<td>').append(
        $('<span>').addClass('badge ' + (activo ? 'badge-on' : 'badge-off')).text(activo ? 'Activo' : 'Inactivo')
      ));

      var $actions = $('<td>').addClass('col-actions');
      $actions.append($('<button>').addClass('btn btn-small btn-outline').text('Perfiles')
        .on('click', function () { abrirPerfilesUsuario(u.id_usuario_app, u.nombre); }));

      $row.append($actions);
      $tbody.append($row);
    });
  }

  function filtrarUsuarios(texto) {
    $('#usuariosTableBody > tr[data-nombre]').each(function () {
      var nombre = $(this).attr('data-nombre') || '';
      $(this).toggle(nombre.indexOf(texto) !== -1);
    });
  }

  // ---------------------------------------------------------------------
  // Perfiles del usuario: lista de todos los Grupos de Perfiles; quedan
  // marcados los que existen en app_perfiles_usuarios para el usuario.
  // ---------------------------------------------------------------------
  function setupDialogs() {
    $('#dlgPerfilesUsuario').dialog({
      autoOpen: false,
      modal: true,
      width: 520,
      height: 520,
      resizable: false,
      buttons: {
        'Cerrar': function () { $(this).dialog('close'); }
      }
    });
  }

  function abrirPerfilesUsuario(idUsuarioApp, nombreUsuario) {
    $('#perfilesUsuarioList').empty().append('<li class="checklist-loading">Cargando grupos de perfiles…</li>');
    $('#dlgPerfilesUsuario .permisos-perfil-nombre').text(nombreUsuario || '');
    $('#dlgPerfilesUsuario').dialog('option', 'title', 'Perfiles: ' + (nombreUsuario || '')).dialog('open');

    $.when(cargarGrupos(), apiGet('app_perfiles_usuario_get', { id_usuario_app: idUsuarioApp }))
      .done(function (grupos, asignadosResp) {
        var asignadosData = asignadosResp[0]; // $.when agrupa (data, status, jqXHR) en un array
        if (!asignadosData || asignadosData.result !== 'ok') {
          $('#perfilesUsuarioList').empty().append($('<li class="checklist-loading">').text(
            (asignadosData && asignadosData.result_text) || 'No se pudieron cargar los grupos asignados.'));
          return;
        }
        var asignados = {};
        normalizeList(asignadosData.data).forEach(function (row) { asignados[String(row.id_perfil_tipo)] = true; });
        renderGruposUsuario(grupos, asignados, idUsuarioApp);
      })
      .fail(function () {
        $('#perfilesUsuarioList').empty().append('<li class="checklist-loading">Error de conexión con el servidor.</li>');
      });
  }

  function cargarGrupos() {
    var dfd = $.Deferred();
    apiGet('app_perfiles_tipos_list', {}).done(function (resp) {
      if (resp && resp.result === 'ok') {
        dfd.resolve(normalizeList(resp.data));
      } else {
        dfd.reject();
      }
    }).fail(function () { dfd.reject(); });
    return dfd.promise();
  }

  function renderGruposUsuario(grupos, asignados, idUsuarioApp) {
    var $list = $('#perfilesUsuarioList').empty();

    if (!grupos.length) {
      $list.append('<li class="checklist-loading">No hay grupos de perfiles registrados.</li>');
      return;
    }

    grupos.forEach(function (g) {
      var inactivo = String(g.activo) !== '1';
      var $cb = $('<input type="checkbox">').prop('checked', !!asignados[String(g.id_perfil_tipo)])
        .on('change', function () {
          var $this = $(this);
          var checked = $this.is(':checked');
          $this.prop('disabled', true);
          apiPost(checked ? 'app_perfiles_usuario_add' : 'app_perfiles_usuario_delete',
            { id_perfil_tipo: g.id_perfil_tipo, id_usuario_app: idUsuarioApp })
            .done(function (resp) {
              if (!resp || resp.result !== 'ok') {
                alert((resp && resp.result_text) || 'No se pudo actualizar la asignación.');
                $this.prop('checked', !checked);
              }
            })
            .fail(function () {
              alert('Error de conexión con el servidor.');
              $this.prop('checked', !checked);
            })
            .always(function () { $this.prop('disabled', false); });
        });
      var $label = $('<label>').append($cb).append(' ' + (g.nombre || ('Grupo #' + g.id_perfil_tipo)) + (inactivo ? ' (inactivo)' : ''));
      $list.append($('<li>').append($label));
    });
  }

});
