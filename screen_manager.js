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
const BaseManager=require("./base_manager");
const util = require('util');
const child_process = require('child_process');
const system = require('./system');
const DcsProtocol=require("./dcs_protocol");

function ScreenManager(dcsController){
    this.dcsController=dcsController;
    dcsController.on("event",(dcsEvent)=>{
        var ev=dcsEvent.event;
        if(ev.header.namespace=='ai.dueros.device_interface.audio_player'){
            this.last_token=ev.payload.token;
            this.last_player_token=ev.payload.token;
        }
    });
    this.handlers={
        "HtmlView":(directive)=>{
            this.last_token=directive.payload.token;
        },
        "RenderCard":(directive)=>{
            this.last_token=directive.payload.token;
        },
        "RenderPlayerInfo":(directive)=>{
            this.last_player_token=directive.payload.audioItemId;
            this.last_player_info=directive.payload;
        },
        "RenderAudioList":(directive)=>{
            this.last_player_list=directive.payload;
        },
        "RenderVoiceInputText":(directive)=>{
        },
        "RenderHint":(directive)=>{
            //TODO
        }
    };
}
util.inherits(ScreenManager, BaseManager);
ScreenManager.prototype.NAMESPACE="ai.dueros.device_interface.screen";
ScreenManager.prototype.getContext=function(){
    var context={
        "header": {
            "namespace": this.NAMESPACE,
            "name": "ViewState"
        },
        "payload": {
        }
    };
    if(this.last_player_token){
        context.payload.player_token=this.last_player_token;
    }
    if(this.last_token){
        context.payload.token=this.last_token;
    }
    return context;
};
ScreenManager.prototype.handleDirective=function (directive,controller){
    if(
        directive.header.namespace!=this.NAMESPACE &&
        directive.header.namespace!="ai.dueros.device_interface.screen_extended_card"
    ){
        return;
    }
    var name=directive.header.name;
    if(this.handlers[name]){
        this.handlers[name].call(this,directive);
        this.emit(name,directive);
    }
};

ScreenManager.prototype.buttonClicked=function (token,buttonName){
    this.dcsController.emit("event",DcsProtocol.createEvent("ai.dueros.device_interface.form","ButtonClicked",controller.getContext(),
        {
            "token": token,
            "name": buttonName,
        }));
};

ScreenManager.prototype.radioButtonClicked=function (token,index,selectedValue){
    this.dcsController.emit("event",DcsProtocol.createEvent("ai.dueros.device_interface.form","RadioButtonClicked",controller.getContext(),
        {
            "token": token,
            "index": index,
            "selectedValue": selectedValue
        }));
};
ScreenManager.prototype.getLastPlayerList=function (){
    return this.last_player_list;
};


ScreenManager.prototype.getLastPlayerInfo=function (){
    return this.last_player_info;
};


module.exports=ScreenManager;

