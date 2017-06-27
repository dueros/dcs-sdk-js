const DcsClient=require("./dcs_client");
const DcsController=require("./dcs_controller");
const Recorder=require("./recorder");
const config=require("./dcs_config.json");
let child_process=require("child_process");
var recorder=new Recorder();
var client=new DcsClient({recorder:recorder});
let fs = require('fs');

let controller=new DcsController();

controller.setClient(client);

controller.on("directive",(response)=>{
    console.log("on directive: "+JSON.stringify(response));
});

var keypress = require('keypress');
keypress(process.stdin);
process.stdin.on("keypress",()=>{
    if(controller.isPlaying()){
        controller.stopPlay();
        return;
    }
    console.log("keypress!!");
    if(controller.isRecognizing()){
        console.log("stopRecognize!!");
        controller.stopRecognize();
        recorder.stderr().unpipe(process.stderr);
    }else{
        console.log("startRecognize!!");
        controller.startRecognize();
        recorder.stderr().pipe(process.stderr);
    }
});
var isRaspberrypi=child_process.execSync("uname -a").toString().match(/raspberrypi/);
if(isRaspberrypi){
    const wakeup=require("./wakeup/wakeup.js");
    wakeup.on("wakeup",function(){
        var cmd=config.play_cmd+" -t wav '"+__dirname+"/nihao.wav'";
        child_process.exec(cmd);
        console.log(cmd+"!!!!!!!!!!!!!!!!!!");
        //recorder.stop();
        controller.startRecognize();
    });


    wakeup.init(recorder.start().out());
    wakeup.start();
}
