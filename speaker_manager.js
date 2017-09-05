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
const child_process = require('child_process');
const system = require('./system');
const DcsProtocol=require("./dcs_protocol");

function SpeakerManager(){
    this.handlers={
        "SetVolume":(directive)=>{
            this.setVolume(directive.payload.volume);
        },
        "AdjustVolume":(directive)=>{
            this.setVolume(this.getCurrentVolume() + directive.payload.volume);
        },
        "SetMute":(directive)=>{
            this.setVolume(0);
        }
    };
}
util.inherits(SpeakerManager, EventEmitter);
SpeakerManager.prototype.getContext=function(){
    var volume=this.getCurrentVolume();
    if(volume===null){
        return;
    }
    return {
        "header": {
            "namespace": "ai.dueros.device_interface.speaker_controller",
            "name": "VolumeState"
        },
        "payload": {
            "volume": volume,
            "muted": volume<3
        }
    };
};
SpeakerManager.prototype.handleDirective=function (directive,controller){
    var name=directive.header.name;
    if(this.handlers[name]){
        this.handlers[name].call(this,directive);
        var volume=this.getCurrentVolume();
        setTimeout(()=>{
            controller.emit("event",DcsProtocol.createEvent("ai.dueros.device_interface.speaker_controller","VolumeChanged",controller.getContext(),
                {
                    "volume": volume,
                    "muted": volume<3
                }));
        },0);
    }
}
SpeakerManager.prototype.setVolume=function(volume){
    if(system.get()=="raspberrypi"){
        let output=child_process.execSync("for device in $(amixer controls|awk -F, '{print $2}'|awk -F= '{print $2}'|sort|uniq);do amixer set $device "+volume+"%;done").toString();
        console.log(output);
    }
    if(system.get()=="macos"){
        var f=volume/100*7;
        let output=child_process.execSync('osascript -e "set volume '+f.toFixed(2)+'"').toString();
        return parseInt(output,10);
    }
};

SpeakerManager.prototype.getCurrentVolume=function (){
    if(system.get()=="raspberrypi"){
        try{
            let output=child_process.execSync("for device in $(amixer controls|awk -F, '{print $2}'|awk -F= '{print $2}'|sort|uniq);do amixer get $device;done").toString();
            let matches=output.match(/\[([0-9]+)\%\]/);
            if(matches && matches[1]){
                return parseInt(matches[1],10);
            }else{
                return 100;
            }
        }catch(e){
            return 100;
        }
    }
    if(system.get()=="macos"){
        let output=child_process.execSync('osascript -e "get output volume of (get volume settings)"').toString();
        return parseInt(output,10);
    }
    return null;
};


module.exports=SpeakerManager;
