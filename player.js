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
const EventEmitter=require("events");
const util = require('util');
const MPlayer = require('mplayer');

function Player(options){
    this.mplayer = new MPlayer(options);
    ["ready","time","start","play","pause","stop","status"].forEach((eventName)=>{
        this.mplayer.on(eventName,(...args)=>{
            if(eventName!="time"){
                console.log("mplayer event "+eventName);
            }
            if(eventName=="status"){
                this.currentStatus=args[0];
                console.log(JSON.stringify(args));
            }
            if(eventName=="stop" && this._status!="stopping"){
                this._status =null;
                this.emit("finished",...args);
            }else{
                this.emit(eventName,...args);
            }
        });
    });
}
/*
mplayer event stop
mplayer event status
[{"muted":false,"playing":true,"volume":0,"duration":0,"fullscreen":false,"subtitles":false,"filename":null,"title":null,"position":"241.8"}]
mplayer event time
mplayer event pause
*/
util.inherits(Player, EventEmitter);
//setOptions(< Object > options)
//openFile(< String > file, [ Object ] options)
//openPlaylist(< String > file, [ Object ] options)
//play( )
//pause( )
//stop( )
//next( )
//previous( )
//seek(< Number > seconds) - seek to a specific second
//seekPercent(< Number > percent ) - seek to a percent position of a file
//volume(< Number > percent ) - set volume to a given percentage
//mute( ) - toggle mute
//fullscreen( ) - toggle fullscreen
//hideSubtitles( )
//showSubtitles( )
//cycleSubtitles( ) - change to the next subtitles file in the file directory
//speedUpSubtitles( )
//slowDownSubtitles( )
//adjustSubtitles(< Number > seconds) - adjust the subtitles timing by +/- seconds
//adjustAudio(< Number > seconds) - adjust the audio timing by +/- seconds

Player.prototype.isPlaying=function(){
    if(this.currentStatus){
        return this.currentStatus['playing'];
    }
    return false;
};

["setOptions","openFile","play","pause","stop","next","previous","seek","seekPercent","volume","mute"].forEach((funcName)=>{
    Player.prototype[funcName]=function(...args){
        console.log("mplayer directive "+funcName);
        if(funcName=="openFile"){
            console.log(JSON.stringify(args));
        }
        if(funcName=="stop"){
            this._status="stopping";
        }
        this.mplayer[funcName](...args);
    };
});
module.exports=Player;
