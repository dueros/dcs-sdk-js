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
            env:config.play_env,
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
