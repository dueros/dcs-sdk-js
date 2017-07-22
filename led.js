const child_process=require("child_process");
var process;
["wakeup","listen","think","speak","off"].forEach((func)=>{
    module.exports[func]=function(){
        if(process){
            process.kill("SIGKILL");
        }
        process=child_process.spawn("/usr/bin/python",
                ["led.py",func],
                {"cwd":__dirname+"/mic_hat"}
                );
    };
});

