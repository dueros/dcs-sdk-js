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
        var buf=recorder.getLatestBuffers(wakeupInfo.wakeword_frame_len*10);
        fs.writeFile("wake.pcm",buf);
        
        
        //recorder.stop();
        //声音采样率16k，每ms 16个sample，每个sample 2个字节(16bit)
        //带误唤醒检测的模式
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
        ///没有AEC所以不能放提示音的时候录音
        var cmd=config.play_cmd+" -t wav '"+__dirname+"/nihao.wav'";
        child_process.exec(cmd,()=>{
            console.log(cmd+"!!!!!!!!!!!!!!!!!!");
            controller.startRecognize();
        });
    });


    wakeup.init(recorder.start().out());
    wakeup.start();
}
