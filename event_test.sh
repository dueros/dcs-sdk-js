node -e 'let c=require("./config").getAll();console.log(JSON.stringify(c,null,"  "));' >dcs_config.json
ip=$(jq -r .ip dcs_config.json)
oauth_token=$(jq -r .oauth_token dcs_config.json)


directive_uri=$(jq -r .directive_uri dcs_config.json)
events_uri=$(jq -r .events_uri dcs_config.json)

schema=$(jq -r .schema dcs_config.json)
host=$(jq -r .host dcs_config.json)
device_id=$(jq -r .device_id dcs_config.json)


#ip="dueros-h2-dbp.baidu.com"
#host="dueros-h2-dbp.baidu.com"
#ip="dueros-h2.baidu.com"
#oauth_token="Bearer 28.b7cbb1f6a15b750b756e9bbf49447e39.2592000.1529032262.2605635853-10406603"
#device_id="97CB941E20F3BBE269117A3DE37065115F1162B13E1C4B9DA31DC1836A721D9A"

rec_AUDIODEV=$(jq -r .rec_env.AUDIODEV dcs_config.json)

SAIYALOGID=$(jq -r .device_id dcs_config.json)_dcs_test_$(date +%s)
echo $SAIYALOGID > last_saiya_logid
#proxy="--proxy1.0 127.0.0.1:8888"

protocol=$(jq -r .protocol dcs_config.json)
if [ x$protocol == "xhttp2" ];then
    protocol_param="--http2"
fi

#{"clientContext":[{"header":{"name":"ViewState","namespace":"ai.dueros.device_interface.screen"},"payload":{"swanState":{"devicePixelRatio":1,"enableWakeup":true,"height":600,"swanVersion":"Swan/1.0.27JsCore/0.1.21","width":1024},"token":""}},{"header":{"name":"SpeechState","namespace":"ai.dueros.device_interface.voice_output"},"payload":{"offsetInMilliseconds":0,"playerActivity":"FINISHED","token":"eyJib3RfaWQiOiJ1cyIsInJlc3VsdF90b2tlbiI6Ijk0MTYwZDkwNWRjMWM3MGY3N2Y1MTcwYTAyOTNhY2YzIiwiYm90X3Rva2VuIjoibnVsbCJ9"}},{"header":{"name":"AlertsState","namespace":"ai.dueros.device_interface.alerts"},"payload":{"activeAlerts":[],"allAlerts":[]}},{"header":{"name":"GpsState","namespace":"ai.dueros.device_interface.location"},"payload":{"geoCoordinateSystem":"BD09LL","latitude":40.050269,"longitude":116.279237}}],"event":{"header":{"name":"LinkClicked","namespace":"ai.dueros.device_interface.screen","messageId":"8c0921b4-d162-4cb1-b557-e1ce7c32862e"},"payload":{"token":null,"url":"dueros://server.dueros.ai/query?q=申通快递"}}}

#{ "event": { "header": { "namespace": "ai.dueros.device_interface.text_input", "name": "TextInput", "messageId": "wp1514205733437" }, "payload": { "query": "北京天气" } } }

# { "event": { "header": { "namespace": "ai.dueros.device_interface.screen", "name": "LinkClicked", "messageId": "wp1514205733437" }, "payload": { "url": "dueros://audio_unicast/play?list_id=57353474697" } } }


cat >postbody.php <<END
------------------------------4ebf00fbcf09
Content-Disposition: form-data; name="metadata"
Content-Type: application/json; charset=UTF-8


{
  "event": {
    "header": {
      "namespace": "ai.dueros.device_interface.text_input",
      "name": "TextInput",
      "messageId": "wp1514205733437"
    },
    "payload": {
      "query": "回到首页"
    }
  }
}



------------------------------4ebf00fbcf09--
END

php postbody.php > postbody

curl -k -v -X POST $protocol_param   "$schema$ip$events_uri" -H "SAIYALOGID: $SAIYALOGID" -H "Expect:" -H "Host: $host"  -H "Authorization: Bearer $oauth_token" -H "Dueros-Device-Id: $device_id"  -H "Content-Type: multipart/form-data; boundary=----------------------------4ebf00fbcf09" --data-binary @postbody
