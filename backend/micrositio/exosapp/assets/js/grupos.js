$(function () {

  var gruposCache = [];
  var gruposSearchText = '';
  var gruposSortDir = 'asc';
  var perfilesCache = null; // perfiles activos, se cargan una sola vez

  init();

  function init() {
    loadGrupos();
    setupDialogs();

    $('#btnNuevoGrupo').on('click', openNuevoGrupo);
    $('#formGrupo').on('submit', function (e) { e.preventDefault(); guardarGrupo(); });

    $('#gruposSearch').on('keyup', function () {
      gruposSearchText = $.trim($(this).val()).toLowerCase();
      applyFilterAndSort();
    });

    $('#thNombre').on('click', function () {
      gruposSortDir = gruposSortDir === 'asc' ? 'desc' : 'asc';
      updateSortArrow();
      applyFilterAndSort();
    });

    updateSortArrow();
  }

  // ---------------------------------------------------------------------
  // Listado de grupos (app_perfiles_tipos)
  // ---------------------------------------------------------------------
  function loadGrupos() {
    $('#gruposTableBody').html('<tr><td colspan="4" class="table-loading">Cargando grupos…</td></tr>');
    hideMessage();

    apiGet('app_perfiles_tipos_list', {}).done(function (resp) {
      if (!resp || resp.result !== 'ok') {
        showMessage((resp && resp.result_text) || 'No se pudieron cargar los grupos.', 'error');
        $('#gruposTableBody').html('<tr><td colspan="4" class="table-empty">Sin datos.</td></tr>');
        return;
      }
      gruposCache = normalizeList(resp.data);
      applyFilterAndSort();
    }).fail(function () {
      showMessage('Error de conexión con el servidor.', 'error');
      $('#gruposTableBody').html('<tr><td colspan="4" class="table-empty">Sin datos.</td></tr>');
    });
  }

  function applyFilterAndSort() {
    var grupos = gruposCache.filter(function (g) {
      return !gruposSearchText || (g.nombre || '').toLowerCase().indexOf(gruposSearchText) !== -1;
    });

    grupos.sort(function (a, b) {
      var na = (a.nombre || '').toLowerCase();
      var nb = (b.nombre || '').toLowerCase();
      var cmp = na < nb ? -1 : (na > nb ? 1 : 0);
      return gruposSortDir === 'asc' ? cmp : -cmp;
    });

    renderGrupos(grupos);
  }

  function updateSortArrow() {
    $('#thNombre .sort-arrow').text(gruposSortDir === 'asc' ? '▲' : '▼');
  }

  function renderGrupos(grupos) {
    var $tbody = $('#gruposTableBody').empty();

    if (!grupos.length) {
      var msg = gruposSearchText ? 'Ningún grupo coincide con la búsqueda.' : 'No hay grupos registrados.';
      $tbody.html('<tr><td colspan="4" class="table-empty">' + msg + '</td></tr>');
      return;
    }

    grupos.forEach(function (g) {
      var activo = String(g.activo) === '1';
      var $row = $('<tr>');
      $row.append($('<td>').text(g.nombre || ''));
      $row.append($('<td>').addClass('col-descripcion').text(g.descripcion || ''));
      $row.append($('<td>').append(
        $('<span>').addClass('badge ' + (activo ? 'badge-on' : 'badge-off')).text(activo ? 'Activo' : 'Inactivo')
      ));

      var $actions = $('<td>').addClass('col-actions');
      $actions.append($('<button>').addClass('btn btn-small btn-outline').text('Perfiles')
        .on('click', function () { abrirPerfilesGrupo(g.id_perfil_tipo, g.nombre); }));
      $actions.append($('<button>').addClass('btn btn-small btn-outline').text('Editar')
        .on('click', function () { openEditarGrupo(g.id_perfil_tipo); }));
      $actions.append($('<button>').addClass('btn btn-small btn-outline').text('Clonar')
        .on('click', function () { confirmarClonarGrupo(g.id_perfil_tipo, g.nombre); }));
      $actions.append($('<button>').addClass('btn btn-small btn-danger').text('Eliminar')
        .on('click', function () { confirmarEliminarGrupo(g.id_perfil_tipo, g.nombre); }));

      $row.append($actions);
      $tbody.append($row);
    });
  }

  // ---------------------------------------------------------------------
  // Alta / edición / baja de grupo
  // ---------------------------------------------------------------------
  function setupDialogs() {
    $('#dlgGrupo').dialog({
      autoOpen: false,
      modal: true,
      width: 420,
      resizable: false,
      buttons: {
        'Guardar': function () { guardarGrupo(); },
        'Cancelar': function () { $(this).dialog('close'); }
      }
    });

    $('#dlgGrupoPerfiles').dialog({
      autoOpen: false,
      modal: true,
      width: 560,
      height: 600,
      resizable: false,
      buttons: {
        'Expandir todo': function (e) {
          var $btn = $(e.target).closest('button');
          var expandir = !$btn.data('expandido');
          $('#grupoPerfilesList li.asignacion-item').each(function () { setNodoAbierto($(this), expandir); });
          $btn.data('expandido', expandir).button('option', 'label', expandir ? 'Contraer todo' : 'Expandir todo');
        },
        'Cerrar': function () { $(this).dialog('close'); }
      }
    });
  }

  function openNuevoGrupo() {
    $('#formGrupo')[0].reset();
    $('#grupo_id').val('');
    $('#grupo_activo').prop('checked', true);
    $('#dlgGrupo').dialog('option', 'title', 'Nuevo grupo').dialog('open');
  }

  function openEditarGrupo(idGrupo) {
    apiGet('app_perfiles_tipos_info', { id_perfil_tipo: idGrupo }).done(function (resp) {
      if (!resp || resp.result !== 'ok' || !resp.data) {
        showMessage((resp && resp.result_text) || 'No se pudo cargar el grupo.', 'error');
        return;
      }
      var data = resp.data;
      $('#grupo_id').val(data.id_perfil_tipo);
      $('#grupo_nombre').val(data.nombre);
      $('#grupo_descripcion').val(data.descripcion);
      $('#grupo_activo').prop('checked', String(data.activo) === '1');
      $('#dlgGrupo').dialog('option', 'title', 'Editar grupo').dialog('open');
    }).fail(function () {
      showMessage('Error de conexión con el servidor.', 'error');
    });
  }

  function guardarGrupo() {
    var idGrupo = $('#grupo_id').val();
    var nombre = $.trim($('#grupo_nombre').val());
    var descripcion = $.trim($('#grupo_descripcion').val());
    var activo = $('#grupo_activo').is(':checked') ? '1' : '0';

    if (!nombre) {
      alert('El nombre es obligatorio.');
      return;
    }

    var action = idGrupo ? 'app_perfiles_tipos_update' : 'app_perfiles_tipos_add';
    var payload = { nombre: nombre, descripcion: descripcion, activo: activo };
    if (idGrupo) {
      payload.id_perfil_tipo = idGrupo;
    }

    apiPost(action, payload).done(function (resp) {
      if (!resp || resp.result !== 'ok') {
        alert((resp && resp.result_text) || 'No se pudo guardar el grupo.');
        return;
      }
      $('#dlgGrupo').dialog('close');
      showMessage(idGrupo ? 'Grupo actualizado correctamente.' : 'Grupo creado correctamente.', 'success');
      loadGrupos();
    }).fail(function () {
      alert('Error de conexión con el servidor.');
    });
  }

  function confirmarClonarGrupo(idGrupo, nombre) {
    if (!confirm('¿Clonar el grupo "' + nombre + '"? Se creará un nuevo grupo con los mismos almacenes por módulo (sin usuarios).')) {
      return;
    }
    apiPost('app_perfiles_tipos_clone', { id_perfil_tipo: idGrupo }).done(function (resp) {
      if (!resp || resp.result !== 'ok') {
        alert((resp && resp.result_text) || 'No se pudo clonar el grupo.');
        return;
      }
      showMessage('Grupo clonado correctamente.', 'success');
      loadGrupos();
    }).fail(function () {
      alert('Error de conexión con el servidor.');
    });
  }

  function confirmarEliminarGrupo(idGrupo, nombre) {
    if (!confirm('¿Eliminar el grupo "' + nombre + '"? También se quitará a los usuarios que lo tengan asignado. Esta acción no se puede deshacer.')) {
      return;
    }
    apiPost('app_perfiles_tipos_delete', { id_perfil_tipo: idGrupo }).done(function (resp) {
      if (!resp || resp.result !== 'ok') {
        alert((resp && resp.result_text) || 'No se pudo eliminar el grupo.');
        return;
      }
      showMessage('Grupo eliminado correctamente.', 'success');
      loadGrupos();
    }).fail(function () {
      alert('Error de conexión con el servidor.');
    });
  }

  // ---------------------------------------------------------------------
  // Perfiles del grupo: árbol perfil -> módulos del perfil (app_perfiles_modulos)
  // -> almacenes. Quedan marcados los almacenes de app_perfiles_tipos_modulos
  // (grupo + módulo + almacén). Un mismo módulo que aparece en varios perfiles
  // comparte la selección, así que se mantiene sincronizado en el árbol.
  // ---------------------------------------------------------------------
  function cargarPerfilesModulos() {
    var dfd = $.Deferred();
    apiGet('app_perfiles_modulos_list', {}).done(function (resp) {
      if (resp && resp.result === 'ok') {
        dfd.resolve(normalizeList(resp.data));
      } else {
        dfd.reject();
      }
    }).fail(function () { dfd.reject(); });
    return dfd.promise();
  }

  function abrirPerfilesGrupo(idGrupo, nombreGrupo) {
    $('#grupoPerfilesList').empty().append('<li class="checklist-loading">Cargando perfiles, módulos y almacenes…</li>');
    $('#dlgGrupoPerfiles .permisos-perfil-nombre').text(nombreGrupo || '');
    $('#dlgGrupoPerfiles').dialog('option', 'title', 'Perfiles: ' + (nombreGrupo || '')).dialog('open');
    $('#dlgGrupoPerfiles').dialog('widget').find('.ui-dialog-buttonpane button:first')
      .data('expandido', false).button('option', 'label', 'Expandir todo');

    $.when(cargarPerfilesModulos(), cargarAlmacenes(), apiGet('app_perfiles_tipos_modulos_get', { id_perfil_tipo: idGrupo }))
      .done(function (filas, almacenes, asignadosResp) {
        var asignadosData = asignadosResp[0]; // $.when agrupa (data, status, jqXHR) en un array
        if (!asignadosData || asignadosData.result !== 'ok') {
          $('#grupoPerfilesList').empty().append($('<li class="checklist-loading">').text(
            (asignadosData && asignadosData.result_text) || 'No se pudieron cargar los almacenes asignados.'));
          return;
        }
        // id_modulo -> { id_almacen: true }
        var asignados = {};
        normalizeList(asignadosData.data).forEach(function (row) {
          var k = String(row.id_modulo);
          (asignados[k] = asignados[k] || {})[String(row.id_almacen)] = true;
        });
        renderArbol(filas, almacenes, asignados, idGrupo);
      })
      .fail(function () {
        $('#grupoPerfilesList').empty().append('<li class="checklist-loading">Error de conexión con el servidor.</li>');
      });
  }

  function setNodoAbierto($li, abierto) {
    $li.children('.asignacion-almacenes').toggle(abierto);
    $li.find('> .asignacion-head .asignacion-arrow').text(abierto ? '▾' : '▸');
  }

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  // Recalcula el contador de un nodo de módulo a partir de sus checkboxes.
  function refrescarModulo($mod) {
    var $cbs = $mod.find('input[data-almacen]');
    var n = $cbs.filter(':checked').length;
    $mod.find('> .asignacion-head .badge').text(plural(n, 'almacén', 'almacenes'))
      .toggleClass('badge-on', n > 0).toggleClass('badge-off', n === 0);
    $mod.find('input.todos').prop('checked', n > 0 && n === $cbs.length);
    $mod.attr('data-count', n);
  }

  function refrescarPerfil($perfil) {
    var $mods = $perfil.find('li.modulo-item');
    var n = $mods.filter(function () { return Number($(this).attr('data-count')) > 0; }).length;
    $perfil.find('> .asignacion-head .badge').text(n + '/' + $mods.length + ' módulos')
      .toggleClass('badge-on', n > 0).toggleClass('badge-off', n === 0);
  }

  function refrescarTodo(idModulo) {
    var $root = $('#grupoPerfilesList');
    $root.find('li.modulo-item[data-modulo="' + idModulo + '"]').each(function () { refrescarModulo($(this)); });
    $root.find('> li.perfil-item').each(function () { refrescarPerfil($(this)); });
  }

  function renderArbol(filas, almacenes, asignados, idGrupo) {
    var $list = $('#grupoPerfilesList').empty();

    if (!filas.length) {
      $list.append('<li class="checklist-loading">No hay perfiles activos con módulos.</li>');
      return;
    }
    if (!almacenes.length) {
      $list.append('<li class="checklist-loading">No hay almacenes registrados.</li>');
      return;
    }

    // perfil -> módulos (en el orden recibido)
    var perfiles = [];
    var porPerfil = {};
    filas.forEach(function (f) {
      var k = String(f.id_perfil);
      if (!porPerfil[k]) {
        porPerfil[k] = { nombre: f.perfil, modulos: [] };
        perfiles.push(k);
      }
      porPerfil[k].modulos.push(f);
    });

    perfiles.forEach(function (k) {
      var perfil = porPerfil[k];
      var $perfil = $('<li>').addClass('asignacion-item perfil-item');
      var $pHead = $('<div>').addClass('asignacion-head')
        .append($('<span>').addClass('asignacion-arrow'))
        .append($('<span>').addClass('asignacion-title').text(perfil.nombre || ('Perfil #' + k)))
        .append($('<span>').addClass('badge'));
      var $pSub = $('<ul>').addClass('permisos-list asignacion-almacenes');

      perfil.modulos.forEach(function (m) {
        $pSub.append(construirModulo(m, almacenes, asignados[String(m.id_modulo)] || {}, idGrupo));
      });

      $pHead.on('click', function () { setNodoAbierto($perfil, !$pSub.is(':visible')); });
      $perfil.append($pHead).append($pSub);
      $list.append($perfil);
      setNodoAbierto($perfil, false);
    });

    // Todo el árbol arranca contraído.
    $list.find('li.modulo-item').each(function () { refrescarModulo($(this)); setNodoAbierto($(this), false); });
    $list.find('> li.perfil-item').each(function () { refrescarPerfil($(this)); });
  }

  function construirModulo(m, almacenes, seleccionados, idGrupo) {
    var idModulo = String(m.id_modulo);
    var $mod = $('<li>').addClass('asignacion-item modulo-item').attr('data-modulo', idModulo);
    var $head = $('<div>').addClass('asignacion-head')
      .append($('<span>').addClass('asignacion-arrow'))
      .append($('<span>').addClass('asignacion-title').text(m.modulo || ('Módulo #' + idModulo)))
      .append($('<span>').addClass('badge'));
    var $sub = $('<ul>').addClass('permisos-list asignacion-almacenes');

    var $todos = $('<input type="checkbox" class="todos">');
    $sub.append($('<li>').append($('<label>').addClass('permisos-select-all').append($todos).append(' Todos los almacenes')));

    // Aplica el cambio en el WS y lo refleja en las demás copias del mismo módulo.
    var aplicar = function (items, $disable, revertir) {
      $disable.prop('disabled', true);
      apiPost('app_perfiles_tipos_modulos_update', {
        id_perfil_tipo: idGrupo,
        id_modulo: idModulo,
        almacenes: items
      }).done(function (resp) {
        if (!resp || resp.result !== 'ok') {
          alert((resp && resp.result_text) || 'No se pudo actualizar la asignación.');
          revertir();
          return;
        }
        items.forEach(function (it) {
          $('#grupoPerfilesList input[data-modulo="' + idModulo + '"][data-almacen="' + it.id_almacen + '"]')
            .prop('checked', !!it.activo);
        });
      }).fail(function () {
        alert('Error de conexión con el servidor.');
        revertir();
      }).always(function () { $disable.prop('disabled', false); refrescarTodo(idModulo); });
    };

    almacenes.forEach(function (a) {
      var $cb = $('<input type="checkbox">').attr({ 'data-modulo': idModulo, 'data-almacen': a.id_almacen })
        .prop('checked', !!seleccionados[String(a.id_almacen)])
        .on('change', function () {
          var $this = $(this);
          var checked = $this.is(':checked');
          aplicar([{ id_almacen: a.id_almacen, activo: checked ? 1 : 0 }], $this, function () { $this.prop('checked', !checked); });
        });
      var $label = $('<label>').append($cb).append(' ' + (a.codigo ? a.codigo + ' · ' : '') + (a.nombre || ('Almacén #' + a.id_almacen)));
      $sub.append($('<li>').append($label));
    });

    $todos.on('change', function () {
      var checked = $todos.is(':checked');
      var $cbs = $sub.find('input[data-almacen]');
      var previos = $cbs.map(function () { return this.checked; }).get();
      $cbs.prop('checked', checked);
      var items = almacenes.map(function (a) { return { id_almacen: a.id_almacen, activo: checked ? 1 : 0 }; });
      aplicar(items, $todos, function () { $cbs.each(function (i) { this.checked = previos[i]; }); });
    });

    $head.on('click', function () { setNodoAbierto($mod, !$sub.is(':visible')); });
    return $mod.append($head).append($sub);
  }

});
