object frmLogin: TfrmLogin
  Left = 0
  Top = 0
  Caption = 'ExosApp - Login'
  Width = 400
  Height = 600
  Font.Name = 'Segoe UI'
  Font.Size = 10
  Color = clWhite
  OnCreate = FormCreate
  object lblTitle: TWebLabel
    Left = 40
    Top = 80
    Width = 320
    Height = 40
    Caption = 'ExosApp'
    Font.Size = 24
    Font.Style = [fsBold]
    Font.Color = clWhite
    Alignment = taCenter
  end
  object edtUsuario: TWebEdit
    Left = 40
    Top = 200
    Width = 320
    Height = 45
    TextHint = 'Usuario'
    Font.Size = 14
  end
  object edtPassword: TWebEdit
    Left = 40
    Top = 260
    Width = 320
    Height = 45
    TextHint = 'Contrasea'
    PasswordChar = '*'
    Font.Size = 14
  end
  object btnLogin: TWebButton
    Left = 40
    Top = 330
    Width = 320
    Height = 50
    Caption = 'Iniciar sesin'
    Font.Size = 14
    Font.Style = [fsBold]
    Font.Color = clWhite
    Color = clNavy
    OnClick = btnLoginClick
  end
  object lblError: TWebLabel
    Left = 40
    Top = 300
    Width = 320
    Height = 20
    Caption = ''
    Font.Size = 10
    Font.Color = clRed
    Visible = False
    Alignment = taCenter
  end
end
