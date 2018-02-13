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
const util = require('util');
const EventEmitter = require("events");
const DcsProtocol = require("./dcs_protocol");
const DataStreamPlayer = require("./device_module/system_impl/data_stream_player");
const AudioPlayerManager = require("./device_module/audio_player_manager");
const SpeakerManager = require("./device_module/speaker_manager");
const AlertManager = require("./device_module/alert_manager");
const VoiceInputManager = require("./device_module/voice_input_manager");
const VoiceOutputManager = require("./device_module/voice_output_manager");
const HttpManager = require("./device_module/http_manager");
const LocationManager = require("./device_module/location_manager");
const ScreenManager = require("./device_module/screen_manager");
const configModule = require("./config.js");
const config = configModule.getAll();

function DcsController(options) {
    this.locationManager = new LocationManager(this);
    this.alertManager = new AlertManager(this);
    this.audioPlayerManager = new AudioPlayerManager(this);
    this.speakerManager = new SpeakerManager(this);
    this.voiceOutputManager = new VoiceOutputManager(this);
    this.voiceInputManager = new VoiceInputManager(this);
    this.screenManager = new ScreenManager(this);
    this.httpManager = new HttpManager(this);
    this.managers = [
        this.locationManager,
        this.alertManager,
        this.audioPlayerManager,
        this.speakerManager,
        this.voiceOutputManager,
        this.voiceInputManager,
        this.screenManager,
        this.httpManager,
    ];
    this.voiceOutputManager.on("end", () => {
        setTimeout(() => {
            if (!this.voiceOutputManager.isPlaying() && this.audioPlayerManager.isPaused()) {
                console.log("resume player on voice end");
                this.audioPlayerManager.play();
            }
        }, 500);
    });
    this.voiceOutputManager.on("start", () => {
        this.audioPlayerManager.pause();
    });
    this._contents = {};
    this.queue = [];
    this.dialogs = [];
}
util.inherits(DcsController, EventEmitter);

DcsController.prototype.isPlaying = function() {
    return (this.audioPlayerManager.isPlaying() || this.voiceOutputManager.isPlaying() || this.alertManager.isActive());

};

DcsController.prototype.addDeviceModule = function(manager) {
    this.managers.push(manager);
};

DcsController.prototype.getContext = function(namespace) {
    var contexts = [];
    this.managers.forEach((manager) => {
        let context = manager.getContext();
        if (Array.isArray(context)) {
            contexts = contexts.concat(context);
        } else if (!!context) {
            contexts.push(context);
        }
    });
    contexts = contexts.filter((context) => {
        return !!context;
    });

    if (namespace) {
        for (let i = 0; i < contexts.length; i++) {
            if (contexts[i].header.namespace == namespace) {
                return contexts[i];
            }
        }
        return null;
    }


    return contexts;
    //TODO get all alerts
    //TODO get audio player
    //TODO get speaker status

};

DcsController.prototype.setClient = function(client) {
    this.client = client;
    client.on("directive", (response) => {
        this.handleResponse(response);
        this.emit("directive", response);
    });
    client.on("content", (content_id, content) => {
        this.emit("content", content_id, content);
    });
    client.on("downstream_init", () => {
        this.emit("event", DcsProtocol.createEvent(
            "ai.dueros.device_interface.system",
            "SynchronizeState",
            this.getContext()
        ));
        this.emit("downstream_init");
    });
    this.on("event", (dcs_event) => {
        if (dcs_event && dcs_event.event && dcs_event.event.header) {
            if (
                dcs_event.event.header.namespace == "ai.dueros.device_interface.voice_input" &&
                dcs_event.event.header.name == "ListenStarted"
            ) {
                return;
            }
        }
        client.sendEvent(dcs_event);
    });
};

