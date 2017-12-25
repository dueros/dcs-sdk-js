node -e 'let c=require("./config").getAll();console.log(JSON.stringify(c,null,"  "));' >dcs_config.json
ip=$(jq -r .ip dcs_config.json)
oauth_token=$(jq -r .oauth_token dcs_config.json)
directive_uri=$(jq -r .directive_uri dcs_config.json)
events_uri=$(jq -r .events_uri dcs_config.json)

schema=$(jq -r .schema dcs_config.json)
host=$(jq -r .host dcs_config.json)
device_id=$(jq -r .device_id dcs_config.json)
rec_AUDIODEV=$(jq -r .rec_env.AUDIODEV dcs_config.json)

SAIYALOGID=$(jq -r .device_id dcs_config.json)_dcs_test_$(date +%s)
echo $SAIYALOGID > last_saiya_logid
#proxy="--proxy1.0 127.0.0.1:8888"

protocol=$(jq -r .protocol dcs_config.json)
if [ x$protocol == "xhttp2" ];then
    protocol_param="--http2"
fi


cat >postbody.php <<END
------------------------------4ebf00fbcf09
Content-Disposition: form-data; name="metadata"
Content-Type: application/json; charset=UTF-8


{
  "event": {
    "header": {
      "namespace": "ai.dueros.device_interface.extensions.replay",
      "name": "ReplayRequested",
      "messageId": "wp1514205733437"
    },
    "payload": {
      "token": "YXVkaW9fbXVzaWMrZXlKaWIzUmZhV1FpT2lKaGRXUnBiMTl0ZFhOcFl5SXNJbkpsYzNWc2RGOTBiMnRsYmlJNkltRmtOekkzTTJSak9XRTNNalE1WldabVkySmpPR0ZoTUdZell6Y3haV0k0SWl3aVltOTBYM1J2YTJWdUlqb2lNVEF6TURjeU16VXlOaUo5",
      "accept": [
        {
          "namespace": "ai.dueros.device_interface.screen_extended_card",
          "name": [
            "RenderPlayerInfo"
          ]
        }
      ]
    }
  }
}


------------------------------4ebf00fbcf09--
END

php postbody.php > postbody

curl -k -v -X POST $protocol_param   "$schema$ip$events_uri" -H "SAIYALOGID: $SAIYALOGID" -H "Expect:" -H "Host: $host"  -H "Authorization: Bearer $oauth_token" -H "Dueros-Device-Id: $device_id"  -H "Content-Type: multipart/form-data; boundary=----------------------------4ebf00fbcf09" --data-binary @postbody
