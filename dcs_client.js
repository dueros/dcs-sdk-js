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
const request=require("request");
const config=require("./config.js").getAll();
var DownStream=require("./downstream_auto");
const Readable = require('stream').Readable;
const BufferManager=require("./wakeup/buffermanager").BufferManager;

const fs = require('fs');
const Dicer = require('dicer');

function DcsClient(options){
    this._isRecognizing=false;
    this.recorder=options.recorder;
    EventEmitter.call(this);
    this.downstream=new DownStream();
    this.downstream.on("directive",(response)=>{
        //"namespace": "ai.dueros.device_interface.voice_input",
        //"name": "StopListen",
        this.emit("directive",response);
    });
    this.downstream.on("content",(content_id,readable)=>{
        this.emit("content",content_id,readable);
    });
    this.downstream.on("init",()=>{
        this.emit("downstream_init");
    });
}

util.inherits(DcsClient, EventEmitter);
class RecorderWrapper extends Readable {
    constructor(options) {
        super(options);
        //this.buffer_manager=new BufferManager();
        this._source = options.recorder;
        // Every time there's data, push it into the internal buffer.
        if(options.beforePcm){
            if (!this.push(options.beforePcm)){
                throw new Error("push error");
            }
            //this.buffer_manager.add(options.beforePcm);
            //console.log("push ret:"+ret);
            //console.log("push length:"+options.beforePcm.length);
        }else{
            console.log("no before");
        }
        var onData=this.onData= function (chunk){
            // if push() returns false, then stop reading from source
            console.log("on record data:"+chunk.length);
            if (!this.push(chunk)){
                this._source.removeListener("data",onData);
            }
            //this.buffer_manager.add(chunk);
        }.bind(this);
        this._source.on("data",onData);
        // When the source ends, push the EOF-signaling `null` chunk
        this._source.on("end" ,() => {
            this.push(null);
            //fs.writeFileSync("recorder.pcm",this.buffer_manager.slice(0));
        });
        this._source.on("error",()=>{
            this.stopRecording();
        });
    }
    // _read will be called when the stream wants to pull more data in
    // the advisory size argument is ignored in this case.
    _read(size) {
        this._source.read(size);
    }
    stopRecording(){
        //fs.writeFileSync("recorder.pcm",this.buffer_manager.slice(0));
        this.push(null);
        this._source.removeListener("data",this.onData);
        this.onData=null;
        this._source=null
        console.log("stopRecording!!");
    }
}

function wavHeader(){
    function writeString(view, offset, string){
        for (var i = 0; i < string.length; i++){
            view.setUint8(offset + i, string.charCodeAt(i));
        }
        return offset+string.length;
    }
    var buffer = new ArrayBuffer(44);
    var view = new DataView(buffer);
    var length=100000;

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, length+32, true);
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

    let child_process=require("child_process");
    let convert_process=child_process.spawn(__dirname+"/adpcm/Wav2Adpcm",["-l"]);
    recorder.pipe(convert_process.stdin);
    convert_process.stdout.pipe(fs.createWriteStream(__dirname+"/recorder.adpcm",{
        flags: 'w',
        defaultEncoding: 'binary',
        autoClose: true
    }));
    
    return new RecorderWrapper({
        "highWaterMark":200000,
        "beforePcm":wavHeader(),
        "recorder":convert_process.stdout
    });
    
    //return convert_process.stdout;
}

DcsClient.prototype.sendEvent=function(eventData){
    if(eventData){
        var logid=config.device_id+"_" + new Date().getTime()+"_monitor";
        console.log("event logid:"+logid);
        var headers={
            "Content-Type": "multipart/form-data; boundary="+config.boundary,
            "Host": config.host, 
            "SAIYALOGID":logid,
            "Authorization": "Bearer "+config.oauth_token,
            "Dueros-Device-Id": config.device_id
        };
        if(config.event_header){
            Object.assign(headers,config.event_header);
        }

        var r=request({
            postambleCRLF: true,
            url:config.schema+config.ip+config.events_uri,
            method:"post",
            multipart: {
                data: [
                {
                    'Content-Disposition': 'form-data; name="metadata"',
                    'Content-Type': 'application/json; charset=UTF-8',
                    "body": JSON.stringify(eventData)
                }
                ]
            },
            headers:headers
        },(error, response, body)=>{
            //console.log("event response headers:"+JSON.stringify(response.headers,null,2));
            //console.log("event response:"+body);
        });
        var rWrap=processEventRequest.call(this,r);
        rWrap.pipe(fs.createWriteStream("test1.log",{
            flags: 'w',
            defaultEncoding: 'binary',
            autoClose: true
        }));
        rWrap.on("error",(error)=>{
            console.log("event upload error");
        });
    }
};

