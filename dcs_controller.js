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
const AudioPlayerManager=require("./audio_player_manager");
const SpeakerManager=require("./speaker_manager");
const AlertManager=require("./alert_manager");
const VoiceInputManager=require("./voice_input_manager");
const VoiceOutputManager=require("./voice_output_manager");
const HttpManager=require("./http_manager");
const LocationManager=require("./location_manager");
const ScreenManager=require("./screen_manager");
const configModule=require("./config.js");
const config=configModule.getAll();

function DcsController(options){
    this.locationManager=new LocationManager(this);
    this.alertManager=new AlertManager(this);
    this.audioPlayerManager=new AudioPlayerManager(this);
    this.speakerManager=new SpeakerManager(this);
    this.voiceOutputManager=new VoiceOutputManager(this);
    this.voiceInputManager=new VoiceInputManager(this);
    this.screenManager=new ScreenManager(this);
    this.httpManager=new HttpManager(this);
    this.managers=[
        this.locationManager,
        this.alertManager,
        this.audioPlayerManager,
        this.speakerManager,
        this.voiceOutputManager,
        this.voiceInputManager,
        this.screenManager,
        this.httpManager,
    ];
    this._contents={};
    this.queue=[];
}
util.inherits(DcsController, EventEmitter);

DcsController.prototype.isPlaying=function(){
    return (this.audioPlayerManager.isPlaying()||this.voiceOutputManager.isPlaying()||this.alertManager.isActive());

};

DcsController.prototype.addDeviceModule=function(manager){
    this.managers.push(manager);
};

DcsController.prototype.getContext=function(namespace){
    var contexts=[];
    this.managers.forEach((manager)=>{
        let context=manager.getContext();
        if(Array.isArray(context)){
            contexts=contexts.concat(context);
        }else if(!!context){
            contexts.push(context);
        }
    });
    contexts=contexts.filter((context)=>{
        return !!context;
    });

    if(namespace){
        for(let i=0;i<contexts.length;i++){
            if(contexts[i].header.namespace==namespace){
                return contexts[i];
            }
        }
        return null;
    }


    return contexts;
    //TODO get all alerts
    //TODO get audio player
    //TODO get speaker status

};

DcsController.prototype.setClient=function(client){
    this.client=client;
    client.on("directive",(response)=>{
        this.handleResponse(response);
        this.emit("directive",response);
    });
    client.on("content",(content_id,content)=>{
        this.emit("content",content_id,content);
    });
    this.on("event",(dcs_event)=>{
        if(dcs_event &&dcs_event.event && dcs_event.event.header){
            if(
                dcs_event.event.header.namespace=="ai.dueros.device_interface.voice_input" &&
                dcs_event.event.header.name=="ListenStarted"
            ){
                return;
            }
        }
        client.sendEvent(dcs_event);
    });
};

DcsController.prototype.handleResponse=function(response){
    if(!response||!response.directive){
        return;
    }
    if(!response.directive.header.dialogRequestId){
        this.processDirective(response.directive);
        return;
    }
    
    if(this.currentDialogRequestId && response.directive.header.dialogRequestId==this.currentDialogRequestId){
        this.queue.push(response);
        if(!this.processing){
            this.deQueue();
        }
    }
};


DcsController.prototype.stopPlay=function(directive){
    this.managers.forEach((manager)=>{
        manager.stop();
    });
    /*
    this.audioPlayerManager.stop();
    this.voiceOutputManager.stop();
    this.alertManager.stop();
    */
};

DcsController.prototype.startRecognize=function(options){
    this.stopPlay();
    if(this.client){
        if(options&&options.wakeWordPcm){
            var wakeWordPcm=options.wakeWordPcm;
        }
        eventData=DcsProtocol.createRecognizeEvent(options);
        this.currentDialogRequestId = eventData.event.header.dialogRequestId;
        this.queue=[];
        eventData.clientContext=this.getContext();
        this.emit("event",eventData);
        return this.client.startRecognize(eventData,wakeWordPcm);
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
DcsController.prototype.processDirective=function(directive){
    let promise=Promise.resolve();
    this.managers.forEach((manager)=>{
        promise=promise.then(()=>{
            let tmpRet=manager.handleDirective(directive,this);
            if(tmpRet){
                return tmpRet;
            }else{
                return Promise.resolve();
            }
        });
    });
    return promise;
};
DcsController.prototype.deQueue=function(){
    this.processing=true;
    if(this.queue.length==0){
        this.processing=false;
        return;
    }
    var response=this.queue.shift();
    if(!response||!response.directive){
        this.deQueue();
        return;
    }
    var directive=response.directive;
    if((directive.header.dialogRequestId&&this.currentDialogRequestId)
            && directive.header.dialogRequestId!=this.currentDialogRequestId){
        this.deQueue();
        return;
    }
    
    var promise=this.processDirective(directive);
    if(promise && promise.then){
        promise
            .then(()=>{this.deQueue()})
            .catch(()=>{this.deQueue()});
    }else{
        this.deQueue();
    }
};

DcsController.prototype.setAccessToken=function(access_token){
    if(access_token){
        configModule.save("oauth_token",access_token);
        setTimeout(()=>{
            this.client.downstream.init();
        },2000);
    }
};
DcsController.prototype.getAccessToken=function(){
    return config.oauth_token;
};


module.exports=DcsController;
