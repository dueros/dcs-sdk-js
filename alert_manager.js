///播放器控制类，解决播放列表的问题
const EventEmitter=require("events");
const util = require('util');
function AlertManager(){
}
util.inherits(AlertManager, EventEmitter);
var handlers={
    "SetAlert":function(directive){
    },
    "DeleteAlert":function(directive){
    }
};
AlertManager.prototype.getContext=function(){
    //TODO
};
AlertManager.prototype.handleDirective=function (directive){
    var name=directive.header.name;
    if(handlers[name]){
        handlers[name].call(this,directive);
    }
}

module.exports=AlertManager;