function processEventRequest (r){
    let rWrap=new Readable().wrap(r);
    rWrap.on("error",(e)=>{
        console.log(e);
        console.log("rWrap on error");
    });

    var d1 = new Dicer({"boundary":""});
    d1.on('error',()=>{
        console.log('dicer error, no multi part in events stream!!!!!!!!');
        rWrap.emit("error",new Error('not multi part'));
    });
    r.on('response', function(response) {
        if(response.statusCode==204){
            //server no response
            rWrap.removeAllListeners();
            rWrap.on("error",()=>{
            });
            rWrap.unpipe(d1);
            return;
        }
        if(!response.headers['content-type']){
            //throw new Exception("server header error: no content-type");
            console.log("server header error: no content-type");
            return;
        }
        var matches=response.headers['content-type'].match(/boundary=([^;]*)/);
        if(matches&&matches[1]){
            d1.setBoundary(matches[1]);
        }else{
            rWrap.unpipe(d1);
            console.log("[ERROR] response error, not multipart, headers:"+JSON.stringify(response.headers));
            rWrap.pipe(process.stderr);
            process.nextTick(()=>{
                rWrap.emit("error",new Error('not multi part'));
            });
        }
    });

    d1.on('part', (p) => {
        var name=null;
        var jsonBody=new BufferManager();
        var response=null;
        var content_id;
        p.on('header', (header)=> {
            //console.log(JSON.stringify(header, null, '  '));
            if(header["content-disposition"] ){
                var matches;
                if(matches= header["content-disposition"][0].match(/name="(\w+)"/)){
                    name=matches[1];
                }
            }
            if(header["content-id"] && header["content-id"][0]){
                content_id=header["content-id"][0].replace(/[<>]/g,"");
                console.log("content_id:"+content_id);
                var file=fs.createWriteStream(__dirname+"/tmp/"+content_id,{
                    flags: 'w',
                    defaultEncoding: 'binary',
                    autoClose: true
                });
                this.emit("content",content_id,p);
                p.pipe(file);
            }
        });
        p.on('data', function(data) {
            if(name=="metadata"){
                jsonBody.add(data);
            }
        });
        p.on('end', ()=>{
            content_id=null;
            if(name=='metadata'){
                response=JSON.parse(jsonBody.toBuffer().toString("utf8"));
                this.emit("directive",response);
                //console.log(JSON.stringify(response, null, '  '));
            }
        });
        p.on('error',()=>{
            console.log('dicer error, event part error');
        });
    });
    d1.on('finish', function() {
        console.log('End of parts');
    });
    rWrap.pipe(d1);
    return rWrap;
}
DcsClient.prototype.startRecognize=function(eventData,wakeWordPcm){
    if(this._isRecognizing){
        console.log("is recognizing");
        return;
    }
    var self=this;
    var rec_stream=this.rec_stream=new RecorderWrapper({
        "highWaterMark":200000,
        "beforePcm":wakeWordPcm,
        "recorder":this.recorder.start().out()
    });
    rec_stream.pipe(fs.createWriteStream(__dirname+"/recorder.pcm",{
        flags: 'w',
        defaultEncoding: 'binary',
        autoClose: true
    }));
    var logid=config.device_id +"_" + new Date().getTime()+"_monitor";
    console.log("voice logid:"+logid);
    var headers={
        "Content-Type": "multipart/form-data; boundary="+config.boundary,
        "SAIYALOGID":logid,
        "Host": config.host, 
        "Authorization": "Bearer "+config.oauth_token,
        "Dueros-Device-Id": config.device_id
    };
    if(config.event_header){
        Object.assign(headers,config.event_header);
    }
    var r =this.request = request({
        multipart: {
            chunked: true,
            data: [
            {
                'Content-Disposition': 'form-data; name="metadata"',
                'Content-Type': 'application/json; charset=UTF-8',
                "body": JSON.stringify(eventData)
            },
            { 
                'Content-Disposition': 'form-data; name="audio"',
                'Content-Type': 'application/octet-stream',
                //"body": pcm2adpcm(rec_stream),
                "body": rec_stream,
                    //"body": fs.createReadStream("test.pcm")
                    //"body": fs.readFileSync("test.pcm")
            }
            ]
        },
        method:"post",
            //preambleCRLF: true,
        postambleCRLF: true,
        "url":config.schema+config.ip+config.events_uri ,
            //"url":"http://cp01-feng.ecp.baidu.com:8998/v20160207/events" ,
        headers:headers
    });
    r.on("socket",(socket)=>{
        socket.setNoDelay(true);
    });
    var rWrap=processEventRequest.call(this,r);
    rWrap.on("error",(e)=>{
        this.stopRecognize();
        console.log("re init downstream when recognizing error",e);
        this.downstream.init();
    });
    this._isRecognizing=true;
};

DcsClient.prototype.isRecognizing=function(){
    return this._isRecognizing;
};

DcsClient.prototype.stopRecognize=function(){
    if(this._isRecognizing){
        this.rec_stream.stopRecording();
        this.request=null;
    }
    this._isRecognizing=false;
};



module.exports=DcsClient;

