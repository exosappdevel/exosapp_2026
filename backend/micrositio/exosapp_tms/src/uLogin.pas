unit uLogin;

interface

uses
  SysUtils, Classes, WEBLib.JSON,
  WEBLib.Controls, WEBLib.Forms, WEBLib.Graphics,
  WEBLib.StdCtrls, WEBLib.ExtCtrls;

type
  TfrmLogin = class(TWebForm)
    lblTitle: TWebLabel;
    edtUsuario: TWebEdit;
    edtPassword: TWebEdit;
    btnLogin: TWebButton;
    lblError: TWebLabel;
    procedure FormCreate(Sender: TObject);
    procedure btnLoginClick(Sender: TObject);
  private
    procedure DoLogin;
    procedure ShowError(const Msg: string);
    procedure SetLoading(Loading: Boolean);
  public
  end;

var
  frmLogin: TfrmLogin;

implementation

{$R *.dfm}

uses
  uAPI, uSession, uMain;

procedure TfrmLogin.FormCreate(Sender: TObject);
begin
  lblError.Visible := False;
  edtUsuario.SetFocus;
end;

procedure TfrmLogin.btnLoginClick(Sender: TObject);
begin
  DoLogin;
end;

procedure TfrmLogin.DoLogin;
var
  Payload: TJSONObject;
  IDTipoUsuario: string;
begin
  if (Trim(edtUsuario.Text) = '') or (Trim(edtPassword.Text) = '') then
  begin
    ShowError('Ingresa usuario y contrasea.');
    Exit;
  end;

  SetLoading(True);
  lblError.Visible := False;

  Payload := TJSONObject.Create;
  try
    Payload.AddPair('login_usuario', Trim(edtUsuario.Text));
    Payload.AddPair('login_password', edtPassword.Text);

    TAPI.Post('inicia_sesion', Payload,
      procedure(const AResp: TAPIResponse)
      begin
        if AResp.Success then
        begin
          if Assigned(AResp.Data) then
          begin
            IDTipoUsuario := AResp.Data.GetValue<string>('id_tipo_usuario');

            if (IDTipoUsuario <> '20') and (IDTipoUsuario <> '21') then
            begin
              ShowError('Usuario no autorizado para acceder a esta aplicacin.');
              SetLoading(False);
              Exit;
            end;

            TSession.Login(
              AResp.Data.GetValue<string>('id_usuario'),
              UpperCase(AResp.Data.GetValue<string>('alias_usuario')),
              AResp.Data.GetValue<string>('tipo_usuario')
            );

            frmMain := TfrmMain.Create(Application);
            frmMain.Show;
            Self.Hide;
          end;
        end
        else
        begin
          ShowError(AResp.Message);
        end;
        SetLoading(False);
      end
    );
  finally
    Payload.Free;
  end;
end;

procedure TfrmLogin.ShowError(const Msg: string);
begin
  lblError.Caption := Msg;
  lblError.Visible := True;
end;

procedure TfrmLogin.SetLoading(Loading: Boolean);
begin
  btnLogin.Enabled := not Loading;
end;

end.
