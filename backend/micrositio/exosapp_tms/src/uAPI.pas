unit uAPI;

interface

uses
  SysUtils, Classes, WEBLib.JSON, NetEncoding;

const
  WS_BASE_URL = 'http://exorta.dvl.to/webservice/controller_ws_rest.php';

type
  TAPIResponse = record
    Success: Boolean;
    Data: TJSONValue;
    Message: string;
  end;

  TAPIResponseProc = reference to procedure(const AResponse: TAPIResponse);

  TAPI = class
  private
    class function BuildURL(const Action: string): string;
    class procedure DoRequest(const AURL, AMethod, ABody: string; ACallback: TAPIResponseProc);
  public
    class procedure Get(const Action: string; ACallback: TAPIResponseProc);
    class procedure Post(const Action: string; Payload: TJSONObject; ACallback: TAPIResponseProc);
    class function NormalizeList(Data: TJSONValue): TJSONArray;
    class function ParseResponse(const AResponse: string): TAPIResponse;
  end;

implementation

uses
  Web, JS;

class function TAPI.BuildURL(const Action: string): string;
begin
  Result := WS_BASE_URL + '?action=' + TNetEncoding.URL.Encode(Action);
end;

class procedure TAPI.DoRequest(const AURL, AMethod, ABody: string; ACallback: TAPIResponseProc);
var
  XHR: TJSXMLHttpRequest;
begin
  XHR := TJSXMLHttpRequest.New;
  XHR.open(AMethod, AURL, True);
  if ABody <> '' then
    XHR.setRequestHeader('Content-Type', 'application/json');
  XHR.OnReadyStateChange :=
    procedure
    begin
      if XHR.ReadyState = 4 then
      begin
        if Assigned(ACallback) then
          ACallback(ParseResponse(XHR.ResponseText));
      end;
    end;
  if ABody <> '' then
    XHR.Send(ABody)
  else
    XHR.Send;
end;

class procedure TAPI.Get(const Action: string; ACallback: TAPIResponseProc);
begin
  DoRequest(BuildURL(Action), 'GET', '', ACallback);
end;

class procedure TAPI.Post(const Action: string; Payload: TJSONObject; ACallback: TAPIResponseProc);
begin
  DoRequest(BuildURL(Action), 'POST', Payload.ToString, ACallback);
end;

class function TAPI.ParseResponse(const AResponse: string): TAPIResponse;
var
  JSON: TJSONValue;
begin
  Result.Success := False;
  Result.Data := nil;
  Result.Message := '';

  JSON := TJSONObject.ParseJSONValue(AResponse);
  if Assigned(JSON) then
  begin
    try
      Result.Success := JSON.GetValue<string>('result') = 'ok';
      if Result.Success then
        Result.Data := JSON.GetValue<TJSONValue>('data');
      Result.Message := JSON.GetValue<string>('result_text');
    except
      Result.Message := 'Error al procesar respuesta';
    end;
  end;
end;

class function TAPI.NormalizeList(Data: TJSONValue): TJSONArray;
var
  Parsed: TJSONValue;
begin
  if not Assigned(Data) then
  begin
    Result := TJSONArray.Create;
    Exit;
  end;

  if Data is TJSONArray then
  begin
    Result := Data as TJSONArray;
  end
  else
  begin
    Parsed := TJSONObject.ParseJSONValue('[' + Data.ToString + ']');
    if Assigned(Parsed) and (Parsed is TJSONArray) then
      Result := Parsed as TJSONArray
    else
      Result := TJSONArray.Create;
  end;
end;

end.
