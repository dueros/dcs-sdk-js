function createEvent(namespace,name, context){
    var payload={};
    if(namespace=="AudioPlayer"){
        namespace="ai.dueros.device_interface.audio_player";
        context.forEach((c,idx)=>{
            if(c.header.namespace==namespace){
                payload.token=c.payload.token;
                payload.offsetInMilliseconds=c.payload.offsetInMilliseconds;
            }
        });
    }
    
    var eventData={
        "requestId":"wp"+new Date().getTime(),
        "deviceInterface": [
            {
                "header": {
                    "namespace": "ai.dueros.device_interface.audio_player",
                    "name": "AudioPlayerInterface"
                },
                "payload": {}
            },
        ],
        "clientContext": context,
        "event" : {
            "header" : {
                "namespace" : namespace,
                "name" : name,
                "messageId" : "wp"+new Date().getTime()
            },
            "payload" : payload
        },
    }
    return eventData;
}
function createRecognizeEvent(options){
    var ev={
        "requestId":"wp"+new Date().getTime(),
        "deviceInterface": [
            {
                "header": {
                    "namespace": "ai.dueros.device_interface.audio_player",
                    "name": "AudioPlayerInterface",
                },
                "payload": {}
            },
        ],
        "clientContext": [
            {
                "header": {
                    "namespace": "ai.dueros.context.audio_player",
                    "name": "PlaybackState",
                },
                "payload": {}
            },
        ],
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
    };
    if(options && options.initiator){
        ev.event.payload.initiator=options.initiator;
    }
    return ev;
}


module.exports={
    createEvent:createEvent,
    createRecognizeEvent:createRecognizeEvent,
};

