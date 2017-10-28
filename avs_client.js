
const EventEmitter=require("events");
const DcsClient=require("./dcs_client");
function convertDcsEvent2AvsEvent(dcs_event){
    let eventRules=[ 
        { 
            dcs_namespace: 'ai.dueros.device_interface.alerts' 
            dcs_name:"SetAlertSucceeded",
        },
        { 
            dcs_namespace: 'ai.dueros.device_interface.alerts' 
            dcs_name:"SetAlertFailed",
        },
        { 
            dcs_namespace: 'ai.dueros.device_interface.alerts' 
            dcs_name:"DeleteAlertSucceeded",
        },
        { 
            dcs_namespace: 'ai.dueros.device_interface.alerts' 
            dcs_name:"DeleteAlertFailed",
        },
        { 
            dcs_namespace: 'ai.dueros.device_interface.alerts' 
            dcs_name:"AlertStarted",
        },
        { 
            dcs_namespace: 'ai.dueros.device_interface.audio_player' 
        },
        { 
            dcs_namespace: 'ai.dueros.device_interface.speaker_controller' 
        },
        { 
            dcs_namespace: 'ai.dueros.device_interface.voice_output' 
        },
        { 
            dcs_namespace: 'ai.dueros.device_interface.voice_input' 
        },
        { 
            dcs_namespace: 'ai.dueros.device_interface.screen' 
        },
        { 
            dcs_namespace: 'ai.dueros.device_interface.http' 
        } 
    ];
}
function convertAvsDirective2DcsDirective(avs_directive){

}
class AvsClient extends EventEmitter{
    constructor(options){
        let dcs_client=this.dcs_client=new DcsClient(options);
        dcs_client.on("content",(...args)=>{
            this.emit("content",...args);
        });
        dcs_client.on("directive",(...args)=>{
            args[0]=convertAvsDirective2DcsDirective(args[0]);
            this.emit("directive",...args);
        });
    }
    sendEvent(...args){
        args[0]=convertDcsEvent2AvsEvent(args[0]);
        this.dcs_client.startRecognize.apply(this.dcs_client,args)
    }
    startRecognize(...args){
        args[0]=convertDcsEvent2AvsEvent(args[0]);
        this.dcs_client.startRecognize.apply(this.dcs_client,args)
    }
    stopRecognize(...args){
        this.dcs_client.startRecognize.apply(this.dcs_client,args)
    }
    isRecognizing(...args){
        this.dcs_client.startRecognize.apply(this.dcs_client,args)
    }
}
