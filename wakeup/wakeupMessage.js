function WakeupMessage(){
    this.dict={};
}
WakeupMessage.prototype.set=function(key,value){
    this.dict[key]=value;
};
WakeupMessage.prototype.get=function(key){
    return this.dict[key];
};
WakeupMessage.prototype.getAll=function(key){
    return this.dict;
};
function int2buf(i){
    var buf=Buffer.alloc(4);
    buf.writeInt32LE(i,0);
    return buf;
}
WakeupMessage.prototype.toBuffer=function(key){
    var list=[];
    var buf;
    var key,value;

    for(key in this.dict){
        if(this.dict.hasOwnProperty(key)){
            buf=Buffer.from(key);
            list.push(int2buf(buf.length));
            list.push(buf);

            value=this.dict[key];
            if(Buffer.isBuffer(value)){
                list.push(int2buf(value.length));
                list.push(value);
            }else if(typeof value=="string"){
                buf=Buffer.from(value);
                list.push(int2buf(buf.length));
                list.push(buf);
            }else if(typeof value=="number"){
                list.push(int2buf(4));
                list.push(int2buf(value));
            }
        }
    }
    var all_len=list.reduce(function (prev,curr){
        return prev+curr.length;
    },0);
    list.unshift(int2buf(all_len));
    return Buffer.concat(list);
};


module.exports=WakeupMessage;
