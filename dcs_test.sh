alias curl2=~/local/bin/curl

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

#echo $rec_AUDIODEV
#if [ "x$rec_AUDIODEV" == "xnull" ];then
#    rec -t wav test.wav
#else
#    AUDIODEV="$rec_AUDIODEV" rec -t wav test.wav
#fi
sox test.wav -t wav -r16000 -c1 -b 16 test_mic.wav

cat >postbody.php <<END
------------------------------4ebf00fbcf09
Content-Disposition: form-data; name="metadata"
Content-Type: application/json; charset=UTF-8


{
  "event" : {
    "header" : {
      "namespace" : "ai.dueros.device_interface.voice_input",
      "name" : "ListenStarted",
      "messageId" : "71c0cf96-6243-4fff-853d-7d63ef4123dd",
      "dialogRequestId" : "e5c713d0-f5ec-48c6-89bf-a023c38512d7"
    },
    "payload" : {
      "format" : "AUDIO_L16_RATE_16000_CHANNELS_1"
    }
  },
  "clientContext" : [ {
    "header" : {
      "namespace" : "ai.dueros.device_interface.audio_player",
      "name" : "PlaybackState"
    },
    "payload" : {
      "token" : "",
      "offsetInMilliseconds" : 0,
      "playerActivity" : "IDLE"
    }
  }, {
    "header" : {
      "namespace" : "ai.dueros.device_interface.voice_output",
      "name" : "SpeechState"
    },
    "payload" : {
      "token" : "",
      "offsetInMilliseconds" : 0,
      "playerActivity" : "FINISHED"
    }
  }, {
    "header" : {
      "namespace" : "ai.dueros.device_interface.alerts",
      "name" : "AlertsState"

},
    "payload" : {
      "allAlerts" : [ ],
      "activeAlerts" : [ ]
    }
  }, {
    "header" : {
      "namespace" : "ai.dueros.device_interface.speaker_controller",
      "name" : "VolumeState"
    },
    "payload" : {
      "volume" : 50,
      "muted" : false
    }
  }
]
}


------------------------------4ebf00fbcf09
Content-Disposition: form-data; name="audio"
Content-Type: application/octet-stream

<?php echo substr(file_get_contents("test_mic.wav"),44) ?>

------------------------------4ebf00fbcf09--
END

php postbody.php > postbody

curl -k -v -X POST $protocol_param   "$schema$ip$events_uri" -H "SAIYALOGID: $SAIYALOGID" -H "Expect:" -H "Host: $host"  -H "Authorization: Bearer $oauth_token" -H "DeviceSerialNumber: $device_id"  -H "Content-Type: multipart/form-data; boundary=----------------------------4ebf00fbcf09" --data-binary @postbody >res.mp3

php -r '$a=file_get_contents("res.mp3");$a=explode("--___dumi_avs_xuejuntao___",$a);file_put_contents("res1.mp3",$a[2]);'
php -r '$a=file_get_contents("res.mp3");$a=explode("\r\n",$a,5);file_put_contents("res2.mp3",$a[4]);'
play res2.mp3
