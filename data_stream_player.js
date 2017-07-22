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
/*
 * play readable stream
 * */
const util = require('util');
const EventEmitter=require("events");
let child_process=require("child_process");
const config=require("./dcs_config.json");

function DataStreamPlayer(){
    //let play_cmd='mpg123 -';
    //let convert_cmd="sox -t mp3 - -t s16 -r8000 -b16 -c1 -";
}
util.inherits(DataStreamPlayer, EventEmitter);
DataStreamPlayer.prototype.play=function(readable){
    this.emit("start");
    let play_cmd=config.play_cmd+' -t mp3 -';
    this.stop();
    var player_process=child_process.spawn(play_cmd.split(" ")[0],play_cmd.split(" ").slice(1),
        {
            //env:config.play_env,
            stdio:['pipe', 'pipe', process.stderr]
        }
    );
    this.player_process=player_process;
    readable.pipe(player_process.stdin);
    player_process.on("close",()=>{
        console.log("tts play end!\n");
        this.player_process=null;
        this.emit("end");
    });
};

DataStreamPlayer.prototype.isPlaying=function(){
    return !!this.player_process;
};

DataStreamPlayer.prototype.stop=function(){
    if(this.player_process){
        this.player_process.kill("SIGKILL");
        this.player_process=null;
    }
};

module.exports=DataStreamPlayer;
