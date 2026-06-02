<?php
$STREAM_CHAT_APP_NAME = "Esdimed";
$STREAM_CHAT_APPS = [
		"Esdimed" => [
			"AppID" => "1614341",
			"apiKey" => "p7v84erghkqb",
			"apiSecret" => "e2j3cs3uw8xy868em3vby6zvjruh5ku435we8uaytauzbru92jqgx9rzuq6vumva"
			]
	];

function Stream_chat_key(){
	global $STREAM_CHAT_APPS, $STREAM_CHAT_APP_NAME;
	return $STREAM_CHAT_APPS[$STREAM_CHAT_APP_NAME];
}

?>