DcsController.prototype.handleResponse = function(response) {
    if (!response || !response.directive) {
        return;
    }
    if (!response.directive.header.dialogRequestId) {
        this.processDirective(response.directive);
        return;
    }

    if ((response.directive.header.namespace == "ai.dueros.device_interface.audio_player" && response.directive.header.name == "Play" && response.directive.payload.playBehavior == "REPLACE_ALL")) {
        this.audioPlayerManager.stop();
    }

    if (
        (this.currentDialogRequestId &&
            response.directive.header.dialogRequestId == this.currentDialogRequestId)
        //StopListen 无论如何都要执行
        ||
        (response.directive.header.namespace == "ai.dueros.device_interface.voice_input" && response.directive.header.name == "StopListen")
    ) {
        this.queue.push(response);
        if (!this.processing) {
            this.deQueue();
        }
    }
};

DcsController.prototype.cancelCurrentDialog = function() {
    this.currentDialogRequestId = "";
}

DcsController.prototype.stopPlay = function(directive) {
    this.managers.forEach((manager) => {
        manager.stop();
    });
    /*
    this.audioPlayerManager.stop();
    this.voiceOutputManager.stop();
    this.alertManager.stop();
    */
};

DcsController.prototype.startRecognize = function(options) {
    if (!this.client) {
        return false;
    }
    this.audioPlayerManager.pause();
    if (this.voiceOutputManager.isPlaying()) {
        this.voiceOutputManager.stop();
    }

    if (options && options.wakeWordPcm) {
        var wakeWordPcm = options.wakeWordPcm;
    }
    eventData = DcsProtocol.createRecognizeEvent(options);
    if (this.currentDialogRequestId) {
        this.dialogs = this.dialogs.filter((dialog) => {
            if (dialog.getDialogRequestId() == this.currentDialogRequestId) {
                dialog.stopRecording();
                return false;
            }
            return true;
        });
    }
    this.currentDialogRequestId = eventData.event.header.dialogRequestId;
    this.queue = [];
    eventData.clientContext = this.getContext();
    this.emit("event", eventData);
    let dialog = this.client.startRecognize(eventData, wakeWordPcm);
    dialog.on("requestSpeechFinished", () => {
        if (this.audioPlayerManager.isPaused()) {
            setTimeout(() => {
                if (this.audioPlayerManager.isPaused() && !this.voiceOutputManager.isPlaying()) {

                    console.log("resume player");
                    this.audioPlayerManager.play();
                }
            }, 1000);
        }
    });
    this.dialogs.push(dialog);
    return dialog;
};
DcsController.prototype.stopRecognize = function() {
    this.dialogs.forEach((dialog) => {
        dialog.stopRecording();
    });
    this.dialogs = [];
    return false;
};
DcsController.prototype.isRecognizing = function() {
    return this.dialogs.length > 0;
};
DcsController.prototype.processDirective = function(directive) {
    let promise = Promise.resolve();
    this.managers.forEach((manager) => {
        promise = promise.then(() => {
            let tmpRet = manager.handleDirective(directive, this);
            if (tmpRet) {
                return tmpRet;
            } else {
                return Promise.resolve();
            }
        });
    });
    return promise;
};
DcsController.prototype.deQueue = function() {
    this.processing = true;
    if (this.queue.length == 0) {
        this.processing = false;
        return;
    }
    var response = this.queue.shift();
    if (!response || !response.directive) {
        this.deQueue();
        return;
    }
    var directive = response.directive;
    if ((directive.header.dialogRequestId && this.currentDialogRequestId) &&
        directive.header.dialogRequestId != this.currentDialogRequestId &&
        !(directive.header.namespace == "ai.dueros.device_interface.voice_input" &&
            directive.header.name == "StopListen")
    ) {
        this.deQueue();
        return;
    }

    var promise = this.processDirective(directive);
    if (promise && promise.then) {
        promise
            .then(() => {
                this.deQueue()
            })
            .catch(() => {
                this.deQueue()
            });
    } else {
        this.deQueue();
    }
};

DcsController.prototype.setAccessToken = function(access_token) {
    console.log("new access_token:", access_token);
    console.log("old access_token:", config.oauth_token);
    if (access_token && config.oauth_token != access_token) {
        configModule.save("oauth_token", access_token);
        config.oauth_token = access_token;
        if (this.client) {
            setTimeout(() => {
                this.client.downstream.init();
            }, 2000);
        }
    }
};
DcsController.prototype.getAccessToken = function() {
    return config.oauth_token;
};


module.exports = DcsController;