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
const path = require("path");
const ROOT_PATH = path.resolve(__dirname + "/..");

const EventEmitter = require("events");
const util = require('util');
//const request = require("request");
const request = require("./request_auto");
const config = require(ROOT_PATH + "/config.js").getAll();
const DownStream = require("./downstream_auto");
const Readable = require('stream').Readable;
const BufferManager = require(ROOT_PATH + "/lib/buffermanager").BufferManager;
const FormData = require("form-data");

const fs = require('fs');
const Dicer = require('dicer');
class DcsClient extends EventEmitter{
    constructor(options) {
        super();
        this.recorder = options.recorder;
        this.downstream = new DownStream();
        this.downstream.on("directive", (response) => {
            //"namespace": "ai.dueros.device_interface.voice_input",
            //"name": "StopListen",
            this.emit("directive", response);
        });
        this.downstream.on("content", (content_id, readable) => {
            this.emit("content", content_id, readable);
        });
        this.downstream.on("init", () => {
            this.emit("downstream_init");
        });
    }
    sendEvent(eventData) {
        if (!eventData) {
            console.error("no send event data");
            return;
        }

        let logid = config.device_id + "_" + new Date().getTime() + "_monitor";
        console.log("event logid:" + logid);
        let form_data = new FormData();
        let headers = {
            "Content-Type": "multipart/form-data; boundary=" + form_data.getBoundary(),
            "SAIYALOGID": logid,
            "Authorization": "Bearer " + config.oauth_token,
            "Dueros-Device-Id": config.device_id
        };
        if (config.event_header) {
            Object.assign(headers, config.event_header);
        }
        form_data.append("metadata", JSON.stringify(eventData), {
            "contentType": 'application/json; charset=UTF-8'
        });

        let r = request({
            http2session: this.downstream.http2session,
            url: config.schema + config.ip + config.events_uri,
            method: "post",
            headers: headers
        });
        form_data.pipe(r);
        let rWrap = processEventRequest.call(this, r);
        /*
        rWrap.pipe(fs.createWriteStream("test1.log", {
            flags: 'w',
            defaultEncoding: 'binary',
            autoClose: true
        }));
        */
        rWrap.on("error", (error) => {
            console.log("event upload error");
        });
    }
    startRecognize(eventData, wakeWordPcm) {
        let form_data = new FormData();
        let rec_stream = this.rec_stream = new RecorderWrapper({
            "highWaterMark": 200000,
            "beforePcm": wakeWordPcm,
            "recorder": this.recorder.start().out()
        });
        rec_stream.pipe(fs.createWriteStream(ROOT_PATH + "/recorder.pcm", {
            flags: 'w',
            defaultEncoding: 'binary',
            autoClose: true
        }));
        let logid = config.device_id + "_" + new Date().getTime() + "_monitor";
        console.log("voice logid:" + logid);
        let headers = {
            "Content-Type": "multipart/form-data; boundary=" + form_data.getBoundary(),
            "SAIYALOGID": logid,
            "Authorization": "Bearer " + config.oauth_token,
            "Dueros-Device-Id": config.device_id
        };
        if (config.event_header) {
            Object.assign(headers, config.event_header);
        }
        form_data.append("metadata", JSON.stringify(eventData), {
            "contentType": 'application/json; charset=UTF-8'
        });
        form_data.append("audio", rec_stream, {
            "contentType": 'application/octet-stream'
        });
        let r = request({
            http2session: this.downstream.http2session,
            method: "post",
            "url": config.schema + config.ip + config.events_uri,
            headers: headers
        });
        form_data.pipe(r);
        r.on("socket", (socket) => {
            socket.setNoDelay(true);
        });
        let rWrap = processEventRequest.call(this, r);
        let dialog = new Dialog({
            eventData,
            req: r,
            rec_stream
        });
        rWrap.on("error", (e) => {
            //dialog.stopRecording();
            console.log("re init downstream when recognizing error", e);
            this.downstream.init();
        });
        return dialog;
    }
}

class RecorderWrapper extends Readable {
    constructor(options) {
        super(options);
        //this.buffer_manager=new BufferManager();
        this._source = options.recorder;
        // Every time there's data, push it into the internal buffer.
        if (options.beforePcm) {
            if (!this.push(options.beforePcm)) {
                throw new Error("push error");
            }
            //this.buffer_manager.add(options.beforePcm);
            //console.log("push ret:"+ret);
            //console.log("push length:"+options.beforePcm.length);
        } else {
            console.log("no before");
        }
        var onData = this.onData = function(chunk) {
            // if push() returns false, then stop reading from source
            console.log("on record data:" + chunk.length);
            if (!this.onData || !this.push(chunk)) {
                if (this._source) {
                    this._source.removeListener("data", onData);
                }
            }
            //this.buffer_manager.add(chunk);
        }.bind(this);
        this._source.on("data", onData);
        // When the source ends, push the EOF-signaling `null` chunk
        this._source.on("end", () => {
            this.push(null);
            //fs.writeFileSync("recorder.pcm",this.buffer_manager.slice(0));
        });
        this._source.on("error", () => {
            this.stopRecording();
        });
    }
    // _read will be called when the stream wants to pull more data in
    // the advisory size argument is ignored in this case.
    _read(size) {
        this._source.read(size);
    }
    stopRecording() {
        //fs.writeFileSync("recorder.pcm",this.buffer_manager.slice(0));
        this.push(null);
        this._source.removeListener("data", this.onData);
        this.onData = null;
        this._source = null
        console.log("stopRecording!!");
    }
}

