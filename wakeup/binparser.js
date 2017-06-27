function BinParser(buf){
    this.buffer=buf;
    this.pos=0;

}
BinParser.prototype.parse=function(){
    var key_len=this.buffer.readInt32LE(this.pos);
    this.pos+=4;
//console.log("key_len:"+key_len);
    var key=this.buffer.toString("utf-8",this.pos,this.pos+key_len);
    this.pos+=key_len;
//console.log("key:"+key);
    
    var value_len=this.buffer.readInt32LE(this.pos);
    this.pos+=4;
        
    var value=Buffer.alloc(value_len);
    this.buffer.copy(value,0,this.pos,this.pos+value_len);
//console.log("value:"+value);
    this.pos+=value_len;
    return {key:key,value:value};
};
BinParser.prototype.isEnd=function(){
    return this.pos>=this.buffer.length;
};
module.exports=BinParser;
