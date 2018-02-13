const URL = require('url');
const path = require("path");
const config = require("../config.js").getAll();
const h1_request = require("request");
const http2=require("http2");
const fs=require("fs");
function h2_request (options){
    options=Object.assign({
        "method":"GET",
        headers:{},
    },options);
    let url=URL.parse((options.url));

    let http2session;
    if(options.http2session){
        http2session=options.http2session
    }else{
        http2session=http2.connect(url.protocol + "//" + url.host,{rejectUnauthorized:false});
    }

    let headers=Object.assign({ 
        ':path': url.path,
        ":method":options.method.toUpperCase(),
    },options.headers);
    let req=http2session.request(headers);

    req.abort=req.rstWithCancel;

    return req;
    
}
let request;
if(config.protocol=="http2"){
    if(fs.existsSync(__dirname+"/node_modules/http2") && require("http2")===require("./node_modules/http2")){
        console.log("protocol:http2, only support node 8.9.1 or newer");
        process.exit(1);
    }
    request=h2_request;
}else{
    request=h1_request;
}
module.exports=request;
