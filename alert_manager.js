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
const fs = require('fs');
const DcsProtocol = require("./dcs_protocol");
const config = require("./config").getAll();
const child_process = require("child_process");

function AlertManager(controller) {
    this.dcs_controller = controller;
    setInterval(() => {
        this.notify();
    }, 1000);
    //},60000);
    var fname = __dirname + "/alerts.json";
    this.alertsData = [];
    if (fs.existsSync(fname)) {
        try {
            this.alertsData = JSON.parse(fs.readFileSync(fname));
        } catch (e) {
            this.alertsData = [];
        }
    }
    process.on("beforeExit", () => {
        this.save();
    });

    this.on("playend", (token) => {
        controller.emit("event", DcsProtocol.createEvent(this.NAMESPACE, "AlertStopped", controller.getContext(), {
            token: token
        }));

    });

    this.handlers = {
        "SetAlert": function(directive) {
            this.setAlert({
                token: directive.payload.token,
                type: directive.payload.type,
                time: new Date(directive.payload.scheduledTime).getTime(),
                notify: false,
                payload: directive.payload
            });
            controller.emit("event", DcsProtocol.createEvent(this.NAMESPACE, "SetAlertSucceeded", controller.getContext(), {
                token: directive.payload.token
            }));
        },
        "DeleteAlert": function(directive) {
            this.alertsData = this.alertsData.filter(_alertData => directive.payload.token != _alertData.token);

            controller.emit("event", DcsProtocol.createEvent(this.NAMESPACE, "DeleteAlertSucceeded", controller.getContext(), {
                token: directive.payload.token
            }));
        }
    };
}
util.inherits(AlertManager, BaseManager);
AlertManager.prototype.NAMESPACE = "ai.dueros.device_interface.alerts";

AlertManager.prototype.save = function() {
    if (this.alertsData) {
        fs.writeFileSync(__dirname + "/alerts.json", JSON.stringify(this.alertsData, null, 2));
    }
};

AlertManager.prototype.getAllAlerts = function() {
    return this.alertsData.slice(0);
};

AlertManager.prototype.setAlert = function(alertData) {
    this.alertsData = this.alertsData.filter(_alertData => {
        return (alertData.token != _alertData.token) && (_alertData.notify === false)
    });
    var nowTime = new Date().getTime();

    if (nowTime < alertData.time) {
        this.alertsData.push(alertData);
        this.save();
    } else {
        console.log("can't set alert before now");
    }
};

AlertManager.prototype.getContext = function() {
    function convertAlert(alertData) {
        var date = new Date();
        date.setTime(alertData.time);
        return {
            "token": alertData.token,
            "type": alertData.type,
            "scheduledTime": date.toISOString()
        };
    }
    let allAlerts = this.alertsData.filter((a) => {
        return a && a.notify === false;
    }).map((alertData) => {
        return convertAlert(alertData);
    });
    let activeAlerts = [];
    if (this.activeAlertData) {
        activeAlerts.push(convertAlert(this.activeAlertData));
    }
    return {
        "header": {
            "namespace": this.NAMESPACE,
            "name": "AlertState"
        },
        "payload": {
            "allAlerts": allAlerts,
            "activeAlerts": activeAlerts
        }
    };

};
AlertManager.prototype.play = function(alertData) {
    let play_params = '-t wav alert.wav repeat 30';
    this.stop();
    this.activeAlertData = alertData;
    this.player_process = child_process.spawn(config.play_cmd, play_params.split(" "));
    this.player_process.on("close", () => {
        console.log("alert play end!\n");
        this.player_process = null;
        this.emit("playend", alertData.token);
    });

};
AlertManager.prototype.stop = function() {
    if (this.player_process) {
        this.player_process.kill("SIGKILL");
        this.player_process = null;
        this.activeAlertData = null;
    }
};
AlertManager.prototype.isActive = function() {
    return !!this.player_process;
};
AlertManager.prototype.notify = function() {
    //console.log(this.alertsData);
    this.alertsData.forEach(_alertData => {
        var nowTime = new Date().getTime();
        if (nowTime > _alertData.time && !_alertData.notify) {
            _alertData.notify = true;
            this.save();
            this.play(_alertData);
            this.dcs_controller.emit("event", DcsProtocol.createEvent(this.NAMESPACE, "AlertStarted", this.dcs_controller.getContext(), {
                token: _alertData.token
            }));
        }
    });
};
AlertManager.prototype.handleDirective = function(directive, controller) {

    if (directive.header.namespace != this.NAMESPACE) {
        return;
    }

    var name = directive.header.name;
    if (this.handlers[name]) {
        this.handlers[name].call(this, directive, controller);
    }
}

module.exports = AlertManager;