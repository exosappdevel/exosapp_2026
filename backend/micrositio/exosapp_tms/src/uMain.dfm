object frmMain: TfrmMain
  Left = 0
  Top = 0
  Caption = 'ExosApp - Administracin'
  Width = 1200
  Height = 800
  Font.Name = 'Segoe UI'
  Font.Size = 10
  Color = clWhite
  OnCreate = FormCreate
  object pnlTopbar: TWebPanel
    Left = 0
    Top = 0
    Width = 1200
    Height = 60
    Align = alTop
    Color = $00573800
    object lblAppName: TWebLabel
      Left = 20
      Top = 18
      Width = 250
      Height = 24
      Caption = 'ExosApp  |  Administracin'
      Font.Size = 14
      Font.Style = [fsBold]
      Font.Color = clWhite
    end
    object lblUserName: TWebLabel
      Left = 900
      Top = 20
      Width = 200
      Height = 20
      Alignment = taRightJustify
      Font.Size = 10
      Font.Color = $00D5D5D5
    end
    object btnLogout: TWebButton
      Left = 1110
      Top = 16
      Width = 80
      Height = 28
      Caption = 'Salir'
      Font.Size = 10
      Font.Color = $000038FF
      Color = $00FFFFFF
      OnClick = btnLogoutClick
    end
  end
  object pnlSideMenu: TWebPanel
    Left = 0
    Top = 60
    Width = 220
    Height = 740
    Align = alLeft
    Color = clWhite
    BorderStyle = bsSingle
    object btnPerfiles: TWebButton
      Left = 0
      Top = 0
      Width = 220
      Height = 50
      Caption = 'Perfiles'
      Font.Size = 12
      Font.Style = [fsBold]
      Color = $00EDF2F7
      Font.Color = $003182CE
      BorderStyle = bsNone
      OnClick = btnPerfilesClick
    end
    object btnUsuarios: TWebButton
      Left = 0
      Top = 50
      Width = 220
      Height = 50
      Caption = 'Usuarios'
      Font.Size = 12
      Font.Style = [fsBold]
      Color = clWhite
      BorderStyle = bsNone
      OnClick = btnUsuariosClick
    end
  end
  object pnlContent: TWebPanel
    Left = 220
    Top = 60
    Width = 980
    Height = 740
    Align = alClient
    Color = $00F5F5F5
  end
end
