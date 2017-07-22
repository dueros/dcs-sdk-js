
const led = require('./led');

controller.on("event",(eventData)=>{
    if(eventData.header.name=="ListenStarted"){
        led.listen();
    }
    if(eventData.header.name=="SpeechStarted"){
        led.speak();
    }
    if(eventData.header.name=="SpeechFinished"){
        led.off();
    }
});
