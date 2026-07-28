unit uUsuarios;

interface

uses
  SysUtils, Classes, StrUtils, WEBLib.JSON, Generics.Collections,
  WEBLib.Controls, WEBLib.Forms, WEBLib.Graphics,
  WEBLib.StdCtrls, WEBLib.ExtCtrls, WEBLib.Grids;

type
  TUsuario = class
    IDUsuarioApp: string;
    Nombre: string;
    Usuario: string;
    Activo: Boolean;
  end;

  TfrmUsuarios = class(TWebForm)
    lblTitle: TWebLabel;
    edtSearch: TWebEdit;
    grdUsuarios: TWebStringGrid;
    pnlMessage: TWebPanel;
    lblMessage: TWebLabel;
    procedure FormCreate(Sender: TObject);
    procedure edtSearchChange(Sender: TObject);
  private
    FUsuarios: TObjectList<TUsuario>;
    procedure LoadUsuarios;
    procedure RenderUsuarios;
    procedure ShowMessage(const Msg: string; IsError: Boolean = False);
    procedure HideMessage;
    procedure OpenPerfiles(const IDUsuarioApp, Nombre: string);
  public
    constructor Create(AOwner: TComponent); override;
    destructor Destroy; override;
  end;

implementation

{$R *.dfm}

uses
  uAPI;

constructor TfrmUsuarios.Create(AOwner: TComponent);
begin
  inherited;
  FUsuarios := TObjectList<TUsuario>.Create(True);
end;

destructor TfrmUsuarios.Destroy;
begin
  FUsuarios.Free;
  inherited;
end;

procedure TfrmUsuarios.FormCreate(Sender: TObject);
begin
  LoadUsuarios;
end;

procedure TfrmUsuarios.LoadUsuarios;
begin
  grdUsuarios.RowCount := 1;
  grdUsuarios.Cells[0, 0] := 'Cargando usuarios...';

  TAPI.Get('app_usuarios_list',
    procedure(const AResp: TAPIResponse)
    var
      ParsedArr: TJSONArray;
      Item: TJSONValue;
      U: TUsuario;
      I: Integer;
    begin
      FUsuarios.Clear;

      if AResp.Success and Assigned(AResp.Data) then
      begin
        ParsedArr := TAPI.NormalizeList(AResp.Data);
        try
          for I := 0 to ParsedArr.Count - 1 do
          begin
            Item := ParsedArr.Items[I];
            U := TUsuario.Create;
            U.IDUsuarioApp := Item.GetValue<string>('id_usuario_app');
            U.Nombre := Item.GetValue<string>('nombre');
            U.Usuario := Item.GetValue<string>('usuario');
            U.Activo := Item.GetValue<string>('activo') = '1';
            FUsuarios.Add(U);
          end;
        finally
          ParsedArr.Free;
        end;
      end;

      RenderUsuarios;
    end
  );
end;

procedure TfrmUsuarios.RenderUsuarios;
var
  I, Row: Integer;
  U: TUsuario;
  SearchText: string;
begin
  SearchText := LowerCase(Trim(edtSearch.Text));
  grdUsuarios.RowCount := 1;
  grdUsuarios.Cells[0, 0] := 'Nombre';
  grdUsuarios.Cells[1, 0] := 'Activo';
  grdUsuarios.Cells[2, 0] := 'Acciones';

  Row := 1;
  for I := 0 to FUsuarios.Count - 1 do
  begin
    U := FUsuarios[I];
    if (SearchText <> '') and (Pos(SearchText, LowerCase(U.Nombre)) = 0) then
      Continue;

    grdUsuarios.RowCount := Row + 1;
    grdUsuarios.Cells[0, Row] := U.Nombre + ' (' + LowerCase(U.Usuario) + ')';
    grdUsuarios.Cells[1, Row] := IfThen(U.Activo, 'Activo', 'Inactivo');
    grdUsuarios.Cells[2, Row] := 'Perfiles';
    Inc(Row);
  end;

  if Row = 1 then
  begin
    grdUsuarios.Cells[0, 1] := 'No hay usuarios registrados.';
    grdUsuarios.Cells[1, 1] := '';
    grdUsuarios.Cells[2, 1] := '';
  end;
end;

procedure TfrmUsuarios.edtSearchChange(Sender: TObject);
begin
  RenderUsuarios;
end;

procedure TfrmUsuarios.ShowMessage(const Msg: string; IsError: Boolean);
begin
  lblMessage.Caption := Msg;
  pnlMessage.Visible := True;
  if not IsError then
    pnlMessage.Color := RGB(233, 249, 238)
  else
    pnlMessage.Color := RGB(253, 236, 236);
end;

procedure TfrmUsuarios.HideMessage;
begin
  pnlMessage.Visible := False;
end;

procedure TfrmUsuarios.OpenPerfiles(const IDUsuarioApp, Nombre: string);
begin
  ShowMessage('Perfiles de: ' + Nombre);
end;

end.
