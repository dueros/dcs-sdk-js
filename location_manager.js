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
const child_process = require('child_process');
const DcsProtocol = require("./dcs_protocol");

function LocationManager() {
    this.loc = {
        "longitude": 0,
        "latitude": 0,
        "geoCoordinateSystem": "WGS84"
    };
    this.handlers = {};
}
util.inherits(LocationManager, BaseManager);
LocationManager.prototype.NAMESPACE = "ai.dueros.device_interface.location";
LocationManager.prototype.getContext = function() {
    if (!this.loc) {
        return;
    }
    return {
        "header": {
            "namespace": this.NAMESPACE,
            "name": "GpsState"
        },
        "payload": {
            "longitude": this.loc.longitude,
            "latitude": this.loc.latitude,
            "geoCoordinateSystem": this.loc.geoCoordinateSystem
        }
    };
};
LocationManager.prototype.setLocation = function(loc) {
    if (loc.longitude && loc.latitude) {
        if (!loc.geoCoordinateSystem) {
            loc.geoCoordinateSystem = "WGS84";
        }
        this.loc = loc;
    }
    //"longitude": {{DOUBLE}},
    //"latitude": {{DOUBLE}},
    //"geoCoordinateSystem": "{{STRING}}"
};

LocationManager.prototype.handleDirective = function(directive, controller) {
    if (directive.header.namespace != this.NAMESPACE) {
        return;
    }
    //NONE
}

module.exports = LocationManager;