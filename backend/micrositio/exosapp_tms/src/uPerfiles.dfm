object frmPerfiles: TfrmPerfiles
  Left = 0
  Top = 0
  Caption = 'Perfiles'
  Width = 980
  Height = 740
  Font.Name = 'Segoe UI'
  Font.Size = 10
  Color = $00F5F5F5
  OnCreate = FormCreate
  object lblTitle: TWebLabel
    Left = 20
    Top = 20
    Width = 300
    Height = 30
    Caption = 'Perfiles de usuario'
    Font.Size = 18
    Font.Style = [fsBold]
  end
  object btnNuevo: TWebButton
    Left = 780
    Top = 20
    Width = 180
    Height = 40
    Caption = '+ Nuevo perfil'
    Font.Size = 12
    Font.Style = [fsBold]
    Font.Color = clWhite
    Color = $00CE8231
    OnClick = btnNuevoClick
  end
  object edtSearch: TWebEdit
    Left = 20
    Top = 70
    Width = 360
    Height = 40
    TextHint = 'Buscar perfil por nombre...'
    Font.Size = 12
    OnChange = edtSearchChange
  end
  object grdPerfiles: TWebStringGrid
    Left = 20
    Top = 130
    Width = 940
    Height = 500
    ColCount = 4
    RowCount = 2
    FixedRows = 1
    Font.Size = 10
    Options = [goRowSelect, goColSizing]
  end
  object pnlMessage: TWebPanel
    Left = 20
    Top = 100
    Width = 940
    Height = 25
    Color = $00EEF9E9
    Visible = False
    object lblMessage: TWebLabel
      Left = 10
      Top = 3
      Width = 920
      Height = 20
      Font.Size = 10
    end
  end
  object dlgPerfil: TWebPanel
    Left = 250
    Top = 200
    Width = 420
    Height = 300
    Color = clWhite
    Visible = False
    BorderStyle = bsSingle
    object edtNombre: TWebEdit
      Left = 20
      Top = 40
      Width = 380
      Height = 35
      TextHint = 'Nombre'
      Font.Size = 12
    end
    object edtDescripcion: TWebEdit
      Left = 20
      Top = 90
      Width = 380
      Height = 80
      TextHint = 'Descripcin'
      Font.Size = 12
    end
    object chkActivo: TWebCheckBox
      Left = 20
      Top = 185
      Width = 150
      Height = 25
      Caption = 'Activo'
      Font.Size = 12
      Checked = True
    end
    object btnGuardar: TWebButton
      Left = 20
      Top = 230
      Width = 180
      Height = 40
      Caption = 'Guardar'
      Font.Size = 12
      Font.Style = [fsBold]
      Font.Color = clWhite
      Color = $00CE8231
      OnClick = btnGuardarClick
    end
    object btnCancelar: TWebButton
      Left = 220
      Top = 230
      Width = 180
      Height = 40
      Caption = 'Cancelar'
      Font.Size = 12
      Color = $00F0E8E2
      OnClick = btnCancelarClick
    end
  end
  object dlgPermisos: TWebPanel
    Left = 200
    Top = 150
    Width = 560
    Height = 520
    Color = clWhite
    Visible = False
    BorderStyle = bsSingle
  end
end
