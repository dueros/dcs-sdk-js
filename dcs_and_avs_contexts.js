module.exports=[ 
    { 
        dcs_namespace: 'ai.dueros.device_interface.alerts' ,
        dcs_name:"AlertsState",
        avs_name:"AlertsState",
        avs_namespace:"Alerts",
    },
    { 
        dcs_namespace: 'ai.dueros.device_interface.speaker_controller',
        avs_namespace:"Speaker",
        dcs_name:"VolumeState",
        avs_name:"VolumeState",
    },
    { 
        dcs_namespace: 'ai.dueros.device_interface.audio_player',
        avs_namespace:"AudioPlayer",
        avs_name:"PlaybackState",
        dcs_name:"PlaybackState",
    },
    { 
        dcs_namespace: 'ai.dueros.device_interface.voice_input',
        avs_namespace:"SpeechRecognizer",
        dcs_name:"ListenState",
        avs_name:"RecognizerState",
    },
    { 
        dcs_namespace: 'ai.dueros.device_interface.voice_output',
        avs_namespace:"SpeechSynthesizer",
        dcs_name:"SpeechState",
        avs_name:"SpeechState",
    }
];

