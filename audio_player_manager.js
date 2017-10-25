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
const Player=require("./player");
const DcsProtocol=require("./dcs_protocol");
function AudioPlayerManager(controller){
    this.playlist=[];
    //this.player=new Player({debug:1});
    this.player=new Player();
    this.player.on("stop",()=>{
        controller.emit("event",
                DcsProtocol.createEvent( this.NAMESPACE, "PlaybackStopped", controller.getContext(),
                    {
                        token:this.last_played_token,
                        offsetInMilliseconds:this.offset_ms
                    }
                    )
                );
    });
    this.player.on("pause",()=>{
        controller.emit("event",DcsProtocol.createEvent(this.NAMESPACE,"PlaybackPaused",controller.getContext(),
                    {
                        token:this.last_played_token,
                        offsetInMilliseconds:this.offset_ms
                    }));
    });
    this.player.on("start",()=>{
        controller.emit("event",DcsProtocol.createEvent(this.NAMESPACE,"PlaybackStarted",controller.getContext(),
                    {
                        token:this.last_played_token,
                        offsetInMilliseconds:this.offset_ms
                    }));
    });
    this.player.on("start",()=>{
        controller.emit("event",DcsProtocol.createEvent(this.NAMESPACE,"PlaybackStarted",controller.getContext(),
                    {
                        token:this.last_played_token,
                        offsetInMilliseconds:this.offset_ms
                    }));
    });
    this.player.on("finished",()=>{
        controller.emit("event",DcsProtocol.createEvent(this.NAMESPACE,"PlaybackNearlyFinished",controller.getContext(),
                    {
                        token:this.last_played_token,
                        offsetInMilliseconds:this.offset_ms
                    }));
        controller.emit("event",DcsProtocol.createEvent(this.NAMESPACE,"PlaybackFinished",controller.getContext(),
                    {
                        token:this.last_played_token,
                        offsetInMilliseconds:this.offset_ms
                    }));
        this.playNext();
    });
    this.player.on("time",(sec)=>{
        this.offset_ms=parseInt(sec*1000,10);
    });
}
util.inherits(AudioPlayerManager, BaseManager);
AudioPlayerManager.prototype.NAMESPACE="ai.dueros.device_interface.audio_player";
var handlers={
    "ClearQueue":function(directive){
        if(directive.payload.clearBehavior=="CLEAR_ENQUEUED"){
            this.playlist=[];
        }
        if(directive.payload.clearBehavior=="CLEAR_ALL"){
            this.playlist=[];
            this.stop();
        }
    },
    "Stop":function(directive){
        this.player.stop();
    },
    "Play":function(directive){

//    - REPLACE_ALL: 停止当前的播放（如有必要，发送PlaybackStopped事件）并清除播放列表，立即播放本stream；
//    - ENQUEUE: 把本stream加到播放队列末尾
//    - REPLACE_ENQUEUED: 清除当前播放列表，把本stream放到播放列表；不影响当前正在播放的stream
        if(directive.payload.playBehavior=="REPLACE_ALL"){
            this.playlist=[];
            this.player.openFile(directive.payload.audioItem.stream.url);
            if(directive.payload.audioItem.stream.offsetInMilliseconds){
                this.player.once("start",()=>{
                    this.player.seek(parseInt(directive.payload.audioItem.stream.offsetInMilliseconds/1000));
                });
            }
            this.player.play();
            this.last_played_token=directive.payload.audioItem.stream.token;
        }
        if(directive.payload.playBehavior=="ENQUEUE"){
            this.playlist.push({url:directive.payload.audioItem.stream.url,"token":directive.payload.audioItem.stream.token});
            if(!this.isPlaying()){
                this.playNext();
            }
        }
        if(directive.payload.playBehavior=="REPLACE_ENQUEUED"){
            this.playlist=[{url:directive.payload.audioItem.stream.url,"token":directive.payload.audioItem.stream.token}];
            if(!this.isPlaying()){
                this.playNext();
            }
        }
    }
};
AudioPlayerManager.prototype.playNext=function(){
    if(this.playlist.length>0){
        let playitem=this.playlist.shift();
        this.player.openFile(playitem.url);
        this.last_played_token=playitem.token;
        this.player.play();
    }
};
AudioPlayerManager.prototype.isPlaying=function(){
    return this.player.isPlaying();
};
AudioPlayerManager.prototype.stop=function(){
    return this.player.stop();
};
AudioPlayerManager.prototype.seekTo=function(offsetInMilliseconds){
    if(this.player.isPlaying()){
        this.offset_ms=parseInt(offsetInMilliseconds,10);
        this.player.seek(parseInt(offsetInMilliseconds/1000));
    }
};

AudioPlayerManager.prototype.getContext=function(){
    return {
        "header": {
            "namespace": this.NAMESPACE,
            "name": "PlaybackState"
        },
        "payload": {
            "token": this.last_played_token,
            "offsetInMilliseconds": this.offset_ms,
            "playerActivity": this.isPlaying()?"PLAYING":"IDLE"
        }
    };

};
AudioPlayerManager.prototype.handleDirective=function (directive){
    if(directive.header.namespace!=this.NAMESPACE){
        return;
    }
    var name=directive.header.name;
    if(handlers[name]){
        handlers[name].call(this,directive);
    }
}

module.exports=AudioPlayerManager;
