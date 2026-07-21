$(function () {

  var perfilesCache = [];
  var usuariosCache = null; // se carga una sola vez (lazy) y se reusa entre aperturas del dialog
  var perfilesSearchText = '';
  var perfilesSortDir = 'asc';

  init();

  function init() {
    loadPerfiles();
    setupDialogs();

    $('#btnNuevoPerfil').on('click', openNuevoPerfil);
    $('#formPerfil').on('submit', function (e) { e.preventDefault(); guardarPerfil(); });
    $('#usuariosPerfilSearch').on('keyup', function () {
      filtrarUsuariosPerfil($.trim($(this).val()).toLowerCase());
    });

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
      $actions.append($('<button>').addClass('btn btn-small btn-outline').text('Usuarios')
        .on('click', function () { abrirUsuariosPerfil(p.id_perfil, p.nombre); }));
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
      width: 560,
      height: 520,
      resizable: false,
      buttons: {
        'Guardar permisos': function () { guardarPermisos(); },
        'Cerrar': function () { $(this).dialog('close'); }
      }
    });

    $('#dlgUsuariosPerfil').dialog({
      autoOpen: false,
      modal: true,
      width: 480,
      height: 520,
      resizable: false,
      open: function () {
        const $btn = $(this).dialog('widget').find('.ui-dialog-buttonpane button:first');
        const total = $('#usuariosPerfilList > li[data-nombre] input[type=checkbox]:checked').length;
        $btn.data('showingAll', true)
          .button('option', 'label', 'Mostrar seleccionados (' + total + ')');
      },
      buttons: {
        'Mostrar todos': function (e) {
          const $btn = $(e.target);
          const $items = $('#usuariosPerfilList > li[data-nombre]');
          const showingAll = $btn.data('showingAll');

          if (showingAll) {
            $items.each(function () {
              $(this).toggle($(this).find('input[type=checkbox]').is(':checked'));
            });
            const total = $('#usuariosPerfilList > li[data-nombre] input[type=checkbox]:checked').length;
            $btn.button('option', 'label', 'Mostrar todos (' + total + ')');
          } else {
            $items.show();
            $btn.button('option', 'label', 'Mostrar seleccionados (' + $items.length + ')');
          }

          $btn.data('showingAll', !showingAll);
        },
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
  // Permisos por módulo / almacén
  // ---------------------------------------------------------------------
  function abrirPermisos(idPerfil, nombrePerfil) {
    $('#permisosAccordion').empty().text('Cargando permisos…');
    $('#dlgPermisos .permisos-perfil-nombre').text(nombrePerfil || '');
    $('#dlgPermisos').data('idPerfil', idPerfil)
      .dialog('option', 'title', 'Permisos: ' + (nombrePerfil || ''))
      .dialog('open');

    apiGet('app_perfiles_permisos_get', { id_perfil: idPerfil }).done(function (resp) {
      if (!resp || resp.result !== 'ok') {
        $('#permisosAccordion').text((resp && resp.result_text.toUpperCase()) || 'No se pudieron cargar los permisos.');
        return;
      }
      renderPermisos(normalizeList(resp.data));
    }).fail(function () {
      $('#permisosAccordion').text('Error de conexión con el servidor.');
    });
  }

  function renderPermisos(rows) {
    var $accordion = $('#permisosAccordion');

    // .empty() borra el contenido pero no destruye el widget de jQuery UI:
    // si ya era un accordion (aperturas anteriores), hay que destruirlo antes
    // de reconstruirlo o queda con el header sin estilo y sin colapsar.
    if ($accordion.hasClass('ui-accordion')) {
      $accordion.accordion('destroy');
    }
    $accordion.empty();

    if (!rows.length) {
      $accordion.text('Este perfil no tiene módulos configurados.');
      return;
    }

    var grupos = {};
    var orden = [];
    rows.forEach(function (row) {
      var modulo = row.modulo || '(Sin módulo)';
      if (!grupos[modulo]) {
        grupos[modulo] = [];
        orden.push(modulo);
      }
      grupos[modulo].push(row);
    });

    orden.forEach(function (modulo) {
      var $header = $('<h3>').text(modulo.toUpperCase());
      var $panel = $('<div>').addClass('permisos-panel');

      var updateHeaderCount = function () {
        var marcados = $panel.find('input[data-permiso-id]:checked').length;
        var label = modulo.toUpperCase() + (marcados > 0 ? ' (' + marcados + ')' : '');
        $header.text(label);
      };

      var allChecked = grupos[modulo].every(function (row) { return String(row.activo) === '1'; });
      var $selectAllLabel = $('<label>').addClass('permisos-select-all');
      var $selectAllCb = $('<input type="checkbox">').prop('checked', allChecked);
      $selectAllLabel.append($selectAllCb).append(' Seleccionar todos');

      var $list = $('<ul>').addClass('permisos-list');

      grupos[modulo].forEach(function (row) {
        var checked = String(row.activo) === '1';
        var $li = $('<li>');
        var $label = $('<label>');
        var $checkbox = $('<input type="checkbox">')
          .attr('data-permiso-id', row.id)
          .prop('checked', checked)
          .on('change', function () {
            var todos = $panel.find('input[data-permiso-id]');
            var marcados = todos.filter(':checked');
            $selectAllCb.prop('checked', todos.length === marcados.length);
            updateHeaderCount();
          });
        $label.append($checkbox).append(' ' + (row.almacen || ('Almacén #' + row.id_almacen)));
        $li.append($label);
        $list.append($li);
      });

      $selectAllCb.on('change', function () {
        $panel.find('input[data-permiso-id]').prop('checked', $(this).is(':checked'));
        updateHeaderCount();
      });

      $panel.append($selectAllLabel).append($list);
      $accordion.append($header).append($panel);
      updateHeaderCount();
    });

    $accordion.accordion({ heightStyle: 'content', collapsible: true, active: false });
  }

  function guardarPermisos() {
    var idPerfil = $('#dlgPermisos').data('idPerfil');
    var permisos = [];

    $('#permisosAccordion input[data-permiso-id]').each(function () {
      permisos.push({
        id: $(this).attr('data-permiso-id'),
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

  // ---------------------------------------------------------------------
  // Usuarios asignados al perfil (agregar/quitar, con búsqueda por texto)
  // ---------------------------------------------------------------------
  function abrirUsuariosPerfil(idPerfil, nombrePerfil) {
    $('#usuariosPerfilSearch').val('');
    $('#usuariosPerfilList').empty().append('<li class="checklist-loading">Cargando usuarios…</li>');
    $('#dlgUsuariosPerfil .permisos-perfil-nombre').text(nombrePerfil || '');
    $('#dlgUsuariosPerfil').data('idPerfil', idPerfil)
      .dialog('option', 'title', 'Usuarios: ' + (nombrePerfil || ''))
      .dialog('open');

    $.when(cargarUsuarios(), apiGet('app_perfiles_usuarios_get', { id_perfil: idPerfil }))
      .done(function (usuarios, asignadosResp) {
        var asignadosData = asignadosResp[0]; // $.when pasa [data, status, xhr] por cada promesa
        if (!asignadosData || asignadosData.result !== 'ok') {
          $('#usuariosPerfilList').empty().append('<li class="checklist-loading">' +
            ((asignadosData && asignadosData.result_text) || 'No se pudieron cargar los usuarios asignados.') + '</li>');
          return;
        }
        var asignados = {};
        normalizeList(asignadosData.data).forEach(function (row) {
          asignados[String(row.id_usuario_app)] = true;
        });
        renderUsuariosPerfil(usuarios, asignados, idPerfil);
      })
      .fail(function () {
        $('#usuariosPerfilList').empty().append('<li class="checklist-loading">Error de conexión con el servidor.</li>');
      });
  }

  function cargarUsuarios() {
    var dfd = $.Deferred();
    if (usuariosCache) {
      dfd.resolve(usuariosCache);
      return dfd.promise();
    }
    apiGet('app_usuarios_list', {}).done(function (resp) {
      if (resp && resp.result === 'ok') {
        usuariosCache = normalizeList(resp.data);
        dfd.resolve(usuariosCache);
      } else {
        dfd.reject();
      }
    }).fail(function () { dfd.reject(); });
    return dfd.promise();
  }

  function renderUsuariosPerfil(usuarios, asignados, idPerfil) {
    var $list = $('#usuariosPerfilList').empty();

    if (!usuarios.length) {
      $list.append('<li class="checklist-loading">No hay usuarios registrados.</li>');
      actualizarContadorUsuariosPerfil();
      return;
    }

    usuarios.forEach(function (u) {
      var checked = !!asignados[String(u.id_usuario_app)];
      var $li = $('<li>').attr('data-nombre', (u.nombre || '').toLowerCase());
      var $label = $('<label>');
      var $checkbox = $('<input type="checkbox">')
        .prop('checked', checked)
        .on('change', function () {
          var action = $(this).is(':checked') ? 'app_perfiles_usuario_add' : 'app_perfiles_usuario_delete';
          var $cb = $(this);
          $cb.prop('disabled', true);
          apiPost(action, { id_perfil: idPerfil, id_usuario_app: u.id_usuario_app }).done(function (resp) {
            if (!resp || resp.result !== 'ok') {
              alert((resp && resp.result_text) || 'No se pudo actualizar la asignación.');
              $cb.prop('checked', !$cb.is(':checked'));
            }
          }).fail(function () {
            alert('Error de conexión con el servidor.');
            $cb.prop('checked', !$cb.is(':checked'));
          }).always(function () {
            $cb.prop('disabled', false);
            actualizarContadorUsuariosPerfil();
          });
        });
      $label.append($checkbox).append(' ' + ((u.nombre) || ('Usuario #' + u.id_usuario)));
      $label.attr('title', u.usuario + ' (' + u.id_usuario + ':' + u.id_usuario_app + ')');
      $li.append($label);
      $list.append($li);
    });

    actualizarContadorUsuariosPerfil();
  }

  function actualizarContadorUsuariosPerfil() {
    var $btn = $('#dlgUsuariosPerfil').dialog('widget').find('.ui-dialog-buttonpane button:first');
    var total = $('#usuariosPerfilList > li[data-nombre] input[type=checkbox]:checked').length;
    $btn.data('showingAll', true).button('option', 'label', 'Mostrar seleccionados (' + total + ')');
  }

  function filtrarUsuariosPerfil(texto) {
    $('#usuariosPerfilList > li[data-nombre]').each(function () {
      var nombre = $(this).attr('data-nombre') || '';
      $(this).toggle(nombre.indexOf(texto) !== -1);
    });
  }

});
