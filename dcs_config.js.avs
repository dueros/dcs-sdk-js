module.exports={
    "boundary":"___dumi_avs_client_wangpeng20___",
    "directive_uri":"/dcs/v1/directives",
    "events_uri":"/dcs/v1/events",
    "ping_uri":"/dcs/v1/ping",
    "device_id":"dlp_mock_server_1508746909",


    "host":"dueros-h2.baidu.com",
    "ip":"dueros-h2.baidu.com",

    "avs_protocol":true,
    "avs_directive_uri":"/dcs/avs-compatible-v20160207/directives",
    "avs_events_uri":"/dcs/avs-compatible-v20160207/events",
    "avs_ping_uri":"/dcs/v1/ping",

    
    
    "schema":"http://",
    "protocol":"http",
    
    "downstream_protocol":"http",
    "downstream_protocol":"http2",
    
    "rec_env":{},
    "play_env":{},
    

    "desc":"这个debug_boss是测试音乐用的服务，去掉下面的 '111' 再执行 'cp dcs_config.json dcs-sdk-js' 可以生效",
    "event_header":{
        "from_mac":"1",
        //"debug_boss":"cq02-ps-spider01.cq02.baidu.com:8984"
    },

//    "debug": {
//        // 增加参数
//        "bot": {
//            // 你bot的id
//            "id": "82425e9b-eb93-ad15-c087-5a7d22af70c3"
//        },
//        // 固定
//        "simulator": true
//    }
    

    "rec_sample_rate":"44100",
    "rec_bits":"32",
    "rec_channel":"2",

    "rec_cmd":"/usr/local/bin/rec",
    "play_cmd":"/usr/local/bin/play",
    "sox_cmd":"/usr/local/bin/sox",
    
    "oauth_token":""
};
