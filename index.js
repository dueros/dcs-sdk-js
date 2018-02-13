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
const DcsClient = require("./data_link/dcs_client");
const AvsClient = require("./data_link/avs_client");
const DcsController = require("./dcs_controller");
const Recorder = require("./device_module/system_impl/recorder");
const configModule = require("./config.js");
const config = configModule.getAll();
const child_process = require("child_process");
let recorder = new Recorder();

let controller = new DcsController();

controller.on("directive", (response) => {
    console.log("on directive: " + JSON.stringify(response, null, 2));
});

controller.on("event", (eventData) => {
    console.log("send event:" + JSON.stringify(eventData, null, 2));
});


function onKeypressed() {
    if (controller.isPlaying()) {
        controller.stopPlay();
        controller.stopRecognize();
        return;
    }
    console.log("keypress!!");
    if (controller.isRecognizing()) {
        console.log("stopRecognize!!");
        controller.stopRecognize();
        //recorder.stderr().unpipe(process.stderr);
    } else {
        console.log("startRecognize!!");
        controller.startRecognize();
        //recorder.stderr().pipe(process.stderr);
    }
}

var keypress = require('keypress');
keypress(process.stdin);
process.stdin.on("keypress", onKeypressed);



var unameAll = child_process.execSync("uname -a").toString();
var isRaspberrypi = unameAll.match(/raspberrypi/);



let snowboy = require("./snowboy/snowboy.js");
const BufferManager = require("./lib/buffermanager").BufferManager;

function onWakeup(index, hotword, buffer) {
    console.log("hotword " + index);
    var cmd = config.play_cmd + " -t wav '" + __dirname + "/nihao.wav'";
    child_process.exec(cmd, {
        env: config.play_env,
    }, () => {
        controller.startRecognize();
    });
}
snowboy.on("hotword", onWakeup);

let started = false;
module.exports = {
    setRecorder: function(_recorder) {
        recorder = _recorder;
    },
    emitWakeup: function() {
        onWakeup(1, "小度小度", Buffer.alloc(0));
    },
    isStarted: function() {
        return started;
    },
    start: function() {
        if (started) {
            return;
        }
        started = true;
        if (config.avs_protocol) {
            console.log("use avs!!");
            configModule.set("directive_uri", config.avs_directive_uri);
            configModule.set("events_uri", config.avs_events_uri);
            configModule.set("ping_uri", config.avs_ping_uri);
            console.log(config);

            let client = new AvsClient({
                recorder: recorder
            });
            controller.setClient(client);
        } else {
            let client = new DcsClient({
                recorder: recorder
            });
            controller.setClient(client);
        }
        snowboy.start(recorder.start().out());
    },
    controller: controller
}
if (require.main === module) {
    module.exports.start();
    process.on('uncaughtException', (e) => {
        console.log(e);
    });
}
