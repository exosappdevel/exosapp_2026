// Helpers compartidos entre los módulos del micrositio (Perfiles, Usuarios, ...).
// Requiere que ws_config.php ya haya definido WS_BASE_URL / BASE_URL.

function apiGet(action, params) {
  return $.ajax({
    url: WS_BASE_URL + '?action=' + encodeURIComponent(action),
    method: 'GET',
    data: params,
    dataType: 'json'
  });
}

function apiPost(action, payload) {
  return $.ajax({
    url: WS_BASE_URL + '?action=' + encodeURIComponent(action),
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(payload),
    dataType: 'json'
  });
}

// El adaptador REST ya entrega arrays reales; esto solo cubre el caso de
// un único resultado (objeto) o data vacío, para que el código de arriba
// siempre pueda iterar sin condicionales extra.
function normalizeList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') return Object.keys(data).map(function (k) { return data[k]; });
  return [];
}

function showMessage(text, type) {
  var $msg = $('#listMessage');
  if (!$msg.length) return;
  $msg.removeClass('msg-error msg-success')
    .addClass(type === 'error' ? 'msg-error' : 'msg-success')
    .text(text).show();
  setTimeout(function () { $msg.hide(); }, 4000);
}

function hideMessage() {
  $('#listMessage').hide();
}
