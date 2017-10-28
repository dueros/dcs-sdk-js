
const EventEmitter=require("events");
const DcsClient=require("./dcs_client");

function cloneObject(object){
    return JSON.parse(JSON.stringify(object));
}
function convertDcsEvent2AvsEvent(dcs_request){
    let eventRules=require("./dcs_and_avs_events.js");
    let contextRules=require("./dcs_and_avs_contexts.js");
    let avs_event;
    eventRules.forEach((rule)=>{
        //apply event rule
        let event=dcs_request.event;
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
    if(dcs_request.clientContext){
        contextRules.forEach((rule)=>{
            dcs_request.clientContext.forEach((context)=>{
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
function convertAvsDirective2DcsDirective(avs_response){
    let avs_directive=avs_response.directive;
    let dcs_directive;
    let directiveRules=require("./dcs_and_avs_directives.js");
    directiveRules.forEach((rule)=>{
        if(rule.avs_namespace!=avs_directive.namespace){
            return;
        }
        if(rule.avs_name && rule.avs_name!=avs_directive.name){
            return;
        }
        
        dcs_directive=cloneObject(avs_directive);
        if(rule.dcs_namespace){
            dcs_directive.header.namespace=rule.dcs_namespace;
        }
        if(rule.dcs_name){
            dcs_directive.header.name=rule.dcs_name;
        }
        if(rule.func){
            dcs_directive=rule.func(avs_directive,dcs_directive);
        }
    });
    if(dcs_directive){
        return {
            "directive":dcs_directive
        };
    }
    return null;
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
        if(!args[0]){
            return;
        }
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
