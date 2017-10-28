
const EventEmitter=require("events");
const DcsClient=require("./dcs_client");

function cloneObject(object){
    return JSON.parse(JSON.stringify(object));
}
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
    let avs_event;
    eventRules.forEach((rule)=>{
        //apply event rule
        let event=dcs_event.event;
        if(rule.dcs_namespace!=event.namespace){
            return;
        }
        if(rule.dcs_name && rule.dcs_name!=event.name){
            return;
        }
        
        avs_event=cloneObject(event);
        if(rule.avs_namespace){
            avs_event.header.namespace=rule.avs_namespace;
        }
        if(rule.avs_name){
            avs_event.header.name=rule.avs_name;
        }
        if(rule.func){
            avs_event=rule.func(event,avs_event);
        }
    });
    if(dcs_event.clientContext){
        contextRules.forEach((rule)=>{
            dcs_event.clientContext.forEach((context)=>{
                if(rule.dcs_namespace!=context.namespace){
                    return;
                }
                if(rule.dcs_name && rule.dcs_name!=context.name){
                    return;
                }
                
                let avs_context=cloneObject(context);
                if(rule.avs_namespace){
                    avs_context.header.namespace=rule.avs_namespace;
                }
                if(rule.avs_name){
                    avs_context.header.name=rule.avs_name;
                }
                if(rule.func){
                    avs_context=rule.func(event,avs_context);
                }
                avs_contexts.push(avs_context);
            });
        });
    }
    if(avs_event){
        let ret={"event":avs_event};
        if(avs_contexts){
            ret.context=avs_contexts;
        }
        return ret;
    }
    return null;
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
