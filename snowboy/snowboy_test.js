const Detector = require('.').Detector;
const Models = require('.').Models;

const models = new Models();



let child_process=require("child_process");
let rec_cmd='rec -t wav -r44100 -b32 -c2 -';
let convert_cmd='sox -t wav -r44100 -b32 -c2 - -t s16 -r16000 -b16 -c1 -';

function Recorder(){
    this.rec_process=null;
    this.convert_process=null;
}

module.exports=Recorder;

Recorder.prototype.start=function(){
    if(!this.rec_process){
        this.rec_process=child_process.spawn(rec_cmd.split(" ")[0],rec_cmd.split(" ").slice(1),
                {   
                    stdio:['ignore', 'pipe', 'pipe']
                }
                );

        this.convert_process=child_process.spawn(convert_cmd.split(" ")[0],convert_cmd.split(" ").slice(1),
                {stdio:['pipe', 'pipe', 'pipe']}
                );
        this.rec_process.stdout.pipe(this.convert_process.stdin);
        console.log("rec start");
        //缓存的pcm永远在5-8s之间
        this.rec_process.stderr.pipe(process.stderr);
    }
    return this;
};

Recorder.prototype.getLatestBuffers=function(timeInMs){
    var length=32*parseInt(timeInMs,10)//1ms数据是32字节
    var bufSize=this.buffer_manager.size();
    if(bufSize>length){
        return this.buffer_manager.slice(bufSize-length,length);
    }else{
        return this.buffer_manager.slice(0);
    }
};

Recorder.prototype.stop=function(){
    if(this.rec_process){
        this.rec_process.kill("SIGINT");
    }
    if(this.convert_process){
        this.convert_process.kill("SIGINT");
    }
    this.rec_process=null;
    this.convert_process=null;
    console.log("rec end");
    return this;
};


Recorder.prototype.out=function(){
    if(this.convert_process){
        return this.convert_process.stdout;
    }
};

Recorder.prototype.stderr=function(){
    if(this.rec_process){
        return this.rec_process.stderr;
    }
};


models.add({
  //file: __dirname+'/resources/snowboy.umdl',
  //file: __dirname+'/resources/alexa.umdl',
  file:  __dirname+'/resources/xiaoduxiaodu_xiaoyuxiaoyu_large.umdl',
  sensitivity: '0.9,0.9',
  hotwords : ['小度小度',"小度小度"]
});

const detector = new Detector({
  resource:  __dirname+"/resources/common.res",
  models: models,
  audioGain: 1.0
});

detector.on('silence', function () {
  console.log('silence');
});

detector.on('sound', function (buffer) {
  // <buffer> contains the last chunk of the audio that triggers the "sound"
  // event. It could be written to a wav stream.
  console.log('sound');
});

detector.on('error', function () {
  console.log('error');
});

detector.on('hotword', function (index, hotword, buffer) {
  // <buffer> contains the last chunk of the audio that triggers the "hotword"
  // event. It could be written to a wav stream. You will have to use it
  // together with the <buffer> in the "sound" event if you want to get audio
  // data after the hotword.
  console.log('hotword', index, hotword);
});

//const reader = new wav.Reader();
var recorder=new Recorder();
recorder.start().out().pipe(detector);
