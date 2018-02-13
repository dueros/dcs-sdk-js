const path = require("path");
const ROOT_PATH = path.resolve(__dirname+"/..");

const config = require(ROOT_PATH+"/config.js").getAll();

var DownStream;

function version_compare(v1, v2) {
    let tmp1 = v1.replace(/^[a-zA-Z]+/, '').split(".");
    let tmp2 = v2.replace(/^[a-zA-Z]+/, '').split(".");
    for (let i = 0; i < Math.min(tmp1.length, tmp2.length); i++) {
        let t1 = parseInt(tmp1[i], 10);
        let t2 = parseInt(tmp2[i], 10);
        if (t1 < t2) {
            return -1;
        }
        if (t1 > t2) {
            return 1;
        }
    }
    return 0;

}
if (config.downstream_protocol == "http2") {
    if (version_compare(process.version, "v8.8.0") == -1) {
        DownStream = require("./downstream");
    } else {
        console.log("use node built in http2 module");
        DownStream = require("./downstream2");
    }
} else {
    DownStream = require("./downstream_h1");
}

module.exports = DownStream;
