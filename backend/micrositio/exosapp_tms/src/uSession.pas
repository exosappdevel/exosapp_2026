unit uSession;

interface

uses
  SysUtils, WEBLib.JSON;

type
  TUserSession = record
    IDUsuario: string;
    AliasUsuario: string;
    TipoUsuario: string;
    IsLoggedIn: Boolean;
  end;

  TSession = class
  private
    class var FUser: TUserSession;
  public
    class procedure Login(const IDUsuario, AliasUsuario, TipoUsuario: string);
    class procedure Logout;
    class function GetUser: TUserSession;
    class function IsLoggedIn: Boolean;
  end;

implementation

class procedure TSession.Login(const IDUsuario, AliasUsuario, TipoUsuario: string);
begin
  FUser.IDUsuario := IDUsuario;
  FUser.AliasUsuario := AliasUsuario;
  FUser.TipoUsuario := TipoUsuario;
  FUser.IsLoggedIn := True;
end;

class procedure TSession.Logout;
begin
  FUser.IsLoggedIn := False;
  FUser.IDUsuario := '';
  FUser.AliasUsuario := '';
  FUser.TipoUsuario := '';
end;

class function TSession.GetUser: TUserSession;
begin
  Result := FUser;
end;

class function TSession.IsLoggedIn: Boolean;
begin
  Result := FUser.IsLoggedIn;
end;

end.
