alias curl2=~/local/bin/curl

ip=$(jq -r .ip dcs_config.json)
oauth_token=$(jq -r .oauth_token dcs_config.json)
directive_uri=$(jq -r .directive_uri dcs_config.json)
events_uri=$(jq -r .events_uri dcs_config.json)
schema=$(jq -r .schema dcs_config.json)
protocol=$(jq -r .protocol dcs_config.json)
device_id=$(jq -r .device_id dcs_config.json)
host=$(jq -r .host dcs_config.json)

if [ x$protocol == "xhttp2" ];then
    protocol_param="--http2"
fi

curl2 -k -v $protocol_param   "$schema$ip$directive_uri" -H "Host: $host"  -H "Authorization: Bearer $oauth_token" -H "DeviceSerialNumber: $device_id"
#curl2 -k -v  "http://nj03-rp-m22nlp159.nj03.baidu.com:8998$directive_uri" -H "Host: avs-dumi-na.baidu.com"  -H "Authorization: Bearer $oauth_token" -H "DeviceSerialNumber: luoxing_dumi_xxxxxxx"

