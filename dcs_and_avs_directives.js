module.exports=[ 
    { 
        dcs_namespace: 'ai.dueros.device_interface.alerts' ,
        avs_namespace:"Alerts",
        dcs_name:"SetAlert",
        avs_name:"SetAlert",
    },
    { 
        dcs_namespace: 'ai.dueros.device_interface.alerts' ,
        avs_namespace:"Alerts",
        dcs_name:"DeleteAlert",
        avs_name:"DeleteAlert",
    },
    { 
        dcs_namespace: 'ai.dueros.device_interface.audio_player',
        avs_namespace:"AudioPlayer",
        avs_name:"Play",
        dcs_name:"Play",
    },
    { 
        dcs_namespace: 'ai.dueros.device_interface.audio_player',
        avs_namespace:"AudioPlayer",
        avs_name:"Stop",
        dcs_name:"Stop",
    },
    { 
        dcs_namespace: 'ai.dueros.device_interface.audio_player',
        avs_namespace:"AudioPlayer",
        avs_name:"ClearQueue",
        dcs_name:"ClearQueue",
    },
    { 
        dcs_namespace: 'ai.dueros.device_interface.speaker_controller',
        avs_namespace:"Speaker",
        dcs_name:"SetVolume",
        avs_name:"SetVolume",
    },
    { 
        dcs_namespace: 'ai.dueros.device_interface.speaker_controller',
        avs_namespace:"Speaker",
        dcs_name:"AdjustVolume",
        avs_name:"AdjustVolume",
    },
    { 
        dcs_namespace: 'ai.dueros.device_interface.speaker_controller',
        avs_namespace:"Speaker",
        dcs_name:"SetMute",
        avs_name:"SetMute",
    },
    { 
        dcs_namespace: 'ai.dueros.device_interface.voice_input',
        avs_namespace:"SpeechRecognizer",
        dcs_name:"StopListen",
        avs_name:"StopCapture",
    },
    { 
        dcs_namespace: 'ai.dueros.device_interface.voice_input',
        avs_namespace:"SpeechRecognizer",
        dcs_name:"Listen",
        avs_name:"ExpectSpeech",
    },
    { 
        dcs_namespace: 'ai.dueros.device_interface.voice_output',
        avs_namespace:"SpeechSynthesizer",
        dcs_name:"Speak",
        avs_name:"Speak",
    }
];


