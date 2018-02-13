const DownStream = require("./downstream2");
const config = require("./config.js").getAll();
const child_process = require("child_process");

let d = new DownStream();
let child;
let recvStopListen;

d.on("directive", (response) => {
    console.log("directive!!", response.directive.header.name);
    if (response.directive.header.name == "StopListen") {
        recvStopListen = true;
        child.kill("SIGKILL");
    }
});

function test() {
    d.init();
    d.once("init", () => {
        child = child_process.spawn("/bin/sh", ["dcs_test.sh"]);
        //child.stdout.pipe(process.stdout);
        //child.stderr.pipe(process.stderr);
        //child_process.exec("sh -c dcs_test.sh");
        setTimeout(() => {
            if (!recvStopListen) {
                console.log(new Date(), "no stopListen");
                return;
            }
            recvStopListen = false;
            test();
            //process.exit(-1);
        }, 4000);
    });
}
test();
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
/*
setInterval(()=>{
    d.init();
},2000);
*/
