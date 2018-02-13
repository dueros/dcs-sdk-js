module.exports = [{
        dcs_namespace: 'ai.dueros.device_interface.alerts',
        avs_namespace: "Alerts",
        dcs_name: "SetAlert",
        avs_name: "SetAlert",
    },
    {
        dcs_namespace: 'ai.dueros.device_interface.alerts',
        avs_namespace: "Alerts",
        dcs_name: "DeleteAlert",
        avs_name: "DeleteAlert",
    },
    {
        dcs_namespace: 'ai.dueros.device_interface.audio_player',
        avs_namespace: "AudioPlayer",
        avs_name: "Play",
        dcs_name: "Play",
    },
    {
        dcs_namespace: 'ai.dueros.device_interface.audio_player',
        avs_namespace: "AudioPlayer",
        avs_name: "Stop",
        dcs_name: "Stop",
    },
    {
        dcs_namespace: 'ai.dueros.device_interface.audio_player',
        avs_namespace: "AudioPlayer",
        avs_name: "ClearQueue",
        dcs_name: "ClearQueue",
    },
    {
        dcs_namespace: 'ai.dueros.device_interface.speaker_controller',
        avs_namespace: "Speaker",
        dcs_name: "SetVolume",
        avs_name: "SetVolume",
    },
    {
        dcs_namespace: 'ai.dueros.device_interface.speaker_controller',
        avs_namespace: "Speaker",
        dcs_name: "AdjustVolume",
        avs_name: "AdjustVolume",
    },
    {
        dcs_namespace: 'ai.dueros.device_interface.speaker_controller',
        avs_namespace: "Speaker",
        dcs_name: "SetMute",
        avs_name: "SetMute",
    },
    {
        dcs_namespace: 'ai.dueros.device_interface.voice_input',
        avs_namespace: "SpeechRecognizer",
        dcs_name: "StopListen",
        avs_name: "StopCapture",
    },
    {
        dcs_namespace: 'ai.dueros.device_interface.voice_input',
        avs_namespace: "SpeechRecognizer",
        dcs_name: "Listen",
        avs_name: "ExpectSpeech",
    },
    {
        dcs_namespace: 'ai.dueros.device_interface.voice_output',
        avs_namespace: "SpeechSynthesizer",
        dcs_name: "Speak",
        avs_name: "Speak",
    },

    {
        avs_namespace: "TemplateRuntime",
        avs_name: "RenderTemplate",
        func: (avs_directive) => {
            if (avs_directive.payload.type == "BodyTemplate1") {
                return {
                    "header": {
                        "namespace": "ai.dueros.device_interface.screen",
                        "name": "RenderCard",
                        "messageId": avs_directive.header.messageId,
                        "dialogRequestId": avs_directive.header.dialogRequestId
                    },
                    "payload": {
                        "token": avs_directive.payload.token,
                        "type": "TextCard",
                        "content": avs_directive.payload.textField,
                    }
                };
            }
            if (avs_directive.payload.type == "BodyTemplate2") {
                return {
                    "header": {
                        "namespace": "ai.dueros.device_interface.screen",
                        "name": "RenderCard",
                        "messageId": avs_directive.header.messageId,
                        "dialogRequestId": avs_directive.header.dialogRequestId
                    },
                    "payload": {
                        "token": avs_directive.payload.token,
                        "type": "StandardCard",
                        "content": avs_directive.payload.textField,
                        "image": {
                            "src": avs_directive.payload.image.sources[0].url ? avs_directive.payload.image.sources[0].url : avs_directive.payload.image.sources[0].src,
                        }
                    }
                };
            }
            if (avs_directive.payload.type == "ListTemplate1") {
                return {
                    "header": {
                        "namespace": "ai.dueros.device_interface.screen",
                        "name": "RenderCard",
                        "messageId": avs_directive.header.messageId,
                        "dialogRequestId": avs_directive.header.dialogRequestId
                    },
                    "payload": {
                        "token": avs_directive.payload.token,
                        "type": "ListCard",
                        "title": avs_directive.payload.title.mainTitle,
                        "list": avs_directive.payload.listItems.map((item) => {
                            return {
                                "title": item.leftTextField,
                                "content": item.rightTextField
                            };
                        }),
                    }
                };
            }
        }
    },
    /*
    { directive:
   { header:
      { namespace: 'TemplateRuntime',
        name: 'RenderTemplate',
        messageId: 'wp1516593664009',
        dialogRequestId: 'wp1516593664009' },
     payload:
      { type: 'BodyTemplate1',
        token: '3510eafc5f6ff98610a829b6d6776b81',
        textField: '大壮，差一步',
        title: [Object] } } }'
        */

];