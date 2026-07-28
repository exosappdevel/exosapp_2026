unit uPerfiles;

interface

uses
  SysUtils, Classes, StrUtils, WEBLib.JSON, Generics.Collections,
  WEBLib.Controls, WEBLib.Forms, WEBLib.Graphics,
  WEBLib.StdCtrls, WEBLib.ExtCtrls, WEBLib.Grids, WEBLib.Dialogs;

type
  TPerfil = class
    IDPerfil: string;
    Nombre: string;
    Descripcion: string;
    Activo: Boolean;
  end;

  TfrmPerfiles = class(TWebForm)
    lblTitle: TWebLabel;
    btnNuevo: TWebButton;
    edtSearch: TWebEdit;
    grdPerfiles: TWebStringGrid;
    pnlMessage: TWebPanel;
    lblMessage: TWebLabel;
    dlgPerfil: TWebPanel;
    edtNombre: TWebEdit;
    edtDescripcion: TWebEdit;
    chkActivo: TWebCheckBox;
    btnGuardar: TWebButton;
    btnCancelar: TWebButton;
    dlgPermisos: TWebPanel;
    procedure FormCreate(Sender: TObject);
    procedure btnNuevoClick(Sender: TObject);
    procedure edtSearchChange(Sender: TObject);
    procedure btnGuardarClick(Sender: TObject);
    procedure btnCancelarClick(Sender: TObject);
  private
    FPerfiles: TObjectList<TPerfil>;
    FEditingID: string;
    procedure LoadPerfiles;
    procedure RenderPerfiles;
    procedure ShowMessage(const Msg: string; IsError: Boolean = False);
    procedure HideMessage;
    procedure ShowPerfilDialog(const Title: string);
    procedure HidePerfilDialog;
    procedure OpenPermisos(const IDPerfil, Nombre: string);
    procedure OpenUsuarios(const IDPerfil, Nombre: string);
    procedure ConfirmarEliminar(const IDPerfil, Nombre: string);
    procedure ConfirmarClonar(const IDPerfil, Nombre: string);
  public
    constructor Create(AOwner: TComponent); override;
    destructor Destroy; override;
  end;

implementation

{$R *.dfm}

uses
  uAPI;

constructor TfrmPerfiles.Create(AOwner: TComponent);
begin
  inherited;
  FPerfiles := TObjectList<TPerfil>.Create(True);
end;

destructor TfrmPerfiles.Destroy;
begin
  FPerfiles.Free;
  inherited;
end;

procedure TfrmPerfiles.FormCreate(Sender: TObject);
begin
  dlgPerfil.Visible := False;
  dlgPermisos.Visible := False;
  LoadPerfiles;
end;

procedure TfrmPerfiles.LoadPerfiles;
begin
  grdPerfiles.RowCount := 1;
  grdPerfiles.Cells[0, 0] := 'Cargando perfiles...';

  TAPI.Get('app_perfiles_list',
    procedure(const AResp: TAPIResponse)
    var
      Arr, ParsedArr: TJSONArray;
      Item: TJSONValue;
      P: TPerfil;
      I: Integer;
    begin
      FPerfiles.Clear;

      if AResp.Success and Assigned(AResp.Data) then
      begin
        ParsedArr := TAPI.NormalizeList(AResp.Data);
        try
          for I := 0 to ParsedArr.Count - 1 do
          begin
            Item := ParsedArr.Items[I];
            P := TPerfil.Create;
            P.IDPerfil := Item.GetValue<string>('id_perfil');
            P.Nombre := Item.GetValue<string>('nombre');
            P.Descripcion := Item.GetValue<string>('descripcion');
            P.Activo := Item.GetValue<string>('activo') = '1';
            FPerfiles.Add(P);
          end;
        finally
          ParsedArr.Free;
        end;
      end;

      RenderPerfiles;
    end
  );
end;

procedure TfrmPerfiles.RenderPerfiles;
var
  I, Row: Integer;
  P: TPerfil;
  SearchText: string;
begin
  SearchText := LowerCase(Trim(edtSearch.Text));
  grdPerfiles.RowCount := 1;
  grdPerfiles.Cells[0, 0] := 'Nombre';
  grdPerfiles.Cells[1, 0] := 'Descripcin';
  grdPerfiles.Cells[2, 0] := 'Activo';
  grdPerfiles.Cells[3, 0] := 'Acciones';

  Row := 1;
  for I := 0 to FPerfiles.Count - 1 do
  begin
    P := FPerfiles[I];
    if (SearchText <> '') and (Pos(SearchText, LowerCase(P.Nombre)) = 0) then
      Continue;

    grdPerfiles.RowCount := Row + 1;
    grdPerfiles.Cells[0, Row] := P.Nombre;
    grdPerfiles.Cells[1, Row] := P.Descripcion;
    grdPerfiles.Cells[2, Row] := IfThen(P.Activo, 'Activo', 'Inactivo');
    grdPerfiles.Cells[3, Row] := 'Editar | Clonar | Permisos | Usuarios | Eliminar';
    Inc(Row);
  end;

  if Row = 1 then
  begin
    grdPerfiles.Cells[0, 1] := 'No hay perfiles registrados.';
    grdPerfiles.Cells[1, 1] := '';
    grdPerfiles.Cells[2, 1] := '';
    grdPerfiles.Cells[3, 1] := '';
  end;
