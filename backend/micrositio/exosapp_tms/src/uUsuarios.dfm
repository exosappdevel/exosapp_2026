object frmUsuarios: TfrmUsuarios
  Left = 0
  Top = 0
  Caption = 'Usuarios'
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
    Caption = 'Usuarios'
    Font.Size = 18
    Font.Style = [fsBold]
  end
  object edtSearch: TWebEdit
    Left = 20
    Top = 70
    Width = 360
    Height = 40
    TextHint = 'Buscar usuario por nombre...'
    Font.Size = 12
    OnChange = edtSearchChange
  end
  object grdUsuarios: TWebStringGrid
    Left = 20
    Top = 130
    Width = 940
    Height = 500
    ColCount = 3
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
end