function wavHeader() {
    function writeString(view, offset, string) {
        for (var i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
        return offset + string.length;
    }
    var buffer = new ArrayBuffer(44);
    var view = new DataView(buffer);
    var length = 100000;

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, length + 32, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 0x0040, true);
    /* channel count */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, 16000, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, 32000, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, length, true);

    return new Buffer(view.buffer);
}



function pcm2adpcm(recorder) {

    let child_process = require("child_process");
    let convert_process = child_process.spawn(ROOT_PATH + "/adpcm/Wav2Adpcm", ["-l"]);
    recorder.pipe(convert_process.stdin);
    convert_process.stdout.pipe(fs.createWriteStream(ROOT_PATH + "/recorder.adpcm", {
        flags: 'w',
        defaultEncoding: 'binary',
        autoClose: true
    }));

    return new RecorderWrapper({
        "highWaterMark": 200000,
        "beforePcm": wavHeader(),
        "recorder": convert_process.stdout
    });

    //return convert_process.stdout;
}


function processEventRequest(r) {
    let rWrap = new Readable().wrap(r);
    rWrap.on("error", (e) => {
        console.log(e);
        console.log("rWrap on error");
    });

    var d1 = new Dicer({
        "boundary": ""
    });
    d1.on('error', () => {
        console.log('dicer error, no multi part in events stream!!!!!!!!');
        rWrap.emit("error", new Error('not multi part'));
    });
    r.on('response', function(response) {
        //process http2 response event
        let headers = response;
        let statusCode = headers[":status"];
        if (response.headers && response.statusCode) {
            statusCode = response.statusCode;
            headers = response.headers;
        }
        //console.log(headers,statusCode);
        if (statusCode == 204) {
            //server no response
            rWrap.removeAllListeners();
            rWrap.on("error", () => {});
            rWrap.unpipe(d1);
            return;
        }
        if (!headers['content-type']) {
            //throw new Exception("server header error: no content-type");
            console.log("server header error: no content-type");
            return;
        }
        var matches = headers['content-type'].match(/boundary=([^;]*)/);
        if (matches && matches[1]) {
            d1.setBoundary(matches[1]);
        } else {
            rWrap.unpipe(d1);
            console.log("[ERROR] response error, not multipart, headers:" + JSON.stringify(headers));
            rWrap.pipe(process.stderr);
            process.nextTick(() => {
                rWrap.emit("error", new Error('not multi part'));
            });
        }
    });

    d1.on('part', (p) => {
        var name = null;
        var jsonBody = new BufferManager();
        var response = null;
        var content_id;
        p.on('header', (header) => {
            //console.log(JSON.stringify(header, null, '  '));
            if (header["content-disposition"]) {
                var matches;
                if (matches = header["content-disposition"][0].match(/name="(\w+)"/)) {
                    name = matches[1];
                }
            }
            if (header["content-id"] && header["content-id"][0]) {
                content_id = header["content-id"][0].replace(/[<>]/g, "");
                console.log("content_id:" + content_id);
                var file = fs.createWriteStream(ROOT_PATH + "/tmp/" + content_id, {
                    flags: 'w',
                    defaultEncoding: 'binary',
                    autoClose: true
                });
                //用RecorderWrapper包一下，是因为怕播放指令执行的时候，管道已经输出了一点东西了，复用一下RecorderWrapper的缓存功能
                this.emit("content", content_id, new RecorderWrapper({
                    recorder: p
                }));
                p.pipe(file);
            }
        });
        p.on('data', function(data) {
            if (name == "metadata") {
                jsonBody.add(data);
            }
        });
        p.on('end', () => {
            content_id = null;
            if (name == 'metadata') {
                response = JSON.parse(jsonBody.toBuffer().toString("utf8"));
                this.emit("directive", response);
                //console.log(JSON.stringify(response, null, '  '));
            }
        });
        p.on('error', () => {
            console.log('dicer error, event part error');
        });
    });
    d1.on('finish', function() {
        console.log('End of parts');
    });
    rWrap.pipe(d1);
    return rWrap;
}

class Dialog extends EventEmitter {
    constructor(options) {
        super();
        this.eventData = options.eventData;
        this.req = options.req;
        this.rec_stream = options.rec_stream;
        this.rec_stream.on("end", () => {
            this.emit("requestSpeechFinished");
        });
    }
    stopRecording() {
        this.rec_stream.stopRecording();
    }
    getDialogRequestId() {
        return this.eventData.event.header.dialogRequestId;
    }
}


module.exports = DcsClient;
