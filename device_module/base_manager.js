const EventEmitter = require("events");

class BaseManager extends EventEmitter{
    getContext(){}
    handleDirective(directive,controller){
        if (directive.header.namespace != this.NAMESPACE) {
            return false;
        }
        let name = directive.header.name;
        if (typeof this[name+"Directive"] === "function") {
            this[name+"Directive"](directive,controller);
            return true;
        }
        return false;
    }
    stop(directive,controller){}
}
module.exports = BaseManager;
