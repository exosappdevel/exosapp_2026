$(function () {

  var usuariosCache = [];
  var perfilesCache = null; // se carga una sola vez (lazy) y se reusa entre aperturas del dialog

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
      $row.append($('<td>').text(u.nombre || ''));
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
  // Perfiles asignados al usuario (agregar/quitar)
  // ---------------------------------------------------------------------
  function setupDialogs() {
    $('#dlgPerfilesUsuario').dialog({
      autoOpen: false,
      modal: true,
      width: 420,
      height: 480,
      resizable: false,
      buttons: {
        'Cerrar': function () { $(this).dialog('close'); }
      }
    });
  }

  function abrirPerfilesUsuario(idUsuarioApp, nombreUsuario) {
    $('#perfilesUsuarioList').empty().append('<li class="checklist-loading">Cargando perfiles…</li>');
    $('#dlgPerfilesUsuario .permisos-perfil-nombre').text(nombreUsuario || '');
    $('#dlgPerfilesUsuario').dialog('option', 'title', 'Perfiles: ' + (nombreUsuario || '')).dialog('open');

    $.when(cargarPerfiles(), apiGet('app_perfiles_usuario_get', { id_usuario_app: idUsuarioApp }))
      .done(function (perfiles, asignadosResp) {
        var asignadosData = asignadosResp[0]; // $.when agrupa (data, status, jqXHR) en un array
        if (!asignadosData || asignadosData.result !== 'ok') {
          $('#perfilesUsuarioList').empty().append('<li class="checklist-loading">' +
            ((asignadosData && asignadosData.result_text) || 'No se pudieron cargar los perfiles asignados.') + '</li>');
          return;
        }
        var asignados = {};
        normalizeList(asignadosData.data).forEach(function (row) {
          asignados[String(row.id_perfil)] = true;
        });
        renderPerfilesUsuario(perfiles, asignados, idUsuarioApp);
      })
      .fail(function () {
        $('#perfilesUsuarioList').empty().append('<li class="checklist-loading">Error de conexión con el servidor.</li>');
      });
  }

  function cargarPerfiles() {
    var dfd = $.Deferred();
    if (perfilesCache) {
      dfd.resolve(perfilesCache);
      return dfd.promise();
    }
    apiGet('app_perfiles_list', {}).done(function (resp) {
      if (resp && resp.result === 'ok') {
        perfilesCache = normalizeList(resp.data);
        dfd.resolve(perfilesCache);
      } else {
        dfd.reject();
      }
    }).fail(function () { dfd.reject(); });
    return dfd.promise();
  }

  function renderPerfilesUsuario(perfiles, asignados, idUsuarioApp) {
    var $list = $('#perfilesUsuarioList').empty();

    if (!perfiles.length) {
      $list.append('<li class="checklist-loading">No hay perfiles registrados.</li>');
      return;
    }

    perfiles.forEach(function (p) {
      var checked = !!asignados[String(p.id_perfil)];
      var $li = $('<li>');
      var $label = $('<label>');
      var $checkbox = $('<input type="checkbox">')
        .prop('checked', checked)
        .on('change', function () {
          var action = $(this).is(':checked') ? 'app_perfiles_usuario_add' : 'app_perfiles_usuario_delete';
          var $cb = $(this);
          $cb.prop('disabled', true);
          apiPost(action, { id_perfil: p.id_perfil, id_usuario_app: idUsuarioApp }).done(function (resp) {
            if (!resp || resp.result !== 'ok') {
              alert((resp && resp.result_text) || 'No se pudo actualizar la asignación.');
              $cb.prop('checked', !$cb.is(':checked'));
            }
          }).fail(function () {
            alert('Error de conexión con el servidor.');
            $cb.prop('checked', !$cb.is(':checked'));
          }).always(function () {
            $cb.prop('disabled', false);
          });
        });
      $label.append($checkbox).append(' ' + (p.nombre || ('Perfil #' + p.id_perfil)));
      $li.append($label);
      $list.append($li);
    });
  }

});
