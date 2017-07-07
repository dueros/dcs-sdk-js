ip=$(jq -r .ip dcs_config.json)
oauth_token=$(jq -r .oauth_token dcs_config.json)
directive_uri=$(jq -r .directive_uri dcs_config.json)
events_uri=$(jq -r .events_uri dcs_config.json)

schema=$(jq -r .schema dcs_config.json)
host=$(jq -r .host dcs_config.json)
device_id=$(jq -r .device_id dcs_config.json)
rec_AUDIODEV=$(jq -r .rec_env.AUDIODEV dcs_config.json)

php postbody.php > postbody

curl -k -v -X POST $protocol_param   "$schema$ip$events_uri" -H "Expect:" -H "Host: $host"  -H "Authorization: Bearer $oauth_token" -H "DeviceSerialNumber: $device_id"  -H "Content-Type: multipart/form-data; boundary=----------------------------4ebf00fbcf09" --data-binary @postbody >res.mp3

php -r '$a=file_get_contents("res.mp3");$a=explode("--___dumi_avs_xuejuntao___",$a);file_put_contents("res1.mp3",$a[2]);'
php -r '$a=file_get_contents("res.mp3");$a=explode("\r\n",$a,5);file_put_contents("res2.mp3",$a[4]);'
play res2.mp3
