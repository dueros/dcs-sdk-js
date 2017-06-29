/*
* Copyright (c) 2017 Baidu, Inc. All Rights Reserved.
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* 
*   http://www.apache.org/licenses/LICENSE-2.0
* 
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
const util = require('util');
const EventEmitter=require("events");
const DcsProtocol=require("./dcs_protocol");
const DataStreamPlayer=require("./data_stream_player");
const AudioManager=require("./audio_manager");
const AlertManager=require("./alert_manager");
const VoiceInputManager=require("./voice_input_manager");
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
    "ai.dueros.device_interface.voice_input":function(directive){
        return this.voiceInputManager.handleDirective(directive,this);
    },
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
    this.voiceInputManager=new VoiceInputManager();
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

    var voiceInputContext=this.voiceInputManager.getContext();
    if(voiceInputContext){
        context.push(voiceInputContext);
    }


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
        if(options&&options.wakeWordPcm){
            var wakeWordPcm=options.wakeWordPcm;
        }
        return this.client.startRecognize(DcsProtocol.createRecognizeEvent(options),wakeWordPcm);
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
