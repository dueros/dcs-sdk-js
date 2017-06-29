/*
* Copyright (c) 2017 Baidu, Inc. All Rights Reserved.
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* 
*   http://www.apache.org/licenses/LICENSE-2.0
* 
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
const BufferManager=require("./buffermanager").BufferManager;
const EventEmitter = require('events');
const BinParser=require("./binparser");
const WakeupMessage=require("./wakeupMessage");
module.exports=Msgout;
function Msgout(output_stream){
    var bm=new BufferManager();
    var needLength=-1;
    this.emitter=new EventEmitter();
    output_stream.on("data",function(data){
        //console.log(data);
        console.log("on data:"+data.length);
        if(data.length>0){
            bm.add(data);
        }
        //console.log("!!needLength:"+needLength+" bmsize:"+bm.size());
        while(true){
            //console.log("needLength:"+needLength);
            if(bm.size()<4){
                break;
            }
            needLength=bm.slice(0,4).readInt32LE();

            //console.log("needLength:"+needLength+" bmsize:"+bm.size());
            if(bm.size()<needLength){
                break;
            }
            var allbuf=bm.slice(4,needLength);
            bm.delete(4+needLength);
            //console.log(allbuf);
            parser=new BinParser(allbuf);
            var sdkmsg=new WakeupMessage();
            while(!parser.isEnd()){
                var ret=parser.parse();
                sdkmsg.set(ret.key,ret.value);
            }
            this.emitter.emit("msg",sdkmsg);
            needLength=-1;
        }
    }.bind(this));

}
['on',"once","removeListener","removeAllListeners"].forEach(function(name){
    Msgout.prototype[name]=function(...args){
        console.log("bind "+this.emitter[name]);
        return this.emitter[name].apply(this.emitter,args);
    };
});
