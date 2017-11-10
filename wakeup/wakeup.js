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
const WakeupMessage = require("./wakeupMessage");
const BufferManager = require("./buffermanager").BufferManager;
const spawn = require("child_process").spawn;
const Msgout = require('./msgout');
const fs = require('fs');

const EventEmitter = require('events');
const emitter = new EventEmitter();

module.exports.stop = stop;
module.exports.start = start;
module.exports.init = init;

module.exports.on = emitter.on.bind(emitter);
module.exports.once = emitter.once.bind(emitter);
module.exports.removeListener = emitter.removeListener.bind(emitter);
module.exports.removeAllListeners = emitter.removeAllListeners.bind(emitter);

var wakeup_process;
var audioStream;
var wakeup_output_fifo;
var wakeup_status = "stop";
var init_promise;

function init(_audioStream) {
    init_promise = new Promise(function(resolve, reject) {
        wakeup_status = "stop";
        audioStream = _audioStream;
        wakeup_process = spawn(__dirname + "/NEW_WAKE", [], {
            cwd: __dirname
        });
        wakeup_process.on("close", function() {
            console.log("CLOSED!!!!!!!!!");
            wakeup_process = null;
            audioStream = null;
            wakeup_output_fifo = null;
        });
        //wakeup_process.stdout.pipe(process.stdout);

        wakeup_process.stdout.on("data", function(data) {
            //console.log(data.toString());
            if (!data.toString().match("fifo open ok")) {
                //console.log(data.toString());
                return;
            }
            //wakeup_output_fifo=fs.createReadStream(__dirname+"/wakeup_output_fifo");
            wakeup_output_fifo = wakeup_process.stderr;
            console.log("wakeup_output_fifo ok!");
            resolve();
        });

    });
    return init_promise;
}

function start() {
    init_promise.then(function() {
        if (wakeup_status != "stop") {
            return;
        }
        new Msgout(wakeup_output_fifo).on("msg", onMessage);
        //var arr=new Uint32Array(1);
        //arr[0]=1234;
        //var buf=new Buffer(arr.buffer);
        //var msg=new SDKMessage("wak.start");
        //wakeup_process.stdin.write(msg.toBuffer());

        audioStream.on('data', onData);
        wakeup_status = "start";
        emitter.emit("start");

    });

};
var mIndex = 0;

function onMessage(msg) {
    //console.log("js wakeup!!!!!!");
    /*
    if(resultObj){
        console.log(sdkmsg.get("cb.wak.result.string"));
    }
    if(_status==4){
        emitter.emit("wakeup",resultObj);
    }*/
    if (msg) {
        var msgData = msg.getAll();
        for (k in msgData) {
            if (msgData.hasOwnProperty(k)) {
                msgData[k] = msgData[k].toString("utf-8");
            }
        }
        if (msgData.wakeword_frame_len) {
            msgData.wakeword_frame_len = parseInt(msgData.wakeword_frame_len);
        }
    }
    emitter.emit("wakeup", msgData);
}

function onData(data) {
    var msg = new WakeupMessage();
    msg.set("wak.push_audio", data);
    //console.log("onData:"+data.length)
    wakeup_process.stdin.write(msg.toBuffer());
}

function stop() {
    init_promise.then(function() {
        wakeup_output_fifo.removeAllListeners("data");
        audioStream.removeListener("data", onData);
        wakeup_status = "stop";
        emitter.emit("stop");
    });
};