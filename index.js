const DcsClient=require("./dcs_client");
const DcsController=require("./dcs_controller");
const Recorder=require("./recorder");
const config=require("./dcs_config.json");
const child_process=require("child_process");
const fs = require('fs');
var recorder=new Recorder();
var client=new DcsClient({recorder:recorder});

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
    wakeup.on("wakeup",function(wakeupInfo){
        console.log(wakeupInfo);
        //wakeupInfo.wakeword_frame_len;
        var buf=recorder.getLatestBuffers(wakeupInfo.wakeword_frame_len*8+20);
        fs.writeFile("wake.pcm",buf);
        ///没有AEC所以不能放提示音
        //var cmd=config.play_cmd+" -t wav '"+__dirname+"/nihao.wav'";
        //child_process.exec(cmd);
        //console.log(cmd+"!!!!!!!!!!!!!!!!!!");
        
        
        //recorder.stop();
        //声音采样率16k，每ms 16个sample，每个sample 2个字节(16bit)
        /*
        controller.startRecognize({
            wakeWordPcm:buf,
            initiator:{
                "payload": {
                    "wakeWordIndices": {
                        "startIndexInSamples": 16*20,
                        "endIndexInSamples": 16*(wakeupInfo.wakeword_frame_len*8+20)
                    }   
                },
                type:"WAKEWORD"
            }
        });
        */
        controller.startRecognize();
    });


    wakeup.init(recorder.start().out());
    wakeup.start();
}
