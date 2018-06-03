const m=require("./Pcm2BV.js");
const Readable = require('stream').Readable;
m.run();
let cInBuf;
let cOutBuf;
let loadPromise=new Promise((resolve,reject)=>{
    m['postRun'].push(()=>{
        m._init();
        cInBuf=m._malloc(160);
        cOutBuf=m._malloc(160);
        resolve();
    });
});
module.exports.ready=async function (buffer){
	return loadPromise;
};
    
class BV32RecorderWrapper extends Readable {
    constructor(options) {
        super(options);
        this.buffer_manager=new BufferManager();
        this._source = options.recorder;
        let onData = this.onData = function(chunk) {
            // if push() returns false, then stop reading from source
            //console.log("on record data:" + chunk.length);
            this.buffer_manager.add(chunk);
            while(this.buffer_manager.size()>160){
                let buffer=this.buffer_manager.slice(0,160);
                this.buffer_manager.delete(160);
                let encodedBuffer=encode(buffer);
                //console.log("encoded to bv format:" + encodedBuffer.length);
                if (!this.onData || !this.push(encodedBuffer)) {
                    if (this._source) {
                        this._source.removeListener("data", onData);
                    }
                }
            }
        }.bind(this);
        this._source.on("data", onData);
        // When the source ends, push the EOF-signaling `null` chunk
        this._source.on("end", () => {
            this.push(null);
            //fs.writeFileSync("recorder.pcm",this.buffer_manager.slice(0));
        });
        this._source.on("error", () => {
            this.stopRecording();
        });
    }
    // _read will be called when the stream wants to pull more data in
    // the advisory size argument is ignored in this case.
    _read(size) {
        this._source.read(size);
    }
    stopRecording() {
        //fs.writeFileSync("recorder.pcm",this.buffer_manager.slice(0));
        this.push(null);
        if(this._source.stopRecording){
            this._source.stopRecording();
        }
        this._source.removeListener("data", this.onData);
        this.onData = null;
        this._source = null;
        
    }
}

function encode(buf){
    let arr = new Uint8Array(buf);
    m.writeArrayToMemory(arr,cInBuf);
	let ret=m._encode(cInBuf,160,cOutBuf,160);
    //console.log(ret);//should be 20
    let encoded=m.HEAPU8.subarray(cOutBuf, cOutBuf+ret)
    //console.log(Buffer.from(encoded));
    return encoded;
    //console.log("hello world"); 

}

module.exports.BV32RecorderWrapper=BV32RecorderWrapper;


if(module === require.main) {
    module.exports.ready().then(()=>{
        const fs=require("fs");
        let buf=fs.readFileSync("recorder.pcm");
        let ret=encode(buf.slice(160));
        console.log(ret);
    
    });
}