end;

procedure TfrmPerfiles.btnNuevoClick(Sender: TObject);
begin
  FEditingID := '';
  edtNombre.Text := '';
  edtDescripcion.Text := '';
  chkActivo.Checked := True;
  ShowPerfilDialog('Nuevo perfil');
end;

procedure TfrmPerfiles.edtSearchChange(Sender: TObject);
begin
  RenderPerfiles;
end;

procedure TfrmPerfiles.btnGuardarClick(Sender: TObject);
var
  Payload: TJSONObject;
  Action: string;
begin
  if Trim(edtNombre.Text) = '' then
  begin
    ShowMessage('El nombre es obligatorio.', True);
    Exit;
  end;

  Payload := TJSONObject.Create;
  try
    Payload.AddPair('nombre', Trim(edtNombre.Text));
    Payload.AddPair('descripcion', Trim(edtDescripcion.Text));
    Payload.AddPair('activo', IfThen(chkActivo.Checked, '1', '0'));

    if FEditingID <> '' then
    begin
      Action := 'app_perfiles_update';
      Payload.AddPair('id_perfil', FEditingID);
    end
    else
      Action := 'app_perfiles_add';

    TAPI.Post(Action, Payload,
      procedure(const AResp: TAPIResponse)
      begin
        if AResp.Success then
        begin
          HidePerfilDialog;
          ShowMessage(IfThen(FEditingID <> '', 'Perfil actualizado.', 'Perfil creado.'));
          LoadPerfiles;
        end
        else
          ShowMessage(AResp.Message, True);
      end
    );
  finally
    Payload.Free;
  end;
end;

procedure TfrmPerfiles.btnCancelarClick(Sender: TObject);
begin
  HidePerfilDialog;
end;

procedure TfrmPerfiles.ShowPerfilDialog(const Title: string);
begin
  dlgPerfil.Visible := True;
end;

procedure TfrmPerfiles.HidePerfilDialog;
begin
  dlgPerfil.Visible := False;
end;

procedure TfrmPerfiles.ShowMessage(const Msg: string; IsError: Boolean);
begin
  lblMessage.Caption := Msg;
  pnlMessage.Visible := True;
  if not IsError then
    pnlMessage.Color := RGB(233, 249, 238)
  else
    pnlMessage.Color := RGB(253, 236, 236);
end;

procedure TfrmPerfiles.HideMessage;
begin
  pnlMessage.Visible := False;
end;

procedure TfrmPerfiles.OpenPermisos(const IDPerfil, Nombre: string);
begin
  ShowMessage('Permisos de: ' + Nombre);
end;

procedure TfrmPerfiles.OpenUsuarios(const IDPerfil, Nombre: string);
begin
  ShowMessage('Usuarios del perfil: ' + Nombre);
end;

procedure TfrmPerfiles.ConfirmarEliminar(const IDPerfil, Nombre: string);
var
  Payload: TJSONObject;
begin
  WEBLib.Dialogs.MessageDlg('Eliminar el perfil "' + Nombre + '"?', mtConfirmation, [mbYes, mbNo],
    procedure(AValue: TDialogResult)
    begin
      if AValue = mrYes then
      begin
        Payload := TJSONObject.Create;
        try
          Payload.AddPair('id_perfil', IDPerfil);
          TAPI.Post('app_perfiles_delete', Payload,
            procedure(const AResp: TAPIResponse)
            begin
              if AResp.Success then
              begin
                ShowMessage('Perfil eliminado.');
                LoadPerfiles;
              end
              else
                ShowMessage(AResp.Message, True);
            end
          );
        finally
          Payload.Free;
        end;
      end;
    end
  );
end;

procedure TfrmPerfiles.ConfirmarClonar(const IDPerfil, Nombre: string);
var
  Payload: TJSONObject;
begin
  WEBLib.Dialogs.MessageDlg('Clonar el perfil "' + Nombre + '"?', mtConfirmation, [mbYes, mbNo],
    procedure(AValue: TDialogResult)
    begin
      if AValue = mrYes then
      begin
        Payload := TJSONObject.Create;
        try
          Payload.AddPair('id_perfil', IDPerfil);
          TAPI.Post('app_perfiles_clone', Payload,
            procedure(const AResp: TAPIResponse)
            begin
              if AResp.Success then
              begin
                ShowMessage('Perfil clonado.');
                LoadPerfiles;
              end
              else
                ShowMessage(AResp.Message, True);
            end
          );
        finally
          Payload.Free;
        end;
      end;
    end
  );
end;

end.
