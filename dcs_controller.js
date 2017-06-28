const util = require('util');
const EventEmitter=require("events");
const DcsProtocol=require("./dcs_protocol");
const DataStreamPlayer=require("./data_stream_player");
const AudioManager=require("./audio_manager");
const AlertManager=require("./alert_manager");
const TTSManager=require("./tts_manager");
const SynchronousPromise=require("synchronous-promise").SynchronousPromise;
const directive_handlers={
    /*
     *
{
  "directive": {
    "header": {
      "namespace": "SpeechSynthesizer",
      "name": "Speak",
      "dialogRequestId": "string",
      "messageId": "string"
    },
    "payload": {
      "format": "AUDIO_MPEG",
      "token": "1495556956_13665vo42",
      "url": "cid:97"
    }
  }
}
     */
    "ai.dueros.device_interface.voice_output":function(directive){
        return this.ttsManager.handleDirective(directive,this);
    },
    "ai.dueros.device_interface.audio_player":function(directive){
        return this.audioManager.handleDirective(directive,this);
    }
};

function DcsController(options){
    this.alertManager=new AlertManager();
    this.audioManager=new AudioManager();
    this.ttsManager=new TTSManager();
    this.audioManager.on("stop",()=>{
        this.emit("event",DcsProtocol.createEvent("AudioPlayer","PlaybackStopped",this.getContext()));
    });
    this.audioManager.on("pause",()=>{
        this.emit("event",DcsProtocol.createEvent("AudioPlayer","PlaybackPaused",this.getContext()));
    });
    this.audioManager.on("finished",()=>{
        this.emit("event",DcsProtocol.createEvent("AudioPlayer","PlaybackNearlyFinished",this.getContext()));
        this.emit("event",DcsProtocol.createEvent("AudioPlayer","PlaybackFinished",this.getContext()));
    });
    this.audioManager.on("play",()=>{
        this.emit("event",DcsProtocol.createEvent("AudioPlayer","PlaybackStarted",this.getContext()));
    });
    this._contents={};
    this.queue=[];
}
util.inherits(DcsController, EventEmitter);

DcsController.prototype.isPlaying=function(){
    return (this.audioManager.isPlaying()||this.ttsManager.isPlaying());

};

DcsController.prototype.getContext=function(){
    var context=[];
    var alertContext=this.alertManager.getContext();
    if(alertContext){
        context.push(alertContext);
    }
    var audioContext=this.audioManager.getContext();
    if(audioContext){
        context.push(audioContext);
    }

    context.push({
        "header": {
            "namespace": "ai.dueros.device_interface.voice_output",
            "name": "ListenState"
        },
        "payload": {
            "wakeword":"小度小度"
        }
    });

    return context;
    //TODO get all alerts
    //TODO get audio player
    //TODO get speaker status

};
DcsController.prototype.getContentPromise=function(cid){
    if(this._contents[cid]){
        return this._contents[cid];
    }
    var _resolve,_reject;
    var promise=new SynchronousPromise(function(resolve,reject){
        _resolve=resolve;
        _reject=reject;
    });
    promise.resolve=_resolve;
    promise.reject=_reject;
    this._contents[cid]=promise;
    promise.then((args)=>{
        delete this._contents[cid];
        delete promise.resolve;
        delete promise.reject;
        return SynchronousPromise.resolve(args);
    });
    return promise;
};

DcsController.prototype.setClient=function(client){
    this.client=client;
    client.on("directive",(response)=>{
        this.handleResponse(response);
        this.emit("directive",response);
    });
    client.on("content",(content_id,content)=>{
        this.handleContent(content_id,content);
        this.emit("content",content_id,content);
    });
    this.on("event",(dcs_event)=>{
        client.sendEvent(dcs_event);
    });
};

DcsController.prototype.handleContent=function(content_id,content){
    this.getContentPromise(content_id).resolve([content_id,content]);
};

DcsController.prototype.handleResponse=function(response){
    if(response){
        this.queue.push(response);
    }
    if(!this.processing){
        this.deQueue();
    }
};


DcsController.prototype.stopPlay=function(directive){
    this.audioManager.stop();
    this.ttsManager.stop();
};

DcsController.prototype.startRecognize=function(options){
    this.stopPlay();
    if(this.client){
        return this.client.startRecognize(DcsProtocol.createRecognizeEvent(options),options.wakeWordPcm);
    }
    return false;
};
DcsController.prototype.stopRecognize=function(){
    if(this.client){
        return this.client.stopRecognize();
    }
    return false;
};
DcsController.prototype.isRecognizing=function(){
    if(this.client){
        return this.client.isRecognizing();
    }
    return false;
};
DcsController.prototype.deQueue=function(){
    this.processing=true;
    var response=this.queue.shift();
    if(!response||!response.directive){
        this.processing=false;
        return;
    }
    var directive=response.directive;
    var key=directive.header.namespace+"."+directive.header.name;
    var promise;
    do{
        if(directive_handlers.hasOwnProperty(key)){
            promise=directive_handlers[key].call(this,directive);
            break;
        }
        let parts=key.split(".");
        parts.pop();
        key=parts.join(".");
    }while(key);

    if(promise && promise.then){
        promise.then(()=>{this.deQueue()});
    }else{
        this.deQueue();
    }
};


module.exports=DcsController;
