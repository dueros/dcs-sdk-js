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
const path = require("path");
const ROOT_PATH = path.resolve(__dirname + "/..");
const BaseManager = require("./base_manager");
const util = require('util');
const child_process = require('child_process');
const system = require(ROOT_PATH + '/lib/system');
const DcsProtocol = require(ROOT_PATH + "/dcs_protocol");

class ScreenManager extends BaseManager {
    constructor(dcsController) {
        super();
        this.NAMESPACE = "ai.dueros.device_interface.screen";
        this.dcsController = dcsController;
        dcsController.on("event", (dcsEvent) => {
            var ev = dcsEvent.event;
            if (ev.header.namespace == 'ai.dueros.device_interface.audio_player') {
                this.last_token = ev.payload.token;
                this.last_player_token = ev.payload.token;
            }
        });
    }
    HtmlViewDirective(directive) {
        //TODO
    }
    RenderCardDirective(directive) {
        //TODO
    }
    RenderPlayerInfoDirective(directive) {
        this.last_player_info = directive.payload;
    }
    RenderAudioListDirective(directive) {
        this.last_player_list = directive.payload;
    }
    RenderVoiceInputTextDirective(directive) {
        //TODO
    }
    RenderHintDirective(directive) {
        //TODO
    }
    getContext() {
        var context = {
            "header": {
                "namespace": this.NAMESPACE,
                "name": "ViewState"
            },
            "payload": {}
        };
        if (this.last_player_token) {
            context.payload.player_token = this.last_player_token;
        }
        if (this.last_token) {
            context.payload.token = this.last_token;
        }
        return context;
    }

    buttonClicked(token, buttonName) {
        this.dcsController.emit("event", DcsProtocol.createEvent("ai.dueros.device_interface.form", "ButtonClicked", controller.getContext(), {
            "token": token,
            "name": buttonName,
        }));
    }

    radioButtonClicked(token, index, selectedValue) {
        this.dcsController.emit("event", DcsProtocol.createEvent("ai.dueros.device_interface.form", "RadioButtonClicked", controller.getContext(), {
            "token": token,
            "index": index,
            "selectedValue": selectedValue
        }));
    }
    getLastPlayerList() {
        return this.last_player_list;
    }

    handleDirective(directive, controller) {
        if (
            directive.header.namespace != this.NAMESPACE &&
            directive.header.namespace != "ai.dueros.device_interface.screen_extended_card"
        ) {
            return;
        }

        this.last_token = directive.payload.token;

        let name = directive.header.name;
        console.log(typeof this[name + "Directive"]);
        if (typeof this[name + "Directive"] === "function") {
            this[name + "Directive"](directive);
        }
    }


    getLastPlayerInfo() {
        return this.last_player_info;
    }
}

module.exports = ScreenManager;