const led = require('./led');
module.exports = function(controller) {
    controller.on("event", (eventData) => {
        if (eventData.event.header.name == "ListenStarted") {
            led.listen();
        }
        if (eventData.event.header.name == "SpeechStarted") {
            led.speak();
        }
        if (eventData.event.header.name == "SpeechFinished") {
            led.off();
        }
    });

    controller.on("directive", (response) => {
        if (response.directive.header.name == "StopListen") {
            led.think();
        }
        if (response.directive.header.namespace == "ai.dueros.device_interface.audio_player") {
            led.off();
        }
    });
};