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
class SpeakerManager extends BaseManager{
    constructor() {
        super();
        this.NAMESPACE = "ai.dueros.device_interface.speaker_controller";
        this.logicVolume = this.getCurrentVolume();
        this.isMute = false;
    }
    SetVolumeDirective(directive){
        this.logicVolume = directive.payload.volume;
        if (this.logicVolume < 0) {
            this.logicVolume = 0;
        }
        if (this.logicVolume > 100) {
            this.logicVolume = 100;
        }
        if (!this.isMute) {
            this.setVolume(directive.payload.volume);
        }
    }
    AdjustVolumeDirective(directive){
        /*
        let currentVolume=this.getCurrentVolume();
        if(currentVolume>0){
            this.logicVolume=currentVolume;
        }
        */
        this.logicVolume = this.logicVolume + directive.payload.volume;
        if (this.logicVolume < 0) {
            this.logicVolume = 0;
        }
        if (this.logicVolume > 100) {
            this.logicVolume = 100;
        }
        if (!this.isMute) {
            this.setVolume(this.logicVolume);
        }
    }
    SetMuteDirective(directive){
        this.isMute = directive.payload.mute;
        if (this.isMute) {
            this.setVolume(0);
        } else {
            this.setVolume(this.logicVolume);
        }
    }
    getContext() {
        if (this.logicVolume === null) {
            return;
        }
        return {
            "header": {
                "namespace": this.NAMESPACE,
                "name": "VolumeState"
            },
            "payload": {
                "volume": this.logicVolume,
                "muted": this.isMute
            }
        };
    }

    handleDirective(directive, controller) {
        let ret = super.handleDirective(directive,controller);
        if(ret){
            let volume = this.getCurrentVolume();
            setTimeout(() => {
                controller.emit("event", DcsProtocol.createEvent(this.NAMESPACE, "VolumeChanged", controller.getContext(), {
                    "volume": this.logicVolume,
                    "muted": this.isMute
                }));
            }, 0);
        }
    }

    setVolume(volume) {
        if (system.get() == "raspberrypi") {
            let output = child_process.execSync("for device in $(amixer controls|awk -F, '{print $2}'|awk -F= '{print $2}'|sort|uniq);do amixer set $device " + volume + "%;done").toString();
            console.log(output);
        }
        if (system.get() == "macos") {
            var f = volume / 100 * 7;
            let output = child_process.execSync('osascript -e "set volume ' + f.toFixed(2) + '"').toString();
            return parseInt(output, 10);
        }
    }

    getCurrentVolume() {
        if (system.get() == "raspberrypi") {
            try {
                let output = child_process.execSync("for device in $(amixer controls|awk -F, '{print $2}'|awk -F= '{print $2}'|sort|uniq);do amixer get $device;done").toString();
                let matches = output.match(/\[([0-9]+)\%\]/);
                if (matches && matches[1]) {
                    return parseInt(matches[1], 10);
                } else {
                    return 100;
                }
            } catch (e) {
                return 100;
            }
        }
        if (system.get() == "macos") {
            let output = child_process.execSync('osascript -e "get output volume of (get volume settings)"').toString();
            let volume = parseInt(output, 10);
            if (isNaN(volume)) {
                console.log("当前的播放设备不支持调整音量，请检查声音设置！");
                return 50;
            }
            return volume;
        }
        return null;
    }
}


module.exports = SpeakerManager;
