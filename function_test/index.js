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
const AvsClient=require("./avs_client");
const DcsController=require("./dcs_controller");
const Recorder=require("./recorder");
const configModule=require("./config.js");
const config=configModule.getAll();
const child_process=require("child_process");
const fs = require('fs');
var recorder=new Recorder();

let controller=new DcsController();

controller.on("directive",(response)=>{
    console.log("on directive: "+JSON.stringify(response,null,2));
});

controller.on("event",(eventData)=>{
    console.log("send event:"+JSON.stringify(eventData,null,2));
});


var unameAll=child_process.execSync("uname -a").toString();
var isRaspberrypi=unameAll.match(/raspberrypi/);



function onWakeup(index, hotword, buffer){
    console.log("hotword "+index);
    if(config.respeaker_2mic_hat && config.respeaker_2mic_hat.led){
        controller.startRecognize();
    }else{
        var cmd=config.play_cmd+" -t wav '"+__dirname+"/nihao.wav'";
        child_process.exec(cmd,()=>{
            controller.startRecognize();
        });
    }
}

let started=false;
module.exports={
    setRecorder:function(_recorder){
        recorder=_recorder;
    },
    emitWakeup:function(){
        onWakeup(1,"小度小度",Buffer.alloc(0));
    },
    isStarted:function(){
        return started;
    },
    start:function(){
        if(started){
            return;
        }
        started=true;
        if(config.avs_protocol){
            console.log("use avs!!");
            configModule.set("directive_uri",config.avs_directive_uri);
            configModule.set("events_uri",config.avs_events_uri);
            configModule.set("ping_uri",config.avs_ping_uri);
            console.log(config);

            let client=new AvsClient({recorder:recorder});
            controller.setClient(client);
        }else{
            let client=new DcsClient({recorder:recorder});
            controller.setClient(client);
        }
        recorder.start().out().pipe(fs.createWriteStream("/dev/null"));
    },
    controller:controller
}
if(require.main===module){
    module.exports.start();
}


