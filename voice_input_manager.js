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
///播放器控制类，解决播放列表的问题
const EventEmitter=require("events");
const util = require('util');
function VoiceInputManager(){
}
util.inherits(VoiceInputManager, EventEmitter);
var handlers={
    "Listen":function(directive,controller){
        controller.startRecognize();
    },
    "StopListen":function(directive,controller){
        controller.stopRecognize();
    }
};
VoiceInputManager.prototype.getContext=function(){
    return {
        "header": {
            "namespace": "ai.dueros.device_interface.voice_input",
            "name": "ListenState"
        },
        "payload": {
            "wakeword":"小度小度"
        }
    };
};
VoiceInputManager.prototype.handleDirective=function (directive, controller){
    var name=directive.header.name;
    if(handlers[name]){
        handlers[name].call(this,directive,controller);
    }
}

module.exports=VoiceInputManager;

