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
const DataStreamPlayer= require("./data_stream_player");
function TTSManager(){
    this.ttsplayer=new DataStreamPlayer();
}
util.inherits(TTSManager, EventEmitter);
var handlers={
    "Speak":function(directive,controller){
        this.last_played_token=directive.payload.token;
        var url=directive.payload.url;
        var matches,cid;
        if(matches=url.match(/^cid:(.*)/)){
            cid=matches[1];
        }else{
            return;
        }
        return new Promise((resolve,reject)=>{
            var contentPromise=controller.getContentPromise(cid);
            contentPromise.then((params)=>{
                console.log("resolve content");
                [content_id,content]=params;
                this.ttsplayer.once("end",function(){
                    resolve();
                });
                this.ttsplayer.play(content);
            });
        });
    }
};
TTSManager.prototype.getContext=function(){
    return {
        "header": {
            "namespace": "ai.dueros.device_interface.voice_output",
            "name": "SpeechState"
        },
        "payload": {
            "token": this.last_played_token,
            ///TODO get how long was played, in sox.play.stderr?
            "offsetInMilliseconds": 0,
            "playerActivity": this.ttsplayer.isPlaying()?"PLAYING":"IDLE"
        }
    };
};
TTSManager.prototype.isPlaying=function(){
    return this.ttsplayer.isPlaying();
};
TTSManager.prototype.stop=function(){
    return this.ttsplayer.stop();
};
TTSManager.prototype.handleDirective=function (directive,controller){
    var name=directive.header.name;
    if(handlers[name]){
        return handlers[name].call(this,directive,controller);
    }
}

module.exports=TTSManager;


