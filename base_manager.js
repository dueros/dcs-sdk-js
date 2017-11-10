const EventEmitter = require("events");
const util = require('util');

function BaseManager() {}
util.inherits(BaseManager, EventEmitter);

BaseManager.prototype.getContext = function() {};

BaseManager.prototype.handleDirective = function(directive, controller) {
    //NONE
};
//stopPlay, reset condition, and more
BaseManager.prototype.stop = function(directive, controller) {
    //NONE
};

module.exports = BaseManager;