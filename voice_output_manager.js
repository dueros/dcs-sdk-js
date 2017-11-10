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
const BaseManager = require("./base_manager");
const util = require('util');
const DataStreamPlayer = require("./data_stream_player");
const DcsProtocol = require("./dcs_protocol");

function VoiceOutputManager(controller) {
    this.ttsplayer = new DataStreamPlayer();

    this.ttsplayer.on("start", () => {
        controller.emit("event", DcsProtocol.createEvent(this.NAMESPACE, "SpeechStarted", controller.getContext(), {
            token: this.last_played_token
        }));
    });
    this.ttsplayer.on("end", () => {
        if (this.promise) {
            this.promise.resolve();
        }
        controller.emit("event", DcsProtocol.createEvent(this.NAMESPACE, "SpeechFinished", controller.getContext(), {
            token: this.last_played_token
        }));
    });
    controller.on("content", (content_id, content) => {
        if (this.content_id = content_id) {
            this.ttsplayer.play(content);
        } else {
            this.content_cache = [content_id, content];
        }
    });

}
util.inherits(VoiceOutputManager, BaseManager);
VoiceOutputManager.prototype.NAMESPACE = "ai.dueros.device_interface.voice_output";
var handlers = {
    "Speak": function(directive, controller) {
        this.last_played_token = directive.payload.token;
        var url = directive.payload.url;
        if (!url) {
            console.log("[ERROR] " + JSON.stringify(directive));
            return;
            //throw new Error("no tts return");
        }
        var matches, cid;
        if (matches = url.match(/^cid:(.*)/)) {
            cid = matches[1];
        } else {
            return;
        }
        return new Promise((resolve, reject) => {
            if (this.content_cache && this.content_cache[0] == cid) {
                this.ttsplayer.play(content);
            }
            this.content_id = cid;
            if (this.promise) {
                this.promise.reject();
            }
            this.promise = {
                resolve: resolve,
                reject,
                reject
            };
        });
    }
};
VoiceOutputManager.prototype.getContext = function() {
    return {
        "header": {
            "namespace": this.NAMESPACE,
            "name": "SpeechState"
        },
        "payload": {
            "token": this.last_played_token,
            ///TODO get how long was played, in sox.play.stderr?
            "offsetInMilliseconds": 0,
            "playerActivity": this.ttsplayer.isPlaying() ? "PLAYING" : "IDLE"
        }
    };
};
VoiceOutputManager.prototype.isPlaying = function() {
    return this.ttsplayer.isPlaying();
};
VoiceOutputManager.prototype.stop = function() {
    return this.ttsplayer.stop();
};
VoiceOutputManager.prototype.handleDirective = function(directive, controller) {

    if (directive.header.namespace != this.NAMESPACE) {
        return;
    }
    var name = directive.header.name;
    if (handlers[name]) {
        return handlers[name].call(this, directive, controller);
    }
}

module.exports = VoiceOutputManager;