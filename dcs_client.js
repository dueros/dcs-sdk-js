const EventEmitter=require("events");
const util = require('util');
const request=require("request");
const config=require("./dcs_config.json");
const Readable = require('stream').Readable;
let fs = require('fs');
var Dicer = require('dicer');

function DcsClient(options){
    this._isRecognizing=false;
    this.recorder=options.recorder;
    EventEmitter.call(this);
    this.downstream=new DownStream();
    this.downstream.on("directive",(response)=>{
        //"namespace": "ai.dueros.device_interface.voice_input",
        //"name": "StopListen",
        if(response.directive.header.name=="StopListen"){
            console.log("stop capture!!");
            this.stopRecognize();
            //this.recorder.stop();
        }
        this.emit("directive",response);
    });
    this.downstream.on("content",(content_id,readable)=>{
        this.emit("content",content_id,readable);
    });
}

util.inherits(DcsClient, EventEmitter);
class RecorderWrapper extends Readable {
  constructor(options) {
    super(options);
    this._source = options.recorder;
    // Every time there's data, push it into the internal buffer.
    if(options.beforePcm){
      if (!this.push(options.beforePcm)){
        throw new Error("push error");
      }
        //console.log("push ret:"+ret);
        //console.log("push length:"+options.beforePcm.length);
    }
    var onData=this.onData= function (chunk){
      // if push() returns false, then stop reading from source
      if (!this.push(chunk))
        this._source.removeListener("data",onData);
    }.bind(this);
    this._source.on("data",onData);
    // When the source ends, push the EOF-signaling `null` chunk
    this._source.on("end" ,() => {
      this.push(null);
    });
  }
  // _read will be called when the stream wants to pull more data in
  // the advisory size argument is ignored in this case.
  _read(size) {
    this._source.read(size);
  }
  stopRecording(){
    this.push(null);
    this._source.removeListener("data",this.onData);
    this.onData=null;
    this._source=null
  }
}

DcsClient.prototype.sendEvent=function(eventData){
    if(eventData){
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
            headers:{
                "Content-Type": "multipart/form-data; boundary="+config.boundary,
                "Host": config.host, 
                "Authorization": "Bearer "+config.oauth_token,
                "DeviceSerialNumber": config.device_id
            }
        },(error, response, body)=>{
            console.log("event response headers:"+JSON.stringify(response.headers,null,2));
            console.log("event response:"+body);
        });
        this.processEventRequest(r);
    }
    console.log("sendEvent:"+JSON.stringify(eventData,null,2));
};

DcsClient.prototype.processEventRequest=function (r){
    let rWrap=new Readable().wrap(r);

    var d1 = new Dicer({"boundary":""});
    d1.on('error',()=>{
        console.log('dicer error, no multi part in events stream!!!!!!!!');
    });
    r.on('response', function(response) {
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
            console.log("[ERROR] response error, not multipart");
            rWrap.pipe(process.stderr);
        }
    });

    d1.on('part', (p) => {
        var name=null;
        var jsonBody="";
        var response=null;
        var content_id;
        p.on('header', (header)=> {
            console.log(JSON.stringify(header, null, '  '));
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
                jsonBody+=data.toString("utf8");
            }
        });
        p.on('end', ()=>{
            content_id=null;
            if(name=='metadata'){
                response=JSON.parse(jsonBody);
                this.emit("directive",response);
                console.log(JSON.stringify(response, null, '  '));
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
        headers:{
            "Content-Type": "multipart/form-data; boundary="+config.boundary,
            "Host": config.host, 
            "Authorization": "Bearer "+config.oauth_token,
            "DeviceSerialNumber": config.device_id
        }
    });
    this.processEventRequest(r);
    this._isRecognizing=true;
};

DcsClient.prototype.isRecognizing=function(){
    return this._isRecognizing;
};

DcsClient.prototype.stopRecognize=function(){
    if(this._isRecognizing){
        //this.request.end();
        this.rec_stream.stopRecording();
        this.request=null;
    }
    this._isRecognizing=false;
};


function DownStream(){
    EventEmitter.call(this);
    this.init();
}

DownStream.prototype.init=function(){
    var self=this;
    if(this.req){
        this.req.abort();
    }
    this.req=request.get({
        "url":config.schema+config.ip+config.directive_uri ,
        headers:{
            "Host": config.host, 
            "Authorization": "Bearer "+config.oauth_token,
            "DeviceSerialNumber": config.device_id
        }
    });
    this.req.on("error",()=>{
        this.init();
    });
    var d = new Dicer({"boundary":""});
    d.on('error',()=>{
        console.log('downstream dicer error, no multi part in downstream!!!!!!!!');
        this.init();
    });
    this.req.on('response', function(response) {
        console.log("downstream created!");
        if(!response.headers['content-type']){
            throw new Exception("server header error: no content-type");
        }
        var matches=response.headers['content-type'].match(/boundary=([^;]*)/);
        if(matches&&matches[1]){
            d.setBoundary(matches[1]);
        }
    });
    this.req.pipe(d);
    //content-type: multipart/form-data; boundary=___dumi_avs_xuejuntao___
    d.on('part', function(p) {
        console.log("on part");
        var name=null;
        var jsonBody="";
        var response=null;
        p.on('header', function(header) {
            name=null;
            jsonBody="";
            response=null;
            console.log(JSON.stringify(header, null, '  '));
            if(header["content-disposition"] ){
                var matches;
                if(matches= header["content-disposition"][0].match(/name="(\w+)"/)){
                    name=matches[1];
                }
            }
            if(header['content-id']){
                var content_id=header["content-id"][0].replace(/[<>]/g,"");
                console.log("content_id:"+content_id);
                file=fs.createWriteStream(__dirname+"/tmp/"+content_id,{
                    flags: 'w',
                    defaultEncoding: 'binary',
                    autoClose: true
                });
                self.emit("content",content_id,p);
            }
        });
        p.on('data', function(data) {
            if(name=="metadata"){
                jsonBody+=data.toString("utf8");
            }
        });
        p.on('end', function() {
            if(jsonBody){
                response=JSON.parse(jsonBody);
                self.emit("directive",response);
            }
            console.log(JSON.stringify(response, null, '  '));
        });
        p.on('error',()=>{
            console.log('downstream dicer error, event part error');
        });
    });
    d.on('finish', function() {
        console.log('End of parts');
    });

}
util.inherits(DownStream, EventEmitter);

module.exports=DcsClient;

