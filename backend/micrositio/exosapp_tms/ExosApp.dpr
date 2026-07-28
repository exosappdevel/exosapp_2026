program ExosApp;

uses
  WEBLib.Forms,
  uLogin in 'src\uLogin.pas' {frmLogin: TWebForm},
  uMain in 'src\uMain.pas' {frmMain: TWebForm},
  uPerfiles in 'src\uPerfiles.pas' {frmPerfiles: TWebForm},
  uUsuarios in 'src\uUsuarios.pas' {frmUsuarios: TWebForm},
  uAPI in 'src\uAPI.pas',
  uSession in 'src\uSession.pas';

{$R *.res}

begin
  Application.Initialize;
  Application.MainFormOnTaskbar := True;
  Application.CreateForm(TfrmLogin, frmLogin);
  Application.Run;
end.
