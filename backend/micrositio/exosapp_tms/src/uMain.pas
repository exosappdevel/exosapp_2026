unit uMain;

interface

uses
  SysUtils, Classes, WEBLib.JSON,
  WEBLib.Controls, WEBLib.Forms, WEBLib.Graphics,
  WEBLib.StdCtrls, WEBLib.ExtCtrls;

type
  TfrmMain = class(TWebForm)
    pnlTopbar: TWebPanel;
    lblAppName: TWebLabel;
    lblUserName: TWebLabel;
    btnLogout: TWebButton;
    pnlSideMenu: TWebPanel;
    btnPerfiles: TWebButton;
    btnUsuarios: TWebButton;
    pnlContent: TWebPanel;
    procedure FormCreate(Sender: TObject);
    procedure btnLogoutClick(Sender: TObject);
    procedure btnPerfilesClick(Sender: TObject);
    procedure btnUsuariosClick(Sender: TObject);
  private
    procedure ShowModule(ModuleName: string);
    procedure UpdateSideMenuHighlight(ActiveButton: TWebButton);
  public
  end;

var
  frmMain: TfrmMain;

implementation

{$R *.dfm}

uses
  uSession, uLogin, uPerfiles, uUsuarios;

procedure TfrmMain.FormCreate(Sender: TObject);
begin
  if not TSession.IsLoggedIn then
  begin
    frmLogin.Show;
    Self.Close;
    Exit;
  end;

  lblUserName.Caption := TSession.GetUser.AliasUsuario;
  ShowModule('perfiles');
end;

procedure TfrmMain.btnLogoutClick(Sender: TObject);
begin
  TSession.Logout;
  frmLogin.edtUsuario.Text := '';
  frmLogin.edtPassword.Text := '';
  frmLogin.lblError.Visible := False;
  frmLogin.Show;
  Self.Close;
end;

procedure TfrmMain.btnPerfilesClick(Sender: TObject);
begin
  ShowModule('perfiles');
end;

procedure TfrmMain.btnUsuariosClick(Sender: TObject);
begin
  ShowModule('usuarios');
end;

procedure TfrmMain.ShowModule(ModuleName: string);
var
  I: Integer;
  Frm: TWebForm;
  Ctrl: TControl;
begin
  for I := pnlContent.ControlCount - 1 downto 0 do
  begin
    Ctrl := pnlContent.Controls[I];
    Ctrl.Free;
  end;

  UpdateSideMenuHighlight(nil);

  if ModuleName = 'perfiles' then
  begin
    Frm := TfrmPerfiles.Create(Self);
    Frm.Parent := pnlContent;
    Frm.Align := alClient;
    Frm.Show;
    UpdateSideMenuHighlight(btnPerfiles);
  end
  else if ModuleName = 'usuarios' then
  begin
    Frm := TfrmUsuarios.Create(Self);
    Frm.Parent := pnlContent;
    Frm.Align := alClient;
    Frm.Show;
    UpdateSideMenuHighlight(btnUsuarios);
  end;
end;

procedure TfrmMain.UpdateSideMenuHighlight(ActiveButton: TWebButton);
var
  I: Integer;
  Btn: TWebButton;
begin
  for I := 0 to pnlSideMenu.ControlCount - 1 do
  begin
    if pnlSideMenu.Controls[I] is TWebButton then
    begin
      Btn := TWebButton(pnlSideMenu.Controls[I]);
      if Btn = ActiveButton then
        Btn.Color := $00EDF2F7
      else
        Btn.Color := $00FFFFFF;
    end;
  end;
end;

end.
