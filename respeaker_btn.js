var Gpio = require('onoff').Gpio,
    button = new Gpio(17, 'in', 'both');

const EventEmitter = require("events");
var emiter = new EventEmitter();

var old_value = 1;
button.watch(function(err, value) {
    if (value == 0) {
        emiter.emit("keydown");
    }
    if (value == 1) {
        emiter.emit("keyup");
    }
    if (old_value == 0 && value == 1) {
        emiter.emit("click");
    }
    old_value = value;
});

process.on('SIGINT', function() {
    button.unexport();
});
module.exports = emiter;