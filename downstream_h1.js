const EventEmitter = require("events");
const util = require('util');
const request = require("request");
const config = require("./config.js").getAll();
const Readable = require('stream').Readable;
const fs = require('fs');
const Dicer = require('dicer');
const BufferManager = require("./wakeup/buffermanager").BufferManager;

function DownStream(options={}) {
    EventEmitter.call(this);
    this.options=options;
    this.init();
}

DownStream.prototype.isConnected = function() {
    return this.state == "connected";
};

DownStream.prototype.init = function() {
    let options=this.options;
    var self = this;
    if (this.req) {
        this.req.abort();
    }
    this.state = "connecting";
    console.log(config.oauth_token);
    var logid = config.device_id + "_" + new Date().getTime() + "_monitor";
    console.log("downstream logid:" + logid);
	let url= config.schema + config.ip + config.directive_uri;
    let headers={
        "SAIYALOGID": logid,
        "Host": config.host,
        "Authorization": "Bearer " + config.oauth_token,
        "Dueros-Device-Id": config.device_id
    };

	if(options.url){
		url = options.url + (options.path?options.path:"");
	}
    if(options.headers){
        headers=Object.assign(headers,options.headers);
    }
    console.log("downstream url:"+url);
    this.req = request({
        "url":url,
        headers: headers,
    });
    this.req.on("error", () => {
        this.init();
    });
    var d = new Dicer({
        "boundary": ""
    });
    d.on('error', () => {
        console.log('downstream dicer error, no multi part in downstream!!!!!!!!');
        this.init();
    });
    this.req.on('response', (response) => {
        this.state = "connected";
        console.log("downstream created!");
        this.emit("init", response);
        if (!response.headers['content-type']) {
            console.log(response.headers);
            throw new Error("server header error: no content-type");
        }
        var matches = response.headers['content-type'].match(/boundary=([^;]*)/);
        if (matches && matches[1]) {
            d.setBoundary(matches[1]);
        }
    });
    this.req.pipe(d);
    //content-type: multipart/form-data; boundary=___dumi_avs_xuejuntao___
    d.on('part', function(p) {
        //console.log("on part");
        var name = null;
        var jsonBody = new BufferManager();
        var response = null;
        p.on('header', function(header) {
            name = null;
            jsonBody.clear();
            response = null;
            if (header["content-disposition"]) {
                var matches;
                if (matches = header["content-disposition"][0].match(/name="?(\w+)"?/)) {
                    name = matches[1];
                }
            }
            if (header['content-id']) {
                var content_id = header["content-id"][0].replace(/[<>]/g, "");
                console.log("content_id:" + content_id);
                self.emit("content", content_id, p);
            }
        });
        p.on('data', function(data) {
                //console.log(name,data);
            if (name == "metadata") {
                jsonBody.add(data);
            }
        });
        p.on('end', function() {
            if (jsonBody) {
                //console.log(jsonBody);
                try {
                    response = JSON.parse(jsonBody.toBuffer().toString("utf8"));
                } catch (e) {}
                if (response) {
                    self.emit("directive", response);
                }
            }
            console.log(JSON.stringify(response, null, '  '));
        });
        p.on('error', () => {
            console.log('downstream dicer error, event part error');
        });
    });
    d.on('finish', function() {
        console.log('End of parts');
    });

}
util.inherits(DownStream, EventEmitter);
module.exports = DownStream;
