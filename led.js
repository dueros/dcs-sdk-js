const child_process=require("child_process");
var process;
["wakeup","listen","think","speak","off"].forEach((func)=>{
    module.exports[func]=function(){
        var cmd="cd mic_hat;./led.py "+func;
        if(process){
            process.kill("SIGKILL");
        }
        process=child_process.exec(cmd,()=>{
            //console.log(cmd);
            //controller.startRecognize();
        });
    };
});

