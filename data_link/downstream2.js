///base on node built-in http module
const EventEmitter = require("events");
const util = require('util');
const path = require("path");
const ROOT_PATH = path.resolve(__dirname + "/..");
const config = require(ROOT_PATH + "/config.js").getAll();
const Readable = require('stream').Readable;
const http2 = require("http2");
const fs = require('fs');
const Dicer = require('dicer');
const BufferManager = require(ROOT_PATH + "/lib/buffermanager").BufferManager;

function sleep(sec) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, sec * 1000);
    });
}

class DownStream extends EventEmitter{

    constructor() {
        super();
        this.init();
    }



    //this.state: connecting/closed/connected

    isConnected() {
        return this.state == "connected";
    }


    async init () {
        if (this.state == "connecting") {
            return;
        }

        if (this.req) {
            try {
                this.req.close ? this.req.close() : this.req.rstWithCancel();
            } catch (e) {}
            this.req = null;
        }

        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            if (this.pingReq) {
                try {
                    this.pingReq.close ? this.pingReq.close() : this.pingReq.rstWithCancel();
                } catch (e) {}
                this.pingReq = null;
            }
        }

        if (this.http2session) {
            try {
                this.http2session.shutdown({
                    graceful: true
                });
            } catch (e) {}
            this.http2session = null;
            await new Promise((resolve, reject) => {
                setTimeout(resolve, 1000);
            });
        }
        console.log(config.oauth_token);
        console.log("https://" + config.ip);
        this.http2session = http2.connect("https://" + config.ip, {
            rejectUnauthorized: false
        });
        // this is not support on node.js v8.14
        //this.http2session.socket.setNoDelay(true);

        this.http2session.on("error", () => {
            this.state = "closed";
            console.log('downstream session error!!!!!!!!');
        });
        this.http2session.on("close", async () => {
            this.state = "closed";
            this.emit("sessionClosed");
            console.log('downstream session closed!!!!!!!!');
            await sleep(1);
            this.init();
        });
        let logid = config.device_id + "_" + new Date().getTime() + (parseInt(Math.random() * 100, 10)) + "_monitor";
        console.log("downstream logid:" + logid);
        this.req = this.http2session.request({
            ":path": config.directive_uri,
            "SAIYALOGID": logid,
            "authorization": "Bearer " + config.oauth_token,
            "Dueros-Device-Id": config.device_id
        });
        this.req.on("error", (e) => {
            console.log('downstream error!!!!!!!!' + e.toString());
        });
        this.req.on("streamClosed", () => {
            this.emit("streamClosed");
            console.log('downstream closed');
            try {
                this.http2session.destroy();
            } catch (e) {}
        });
        this.http2session.setTimeout(0, () => {
            console.log("downstream session timeout");
        });
        this.req.setTimeout(0, () => {
            console.log("downstream stream timeout");
        });
        this.state = "connecting";
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        this.pingInterval = setInterval(() => {
            if (!this.http2session || this.http2session.aborted || this.http2session.destroyed) {
                console.log('downstream ping error, stream closed');
                if (this.pingInterval) {
                    clearInterval(this.pingInterval);
                }
                return;
            }
            let req = this.pingReq = this.http2session.request({
                ":path": config.ping_uri,
                "authorization": "Bearer " + config.oauth_token,
                "Dueros-Device-Id": config.device_id
            });
            req.setTimeout(5000, () => {
                console.log("downstream ping timeout");
                if (!req.destroyed) {
                    req.close ? req.close() : req.rstWithCancel();
                }
                if (this.req && !this.req.destroyed) {
                    this.req.close ? this.req.close() : this.req.rstWithCancel();
                }
            });
            req.on("response", (headers) => {
                //console.log(headers[':status']);
                if (headers[':status'] != 200) {
                    console.log("ping status error!!", headers);
                    //this.init();
                }
            });
            setTimeout(() => {
                if (!req.destroyed) {
                    req.close ? req.close() : req.rstWithCancel();
                }
            }, 5000);
            req.on("error", (e) => {
                console.log('downstream ping error!!!!!!!!' + e.toString());
                //this.init();
            });
        }, 5000);
        let d = this.dicer = new Dicer({
            "boundary": ""
        });
        d.on('error', () => {
            console.log('downstream dicer error, no multi part in downstream!!!!!!!!');
        });
        this.req.on('response', (headers) => {
            if (!this.req) {
                return;
            }
            this.state = "connected";
            console.log("downstream created!");
            this.emit("init");
            if (!headers['content-type']) {
                console.log(headers);
                throw new Error("server header error: no content-type");
            }
            let matches = headers['content-type'].match(/boundary=([^;]*)/);
            if (matches && matches[1]) {
                d.setBoundary(matches[1]);
            }
            this.req.on("data", (data) => {
                //console.log(data.toString());
            });
            let rWrap = new Readable().wrap(this.req);
            rWrap.pipe(fs.createWriteStream(ROOT_PATH + "/tmp/ds" + logid, {
                flags: 'w',
                defaultEncoding: 'binary',
                autoClose: true
            }));
            rWrap.pipe(d);
        });
        //content-type: multipart/form-data; boundary=___dumi_avs_xuejuntao___
        d.on('part', (p)=> {
            //console.log("on part");
            let name = null;
            let jsonBody = new BufferManager();
            let response = null;
            p.on('header', (header)=> {
                name = null;
                jsonBody.clear();
                response = null;
                //console.log(JSON.stringify(header, null, '  '));
                if (header["content-disposition"]) {
                    let matches;
                    if (matches = header["content-disposition"][0].match(/name="(\w+)"/)) {
                        name = matches[1];
                    }
                }
                if (header['content-id']) {
                    let content_id = header["content-id"][0].replace(/[<>]/g, "");
                    //console.log("content_id:"+content_id);
                    this.emit("content", content_id, p);
                }
            });
            p.on('data', (data)=> {
                if (name == "metadata") {
                    jsonBody.add(data);
                }
            });
            p.on('end', ()=> {
                if (jsonBody) {
                    try {
                        response = JSON.parse(jsonBody.toBuffer().toString("utf8"));
                    } catch (e) {}
                    if (response) {
                        this.emit("directive", response);
                    }
                }
                //console.log(JSON.stringify(response, null, '  '));
            });
            p.on('error', () => {
                console.log('downstream dicer error, event part error');
            });
        });
        d.on('finish', function() {
            //console.log('End of parts');
        });

    }
}

module.exports = DownStream;
