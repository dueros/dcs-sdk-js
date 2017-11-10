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

const config = require("./config.js").getAll();

function createEvent(namespace, name, context, _payload) {
    var payload = {};
    if (_payload) {
        Object.assign(payload, _payload);
    }
    /*
    if(namespace=="AudioPlayer"){
        namespace="ai.dueros.device_interface.audio_player";
        context.forEach((c,idx)=>{
            if(c.header.namespace==namespace){
                payload.token=c.payload.token;
                payload.offsetInMilliseconds=c.payload.offsetInMilliseconds;
            }
        });
    }
    */
    var eventData = {
        "requestId": "wp" + new Date().getTime(),
        "event": {
            "header": {
                "namespace": namespace,
                "name": name,
                "messageId": "wp" + new Date().getTime()
            },
            "payload": payload
        },
    };
    if (config.debug) {
        eventData.debug = config.debug;
    }
    if (context) {
        eventData.clientContext = context;
    }
    return eventData;
}

function createRecognizeEvent(options) {
    var ev = {
        "requestId": "wp" + new Date().getTime(),
        "event": {
            "header": {
                "namespace": "ai.dueros.device_interface.voice_input",
                "name": "ListenStarted",
                "messageId": "wp" + new Date().getTime(),
                "dialogRequestId": "wp" + new Date().getTime()
            },
            "payload": {
                "format": "AUDIO_L16_RATE_16000_CHANNELS_1"
            }
        },
    };
    if (config.debug) {
        ev.debug = config.debug;
    }
    if (options && options.initiator) {
        ev.event.payload.initiator = options.initiator;
    }
    return ev;
}


module.exports = {
    createEvent: createEvent,
    createRecognizeEvent: createRecognizeEvent,
};