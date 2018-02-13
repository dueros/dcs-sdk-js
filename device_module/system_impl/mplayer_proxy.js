const http = require('http');
const net = require('net');
const url = require('url');
const request = require("request");

// Create an HTTP tunneling proxy
const proxy = http.createServer((req, res) => {
    //console.log(req);
    //res.writeHead(200, { 'Content-Type': 'text/plain' });
    //res.end('okay');
    console.log("mplayer proxy url", req.url);
    let remote_req = request({
        url: req.url,
    });
    remote_req.on("response", (remote_res) => {
        remote_res.pipe(res);
    });
});
if (require.main === module) {
    proxy.listen(8765, "127.0.0.1", () => {
        console.log("player proxy created");
    });
}


module.exports = proxy;