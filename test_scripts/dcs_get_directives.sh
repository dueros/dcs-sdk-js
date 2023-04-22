alias curl2=~/local/bin/curl

node -e 'let c=require("./config").getAll();console.log(JSON.stringify(c,null,"  "));' >dcs_config.json
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

curl2 -k -v $protocol_param   "$schema$ip$directive_uri" -H "Host: $host"  -H "Authorization: Bearer $oauth_token" -H "Dueros-Device-Id: $device_id"

