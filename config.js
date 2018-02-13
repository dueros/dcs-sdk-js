const fs = require("fs");

function cloneObject(object) {
    return JSON.parse(JSON.stringify(object));
}
const storageFilename = "storage.json"

var default_config;
if (fs.existsSync(__dirname + "/dcs_config.js")) {
    default_config = require("./dcs_config");
} else {
    default_config = require("./dcs_config.json");
}
default_config = cloneObject(default_config);
var config = default_config;
var storage = {};

if (fs.existsSync(__dirname + "/" + storageFilename)) {
    storage = require("./" + storageFilename);
    if (storage) {
        config = Object.assign(config, storage);
    }
}

//if(fs.existsSync(__dirname+"/dcs_config.js")){
//    fs.writeFileSync(__dirname+"/dcs_config.json", JSON.stringify(config,null,2));
//}


module.exports = {
    get: function(key) {
        return config[key];
    },
    getAll: function() {
        return config;
    },
    set: function(key, value) {
        config[key] = value;
        if (value === null) {
            delete(config[key]);
        }
    },
    setAll: function(options) {
        config = Object.assign(config, options);
    },
    save: function(key, value) {
        this.set(key, value);
        storage[key] = value;
        if (value === null) {
            delete(storage[key]);
        }
        fs.writeFileSync(__dirname + "/" + storageFilename, JSON.stringify(storage));
    }
};