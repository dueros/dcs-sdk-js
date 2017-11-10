const Detector = require('./snowboy').Detector;
const Models = require('./snowboy').Models;

const models = new Models();

/*
//console.log(__dirname+"/resources/common.res");
models.add({
  //file: __dirname+'/resources/snowboy.umdl',
  file: __dirname+'/resources/alexa.umdl',
  //file: 'resources/xiaoduxiaodu_xiaoyuxiaoyu_large.umdl',
  sensitivity: '0.5',
  hotwords : 'snowboy'
});
*/
/*
models.add({
  //file: __dirname+'/resources/snowboy.umdl',
  //file: __dirname+'/resources/alexa.umdl',
  file:  __dirname+'/snowboy/resources/xiaoduxiaodu_xiaoyuxiaoyu_large.umdl',
  sensitivity: '0.9,0.9',
  hotwords : ['小度小度',"小度小度"]
});
*/
models.add({
    //file: __dirname+'/resources/snowboy.umdl',
    //file: __dirname+'/resources/alexa.umdl',
    file: __dirname + '/snowboy/resources/xiaoduxiaodu.umdl',
    sensitivity: '0.35,0.35,0.45',
    hotwords: ['小度小度', "小度小度", "小度小度"]
});

const detector = new Detector({
    resource: __dirname + "/snowboy/resources/common.res",
    models: models,
    audioGain: 1.0
});

detector.on('silence', function() {
    //console.log('snowboy silence');
});

detector.on('sound', function(buffer) {
    // <buffer> contains the last chunk of the audio that triggers the "sound"
    // event. It could be written to a wav stream.
    //console.log('snowboy sound');
});

detector.on('error', function() {
    console.log('snowboy error');
});

detector.on('hotword', function(index, hotword, buffer) {
    // <buffer> contains the last chunk of the audio that triggers the "hotword"
    // event. It could be written to a wav stream. You will have to use it
    // together with the <buffer> in the "sound" event if you want to get audio
    // data after the hotword.
    console.log('hotword', index, hotword);
});

//const reader = new wav.Reader();
//var recorder=new Recorder();
//recorder.start().out().pipe(detector);
var audioStream;
module.exports.start = function(_audioStream) {
    audioStream = _audioStream;
    audioStream.pipe(detector);
};

module.exports.stop = function() {
    audioStream.unpipe(detector);
};
module.exports.on = detector.on.bind(detector);
module.exports.once = detector.once.bind(detector);
module.exports.removeListener = detector.removeListener.bind(detector);
module.exports.removeAllListeners = detector.removeAllListeners.bind(detector);