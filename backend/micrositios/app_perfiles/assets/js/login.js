$(function () {
  $('#togglePassword').on('click', function () {
    var input = $('#login_password');
    var type = input.attr('type') === 'password' ? 'text' : 'password';
    input.attr('type', type);
  });

  $('#loginForm').on('submit', function (e) {
    e.preventDefault();

    var usuario = $.trim($('#login_usuario').val());
    var password = $('#login_password').val();

    if (!usuario || !password) {
      showError('Ingresa usuario y contraseña.');
      return;
    }

    setLoading(true);

    $.ajax({
      url: WS_BASE_URL + '?action=inicia_sesion',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ login_usuario: usuario, login_password: password }),
      dataType: 'json'
    }).done(function (resp) {
      if (resp && resp.result === 'ok') {
        id_tipo_usuario = resp.id_tipo_usuario || '';        

        if (id_tipo_usuario !== '20' && id_tipo_usuario !== '21') {
          showError('Usuario no autorizado para acceder a esta aplicación.');
          setLoading(false);
          return;
        }
        $.ajax({
          url: 'ajax/session_start.php',
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            id_usuario: resp.id_usuario,
            alias_usuario: resp.alias_usuario.toUpperCase() || '',
            tipo_usuario: resp.tipo_usuario || ''
          })
        }).done(function () {
          window.location.href = 'index.php';
        }).fail(function () {
          showError('No se pudo iniciar la sesión local.');
          setLoading(false);
        });
      } else {
        showError((resp && resp.result_text) || 'Usuario o contraseña incorrectos.');
        setLoading(false);
      }
    }).fail(function (xhr) {
      var msg = 'Error de conexión con el servidor.';
      if (xhr.responseJSON && xhr.responseJSON.result_text) {
        msg = xhr.responseJSON.result_text;
      }
      showError(msg);
      setLoading(false);
    });
  });

  function showError(msg) {
    $('#loginError').text(msg).show();
  }

  function setLoading(loading) {
    $('#loginButton').prop('disabled', loading);
    $('.btn-label').toggle(!loading);
    $('.btn-spinner').toggle(loading);
  }
});
