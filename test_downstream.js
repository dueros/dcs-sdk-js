const DownStream=require("./downstream2");
const config=require("./config.js").getAll();
const child_process=require("child_process");

let d=new DownStream();
let child;
let exitTimeoutId;

d.on("directive",(response)=>{
    console.log("directive!!",response.directive.header.name);
    if(response.directive.header.name=="StopListen"){
        clearTimeout(exitTimeoutId);
        child.kill("SIGKILL");
    }
});

let intervalId=setInterval(()=>{
    d.init();
    child=child_process.spawn("/bin/sh",["dcs_test.sh"]);
        //child.stdout.pipe(process.stdout);
        //child.stderr.pipe(process.stderr);
        //child_process.exec("sh -c dcs_test.sh");
    exitTimeoutId=setTimeout(()=>{
        console.log(new Date(),"no stopListen");
        clearInterval(intervalId);
        //process.exit(-1);
    },4000);
    /*
    let req=d.http2session.request({
        ":path":config.directive_uri,
        "authorization": "Bearer "+config.oauth_token,
        "deviceSerialNumber": config.device_id
    });
    req.on("error",()=>{
        console.log("other stream error");
    });
    req.on("streamClosed",()=>{
        console.log("other stream close");
    });
    req.on('response', (headers) => {
        console.log(headers);
    });
    setTimeout(()=>{
        req.rstWithCancel();
    },1000);;
    */
},5000);
/*
setInterval(()=>{
    d.init();
},2000);
*/
