const EventEmitter=require("events");
const util = require('util');
const request=require("request");
const config=require("./dcs_config.json");
const Readable = require('stream').Readable;
const http2=require("http2");
const fs = require('fs');
const Dicer = require('dicer');

function DownStream(){
    EventEmitter.call(this);
    this.init();
}

DownStream.prototype.init=function(){
    var self=this;
    if(this.req){
        this.req.abort();
    }
    console.log(config.oauth_token);
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
                try{
                    response=JSON.parse(jsonBody);
                }catch(e){}
                if(response){
                    self.emit("directive",response);
                }
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
module.exports=DownStream;
